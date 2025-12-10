'use client';

import { useState } from 'react';
import Link from 'next/link';
import RescheduleModal from '@/components/RescheduleModal';

// Define strict types matching Prisma include result structure
type Booking = {
    id: number;
    status: string;
    startTime: Date;
    totalPrice: number;
    court: {
        id: number;
        name: string;
        venue: {
            name: string;
        }
    }
}

export default function MyBookingsClient({ initialBookings }: { initialBookings: Booking[] }) {
    const [bookings] = useState<Booking[]>(initialBookings);
    const [editingBooking, setEditingBooking] = useState<Booking | null>(null);

    return (
        <div className="container mx-auto px-4 py-8">
            <h1 className="mb-6 text-3xl font-bold text-zinc-900 dark:text-zinc-50">Mis Reservas</h1>

            {bookings.length === 0 ? (
                <div className="rounded-lg border border-zinc-200 bg-white p-8 text-center dark:border-zinc-800 dark:bg-zinc-900">
                    <p className="text-zinc-500 mb-4">No tienes reservas aún.</p>
                    <Link href="/search" className="text-green-600 hover:underline font-medium">
                        Buscar canchas disponibles
                    </Link>
                </div>
            ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {bookings.map((booking) => (
                        <div key={booking.id} className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
                            <div className="border-b border-zinc-100 bg-zinc-50 px-4 py-3 dark:border-zinc-800 dark:bg-zinc-800/50 flex justify-between items-center">
                                <span className="font-semibold text-zinc-900 dark:text-zinc-200">
                                    Reserva #{booking.id}
                                </span>
                                {(() => {
                                    const statusConfig: Record<string, { label: string; className: string }> = {
                                        'PENDING': { label: 'En Espera', className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-500' },
                                        'CONFIRMED': { label: 'Confirmado', className: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' },
                                        'REJECTED': { label: 'Rechazado', className: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' },
                                        'COMPLETED': { label: 'Completado', className: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' },
                                    };
                                    const config = statusConfig[booking.status] || { label: booking.status, className: 'bg-zinc-100 text-zinc-800' };

                                    return (
                                        <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${config.className}`}>
                                            {config.label}
                                        </span>
                                    );
                                })()}
                            </div>
                            <div className="p-4">
                                <h3 className="mb-1 text-lg font-bold text-zinc-900 dark:text-zinc-50">
                                    {booking.court.venue.name}
                                </h3>
                                <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-4">
                                    {booking.court.name}
                                </p>

                                <div className="space-y-2 text-sm">
                                    <div className="flex justify-between">
                                        <span className="text-zinc-500">Fecha:</span>
                                        <span className="font-medium text-zinc-900 dark:text-zinc-200" suppressHydrationWarning>
                                            {new Date(booking.startTime).toLocaleDateString()}
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-zinc-500">Hora:</span>
                                        <span className="font-medium text-zinc-900 dark:text-zinc-200" suppressHydrationWarning>
                                            {new Date(booking.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                    </div>
                                    <div className="flex justify-between border-t border-zinc-100 pt-2 mt-2 dark:border-zinc-800">
                                        <span className="text-zinc-500">Total:</span>
                                        <span className="font-bold text-zinc-900 dark:text-zinc-200">
                                            S/ {booking.totalPrice}
                                        </span>
                                    </div>
                                </div>

                                {['PENDING', 'CONFIRMED'].includes(booking.status) && (
                                    <button
                                        onClick={() => setEditingBooking(booking)}
                                        className="mt-4 w-full rounded-lg border border-zinc-300 bg-white py-2 text-sm font-semibold text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700"
                                    >
                                        ✏️ Reprogramar
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {editingBooking && (
                <RescheduleModal
                    bookingId={editingBooking.id}
                    courtId={editingBooking.court.id}
                    courtName={editingBooking.court.name}
                    currentDate={new Date(editingBooking.startTime).toISOString()}
                    onClose={() => setEditingBooking(null)}
                />
            )}
        </div>
    );
}
