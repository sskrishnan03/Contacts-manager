import React, { useState, useMemo } from 'react';
import { Contact } from '../types';
import { CloseIcon, UsersIcon } from './icons';

interface LinkContactsModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (selectedIds: string[]) => void;
    currentContact: Contact;
    allContacts: Contact[];
}

const LinkContactsModal: React.FC<LinkContactsModalProps> = ({ isOpen, onClose, onSave, currentContact, allContacts }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedIds, setSelectedIds] = useState<string[]>([]);

    const availableContacts = useMemo(() => {
        return allContacts.filter(c => 
            c.id !== currentContact.id && 
            !currentContact.linkedContactIds?.includes(c.id) &&
            (`${c.firstName} ${c.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) || c.phones.some(p => p.value.includes(searchTerm)))
        ).sort((a,b) => a.firstName.localeCompare(b.firstName));
    }, [allContacts, currentContact, searchTerm]);
    
    const handleToggleSelection = (id: string) => setSelectedIds(p => p.includes(id) ? p.filter(i => i !== id) : [...p, id]);
    const handleSubmit = () => { onSave(selectedIds); onClose(); };

    if (!isOpen) return null;

    return (
        <div onClick={onClose} className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div onClick={e => e.stopPropagation()} className="bg-card rounded-lg shadow-xl w-full max-w-lg max-h-full flex flex-col animate-scale-in border border-border">
                <div className="flex justify-between items-center p-4 border-b border-border">
                    <h2 className="text-xl font-bold">Link Contacts to {currentContact.firstName}</h2>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-background"><CloseIcon className="w-6 h-6"/></button>
                </div>

                <div className="flex-grow overflow-y-auto p-6 space-y-4 no-scrollbar">
                    <div className="relative">
                        <input type="text" placeholder="Search contacts..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full p-2 pl-10 bg-background border border-border focus:outline-none focus:ring-2 focus:ring-primary rounded-lg"/>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" fill="none" viewBox="0 0 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                    </div>

                    <div className="max-h-80 overflow-y-auto space-y-2 no-scrollbar pr-2 -mr-2">
                        {availableContacts.length > 0 ? (
                            availableContacts.map(contact => (
                                <label key={contact.id} className="flex items-center gap-3 p-3 bg-background rounded-lg cursor-pointer has-[:checked]:bg-primary-light has-[:checked]:ring-2 has-[:checked]:ring-primary">
                                    <input type="checkbox" checked={selectedIds.includes(contact.id)} onChange={() => handleToggleSelection(contact.id)} className="h-5 w-5 rounded text-primary focus:ring-primary"/>
                                    <div className="w-10 h-10 rounded-full bg-primary text-background flex items-center justify-center text-lg font-bold flex-shrink-0">{`${contact.firstName[0]||''}${contact.lastName[0]||''}`}</div>
                                    <div><p className="font-semibold">{contact.firstName} {contact.lastName}</p><p className="text-sm text-subtext">{contact.phones[0]?.value || 'No phone'}</p></div>
                                </label>
                            ))
                        ) : (
                            <div className="text-center py-8 text-subtext"><UsersIcon className="w-12 h-12 mx-auto text-gray-400" /><p className="mt-2">No available contacts found.</p></div>
                        )}
                    </div>
                </div>

                <div className="flex justify-end p-4 border-t border-border flex-shrink-0">
                    <button onClick={onClose} className="bg-card border font-bold py-2 px-4 rounded-lg mr-2 hover:bg-border">Cancel</button>
                    <button onClick={handleSubmit} disabled={selectedIds.length === 0} className="bg-primary text-background font-bold py-2 px-4 rounded-lg shadow-md hover:bg-primary-hover disabled:opacity-50">Link {selectedIds.length > 0 ? `(${selectedIds.length})` : ''} Contact{selectedIds.length !== 1 ? 's' : ''}</button>
                </div>
            </div>
        </div>
    );
};

export default LinkContactsModal;