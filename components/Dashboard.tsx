

import React, { useMemo, useState } from 'react';
import { Contact, CalendarEvent } from '../types';
import { CakeIcon, WhatsAppIcon, EditIcon, TrashIcon, PlusIcon, CalendarIcon, ChevronLeftIcon, ChevronRightIcon, UsersIcon, HeartIcon, CallIcon, CloseIcon } from './icons';

const SpinnerIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" {...props}>
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
);

const birthdayWishTemplates = `
For Family Members
1. For Mother: Happy Birthday, Mom! You’re my biggest blessing and my forever support. Thank you for your endless love, care, and strength. Wishing you a day full of smiles and peace!
2. For Father: Happy Birthday, Dad! You’ve taught me so much and always stood by me. May your special day be filled with happiness, health, and all your favorite things.
3. For Brother: Happy Birthday, bro! You’re not just my brother but my best buddy. Have an amazing day filled with fun, laughter, and success ahead!
4. For Sister: Happy Birthday, sis! You’re my sunshine and my secret keeper. May your life be filled with love, laughter, and endless joy.

For Friends
1. Close Friend: Happy Birthday to my best friend! Thank you for always being there through thick and thin. Wishing you laughter, love, and every dream come true.
2. School/College Friend: Happy Birthday! From all our crazy memories to the fun times we shared, I’m so lucky to have you in my life. Have a fantastic day!
3. Work Friend: Happy Birthday! Wishing you a successful year ahead filled with good health, achievements, and happy moments. You make work so much better!
`;

interface DashboardPageProps {
    contacts: Contact[];
    events: CalendarEvent[];
    onSelectContact: (id: string) => void;
    onOpenAddModal: () => void;
    onOpenEditModal: (event: CalendarEvent) => void;
    onDeleteEvent: (id: string) => void;
}

const StatCard: React.FC<{ icon: React.ReactNode; label: string; value: number | string; colorClass: string }> = ({ icon, label, value, colorClass }) => (
    <div className={`flex items-center p-4 bg-card rounded-xl border border-border gap-4`}>
        <div className={`p-3 rounded-lg ${colorClass}`}>
            {icon}
        </div>
        <div>
            <p className="text-3xl font-bold">{value}</p>
            <p className="text-sm font-semibold text-subtext">{label}</p>
        </div>
    </div>
);


