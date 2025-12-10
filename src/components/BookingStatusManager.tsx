'use client';

import { useState, useTransition } from 'react';
import { updateBookingStatus } from '@/app/actions';

interface BookingStatusManagerProps {
    bookingId: number;
    currentStatus: string;
}

const statusOptions: Record<string, { label: string; color: string; border: string; text: string }> = {
    'PENDING': { label: 'En Espera', color: 'bg-yellow-100', border: 'border-yellow-200', text: 'text-yellow-800' },
    'CONFIRMED': { label: 'Confirmado', color: 'bg-green-100', border: 'border-green-200', text: 'text-green-800' },
    'REJECTED': { label: 'Rechazado', color: 'bg-red-100', border: 'border-red-200', text: 'text-red-800' },
    'COMPLETED': { label: 'Completado', color: 'bg-blue-100', border: 'border-blue-200', text: 'text-blue-800' },
};

export default function BookingStatusManager({ bookingId, currentStatus }: BookingStatusManagerProps) {
    const [status, setStatus] = useState(currentStatus);
    const [isOpen, setIsOpen] = useState(false);
    const [isPending, startTransition] = useTransition();

    const handleSelect = (newStatus: string) => {
        if (newStatus === status) {
            setIsOpen(false);
            return;
        }

        const previousStatus = status;
        setStatus(newStatus);
        setIsOpen(false);

        startTransition(async () => {
            const result = await updateBookingStatus(bookingId, newStatus);
            if (!result.success) {
                setStatus(previousStatus);
                // Could toast here
                console.error(result.message);
            }
        });
    };

    const currentOption = statusOptions[status] || statusOptions['PENDING'];

    return (
        <div className="relative inline-block text-left">
            {/* Backdrop for click outside */}
            {isOpen && (
                <div className="fixed inset-0 z-10 cursor-default" onClick={() => setIsOpen(false)}></div>
            )}

            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                disabled={isPending}
                className={`
                    group inline-flex items-center justify-between gap-x-2 rounded-full border px-3 py-1.5 text-xs font-semibold shadow-sm transition-all duration-200
                    ${currentOption.color} ${currentOption.border} ${currentOption.text}
                    ${isPending ? 'opacity-50 cursor-not-allowed' : 'hover:brightness-95 active:scale-95'}
                `}
            >
                {currentOption.label}
                <svg
                    className={`h-3 w-3 flex-shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth="2.5"
                    stroke="currentColor"
                >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
            </button>

            {isOpen && (
                <div className="absolute right-0 z-20 mt-2 w-40 origin-top-right overflow-hidden rounded-xl border border-zinc-200 bg-white py-1 shadow-xl ring-1 ring-black ring-opacity-5 focus:outline-none dark:border-zinc-800 dark:bg-zinc-900 animate-in fade-in zoom-in-95 duration-100">
                    {Object.entries(statusOptions).map(([value, option]) => (
                        <button
                            key={value}
                            onClick={() => handleSelect(value)}
                            className={`
                                flex w-full items-center justify-between px-4 py-2.5 text-left text-xs font-medium transition-colors
                                ${status === value
                                    ? 'bg-zinc-50 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100'
                                    : 'text-zinc-600 hover:bg-zinc-50 dark:text-zinc-400 dark:hover:bg-zinc-800'
                                }
                            `}
                        >
                            <span className={`inline-block h-2 w-2 rounded-full ${option.color.replace('bg-', 'bg-').replace('100', '400')} mr-2`}></span>
                            {option.label}
                            {status === value && (
                                <span className="ml-auto text-green-600">
                                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                                    </svg>
                                </span>
                            )}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
