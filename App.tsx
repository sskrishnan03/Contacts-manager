

import React, { useState, useEffect, useCallback, useMemo, useRef, lazy, Suspense } from 'react';
import { Page, Theme, Contact, DisplaySettings, ActivityType, ActivityLog, ChatMessage, ChatSession, BackupData, CalendarEvent } from './types';
import BottomNav from './components/Sidebar';
import { loadContacts, saveContacts, loadTheme, saveTheme, loadDisplaySettings, saveDisplaySettings, loadChatSessions, saveChatSessions, migrateContacts, loadCalendarEvents, saveCalendarEvents } from './database';
import AIAssistant from './components/AIAssistant';
import { useHistoryState } from './hooks/useHistoryState';
import ContactDetailPage from './components/ContactDetailPage';
import LinkContactsModal from './components/LinkContactsModal';

const DashboardPage = lazy(() => import('./components/Dashboard'));
const ContactsPage = lazy(() => import('./components/ContactsPage'));
const SettingsPage = lazy(() => import('./components/SettingsPage'));
const ContactModal = lazy(() => import('./components/ContactModal'));
const EventModal = lazy(() => import('./components/EventModal'));


interface GroqTool {
  type: 'function';
  function: {
    name: string;
    description: string;
    parameters: Record<string, any>;
  };
}

