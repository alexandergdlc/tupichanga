'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { createBooking, getBookings } from '@/app/actions';


interface BookingCalendarProps {
    courtId: number;
    pricePerHour: number;
    yapeQrUrl?: string | null;
}

export default function BookingCalendar({ courtId, pricePerHour, yapeQrUrl }: BookingCalendarProps) {
    const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
    const [selectedTime, setSelectedTime] = useState<string | null>(null);
    const [bookedSlots, setBookedSlots] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
    const [showYapeModal, setShowYapeModal] = useState(false);

    // Generate some dummy slots for the day (16:00 to 23:00)
    const timeSlots = [
        '16:00', '17:00', '18:00', '19:00', '20:00', '21:00', '22:00', '23:00'
    ];

    useEffect(() => {
        const fetchBookings = async () => {
            setBookedSlots([]);
            setMessage(null);
            if (selectedDate) {
                const slots = await getBookings(courtId, selectedDate);
                setBookedSlots(slots);
            }
        };
        fetchBookings();
    }, [courtId, selectedDate]);

    const handleSlotClick = (time: string) => {
        const isBooked = bookedSlots.includes(time);

        if (isBooked) {
            setMessage({ type: 'error', text: `La hora ${time} ya ha sido reservada.` });
            setSelectedTime(null);
        } else {
            setMessage(null); // Clear previous errors
            setSelectedTime(time);
        }
    };

    const handleBooking = async () => {
        if (!selectedTime) return;

        setIsLoading(true);
        setMessage(null);

        // Construct full ISO datetime string
        const dateTime = new Date(`${selectedDate}T${selectedTime}:00`);

        const result = await createBooking(courtId, dateTime.toISOString(), pricePerHour);

        if (result.success) {
            // Show Yape Modal instead of just success message
            setShowYapeModal(true);
            setMessage({ type: 'success', text: '¡Reserva preliminar creada! Procede al pago.' });

            // Refresh bookings to mark this one as taken immediately
            const newSlots = await getBookings(courtId, selectedDate);
            setBookedSlots(newSlots);
        } else {
            setMessage({ type: 'error', text: 'Hubo un error al reservar. Inténtalo de nuevo.' });
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
                    {/* Tip: on some browsers text-align center might look better, but let's keep left for now */}
                </div>
            </div>

            <p className="mb-3 text-sm font-bold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                Horarios Disponibles
            </p>
            <div className="grid grid-cols-4 gap-3 mb-6">
                {timeSlots.map((time) => {
                    const isBooked = bookedSlots.includes(time);
                    const isSelected = selectedTime === time;

                    let buttonClass = 'bg-white border border-zinc-200 text-zinc-600 shadow-sm hover:border-green-500 hover:text-green-600 hover:shadow-md dark:bg-zinc-900 dark:border-zinc-700 dark:text-zinc-400';

                    if (isBooked) {
                        // Occupied: Subtle gray, no interaction
                        buttonClass = 'bg-zinc-50 text-zinc-300 cursor-not-allowed border-transparent shadow-none dark:bg-zinc-800/50 dark:text-zinc-600';
                    } else if (isSelected) {
                        // Selected: Brand Primary (Green), Elevated
                        buttonClass = 'bg-green-600 border-green-600 text-white shadow-lg scale-105 ring-2 ring-green-600 ring-offset-2 ring-offset-white dark:ring-offset-zinc-900';
                    }

                    return (
                        <button
                            key={time}
                            onClick={() => !isBooked && handleSlotClick(time)}
                            disabled={isBooked}
                            className={`rounded-xl py-3 text-sm font-bold transition-all duration-200 ${buttonClass}`}
                        >
                            {time}
                        </button>
                    );
                })}
            </div>

            {selectedTime && !bookedSlots.includes(selectedTime) && (
                <div className="rounded-lg bg-zinc-50 p-4 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700">
                    <p className="text-sm mb-2">Resumen:</p>
                    <div className="flex justify-between font-bold text-lg mb-4">
                        <span>{selectedDate} - {selectedTime}</span>
                        <span>S/ {pricePerHour}</span>
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
                                href={`https://wa.me/51902293694?text=Hola, acabo de reservar para el ${selectedDate} a las ${selectedTime}. Adjunto mi comprobante de pago.`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="block w-full rounded-lg bg-emerald-500 px-4 py-3 text-center font-bold text-white hover:bg-emerald-600"
                            >
                                📱 Enviar Comprobante por WhatsApp
                            </a>
                            <button
                                onClick={() => {
                                    setShowYapeModal(false);
                                    setSelectedTime(null);
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
