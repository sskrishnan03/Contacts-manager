

import React, { useState } from 'react';
import { GoogleGenAI } from '@google/genai';
import { CloseIcon, TrashIcon, CameraIcon, SparklesIcon } from './icons';
import { staticAvatars } from '../assets/avatars';

interface ProfileCustomizationModalProps {
    isOpen: boolean;
    onClose: () => void;
    currentProfilePicture: string | undefined;
    onSave: (newProfilePicture: string | undefined) => void;
}

const TabButton: React.FC<{label: string; isActive: boolean; onClick: () => void}> = ({ label, isActive, onClick }) => (
    <button type="button" onClick={onClick} className={`px-4 py-2 text-sm font-semibold rounded-t-lg border-b-2 flex-1 ${isActive ? 'border-primary text-primary' : 'border-transparent text-subtext hover:border-gray-300'}`}>{label}</button>
);

const ProfileCustomizationModal: React.FC<ProfileCustomizationModalProps> = ({ isOpen, onClose, currentProfilePicture, onSave }) => {
    const [activeTab, setActiveTab] = useState<'avatars' | 'upload' | 'ai'>('avatars');
    const [uploadedImage, setUploadedImage] = useState<string | null>(null);
    const [prompt, setPrompt] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [generatedImage, setGeneratedImage] = useState<string | null>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const reader = new FileReader();
            reader.onload = (event) => setUploadedImage(event.target?.result as string);
            reader.readAsDataURL(e.target.files[0]);
        }
    };

    const handleGenerate = async () => {
        if (!prompt) return;
        setIsGenerating(true);
        setGeneratedImage(null);
        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash-image',
                contents: { parts: [{ text: prompt }] },
                config: {
                    imageConfig: { aspectRatio: '1:1' }
                }
            });
            
            for (const part of response.candidates?.[0]?.content?.parts || []) {
                if (part.inlineData) {
                    setGeneratedImage(`data:image/png;base64,${part.inlineData.data}`);
                    break;
                }
            }
        } catch (e) {
            console.error("Image generation failed", e);
            alert("Failed to generate image. Please try again.");
        } finally {
            setIsGenerating(false);
        }
    };
    
    if (!isOpen) return null;

    return (
        <div onClick={onClose} className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div onClick={e => e.stopPropagation()} className="bg-card rounded-lg shadow-xl w-full max-w-lg max-h-full flex flex-col animate-scale-in border border-border">
                <div className="flex justify-between items-center p-4 border-b"><h2 className="text-xl font-bold">Customize Profile</h2><button onClick={onClose}><CloseIcon className="w-6 h-6"/></button></div>
                <div className="p-6 space-y-4">
                    <div className="flex justify-center"><img src={generatedImage || uploadedImage || currentProfilePicture} alt="Preview" className="w-32 h-32 rounded-full object-cover ring-4 ring-primary bg-background" onError={e => (e.target as HTMLImageElement).src = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0iI2FlYWVhZSI+PHBhdGggZD0iTTEyIDEyYzIuMjEgMCA0LTEuNzkgNC00cy0xLjc5LTQtNC00LTQgMS43OS00IDQgMS43OSA0IDQgMHptMCAyYy0yLjY3IDAtOCAxLjM0LTggNHYyYzAgMS4xLjkgMiAyIDJoMTRjMS4xIDAgMi0uOSAyLTJ2LTJjMC0yLjY2LTUuMzMtNC04LTR6Ii8+PC9zdmc+'}/></div>
                    <div className="border-b border-border"><div className="flex items-center"><TabButton label="Avatars" isActive={activeTab === 'avatars'} onClick={() => setActiveTab('avatars')} /><TabButton label="Upload" isActive={activeTab === 'upload'} onClick={() => setActiveTab('upload')} /><TabButton label="Generate AI" isActive={activeTab === 'ai'} onClick={() => setActiveTab('ai')} /></div></div>
                </div>
                <div className="flex-grow overflow-y-auto px-6 pb-6 no-scrollbar">
                    {activeTab === 'avatars' && <div className="grid grid-cols-3 sm:grid-cols-5 gap-4 animate-fade-in-up">{staticAvatars.map((url, i) => (<button key={i} onClick={() => onSave(url)} className={`rounded-full aspect-square overflow-hidden ring-2 transition-all hover:ring-4 hover:scale-105 ${currentProfilePicture === url ? 'ring-primary' : 'ring-transparent'}`}><img src={url} alt={`Avatar ${i + 1}`} className="w-full h-full object-cover bg-background" /></button>))}</div>}
                    {activeTab === 'upload' && <div className="flex flex-col items-center gap-4 animate-fade-in-up"><p className="text-sm text-center text-subtext">Upload a square image for best results.</p><div className="flex gap-4"><label htmlFor="upload" className="cursor-pointer font-semibold py-2 px-4 rounded-lg bg-background border hover:bg-border flex items-center gap-2"><CameraIcon className="w-5 h-5" /> Choose File</label><input id="upload" type="file" onChange={handleFileChange} accept="image/*" className="hidden"/><button onClick={() => {if(uploadedImage) onSave(uploadedImage)}} disabled={!uploadedImage} className="font-semibold py-2 px-4 rounded-lg bg-primary text-background shadow-md hover:opacity-90 disabled:opacity-50">Apply Image</button></div></div>}
                    {activeTab === 'ai' && (
                        <div className="flex flex-col gap-4 animate-fade-in-up">
                             <div className="flex flex-col gap-2">
                                <label className="text-sm font-semibold">Describe the avatar you want:</label>
                                <textarea 
                                    value={prompt} 
                                    onChange={(e) => setPrompt(e.target.value)} 
                                    placeholder="e.g., A futuristic robot cat in neon colors" 
                                    className="w-full p-2 bg-background border border-border rounded-lg focus:ring-2 focus:ring-primary focus:outline-none"
                                    rows={3}
                                />
                            </div>
                            <button 
                                onClick={handleGenerate} 
                                disabled={!prompt || isGenerating}
                                className="w-full font-bold py-2 px-4 rounded-lg bg-primary text-background shadow-md hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {isGenerating ? (
                                    <><svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg> Generating...</>
                                ) : (
                                    <><SparklesIcon className="w-5 h-5" /> Generate Image</>
                                )}
                            </button>
                            {generatedImage && (
                                <button 
                                    onClick={() => onSave(generatedImage)} 
                                    className="w-full font-bold py-2 px-4 rounded-lg bg-background border border-primary text-primary hover:bg-primary/10 transition-colors"
                                >
                                    Use This Image
                                </button>
                            )}
                        </div>
                    )}
                </div>
                <div className="flex justify-between items-center p-4 border-t">
                    <button onClick={() => onSave(undefined)} className="text-danger font-bold py-2 px-4 rounded-lg hover:bg-danger/10 flex items-center gap-2"><TrashIcon className="w-5 h-5" /> Remove</button>
                    <button onClick={onClose} className="bg-primary text-background font-bold py-2 px-4 rounded-lg shadow-md hover:bg-primary-hover">Done</button>
                </div>
            </div>
        </div>
    );
};

export default ProfileCustomizationModal;
