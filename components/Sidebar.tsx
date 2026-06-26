import React from 'react';
import { Page } from '../types';
import { CalendarIcon, ContactsIcon, PlusIcon, SettingsIcon, SparklesIcon } from './icons';

interface BottomNavProps {
    currentPage: Page;
    setCurrentPage: (page: Page) => void;
    onAdd: () => void;
    onOpenAI: () => void;
}

const NavItem: React.FC<{
    label: string;
    icon: React.ReactNode;
    isActive?: boolean;
    onClick: () => void;
}> = ({ label, icon, isActive, onClick }) => {

    return (
        <button
            onClick={onClick}
            className={`flex flex-col items-center justify-center w-full h-full transition-colors rounded-lg p-1 ${
                isActive ? 'text-primary' : 'text-subtext hover:text-text'
            }`}
            aria-current={isActive ? 'page' : undefined}
        >
            {icon}
            <span className="text-xs font-semibold mt-1">{label}</span>
        </button>
    );
};

const BottomNav: React.FC<BottomNavProps> = ({ currentPage, setCurrentPage, onAdd, onOpenAI }) => {
    const navItems = [
        { id: 'dashboard' as Page, label: 'Dashboard', icon: <CalendarIcon className="w-6 h-6" /> },
        { id: 'contacts' as Page, label: 'Contacts', icon: <ContactsIcon className="w-6 h-6" /> },
    ];
    
    const actionItems = [
        { id: 'settings' as Page, label: 'Settings', icon: <SettingsIcon className="w-6 h-6" /> },
        { id: 'ai' as const, label: 'Assistant', icon: <SparklesIcon className="w-6 h-6" /> }
    ];

    return (
        <nav className="fixed bottom-0 left-0 right-0 h-24 bg-card/80 backdrop-blur-lg border-t border-border z-50 md:bottom-5 md:left-1/2 md:-translate-x-1/2 md:w-full md:max-w-xl md:rounded-2xl md:h-20 md:border">
            <div className="flex justify-around items-center h-full max-w-7xl mx-auto px-4 gap-2">
                <NavItem
                    key={navItems[0].id}
                    {...navItems[0]}
                    isActive={currentPage === navItems[0].id}
                    onClick={() => setCurrentPage(navItems[0].id)}
                />
                <NavItem
                    key={navItems[1].id}
                    {...navItems[1]}
                    isActive={currentPage === navItems[1].id}
                    onClick={() => setCurrentPage(navItems[1].id)}
                />

                <button
                    onClick={onAdd}
                    className="flex flex-col items-center justify-center w-full h-16 bg-primary text-background rounded-2xl shadow-lg shadow-primary/30 dark:shadow-primary/20 transform transition-transform hover:scale-105"
                    aria-label="Add Event or Contact"
                >
                    <PlusIcon className="w-7 h-7"/>
                    <span className="text-xs font-semibold mt-1">Add</span>
                </button>
                
                <NavItem
                    key={actionItems[0].id}
                    {...actionItems[0]}
                    isActive={currentPage === actionItems[0].id}
                    onClick={() => setCurrentPage(actionItems[0].id)}
                />
                 <NavItem
                    key={actionItems[1].id}
                    {...actionItems[1]}
                    onClick={onOpenAI}
                />
            </div>
        </nav>
    );
};

export default BottomNav;