import React, { useState } from 'react';
import { Contact, ActivityType, Address } from '../types';
import { 
    EditIcon, TrashIcon, CallIcon, MessageIcon, MailIcon, WhatsAppIcon, UsersIcon, QRIcon, 
    ExclamationTriangleIcon, CloseIcon, CakeIcon, HeartIcon, ClockIcon, ArchiveBoxIcon, NoSymbolIcon, VideoCameraIcon,
    LinkIcon, MapPinIcon, BriefcaseIcon
} from './icons';
import ShareContactModal from './ShareContactModal';
import LogActivityModal from './LogActivityModal';

interface ContactDetailPageProps {
    contact: Contact | null;
    onClose: () => void;
    onOpenEditModal: (contact: Contact) => void;
    onDelete: (ids: string[]) => void;
    onArchive: (id: string, archive: boolean) => void;
    onBlock: (id: string, block: boolean) => void;
    onLogActivity: (contactId: string, type: ActivityType, notes?: string) => void;
    allContacts: Contact[];
    onOpenLinkModal: () => void;
    onUnlinkContact: (sourceId: string, targetId: string) => void;
    onSelectContact: (id: string) => void;
}

const formatFullDateTime = (isoString: string): string => {
    return new Date(isoString).toLocaleString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
    });
};

const DetailCard: React.FC<{ icon: React.ReactNode, title: string, children: React.ReactNode, hasContent?: boolean }> = ({ icon, title, children, hasContent = true }) => {
    if (!hasContent) return null;
    return (
         <div className="bg-card p-4 rounded-xl border border-border">
            <h3 className="text-sm font-semibold mb-3 flex items-center gap-2 text-subtext">{icon} {title}</h3>
            <div className="space-y-3">{children}</div>
        </div>
    );
};

const LabeledInfo: React.FC<{ label: string, value: React.ReactNode, isLink?: boolean }> = ({ label, value, isLink }) => (
     <div>
        <p className="text-xs text-subtext capitalize">{label}</p>
        {isLink ? (
             <a href={String(value).startsWith('http') ? String(value) : `https://${String(value)}`} target="_blank" rel="noopener noreferrer" className="font-semibold text-primary hover:underline break-words">
                {String(value)}
            </a>
        ) : (
            <p className="font-semibold break-words">{value}</p>
        )}
    </div>
);

const getInternationalPhoneNumber = (phone: string | undefined): string => {
    if (!phone) return '';
    let cleaned = phone.replace(/[\s-()]/g, '');
    if (cleaned.startsWith('+')) return cleaned;
    if (cleaned.length === 10) return `+91${cleaned}`;
    if (cleaned.startsWith('0') && cleaned.length === 11) return `+91${cleaned.substring(1)}`;
    return cleaned;
};

const formatAddress = (address?: Address) => {
    if (!address) return null;
    const parts = [address.street, address.city, address.state, address.zip, address.country];
    return parts.filter(Boolean).join(', ');
};

