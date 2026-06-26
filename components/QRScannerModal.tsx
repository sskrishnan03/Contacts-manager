import React from 'react';
import { Contact } from '../types';
import { CloseIcon, DownloadIcon, ShareIcon } from './icons';

interface ShareContactModalProps {
    isOpen: boolean;
    onClose: () => void;
    contact: Contact | null;
}

const generateQRData = (contact: Contact): string => {
    const name = `${contact.firstName} ${contact.lastName}`;
    const primaryPhone = contact.phones.find(p => p.label.toLowerCase() === 'mobile') || contact.phones[0];

    let textData = `Name: ${name}`;
    if (primaryPhone && primaryPhone.value) {
        textData += `\nPhone No: ${primaryPhone.value}`;
    }
    return textData;
};


const ShareContactModal: React.FC<ShareContactModalProps> = ({ isOpen, onClose, contact }) => {
    if (!isOpen || !contact) return null;

    const qrData = generateQRData(contact);
    const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=256x256&data=${encodeURIComponent(qrData)}`;

    const handleDownload = async () => {
        try {
            const response = await fetch(qrCodeUrl);
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.style.display = 'none';
            a.href = url;
            a.download = `${contact.firstName}_${contact.lastName}_QR.png`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            a.remove();
        } catch (error) {
            console.error('Error downloading QR code:', error);
            alert('Could not download QR code.');
        }
    };

    const handleShare = async () => {
        if (!navigator.share) {
            alert('Web Share API is not available on your browser.');
            return;
        }

        try {
            const response = await fetch(qrCodeUrl);
            const blob = await response.blob();
            const file = new File([blob], `${contact.firstName}_${contact.lastName}_QR.png`, { type: blob.type });
            
            const name = `${contact.firstName} ${contact.lastName}`;
            const primaryPhone = contact.phones.find(p => p.label.toLowerCase() === 'mobile') || contact.phones[0];

            await navigator.share({
                title: `Contact Info for ${name}`,
                text: `Here is the contact info for ${name}:\nName: ${name}\nPhone: ${primaryPhone?.value || 'N/A'}`,
                files: [file],
            });
        } catch (error) {
            // Don't alert if user cancels share dialog
            if ((error as Error).name !== 'AbortError') {
                 console.error('Error sharing QR code:', error);
                 alert('Could not share QR code.');
            }
        }
    };

    return (
        <div onClick={onClose} className="fixed inset-0 bg-white/50 dark:bg-black/50 backdrop-blur-lg flex items-center justify-center z-50 p-4">
            <div onClick={e => e.stopPropagation()} className="bg-card-light dark:bg-card-dark rounded-xl shadow-xl w-full max-w-sm p-6 text-center animate-scale-in border border-border-light dark:border-border-dark">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold text-text-light dark:text-text-dark">Share Contact</h2>
                    <button onClick={onClose} className="p-1 rounded-full text-subtext-light dark:text-subtext-dark hover:bg-background-light dark:hover:bg-background-dark">
                        <CloseIcon className="w-6 h-6"/>
                    </button>
                </div>
                <div className="p-2 bg-white rounded-lg border border-border-light dark:border-border-dark inline-block">
                    <img src={qrCodeUrl} alt="Contact QR Code" className="mx-auto" width="220" height="220" />
                </div>
                <p className="mt-4 text-sm text-subtext-light dark:text-subtext-dark">Scan this code to view {contact.firstName}'s name and phone number.</p>
                 <div className="mt-6 flex items-center gap-4">
                    {navigator.share && (
                         <button onClick={handleShare} className="flex-1 flex items-center justify-center gap-2 bg-background-light dark:bg-background-dark border border-border-light dark:border-border-dark font-bold py-2.5 px-4 rounded-lg hover:bg-border-light dark:hover:bg-border-dark transition-colors">
                            <ShareIcon className="w-5 h-5" /> Share
                        </button>
                    )}
                    <button onClick={handleDownload} className="flex-1 flex items-center justify-center gap-2 bg-primary text-white font-bold py-2.5 px-4 rounded-lg shadow-md hover:opacity-90 transition-opacity">
                       <DownloadIcon className="w-5 h-5" /> Download
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ShareContactModal;