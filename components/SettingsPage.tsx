
import React, { useState, useMemo } from 'react';
import { DisplaySettings, Contact, Theme, ActivityType, ChatSession, BackupData, CalendarEvent } from '../types';
import { 
    ExclamationTriangleIcon, ArchiveBoxIcon, NoSymbolIcon, 
    TrashIcon, DocumentDuplicateIcon, ArrowUturnLeftIcon, SunIcon, UsersIcon, CloseIcon, ClipboardDocumentListIcon, EyeIcon,
    DownloadIcon, ShareIcon
} from './icons';
import MergeContactsModal from './MergeContactsModal';

type SettingsTab = 'appearance' | 'contactList' | 'data' | 'archived' | 'blocked' | 'trash' | 'duplicates';

const EmptyState: React.FC<{ icon: React.ReactNode, title: string; message: string }> = ({ icon, title, message }) => (
    <div className="text-center py-16 bg-card rounded-xl border border-border">
        <div className="mx-auto h-16 w-16 text-gray-400 flex items-center justify-center">{icon}</div>
        <h3 className="mt-2 text-xl font-medium">{title}</h3>
        <p className="mt-1 text-sm text-subtext">{message}</p>
    </div>
);

const ContactActionItem: React.FC<{ contact: Contact; children: React.ReactNode }> = ({ contact, children }) => (
    <div className="flex items-center justify-between p-4 bg-background rounded-lg">
        <div>
            <p className="font-semibold">{contact.firstName} {contact.lastName}</p>
            <p className="text-sm text-subtext">{contact.phones[0]?.value || contact.emails[0]?.value || 'No contact info'}</p>
        </div>
        <div className="flex items-center space-x-2">{children}</div>
    </div>
);

const ToggleSwitch: React.FC<{ label: string; checked: boolean; onChange: (checked: boolean) => void; }> = ({ label, checked, onChange }) => (
    <div className="flex items-center justify-between py-4">
        <span className="text-md font-medium">{label}</span>
        <button
            type="button"
            role="switch"
            aria-checked={checked}
            onClick={() => onChange(!checked)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-300 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary ring-offset-card ${checked ? 'bg-primary' : 'bg-border'}`}
        >
            <span
                className={`inline-block h-4 w-4 transform rounded-full bg-background shadow-lg transition-transform duration-300 ease-in-out ${checked ? 'translate-x-6' : 'translate-x-1'}`}
            />
        </button>
    </div>
);

const SettingsCard: React.FC<{title: string; children: React.ReactNode}> = ({ title, children }) => (
     <div className="bg-card p-6 rounded-xl border border-border">
        <h2 className="text-2xl font-bold mb-4">{title}</h2>
        <div className="divide-y divide-border">{children}</div>
    </div>
);

const downloadFile = (content: string, filename: string, contentType: string) => {
    const blob = new Blob([content], { type: contentType });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);
};

const generateComprehensiveReportCSV = (allContacts: Contact[], startDate?: string, endDate?: string): string => {
    let contactsToReport = allContacts;
    let dateRangeString = 'All Time';

    if (startDate && endDate) {
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        dateRangeString = `${start.toLocaleDateString()} to ${end.toLocaleDateString()}`;

        contactsToReport = allContacts.filter(c => {
            const createdAt = new Date(c.createdAt);
            return createdAt >= start && createdAt <= end;
        });
    }

    const active = contactsToReport.filter(c => !c.isArchived && !c.isBlocked && !c.deletedAt);
    const archived = contactsToReport.filter(c => c.isArchived && !c.deletedAt);
    const blocked = contactsToReport.filter(c => c.isBlocked && !c.deletedAt);
    const trash = contactsToReport.filter(c => c.deletedAt);
    let csvContent = `CONTACTS REPORT SUMMARY\nGenerated On,${new Date().toLocaleString()}\nDate Range,${dateRangeString}\nTotal Contacts,${contactsToReport.length}\nActive,${active.length}\nArchived,${archived.length}\nBlocked,${blocked.length}\nIn Trash,${trash.length}\n\n`;
    
    const addSection = (title: string, contacts: Contact[], extraHeaders: string[] = [], extraDataExtractor: (c: Contact) => (string|undefined)[] = () => []) => {
        if (contacts.length === 0) return;
        csvContent += `${title}\n`;
        const headers = ['First Name', 'Last Name', 'Company', 'Primary Phone', 'Primary Email', 'Tags', 'Created At', 'Activity Log', ...extraHeaders];
        csvContent += headers.join(',') + '\n';
        contacts.forEach(c => {
            const row = [ c.firstName, c.lastName, c.company, c.phones[0]?.value, c.emails[0]?.value, c.tags.join('; '), new Date(c.createdAt).toLocaleDateString(), c.activityLog?.map(l => `${l.type} at ${new Date(l.timestamp).toLocaleString()}`).join('; '), ...extraDataExtractor(c) ];
            csvContent += row.map(v => `"${String(v || '').replace(/"/g, '""')}"`).join(',') + '\n';
        });
        csvContent += '\n';
    };
    addSection("ACTIVE CONTACTS", active);
    addSection("ARCHIVED CONTACTS", archived);
    addSection("BLOCKED CONTACTS", blocked);
    addSection("TRASH", trash, ['Deleted At'], c => [c.deletedAt ? new Date(c.deletedAt).toLocaleString() : '']);
    return csvContent;
};

