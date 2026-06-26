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
    const primaryPhone = contact.phones[0]?.value;
    return `BEGIN:VCARD\nVERSION:3.0\nFN:${name}\nTEL;TYPE=CELL:${primaryPhone || ''}\nEND:VCARD`;
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
            a.href = url;
            a.download = `${contact.firstName}_${contact.lastName}_QR.png`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            a.remove();
        } catch (error) {
            console.error('Error downloading QR code:', error);
        }
    };

    const handleShare = async () => {
        if (!navigator.share) return;
        try {
            const response = await fetch(qrCodeUrl);
            const blob = await response.blob();
            const file = new File([blob], `${contact.firstName}_${contact.lastName}_QR.png`, { type: blob.type });
            await navigator.share({
                title: `Contact Info for ${contact.firstName}`,
                text: `Contact info for ${contact.firstName} ${contact.lastName}.`,
                files: [file],
            });
        } catch (error) {
            if ((error as Error).name !== 'AbortError') console.error('Error sharing:', error);
        }
    };

    return (
        <div onClick={onClose} className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div onClick={e => e.stopPropagation()} className="bg-card rounded-xl shadow-xl w-full max-w-sm p-6 text-center animate-scale-in border border-border">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold">Share Contact</h2>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-background"><CloseIcon className="w-6 h-6"/></button>
                </div>
                <div className="p-2 bg-white rounded-lg border border-border inline-block">
                    <img src={qrCodeUrl} alt="Contact QR Code" className="mx-auto" width="220" height="220" />
                </div>
                <p className="mt-4 text-sm text-subtext">Scan to save {contact.firstName}'s contact card.</p>
                 <div className="mt-6 flex items-center gap-4">
                    {navigator.share && (
                         <button onClick={handleShare} className="flex-1 flex items-center justify-center gap-2 bg-background border border-border font-bold py-2.5 px-4 rounded-lg hover:bg-border">
                            <ShareIcon className="w-5 h-5" /> Share
                        </button>
                    )}
                    <button onClick={handleDownload} className="flex-1 flex items-center justify-center gap-2 bg-primary text-background font-bold py-2.5 px-4 rounded-lg shadow-md hover:bg-primary-hover">
                       <DownloadIcon className="w-5 h-5" /> Download
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ShareContactModal;