const ContactDetailPage: React.FC<ContactDetailPageProps> = ({ contact, onClose, onOpenEditModal, onDelete, onArchive, onBlock, onLogActivity, allContacts, onOpenLinkModal, onUnlinkContact, onSelectContact }) => {
    const [isShareModalOpen, setShareModalOpen] = useState(false);
    const [isDeleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
    const [isLogModalOpen, setIsLogModalOpen] = useState(false);
    const [activityToLog, setActivityToLog] = useState<ActivityType | null>(null);

    if (!contact) return null;

    const initials = `${contact.firstName[0] || ''}${contact.lastName[0] || ''}`.toUpperCase();
    
    const handleActionClick = (url: string, type: ActivityType) => {
        setActivityToLog(type);
        setIsLogModalOpen(true);
        if (url) window.open(url, '_blank');
    };
    
    const handleSaveLog = (notes: string) => {
        if (activityToLog) onLogActivity(contact.id, activityToLog, notes);
        setIsLogModalOpen(false); setActivityToLog(null);
    };

    const handleCloseLogModal = () => {
        if (activityToLog) onLogActivity(contact.id, activityToLog, undefined);
        setIsLogModalOpen(false); setActivityToLog(null);
    };

    const handleDeleteClick = () => setDeleteConfirmOpen(true);
    const confirmDelete = () => { onDelete([contact.id]); setDeleteConfirmOpen(false); };

    const primaryPhone = contact.phones[0]?.value;
    const primaryEmail = contact.emails[0]?.value;
    const internationalPhone = getInternationalPhoneNumber(primaryPhone);
    const webLinkPhone = internationalPhone.replace('+', '');
    const isActionDisabled = contact.isBlocked;

    const actionButtons = [
        { type: 'call' as ActivityType, label: 'Call', icon: <CallIcon className="w-5 h-5"/>, action: `tel:${internationalPhone}`, disabled: !internationalPhone },
        { type: 'video_call' as ActivityType, label: 'Video', icon: <VideoCameraIcon className="w-5 h-5"/>, action: `whatsapp://call?phone=${webLinkPhone}&video=true`, disabled: !webLinkPhone },
        { type: 'message' as ActivityType, label: 'Message', icon: <MessageIcon className="w-5 h-5"/>, action: `sms:${internationalPhone}`, disabled: !internationalPhone },
        { type: 'email' as ActivityType, label: 'Email', icon: <MailIcon className="w-5 h-5"/>, action: `mailto:${primaryEmail}`, disabled: !primaryEmail },
        { type: 'whatsapp' as ActivityType, label: 'WhatsApp', icon: <WhatsAppIcon className="w-5 h-5"/>, action: `https://wa.me/${webLinkPhone}`, disabled: !webLinkPhone },
    ];
    
    const activityIcons: Record<ActivityType, React.ReactNode> = {
        call: <CallIcon className="w-4 h-4 text-blue-500" />,
        video_call: <VideoCameraIcon className="w-4 h-4 text-teal-500" />,
        message: <MessageIcon className="w-4 h-4 text-purple-500" />,
        email: <MailIcon className="w-4 h-4 text-red-500" />,
        whatsapp: <WhatsAppIcon className="w-4 h-4 text-green-500" />,
    };

    const fullAddress = formatAddress(contact.address);

    return (
        <>
            <div className="h-full flex flex-col bg-background">
                <div className="flex justify-end items-center p-4 flex-shrink-0"><button onClick={onClose} className="p-1 rounded-full hover:bg-card"><CloseIcon className="w-6 h-6"/></button></div>
                <div className="flex-grow overflow-y-auto no-scrollbar p-6 pt-0 space-y-6">
                    <div className="flex flex-col items-center gap-4 text-center">
                        <div className="relative flex-shrink-0">
                             {contact.profilePicture ? (<img src={contact.profilePicture} alt="profile" className="w-24 h-24 rounded-full object-cover ring-4 ring-card" />) : (<div className="w-24 h-24 rounded-full bg-primary text-background flex items-center justify-center text-4xl font-bold">{initials}</div>)}
                        </div>
                        <div>
                             <div className="flex items-center justify-center gap-2 mb-1">
                                <h3 className="text-3xl font-bold">{contact.firstName} {contact.lastName}</h3>
                                {contact.isFavorite && <HeartIcon filled className="w-6 h-6 text-danger" />}
                            </div>
                             <p className="text-subtext">{contact.jobTitle}{contact.jobTitle && contact.company ? ' at ' : ''}{contact.company}</p>
                        </div>
                         {contact.isBlocked && <div className="text-xs font-semibold mt-2 px-3 py-1 bg-danger/20 text-danger rounded-full">Blocked</div>}
                    </div>

                    <div className="grid grid-cols-5 gap-2">
                        {actionButtons.map(btn => (
                            <button 
                                key={btn.type} 
                                disabled={isActionDisabled || btn.disabled} 
                                onClick={() => handleActionClick(btn.action, btn.type)} 
                                className="p-2 flex flex-col items-center justify-center gap-1 rounded-xl bg-card border border-border hover:border-primary/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {btn.icon}
                                <span className="text-xs font-semibold text-subtext">{btn.label}</span>
                            </button>
                        ))}
                    </div>

                    <div className="space-y-4">
                        <DetailCard icon={<CallIcon className="w-4 h-4"/>} title="Contact Info" hasContent={contact.phones.length > 0 || contact.emails.length > 0}>
                            {contact.phones.map((phone, i) => <LabeledInfo key={i} label={phone.label} value={phone.value} />)}
                            {contact.emails.map((email, i) => <LabeledInfo key={i} label={email.label} value={email.value} />)}
                        </DetailCard>
                         <DetailCard icon={<BriefcaseIcon className="w-4 h-4"/>} title="Other Info" hasContent={!!contact.nickname || (contact.tags && contact.tags.length > 0) || !!contact.website}>
                            {contact.nickname && <LabeledInfo label="Nickname" value={contact.nickname} />}
                            {contact.tags && contact.tags.length > 0 && <LabeledInfo label="Tags" value={<div className="flex flex-wrap gap-1">{contact.tags.map(t => <span key={t} className="text-xs font-semibold bg-primary-light text-primary px-2 py-1 rounded-full">{t}</span>)}</div>} />}
                            {contact.website && <LabeledInfo label="Website" value={contact.website} isLink />}
                        </DetailCard>
                        <DetailCard icon={<MapPinIcon className="w-4 h-4"/>} title="Address" hasContent={!!fullAddress}><p className="font-semibold">{fullAddress}</p></DetailCard>
                        <DetailCard icon={<CakeIcon className="w-4 h-4"/>} title="Birthday" hasContent={!!contact.birthday}>{contact.birthday && <LabeledInfo label={new Date(contact.birthday).toLocaleDateString(undefined, { month: 'long', day: 'numeric', timeZone: 'UTC' })} value={contact.birthday} />}</DetailCard>
                        <DetailCard icon={<LinkIcon className="w-4 h-4"/>} title="Linked Contacts" hasContent={true}>
                            <div className="space-y-2">
                                {(contact.linkedContactIds?.length ?? 0) > 0 ? (contact.linkedContactIds?.map(id => {
                                    const linked = allContacts.find(c => c.id === id);
                                    if (!linked) return null;
                                    return (<div key={id} className="flex items-center justify-between p-2 bg-background rounded-lg group">
                                        <button onClick={() => onSelectContact(id)} className="flex items-center gap-3 text-left w-full hover:opacity-80"><div className="w-8 h-8 rounded-full bg-primary text-background flex items-center justify-center text-sm font-bold flex-shrink-0">{`${linked.firstName[0]||''}${linked.lastName[0]||''}`}</div><p className="font-semibold text-sm">{linked.firstName} {linked.lastName}</p></button>
                                        <button onClick={() => onUnlinkContact(contact.id, id)} className="p-1 rounded-full text-danger hover:bg-danger/10 opacity-0 group-hover:opacity-100" title={`Unlink`}><CloseIcon className="w-4 h-4"/></button>
                                    </div>);
                                })) : (<p className="text-center text-sm text-subtext py-2">No linked contacts.</p>)}
                            </div>
                            <button onClick={onOpenLinkModal} className="w-full mt-2 text-sm font-semibold p-2 rounded-lg bg-background border border-border hover:bg-border flex items-center justify-center gap-2"><LinkIcon className="w-4 h-4" /> Link Contact</button>
                        </DetailCard>

                         <DetailCard icon={<ClockIcon className="w-4 h-4"/>} title="Recent Activity" hasContent={(contact.activityLog?.length ?? 0) > 0}>
                            <div className="space-y-3 max-h-60 overflow-y-auto no-scrollbar">
                               {(contact.activityLog ?? []).slice(0, 10).map(log => (<div key={log.id} className="flex items-start gap-3"><div className="p-1.5 bg-background rounded-full mt-0.5">{activityIcons[log.type]}</div><div><p className="font-semibold capitalize text-sm">{log.type.replace('_', ' ')}</p>{log.notes && <p className="text-xs text-text mt-1 italic">"{log.notes}"</p>}<p className="text-xs text-subtext mt-1">{formatFullDateTime(log.timestamp)}</p></div></div>))}
                            </div>
                        </DetailCard>
                    </div>
                </div>
                <div className="flex-shrink-0 p-4 grid grid-cols-2 gap-3 border-t border-border">
                    <button onClick={() => onOpenEditModal(contact)} className="font-semibold py-2 px-4 rounded-lg flex items-center justify-center gap-2 bg-card border border-border hover:bg-border transition-colors"><EditIcon className="w-4 h-4"/>Edit</button>
                    <button onClick={() => setShareModalOpen(true)} className="font-semibold py-2 px-4 rounded-lg flex items-center justify-center gap-2 bg-card border border-border hover:bg-border transition-colors"><QRIcon className="w-4 h-4"/>Share</button>
                    <button onClick={() => onArchive(contact.id, true)} className="font-semibold py-2 px-4 rounded-lg flex items-center justify-center gap-2 bg-card border border-border hover:bg-border transition-colors"><ArchiveBoxIcon className="w-4 h-4"/>Archive</button>
                    <button onClick={() => onBlock(contact.id, true)} className="font-semibold py-2 px-4 rounded-lg flex items-center justify-center gap-2 bg-card border border-border hover:bg-border transition-colors"><NoSymbolIcon className="w-4 h-4"/>Block</button>
                    <button onClick={handleDeleteClick} className="col-span-2 font-semibold py-2 px-4 rounded-lg flex items-center justify-center gap-2 text-danger bg-danger/10 hover:bg-danger/20 transition-colors"><TrashIcon className="w-4 h-4"/>Move to Trash</button>
                </div>
            </div>

            <ShareContactModal isOpen={isShareModalOpen} onClose={() => setShareModalOpen(false)} contact={contact}/>
            <LogActivityModal isOpen={isLogModalOpen} onClose={handleCloseLogModal} onSave={handleSaveLog} activityType={activityToLog} />
            
            {isDeleteConfirmOpen && (<div onClick={() => setDeleteConfirmOpen(false)} className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"><div onClick={e => e.stopPropagation()} className="bg-card rounded-lg shadow-xl w-full max-w-md p-6 animate-scale-in border border-border"><div className="sm:flex sm:items-start"><div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-danger/10 sm:mx-0"><ExclamationTriangleIcon className="h-6 w-6 text-danger" /></div><div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left"><h3 className="text-lg font-bold">Delete Contact</h3><p className="mt-2 text-sm text-subtext">Move {contact.firstName} {contact.lastName} to the trash?</p></div></div><div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse"><button type="button" className="w-full justify-center rounded-lg shadow-sm px-4 py-2 bg-danger hover:bg-danger/90 text-base font-medium text-white sm:ml-3 sm:w-auto" onClick={confirmDelete}>Move to Trash</button><button type="button" className="mt-3 w-full justify-center rounded-lg shadow-sm px-4 py-2 bg-card border border-border sm:mt-0 sm:w-auto" onClick={() => setDeleteConfirmOpen(false)}>Cancel</button></div></div></div>)}
        </>
    );
};

export default ContactDetailPage;