const CalendarView: React.FC<DashboardPageProps & { onClose: () => void, initialDate?: Date }> = ({ contacts, events, onSelectContact, onOpenEditModal, onDeleteEvent, onClose, initialDate }) => {
    const [wishingContactId, setWishingContactId] = useState<string | null>(null);
    const [currentDate, setCurrentDate] = useState(initialDate || new Date());

    const allEvents = useMemo(() => {
        const birthdayEvents = contacts
            .filter(c => c.birthday)
            .map(contact => ({
                id: `birthday-${contact.id}`,
                date: new Date(contact.birthday + 'T00:00:00'),
                title: `${contact.firstName} ${contact.lastName}'s Birthday`,
                type: 'Birthday' as const,
                contact: contact,
                isRecurring: true,
            }));
        
        const customEvents = events.map(event => ({
            id: event.id,
            date: new Date(event.date + 'T00:00:00'),
            title: event.title,
            type: event.type,
            eventData: event,
            isRecurring: event.repeat === 'Yearly',
        }));
        return [...birthdayEvents, ...customEvents];
    }, [contacts, events]);

     const monthlyEvents = useMemo(() => {
        const month = currentDate.getMonth();
        const year = currentDate.getFullYear();
        const today = new Date();
        today.setHours(0,0,0,0);

        return allEvents
            .map(e => {
                let occurrences = [];
                let eventDate = new Date(e.date);
                if (e.isRecurring) {
                    // Check for this year
                    let thisYearDate = new Date(eventDate);
                    thisYearDate.setFullYear(year);
                    if (thisYearDate.getMonth() === month) {
                         occurrences.push({ ...e, date: thisYearDate });
                    }
                } else if (eventDate.getFullYear() === year && eventDate.getMonth() === month) {
                     occurrences.push({ ...e, date: eventDate });
                }
                return occurrences;
            })
            .flat()
            .sort((a, b) => a.date.getDate() - b.date.getDate());
    }, [allEvents, currentDate]);

    const handleWishOnWhatsApp = async (contact: Contact) => {
        const phone = contact.phones[0]?.value;
        if (!phone) return;
    
        setWishingContactId(contact.id);
        let birthdayMessage = `Happy Birthday, ${contact.firstName}! Wishing you a fantastic day! 🎉`;

        try {
            const prompt = `You are an AI assistant helping me write a birthday wish. My contact's name is ${contact.firstName}. Their relationship to me is: ${contact.group || 'friend'}. Based on this, please generate a cheerful and personal happy birthday wish. Use the following templates as inspiration, picking the one that best fits the relationship. Adapt it to sound natural. Keep it short and include a nice emoji. --- TEMPLATES --- ${birthdayWishTemplates} --- END TEMPLATES ---`;
            const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${process.env.API_KEY}`,
                },
                body: JSON.stringify({
                    model: 'llama3-8b-8192',
                    messages: [
                        { role: 'system', content: 'You are a helpful assistant that writes warm, personal birthday wishes.' },
                        { role: 'user', content: prompt }
                    ],
                }),
            });
            if (response.ok) {
                const data = await response.json();
                birthdayMessage = data.choices?.[0]?.message?.content || birthdayMessage;
            }
        } catch (error) {
            console.error("Error generating birthday wish:", error);
        } finally {
            const cleanedPhone = phone.replace(/\D/g, '');
            const message = encodeURIComponent(birthdayMessage);
            const url = `https://wa.me/${cleanedPhone}?text=${message}`;
            window.open(url, '_blank');
            setWishingContactId(null);
        }
    };
    
    const EventItem: React.FC<{ item: any }> = ({ item }) => (
        <div className="flex items-start gap-4 p-3 bg-background rounded-lg border border-border">
            <div className="flex flex-col items-center justify-center w-12 text-center flex-shrink-0">
                <span className="text-xs font-bold text-primary">{item.date.toLocaleDateString('en-US', { weekday: 'short' })}</span>
                <span className="text-2xl font-bold">{item.date.getDate()}</span>
                <span className="text-xs text-subtext">{item.date.toLocaleDateString('en-US', { month: 'short' })}</span>
            </div>
            <div className="flex-grow">
                <p className="font-semibold text-sm">{item.title}</p>
                <p className={`text-xs font-semibold px-2 py-0.5 rounded-full inline-block ${item.type === 'Birthday' ? 'bg-pink-500/10 text-pink-500' : 'bg-blue-500/10 text-blue-500'}`}>{item.type}</p>
                 {item.eventData && ( <div className="mt-2 flex items-center gap-2"> <button onClick={() => onOpenEditModal(item.eventData)} className="p-1 rounded-md hover:bg-card"><EditIcon className="w-4 h-4 text-subtext"/></button> <button onClick={() => onDeleteEvent(item.eventData.id)} className="p-1 rounded-md hover:bg-card"><TrashIcon className="w-4 h-4 text-danger"/></button> </div> )}
                 {item.contact && ( <div className="mt-2 flex items-center justify-end"> {item.contact.phones?.length > 0 && item.contact.phones[0].value && ( <button onClick={(e) => { e.stopPropagation(); handleWishOnWhatsApp(item.contact); }} className="p-2 rounded-full text-green-500 bg-green-500/10 hover:bg-green-500/20 w-8 h-8 flex items-center justify-center" disabled={wishingContactId !== null} > {wishingContactId === item.contact.id ? <SpinnerIcon /> : <WhatsAppIcon className="w-5 h-5" />} </button> )} </div> )}
            </div>
        </div>
    );

    const renderCalendar = () => {
        const month = currentDate.getMonth();
        const year = currentDate.getFullYear();
        const firstDay = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const today = new Date();
        const days = [];
        for (let i = 0; i < firstDay; i++) { days.push(<div key={`empty-${i}`} className="text-center p-2"></div>); }
        for (let day = 1; day <= daysInMonth; day++) {
            const isToday = today.getDate() === day && today.getMonth() === month && today.getFullYear() === year;
            const dayEvents = allEvents.filter(e => {
                const eventDate = new Date(e.date);
                return e.isRecurring ? (eventDate.getDate() === day && eventDate.getMonth() === month) : (eventDate.getDate() === day && eventDate.getMonth() === month && eventDate.getFullYear() === year);
            });
            days.push(
                <div key={day} className="text-center p-1"><span className={`w-8 h-8 flex items-center justify-center rounded-full text-sm font-semibold mx-auto relative ${isToday ? 'bg-primary text-background' : ''}`}> {day} {dayEvents.length > 0 && <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 h-1 w-1 bg-red-500 rounded-full"></span>}</span></div>
            );
        }
        return days;
    };

    const changeMonth = (delta: number) => setCurrentDate(d => new Date(d.getFullYear(), d.getMonth() + delta, 1));
    
    return (
        <div onClick={onClose} className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
             <div onClick={e => e.stopPropagation()} className="bg-card rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col animate-scale-in border border-border">
                <div className="flex justify-between items-center p-4 border-b border-border">
                    <h2 className="text-xl font-bold">Calendar</h2>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-background"><CloseIcon className="w-6 h-6"/></button>
                </div>
                <div className="flex-grow flex flex-col md:flex-row overflow-hidden">
                    <div className="w-full md:w-1/2 p-4 border-b md:border-b-0 md:border-r border-border">
                         <div className="flex justify-between items-center mb-4"><button onClick={() => changeMonth(-1)} className="p-2 rounded-full hover:bg-background"><ChevronLeftIcon className="w-5 h-5" /></button><h3 className="text-lg font-bold">{currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}</h3><button onClick={() => changeMonth(1)} className="p-2 rounded-full hover:bg-background"><ChevronRightIcon className="w-5 h-5" /></button></div>
                         <div className="grid grid-cols-7 gap-1 text-xs font-semibold text-center text-subtext mb-2">{['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => <div key={day}>{day}</div>)}</div>
                         <div className="grid grid-cols-7 gap-1">{renderCalendar()}</div>
                    </div>
                    <div className="flex-grow p-4 overflow-y-auto no-scrollbar space-y-3">
                         <h3 className="font-bold">Events this month</h3>
                         {monthlyEvents.length > 0 ? ( monthlyEvents.map((item, index) => <EventItem key={item.id + index} item={item} />) ) : ( <div className="text-center py-8"><CalendarIcon className="mx-auto h-12 w-12 text-gray-400" /><p className="mt-2 text-sm text-subtext">No events this month.</p></div> )}
                    </div>
                </div>
             </div>
        </div>
    )
}

const DashboardPage: React.FC<DashboardPageProps> = (props) => {
    const { contacts, events, onSelectContact, onOpenAddModal, onOpenEditModal, onDeleteEvent } = props;
    const [wishingContactId, setWishingContactId] = useState<string | null>(null);
    const [isCalendarOpen, setCalendarOpen] = useState(false);
    const [calendarInitialDate, setCalendarInitialDate] = useState<Date | undefined>(undefined);

    const { totalFavorites, eventsThisMonth, newThisMonth } = useMemo(() => {
        const now = new Date();
        const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        
        const customEventsThisMonth = events.filter(e => {
            const eventDate = new Date(e.date + 'T00:00:00');
            return eventDate.getFullYear() === now.getFullYear() && eventDate.getMonth() === now.getMonth();
        }).length;

        const birthdaysThisMonth = contacts.filter(c => {
            if (!c.birthday) return false;
            const birthDate = new Date(c.birthday + 'T00:00:00');
            return birthDate.getMonth() === now.getMonth();
        }).length;

        return {
            totalFavorites: contacts.filter(c => c.isFavorite).length,
            eventsThisMonth: customEventsThisMonth + birthdaysThisMonth,
            newThisMonth: contacts.filter(c => {
                const createdAt = new Date(c.createdAt);
                return createdAt.getFullYear() === now.getFullYear() && createdAt.getMonth() === now.getMonth();
            }).length,
        };
    }, [contacts, events]);
    
    const handleViewEventInCalendar = (date: Date) => {
        setCalendarInitialDate(date);
        setCalendarOpen(true);
    };

    const upcomingEvents = useMemo(() => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const birthdayEvents = contacts
            .filter(c => c.birthday)
            .map(contact => {
                const birthDate = new Date(contact.birthday + 'T00:00:00');
                let nextOccurrence = new Date(birthDate);
                nextOccurrence.setFullYear(today.getFullYear());
                if (nextOccurrence < today) {
                    nextOccurrence.setFullYear(today.getFullYear() + 1);
                }
                return {
                    id: `birthday-${contact.id}`,
                    date: nextOccurrence,
                    title: `${contact.firstName} ${contact.lastName}'s Birthday`,
                    type: 'Birthday' as const,
                    contact,
                };
            });
        
        const customEvents = events
            .map(event => {
                const eventDate = new Date(event.date + 'T00:00:00');
                let nextOccurrence = new Date(eventDate);

                if (event.repeat === 'Yearly') {
                    nextOccurrence.setFullYear(today.getFullYear());
                    if (nextOccurrence < today) {
                        nextOccurrence.setFullYear(today.getFullYear() + 1);
                    }
                }
                
                if (nextOccurrence < today && event.repeat === 'Do not repeat') {
                    return null;
                }

                return {
                    id: event.id,
                    date: nextOccurrence,
                    title: event.title,
                    type: event.type,
                    eventData: event,
                };
            })
            .filter((e): e is NonNullable<typeof e> => e !== null);

        return [...birthdayEvents, ...customEvents]
            .sort((a, b) => a.date.getTime() - b.date.getTime())
            .slice(0, 7);
    }, [contacts, events]);


    const handleWishOnWhatsApp = async (contact: Contact) => {
        const phone = contact.phones[0]?.value;
        if (!phone) return;
    
        setWishingContactId(contact.id);
        let birthdayMessage = `Happy Birthday, ${contact.firstName}! Wishing you a fantastic day! 🎉`;

        try {
            const prompt = `You are an AI assistant helping me write a birthday wish. My contact's name is ${contact.firstName}. Their relationship to me is: ${contact.group || 'friend'}. Based on this, please generate a cheerful and personal happy birthday wish. Use the following templates as inspiration, picking the one that best fits the relationship. Adapt it to sound natural. Keep it short and include a nice emoji. --- TEMPLATES --- ${birthdayWishTemplates} --- END TEMPLATES ---`;
            const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${process.env.API_KEY}`,
                },
                body: JSON.stringify({
                    model: 'llama3-8b-8192',
                    messages: [
                        { role: 'system', content: 'You are a helpful assistant that writes warm, personal birthday wishes.' },
                        { role: 'user', content: prompt }
                    ],
                }),
            });
            if (response.ok) {
                const data = await response.json();
                birthdayMessage = data.choices?.[0]?.message?.content || birthdayMessage;
            }
        } catch (error) {
            console.error("Error generating birthday wish:", error);
        } finally {
            const cleanedPhone = phone.replace(/\D/g, '');
            const message = encodeURIComponent(birthdayMessage);
            const url = `https://wa.me/${cleanedPhone}?text=${message}`;
            window.open(url, '_blank');
            setWishingContactId(null);
        }
    };
    
    return (
        <div className="h-full overflow-y-auto no-scrollbar">
            <div className="space-y-8 max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8 animate-fade-in-up">
                 <div className="flex justify-between items-center gap-4 flex-wrap">
                    <h1 className="text-4xl font-bold tracking-tight text-text">Dashboard</h1>
                     <div className="flex items-center gap-2">
                        <button 
                            onClick={onOpenAddModal} 
                            className="font-semibold py-2 px-4 rounded-lg flex items-center gap-2 bg-primary text-background border border-primary hover:bg-primary-hover transition-colors"
                        >
                            <PlusIcon className="h-5 w-5" /> Add Event
                        </button>
                        <button onClick={() => { setCalendarInitialDate(new Date()); setCalendarOpen(true); }} className="font-semibold py-2 px-4 rounded-lg flex items-center gap-2 bg-card border border-border hover:bg-border transition-colors">
                            <CalendarIcon className="h-5 w-5" /> View Calendar
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                    <StatCard icon={<UsersIcon className="w-7 h-7" />} label="Total Contacts" value={contacts.length} colorClass="bg-blue-500/20 text-blue-500" />
                    <StatCard icon={<HeartIcon className="w-7 h-7" />} label="Favorites" value={totalFavorites} colorClass="bg-red-500/20 text-red-500" />
                    <StatCard icon={<CalendarIcon className="w-7 h-7" />} label="Events This Month" value={eventsThisMonth} colorClass="bg-purple-500/20 text-purple-500" />
                    <StatCard icon={<PlusIcon className="w-7 h-7" />} label="New This Month" value={newThisMonth} colorClass="bg-green-500/20 text-green-500" />
                </div>
                
                 <div className="space-y-4">
                    <h2 className="text-2xl font-bold">Upcoming Events</h2>
                     {upcomingEvents.length > 0 ? (
                        <div className="bg-card rounded-xl border border-border p-4 space-y-3">
                        {upcomingEvents.map((item) => {
                           const isBirthday = item.type === 'Birthday';
                           const contact = isBirthday ? (item as any).contact : null;
                           const eventData = !isBirthday ? (item as any).eventData : null;

                           return (
                               <button 
                                   key={item.id} 
                                   onClick={() => handleViewEventInCalendar(item.date)}
                                   className="w-full flex items-center justify-between p-2 hover:bg-background rounded-lg text-left"
                                >
                                    <div 
                                        className="flex items-center gap-3 text-left"
                                    >
                                        {contact && contact.profilePicture ? 
                                            (<img src={contact.profilePicture} alt="profile" className="w-10 h-10 rounded-full object-cover"/>) : 
                                            contact ? 
                                            (<div className="w-10 h-10 rounded-full bg-primary text-background flex items-center justify-center font-bold text-sm">{`${contact.firstName[0] || ''}${contact.lastName[0] || ''}`}</div>) :
                                            (<div className="w-10 h-10 rounded-full bg-primary-light text-primary flex items-center justify-center"><CalendarIcon className="w-5 h-5" /></div>)
                                        }
                                        <div>
                                            <p className="font-semibold">{item.title}</p>
                                            <p className="text-sm text-subtext">{item.date.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}</p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        {isBirthday && contact?.phones?.[0]?.value && (
                                             <button onClick={(e) => { e.stopPropagation(); handleWishOnWhatsApp(contact); }} className="p-2 rounded-full text-green-500 bg-green-500/10 hover:bg-green-500/20 w-10 h-10 flex items-center justify-center disabled:opacity-50" disabled={wishingContactId !== null}>
                                                {wishingContactId === contact.id ? <SpinnerIcon /> : <WhatsAppIcon className="w-6 h-6" />}
                                            </button>
                                        )}
                                        {!isBirthday && eventData && (
                                            <>
                                                <button onClick={(e) => { e.stopPropagation(); onOpenEditModal(eventData); }} className="p-2 rounded-full hover:bg-border text-subtext hover:text-text"><EditIcon className="w-5 h-5" /></button>
                                                <button onClick={(e) => { e.stopPropagation(); onDeleteEvent(eventData.id); }} className="p-2 rounded-full hover:bg-border text-subtext hover:text-danger"><TrashIcon className="w-5 h-5" /></button>
                                            </>
                                        )}
                                    </div>
                               </button>
                           )
                        })}
                        </div>
                    ) : (
                         <div className="text-center py-16 bg-card rounded-xl border border-border">
                            <CakeIcon className="mx-auto h-16 w-16 text-gray-400" />
                            <h3 className="mt-2 text-xl font-medium">No Upcoming Events</h3>
                            <p className="mt-1 text-subtext">Add birthdays or events to see them here.</p>
                        </div>
                    )}
                 </div>
            </div>
            {isCalendarOpen && <CalendarView {...props} onClose={() => setCalendarOpen(false)} initialDate={calendarInitialDate} />}
        </div>
    );
};

export default DashboardPage;