interface SettingsPageProps {
    settings: DisplaySettings;
    setSettings: React.Dispatch<React.SetStateAction<DisplaySettings>>;
    contacts: Contact[];
    setContacts: (updater: (current: Contact[]) => Contact[], label: string) => void;
    theme: Theme;
    toggleTheme: () => void;
    clearHistory: () => void;
    archivedContacts: Contact[];
    blockedContacts: Contact[];
    trashContacts: Contact[];
    onUnarchive: (id: string) => void;
    onUnblock: (id: string) => void;
    onRestore: (id: string) => void;
    onDeletePermanently: (id: string) => void;
    onMergeContacts: (contactToKeep: Contact, idsToRemove: string[]) => void;
    chatSessions: ChatSession[];
    onRestoreFromBackup: (backupData: BackupData) => void;
    calendarEvents: CalendarEvent[];
}
interface ImportSummary { success: number; skipped: number; errors: string[]; }
interface ImportPreview { contacts: Contact[]; summary: ImportSummary; }

type ConfirmationState = {
    type: 'unarchiveAll' | 'unblockAll' | 'restoreAll' | 'emptyTrash' | 'restoreBackup';
    title: string;
    message: string;
    onConfirm: () => void;
} | null;

type ReportType = 'all' | 'today' | 'week' | 'month' | 'year' | 'custom';

const ReportDateButton: React.FC<{ label: string, type: ReportType, activeType: ReportType, onClick: (type: ReportType) => void }> = ({ label, type, activeType, onClick }) => (
    <button onClick={() => onClick(type)} className={`px-3 py-1.5 text-sm font-semibold rounded-md transition-colors ${activeType === type ? 'bg-primary text-background' : 'bg-background hover:bg-border'}`}>{label}</button>
);


