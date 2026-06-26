

import React, { useState, useEffect, useMemo } from 'react';
import { CalendarEvent, EventType, EventRepeat, EventReminder, AlertMode, Contact } from '../types';
import { CloseIcon, ChevronRightIcon, UsersIcon, ChevronDownIcon } from './icons';

interface EventModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (event: Omit<CalendarEvent, 'id' | 'createdAt'>) => void;
    eventToEdit: CalendarEvent | null;
    contacts: Contact[];
}

const today = new Date().toISOString().split('T')[0];

const initialFormData = {
    type: 'Event' as EventType,
    title: '',
    contactId: undefined as string | undefined,
    date: today,
    startTime: '09:00',
    endTime: '10:00',
    isAllDay: false,
    location: '',
    notes: '',
    repeat: 'Do not repeat' as EventRepeat,
    reminder: '15 minutes before' as EventReminder,
    alertMode: 'Notification reminder' as AlertMode,
};

const TabButton: React.FC<{label: string; isActive: boolean; onClick: () => void}> = ({ label, isActive, onClick }) => (
    <button
        type="button"
        onClick={onClick}
        className={`px-3 py-1.5 text-sm font-semibold rounded-full transition-colors ${
            isActive 
                ? 'bg-primary text-background' 
                : 'bg-background hover:bg-border'
        }`}
    >
        {label}
    </button>
);

const FormRow: React.FC<{label: string; children: React.ReactNode}> = ({ label, children }) => (
    <div className="flex items-center justify-between py-3 border-b border-border">
        <label className="font-semibold text-text">{label}</label>
        <div className="flex items-center gap-2 text-subtext">
            {children}
        </div>
    </div>
);

