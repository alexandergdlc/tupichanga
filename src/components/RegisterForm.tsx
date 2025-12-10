'use client';

import { useFormStatus } from 'react-dom';
import { useActionState } from 'react';
import { registerUser } from '@/app/actions';
import { useState } from 'react';
import Link from 'next/link';
import { redirect } from 'next/navigation';

export default function RegisterForm() {
    // Initial state matching the server action return type
    const [state, dispatch, isPending] = useActionState(registerUser, { success: false, message: '', errors: {} });
    const [success, setSuccess] = useState(false);

    // If success, we could redirect or show a link
    if (state?.success && !success) {
        setSuccess(true);
    }

    if (success) {
        return (
            <div className="flex-1 rounded-lg bg-zinc-50 px-6 pb-4 pt-8 dark:bg-zinc-800 text-center">
                <h1 className="mb-3 text-2xl font-bold text-green-600">
                    ¡Registro Exitoso!
                </h1>
                <p className="mb-6 text-zinc-600 dark:text-zinc-400">
                    Tu cuenta ha sido creada. Ahora puedes iniciar sesión.
                </p>
                <Link
                    href="/login"
                    className="block w-full rounded-md bg-zinc-900 py-2 text-white transition hover:bg-zinc-700"
                >
                    Ir al Login
                </Link>
            </div>
        )
    }

    return (
        <form action={dispatch} className="space-y-3">
            <div className="flex-1 rounded-lg bg-zinc-50 px-6 pb-4 pt-8 dark:bg-zinc-800">
                <h1 className="mb-3 text-2xl font-bold text-zinc-900 dark:text-white">
                    Crear Cuenta
                </h1>
                <div className="w-full">
                    <div>
                        <label
                            className="mb-3 mt-5 block text-xs font-medium text-zinc-900 dark:text-zinc-50"
                            htmlFor="name"
                        >
                            Nombre Completo
                        </label>
                        <div className="relative">
                            <input
                                className="peer block w-full rounded-md border border-zinc-200 py-[9px] pl-4 text-sm outline-2 placeholder:text-zinc-500 text-black"
                                id="name"
                                type="text"
                                name="name"
                                placeholder="Ej. Juan Perez"
                                required
                            />
                        </div>
                        {state?.errors?.name && (
                            <p className="mt-1 text-xs text-red-500">{state.errors.name[0]}</p>
                        )}
                    </div>

                    <div className="mt-4">
                        <label
                            className="mb-3 mt-5 block text-xs font-medium text-zinc-900 dark:text-zinc-50"
                            htmlFor="email"
                        >
                            Email
                        </label>
                        <div className="relative">
                            <input
                                className="peer block w-full rounded-md border border-zinc-200 py-[9px] pl-4 text-sm outline-2 placeholder:text-zinc-500 text-black"
                                id="email"
                                type="email"
                                name="email"
                                placeholder="juan@ejemplo.com"
                                required
                            />
                        </div>
                        {state?.errors?.email && (
                            <p className="mt-1 text-xs text-red-500">{state.errors.email[0]}</p>
                        )}
                    </div>

                    <div className="mt-4">
                        <label
                            className="mb-3 mt-5 block text-xs font-medium text-zinc-900 dark:text-zinc-50"
                            htmlFor="password"
                        >
                            Contraseña
                        </label>
                        <div className="relative">
                            <input
                                className="peer block w-full rounded-md border border-zinc-200 py-[9px] pl-4 text-sm outline-2 placeholder:text-zinc-500 text-black"
                                id="password"
                                type="password"
                                name="password"
                                placeholder="Mínimo 6 caracteres"
                                required
                                minLength={6}
                            />
                        </div>
                        {state?.errors?.password && (
                            <p className="mt-1 text-xs text-red-500">{state.errors.password[0]}</p>
                        )}
                    </div>

                    <div className="mt-4 flex items-center">
                        <input
                            id="isOwner"
                            name="role"
                            type="checkbox"
                            value="OWNER"
                            className="h-4 w-4 rounded border-zinc-300 text-green-600 focus:ring-green-500"
                        />
                        <label htmlFor="isOwner" className="ml-2 block text-sm text-zinc-900 dark:text-zinc-50">
                            Soy dueño de una cancha (Quiero administrar mi local)
                        </label>
                    </div>
                </div>
                <RegisterButton />

                <div
                    className="flex h-8 items-end space-x-1"
                    aria-live="polite"
                    aria-atomic="true"
                >
                    {state?.message && !state.success && (
                        <>
                            <p className="text-sm text-red-500">{state.message}</p>
                        </>
                    )}
                </div>

                <div className="mt-4 text-center text-sm">
                    <span className="text-zinc-500">¿Ya tienes cuenta? </span>
                    <Link href="/login" className="font-medium text-green-600 hover:underline">
                        Inicia sesión
                    </Link>
                </div>
            </div>
        </form>
    );
}

function RegisterButton() {
    const { pending } = useFormStatus();

    return (
        <button
            className="mt-4 w-full rounded-md bg-green-500 py-2 text-white transition hover:bg-green-600 disabled:opacity-50"
            aria-disabled={pending}
        >
            {pending ? 'Registrando...' : 'Registrarse'}
        </button>
    );
}
