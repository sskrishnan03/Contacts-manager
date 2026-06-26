

import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { Contact, DisplaySettings } from '../types';
import { HeartIcon, EditIcon, TrashIcon, ExclamationTriangleIcon, ArrowUturnLeftIcon, ArrowUturnRightIcon, UsersIcon } from './icons';

interface ContactsPageProps {
    contacts: Contact[];
    updateContact: (contact: Contact) => void;
    displaySettings: DisplaySettings;
    selectedContactId: string | null;
    onSelectContact: (id: string) => void;
    onOpenAddModal: () => void;
    onOpenEditModal: (contact: Contact) => void;
    onDelete: (ids: string[]) => void;
    onUndo: () => void;
    onRedo: () => void;
    canUndo: boolean;
    canRedo: boolean;
}

const ContactListItem: React.FC<{
    contact: Contact;
    onSelect: () => void;
    onToggleFavorite: () => void;
    displaySettings: DisplaySettings;
    isEditMode: boolean;
    isSelected: boolean;
    onToggleSelect: () => void;
}> = React.memo(({ contact, onSelect, onToggleFavorite, displaySettings, isEditMode, isSelected, onToggleSelect }) => {
    const initials = `${contact.firstName[0] || ''}${contact.lastName[0] || ''}`.toUpperCase();
    const primaryPhone = contact.phones[0]?.value;

    const handleClick = () => {
        if (isEditMode) {
            onToggleSelect();
        } else {
            onSelect();
        }
    };

    return (
        <div 
            className={`flex items-center justify-between p-4 bg-card rounded-xl border transition-all duration-200 cursor-pointer group ${isSelected ? 'border-primary bg-primary-light' : 'border-border hover:border-primary/50'}`}
            onClick={handleClick}
        >
            <div className="flex items-center truncate">
                 {isEditMode && (
                    <div className="mr-4 flex-shrink-0" onClick={e => e.stopPropagation()}>
                        <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={onToggleSelect}
                            className="h-5 w-5 rounded text-primary focus:ring-primary border-gray-300 dark:border-gray-600 bg-background"
                        />
                    </div>
                )}
                {displaySettings.showProfilePictures && (
                    contact.profilePicture ? (
                        <img src={contact.profilePicture} alt="profile" className="w-12 h-12 rounded-full object-cover mr-4" />
                    ) : (
                        <div className="w-12 h-12 rounded-full bg-primary text-background flex items-center justify-center text-xl font-bold mr-4 flex-shrink-0">
                            {initials}
                        </div>
                    )
                )}
                <div className="truncate">
                    <p className="font-semibold text-lg truncate">{contact.firstName} {contact.lastName}</p>
                    {displaySettings.showContactNumber && (
                         <p className="text-subtext truncate">{primaryPhone || 'No phone number'}</p>
                    )}
                </div>
            </div>
            <div className="flex items-center flex-shrink-0">
                {!isEditMode && (
                     <button onClick={(e) => { e.stopPropagation(); onToggleFavorite(); }} className="p-2 rounded-full hover:bg-background transition-transform hover:scale-110" title={contact.isFavorite ? 'Remove from Favorites' : 'Add to Favorites'}>
                         <HeartIcon filled={contact.isFavorite} className={`w-5 h-5 ${contact.isFavorite ? 'text-danger' : 'text-gray-400'}`} />
                    </button>
                )}
            </div>
        </div>
    );
});


