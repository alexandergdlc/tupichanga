'use client';

import { useFormStatus } from 'react-dom';
import { useActionState } from 'react';
import { authenticate } from '@/app/actions';

export default function LoginForm() {
    const [errorMessage, dispatch, isPending] = useActionState(authenticate, undefined);

    return (
        <form action={dispatch} className="space-y-3">
            <div className="flex-1 rounded-lg bg-zinc-50 px-6 pb-4 pt-8 dark:bg-zinc-800">
                <h1 className="mb-3 text-2xl font-bold text-zinc-900 dark:text-white">
                    Inicia Sesión
                </h1>
                <div className="w-full">
                    <div>
                        <label
                            className="mb-3 mt-5 block text-xs font-medium text-zinc-900 dark:text-zinc-50"
                            htmlFor="email"
                        >
                            Email
                        </label>
                        <div className="relative">
                            <input
                                className="peer block w-full rounded-md border border-zinc-200 py-[9px] pl-10 text-sm outline-2 placeholder:text-zinc-500 text-black"
                                id="email"
                                type="email"
                                name="email"
                                placeholder="Enter your email address"
                                required
                            />
                        </div>
                    </div>
                    <div className="mt-4">
                        <label
                            className="mb-3 mt-5 block text-xs font-medium text-zinc-900 dark:text-zinc-50"
                            htmlFor="password"
                        >
                            Password
                        </label>
                        <div className="relative">
                            <input
                                className="peer block w-full rounded-md border border-zinc-200 py-[9px] pl-10 text-sm outline-2 placeholder:text-zinc-500 text-black"
                                id="password"
                                type="password"
                                name="password"
                                placeholder="Enter password"
                                required
                                minLength={6}
                            />
                        </div>
                    </div>
                </div>
                <LoginButton />
                <div
                    className="flex h-8 items-end space-x-1"
                    aria-live="polite"
                    aria-atomic="true"
                >
                    {errorMessage && (
                        <>
                            <p className="text-sm text-red-500">{errorMessage}</p>
                        </>
                    )}
                </div>

                <p className="mt-4 text-xs text-zinc-500">
                    Usuario de prueba: <br />
                    Email: <b>admin@tupichanga.pe</b> <br />
                    Pass: <b>hashed_password_123</b>
                </p>
            </div>
        </form>
    );
}

function LoginButton() {
    const { pending } = useFormStatus();

    return (
        <button
            className="mt-4 w-full rounded-md bg-green-500 py-2 text-white transition hover:bg-green-600 disabled:opacity-50"
            aria-disabled={pending}
        >
            Log in
        </button>
    );
}
