import Link from 'next/link';

import { auth, signOut } from '@/auth';

export default async function Navbar() {
    const session = await auth();

    return (
        <nav className="sticky top-0 z-50 w-full border-b border-zinc-200 bg-white/80 backdrop-blur-md dark:border-zinc-800 dark:bg-zinc-950/80">
            <div className="container mx-auto flex h-16 items-center justify-between px-4">
                {/* Logo */}
                <Link href="/" className="flex items-center gap-2 font-bold text-xl text-zinc-900 dark:text-zinc-50">
                    ⚽ TuPichanga
                </Link>

                {/* Desktop Navigation */}
                {/* Desktop Navigation - Removed as per user request */}
                {/* <div className="hidden md:flex md:gap-x-8"> ... </div> */}

                {/* Auth Buttons */}
                <div className="flex items-center gap-4">
                    {session?.user ? (
                        <div className="flex items-center gap-4">
                            <Link href="/profile" className="flex items-center gap-3 transition hover:opacity-80">
                                <div className="relative h-8 w-8 overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800">
                                    {session.user.image ? (
                                        // eslint-disable-next-line @next/next/no-img-element
                                        <img src={session.user.image} alt="Avatar" className="h-full w-full object-cover" />
                                    ) : (
                                        <div className="flex h-full w-full items-center justify-center font-bold text-zinc-500">
                                            {session.user.name?.[0]?.toUpperCase() || 'U'}
                                        </div>
                                    )}
                                </div>
                                <span className="hidden text-sm font-semibold text-zinc-700 dark:text-zinc-200 md:block">
                                    {session.user.name?.split(' ')[0]}
                                </span>
                            </Link>

                            {session.user.role === 'OWNER' ? (
                                <Link
                                    href="/admin"
                                    className="text-sm font-medium text-zinc-600 hover:text-green-600 dark:text-zinc-400 dark:hover:text-green-400"
                                >
                                    Panel Dueño
                                </Link>
                            ) : (
                                <Link
                                    href="/my-bookings"
                                    className="text-sm font-medium text-zinc-600 hover:text-green-600 dark:text-zinc-400 dark:hover:text-green-400"
                                >
                                    Mis Reservas
                                </Link>
                            )}

                            <form
                                action={async () => {
                                    'use server';
                                    await signOut({ redirectTo: '/' });
                                }}
                            >
                                <button className="rounded-full border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50 hover:text-zinc-900 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700">
                                    Salir
                                </button>
                            </form>
                        </div>
                    ) : (
                        <>
                            <Link
                                href="/login"
                                className="text-sm font-medium text-zinc-700 hover:text-zinc-900 dark:text-zinc-300 dark:hover:text-white"
                            >
                                Iniciar Sesión
                            </Link>
                            <Link
                                href="/register"
                                className="rounded-full bg-zinc-900 px-4 py-2 text-sm font-bold text-white transition hover:bg-zinc-700 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
                            >
                                Registrarse
                            </Link>
                        </>
                    )}
                </div>
            </div>
        </nav>
    );
}
