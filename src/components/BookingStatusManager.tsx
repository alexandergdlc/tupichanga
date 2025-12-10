'use client';

import { useState, useTransition } from 'react';
import { updateBookingStatus } from '@/app/actions';

interface BookingStatusManagerProps {
    bookingId: number;
    currentStatus: string;
}

const statusOptions = [
    { value: 'PENDING', label: 'En Espera', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-500' },
    { value: 'CONFIRMED', label: 'Confirmado', color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' },
    { value: 'REJECTED', label: 'Rechazado', color: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' },
    { value: 'COMPLETED', label: 'Completado', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' },
];

export default function BookingStatusManager({ bookingId, currentStatus }: BookingStatusManagerProps) {
    const [status, setStatus] = useState(currentStatus);
    const [isPending, startTransition] = useTransition();

    const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newStatus = e.target.value;
        const previousStatus = status;

        setStatus(newStatus); // Optimistic update

        startTransition(async () => {
            const result = await updateBookingStatus(bookingId, newStatus);
            if (!result.success) {
                // Revert on failure
                setStatus(previousStatus);
                alert(result.message || 'Error al actualizar estado');
            }
        });
    };

    const currentOption = statusOptions.find(opt => opt.value === status) || statusOptions[0];

    return (
        <div className="relative">
            <select
                value={status}
                onChange={handleChange}
                disabled={isPending}
                className={`
                    appearance-none rounded-full px-3 py-1 pr-8 text-xs font-semibold leading-5 outline-none ring-1 ring-inset ring-transparent focus:ring-green-500 transition-colors cursor-pointer
                    ${currentOption.color}
                    ${isPending ? 'opacity-70 cursor-wait' : ''}
                `}
            >
                {statusOptions.map((option) => (
                    <option key={option.value} value={option.value} className="bg-white text-zinc-900 dark:bg-zinc-800 dark:text-zinc-200">
                        {option.label}
                    </option>
                ))}
            </select>
            {/* Custom Arrow Icon for styling */}
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2">
                <svg className={`h-3 w-3 ${currentOption.color.split(' ')[1]}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                </svg>
            </div>
        </div>
    );
}