const EventModal: React.FC<EventModalProps> = ({ isOpen, onClose, onSave, eventToEdit, contacts }) => {
    const [formData, setFormData] = useState(initialFormData);
    const [isContactPickerOpen, setContactPickerOpen] = useState(false);
    const [contactSearch, setContactSearch] = useState('');

    useEffect(() => {
        if (eventToEdit) {
            setFormData({
                type: eventToEdit.type,
                title: eventToEdit.title,
                contactId: eventToEdit.contactId,
                date: eventToEdit.date,
                startTime: eventToEdit.startTime || '09:00',
                endTime: eventToEdit.endTime || '10:00',
                isAllDay: eventToEdit.isAllDay,
                location: eventToEdit.location || '',
                notes: eventToEdit.notes || '',
                repeat: eventToEdit.repeat,
                reminder: eventToEdit.reminder,
                alertMode: eventToEdit.alertMode,
            });
        } else {
            setFormData(initialFormData);
        }
    }, [eventToEdit, isOpen]);

    const handleTypeChange = (type: EventType) => {
        setFormData(prev => ({
            ...prev,
            type,
            title: prev.contactId && type === 'Birthday' ? contacts.find(c => c.id === prev.contactId)?.firstName + "'s Birthday" : prev.title,
        }));
    };

    const handleContactSelect = (contact: Contact) => {
        setFormData(prev => ({
            ...prev,
            contactId: contact.id,
            title: prev.type === 'Birthday' ? `${contact.firstName} ${contact.lastName}'s Birthday` : prev.title,
            date: contact.birthday || prev.date,
        }));
        setContactPickerOpen(false);
        setContactSearch('');
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        const checked = (e.target as HTMLInputElement).checked;
        setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(formData);
        onClose();
    };

    const selectedContact = useMemo(() => contacts.find(c => c.id === formData.contactId), [contacts, formData.contactId]);
    const filteredContacts = useMemo(() => contacts.filter(c => `${c.firstName} ${c.lastName}`.toLowerCase().includes(contactSearch.toLowerCase())), [contacts, contactSearch]);

    const reminderOptions: EventReminder[] = ['No reminder', 'At time of event', '5 minutes before', '15 minutes before', '1 hour before', '1 day before', '2 days before'];
    const repeatOptions: EventRepeat[] = ['Do not repeat', 'Daily', 'Weekly', 'Monthly', 'Yearly'];
        
    if (!isOpen) return null;

    if (isContactPickerOpen) {
        return (
             <div onClick={() => setContactPickerOpen(false)} className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
                <div onClick={e => e.stopPropagation()} className="bg-card rounded-2xl shadow-xl w-full max-w-md max-h-[80vh] flex flex-col animate-scale-in">
                    <h3 className="text-lg font-bold p-4 text-center border-b border-border">Select Contact</h3>
                    <div className="p-4"><input type="text" placeholder="Search contacts" value={contactSearch} onChange={e => setContactSearch(e.target.value)} className="w-full p-2 bg-background border border-border rounded-lg" /></div>
                    <div className="flex-grow overflow-y-auto px-4 pb-4">
                        {filteredContacts.map(c => <button key={c.id} onClick={() => handleContactSelect(c)} className="w-full flex items-center gap-3 p-3 hover:bg-background rounded-lg"><div className="w-10 h-10 rounded-full bg-primary text-background flex items-center justify-center font-bold">{c.firstName[0]}{c.lastName[0]}</div><p>{c.firstName} {c.lastName}</p></button>)}
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div onClick={onClose} className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div onClick={e => e.stopPropagation()} className="bg-card rounded-lg shadow-xl w-full max-w-xl max-h-full flex flex-col animate-scale-in border border-border">
                <div className="flex justify-between items-center p-4 border-b border-border">
                    <h2 className="text-xl font-bold">{eventToEdit ? 'Edit Event' : 'Add New Event'}</h2>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-background"><CloseIcon className="w-6 h-6"/></button>
                </div>

                <form id="event-form" onSubmit={handleSubmit} className="flex-grow overflow-y-auto p-6 space-y-2 no-scrollbar">
                     <div className="p-2 flex items-center justify-center gap-2">
                        {(['Event', 'Birthday', 'Anniversary', 'Countdown', 'Other'] as EventType[]).map(type => (
                            <TabButton key={type} label={type} isActive={formData.type === type} onClick={() => handleTypeChange(type)} />
                        ))}
                    </div>

                    <div className="divide-y divide-border pt-4">
                        <input type="text" name="title" value={formData.title} onChange={handleChange} placeholder="Event Title" className="w-full text-2xl font-bold bg-transparent focus:outline-none p-2 -mx-2 mb-2" required/>
                        
                        {formData.type === 'Event' && 
                            <input type="text" name="location" value={formData.location} onChange={handleChange} placeholder="Location" className="w-full text-lg bg-transparent focus:outline-none p-2 -mx-2 mb-2" />
                        }
                        
                        <FormRow label="All day">
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input type="checkbox" name="isAllDay" checked={formData.isAllDay} onChange={handleChange} className="sr-only peer" />
                                <div className="w-11 h-6 bg-border peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                            </label>
                        </FormRow>

                        <FormRow label={formData.type === 'Event' ? "Start" : "Date"}>
                            <input type="date" name="date" value={formData.date} onChange={handleChange} className="bg-transparent text-right focus:outline-none" />
                            {!formData.isAllDay && <input type="time" name="startTime" value={formData.startTime} onChange={handleChange} className="bg-transparent text-right focus:outline-none" />}
                        </FormRow>
                        
                        {formData.type === 'Event' && 
                        <FormRow label="End">
                            <input type="date" name="date" value={formData.date} onChange={handleChange} className="bg-transparent text-right focus:outline-none" />
                            {!formData.isAllDay && <input type="time" name="endTime" value={formData.endTime} onChange={handleChange} className="bg-transparent text-right focus:outline-none" />}
                        </FormRow>}

                        <FormRow label="Repeat">
                            <div className="relative w-48">
                                <select name="repeat" value={formData.repeat} onChange={handleChange} className="w-full bg-background border border-border rounded-lg text-text font-semibold p-2 appearance-none pr-8 focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer">
                                    {repeatOptions.map(o => <option key={o} value={o}>{o}</option>)}
                                </select>
                                <ChevronDownIcon className="w-5 h-5 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-subtext" />
                            </div>
                        </FormRow>

                        <FormRow label="Remind">
                            <div className="relative w-48">
                                <select name="reminder" value={formData.reminder} onChange={handleChange} className="w-full bg-background border border-border rounded-lg text-text font-semibold p-2 appearance-none pr-8 focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer">
                                    {reminderOptions.map(o => <option key={o} value={o}>{o}</option>)}
                                </select>
                                <ChevronDownIcon className="w-5 h-5 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-subtext" />
                            </div>
                        </FormRow>
                        
                        <button type="button" onClick={() => setContactPickerOpen(true)} className="w-full flex justify-between items-center py-3 border-b border-border">
                            <span className="font-semibold">Contact</span>
                            <div className="flex items-center gap-2 text-subtext">
                                {selectedContact ? `${selectedContact.firstName} ${selectedContact.lastName}` : 'Select'}
                                <ChevronRightIcon className="w-4 h-4" />
                            </div>
                        </button>
                        
                        <textarea name="notes" value={formData.notes} onChange={handleChange} placeholder="Add notes..." className="w-full bg-transparent focus:outline-none mt-4 p-2 -mx-2" rows={3}></textarea>
                    </div>
                </form>

                <div className="flex justify-end p-4 border-t border-border flex-shrink-0">
                    <button type="button" onClick={onClose} className="bg-card border border-border font-bold py-2 px-4 rounded-lg mr-2 hover:bg-border">Cancel</button>
                    <button type="submit" form="event-form" className="bg-primary text-background font-bold py-2 px-4 rounded-lg shadow-md hover:bg-primary-hover">Save Event</button>
                </div>
            </div>
        </div>
    );
};

export default EventModal;