const ContactsPage: React.FC<ContactsPageProps> = (props) => {
    const { contacts, updateContact, selectedContactId, onSelectContact, displaySettings, onDelete, onUndo, onRedo, canUndo, canRedo } = props;
    const [searchTerm, setSearchTerm] = useState('');
    const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
    const [tagFilter, setTagFilter] = useState<string>('All Tags');
    const [showFavorites, setShowFavorites] = useState(false);
    
    const [isEditMode, setIsEditMode] = useState(false);
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [isBulkDeleteConfirmOpen, setBulkDeleteConfirmOpen] = useState(false);

    const [indicator, setIndicator] = useState<{ letter: string; top: number } | null>(null);
    const groupRefs = useRef<Record<string, HTMLHeadingElement | null>>({});
    const mainScrollRef = useRef<HTMLDivElement>(null);
    const scrollerRef = useRef<HTMLDivElement>(null);

    // Debounce search term
    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedSearchTerm(searchTerm);
        }, 300);

        return () => {
            clearTimeout(handler);
        };
    }, [searchTerm]);

    const allTags = useMemo(() => Array.from(new Set(contacts.flatMap(c => c.tags))), [contacts]);
    
    useEffect(() => {
        if (isEditMode) return;
        const trimmedSearch = debouncedSearchTerm.trim();
        if (trimmedSearch.length > 5) {
            const searchDigits = trimmedSearch.replace(/\D/g, '');
            const exactMatches = contacts.filter((contact: Contact) => 
                (searchDigits.length > 0 && contact.phones.some(p => p.value.replace(/\D/g, '') === searchDigits)) ||
                contact.emails.some(e => e.value.toLowerCase() === trimmedSearch.toLowerCase())
            );

            if (exactMatches.length === 1) {
                onSelectContact(exactMatches[0].id);
            }
        }
    }, [debouncedSearchTerm, contacts, onSelectContact, isEditMode]);

    const groupedContacts = useMemo<Record<string, Contact[]>>(() => {
        const searchLower = debouncedSearchTerm.toLowerCase();
        const searchDigits = debouncedSearchTerm.replace(/\D/g, '');

        const filtered = contacts.filter((contact: Contact) => {
            const matchesSearch = debouncedSearchTerm === '' ||
                `${contact.firstName} ${contact.lastName}`.toLowerCase().includes(searchLower) ||
                (searchDigits.length > 0 && contact.phones.some(p => p.value.replace(/\D/g, '').includes(searchDigits))) ||
                contact.emails.some(e => e.value.toLowerCase().includes(searchLower));
            
            const matchesTag = tagFilter === 'All Tags' || contact.tags.includes(tagFilter);
            const matchesFavorites = !showFavorites || contact.isFavorite;
            const matchesNumbersOnly = !displaySettings.showOnlyWithNumbers || (contact.phones && contact.phones.length > 0 && contact.phones.some(p => p.value.trim()));

            return matchesSearch && matchesTag && matchesFavorites && matchesNumbersOnly;
        });

        const sorted = [...filtered].sort((a, b) => String(a.firstName).localeCompare(String(b.firstName)));

        return sorted.reduce((acc, contact) => {
            const firstLetter = contact.firstName?.[0]?.toUpperCase();
            const group = /^[A-Z]$/.test(firstLetter) ? firstLetter : '#';
            if (!acc[group]) {
                acc[group] = [];
            }
            acc[group].push(contact);
            return acc;
        }, {} as Record<string, Contact[]>);

    }, [contacts, debouncedSearchTerm, tagFilter, showFavorites, displaySettings]);

    const allVisibleContactIds = useMemo(() => Object.values(groupedContacts).flat().map((c: Contact) => c.id), [groupedContacts]);
    const areAllVisibleSelected = allVisibleContactIds.length > 0 && selectedIds.size === allVisibleContactIds.length;
    
    const alphabet = ['#', ...Array.from({ length: 26 }, (_, i) => String.fromCharCode(65 + i))];

    const handleLetterClick = (letter: string, event: React.MouseEvent<HTMLButtonElement>) => {
        if (scrollerRef.current) {
            const scrollerTop = scrollerRef.current.getBoundingClientRect().top;
            const buttonTop = event.currentTarget.getBoundingClientRect().top;
            setIndicator({ letter, top: buttonTop - scrollerTop });
        }
        setTimeout(() => setIndicator(null), 1000);

        const targetElement = groupRefs.current[letter];
        if (targetElement && mainScrollRef.current) {
            mainScrollRef.current.scrollTo({
                top: targetElement.offsetTop - 180, // Adjust for sticky header height
                behavior: 'smooth'
            });
        }
    };

    const handleToggleEditMode = () => {
        setIsEditMode(prev => !prev);
        setSelectedIds(new Set());
    };
    
    const handleToggleSelect = useCallback((id: string) => {
        setSelectedIds(prev => {
            const newSet = new Set(prev);
            if (newSet.has(id)) {
                newSet.delete(id);
            } else {
                newSet.add(id);
            }
            return newSet;
        });
    }, []);
    
    const handleSelectAll = () => {
        setSelectedIds(areAllVisibleSelected ? new Set() : new Set(allVisibleContactIds));
    };

    const handleToggleFavorite = useCallback((contact: Contact) => {
        updateContact({ ...contact, isFavorite: !contact.isFavorite });
    }, [updateContact]);

    const handleConfirmBulkDelete = () => {
        if (selectedIds.size > 0) {
            onDelete([...selectedIds]);
        }
        setBulkDeleteConfirmOpen(false);
        setIsEditMode(false);
        setSelectedIds(new Set());
    };
    
    return (
        <div className="flex h-full w-full relative bg-background">
            <div ref={mainScrollRef} className={`flex-grow h-full overflow-y-auto no-scrollbar transition-all duration-300 ${selectedContactId ? 'hidden lg:block' : 'block'}`}>
                <div className="space-y-6 max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
                    {/* Top Bar */}
                    <div className="flex justify-between items-center gap-4 flex-wrap">
                        <h1 className="text-4xl font-bold tracking-tight text-text">Contacts</h1>
                         <div className="flex items-center gap-2">
                             <div className="flex items-center gap-1 p-1 bg-card rounded-lg border border-border">
                                <button onClick={onUndo} disabled={!canUndo} className="p-1.5 rounded-md text-subtext hover:bg-border disabled:opacity-50 disabled:cursor-not-allowed" aria-label="Undo"><ArrowUturnLeftIcon className="h-5 w-5" /></button>
                                <div className="w-px h-5 bg-border"></div>
                                <button onClick={onRedo} disabled={!canRedo} className="p-1.5 rounded-md text-subtext hover:bg-border disabled:opacity-50 disabled:cursor-not-allowed" aria-label="Redo"><ArrowUturnRightIcon className="h-5 w-5" /></button>
                            </div>
                            <button onClick={handleToggleEditMode} disabled={contacts.length === 0} className="font-semibold py-2 px-4 rounded-lg flex items-center bg-card border border-border hover:bg-border transition-colors disabled:opacity-50">
                               <EditIcon className="h-5 w-5 md:mr-2" /> <span className="hidden md:inline">{isEditMode ? 'Done' : 'Edit'}</span>
                            </button>
                        </div>
                    </div>

                     <div className="bg-card rounded-xl border border-border sticky top-0 z-20">
                        <div className="p-4">
                            <div className="relative">
                                <input type="text" placeholder={`Search ${contacts.length} contact(s)`} value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                                    className="w-full p-2 pl-10 bg-background border border-border focus:outline-none focus:ring-2 focus:ring-primary rounded-lg transition-colors"
                                />
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" fill="none" viewBox="0 0 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                            </div>
                             <div className="mt-4 flex flex-wrap items-center gap-2">
                                <select value={tagFilter} onChange={e => setTagFilter(e.target.value)} className="p-2 bg-background border border-border rounded-lg flex-grow sm:flex-grow-0 cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary text-sm">
                                    <option>All Tags</option>
                                    {allTags.map(tag => <option key={tag}>{tag}</option>)}
                                </select>
                                <button onClick={() => setShowFavorites(!showFavorites)} className={`flex items-center justify-center p-2 rounded-lg transition-colors duration-300 font-semibold text-sm ${showFavorites ? 'bg-primary-light text-primary' : 'bg-background hover:bg-border'}`}>
                                    <HeartIcon className="h-5 w-5 mr-2" />
                                    Favorites
                                </button>
                            </div>
                        </div>
                    </div>

                    <div>
                        {isEditMode && (
                             <div className="mb-4 animate-fade-in-up">
                                <label className="flex items-center gap-2 cursor-pointer font-semibold p-2">
                                    <input type="checkbox" onChange={handleSelectAll} checked={areAllVisibleSelected} className="h-5 w-5 rounded text-primary focus:ring-primary border-gray-300 dark:border-gray-600" />
                                    Select All Visible
                                </label>
                            </div>
                        )}
                        {Object.keys(groupedContacts).length > 0 ? (
                             <div className="space-y-2">
                                {Object.entries(groupedContacts).map(([letter, contactsInSection]: [string, Contact[]]) => (
                                    <div key={letter}>
                                        <h2 
                                            ref={el => (groupRefs.current[letter] = el)}
                                            className="text-xl font-bold text-primary p-2 sticky top-28 bg-background/80 backdrop-blur-sm z-10 border-b border-border"
                                        >
                                            {letter}
                                        </h2>
                                        <div className="grid grid-cols-1 gap-4 pt-2">
                                            {contactsInSection.map(contact => (
                                                <ContactListItem
                                                    key={contact.id} contact={contact}
                                                    onSelect={() => onSelectContact(contact.id)}
                                                    onToggleFavorite={() => handleToggleFavorite(contact)}
                                                    displaySettings={displaySettings}
                                                    isEditMode={isEditMode}
                                                    isSelected={selectedIds.has(contact.id)}
                                                    onToggleSelect={() => handleToggleSelect(contact.id)}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-16 bg-card rounded-xl border border-border">
                                <UsersIcon className="mx-auto h-16 w-16 text-gray-400" />
                                <h3 className="mt-2 text-xl font-medium">No Contacts Found</h3>
                                <p className="mt-1 text-subtext">Use the '+' button below to add your first contact.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div ref={scrollerRef} className="fixed right-2 md:right-4 top-1/2 -translate-y-1/2 h-auto flex flex-col items-center justify-center bg-card/50 backdrop-blur-sm rounded-full p-0.5 z-30">
                {alphabet.map(letter => (
                    <button
                        key={letter}
                        onClick={(e) => handleLetterClick(letter, e)}
                        className="text-[11px] font-bold text-subtext hover:text-primary px-1 rounded-full transition-colors w-5 h-5 flex items-center justify-center"
                    >
                        {letter}
                    </button>
                ))}
                 {indicator && (
                    <div 
                        className="absolute right-full mr-3 w-10 h-10 rounded-lg bg-text text-background flex items-center justify-center text-xl font-bold animate-scale-in pointer-events-none"
                        style={{ top: `${indicator.top - 8}px` }}
                    >
                        {indicator.letter}
                    </div>
                )}
            </div>

            {isEditMode && selectedIds.size > 0 && (
                <div className="fixed bottom-28 md:bottom-28 left-1/2 -translate-x-1/2 w-11/12 max-w-lg mx-auto bg-text text-background p-3 rounded-2xl shadow-2xl flex justify-between items-center z-30 animate-fade-in-up">
                    <span className="font-semibold px-2">{selectedIds.size} selected</span>
                    <button onClick={() => setBulkDeleteConfirmOpen(true)} className="font-semibold py-2 px-4 rounded-lg flex items-center gap-2 bg-danger text-white hover:bg-danger/90 transition-colors">
                        <TrashIcon className="h-5 w-5" /> Delete
                    </button>
                </div>
            )}
            
            {isBulkDeleteConfirmOpen && (
                <div onClick={() => setBulkDeleteConfirmOpen(false)} className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div onClick={e => e.stopPropagation()} className="bg-card rounded-lg shadow-xl w-full max-w-md p-6 animate-scale-in border border-border">
                        <div className="sm:flex sm:items-start"><div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-danger/10 sm:mx-0"><ExclamationTriangleIcon className="h-6 w-6 text-danger" /></div><div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left"><h3 className="text-lg font-bold">Delete Contacts</h3><p className="mt-2 text-sm text-subtext">Move {selectedIds.size} selected contact{selectedIds.size === 1 ? '' : 's'} to the trash?</p></div></div>
                        <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
                            <button type="button" onClick={handleConfirmBulkDelete} className="w-full inline-flex justify-center rounded-lg border border-transparent shadow-sm px-4 py-2 bg-danger text-base font-medium text-white hover:bg-danger/90 sm:ml-3 sm:w-auto sm:text-sm">
                                Move to Trash
                            </button>
                            <button type="button" onClick={() => setBulkDeleteConfirmOpen(false)} className="mt-3 w-full inline-flex justify-center rounded-lg shadow-sm px-4 py-2 bg-card border border-border text-base font-medium sm:mt-0 sm:w-auto sm:text-sm">
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ContactsPage;
