import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import SubscriptionForm from './SubscriptionForm';

export default async function SubscriptionPage() {
    const session = await auth();
    if (!session?.user?.email) redirect('/login');

    return (
        <div className="container mx-auto px-4 py-8 max-w-3xl">
            <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-50 mb-6">Actualiza tu Plan</h1>

            {/* Benefits Card */}
            <div className="grid gap-6 md:grid-cols-2 mb-8">
                <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
                    <h2 className="text-xl font-semibold mb-4 text-zinc-900 dark:text-zinc-50">Plan PRO</h2>
                    <ul className="space-y-2 text-zinc-600 dark:text-zinc-400">
                        <li className="flex items-center">
                            <svg className="w-5 h-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                            Locales Ilimitados
                        </li>
                        <li className="flex items-center">
                            <svg className="w-5 h-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                            Múltiples administradores (Próximamente)
                        </li>
                        <li className="flex items-center">
                            <svg className="w-5 h-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                            Soporte Prioritario
                        </li>
                    </ul>
                    <div className="mt-6 text-3xl font-bold text-zinc-900 dark:text-zinc-50">S/ 50.00 <span className="text-sm font-normal text-zinc-500">/ mes</span></div>
                </div>

                {/* Payment Info */}
                <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-6 dark:border-zinc-700 dark:bg-zinc-800">
                    <h3 className="font-semibold text-zinc-900 dark:text-zinc-50 mb-4">Método de Pago: Yape / Plin</h3>
                    <div className="flex gap-4 justify-center mb-4">
                        <div className="bg-white p-2 rounded shadow-sm w-24 h-24 flex items-center justify-center text-xs text-center border">
                            QR Yape
                        </div>
                        <div className="bg-white p-2 rounded shadow-sm w-24 h-24 flex items-center justify-center text-xs text-center border">
                            QR Plin
                        </div>
                    </div>
                    <p className="text-center text-zinc-700 dark:text-zinc-300 font-medium">999 123 456</p>
                    <p className="text-center text-xs text-zinc-500 mt-1">A nombre de: TuPichanga SAC</p>
                </div>
            </div>

            {/* Submission Form */}
            <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
                <h2 className="text-lg font-bold mb-4">Enviar Comprobante de Pago</h2>
                <SubscriptionForm />
            </div>
        </div>
    );
}
