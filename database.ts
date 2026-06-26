import { Contact, Theme, DisplaySettings, ChatSession, CalendarEvent } from './types';

// --- IndexedDB Setup ---
const DB_NAME = 'ContactManagerDB';
const DB_VERSION = 2; // Incremented version for new store
const STORES = {
    CONTACTS: 'contacts',
    SETTINGS: 'settings', // A key-value store for theme and display settings
    CHAT_SESSIONS: 'chat_sessions',
    CALENDAR_EVENTS: 'calendar_events',
};

let dbPromise: Promise<IDBDatabase> | null = null;

const initDB = (): Promise<IDBDatabase> => {
    if (dbPromise) {
        return dbPromise;
    }

    dbPromise = new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onerror = () => {
            console.error("IndexedDB error:", request.error);
            reject("IndexedDB error: " + request.error);
        };

        request.onsuccess = (event) => {
            resolve((event.target as IDBOpenDBRequest).result);
        };

        request.onupgradeneeded = (event) => {
            const db = (event.target as IDBOpenDBRequest).result;
            if (!db.objectStoreNames.contains(STORES.CONTACTS)) {
                db.createObjectStore(STORES.CONTACTS, { keyPath: 'id' });
            }
            if (!db.objectStoreNames.contains(STORES.SETTINGS)) {
                db.createObjectStore(STORES.SETTINGS);
            }
            if (!db.objectStoreNames.contains(STORES.CHAT_SESSIONS)) {
                db.createObjectStore(STORES.CHAT_SESSIONS, { keyPath: 'id' });
            }
            if (!db.objectStoreNames.contains(STORES.CALENDAR_EVENTS)) {
                db.createObjectStore(STORES.CALENDAR_EVENTS, { keyPath: 'id' });
            }
        };
    });
    return dbPromise;
};


// Data migration function to update old contact structures
// FIX: Exported migrateContacts function to make it available for import.
export const migrateContacts = (contacts: any[]): Contact[] => {
    return contacts.map(c => {
        const migrated: any = { ...c };
        
        // --- Schema Evolution ---
        // From single phone/email to labeled arrays
        if (!Array.isArray(migrated.phones)) {
            migrated.phones = migrated.phone ? [{ label: 'mobile', value: migrated.phone }] : [];
            migrated.emails = migrated.email ? [{ label: 'personal', value: migrated.email }] : [];
            migrated.tags = migrated.category ? [migrated.category] : [];
            delete migrated.phone;
            delete migrated.email;
            delete migrated.category;
        }

        // Initialize new arrays if they don't exist
        if (!Array.isArray(migrated.activityLog)) migrated.activityLog = [];
        if (!Array.isArray(migrated.linkedContactIds)) migrated.linkedContactIds = [];
        if (!Array.isArray(migrated.socialMediaLinks)) migrated.socialMediaLinks = [];

        // From boolean reminder to string setting
        if (typeof migrated.birthdayReminder === 'boolean') {
            migrated.reminderSetting = migrated.birthdayReminder ? '1_day' : 'none';
            delete migrated.birthdayReminder;
        } else if (!migrated.reminderSetting) {
            migrated.reminderSetting = 'none';
        }

        // From string address to structured address
        if (typeof migrated.address === 'string') {
            migrated.address = { street: migrated.address, city: '', state: '', country: '', zip: '' };
        } else if (!migrated.address) {
            migrated.address = { street: '', city: '', state: '', country: '', zip: '' };
        }

        // Initialize new optional string/object fields
        if (!migrated.nickname) migrated.nickname = '';
        if (!migrated.gender) migrated.gender = 'prefer_not_to_say';
        if (!migrated.website) migrated.website = '';
        if (!migrated.jobTitle) migrated.jobTitle = '';
        if (!migrated.group) migrated.group = '';
        if (migrated.isPrivate === undefined) migrated.isPrivate = false;

        return migrated as Contact;
    });
};

// --- Contacts ---
export const loadContacts = async (): Promise<Contact[]> => {
    try {
        const db = await initDB();
        const transaction = db.transaction(STORES.CONTACTS, 'readonly');
        const store = transaction.objectStore(STORES.CONTACTS);

        return new Promise((resolve, reject) => {
            const request = store.getAll();
            request.onsuccess = () => resolve(migrateContacts(request.result || []));
            request.onerror = () => {
                console.error("Failed to load contacts:", request.error);
                reject(request.error);
            };
        });
    } catch (error) {
        console.error("Failed to load contacts from database (IndexedDB)", error);
        return [];
    }
};

export const saveContacts = async (contacts: Contact[]): Promise<void> => {
    try {
        const db = await initDB();
        const transaction = db.transaction(STORES.CONTACTS, 'readwrite');
        const store = transaction.objectStore(STORES.CONTACTS);

        store.clear(); // Clear old contacts

        contacts.forEach(contact => {
            store.put(contact);
        });
        
        return new Promise((resolve, reject) => {
            transaction.oncomplete = () => resolve();
            transaction.onerror = () => {
                 console.error("Failed to save contacts transaction:", transaction.error);
                 reject(transaction.error);
            }
        });

    } catch (error) {
        console.error("Failed to save contacts to database (IndexedDB)", error);
    }
};

