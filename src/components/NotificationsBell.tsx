'use client';

import { useState } from 'react';
import Link from 'next/link';

type Booking = {
    id: number;
    startTime: Date;
    court: {
        name: string;
        venue: {
            name: string;
        }
    };
};

export default function NotificationsBell({ bookings }: { bookings: Booking[] }) {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div className="relative">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-2 text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200 transition-colors"
                aria-label="Notificaciones"
            >
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                >
                    <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
                    <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
                </svg>

                {bookings.length > 0 && (
                    <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                        {bookings.length}
                    </span>
                )}
            </button>

            {isOpen && (
                <>
                    <div
                        className="fixed inset-0 z-40"
                        onClick={() => setIsOpen(false)}
                    />
                    <div className="absolute right-0 mt-2 w-80 z-50 origin-top-right rounded-lg border border-zinc-200 bg-white p-2 shadow-xl ring-1 ring-black ring-opacity-5 focus:outline-none dark:border-zinc-800 dark:bg-zinc-900">
                        <div className="px-4 py-2 text-sm font-semibold text-zinc-900 dark:text-zinc-100 border-b border-zinc-100 dark:border-zinc-800 mb-2">
                            Notificaciones
                        </div>

                        {bookings.length === 0 ? (
                            <div className="px-4 py-3 text-sm text-zinc-500 text-center">
                                No tienes notificaciones nuevas.
                            </div>
                        ) : (
                            <div className="space-y-1 max-h-64 overflow-y-auto">
                                {bookings.map((booking) => {
                                    const minutesLeft = Math.ceil((new Date(booking.startTime).getTime() - Date.now()) / 60000);
                                    let timeText = `En ${minutesLeft} minutos`;
                                    if (minutesLeft > 60) {
                                        const hours = Math.floor(minutesLeft / 60);
                                        const mins = minutesLeft % 60;
                                        timeText = `En ${hours}h ${mins}m`;
                                    }

                                    return (
                                        <Link
                                            key={booking.id}
                                            href="/my-bookings"
                                            onClick={() => setIsOpen(false)}
                                            className="block rounded-md px-4 py-3 text-sm hover:bg-zinc-50 dark:hover:bg-zinc-800"
                                        >
                                            <p className="font-semibold text-zinc-900 dark:text-zinc-200">
                                                Partido en {booking.court.venue.name}
                                            </p>
                                            <p className="text-zinc-500 text-xs">
                                                {booking.court.name} - {timeText}
                                            </p>
                                            <p className="text-zinc-400 text-[10px] mt-1">
                                                {new Date(booking.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </p>
                                        </Link>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </>
            )}
        </div>
    );
}
