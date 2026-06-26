import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Contact } from '../types';
import { ArchiveBoxIcon, NoSymbolIcon, TrashIcon, DocumentDuplicateIcon, ArrowUturnLeftIcon, ExclamationTriangleIcon } from './icons';
import MergeContactsModal from './MergeContactsModal';

type ManagementTab = 'archived' | 'blocked' | 'trash' | 'duplicates';

const EmptyState: React.FC<{ title: string; message: string }> = ({ title, message }) => (
    <div className="text-center py-16 bg-card-light dark:bg-card-dark rounded-xl border border-border-light dark:border-border-dark">
        <svg className="mx-auto h-16 w-16 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        <h3 className="mt-2 text-xl font-medium">{title}</h3>
        <p className="mt-1 text-sm text-subtext-light dark:text-subtext-dark">{message}</p>
    </div>
);

const ContactActionItem: React.FC<{ contact: Contact; children: React.ReactNode }> = ({ contact, children }) => (
    <div className="flex items-center justify-between p-4 bg-card-light dark:bg-card-dark rounded-lg border border-border-light dark:border-border-dark">
        <div>
            <p className="font-semibold text-lg">{contact.firstName} {contact.lastName}</p>
            <p className="text-subtext-light dark:text-subtext-dark">{contact.phones[0]?.value || contact.emails[0]?.value || 'No contact info'}</p>
        </div>
        <div className="flex items-center space-x-2">
            {children}
        </div>
    </div>
);

interface ManagementPageProps {
    archivedContacts: Contact[];
    blockedContacts: Contact[];
    trashContacts: Contact[];
    allContacts: Contact[];
    onUnarchive: (id: string) => void;
    onUnblock: (id: string) => void;
    onRestore: (id: string) => void;
    onDeletePermanently: (id: string) => void;
    onMergeContacts: (contactToKeep: Contact, idsToRemove: string[]) => void;
}