const tools: GroqTool[] = [
  {
    type: 'function',
    function: {
      name: 'addContact',
      description: "Adds a new contact to the user's contact list. Gathers the contact's first name, last name, and phone number. First name, last name, and phone number are all required.",
      parameters: {
        type: 'object',
        properties: {
          firstName: { type: 'string', description: "The contact's first name." },
          lastName: { type: 'string', description: "The contact's last name." },
          phone: { type: 'string', description: "The contact's primary phone number. This is a required field." },
          email: { type: 'string', description: "The contact's primary email address. This is an optional field." },
        },
        required: ['firstName', 'lastName', 'phone'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'removeContact',
      description: "Removes or deletes a contact from the user's list by moving them to the trash. Requires the contact's full name to identify them.",
      parameters: {
        type: 'object',
        properties: {
          firstName: { type: 'string', description: "The first name of the contact to remove." },
          lastName: { type: 'string', description: "The last name of the contact to remove." },
        },
        required: ['firstName', 'lastName'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'getContactSummary',
      description: "Gets a summary of the user's contacts, including total counts for active, archived, blocked, and favorite contacts.",
      parameters: { type: 'object', properties: {} },
    },
  },
  {
    type: 'function',
    function: {
      name: 'findContacts',
      description: "Finds and lists contacts based on specified criteria like name, tag, or favorite status.",
      parameters: {
        type: 'object',
        properties: {
          name: { type: 'string', description: "The name (or partial name) of the contact to search for." },
          tag: { type: 'string', description: "A specific tag to filter contacts by." },
          isFavorite: { type: 'boolean', description: "Set to true to list only favorite contacts." },
        },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'getApplicationSettings',
      description: "Retrieves the current application settings, such as the visual theme (light/dark) and contact list display preferences.",
      parameters: { type: 'object', properties: {} },
    },
  },
  {
    type: 'function',
    function: {
      name: 'navigateToPage',
      description: "Navigates the user to a different page within the application.",
      parameters: {
        type: 'object',
        properties: {
          page: { type: 'string', description: "The destination page. Must be one of: 'dashboard', 'contacts', 'settings'." },
        },
        required: ['page'],
      },
    },
  },
];

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const GROQ_MODEL = 'llama-3.3-70b-versatile';

async function callGroq(messages: { role: string; content: string | null; tool_calls?: any[]; tool_call_id?: string }[], toolsList?: GroqTool[]): Promise<any> {
  const response = await fetch(GROQ_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.API_KEY}`,
    },
    body: JSON.stringify({
      model: GROQ_MODEL,
      messages,
      tools: toolsList?.length ? toolsList : undefined,
      tool_choice: toolsList?.length ? 'auto' : undefined,
    }),
  });
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Groq API error: ${response.status} ${errorText}`);
  }
  return response.json();
}

const SYSTEM_INSTRUCTION = `You are a helpful AI assistant integrated into a 'Contacts Manager' application. Your role is to help users manage their contacts and navigate the app by answering questions and performing actions.
- You can add new contacts for the user. Always ask for first name, last name, and phone number.
- You can remove contacts. You must ask for the contact's full name to confirm the deletion.
- You can answer questions about the user's contacts (e.g., 'how many contacts?', 'find Jane Doe', 'who are my favorites?').
- You can answer questions about the app's settings (e.g., 'is dark mode on?').
- You can navigate the user to different pages (e.g., 'go to dashboard', 'show me the settings').
- Use the functions available to you to get the information you need.
- Be friendly, conversational, and confirm actions you've taken. If you find contacts, list their names. If you navigate, tell the user where you are taking them.`;

const LoadingSpinner: React.FC = () => (
    <div className="w-full h-full flex items-center justify-center text-text p-8">
        <div className="flex items-center space-x-4">
            <svg className="animate-spin h-8 w-8 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span className="text-xl font-semibold">Loading...</span>
        </div>
    </div>
);


const App: React.FC = () => {
    const [isLoading, setIsLoading] = useState(true);
    const [theme, setTheme] = useState<Theme>('dark');
    const [currentPage, setCurrentPage] = useState<Page>('dashboard');
    const { 
        state: contacts, 
        set: setContacts, 
        undo, 
        redo, 
        canUndo, 
        canRedo,
        setInitial: setInitialContacts,
        clearHistory,
    } = useHistoryState<Contact[]>([]);
    
    const [selectedContactId, setSelectedContactId] = useState<string | null>(null);
    const [isContactModalOpen, setContactModalOpen] = useState(false);
    const [contactToEdit, setContactToEdit] = useState<Contact | null>(null);

    const [isEventModalOpen, setEventModalOpen] = useState(false);
    const [eventToEdit, setEventToEdit] = useState<CalendarEvent | null>(null);
    const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([]);
    const [isLinkModalOpen, setLinkModalOpen] = useState(false);


    const [displaySettings, setDisplaySettings] = useState<DisplaySettings>({
        showProfilePictures: true,
        showContactNumber: true,
        showOnlyWithNumbers: false,
    });
    
    // AI Chat State
    const [isChatOpen, setIsChatOpen] = useState(false);
    const [chatSessions, setChatSessions] = useState<ChatSession[]>([]);
    const [activeChatSessionId, setActiveChatSessionId] = useState<string | null>(null);
    const [isChatLoading, setIsChatLoading] = useState(false);


     const addContact = useCallback((contactData: Omit<Contact, 'id' | 'createdAt'>) => {
        const newContact: Contact = { ...contactData, id: Date.now().toString(), createdAt: new Date().toISOString(), activityLog: [] };
        setContacts(prev => [newContact, ...prev], `Added ${contactData.firstName} ${contactData.lastName}`);
    }, [setContacts]);

    const addEvent = useCallback((eventData: Omit<CalendarEvent, 'id' | 'createdAt'>) => {
        const newEvent: CalendarEvent = { ...eventData, id: Date.now().toString(), createdAt: new Date().toISOString() };
        setCalendarEvents(prev => [...prev, newEvent]);
    }, []);

    const updateEvent = useCallback((updatedEvent: CalendarEvent) => {
        setCalendarEvents(prev => prev.map(e => e.id === updatedEvent.id ? updatedEvent : e));
    }, []);

    const deleteEvent = useCallback((eventId: string) => {
        setCalendarEvents(prev => prev.filter(e => e.id !== eventId));
    }, []);


    useEffect(() => {
        const loadInitialData = async () => {
            try {
                const [loadedContacts, loadedTheme, loadedSettings, loadedChatSessions, loadedEvents] = await Promise.all([
                    loadContacts(),
                    loadTheme(),
                    loadDisplaySettings(),
                    loadChatSessions(),
                    loadCalendarEvents(),
                ]);
                setInitialContacts(loadedContacts, 'Loaded contacts from database');
                setCalendarEvents(loadedEvents);
                setTheme(loadedTheme);
                setDisplaySettings(loadedSettings);

                if (loadedChatSessions.length > 0) {
                    setChatSessions(loadedChatSessions);
                    setActiveChatSessionId(loadedChatSessions[0].id);
                } else {
                    setChatSessions([]);
                    setActiveChatSessionId(null); // Start in "New Chat" mode
                }

            } catch (error) {
                console.error("Failed to load initial data from the database", error);
            } finally {
                setIsLoading(false);
            }
        };

        loadInitialData();
    }, [setInitialContacts]);

    useEffect(() => {
        if (!isLoading) {
            document.documentElement.classList.toggle('dark', theme === 'dark');
            saveTheme(theme);
        }
    }, [theme, isLoading]);
    
    useEffect(() => {
        if (!isLoading) {
            saveContacts(contacts);
        }
    }, [contacts, isLoading]);

    useEffect(() => {
        if (!isLoading) {
            saveCalendarEvents(calendarEvents);
        }
    }, [calendarEvents, isLoading]);

    useEffect(() => {
        if (!isLoading) {
            saveDisplaySettings(displaySettings);
        }
    }, [displaySettings, isLoading]);

    useEffect(() => {
        if (!isLoading) {
            saveChatSessions(chatSessions);
        }
    }, [chatSessions, isLoading]);

    useEffect(() => {
        if (currentPage !== 'contacts' && selectedContactId) {
            // Don't close detail view when switching pages
        }
    }, [currentPage, selectedContactId]);




    const toggleTheme = () => setTheme(prev => (prev === 'light' ? 'dark' : 'light'));
    
    const activeContacts = useMemo(() => contacts.filter(c => !c.isArchived && !c.isBlocked && !c.deletedAt), [contacts]);
    const archivedContacts = useMemo(() => contacts.filter(c => c.isArchived && !c.deletedAt), [contacts]);
    const blockedContacts = useMemo(() => contacts.filter(c => c.isBlocked && !c.deletedAt), [contacts]);
    const trashContacts = useMemo(() => contacts.filter(c => c.deletedAt), [contacts]);
    const selectedContact = useMemo(() => contacts.find(c => c.id === selectedContactId), [contacts, selectedContactId]);

    const updateContact = useCallback((updatedContact: Contact) => {
        setContacts(prev => prev.map(c => c.id === updatedContact.id ? updatedContact : c), `Updated ${updatedContact.firstName} ${updatedContact.lastName}`);
    }, [setContacts]);
    
    const handleSaveContact = (contactData: Omit<Contact, 'id' | 'createdAt'>) => {
        if (contactToEdit) {
            updateContact({ ...contactToEdit, ...contactData });
        } else {
            addContact(contactData);
        }
        setContactModalOpen(false);
    };

    const handleSaveEvent = (eventData: Omit<CalendarEvent, 'id' | 'createdAt'>) => {
        if (eventToEdit) {
            updateEvent({ ...eventToEdit, ...eventData });
        } else {
            addEvent(eventData);
        }
        setEventModalOpen(false);
    }
    
    const moveContactsToTrash = useCallback((contactIds: string[]) => {
        const contactsToTrash = contacts.filter(c => contactIds.includes(c.id));
        if (contactsToTrash.length === 0) return;

        const label = contactsToTrash.length > 1
            ? `Moved ${contactsToTrash.length} contacts to trash`
            : `Moved ${contactsToTrash[0].firstName} ${contactsToTrash[0].lastName} to trash`;

        setContacts(prev => prev.map(c =>
            contactIds.includes(c.id) ? { ...c, deletedAt: new Date().toISOString() } : c
        ), label);
        
        if (selectedContactId && contactIds.includes(selectedContactId)) {
            setSelectedContactId(null);
        }
    }, [selectedContactId, setContacts, contacts]);


    const restoreContactFromTrash = useCallback((contactId: string) => {
        const contact = contacts.find(c => c.id === contactId);
        setContacts(prev => prev.map(c => c.id === contactId ? { ...c, deletedAt: undefined } : c), `Restored ${contact?.firstName || 'contact'}`);
    }, [setContacts, contacts]);

    const deleteContactPermanently = useCallback((contactId: string) => {
        const contact = contacts.find(c => c.id === contactId);
        setContacts(prev => prev.filter(c => c.id !== contactId), `Permanently deleted ${contact?.firstName || 'contact'}`);
    }, [setContacts, contacts]);

    const toggleArchiveContact = useCallback((contactId: string, archive: boolean) => {
        const contact = contacts.find(c => c.id === contactId);
        setContacts(prev => prev.map(c => c.id === contactId ? { ...c, isArchived: archive, isBlocked: false } : c), archive ? `Archived ${contact?.firstName || 'contact'}` : `Unarchived ${contact?.firstName || 'contact'}`);
        if (archive && selectedContactId === contactId) setSelectedContactId(null);
    }, [selectedContactId, setContacts, contacts]);

    const toggleBlockContact = useCallback((contactId: string, block: boolean) => {
        const contact = contacts.find(c => c.id === contactId);
        setContacts(prev => prev.map(c => c.id === contactId ? { ...c, isBlocked: block, isArchived: false } : c), block ? `Blocked ${contact?.firstName || 'contact'}` : `Unblocked ${contact?.firstName || 'contact'}`);
        if (block && selectedContactId === contactId) setSelectedContactId(null);
    }, [selectedContactId, setContacts, contacts]);
    
    const logActivity = useCallback((contactId: string, type: ActivityType, notes?: string) => {
        setContacts(prev => prev.map(c => {
            if (c.id === contactId) {
                const newLog: ActivityLog = { id: Date.now().toString(), type, timestamp: new Date().toISOString(), notes };
                const updatedLogs = [newLog, ...(c.activityLog || [])];
                return { ...c, activityLog: updatedLogs };
            }
            return c;
        }), `Logged ${type.replace('_', ' ')} for contact`);
    }, [setContacts]);

    const handleMergeContacts = useCallback((contactToKeep: Contact, idsToRemove: string[]) => {
        setContacts(prev => {
            const filtered = prev.filter(c => !idsToRemove.includes(c.id));
            return filtered.map(c => c.id === contactToKeep.id ? contactToKeep : c);
        }, `Merged ${idsToRemove.length + 1} contacts`);
    }, [setContacts]);

    const handleLinkContacts = useCallback((sourceId: string, targetIds: string[]) => {
        setContacts(prev => {
            const contactsMap = new Map(prev.map(c => [c.id, { ...c }]));
            const sourceContact = contactsMap.get(sourceId) as Contact | undefined;
            if (!sourceContact) return prev;

            if (!sourceContact.linkedContactIds) sourceContact.linkedContactIds = [];

            targetIds.forEach(targetId => {
                if (!sourceContact.linkedContactIds?.includes(targetId)) {
                    sourceContact.linkedContactIds?.push(targetId);
                }
                
                const targetContact = contactsMap.get(targetId) as Contact | undefined;
                if (targetContact) {
                    if (!targetContact.linkedContactIds) targetContact.linkedContactIds = [];
                    if (!targetContact.linkedContactIds.includes(sourceId)) {
                        targetContact.linkedContactIds.push(sourceId);
                    }
                }
            });

            return Array.from(contactsMap.values());
        }, `Linked ${targetIds.length} contact(s)`);
    }, [setContacts]);

    const handleUnlinkContact = useCallback((sourceId: string, targetId: string) => {
        setContacts(prev => {
            return prev.map(contact => {
                if (contact.id === sourceId) {
                    return {
                        ...contact,
                        linkedContactIds: contact.linkedContactIds?.filter(id => id !== targetId)
                    };
                }
                if (contact.id === targetId) {
                     return {
                        ...contact,
                        linkedContactIds: contact.linkedContactIds?.filter(id => id !== sourceId)
                    };
                }
                return contact;
            });
        }, 'Unlinked contact');
    }, [setContacts]);

    const openAddContactModal = () => {
        setContactToEdit(null);
        setContactModalOpen(true);
    };

    const openAddEventModal = () => {
        setEventToEdit(null);
        setEventModalOpen(true);
    };
    
    const openEditContactModal = (contact: Contact) => {
        setContactToEdit(contact);
        setContactModalOpen(true);
    };

    const openEditEventModal = (event: CalendarEvent) => {
        setEventToEdit(event);
        setEventModalOpen(true);
    };

    const handleGlobalAdd = () => {
        openAddContactModal();
    };

    const handleSelectContact = (id: string) => {
        setSelectedContactId(id);
    };
    
    const handleNewChat = () => {
        setActiveChatSessionId(null);
    };

    const handleDeleteChat = (sessionId: string) => {
        setChatSessions(prev => {
            const newSessions = prev.filter(s => s.id !== sessionId);
            if (activeChatSessionId === sessionId) {
                setActiveChatSessionId(newSessions[0]?.id || null);
            }
            return newSessions;
        });
    };

    const handleRenameChat = (sessionId: string, newTitle: string) => {
        setChatSessions(prev => prev.map(s => s.id === sessionId ? { ...s, title: newTitle } : s));
    };

    const activeChatMessages = useMemo(() => {
        if (activeChatSessionId === null) {
            return [{ role: 'model', content: "Hello! How can I help you manage your contacts today? You can ask me to add a new contact, find someone, or take you to a specific page." }] as ChatMessage[];
        }
        return chatSessions.find(s => s.id === activeChatSessionId)?.messages || [];
    }, [chatSessions, activeChatSessionId]);

    const handleSendChatMessage = async (message: string) => {
        if (!process.env.API_KEY) {
            const errorMessage: ChatMessage = { role: 'error', content: "Groq API key is not configured. Add GROQ_API_KEY to your .env file." };
            setChatSessions(prev => prev.map(s => s.id === activeChatSessionId ? { ...s, messages: [...s.messages, errorMessage] } : s));
            return;
        }

        let currentSessionId = activeChatSessionId;
        let sessionMessages: ChatMessage[] = [];

        if (currentSessionId === null) {
            const newSession: ChatSession = {
                id: Date.now().toString(),
                title: message.substring(0, 40) + (message.length > 40 ? '...' : ''),
                createdAt: new Date().toISOString(),
                messages: [
                    { role: 'model', content: "Hello! How can I help you manage your contacts today? You can ask me to add a new contact, find someone, or take you to a specific page." },
                    { role: 'user', content: message }
                ]
            };
            setChatSessions(prev => [newSession, ...prev]);
            setActiveChatSessionId(newSession.id);
            currentSessionId = newSession.id;
            sessionMessages = newSession.messages;
        } else {
            const session = chatSessions.find(s => s.id === currentSessionId);
            if (!session) return;
            sessionMessages = [...session.messages, { role: 'user', content: message }];
            setChatSessions(prev => prev.map(s => s.id === currentSessionId ? { ...s, messages: [...s.messages, { role: 'user', content: message }] } : s));
        }

        setIsChatLoading(true);

        try {
            const groqMessages: { role: string; content: string | null }[] = [
                { role: 'system', content: SYSTEM_INSTRUCTION },
            ];

            for (const msg of sessionMessages.slice(1)) {
                if (msg.role === 'user') {
                    groqMessages.push({ role: 'user', content: msg.content });
                } else if (msg.role === 'model') {
                    groqMessages.push({ role: 'assistant', content: msg.content });
                }
            }

            let response = await callGroq(groqMessages, tools);
            let choice = response.choices?.[0]?.message;

            while (choice?.tool_calls?.length > 0) {
                const toolResponses: { role: string; tool_call_id: string; content: string }[] = [];

                for (const toolCall of choice.tool_calls) {
                    const args = JSON.parse(toolCall.function.arguments);
                    let result: any;

                    switch (toolCall.function.name) {
                        case 'addContact': {
                            const { firstName, lastName, phone, email } = args;
                            if (!firstName || !lastName || !phone) {
                                result = "Missing required arguments. I need a first name, last name, and phone number.";
                            } else {
                                addContact({
                                    firstName, lastName,
                                    phones: phone ? [{ label: 'mobile', value: phone }] : [],
                                    emails: email ? [{ label: 'personal', value: email }] : [],
                                    isFavorite: false, tags: [],
                                });
                                result = `Successfully added contact for ${firstName} ${lastName}.`;
                            }
                            break;
                        }
                        case 'removeContact': {
                            const { firstName, lastName } = args;
                            const fullNameLower = `${firstName} ${lastName}`.toLowerCase();
                            const matchingContacts = activeContacts.filter(c => `${c.firstName} ${c.lastName}`.toLowerCase() === fullNameLower);
                            if (matchingContacts.length === 1) {
                                moveContactsToTrash([matchingContacts[0].id]);
                                result = `Successfully moved contact ${firstName} ${lastName} to the trash.`;
                            } else if (matchingContacts.length > 1) {
                                result = `Found multiple contacts named ${firstName} ${lastName}. Please remove them manually for safety.`;
                            } else {
                                result = `Could not find an active contact named ${firstName} ${lastName}.`;
                            }
                            break;
                        }
                        case 'getContactSummary': {
                            result = {
                                active: activeContacts.length,
                                archived: archivedContacts.length,
                                blocked: blockedContacts.length,
                                trash: trashContacts.length,
                                favorites: contacts.filter(c => c.isFavorite).length
                            };
                            break;
                        }
                        case 'findContacts': {
                            const { name, tag, isFavorite } = args;
                            let filtered = activeContacts;
                            if (name) filtered = filtered.filter(c => `${c.firstName} ${c.lastName}`.toLowerCase().includes((name as string).toLowerCase()));
                            if (tag) filtered = filtered.filter(c => c.tags.includes(tag as string));
                            if (isFavorite === true) filtered = filtered.filter(c => c.isFavorite);
                            result = filtered.length > 0
                                ? { contactsFound: filtered.map(c => `${c.firstName} ${c.lastName}`) }
                                : { contactsFound: [], message: "No contacts found matching the criteria." };
                            break;
                        }
                        case 'getApplicationSettings': {
                            result = {
                                theme: theme,
                                displaySettings: {
                                    showProfilePictures: displaySettings.showProfilePictures,
                                    showContactNumber: displaySettings.showContactNumber,
                                    showOnlyWithNumbers: displaySettings.showOnlyWithNumbers
                                }
                            };
                            break;
                        }
                        case 'navigateToPage': {
                            const { page } = args;
                            if (['dashboard', 'contacts', 'settings'].includes(page as string)) {
                                setCurrentPage(page as Page);
                                result = `Successfully navigated to the ${page} page.`;
                            } else {
                                result = `Could not navigate. The page '${page}' does not exist.`;
                            }
                            break;
                        }
                        default:
                            result = `Unknown function: ${toolCall.function.name}`;
                    }

                    toolResponses.push({
                        role: 'tool',
                        tool_call_id: toolCall.id,
                        content: JSON.stringify({ result }),
                    });
                }

                groqMessages.push(choice);
                groqMessages.push(...toolResponses);

                response = await callGroq(groqMessages, tools);
                choice = response.choices?.[0]?.message;
            }

            const modelText = choice?.content || '';
            const modelMessage: ChatMessage = { role: 'model', content: modelText };
            setChatSessions(prev => prev.map(s => s.id === currentSessionId ? { ...s, messages: [...s.messages, modelMessage] } : s));

        } catch (error: any) {
            console.error("Groq API error:", error);
            const errorDetail = error?.message || error?.toString() || "Unknown error";
            const errorMessage: ChatMessage = { role: 'error', content: `Groq API Error: ${errorDetail}` };
            setChatSessions(prev => prev.map(s => s.id === currentSessionId ? { ...s, messages: [...s.messages, errorMessage] } : s));
        } finally {
            setIsChatLoading(false);
        }
    };
    
    const handleOpenAIAssistant = () => {
        handleNewChat();
        setIsChatOpen(true);
    };
    
    const handleRestoreFromBackup = useCallback((backup: BackupData) => {
        try {
            if (!backup.version || backup.version !== 1 || !Array.isArray(backup.contacts) || !backup.theme || !backup.displaySettings || !Array.isArray(backup.chatSessions)) {
                alert('Invalid or corrupted backup file.');
                return;
            }

            const restoredContacts = migrateContacts(backup.contacts);
            setInitialContacts(restoredContacts, 'Restored from backup');
            setCalendarEvents(backup.calendarEvents || []);
            setTheme(backup.theme);
            setDisplaySettings(backup.displaySettings);
            setChatSessions(backup.chatSessions);
            setActiveChatSessionId(backup.chatSessions[0]?.id || null);
            setCurrentPage('contacts');
            alert('Restore successful!');
        } catch (e) {
            console.error("Failed to restore from backup", e);
            alert('An error occurred during restore.');
        }
    }, [setInitialContacts]);

    const renderPage = () => {
        switch (currentPage) {
            case 'dashboard':
                return <DashboardPage 
                          contacts={activeContacts}
                          events={calendarEvents}
                          onSelectContact={handleSelectContact}
                          onOpenAddModal={openAddEventModal}
                          onOpenEditModal={openEditEventModal}
                          onDeleteEvent={deleteEvent}
                       />;
            case 'contacts':
                return <ContactsPage 
                          contacts={activeContacts} 
                          updateContact={updateContact}
                          displaySettings={displaySettings}
                          selectedContactId={selectedContactId}
                          onSelectContact={setSelectedContactId}
                          onOpenAddModal={openAddContactModal}
                          onOpenEditModal={openEditContactModal}
                          onDelete={moveContactsToTrash}
                          onUndo={undo}
                          onRedo={redo}
                          canUndo={canUndo}
                          canRedo={canRedo}
                       />;
            case 'settings':
                return <SettingsPage 
                          settings={displaySettings}
                          setSettings={setDisplaySettings}
                          contacts={contacts}
                          setContacts={setContacts}
                          theme={theme}
                          toggleTheme={toggleTheme}
                          clearHistory={clearHistory}
                          archivedContacts={archivedContacts}
                          blockedContacts={blockedContacts}
                          trashContacts={trashContacts}
                          onUnarchive={id => toggleArchiveContact(id, false)}
                          onUnblock={id => toggleBlockContact(id, false)}
                          onRestore={restoreContactFromTrash}
                          onDeletePermanently={deleteContactPermanently}
                          onMergeContacts={handleMergeContacts}
                          chatSessions={chatSessions}
                          onRestoreFromBackup={handleRestoreFromBackup}
                          calendarEvents={calendarEvents}
                        />;
            default:
                return <ContactsPage 
                          contacts={activeContacts} 
                          updateContact={updateContact}
                          displaySettings={displaySettings}
                          selectedContactId={selectedContactId}
                          onSelectContact={setSelectedContactId}
                          onOpenAddModal={openAddContactModal}
                          onOpenEditModal={openEditContactModal}
                          onDelete={moveContactsToTrash}
                          onUndo={undo}
                          onRedo={redo}
                          canUndo={canUndo}
                          canRedo={canRedo}
                       />;
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center text-text">
                <div className="flex items-center space-x-4">
                    <svg className="animate-spin h-8 w-8 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span className="text-xl font-semibold">Loading your workspace...</span>
                </div>
            </div>
        );
    }
    
    return (
        <div className="min-h-screen bg-background text-text font-sans">
            <main className="w-full h-full pb-28">
                 <div key={currentPage} className="w-full h-full">
                    <Suspense fallback={<LoadingSpinner />}>
                        {renderPage()}
                    </Suspense>
                </div>
            </main>

            <BottomNav
                currentPage={currentPage}
                setCurrentPage={setCurrentPage}
                onAdd={handleGlobalAdd}
                onOpenAI={handleOpenAIAssistant}
            />
            
            <Suspense fallback={<div />}>
                {isContactModalOpen && <ContactModal 
                    isOpen={isContactModalOpen}
                    onClose={() => setContactModalOpen(false)}
                    onSave={handleSaveContact}
                    contactToEdit={contactToEdit}
                    onUpdateContact={updateContact}
                />}

                {isEventModalOpen && <EventModal
                    isOpen={isEventModalOpen}
                    onClose={() => setEventModalOpen(false)}
                    onSave={handleSaveEvent}
                    eventToEdit={eventToEdit}
                    contacts={contacts}
                />}
            </Suspense>

            <AIAssistant
                isOpen={isChatOpen}
                onClose={() => setIsChatOpen(false)}
                sessions={chatSessions}
                activeSessionId={activeChatSessionId}
                onSelectSession={setActiveChatSessionId}
                onNewChat={handleNewChat}
                onDeleteSession={handleDeleteChat}
                onRenameSession={handleRenameChat}
                messages={activeChatMessages}
                isLoading={isChatLoading}
                onSendMessage={handleSendChatMessage}
            />
            
            {selectedContact && (
                <div
                    onClick={() => setSelectedContactId(null)}
                    className="fixed inset-0 bg-black/20 backdrop-blur-sm z-30 animate-fade-in-up"
                    style={{ animationDuration: '0.3s' }}
                    aria-hidden="true"
                />
            )}

            <div className={`fixed top-0 right-0 h-full w-full lg:w-2/5 xl:w-1/3 bg-background border-l border-border shadow-2xl transform transition-transform duration-300 ease-in-out z-40 ${selectedContact ? 'translate-x-0' : 'translate-x-full'}`}>
                <ContactDetailPage
                    contact={selectedContact}
                    onClose={() => setSelectedContactId(null)}
                    onOpenEditModal={openEditContactModal}
                    onDelete={moveContactsToTrash}
                    onArchive={toggleArchiveContact}
                    onBlock={toggleBlockContact}
                    onLogActivity={logActivity}
                    allContacts={contacts}
                    onOpenLinkModal={() => setLinkModalOpen(true)}
                    onUnlinkContact={handleUnlinkContact}
                    onSelectContact={handleSelectContact}
                />
            </div>

            {selectedContact && (
                <LinkContactsModal
                    isOpen={isLinkModalOpen}
                    onClose={() => setLinkModalOpen(false)}
                    onSave={(idsToLink) => {
                        handleLinkContacts(selectedContact.id, idsToLink);
                        setLinkModalOpen(false);
                    }}
                    currentContact={selectedContact}
                    allContacts={contacts}
                />
            )}

        </div>
    );
};

export default App;