const SettingsPage: React.FC<SettingsPageProps> = (props) => {
    const { 
        settings, setSettings, contacts, setContacts: setContactsWithHistory, theme, toggleTheme, clearHistory, 
        archivedContacts, blockedContacts, trashContacts, onUnarchive, onUnblock, onRestore, onDeletePermanently, 
        onMergeContacts, chatSessions, onRestoreFromBackup, calendarEvents
    } = props;
    const [activeTab, setActiveTab] = useState<SettingsTab>('data');
    const [isImportExportModalOpen, setImportExportModalOpen] = useState(false);
    const [importPreview, setImportPreview] = useState<ImportPreview | null>(null);
    const [isReportModalOpen, setReportModalOpen] = useState(false);
    const [importSummary, setImportSummary] = useState<ImportSummary | null>(null);
    
    const [reportType, setReportType] = useState<ReportType>('all');
    const [reportStartDate, setReportStartDate] = useState('');
    const [reportEndDate, setReportEndDate] = useState('');

    const [isClearHistoryConfirmOpen, setClearHistoryConfirmOpen] = useState(false);
    const [contactToDeletePermanently, setContactToDeletePermanently] = useState<Contact | null>(null);
    const [mergingContacts, setMergingContacts] = useState<Contact[] | null>(null);
    const [confirmation, setConfirmation] = useState<ConfirmationState>(null);
    const [restoreData, setRestoreData] = useState<BackupData | null>(null);

    const handleSettingChange = (key: keyof DisplaySettings, value: boolean) => setSettings(prev => ({ ...prev, [key]: value }));
    const handleClearHistory = () => { clearHistory(); setClearHistoryConfirmOpen(false); };

    const handleImportFileSelected = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (e) => {
            const summary: ImportSummary = { success: 0, skipped: 0, errors: [] };
            try {
                const text = e.target?.result as string;
                const rows = text.trim().split('\n');
                const headers = rows.shift()?.split(',').map(h => h.trim().toLowerCase()) || [];
                const required = ['first name', 'last name', 'primary phone'];
                if (!required.every(h => headers.includes(h))) throw new Error("CSV must include 'First Name', 'Last Name', and 'Primary Phone' columns.");
                
                const imported = rows.map((row, i) => {
                    const values = row.split(',');
                    const contactData = headers.reduce((obj, header, index) => ({...obj, [header]: values[index]}), {} as any);
                    if (!contactData['first name'] || !contactData['last name'] || !contactData['primary phone']) {
                        summary.skipped++; summary.errors.push(`Row ${i + 2}: Missing required fields.`); return null;
                    }
                    return { id: `${Date.now()}-${i}`, firstName: contactData['first name'], lastName: contactData['last name'], phones: [{label: 'mobile', value: contactData['primary phone']}], emails: [], tags: [], createdAt: new Date().toISOString(), isFavorite: false } as Contact;
                }).filter(Boolean) as Contact[];
                summary.success = imported.length;
                setImportPreview({ contacts: imported, summary });
            } catch (error) {
                summary.errors.push(`Import failed: ${(error as Error).message}`);
                setImportSummary(summary);
            }
        };
        reader.readAsText(file);
    };
    const confirmImport = () => {
        if (!importPreview) return;
        props.setContacts(prev => [...importPreview.contacts, ...prev], `Imported ${importPreview.contacts.length} contacts`);
        setImportSummary(importPreview.summary);
        setImportPreview(null);
    };
    
    const handleGenerateReport = () => {
        if (contacts.length === 0) { alert('No contacts to report.'); return; }

        const today = new Date();
        let startDate: string | undefined;
        let endDate: string | undefined;

        switch (reportType) {
            case 'today':
                startDate = endDate = today.toISOString().split('T')[0];
                break;
            case 'week':
                const firstDayOfWeek = new Date(today.setDate(today.getDate() - today.getDay()));
                const lastDayOfWeek = new Date(firstDayOfWeek);
                lastDayOfWeek.setDate(lastDayOfWeek.getDate() + 6);
                startDate = firstDayOfWeek.toISOString().split('T')[0];
                endDate = lastDayOfWeek.toISOString().split('T')[0];
                break;
            case 'month':
                const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
                const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
                startDate = firstDayOfMonth.toISOString().split('T')[0];
                endDate = lastDayOfMonth.toISOString().split('T')[0];
                break;
            case 'year':
                 const firstDayOfYear = new Date(today.getFullYear(), 0, 1);
                 const lastDayOfYear = new Date(today.getFullYear(), 11, 31);
                 startDate = firstDayOfYear.toISOString().split('T')[0];
                 endDate = lastDayOfYear.toISOString().split('T')[0];
                break;
            case 'custom':
                startDate = reportStartDate;
                endDate = reportEndDate;
                break;
            default: // 'all'
                startDate = endDate = undefined;
        }
        
        const csv = generateComprehensiveReportCSV(contacts, startDate, endDate);
        downloadFile(csv, `contacts_report_${new Date().toISOString().split('T')[0]}.csv`, 'text/csv;charset=utf-8;');
        setReportModalOpen(false);
    };

    const duplicateContacts = useMemo(() => {
        const duplicates: Contact[][] = [];
        const checked = new Set<string>();
        const nonDeleted = contacts.filter(c => !c.deletedAt);
        for (let i = 0; i < nonDeleted.length; i++) {
            if (checked.has(nonDeleted[i].id)) continue;
            const group = [nonDeleted[i]];
            const name1 = `${nonDeleted[i].firstName} ${nonDeleted[i].lastName}`.toLowerCase().trim();
            const phone1 = nonDeleted[i].phones[0]?.value;
            for (let j = i + 1; j < nonDeleted.length; j++) {
                if (checked.has(nonDeleted[j].id)) continue;
                const name2 = `${nonDeleted[j].firstName} ${nonDeleted[j].lastName}`.toLowerCase().trim();
                const phone2 = nonDeleted[j].phones[0]?.value;
                if (name1 === name2 || (phone1 && phone2 && phone1 === phone2)) group.push(nonDeleted[j]);
            }
            if (group.length > 1) {
                duplicates.push(group);
                group.forEach(c => checked.add(c.id));
            }
        }
        return duplicates;
    }, [contacts]);
    const handleSaveMerge = (contactToKeep: Contact, idsToRemove: string[]) => { onMergeContacts(contactToKeep, idsToRemove); setMergingContacts(null); };
    
    const handleBackup = () => {
        const backupData: BackupData = {
            version: 1,
            contacts,
            calendarEvents,
            theme,
            displaySettings: settings,
            chatSessions,
        };
        const jsonString = JSON.stringify(backupData, null, 2);
        const date = new Date().toISOString().split('T')[0];
        downloadFile(jsonString, `contacts-manager-backup-${date}.json`, 'application/json');
    };

    const handleRestoreFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const data = JSON.parse(event.target?.result as string) as BackupData;
                if (data.version === 1 && data.contacts && data.theme && data.displaySettings && data.chatSessions) {
                    setRestoreData(data);
                    setConfirmation({
                        type: 'restoreBackup',
                        title: 'Restore Backup?',
                        message: 'This will overwrite all current data in the application. This action cannot be undone.',
                        onConfirm: () => confirmRestore(data),
                    });
                } else {
                    alert('Invalid or corrupted backup file.');
                }
            } catch (error) {
                alert('Error reading or parsing backup file.');
            }
        };
        reader.readAsText(file);
        e.target.value = ''; // Reset file input to allow selecting the same file again
    };
    
    const confirmRestore = (data: BackupData) => {
        onRestoreFromBackup(data);
        setConfirmation(null);
        setRestoreData(null);
    };

    // --- Bulk Action Handlers ---
    const handleUnarchiveAll = () => {
        const ids = archivedContacts.map(c => c.id);
        setContactsWithHistory(prev => prev.map(c => ids.includes(c.id) ? { ...c, isArchived: false } : c), `Unarchived ${ids.length} contacts`);
        setConfirmation(null);
    };
    const handleUnblockAll = () => {
        const ids = blockedContacts.map(c => c.id);
        setContactsWithHistory(prev => prev.map(c => ids.includes(c.id) ? { ...c, isBlocked: false } : c), `Unblocked ${ids.length} contacts`);
        setConfirmation(null);
    };
    const handleRestoreAll = () => {
        const ids = trashContacts.map(c => c.id);
        setContactsWithHistory(prev => prev.map(c => ids.includes(c.id) ? { ...c, deletedAt: undefined } : c), `Restored ${ids.length} contacts`);
        setConfirmation(null);
    };
    const handleEmptyTrash = () => {
        const ids = trashContacts.map(c => c.id);
        setContactsWithHistory(prev => prev.filter(c => !ids.includes(c.id)), `Emptied trash (${ids.length} contacts)`);
        setConfirmation(null);
    };

    const SidebarNavItem: React.FC<{ tabId: SettingsTab; label: string; icon: React.ReactNode }> = ({ tabId, label, icon }) => (
        <button onClick={() => setActiveTab(tabId)} className={`w-full flex items-center gap-3 px-4 py-3 text-left font-semibold rounded-lg transition-colors ${activeTab === tabId ? 'bg-primary-light text-primary' : 'hover:bg-background'}`}>{icon} {label}</button>
    );

    const renderContent = () => {
        return <div key={activeTab} className="animate-fade-in-up">
            { activeTab === 'appearance' && <SettingsCard title="Appearance"><ToggleSwitch label="Dark Mode" checked={theme === 'dark'} onChange={toggleTheme} /></SettingsCard>}
            { activeTab === 'contactList' && <SettingsCard title="Contact List Display"><ToggleSwitch label="Display profile pictures" checked={settings.showProfilePictures} onChange={c=>handleSettingChange('showProfilePictures', c)} /><ToggleSwitch label="Display contact number" checked={settings.showContactNumber} onChange={c=>handleSettingChange('showContactNumber',c)} /><ToggleSwitch label="Show contacts with numbers only" checked={settings.showOnlyWithNumbers} onChange={c=>handleSettingChange('showOnlyWithNumbers',c)} /></SettingsCard>}
            { activeTab === 'data' && <SettingsCard title="Data Management">
                <button onClick={()=>setImportExportModalOpen(true)} className="w-full text-left font-medium py-3 hover:text-primary">Import/Export Contacts (CSV)</button>
                <button onClick={()=>setReportModalOpen(true)} className="w-full text-left font-medium py-3 hover:text-primary">Generate Report</button>
                <button onClick={handleBackup} className="w-full text-left font-medium py-3 hover:text-primary flex items-center gap-3"><DownloadIcon className="w-5 h-5"/>Backup All Data</button>
                <label className="w-full text-left font-medium py-3 hover:text-primary flex items-center gap-3 cursor-pointer"><ShareIcon className="w-5 h-5"/>Restore from Backup<input type="file" className="hidden" accept=".json" onChange={handleRestoreFileSelected} /></label>
                <button onClick={()=>setClearHistoryConfirmOpen(true)} className="w-full text-left font-medium py-3 text-danger hover:bg-danger/5">Clear Edit History</button>
                </SettingsCard>}
            { activeTab === 'archived' && (archivedContacts.length === 0 ? <EmptyState icon={<ArchiveBoxIcon className="w-12 h-12"/>} title="No Archived Contacts" message="Archive contacts to hide them." /> : <div><div className="flex justify-end items-center mb-4 p-2 bg-card border border-border rounded-xl"><button onClick={() => setConfirmation({ type: 'unarchiveAll', title: 'Unarchive All?', message: `Are you sure you want to unarchive all ${archivedContacts.length} contacts?`, onConfirm: handleUnarchiveAll })} className="font-semibold text-sm py-2 px-4 rounded-lg flex items-center gap-2 bg-background hover:bg-border transition-colors"><ArrowUturnLeftIcon className="w-4 h-4" /> Unarchive All ({archivedContacts.length})</button></div><div className="space-y-4">{archivedContacts.map(c => <ContactActionItem key={c.id} contact={c}><button onClick={() => onUnarchive(c.id)} className="font-semibold text-sm text-primary hover:underline">Unarchive</button></ContactActionItem>)}</div></div>)}
            { activeTab === 'blocked' && (blockedContacts.length === 0 ? <EmptyState icon={<NoSymbolIcon className="w-12 h-12"/>} title="No Blocked Contacts" message="Blocked contacts cannot call or message." /> : <div><div className="flex justify-end items-center mb-4 p-2 bg-card border border-border rounded-xl"><button onClick={() => setConfirmation({ type: 'unblockAll', title: 'Unblock All?', message: `Are you sure you want to unblock all ${blockedContacts.length} contacts?`, onConfirm: handleUnblockAll })} className="font-semibold text-sm py-2 px-4 rounded-lg flex items-center gap-2 bg-background hover:bg-border transition-colors"><ArrowUturnLeftIcon className="w-4 h-4" /> Unblock All ({blockedContacts.length})</button></div><div className="space-y-4">{blockedContacts.map(c => <ContactActionItem key={c.id} contact={c}><button onClick={() => onUnblock(c.id)} className="font-semibold text-sm text-primary hover:underline">Unblock</button></ContactActionItem>)}</div></div>)}
            { activeTab === 'trash' && (trashContacts.length === 0 ? <EmptyState icon={<TrashIcon className="w-12 h-12"/>} title="Trash is Empty" message="Deleted contacts appear here." /> : <div><div className="flex justify-end items-center gap-2 mb-4 p-2 bg-card border border-border rounded-xl"><button onClick={() => setConfirmation({ type: 'restoreAll', title: 'Restore All?', message: `Are you sure you want to restore all ${trashContacts.length} contacts?`, onConfirm: handleRestoreAll })} className="font-semibold text-sm py-2 px-4 rounded-lg flex items-center gap-2 bg-background hover:bg-border transition-colors"><ArrowUturnLeftIcon className="w-4 h-4" /> Restore All ({trashContacts.length})</button><button onClick={() => setConfirmation({ type: 'emptyTrash', title: 'Empty Trash?', message: `Permanently delete all ${trashContacts.length} contacts? This cannot be undone.`, onConfirm: handleEmptyTrash })} className="font-semibold text-sm py-2 px-4 rounded-lg flex items-center gap-2 bg-danger/10 text-danger hover:bg-danger/20 transition-colors"><TrashIcon className="w-4 h-4" /> Empty Trash</button></div><div className="space-y-4">{trashContacts.map(c => (<ContactActionItem key={c.id} contact={c}><button onClick={() => onRestore(c.id)} className="font-semibold text-sm text-blue-500 hover:underline flex items-center gap-1"><ArrowUturnLeftIcon className="w-4 h-4" /> Restore</button><button onClick={() => setContactToDeletePermanently(c)} className="font-semibold text-sm text-danger hover:underline">Delete Permanently</button></ContactActionItem>))}</div></div>)}
            { activeTab === 'duplicates' && (duplicateContacts.length === 0 ? <EmptyState icon={<DocumentDuplicateIcon className="w-12 h-12"/>} title="No Duplicates Found" message="No contacts with similar details." /> : <div className="space-y-6">{duplicateContacts.map((group, i) => (<div key={i} className="p-4 bg-card rounded-lg border border-border"><div className="flex justify-between items-center mb-2"><h3 className="font-bold">Duplicate Group</h3><button onClick={() => setMergingContacts(group)} className="font-semibold text-sm bg-primary text-background py-1 px-3 rounded-lg hover:opacity-90">Merge</button></div><div className="space-y-2">{group.map(c => (<div key={c.id} className="p-2 bg-background rounded"><p className="font-semibold">{c.firstName} {c.lastName}</p><p className="text-sm text-subtext">{c.phones[0]?.value}</p></div>))}</div></div>))}</div>)}
        </div>
    };
    
    return <>
    <div className="h-full flex flex-col">
        <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 flex-shrink-0">
            <h1 className="text-4xl font-bold tracking-tight text-text my-8">Settings</h1>
        </div>
        <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 flex-grow flex flex-col md:flex-row gap-8 lg:gap-12 overflow-hidden">
            <nav className="md:w-1/3 lg:w-1/4 flex-shrink-0">
                <div className="space-y-4 sticky top-8">
                    <div>
                        <h2 className="text-sm font-bold text-subtext uppercase tracking-wider px-4 mb-2">General</h2>
                        <div className="space-y-1">
                            <SidebarNavItem tabId="appearance" label="Appearance" icon={<EyeIcon className="w-5 h-5"/>} />
                            <SidebarNavItem tabId="contactList" label="Contact List" icon={<UsersIcon className="w-5 h-5"/>} />
                            <SidebarNavItem tabId="data" label="Data" icon={<ClipboardDocumentListIcon className="w-5 h-5"/>} />
                        </div>
                    </div>
                    <div>
                        <h2 className="text-sm font-bold text-subtext uppercase tracking-wider px-4 mb-2">Management</h2>
                        <div className="space-y-1">
                            <SidebarNavItem tabId="archived" label="Archived" icon={<ArchiveBoxIcon className="w-5 h-5"/>} />
                            <SidebarNavItem tabId="blocked" label="Blocked" icon={<NoSymbolIcon className="w-5 h-5"/>} />
                            <SidebarNavItem tabId="trash" label="Trash" icon={<TrashIcon className="w-5 h-5"/>} />
                            <SidebarNavItem tabId="duplicates" label="Duplicates" icon={<DocumentDuplicateIcon className="w-5 h-5"/>} />
                        </div>
                    </div>
                </div>
            </nav>
            <main className="flex-grow overflow-y-auto no-scrollbar pb-8 pr-2">
                {renderContent()}
            </main>
        </div>
    </div>
        {isImportExportModalOpen && <div onClick={() => setImportExportModalOpen(false)} className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"><div onClick={e => e.stopPropagation()} className="bg-card rounded-lg shadow-xl w-full max-w-md p-6 animate-scale-in"><div className="flex justify-between items-center mb-4"><h2 className="text-xl font-bold">Import/Export</h2><button onClick={() => setImportExportModalOpen(false)}><CloseIcon className="w-6 h-6"/></button></div><div className="space-y-4"><div><h3 className="font-semibold mb-2">Export Contacts</h3><p className="text-sm text-subtext mb-2">Download active contacts as CSV.</p><button onClick={()=>{downloadFile(generateComprehensiveReportCSV(contacts.filter(c=>!c.deletedAt)), 'contacts.csv', 'text/csv;charset=utf-8;'); setImportExportModalOpen(false)}} className="w-full bg-primary text-background font-bold py-2 px-4 rounded-lg hover:opacity-90">Export</button></div><div className="border-t border-border my-2"></div><div><h3 className="font-semibold mb-2">Import Contacts</h3><p className="text-sm text-subtext mb-2">Add contacts from a CSV file.</p><input type="file" id="import" className="hidden" accept=".csv" onChange={handleImportFileSelected} /><label htmlFor="import" className="w-full block text-center bg-background border font-bold py-2 px-4 rounded-lg cursor-pointer hover:bg-border">Choose File</label></div></div></div></div>}
        {(importPreview || importSummary) && <div onClick={() => { setImportPreview(null); setImportSummary(null); }} className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"><div onClick={e => e.stopPropagation()} className="bg-card rounded-lg shadow-xl w-full max-w-lg p-6 animate-scale-in"><h2 className="text-xl font-bold mb-4">{importPreview ? 'Confirm Import' : 'Import Summary'}</h2>{importPreview && (<><p>Add <span className="font-bold">{importPreview.summary.success}</span> new contacts?</p><div className="flex justify-end gap-2 mt-4"><button onClick={() => setImportPreview(null)}>Cancel</button><button onClick={confirmImport} className="bg-primary text-background font-bold py-2 px-4 rounded-lg">Import</button></div></>)}{importSummary && !importPreview && (<div className="space-y-4"><div className="flex justify-around text-center"><div><p className="text-3xl font-bold text-success">{importSummary.success}</p><p>Imported</p></div><div><p className="text-3xl font-bold text-warning">{importSummary.skipped}</p><p>Skipped</p></div></div>{importSummary.errors.length > 0 && <div className="bg-background p-3 rounded-lg max-h-48 overflow-y-auto"><h3 className="font-semibold mb-2">Errors</h3><ul className="list-disc list-inside text-sm">{importSummary.errors.map((e, i) => <li key={i}>{e}</li>)}</ul></div>}<button onClick={()=>{setImportPreview(null); setImportSummary(null)}} className="bg-primary text-background font-bold py-2 px-4 rounded-lg w-full mt-4">Close</button></div>)}</div></div>}
        {isReportModalOpen && <div onClick={() => setReportModalOpen(false)} className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"><div onClick={e => e.stopPropagation()} className="bg-card rounded-lg shadow-xl w-full max-w-lg p-6 animate-scale-in"><h2 className="text-xl font-bold mb-4">Generate Report</h2><div className="space-y-4 mb-6"><div className="flex flex-wrap items-center gap-2 p-1 bg-card border border-border rounded-lg"><ReportDateButton label="All Time" type="all" activeType={reportType} onClick={setReportType} /><ReportDateButton label="Today" type="today" activeType={reportType} onClick={setReportType} /><ReportDateButton label="This Week" type="week" activeType={reportType} onClick={setReportType} /><ReportDateButton label="This Month" type="month" activeType={reportType} onClick={setReportType} /><ReportDateButton label="This Year" type="year" activeType={reportType} onClick={setReportType} /><ReportDateButton label="Custom" type="custom" activeType={reportType} onClick={setReportType} /></div>{reportType === 'custom' && <div className="flex items-center gap-4 animate-fade-in-up"><input type="date" value={reportStartDate} onChange={e => setReportStartDate(e.target.value)} className="w-full p-2 bg-background rounded-md border border-border" /><span className="text-subtext">to</span><input type="date" value={reportEndDate} onChange={e => setReportEndDate(e.target.value)} className="w-full p-2 bg-background rounded-md border border-border" /></div>}</div><button onClick={handleGenerateReport} disabled={reportType === 'custom' && (!reportStartDate || !reportEndDate)} className="w-full bg-primary text-background font-bold py-2.5 px-4 rounded-lg hover:bg-primary-hover disabled:opacity-50">Generate & Download</button></div></div>}
        {isClearHistoryConfirmOpen && <div onClick={() => setClearHistoryConfirmOpen(false)} className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"><div onClick={e => e.stopPropagation()} className="bg-card rounded-lg shadow-xl w-full max-w-md p-6"><h3 className="text-lg font-bold">Clear Edit History?</h3><p className="text-sm my-4">This action cannot be undone.</p><div className="flex justify-end gap-2"><button onClick={() => setClearHistoryConfirmOpen(false)}>Cancel</button><button onClick={handleClearHistory} className="bg-danger text-white font-bold py-2 px-4 rounded-lg">Clear</button></div></div></div>}
        {contactToDeletePermanently && <div onClick={() => setContactToDeletePermanently(null)} className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"><div onClick={e => e.stopPropagation()} className="bg-card rounded-lg shadow-xl w-full max-w-md p-6"><h3 className="text-lg font-bold">Permanently Delete?</h3><p className="text-sm my-4">This cannot be undone.</p><div className="flex justify-end gap-2"><button onClick={() => setContactToDeletePermanently(null)}>Cancel</button><button onClick={() => {onDeletePermanently(contactToDeletePermanently.id); setContactToDeletePermanently(null);}} className="bg-danger text-white font-bold py-2 px-4 rounded-lg">Delete</button></div></div></div>}
        {mergingContacts && <MergeContactsModal isOpen={!!mergingContacts} onClose={() => setMergingContacts(null)} onSave={handleSaveMerge} contacts={mergingContacts} />}
        {confirmation && (
            <div onClick={() => setConfirmation(null)} className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                <div onClick={e => e.stopPropagation()} className="bg-card rounded-lg shadow-xl w-full max-w-md p-6 animate-scale-in border border-border">
                    <div className="sm:flex sm:items-start">
                        <div className={`mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full ${['emptyTrash', 'restoreBackup'].includes(confirmation.type) ? 'bg-danger/10' : 'bg-primary/10'} sm:mx-0`}>
                            <ExclamationTriangleIcon className={`h-6 w-6 ${['emptyTrash', 'restoreBackup'].includes(confirmation.type) ? 'text-danger' : 'text-primary'}`} />
                        </div>
                        <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                            <h3 className="text-lg font-bold">{confirmation.title}</h3>
                            <p className="mt-2 text-sm text-subtext">{confirmation.message}</p>
                        </div>
                    </div>
                    <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
                        <button type="button" className={`w-full justify-center rounded-lg shadow-sm px-4 py-2 text-base font-medium sm:ml-3 sm:w-auto ${['emptyTrash', 'restoreBackup'].includes(confirmation.type) ? 'bg-danger hover:bg-danger/90 text-white' : 'bg-primary hover:bg-primary-hover text-background'}`} onClick={confirmation.onConfirm}>
                            {confirmation.type === 'unarchiveAll' && 'Unarchive All'}
                            {confirmation.type === 'unblockAll' && 'Unblock All'}
                            {confirmation.type === 'restoreAll' && 'Restore All'}
                            {confirmation.type === 'emptyTrash' && 'Empty Trash'}
                            {confirmation.type === 'restoreBackup' && 'Restore'}
                        </button>
                        <button type="button" className="mt-3 w-full justify-center rounded-lg shadow-sm px-4 py-2 bg-background border border-border sm:mt-0 sm:w-auto" onClick={() => setConfirmation(null)}>Cancel</button>
                    </div>
                </div>
            </div>
        )}
    </>;
};

export default SettingsPage;