

import React, { useState, useEffect } from 'react';
import { GoogleGenAI } from '@google/genai';
import { ActivityType } from '../types';
import { CloseIcon, SparklesIcon } from './icons';

interface LogActivityModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (notes: string) => void;
    activityType: ActivityType | null;
}

const LogActivityModal: React.FC<LogActivityModalProps> = ({ isOpen, onClose, onSave, activityType }) => {
    const [notes, setNotes] = useState('');
    const [isSummarizing, setIsSummarizing] = useState(false);
    const [ai, setAi] = useState<GoogleGenAI | null>(null);

    useEffect(() => {
        if (isOpen) {
            setNotes('');
            if (!ai) setAi(new GoogleGenAI({ apiKey: process.env.API_KEY as string }));
        }
    }, [isOpen]);

    const handleSummarize = async () => {
        if (!notes.trim() || !ai) return;
        setIsSummarizing(true);
        try {
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash-lite',
                contents: `Summarize these notes into one concise sentence: "${notes}"`,
            });
            setNotes(response.text.trim());
        } catch (error) {
            console.error('Error summarizing notes:', error);
        } finally {
            setIsSummarizing(false);
        }
    };

    const handleSubmit = () => onSave(notes);

    if (!isOpen || !activityType) return null;

    const activityTitle = activityType.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());

    return (
        <div onClick={onClose} className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div onClick={e => e.stopPropagation()} className="bg-card rounded-lg shadow-xl w-full max-w-lg flex flex-col animate-scale-in border border-border">
                <div className="flex justify-between items-center p-4 border-b border-border">
                    <h2 className="text-xl font-bold">Log: {activityTitle}</h2>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-background"><CloseIcon className="w-6 h-6"/></button>
                </div>
                <div className="p-6 space-y-4">
                    <label htmlFor="notes" className="block text-sm font-medium">Notes (Optional)</label>
                    <textarea
                        id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} rows={5}
                        placeholder={`Add notes about the ${activityTitle.toLowerCase()}...`}
                        className="w-full p-2 bg-background rounded-md border border-border focus:ring-2 focus:ring-primary"
                    />
                     <button
                        onClick={handleSummarize} disabled={!notes.trim() || isSummarizing}
                        className="w-full flex items-center justify-center gap-2 text-sm font-semibold p-2 rounded-lg bg-background border border-border hover:bg-border disabled:opacity-50"
                    >
                        {isSummarizing ? ( <><svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>Summarizing...</> ) 
                        : ( <><SparklesIcon className="w-5 h-5 text-primary" />Summarize with AI</> )}
                    </button>
                </div>
                 <div className="flex justify-end p-4 border-t border-border">
                    <button type="button" onClick={onClose} className="bg-card border border-border font-bold py-2 px-4 rounded-lg mr-2 hover:bg-border">Skip</button>
                    <button type="button" onClick={handleSubmit} className="bg-primary text-background font-bold py-2 px-4 rounded-lg shadow-md hover:bg-primary-hover">Save Log</button>
                </div>
            </div>
        </div>
    );
};

export default LogActivityModal;
