'use client';

import { useActionState } from 'react';
import { updateCourt, upsertSchedule } from '@/app/actions';
import { useState } from 'react';
import { useFormStatus } from 'react-dom';
import Link from 'next/link';

// Helper for days
const DAYS = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

export default function EditCourtForm({ court, venueId }: { court: any, venueId: number }) {
    const [state, dispatch] = useActionState(updateCourt, { success: false, message: '', errors: {} });

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left Column: Basic Info */}
            <div>
                <h2 className="text-xl font-semibold mb-4 dark:text-gray-200">Información Básica</h2>
                <form action={dispatch} className="space-y-6 bg-white dark:bg-zinc-900 p-6 rounded-xl border border-zinc-200 dark:border-zinc-800">
                    <input type="hidden" name="courtId" value={court.id} />
                    <input type="hidden" name="venueId" value={venueId} />

                    <div>
                        <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">Nombre</label>
                        <input
                            type="text"
                            name="name"
                            defaultValue={court.name}
                            required
                            className="mt-1 block w-full rounded-md border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">Deporte</label>
                        <select name="sport" defaultValue={court.sport} className="mt-1 block w-full rounded-md border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800">
                            <option value="Futbol">Fútbol</option>
                            <option value="Voley">Vóley</option>
                            <option value="Basket">Basket</option>
                            <option value="Tenis">Tenis</option>
                        </select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">Tipo suelo</label>
                            <select name="type" defaultValue={court.type || 'Sintética'} className="mt-1 block w-full rounded-md border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800">
                                <option value="Sintética">Sintética</option>
                                <option value="Losa">Losa</option>
                                <option value="Parquet">Parquet</option>
                                <option value="Arcilla">Arcilla</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">Precio Base (S/)</label>
                            <input
                                type="number"
                                name="pricePerHour"
                                defaultValue={court.pricePerHour}
                                required
                                min="0"
                                className="mt-1 block w-full rounded-md border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800"
                            />
                        </div>
                    </div>

                    <div className="flex gap-4 pt-4">
                        <Link
                            href={`/admin/venues/${venueId}`}
                            className="px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100 rounded-md dark:text-zinc-300 dark:hover:bg-zinc-800"
                        >
                            Volver
                        </Link>
                        <SubmitButton />
                    </div>
                    {state.message && (
                        <p className={`text-sm ${state.success ? 'text-green-600' : 'text-red-500'}`}>{state.message}</p>
                    )}
                </form>
            </div>

            {/* Right Column: Schedules */}
            <div>
                <h2 className="text-xl font-semibold mb-4 dark:text-gray-200">Horarios y Precios</h2>
                <div className="space-y-4">
                    {DAYS.map((dayName, index) => {
                        // Find existing schedule for this day
                        const schedule = court.schedules.find((s: any) => s.dayOfWeek === index);
                        return (
                            <ScheduleRow
                                key={index}
                                dayName={dayName}
                                dayIndex={index}
                                courtId={court.id}
                                existingSchedule={schedule}
                                defaultPrice={court.pricePerHour}
                            />
                        );
                    })}
                </div>
            </div>
        </div>
    );
}

function SubmitButton() {
    const { pending } = useFormStatus();
    return (
        <button
            type="submit"
            disabled={pending}
            className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 disabled:opacity-50 dark:bg-zinc-50 dark:text-zinc-900"
        >
            {pending ? 'Guardando...' : 'Actualizar Información'}
        </button>
    );
}

function ScheduleRow({ dayName, dayIndex, courtId, existingSchedule, defaultPrice }: any) {
    const [state, dispatch] = useActionState(upsertSchedule, { success: false, message: '' });

    return (
        <form action={dispatch} className="flex items-center gap-2 bg-white dark:bg-zinc-900 p-3 rounded-lg border border-zinc-200 dark:border-zinc-800">
            <input type="hidden" name="courtId" value={courtId} />
            <input type="hidden" name="dayOfWeek" value={dayIndex} />

            <div className="w-24 font-medium text-sm text-zinc-700 dark:text-zinc-300">{dayName}</div>

            <input
                type="time"
                name="startTime"
                defaultValue={existingSchedule?.startTime || '08:00'}
                className="w-24 rounded border border-zinc-300 px-2 py-1 text-sm dark:border-zinc-700 dark:bg-zinc-800"
            />
            <span className="text-zinc-400">-</span>
            <input
                type="time"
                name="endTime"
                defaultValue={existingSchedule?.endTime || '23:00'}
                className="w-24 rounded border border-zinc-300 px-2 py-1 text-sm dark:border-zinc-700 dark:bg-zinc-800"
            />

            <div className="relative">
                <span className="absolute left-2 top-1.5 text-xs text-zinc-500">S/</span>
                <input
                    type="number"
                    name="price"
                    defaultValue={existingSchedule?.price || defaultPrice}
                    className="w-20 pl-6 rounded border border-zinc-300 px-2 py-1 text-sm dark:border-zinc-700 dark:bg-zinc-800"
                />
            </div>

            <SaveScheduleButton success={state.success} />
        </form>
    )
}

function SaveScheduleButton({ success }: { success: boolean }) {
    const { pending } = useFormStatus();

    if (success) {
        return <span className="text-green-500 text-xs">✓</span>
    }

    return (
        <button
            disabled={pending}
            className="text-xs bg-zinc-100 hover:bg-zinc-200 text-zinc-600 px-2 py-1 rounded dark:bg-zinc-800 dark:hover:bg-zinc-700 dark:text-zinc-300"
        >
            {pending ? '...' : 'Guardar'}
        </button>
    )
}
