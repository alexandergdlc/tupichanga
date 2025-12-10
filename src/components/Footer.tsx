import Link from 'next/link';

export default function Footer() {
    return (
        <footer className="border-t border-zinc-200 bg-zinc-50 py-8 dark:border-zinc-800 dark:bg-zinc-950">
            <div className="container mx-auto flex flex-col items-center justify-between gap-6 px-4 md:flex-row">
                <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-full bg-gradient-to-br from-green-500 to-emerald-700"></div>
                    <span className="text-xl font-bold tracking-tight text-zinc-900 dark:text-gray-100">
                        TuPichanga
                    </span>
                    <span className="hidden text-sm text-zinc-500 dark:text-zinc-400 md:inline-block md:ml-4">
                        © {new Date().getFullYear()}
                    </span>
                </div>

                {/* Social Icons Section */}
                <div className="flex items-center gap-6">
                    <span className="text-sm font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                        Contacto en redes:
                    </span>
                    <div className="flex gap-4">
                        {/* WhatsApp */}
                        <a
                            href="https://wa.me/51902293694"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-zinc-400 transition hover:text-[#25D366] hover:scale-110"
                            aria-label="WhatsApp"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 21l1.65-3.8a9 9 0 1 1 3.4 2.9L3 21" /><path d="M9 10a2 2 0 0 0-2 2 1.23 1.23 0 0 0 .7 1.22l0.42 0.09h0.01l0.02 0.53a4 4 0 0 0 2.2 2.63l0.38 0.17 0.28-0.34a2 2 0 0 0-1.02-3.13l-0.37-0.12-1-3.05z" /></svg>
                        </a>

                        {/* Facebook */}
                        <a
                            href="https://facebook.com"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-zinc-400 transition hover:text-[#1877F2] hover:scale-110"
                            aria-label="Facebook"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" /></svg>
                        </a>

                        {/* Instagram */}
                        <a
                            href="https://instagram.com"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-zinc-400 transition hover:text-[#E4405F] hover:scale-110"
                            aria-label="Instagram"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="20" x="2" y="2" rx="5" ry="5" /><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" /><line x1="17.5" x2="17.51" y1="6.5" y2="6.5" /></svg>
                        </a>
                    </div>
                </div>
            </div>
        </footer>
    );
}
