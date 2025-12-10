'use client';

import { useActionState, useState } from 'react';
import { updateUserProfile } from '@/app/actions';
import Image from 'next/image';

type User = {
    name: string | null;
    email: string;
    image: string | null;
    phoneNumber: string | null;
};

const initialState = {
    success: false,
    message: ''
};

export default function ProfileForm({ user }: { user: User }) {
    const [state, dispatch, isPending] = useActionState(updateUserProfile, initialState);
    const [preview, setPreview] = useState<string | null>(user.image || null);

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setPreview(URL.createObjectURL(file));
        }
    };

    return (
        <form action={dispatch} className="space-y-8 max-w-2xl mx-auto">
            {/* ... image upload ... */}
            <div className="flex flex-col items-center gap-4 sm:flex-row">
                <div className="relative h-24 w-24 overflow-hidden rounded-full border-4 border-white shadow-lg dark:border-zinc-800">
                    {preview ? (
                        <Image src={preview} alt="Profile" fill className="object-cover" />
                    ) : (
                        <div className="flex h-full w-full items-center justify-center bg-zinc-200 text-2xl font-bold text-zinc-500 dark:bg-zinc-800">
                            {user.name?.[0]?.toUpperCase() || 'U'}
                        </div>
                    )}
                </div>
                <div>
                    {/* ... file input ... */}
                    <label htmlFor="image" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                        Foto de Perfil
                    </label>
                    <input
                        type="file"
                        name="image"
                        id="image"
                        accept="image/*"
                        onChange={handleImageChange}
                        className="mt-1 block w-full text-sm text-zinc-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-green-50 file:text-green-700 hover:file:bg-green-100 dark:file:bg-zinc-800/50 dark:file:text-green-400"
                    />
                </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                {/* Basic Info */}
                <div className="space-y-4 md:col-span-2">
                    <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">Información Personal</h3>
                    <div>
                        <label htmlFor="name" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">Nombre Completo</label>
                        <input
                            type="text"
                            name="name"
                            id="name"
                            defaultValue={user.name || ''}
                            className="mt-1 block w-full rounded-md border border-zinc-300 px-3 py-2 shadow-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
                        />
                    </div>
                    <div>
                        <label htmlFor="phoneNumber" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">Celular (WhatsApp)</label>
                        <input
                            type="text"
                            name="phoneNumber"
                            id="phoneNumber"
                            defaultValue={user.phoneNumber || '+51 '}
                            placeholder="+51 999999999"
                            className="mt-1 block w-full rounded-md border border-zinc-300 px-3 py-2 shadow-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
                        />
                    </div>
                    <div>
                        <label htmlFor="email" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">Email</label>
                        <input
                            type="email"
                            value={user.email}
                            disabled
                            className="mt-1 block w-full cursor-not-allowed rounded-md border border-zinc-200 bg-zinc-50 px-3 py-2 text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900/50"
                        />
                        <p className="mt-1 text-xs text-zinc-400">El email no se puede cambiar.</p>
                    </div>
                </div>

                {/* Security */}
                <div className="space-y-4 md:col-span-2 border-t border-zinc-200 pt-6 dark:border-zinc-800">
                    <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">Seguridad</h3>
                    <p className="text-sm text-zinc-500">Solo llena esto si quieres cambiar tu contraseña.</p>

                    <div className="grid gap-4 md:grid-cols-2">
                        <div>
                            <label htmlFor="currentPassword" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">Contraseña Actual</label>
                            <input
                                type="password"
                                name="currentPassword"
                                id="currentPassword"
                                className="mt-1 block w-full rounded-md border border-zinc-300 px-3 py-2 shadow-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
                            />
                        </div>
                        <div>
                            <label htmlFor="newPassword" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">Nueva Contraseña</label>
                            <input
                                type="password"
                                name="newPassword"
                                id="newPassword"
                                className="mt-1 block w-full rounded-md border border-zinc-300 px-3 py-2 shadow-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Feedback */}
            {state?.message && (
                <div className={`rounded-md p-4 text-sm font-medium ${state.success ? 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400' : 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400'}`}>
                    {state.message}
                </div>
            )}

            <div className="flex justify-end">
                <button
                    type="submit"
                    disabled={isPending}
                    className="rounded-lg bg-zinc-900 px-6 py-2.5 text-sm font-bold text-white hover:bg-zinc-700 disabled:opacity-50 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
                >
                    {isPending ? 'Guardando...' : 'Guardar Cambios'}
                </button>
            </div>
        </form>
    );
}
