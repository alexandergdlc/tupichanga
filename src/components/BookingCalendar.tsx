'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { createBooking, getDocAvailability } from '@/app/actions';


interface BookingCalendarProps {
    courtId: number;
    pricePerHour: number; // Used only as fallback or reference now
    yapeQrUrl?: string | null;
    userRole?: string;
}

export default function BookingCalendar({ courtId, pricePerHour, yapeQrUrl, userRole }: BookingCalendarProps) {
    const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
    const [selectedSlot, setSelectedSlot] = useState<{ time: string, price: number } | null>(null);
    const [availableSlots, setAvailableSlots] = useState<{ time: string, price: number, isBooked: boolean }[]>([]);

    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
    const [showYapeModal, setShowYapeModal] = useState(false);

    useEffect(() => {
        const fetchBookings = async () => {
            // ... existing fetch logic is fine ...
            setAvailableSlots([]);
            setMessage(null);
            setSelectedSlot(null);

            if (selectedDate) {
                const slots = await getDocAvailability(courtId, selectedDate);
                setAvailableSlots(slots);
            }
        };
        fetchBookings();
    }, [courtId, selectedDate]);

    const handleSlotClick = (slot: { time: string, price: number, isBooked: boolean }) => {
        if (slot.isBooked) return;

        if (userRole === 'OWNER') {
            // Optional: visual feedback
            return;
        }

        setMessage(null);
        setSelectedSlot(slot);
    };

    const handleBooking = async () => {
        if (!selectedSlot) return;

        setIsLoading(true);
        setMessage(null);

        // Construct full ISO datetime string
        const dateTime = new Date(`${selectedDate}T${selectedSlot.time}:00`);

        // We pass the price just for sanity check or analytics, but server strictly recalculates it
        const result = await createBooking(courtId, dateTime.toISOString(), selectedSlot.price);

        if (result.success) {
            setShowYapeModal(true);
            setMessage({ type: 'success', text: '¡Reserva preliminar creada! Procede al pago.' });

            // Refresh to update UI
            const slots = await getDocAvailability(courtId, selectedDate);
            setAvailableSlots(slots);
        } else {
            setMessage({ type: 'error', text: result.error || 'Hubo un error al reservar.' });
        }

        setIsLoading(false);
    };

    return (
        <div className="mt-4">
            <div className="mb-6">
                <label className="mb-2 block text-sm font-bold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                    Fecha de Reserva
                </label>
                <div className="relative">
                    <input
                        type="date"
                        value={selectedDate}
                        onChange={(e) => setSelectedDate(e.target.value)}
                        className="w-full cursor-pointer appearance-none rounded-xl bg-zinc-100 px-4 py-3 text-lg font-semibold text-zinc-900 transition hover:bg-zinc-200 focus:outline-none focus:ring-2 focus:ring-green-500 dark:bg-zinc-800 dark:text-zinc-100"
                    />
                </div>
            </div>

            <p className="mb-3 text-sm font-bold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                Horarios Disponibles
            </p>

            {userRole === 'OWNER' && (
                <div className="mb-4 rounded-lg border border-blue-200 bg-blue-50 p-4 text-blue-700 dark:border-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
                    <p className="flex items-center gap-2 text-sm font-semibold">
                        <span>👀</span>
                        Modo Vista: Como dueño, solo puedes ver la disponibilidad.
                    </p>
                </div>
            )}

            {availableSlots.length === 0 ? (
                <div className="text-center py-6 bg-zinc-50 dark:bg-zinc-800/50 rounded-lg border border-dashed border-zinc-200 dark:border-zinc-700">
                    <p className="text-zinc-500">No hay horarios disponibles para este día.</p>
                </div>
            ) : (
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 mb-6">
                    {availableSlots.map((slot) => {
                        const isSelected = selectedSlot?.time === slot.time;

                        // Check if slot is in the past
                        const now = new Date();
                        // selectedDate is YYYY-MM-DD. We assume local browser time for "now".
                        // We construct a date for the slot.
                        const slotDate = new Date(`${selectedDate}T${slot.time}`);
                        const isPast = slotDate < now;

                        let buttonClass = 'bg-white border border-zinc-200 text-zinc-600 shadow-sm hover:border-green-500 hover:text-green-600 hover:shadow-md dark:bg-zinc-900 dark:border-zinc-700 dark:text-zinc-400';

                        if (slot.isBooked || isPast) {
                            // Occupied or Past
                            buttonClass = 'bg-zinc-50 text-zinc-300 cursor-not-allowed border-transparent shadow-none dark:bg-zinc-800/50 dark:text-zinc-600';
                        } else if (isSelected) {
                            // Selected
                            buttonClass = 'bg-green-600 border-green-600 text-white shadow-lg scale-105 ring-2 ring-green-600 ring-offset-2 ring-offset-white dark:ring-offset-zinc-900';
                        }

                        return (
                            <button
                                key={slot.time}
                                onClick={() => handleSlotClick(slot)}
                                disabled={slot.isBooked || isPast}
                                className={`flex flex-col items-center justify-center rounded-xl py-3 text-sm font-bold transition-all duration-200 ${buttonClass}`}
                            >
                                <span>{slot.time}</span>
                                {!slot.isBooked && !isPast && (
                                    <span className={`text-[10px] uppercase tracking-wider ${isSelected ? 'text-green-100' : 'text-zinc-400'}`}>
                                        S/ {slot.price}
                                    </span>
                                )}
                            </button>
                        );
                    })}
                </div>
            )}

            {selectedSlot && (
                <div className="rounded-lg bg-zinc-50 p-4 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700">
                    <p className="text-sm mb-2">Resumen:</p>
                    <div className="flex justify-between font-bold text-lg mb-4">
                        <span>{selectedDate} - {selectedSlot.time}</span>
                        <span>S/ {selectedSlot.price}</span>
                    </div>
                    <button
                        onClick={handleBooking}
                        disabled={isLoading}
                        className="w-full rounded bg-green-600 py-2 font-bold text-white hover:bg-green-700 disabled:opacity-50"
                    >
                        {isLoading ? 'Procesando...' : 'Confirmar Reserva'}
                    </button>
                </div>
            )}

            {message && (
                <div className={`mt-4 rounded p-3 text-sm font-medium ${message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {message.text}
                </div>
            )}

            {showYapeModal && typeof document !== 'undefined' && createPortal(
                <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
                    <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-2xl dark:bg-zinc-900 animate-in fade-in zoom-in duration-300">
                        <h3 className="mb-4 text-center text-xl font-bold text-zinc-900 dark:text-white">¡Reserva Iniciada! 🚀</h3>
                        <p className="mb-4 text-center text-zinc-600 dark:text-zinc-400">
                            Para confirmar, Yapea <b>S/ {pricePerHour}</b> al siguiente QR y envía el comprobante.
                        </p>

                        {yapeQrUrl ? (
                            <div className="mb-6 flex justify-center">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img src={yapeQrUrl} alt="QR Yape" className="h-64 w-64 rounded-lg object-contain border border-zinc-200" />
                            </div>
                        ) : (
                            <div className="mb-6 flex h-64 w-full items-center justify-center rounded-lg bg-zinc-100 dark:bg-zinc-800">
                                <p className="text-zinc-500">El dueño no ha subido QR aún. Pide el número por WhatsApp.</p>
                            </div>
                        )}

                        <div className="space-y-3">
                            <a
                                href={`https://wa.me/51902293694?text=Hola, acabo de reservar para el ${selectedDate} a las ${selectedSlot?.time}. Adjunto mi comprobante de pago.`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="block w-full rounded-lg bg-emerald-500 px-4 py-3 text-center font-bold text-white hover:bg-emerald-600"
                            >
                                📱 Enviar Comprobante por WhatsApp
                            </a>
                            <button
                                onClick={() => {
                                    setShowYapeModal(false);
                                    setSelectedSlot(null);
                                }}
                                className="block w-full rounded-lg bg-zinc-200 px-4 py-3 text-center font-medium text-zinc-800 hover:bg-zinc-300 dark:bg-zinc-800 dark:text-zinc-200"
                            >
                                Cerrar
                            </button>
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
}
