import React, { useState, useEffect } from 'react';
import { Contact, LabeledEntry, Address } from '../types';
import { CloseIcon, PlusIcon, MinusIcon, CameraIcon, ExclamationTriangleIcon } from './icons';
import ProfileCustomizationModal from './ProfileCustomizationModal';

interface ContactModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (contact: Omit<Contact, 'id' | 'createdAt'>) => void;
    contactToEdit: Contact | null;
    onUpdateContact: (contact: Contact) => void;
}

const initialFormData = {
    firstName: '',
    lastName: '',
    nickname: '',
    gender: 'prefer_not_to_say' as 'male' | 'female' | 'other' | 'prefer_not_to_say',
    website: '',
    address: { street: '', city: '', state: '', country: '', zip: '' } as Address,
    company: '',
    jobTitle: '',
    notes: '',
    birthday: '',
    group: '' as 'Family' | 'Friends' | 'Work' | 'Other' | '',
    reminderSetting: 'none' as 'none' | '1_day' | '3_days' | '7_days',
    isFavorite: false,
    profilePicture: undefined as string | undefined,
    tags: [] as string[],
};

const FormSection: React.FC<{ title: string, children: React.ReactNode }> = ({ title, children }) => (
    <div className="bg-background p-4 rounded-lg border border-border">
        <h3 className="text-lg font-semibold text-primary mb-4">{title}</h3>
        <div className="space-y-4">{children}</div>
    </div>
);

type ActiveTab = 'address' | 'personal' | 'additional';

const TabButton: React.FC<{label: string, tabName: ActiveTab, isActive: boolean, onClick: (tab: ActiveTab) => void}> = ({ label, tabName, isActive, onClick }) => (
    <button
        type="button"
        onClick={() => onClick(tabName)}
        className={`px-4 py-2 text-sm font-semibold rounded-t-lg transition-colors border-b-2 w-1/3 ${
            isActive 
                ? 'border-primary text-primary' 
                : 'border-transparent text-subtext hover:border-gray-300 dark:hover:border-gray-600'
        }`}
    >
        {label}
    </button>
);


