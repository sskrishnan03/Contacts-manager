import React, { useState, useEffect } from 'react';
import { Contact, LabeledEntry } from '../types';
import { CloseIcon, CheckCircleIcon } from './icons';

interface MergeContactsModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (contactToKeep: Contact, idsToRemove: string[]) => void;
    contacts: Contact[];
}

const getUnique = <T, K>(array: T[], key: (item: T) => K): T[] => Array.from(new Map(array.map(item => [key(item), item])).values());

const MergeContactsModal: React.FC<MergeContactsModalProps> = ({ isOpen, onClose, onSave, contacts }) => {
    const [primaryId, setPrimaryId] = useState<string>('');
    const [mergedData, setMergedData] = useState<Partial<Contact>>({});

    useEffect(() => {
        if (contacts.length > 0) {
            const primary = contacts[0];
            setPrimaryId(primary.id);
            setMergedData({
                ...primary,
                isFavorite: contacts.some(c => c.isFavorite),
                phones: getUnique(contacts.flatMap(c => c.phones), (p: LabeledEntry) => p.value),
                emails: getUnique(contacts.flatMap(c => c.emails), (e: LabeledEntry) => e.value),
                tags: [...new Set(contacts.flatMap(c => c.tags))],
            });
        }
    }, [contacts]);

    const handleFieldChange = (field: keyof Contact, value: any) => setMergedData(prev => ({ ...prev, [field]: value }));
    const handleMultiValueChange = (field: 'phones' | 'emails' | 'tags', value: any, isChecked: boolean) => {
        const current = (mergedData[field] as any[]) || [];
        if (isChecked) handleFieldChange(field, [...current, value]);
        else handleFieldChange(field, current.filter(v => (v.value || v) !== (value.value || v)));
    };
    
    const handleSubmit = () => {
        const primaryContact = contacts.find(c => c.id === primaryId);
        if (!primaryContact) return;
        const finalContact: Contact = { ...primaryContact, ...mergedData, phones: mergedData.phones || [], emails: mergedData.emails || [], tags: mergedData.tags || [] };
        onSave(finalContact, contacts.map(c => c.id).filter(id => id !== primaryId));
    };

    if (!isOpen) return null;

    const renderSingleFieldChooser = (field: keyof Contact, label: string) => {
        const options = getUnique(contacts.map(c => c[field]).filter(Boolean), v => v);
        if (options.length <= 1) return null;
        return <div className="p-3 bg-background rounded-lg border"><h4 className="font-semibold mb-2">{label}</h4><div className="flex flex-wrap gap-2">{contacts.map(c => (c[field] && <button key={c.id} onClick={() => handleFieldChange(field, c[field])} className={`flex items-center gap-2 p-2 text-sm rounded-md border-2 ${mergedData[field] === c[field] ? 'border-primary bg-primary-light' : 'border-transparent bg-card'}`}>{mergedData[field] === c[field] && <CheckCircleIcon className="w-5 h-5 text-primary" />}<span>{c[field] as string} <span className="text-xs"> (from {c.firstName})</span></span></button>))}</div></div>;
    };
    
    const renderMultiFieldChooser = (field: 'phones' | 'emails' | 'tags', label: string) => {
        const allItems = field === 'tags' ? [...new Set(contacts.flatMap(c => c.tags))] : getUnique(contacts.flatMap(c => c[field]), (item: LabeledEntry) => item.value);
        if (allItems.length === 0) return null;
        const currentSelection = mergedData[field] || [];
        return <div className="p-3 bg-background rounded-lg border"><h4 className="font-semibold mb-2">{label} (select to keep)</h4><div className="flex flex-wrap gap-2">{allItems.map((item, idx) => (<label key={idx} className="flex items-center gap-2 p-2 text-sm rounded-md border-2 cursor-pointer bg-card has-[:checked]:border-primary has-[:checked]:bg-primary-light"><input type="checkbox" checked={typeof item === 'string' ? (currentSelection as string[]).includes(item) : (currentSelection as LabeledEntry[]).some(v => v.value === (item as LabeledEntry).value)} onChange={(e) => handleMultiValueChange(field, item, e.target.checked)} className="h-4 w-4 rounded text-primary focus:ring-primary" />{typeof item === 'string' ? item : `${(item as LabeledEntry).label}: ${(item as LabeledEntry).value}`}</label>))}</div></div>;
    };


    return (
        <div onClick={onClose} className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div onClick={e => e.stopPropagation()} className="bg-card rounded-lg shadow-xl w-full max-w-2xl max-h-full flex flex-col animate-scale-in border border-border">
                <div className="flex justify-between items-center p-4 border-b"><h2 className="text-xl font-bold">Merge Duplicates</h2><button onClick={onClose}><CloseIcon className="w-6 h-6"/></button></div>
                <div className="flex-grow overflow-y-auto p-6 space-y-6 no-scrollbar">
                    <div className="p-3 bg-background rounded-lg border"><h3 className="font-semibold mb-2">1. Select Primary</h3><p className="text-sm mb-2">This contact's ID and creation date will be kept.</p><div className="flex flex-wrap gap-2">{contacts.map(c => (<button key={c.id} onClick={() => setPrimaryId(c.id)} className={`flex items-center gap-2 p-2 rounded-md border-2 ${primaryId === c.id ? 'border-primary bg-primary-light' : 'border-transparent bg-card'}`}>{primaryId === c.id && <CheckCircleIcon className="w-5 h-5 text-primary" />}<div className="w-8 h-8 rounded-full bg-primary text-background flex items-center justify-center text-sm font-bold flex-shrink-0">{`${c.firstName[0]||''}${c.lastName[0]||''}`}</div><span className="font-semibold">{c.firstName} {c.lastName}</span></button>))}</div></div>
                    <div className="space-y-4"><h3 className="font-semibold text-lg">2. Combine Information</h3>{renderSingleFieldChooser('company', 'Company')}{renderSingleFieldChooser('notes', 'Notes')}{renderMultiFieldChooser('phones', 'Phones')}{renderMultiFieldChooser('emails', 'Emails')}{renderMultiFieldChooser('tags', 'Tags')}</div>
                </div>
                <div className="flex justify-end p-4 border-t"><button onClick={onClose} className="bg-card border font-bold py-2 px-4 rounded-lg mr-2 hover:bg-border">Cancel</button><button onClick={handleSubmit} className="bg-primary text-background font-bold py-2 px-4 rounded-lg shadow-md hover:bg-primary-hover">Merge Contacts</button></div>
            </div>
        </div>
    );
};

export default MergeContactsModal;