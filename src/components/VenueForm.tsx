'use client';

import { useFormStatus } from 'react-dom';
import { useActionState } from 'react';
import { createVenue } from '@/app/actions';
import { useState } from 'react';
import Link from 'next/link';

// Define the state type explicitly
type State = {
    message: string;
    errors?: {
        name?: string[];
        description?: string[];
        address?: string[];
        city?: string[];
        district?: string[];
        imageUrl?: string[];
        yapeQrUrl?: string[];
    };
    success?: boolean;
};

const initialState: State = { success: false, message: '', errors: {} };

interface VenueFormProps {
    venue?: any; // Type this properly if possible, but any is fine for now
    action?: (prevState: any, formData: FormData) => Promise<State>;
}

export default function VenueForm({ venue, action }: VenueFormProps) {
    const [state, dispatch, isPending] = useActionState(action || createVenue, initialState);
    const [success, setSuccess] = useState(false);

    // Use useEffect or just check state during render if we want to show success UI.
    // Warning: Updating state during render is bad practice, but for simple conditional return it's 'okay' if carefully done.
    // Better approach:
    if (state?.success && !success) {
        setTimeout(() => setSuccess(true), 0); // Defer state update to avoid warnings
    }

    if (success) {
        return (
            <div className="rounded-lg bg-green-50 p-6 text-center dark:bg-green-900/20 border border-green-200 dark:border-green-800">
                <h2 className="text-xl font-bold text-green-800 dark:text-green-400 mb-2">
                    {venue ? '¡Local Actualizado!' : '¡Local Creado!'}
                </h2>
                <p className="text-green-700 dark:text-green-300 mb-6">
                    {venue ? 'Los datos han sido actualizados correctamente.' : 'El local ha sido registrado correctamente y ya aparece en el buscador.'}
                </p>
                <div className="flex gap-4 justify-center">
                    <Link href="/admin" className="px-4 py-2 bg-white border border-green-200 rounded text-green-700 font-medium hover:bg-green-50">
                        Volver al Panel
                    </Link>
                    {!venue && (
                        <button onClick={() => setSuccess(false)} className="px-4 py-2 bg-green-600 rounded text-white font-medium hover:bg-green-700">
                            Registrar Otro
                        </button>
                    )}
                </div>
            </div>
        )
    }

    return (
        <form action={dispatch} className="space-y-6 bg-white dark:bg-zinc-900 p-6 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm">

            {venue && <input type="hidden" name="venueId" value={venue.id} />}

            <div>
                <label htmlFor="name" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">Nombre del Local</label>
                <input
                    type="text"
                    name="name"
                    id="name"
                    required
                    defaultValue={venue?.name}
                    className="mt-1 block w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
                    placeholder="Ej. Complejo Deportivo Los Olivos"
                />
                {state?.errors?.name && <p className="mt-1 text-xs text-red-500">{state.errors.name[0]}</p>}
            </div>

            <div>
                <label htmlFor="description" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">Descripción (Opcional)</label>
                <textarea
                    name="description"
                    id="description"
                    rows={3}
                    defaultValue={venue?.description || ''}
                    className="mt-1 block w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
                    placeholder="Canchas sintéticas de estreno, duchas calientes, estacionamiento..."
                />
            </div>

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div>
                    <label htmlFor="city" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">Ciudad</label>
                    <input
                        type="text"
                        name="city"
                        id="city"
                        required
                        defaultValue={venue?.city}
                        className="mt-1 block w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
                        placeholder="Ej. Lima"
                    />
                    {state?.errors?.city && <p className="mt-1 text-xs text-red-500">{state.errors.city[0]}</p>}
                </div>

                <div>
                    <label htmlFor="district" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">Distrito</label>
                    <input
                        type="text"
                        name="district"
                        id="district"
                        defaultValue={venue?.district || ''}
                        className="mt-1 block w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
                        placeholder="Ej. Los Olivos"
                    />
                </div>
            </div>

            <div>
                <label htmlFor="address" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">Dirección</label>
                <input
                    type="text"
                    name="address"
                    id="address"
                    required
                    defaultValue={venue?.address}
                    className="mt-1 block w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
                    placeholder="Av. Universitaria 1234"
                />
                {state?.errors?.address && <p className="mt-1 text-xs text-red-500">{state.errors.address[0]}</p>}
            </div>

            <div>
                <label htmlFor="imageUrl" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">Imagen del Local (Opcional)</label>
                <div className="mt-1 flex items-center gap-4">
                    <input
                        type="file"
                        name="imageUrl"
                        id="imageUrl"
                        accept="image/*"
                        className="block w-full text-sm text-zinc-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-green-50 file:text-green-700 hover:file:bg-green-100 dark:file:bg-zinc-800 dark:file:text-green-400"
                    />
                    {venue?.imageUrl && (
                        <div className="h-12 w-12 relative rounded overflow-hidden bg-zinc-100">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={venue.imageUrl} alt="Actual" className="object-cover w-full h-full" />
                        </div>
                    )}
                </div>
                {state?.errors?.imageUrl && <p className="mt-1 text-xs text-red-500">{state.errors.imageUrl[0]}</p>}
            </div>

            <div>
                <label htmlFor="yapeQrUrl" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">Imagen QR Yape</label>
                <div className="mt-1 flex items-center gap-4">
                    <input
                        type="file"
                        name="yapeQrUrl"
                        id="yapeQrUrl"
                        accept="image/*"
                        className="block w-full text-sm text-zinc-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-green-50 file:text-green-700 hover:file:bg-green-100 dark:file:bg-zinc-800 dark:file:text-green-400"
                    />
                    {venue?.yapeQrUrl && (
                        <div className="h-12 w-12 relative rounded overflow-hidden bg-zinc-100">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={venue.yapeQrUrl} alt="QR Actual" className="object-cover w-full h-full" />
                        </div>
                    )}
                </div>
                <p className="mt-1 text-xs text-zinc-500">
                    Sube una imagen (JPG/PNG). Se guardará localmente.
                </p>
                {state?.errors?.yapeQrUrl && <p className="mt-1 text-xs text-red-500">{state.errors.yapeQrUrl[0]}</p>}
            </div>

            <div>
                <label htmlFor="googleMapsUrl" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">Ubicación (Google Maps)</label>
                <input
                    type="url"
                    name="googleMapsUrl"
                    id="googleMapsUrl"
                    defaultValue={venue?.googleMapsUrl || ''}
                    className="mt-1 block w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
                    placeholder="https://maps.app.goo.gl/..."
                />
            </div>

            <SubmitButton isEditing={!!venue} />

            {state?.message && !state.success && (
                <p className="mt-2 text-sm text-red-500 text-center">{state.message}</p>
            )}
        </form>
    );
}

function SubmitButton({ isEditing }: { isEditing?: boolean }) {
    const { pending } = useFormStatus();

    return (
        <button
            type="submit"
            disabled={pending}
            className="w-full rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-zinc-700 disabled:opacity-50 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
        >
            {pending ? 'Guardando...' : (isEditing ? 'Actualizar Local' : 'Crear Local')}
        </button>
    );
}
