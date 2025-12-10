'use client';

import { useActionState } from 'react';
import { updateCourt } from '@/app/actions';
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
                <h2 className="text-xl font-semibold mb-4 dark:text-gray-200">Horarios y Precios (24h)</h2>
                <div className="space-y-6">
                    {DAYS.map((dayName, index) => {
                        // Filter schedules for this day
                        const daySchedules = court.schedules.filter((s: any) => s.dayOfWeek === index);
                        return (
                            <DayScheduleManager
                                key={index}
                                dayName={dayName}
                                dayIndex={index}
                                courtId={court.id}
                                existingSchedules={daySchedules}
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

import { saveDaySchedules } from '@/app/actions';

function DayScheduleManager({ dayName, dayIndex, courtId, existingSchedules, defaultPrice }: any) {
    // Local state for managing the list of slots before saving
    // Format: { startTime: '08:00', endTime: '12:00', price: 50, id: tempId }
    const [schedules, setSchedules] = useState<any[]>(
        existingSchedules.length > 0
            ? existingSchedules.map((s: any) => ({ ...s, price: Number(s.price) }))
            : [{ startTime: '08:00', endTime: '23:00', price: defaultPrice }]
    );

    // Percentage helper state
    const [percent, setPercent] = useState(20);
    const [afternoonStart, setAfternoonStart] = useState('13:00');

    // Action state for saving
    const [state, dispatch] = useActionState(saveDaySchedules, { success: false, message: '' });

    const addSlot = () => {
        setSchedules([...schedules, { startTime: '00:00', endTime: '00:00', price: defaultPrice }]);
    };

    const updateSlot = (index: number, field: string, value: any) => {
        const newSchedules = [...schedules];
        newSchedules[index] = { ...newSchedules[index], [field]: value };
        setSchedules(newSchedules);
    };

    const removeSlot = (index: number) => {
        const newSchedules = schedules.filter((_, i) => i !== index);
        setSchedules(newSchedules);
    };

    const applyPercentage = () => {
        // Logic: Split day into Morning (00:00 - afternoonStart) and Afternoon (afternoonStart - 24:00)
        // Set Morning price = defaultPrice
        // Set Afternoon price = defaultPrice * (1 + percent/100)

        const morningPrice = defaultPrice;
        const afternoonPrice = Math.round(morningPrice * (1 + percent / 100));

        setSchedules([
            { startTime: '06:00', endTime: afternoonStart, price: morningPrice },
            { startTime: afternoonStart, endTime: '23:00', price: afternoonPrice }
        ]);
    };

    return (
        <div className="bg-white dark:bg-zinc-900 p-4 rounded-lg border border-zinc-200 dark:border-zinc-800">
            <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-zinc-800 dark:text-zinc-200">{dayName}</h3>
                <form action={dispatch}>
                    <input type="hidden" name="courtId" value={courtId} />
                    <input type="hidden" name="dayOfWeek" value={dayIndex} />
                    <input type="hidden" name="schedules" value={JSON.stringify(schedules)} />
                    <SaveButton success={state.success} />
                </form>
            </div>

            {/* List of Slots */}
            <div className="space-y-2 mb-4">
                {schedules.map((slot, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                        <input
                            type="time"
                            value={slot.startTime}
                            onChange={(e) => updateSlot(idx, 'startTime', e.target.value)}
                            className="w-24 rounded border border-zinc-300 px-2 py-1 text-sm dark:border-zinc-700 dark:bg-zinc-800"
                        />
                        <span className="text-zinc-400 text-sm">a</span>
                        <input
                            type="time"
                            value={slot.endTime}
                            onChange={(e) => updateSlot(idx, 'endTime', e.target.value)}
                            className="w-24 rounded border border-zinc-300 px-2 py-1 text-sm dark:border-zinc-700 dark:bg-zinc-800"
                        />
                        <div className="relative w-24">
                            <span className="absolute left-2 top-1.5 text-xs text-zinc-500">S/</span>
                            <input
                                type="number"
                                value={slot.price}
                                onChange={(e) => updateSlot(idx, 'price', e.target.value)}
                                className="w-full pl-6 rounded border border-zinc-300 px-2 py-1 text-sm dark:border-zinc-700 dark:bg-zinc-800"
                            />
                        </div>
                        <button
                            type="button"
                            onClick={() => removeSlot(idx)}
                            className="text-red-500 hover:text-red-700 text-lg px-2"
                        >
                            ×
                        </button>
                    </div>
                ))}
            </div>

            {/* Tools */}
            <div className="flex flex-wrap items-center gap-3 pt-3 border-t border-zinc-100 dark:border-zinc-800">
                <button
                    type="button"
                    onClick={addSlot}
                    className="text-xs font-semibold text-zinc-600 hover:text-zinc-900 underline dark:text-zinc-400"
                >
                    + Agregar Rango
                </button>

                <div className="flex items-center gap-2 text-xs bg-zinc-50 dark:bg-zinc-800 px-2 py-1 rounded ml-auto">
                    <span className="text-zinc-500">Turno Tarde (+</span>
                    <input
                        type="number"
                        value={percent}
                        onChange={(e) => setPercent(Number(e.target.value))}
                        className="w-10 h-6 text-xs border rounded px-1 dark:bg-zinc-900 text-center"
                        min="0"
                        max="100"
                    />
                    <span className="text-zinc-500">%) desde:</span>
                    <input
                        type="time"
                        value={afternoonStart}
                        onChange={(e) => setAfternoonStart(e.target.value)}
                        className="w-16 h-6 text-xs border rounded px-1 dark:bg-zinc-900"
                    />
                    <button
                        type="button"
                        onClick={applyPercentage}
                        className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded hover:bg-blue-200 dark:bg-blue-900/30 dark:text-blue-300"
                    >
                        Aplicar
                    </button>
                </div>
            </div>

            {state.message && !state.success && (
                <p className="text-xs text-red-500 mt-2">{state.message}</p>
            )}
        </div>
    );
}

function SaveButton({ success }: { success: boolean }) {
    const { pending } = useFormStatus();

    if (success) {
        return <span className="text-green-600 font-bold text-sm animate-pulse">¡Guardado! ✓</span>;
    }

    return (
        <button
            type="submit"
            disabled={pending}
            className="text-xs bg-zinc-900 text-white px-3 py-1.5 rounded hover:bg-zinc-700 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900"
        >
            {pending ? '...' : 'Guardar Día'}
        </button>
    );
}