// --- Calendar Events ---
export const loadCalendarEvents = async (): Promise<CalendarEvent[]> => {
    try {
        const db = await initDB();
        const transaction = db.transaction(STORES.CALENDAR_EVENTS, 'readonly');
        const store = transaction.objectStore(STORES.CALENDAR_EVENTS);
        return new Promise((resolve, reject) => {
            const request = store.getAll();
            request.onsuccess = () => resolve(request.result || []);
            request.onerror = () => {
                console.error("Failed to load calendar events:", request.error);
                reject(request.error);
            };
        });
    } catch (error) {
        console.error("Failed to load calendar events from DB", error);
        return [];
    }
};

export const saveCalendarEvents = async (events: CalendarEvent[]): Promise<void> => {
    try {
        const db = await initDB();
        const transaction = db.transaction(STORES.CALENDAR_EVENTS, 'readwrite');
        const store = transaction.objectStore(STORES.CALENDAR_EVENTS);
        store.clear();
        events.forEach(event => {
            store.put(event);
        });
        return new Promise((resolve, reject) => {
            transaction.oncomplete = () => resolve();
            transaction.onerror = () => reject(transaction.error);
        });
    } catch (error) {
        console.error("Failed to save calendar events to DB", error);
    }
};


// --- Chat Sessions ---
export const loadChatSessions = async (): Promise<ChatSession[]> => {
    try {
        const db = await initDB();
        const transaction = db.transaction(STORES.CHAT_SESSIONS, 'readonly');
        const store = transaction.objectStore(STORES.CHAT_SESSIONS);
        return new Promise((resolve, reject) => {
            const request = store.getAll();
            request.onsuccess = () => resolve((request.result as ChatSession[] | undefined || []).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
            request.onerror = () => {
                console.error("Failed to load chat sessions:", request.error);
                reject(request.error);
            };
        });
    } catch (error) {
        console.error("Failed to load chat sessions from database (IndexedDB)", error);
        return [];
    }
};

export const saveChatSessions = async (sessions: ChatSession[]): Promise<void> => {
    try {
        const db = await initDB();
        const transaction = db.transaction(STORES.CHAT_SESSIONS, 'readwrite');
        const store = transaction.objectStore(STORES.CHAT_SESSIONS);
        store.clear();
        sessions.forEach(session => {
            store.put(session);
        });
        return new Promise((resolve, reject) => {
            transaction.oncomplete = () => resolve();
            transaction.onerror = () => {
                 console.error("Failed to save chat sessions transaction:", transaction.error);
                 reject(transaction.error);
            };
        });
    } catch (error) {
        console.error("Failed to save chat sessions to database (IndexedDB)", error);
    }
};


// --- Generic Settings Access Functions ---
const getSetting = async <T>(key: string): Promise<T | undefined> => {
    const db = await initDB();
    const transaction = db.transaction(STORES.SETTINGS, 'readonly');
    const store = transaction.objectStore(STORES.SETTINGS);
    
    return new Promise((resolve, reject) => {
        const request = store.get(key);
        request.onsuccess = () => resolve(request.result as T | undefined);
        request.onerror = () => {
            console.error(`Error getting setting ${key}:`, request.error);
            reject(request.error);
        };
    });
};

const setSetting = async <T>(key: string, value: T): Promise<void> => {
    const db = await initDB();
    const transaction = db.transaction(STORES.SETTINGS, 'readwrite');
    const store = transaction.objectStore(STORES.SETTINGS);
    
    return new Promise((resolve, reject) => {
        const request = store.put(value, key);
        request.onsuccess = () => resolve();
        request.onerror = () => {
            console.error(`Error setting setting ${key}:`, request.error);
            reject(request.error);
        };
    });
};

// --- Security PIN ---
export const loadPin = async (): Promise<string | null> => {
    const savedPin = await getSetting<string>('securityPin');
    return savedPin || null;
};

export const savePin = (pin: string | null): Promise<void> => setSetting('securityPin', pin);


// --- Theme ---
export const loadTheme = async (): Promise<Theme> => {
    const savedTheme = await getSetting<Theme>('theme');
    return (savedTheme === 'dark' || savedTheme === 'light') ? savedTheme : 'dark';
};

export const saveTheme = (theme: Theme): Promise<void> => setSetting('theme', theme);

// --- Display Settings ---
export const loadDisplaySettings = async (): Promise<DisplaySettings> => {
    const defaultSettings: DisplaySettings = {
        showProfilePictures: true,
        showContactNumber: true,
        showOnlyWithNumbers: false,
    };
    const savedSettings = await getSetting<DisplaySettings>('displaySettings');
    return savedSettings ? { ...defaultSettings, ...savedSettings } : defaultSettings;
};

export const saveDisplaySettings = (settings: DisplaySettings): Promise<void> => setSetting('displaySettings', settings);