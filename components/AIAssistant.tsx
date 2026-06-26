import React, { useState, useEffect, useRef } from 'react';
import { ChatMessage, ChatSession } from '../types';
import { 
    CloseIcon, PaperAirplaneIcon, SparklesIcon, PlusIcon, 
    PencilSquareIcon, CheckIcon, TrashIcon,
    ExclamationTriangleIcon
} from './icons';

interface AIAssistantProps {
    isOpen: boolean;
    onClose: () => void;
    sessions: ChatSession[];
    activeSessionId: string | null;
    onSelectSession: (id: string) => void;
    onNewChat: () => void;
    onDeleteSession: (id: string) => void;
    onRenameSession: (id: string, newTitle: string) => void;
    messages: ChatMessage[];
    isLoading: boolean;
    onSendMessage: (message: string) => void;
}

const MessageBubble: React.FC<{ message: ChatMessage }> = ({ message }) => {
    const isModel = message.role === 'model' || message.role === 'error';
    const bubbleClasses = isModel ? 'bg-background text-text' : 'bg-primary text-background';
    const errorClasses = message.role === 'error' ? 'border-l-4 border-danger text-danger' : '';

    return (
        <div className={`w-full flex animate-fade-in-up ${isModel ? 'justify-start' : 'justify-end'}`}>
            <div className={`max-w-sm p-3 rounded-lg break-words shadow-sm ${bubbleClasses} ${errorClasses}`}>
                {message.content}
            </div>
        </div>
    );
};

const AIAssistant: React.FC<AIAssistantProps> = (props) => {
    const { isOpen, onClose, sessions, activeSessionId, onSelectSession, onNewChat, onDeleteSession, onRenameSession, messages, isLoading, onSendMessage } = props;
    const [input, setInput] = useState('');
    const [renamingId, setRenamingId] = useState<string | null>(null);
    const [renamingTitle, setRenamingTitle] = useState('');
    const [sessionToDelete, setSessionToDelete] = useState<ChatSession | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isLoading]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (input.trim() && !isLoading) {
            onSendMessage(input.trim());
            setInput('');
        }
    };

    if (!isOpen) return null;
    
    return (
        <>
            <div onClick={onClose} className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40 animate-fade-in-up" style={{ animationDuration: '0.2s' }}></div>
            <div className="fixed bottom-0 right-0 sm:bottom-6 sm:right-6 w-full h-full sm:w-[650px] sm:h-[calc(100%-6rem)] max-h-[700px] bg-card rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col md:flex-row border border-border z-50 animate-fade-in-up overflow-hidden">
                <div className="w-full md:w-1/3 bg-background border-r border-border flex flex-col">
                    <div className="p-2 border-b border-border"><button onClick={onNewChat} className={`w-full flex items-center justify-center gap-2 p-2 text-sm font-semibold border rounded-lg ${activeSessionId === null ? 'bg-primary-light border-primary text-primary' : 'border-border hover:bg-card'}`}><PlusIcon className="w-5 h-5"/> New Chat</button></div>
                    <div className="flex-grow overflow-y-auto no-scrollbar p-2 space-y-1">
                        {sessions.map(s => (<div key={s.id} className={`rounded-lg ${activeSessionId === s.id ? 'bg-primary-light' : 'hover:bg-card'}`}>{renamingId === s.id ? (<div className="p-2 flex items-center gap-2"><input value={renamingTitle} onChange={e => setRenamingTitle(e.target.value)} onBlur={() => {onRenameSession(s.id, renamingTitle); setRenamingId(null);}} className="w-full bg-transparent ring-1 ring-primary rounded px-1"/><button onClick={() => {onRenameSession(s.id, renamingTitle); setRenamingId(null);}}><CheckIcon className="w-4 h-4"/></button></div>) : (<div className="flex items-center p-2 gap-2"><button onClick={() => onSelectSession(s.id)} className="flex-grow text-left truncate"><p className="text-sm font-semibold truncate">{s.title}</p></button><div className="flex-shrink-0 flex items-center"><button onClick={() => {setRenamingId(s.id); setRenamingTitle(s.title)}} className="p-1 hover:text-primary"><PencilSquareIcon className="w-4 h-4"/></button><button onClick={() => setSessionToDelete(s)} className="p-1 hover:text-danger"><TrashIcon className="w-4 h-4"/></button></div></div>)}</div>))}
                    </div>
                </div>
                <div className="flex-1 flex flex-col w-full md:w-2/3 relative">
                    <div className="flex items-center justify-between p-4 border-b border-border"><div className="flex items-center gap-2"><SparklesIcon className="w-6 h-6 text-primary" /><h2 className="text-lg font-bold">AI Assistant</h2></div><button onClick={onClose} className="p-1 rounded-full text-subtext hover:bg-background"><CloseIcon className="w-6 h-6" /></button></div>
                    <div className="flex-1 overflow-y-auto p-4 space-y-4 no-scrollbar bg-background"><div className="flex flex-col gap-2">{messages.map((m, i) => <MessageBubble key={i} message={m} />)}{isLoading && (<div className="self-start flex items-center gap-2"><div className="p-3 rounded-lg bg-card"><div className="flex items-center gap-2"><span className="w-2 h-2 bg-primary rounded-full animate-pulse" style={{animationDelay:'0s'}}></span><span className="w-2 h-2 bg-primary rounded-full animate-pulse" style={{animationDelay:'0.2s'}}></span><span className="w-2 h-2 bg-primary rounded-full animate-pulse" style={{animationDelay:'0.4s'}}></span></div></div></div>)}<div ref={messagesEndRef} /></div></div>
                    <div className="p-4 border-t border-border"><form onSubmit={handleSubmit} className="flex items-center gap-2"><input type="text" value={input} onChange={(e) => setInput(e.target.value)} placeholder="Ask a question..." disabled={isLoading} className="w-full p-2 bg-background border border-border focus:outline-none focus:ring-2 focus:ring-primary rounded-lg" /><button type="submit" disabled={!input.trim() || isLoading} className="p-2.5 bg-primary text-background rounded-lg shadow-md hover:bg-primary-hover disabled:opacity-50" aria-label="Send message"><PaperAirplaneIcon className="w-5 h-5" /></button></form></div>
                    {sessionToDelete && (<div onClick={() => setSessionToDelete(null)} className="absolute inset-0 bg-black/30 backdrop-blur-sm z-10 flex items-center justify-center p-4"><div onClick={e => e.stopPropagation()} className="bg-card rounded-lg shadow-xl w-full max-w-sm p-6 text-center animate-scale-in border border-border"><ExclamationTriangleIcon className="h-12 w-12 text-danger mx-auto" /><h3 className="text-lg font-bold mt-4">Delete Chat?</h3><p className="text-sm mt-2 mb-6">Are you sure you want to delete "{sessionToDelete.title}"?</p><div className="flex justify-center gap-4"><button onClick={() => setSessionToDelete(null)} className="flex-1 bg-background border font-bold py-2 px-4 rounded-lg hover:bg-border">Cancel</button><button onClick={() => {onDeleteSession(sessionToDelete.id); setSessionToDelete(null);}} className="flex-1 bg-danger text-white font-bold py-2 px-4 rounded-lg shadow-md hover:opacity-90">Delete</button></div></div></div>)}
                </div>
            </div>
        </>
    );
};

export default AIAssistant;