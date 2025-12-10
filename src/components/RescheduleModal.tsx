'use client';

import { useState, useEffect } from 'react';
import { getBookings, rescheduleBooking } from '@/app/actions';

interface RescheduleModalProps {
    bookingId: number;
    courtId: number;
    courtName: string;
    currentDate: string; // ISO string
    onClose: () => void;
}

export default function RescheduleModal({ bookingId, courtId, courtName, currentDate, onClose }: RescheduleModalProps) {
    const [selectedDate, setSelectedDate] = useState<string>(new Date(currentDate).toISOString().split('T')[0]);
    const [selectedTime, setSelectedTime] = useState<string | null>(null);
    const [bookedSlots, setBookedSlots] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    const timeSlots = [
        '08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00',
        '16:00', '17:00', '18:00', '19:00', '20:00', '21:00', '22:00', '23:00'
    ];

    useEffect(() => {
        const fetchBookings = async () => {
            setBookedSlots([]);
            if (selectedDate) {
                const slots = await getBookings(courtId, selectedDate);
                // Note: This includes the *current* booking if it falls on this day.
                // ideally backend filters specific booking, but for list simplicity we might see our own slot as red?
                // actually rescheduleBooking handles conflict excluding self, but getBookings returns all.
                // UX: It's okay if my current slot appears red, I am picking a NEW one. 
                // If I pick the same one, it's a no-op or valid. 
                // Let's leave it as is.
                setBookedSlots(slots);
            }
        };
        fetchBookings();
    }, [courtId, selectedDate]);

    const handleConfirm = async () => {
        if (!selectedTime) return;
        setIsLoading(true);
        setMessage(null);

        const dateTime = new Date(`${selectedDate}T${selectedTime}:00`);
        const result = await rescheduleBooking(bookingId, dateTime.toISOString());

        if (result.success) {
            setMessage({ type: 'success', text: 'Reprogramado con éxito. Redirigiendo...' });
            setTimeout(() => {
                onClose();
                window.location.reload(); // Simple reload to update parent list
            }, 1000);
        } else {
            setMessage({ type: 'error', text: result.message || 'Error al reprogramar' });
        }
        setIsLoading(false);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
            <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-2xl dark:bg-zinc-900">
                <h3 className="mb-2 text-xl font-bold text-zinc-900 dark:text-white">Reprogramar Reserva #{bookingId}</h3>
                <p className="mb-4 text-sm text-zinc-500">Cancha: {courtName}</p>

                <div className="mb-4">
                    <label className="block text-sm font-medium mb-1 dark:text-zinc-300">Nueva Fecha</label>
                    <input
                        type="date"
                        value={selectedDate}
                        onChange={(e) => setSelectedDate(e.target.value)}
                        className="w-full rounded border border-zinc-300 p-2 dark:bg-zinc-800 dark:border-zinc-700"
                    />
                </div>

                <div className="grid grid-cols-4 gap-2 mb-6 max-h-48 overflow-y-auto">
                    {timeSlots.map((time) => {
                        const isBooked = bookedSlots.includes(time);
                        const isSelected = selectedTime === time;

                        // If the slot is the booking's CURRENT time, maybe show it differently?
                        // For now treat as booked. User wants to change it.
                        let buttonClass = 'border-zinc-200 hover:border-green-500 hover:text-green-700 dark:border-zinc-700 dark:hover:text-green-400';
                        if (isBooked) buttonClass = 'bg-red-50 text-red-300 cursor-not-allowed dark:bg-red-900/10 dark:text-red-500/50';
                        if (isSelected) buttonClass = 'bg-green-600 border-green-600 text-white';

                        return (
                            <button
                                key={time}
                                disabled={isBooked}
                                onClick={() => setSelectedTime(time)}
                                className={`rounded border py-2 text-sm font-medium transition-colors ${buttonClass}`}
                            >
                                {time}
                            </button>
                        );
                    })}
                </div>

                {message && (
                    <div className={`mb-4 rounded p-2 text-sm text-center ${message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        {message.text}
                    </div>
                )}

                <div className="flex gap-3">
                    <button onClick={onClose} className="flex-1 rounded bg-zinc-200 py-2 font-medium text-zinc-800 hover:bg-zinc-300 dark:bg-zinc-800 dark:text-zinc-300">
                        Cancelar
                    </button>
                    <button
                        onClick={handleConfirm}
                        disabled={!selectedTime || isLoading}
                        className="flex-1 rounded bg-green-600 py-2 font-bold text-white hover:bg-green-700 disabled:opacity-50"
                    >
                        {isLoading ? 'Guardando...' : 'Confirmar Cambio'}
                    </button>
                </div>
            </div>
        </div>
    );
}