const ContactModal: React.FC<ContactModalProps> = ({ isOpen, onClose, onSave, contactToEdit, onUpdateContact }) => {
    const [formData, setFormData] = useState(initialFormData);
    const [phones, setPhones] = useState<LabeledEntry[]>([{label: 'mobile', value: ''}]);
    const [emails, setEmails] = useState<LabeledEntry[]>([{label: 'personal', value: ''}]);
    const [socialMediaLinks, setSocialMediaLinks] = useState<LabeledEntry[]>([{ label: 'LinkedIn', value: '' }]);
    const [errors, setErrors] = useState<{ [key: string]: string }>({});
    const [isProfileModalOpen, setProfileModalOpen] = useState(false);
    const [tagInput, setTagInput] = useState('');
    const [activeTab, setActiveTab] = useState<ActiveTab>('address');


    useEffect(() => {
        if (contactToEdit) {
            setFormData({
                firstName: contactToEdit.firstName,
                lastName: contactToEdit.lastName,
                nickname: contactToEdit.nickname || '',
                gender: contactToEdit.gender || 'prefer_not_to_say',
                website: contactToEdit.website || '',
                address: contactToEdit.address || initialFormData.address,
                company: contactToEdit.company || '',
                jobTitle: contactToEdit.jobTitle || '',
                notes: contactToEdit.notes || '',
                birthday: contactToEdit.birthday || '',
                group: contactToEdit.group || '',
                reminderSetting: contactToEdit.reminderSetting || 'none',
                isFavorite: contactToEdit.isFavorite,
                profilePicture: contactToEdit.profilePicture,
                tags: contactToEdit.tags || [],
            });
            setPhones(contactToEdit.phones.length > 0 ? contactToEdit.phones : [{label: 'mobile', value: ''}]);
            setEmails(contactToEdit.emails.length > 0 ? contactToEdit.emails : [{label: 'personal', value: ''}]);
            setSocialMediaLinks(contactToEdit.socialMediaLinks && contactToEdit.socialMediaLinks.length > 0 ? contactToEdit.socialMediaLinks : [{ label: 'LinkedIn', value: '' }]);
        } else {
            setFormData(initialFormData);
            setPhones([{label: 'mobile', value: ''}]);
            setEmails([{label: 'personal', value: ''}]);
            setSocialMediaLinks([{ label: 'LinkedIn', value: '' }]);
        }
        setErrors({}); 
        setTagInput('');
        setActiveTab('address');
    }, [contactToEdit, isOpen]);
    
    const handleGenericChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };
    
    const handleAddressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData(prev => ({ ...prev, address: { ...prev.address, [e.target.name]: e.target.value } }));
    };

    const handleDynamicListChange = <T extends LabeledEntry>(index: number, field: keyof LabeledEntry, value: string, list: T[], setter: React.Dispatch<React.SetStateAction<T[]>>) => {
        const newList = [...list];
        newList[index] = { ...newList[index], [field]: value };
        setter(newList);
    };

    const addDynamicListItem = <T extends LabeledEntry>(setter: React.Dispatch<React.SetStateAction<T[]>>, defaultItem: T) => {
        setter(prev => [...prev, defaultItem]);
    };

    const removeDynamicListItem = <T extends LabeledEntry>(index: number, list: T[], setter: React.Dispatch<React.SetStateAction<T[]>>) => {
        if (list.length > 1) {
            setter(list.filter((_, i) => i !== index));
        }
    };

    const handleProfileChange = (newProfilePicture: string | undefined) => {
      setFormData(prev => ({...prev, profilePicture: newProfilePicture}));
      setProfileModalOpen(false);
    };

    const removeTag = (indexToRemove: number) => {
        setFormData(prev => ({ ...prev, tags: prev.tags.filter((_, index) => index !== indexToRemove)}));
    };
    
    const handleTagInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' || e.key === ',') {
            e.preventDefault();
            const trimmedTag = tagInput.trim();
            if (trimmedTag && !formData.tags.includes(trimmedTag)) {
                setFormData(prev => ({ ...prev, tags: [...prev.tags, trimmedTag] }));
            }
            setTagInput('');
        }
    };
    
    const validate = () => {
        const newErrors: { [key: string]: string } = {};
        if (!formData.firstName.trim()) newErrors.firstName = 'First name is required.';
        if (!formData.lastName.trim()) newErrors.lastName = 'Last name is required.';
        if (!phones.some(p => p.value.trim() !== '')) newErrors.phone = 'At least one phone number is required.';
        emails.forEach((e, i) => { if (e.value.trim() && !/^\S+@\S+\.\S+$/.test(e.value)) newErrors[`email-${i}`] = 'Invalid email format.'});
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };


    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!validate()) return;
        
        const submissionData = { 
            ...formData, 
            phones: phones.filter(p => p.value.trim()),
            emails: emails.filter(e => e.value.trim()),
            socialMediaLinks: socialMediaLinks.filter(s => s.value.trim()),
        };
        onSave(submissionData);
    };

    if (!isOpen) return null;

    const renderDynamicInput = (list: LabeledEntry[], setter: React.Dispatch<React.SetStateAction<LabeledEntry[]>>, type: 'tel' | 'email' | 'url', defaultItem: LabeledEntry, errorKey: string) => (
        <div>
            {list.map((item, index) => (
                <div key={index} className="mb-2">
                    <div className="flex items-center gap-2">
                        <input type="text" value={item.label} onChange={e => handleDynamicListChange(index, 'label', e.target.value, list, setter)} placeholder="Label" className="w-1/3 p-2 bg-card rounded-md border border-border focus:ring-2 focus:ring-primary"/>
                        <input type={type} value={item.value} onChange={e => handleDynamicListChange(index, 'value', e.target.value, list, setter)} placeholder="Value" className={`flex-1 p-2 bg-card rounded-md focus:ring-2 ${errors[`${errorKey}-${index}`] ? 'border-2 border-danger focus:ring-danger' : 'border border-border focus:ring-primary'}`}/>
                        <button type="button" onClick={() => removeDynamicListItem(index, list, setter)} className="p-2 rounded-full hover:bg-background"><MinusIcon className="w-5 h-5 text-danger"/></button>
                    </div>
                    {errors[`${errorKey}-${index}`] && <p className="text-danger text-xs mt-1">{errors[`${errorKey}-${index}`]}</p>}
                </div>
            ))}
            <button type="button" onClick={() => addDynamicListItem(setter, defaultItem)} className="text-primary text-sm font-semibold flex items-center gap-1 mt-2 hover:underline"><PlusIcon className="w-4 h-4" /> Add Field</button>
            {errors[errorKey] && <p className="text-danger text-xs mt-1">{errors[errorKey]}</p>}
        </div>
    );

    return (
        <>
            <div onClick={onClose} className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                <div onClick={e => e.stopPropagation()} className="bg-card rounded-lg shadow-xl w-full max-w-2xl max-h-full flex flex-col animate-scale-in border border-border">
                    <div className="flex justify-between items-center p-4 border-b border-border">
                        <h2 className="text-xl font-bold">{contactToEdit ? 'Edit Contact' : 'Add New Contact'}</h2>
                        <button onClick={onClose} className="p-1 rounded-full hover:bg-background"><CloseIcon className="w-6 h-6"/></button>
                    </div>

                    <form id="contact-form" onSubmit={handleSubmit} className="flex-grow overflow-y-auto p-6 space-y-6 no-scrollbar">
                        <div className="flex flex-col items-center space-y-3">
                            <button type="button" onClick={() => setProfileModalOpen(true)} className="relative group rounded-full" title="Customize profile picture">
                                {formData.profilePicture ? (<img src={formData.profilePicture} alt="Profile" className="w-24 h-24 rounded-full object-cover ring-2 ring-offset-2 ring-offset-card ring-primary" />) : (<div className="w-24 h-24 rounded-full bg-background flex items-center justify-center text-3xl font-bold text-subtext ring-2 ring-offset-2 ring-offset-card ring-border">{`${formData.firstName?.[0] || ''}${formData.lastName?.[0] || ''}`.toUpperCase()}</div>)}
                                <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity"><CameraIcon className="w-8 h-8" /></div>
                            </button>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div><label className="block text-sm font-medium mb-1">First Name *</label><input type="text" name="firstName" value={formData.firstName} onChange={handleGenericChange} required className={`w-full p-2 bg-card rounded-md focus:ring-2 ${errors.firstName ? 'border-2 border-danger focus:ring-danger' : 'border border-border focus:ring-primary'}`}/>{errors.firstName && <p className="text-danger text-xs mt-1">{errors.firstName}</p>}</div>
                            <div><label className="block text-sm font-medium mb-1">Last Name *</label><input type="text" name="lastName" value={formData.lastName} onChange={handleGenericChange} required className={`w-full p-2 bg-card rounded-md focus:ring-2 ${errors.lastName ? 'border-2 border-danger focus:ring-danger' : 'border border-border focus:ring-primary'}`}/>{errors.lastName && <p className="text-danger text-xs mt-1">{errors.lastName}</p>}</div>
                        </div>
                         <div>
                            <label className="block text-sm font-medium mb-1">Nickname</label>
                            <input type="text" name="nickname" value={formData.nickname} onChange={handleGenericChange} className="w-full p-2 bg-card rounded-md border border-border focus:ring-2 focus:ring-primary"/>
                        </div>
                        <div><label className="block text-sm font-medium mb-1">Phone *</label>{renderDynamicInput(phones, setPhones, 'tel', {label: 'mobile', value: ''}, 'phone')}</div>
                        <div><label className="block text-sm font-medium mb-1">Email</label>{renderDynamicInput(emails, setEmails, 'email', {label: 'personal', value: ''}, 'email')}</div>

                        <div className="border-b border-border"><div className="flex -mb-px"><TabButton label="Address" tabName="address" isActive={activeTab === 'address'} onClick={setActiveTab} /><TabButton label="Personal" tabName="personal" isActive={activeTab === 'personal'} onClick={setActiveTab} /><TabButton label="Other" tabName="additional" isActive={activeTab === 'additional'} onClick={setActiveTab} /></div></div>
                        
                        <div className="animate-fade-in-up">
                            {activeTab === 'address' && <div className="space-y-4"><input type="text" name="street" value={formData.address?.street || ''} onChange={handleAddressChange} placeholder="Street" className="w-full p-2 bg-card rounded-md border border-border focus:ring-2 focus:ring-primary"/><div className="grid grid-cols-1 md:grid-cols-2 gap-4"><input type="text" name="city" value={formData.address?.city || ''} onChange={handleAddressChange} placeholder="City" className="w-full p-2 bg-card rounded-md border border-border focus:ring-2 focus:ring-primary"/><input type="text" name="state" value={formData.address?.state || ''} onChange={handleAddressChange} placeholder="State" className="w-full p-2 bg-card rounded-md border border-border focus:ring-2 focus:ring-primary"/></div><div className="grid grid-cols-1 md:grid-cols-2 gap-4"><input type="text" name="zip" value={formData.address?.zip || ''} onChange={handleAddressChange} placeholder="Zip / Postal Code" className="w-full p-2 bg-card rounded-md border border-border focus:ring-2 focus:ring-primary"/><input type="text" name="country" value={formData.address?.country || ''} onChange={handleAddressChange} placeholder="Country" className="w-full p-2 bg-card rounded-md border border-border focus:ring-2 focus:ring-primary"/></div></div>}
                            {activeTab === 'personal' && <div className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label htmlFor="birthday" className="block text-sm font-medium mb-1">Birthday</label>
                                        <input 
                                            type="date" 
                                            name="birthday" 
                                            id="birthday"
                                            value={formData.birthday} 
                                            onChange={handleGenericChange} 
                                            className="w-full p-2 bg-card rounded-md border border-border focus:ring-2 focus:ring-primary"
                                        />
                                    </div>
                                    <div>
                                        <label htmlFor="reminderSetting" className="block text-sm font-medium mb-1">Birthday Reminder</label>
                                        <div className="relative">
                                            <select 
                                                name="reminderSetting" 
                                                id="reminderSetting"
                                                value={formData.reminderSetting} 
                                                onChange={handleGenericChange} 
                                                className="w-full p-2 bg-card rounded-md border border-border focus:ring-2 focus:ring-primary appearance-none pr-8"
                                            >
                                                <option value="none">None</option>
                                                <option value="1_day">1 day before</option>
                                                <option value="3_days">3 days before</option>
                                                <option value="7_days">7 days before</option>
                                            </select>
                                            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-subtext">
                                                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                                                  <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
                                                </svg>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <input type="text" name="jobTitle" value={formData.jobTitle} onChange={handleGenericChange} placeholder="Job Title" className="w-full p-2 bg-card rounded-md border border-border focus:ring-2 focus:ring-primary"/>
                                <input type="text" name="company" value={formData.company} onChange={handleGenericChange} placeholder="Company" className="w-full p-2 bg-card rounded-md border border-border focus:ring-2 focus:ring-primary"/>
                                <label className="block text-sm font-medium mb-1 -mb-3">Tags</label>
                                <div className="flex flex-wrap items-center gap-2 p-1 bg-card rounded-md border focus-within:ring-2 focus-within:ring-primary">{formData.tags.map((tag, i) => (<div key={i} className="flex items-center gap-1 bg-primary/20 text-primary text-sm pl-2 pr-1 py-1 rounded"><span>{tag}</span><button type="button" onClick={() => removeTag(i)}><CloseIcon className="w-3 h-3"/></button></div>))}<input type="text" value={tagInput} onChange={e=>setTagInput(e.target.value)} onKeyDown={handleTagInputKeyDown} placeholder="Add tags..." className="flex-grow bg-transparent focus:outline-none p-1" /></div>
                                </div>
                            }
                            {activeTab === 'additional' && <div className="space-y-4"><label>Notes</label><textarea name="notes" value={formData.notes} onChange={handleGenericChange} rows={3} className="w-full p-2 bg-card rounded-md border border-border focus:ring-2 focus:ring-primary"></textarea><div className="flex items-center"><input type="checkbox" id="isFavorite" checked={formData.isFavorite} onChange={e => setFormData(p => ({...p, isFavorite: e.target.checked}))} className="h-4 w-4 rounded text-primary focus:ring-primary"/><label htmlFor="isFavorite" className="ml-2">Mark as Favorite</label></div></div>}
                        </div>
                    </form>

                    <div className="flex justify-end p-4 border-t border-border flex-shrink-0">
                        <button type="button" onClick={onClose} className="bg-card border border-border font-bold py-2 px-4 rounded-lg mr-2 hover:bg-border">Cancel</button>
                        <button type="submit" form="contact-form" className="bg-primary text-background font-bold py-2 px-4 rounded-lg shadow-md hover:bg-primary-hover">Save Contact</button>
                    </div>
                </div>
            </div>
            
            <ProfileCustomizationModal isOpen={isProfileModalOpen} onClose={() => setProfileModalOpen(false)} currentProfilePicture={formData.profilePicture} onSave={handleProfileChange} />
        </>
    );
};

export default ContactModal;