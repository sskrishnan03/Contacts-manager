import React, { useState, useEffect } from 'react';

interface PinModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    correctPin: string;
}

const PinModal: React.FC<PinModalProps> = ({ isOpen, onClose, onSuccess, correctPin }) => {
    const [enteredPin, setEnteredPin] = useState('');
    const [error, setError] = useState('');
    const pinLength = 4; // Standardize PIN length

    useEffect(() => {
        if (isOpen) {
            setEnteredPin('');
            setError('');
        }
    }, [isOpen]);

    useEffect(() => {
        if (error) {
            const timer = setTimeout(() => setError(''), 1500);
            return () => clearTimeout(timer);
        }
    }, [error]);

    useEffect(() => {
        if (enteredPin.length === pinLength) {
            if (enteredPin === correctPin) {
                onSuccess();
            } else {
                setError('Incorrect PIN');
                setEnteredPin('');
            }
        }
    }, [enteredPin, correctPin, onSuccess, pinLength]);

    const handlePinInput = (digit: string) => {
        if (enteredPin.length < pinLength) {
            setEnteredPin(prev => prev + digit);
        }
    };
    
    const handleDelete = () => setEnteredPin(prev => prev.slice(0, -1));

    if (!isOpen) return null;

    const pinDots = Array(pinLength).fill(0).map((_, i) => (
        <div key={i} className={`w-4 h-4 rounded-full border-2 transition-colors ${enteredPin.length > i ? 'bg-primary border-primary' : 'border-border'}`}></div>
    ));

    return (
        <div onClick={onClose} className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
            <div onClick={e => e.stopPropagation()} className={`bg-card rounded-2xl shadow-xl w-full max-w-xs flex flex-col items-center animate-scale-in border border-border p-6 ${error ? 'animate-shake' : ''}`}>
                <h2 className="text-xl font-bold mb-2">Enter PIN</h2>
                <p className="text-sm text-subtext mb-4">Unlock the Private Vault.</p>
                <div className="flex items-center gap-3 my-4 h-6">
                    {error ? <p className="text-danger text-sm font-semibold">{error}</p> : pinDots}
                </div>
                
                <div className="grid grid-cols-3 gap-4 w-full">
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(n => (
                        <button key={n} onClick={() => handlePinInput(n.toString())} className="text-2xl font-semibold h-16 rounded-full bg-background hover:bg-border transition-colors">
                            {n}
                        </button>
                    ))}
                    <div />
                     <button onClick={() => handlePinInput('0')} className="text-2xl font-semibold h-16 rounded-full bg-background hover:bg-border transition-colors">
                        0
                    </button>
                     <button onClick={handleDelete} className="text-xl font-semibold h-16 rounded-full bg-background hover:bg-border transition-colors flex items-center justify-center">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9.75 14.25 12m0 0 2.25 2.25M14.25 12 12 14.25m-2.58 4.92-6.375-6.375a1.125 1.125 0 0 1 0-1.59L9.42 4.83c.211-.211.498-.33.796-.33H19.5a2.25 2.25 0 0 1 2.25 2.25v10.5a2.25 2.25 0 0 1-2.25 2.25h-9.284c-.298 0-.585-.119-.796-.33z" /></svg>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PinModal;