const ManagementPage: React.FC<ManagementPageProps> = ({
    archivedContacts, blockedContacts, trashContacts, allContacts,
    onUnarchive, onUnblock, onRestore, onDeletePermanently, onMergeContacts
}) => {
    const [activeTab, setActiveTab] = useState<ManagementTab>('archived');
    const [contactToDeletePermanently, setContactToDeletePermanently] = useState<Contact | null>(null);
    const [mergingContacts, setMergingContacts] = useState<Contact[] | null>(null);

    // For underline animation
    const [underlineStyle, setUnderlineStyle] = useState<{left?: number; width?: number}>({});
    const tabsContainerRef = useRef<HTMLDivElement>(null);
    const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);

    const tabs: { id: ManagementTab, icon: React.ReactNode, label: string }[] = [
        { id: 'archived', icon: <ArchiveBoxIcon className="w-5 h-5"/>, label: 'Archived' },
        { id: 'blocked', icon: <NoSymbolIcon className="w-5 h-5"/>, label: 'Blocked' },
        { id: 'trash', icon: <TrashIcon className="w-5 h-5"/>, label: 'Trash' },
        { id: 'duplicates', icon: <DocumentDuplicateIcon className="w-5 h-5"/>, label: 'Duplicates' }
    ];

    useEffect(() => {
        const activeTabIndex = tabs.findIndex(tab => tab.id === activeTab);
        const activeTabNode = tabRefs.current[activeTabIndex];

        if (activeTabNode) {
            setUnderlineStyle({
                left: activeTabNode.offsetLeft,
                width: activeTabNode.clientWidth,
            });
        }
    }, [activeTab, tabs]);


    const duplicateContacts = useMemo(() => {
        const duplicates: Contact[][] = [];
        const checkedIds = new Set<string>();

        for (let i = 0; i < allContacts.length; i++) {
            if (checkedIds.has(allContacts[i].id)) continue;
            const group = [allContacts[i]];
            const name1 = `${allContacts[i].firstName} ${allContacts[i].lastName}`.toLowerCase().trim();
            const phone1 = allContacts[i].phones.find(p => p.value)?.value;

            for (let j = i + 1; j < allContacts.length; j++) {
                if (checkedIds.has(allContacts[j].id)) continue;
                const name2 = `${allContacts[j].firstName} ${allContacts[j].lastName}`.toLowerCase().trim();
                const phone2 = allContacts[j].phones.find(p => p.value)?.value;
                if (name1 === name2 || (phone1 && phone2 && phone1 === phone2)) {
                    group.push(allContacts[j]);
                }
            }
            if (group.length > 1) {
                duplicates.push(group);
                group.forEach(c => checkedIds.add(c.id));
            }
        }
        return duplicates;
    }, [allContacts]);

    const handleSaveMerge = (contactToKeep: Contact, idsToRemove: string[]) => {
        onMergeContacts(contactToKeep, idsToRemove);
        setMergingContacts(null);
    };

    const renderContent = () => {
        const contentMap = {
            archived: { contacts: archivedContacts, empty: "No Archived Contacts", message: "Archive contacts from the main list.", action: onUnarchive, actionLabel: "Unarchive" },
            blocked: { contacts: blockedContacts, empty: "No Blocked Contacts", message: "Block contacts from the main list.", action: onUnblock, actionLabel: "Unblock" },
            trash: { contacts: trashContacts, empty: "Trash is Empty", message: "Deleted contacts appear here for 30 days." }
        };

        if (activeTab === 'archived' || activeTab === 'blocked') {
            const { contacts, empty, message, action, actionLabel } = contentMap[activeTab];
            if (contacts.length === 0) return <EmptyState title={empty} message={message} />;
            return (
                <div className="space-y-4">
                    {contacts.map(c => <ContactActionItem key={c.id} contact={c}><button onClick={() => action(c.id)} className="font-semibold text-sm text-primary hover:underline">{actionLabel}</button></ContactActionItem>)}
                </div>
            );
        }
        if (activeTab === 'trash') {
            const { contacts, empty, message } = contentMap.trash;
            if (contacts.length === 0) return <EmptyState title={empty} message={message} />;
            return (
                <div className="space-y-4">
                    {contacts.map(c => (
                        <ContactActionItem key={c.id} contact={c}>
                            <button onClick={() => onRestore(c.id)} className="font-semibold text-sm text-blue-500 hover:underline flex items-center gap-1"><ArrowUturnLeftIcon className="w-4 h-4" /> Restore</button>
                            <button onClick={() => setContactToDeletePermanently(c)} className="font-semibold text-sm text-danger hover:underline">Delete Permanently</button>
                        </ContactActionItem>
                    ))}
                </div>
            );
        }
        if(activeTab === 'duplicates') {
            if (duplicateContacts.length === 0) return <EmptyState title="No Duplicates Found" message="We couldn't find contacts with similar names or numbers." />;
            return (
                <div className="space-y-6">
                    {duplicateContacts.map((group, index) => (
                        <div key={index} className="p-4 bg-card-light dark:bg-card-dark rounded-lg border border-border-light dark:border-border-dark">
                            <div className="flex justify-between items-center mb-2">
                                <h3 className="font-bold">Duplicate Group ({group.length} contacts)</h3>
                                <button onClick={() => setMergingContacts(group)} className="font-semibold text-sm bg-primary text-white py-1 px-3 rounded-lg hover:opacity-90 transition-opacity">Merge</button>
                            </div>
                            <div className="space-y-2">
                                {group.map(c => (
                                    <div key={c.id} className="flex items-center justify-between p-2 bg-background-light dark:bg-background-dark rounded">
                                        <div><p className="font-semibold">{c.firstName} {c.lastName}</p><p className="text-sm text-subtext-light dark:text-subtext-dark">{c.phones[0]?.value}</p></div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            );
        }
        return null;
    }

    return (
        <>
            <div className="space-y-6 max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
                <h1 className="text-4xl font-bold tracking-tight text-primary">Manage Contacts</h1>

                <div className="relative border-b border-border-light dark:border-border-dark">
                    <div ref={tabsContainerRef} className="flex space-x-2 overflow-x-auto no-scrollbar">
                        {tabs.map((tab, index) => (
                            <button
                                key={tab.id}
                                ref={el => { tabRefs.current[index] = el; }}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex-shrink-0 flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold transition-colors duration-300 ${
                                    activeTab === tab.id
                                        ? 'text-primary'
                                        : 'text-subtext-light dark:text-subtext-dark hover:text-text-light dark:hover:text-text-dark'
                                }`}
                            >
                                {tab.icon}
                                {tab.label}
                            </button>
                        ))}
                    </div>
                    <div className="absolute bottom-0 h-0.5 bg-primary transition-all duration-300"
                         style={underlineStyle}
                    />
                </div>
                
                <div className="animate-fade-in-up" style={{animationDelay: '100ms'}}>{renderContent()}</div>
            </div>

            {contactToDeletePermanently && (
                 <div onClick={() => setContactToDeletePermanently(null)} className="fixed inset-0 bg-white/50 dark:bg-black/50 backdrop-blur-lg flex items-center justify-center z-50 p-4" aria-labelledby="modal-title" role="dialog" aria-modal="true">
                    <div onClick={e => e.stopPropagation()} className="bg-card-light dark:bg-card-dark rounded-lg shadow-xl w-full max-w-md p-6 transform transition-all animate-scale-in border border-border-light dark:border-border-dark">
                        <div className="sm:flex sm:items-start">
                            <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-danger/10 sm:mx-0 sm:h-10 sm:w-10"><ExclamationTriangleIcon className="h-6 w-6 text-danger" aria-hidden="true" /></div>
                            <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                                <h3 className="text-lg leading-6 font-bold" id="modal-title">Permanently Delete Contact</h3>
                                <div className="mt-2"><p className="text-sm text-subtext-light dark:text-subtext-dark">Delete {contactToDeletePermanently.firstName} {contactToDeletePermanently.lastName}? This cannot be undone.</p></div>
                            </div>
                        </div>
                        <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
                            <button type="button" className="w-full inline-flex justify-center rounded-lg border border-transparent shadow-sm px-4 py-2 bg-danger hover:bg-danger/90 text-base font-medium text-white sm:ml-3 sm:w-auto sm:text-sm" onClick={() => {onDeletePermanently(contactToDeletePermanently.id); setContactToDeletePermanently(null);}}>Delete</button>
                            <button type="button" className="mt-3 w-full inline-flex justify-center rounded-lg shadow-sm px-4 py-2 bg-background-light dark:bg-background-dark border border-border-light dark:border-border-dark text-base font-medium sm:mt-0 sm:w-auto sm:text-sm" onClick={() => setContactToDeletePermanently(null)}>Cancel</button>
                        </div>
                    </div>
                </div>
            )}
             {mergingContacts && <MergeContactsModal isOpen={!!mergingContacts} onClose={() => setMergingContacts(null)} onSave={handleSaveMerge} contacts={mergingContacts} />}
        </>
    );
};

export default ManagementPage;