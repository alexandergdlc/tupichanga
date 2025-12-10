'use client';

import { useActionState } from 'react';
import { createCourt } from '@/app/actions';
import { useState } from 'react';
import { useFormStatus } from 'react-dom';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function CreateCourtForm({ venueId }: { venueId: number }) {
    const [state, dispatch] = useActionState(createCourt, { success: false, message: '', errors: {} });
    const router = useRouter();

    if (state.success) {
        // Simple redirect or success message
        router.push(`/admin/venues/${venueId}`);
        return (
            <div className="p-4 bg-green-50 text-green-700 rounded-md">
                Cancha creada exitosamente. Redirigiendo...
            </div>
        );
    }

    return (
        <form action={dispatch} className="space-y-6 bg-white dark:bg-zinc-900 p-6 rounded-xl border border-zinc-200 dark:border-zinc-800">
            <input type="hidden" name="venueId" value={venueId} />

            <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">Nombre</label>
                <input
                    type="text"
                    name="name"
                    required
                    placeholder="Ej. Cancha 1"
                    className="mt-1 block w-full rounded-md border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800"
                />
            </div>

            <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">Deporte</label>
                <select name="sport" className="mt-1 block w-full rounded-md border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800">
                    <option value="Futbol">Fútbol</option>
                    <option value="Voley">Vóley</option>
                    <option value="Basket">Basket</option>
                    <option value="Tenis">Tenis</option>
                </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">Tipo suelo</label>
                    <select name="type" className="mt-1 block w-full rounded-md border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800">
                        <option value="Sintética">Sintética</option>
                        <option value="Losa">Losa</option>
                        <option value="Parquet">Parquet</option>
                        <option value="Arcilla">Arcilla</option>
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">Precio / Hora (S/)</label>
                    <input
                        type="number"
                        name="pricePerHour"
                        required
                        min="0"
                        placeholder="Ej. 80"
                        className="mt-1 block w-full rounded-md border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800"
                    />
                </div>
            </div>

            <div className="flex gap-4 pt-4">
                <Link
                    href={`/admin/venues/${venueId}`}
                    className="px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100 rounded-md dark:text-zinc-300 dark:hover:bg-zinc-800"
                >
                    Cancelar
                </Link>
                <SubmitButton />
            </div>
            {state.message && !state.success && (
                <p className="text-red-500 text-sm">{state.message}</p>
            )}
        </form>
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
            {pending ? 'Guardando...' : 'Crear Cancha'}
        </button>
    );
}
