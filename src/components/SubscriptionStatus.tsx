'use client';

import React from 'react';

interface SubscriptionStatusProps {
    plan: string;
}

export default function SubscriptionStatus({ plan }: SubscriptionStatusProps) {
    const isPro = plan === 'PRO';

    return (
        <div className={`rounded-xl border p-6 shadow-sm ${isPro
            ? 'border-yellow-200 bg-yellow-50 dark:border-yellow-900/50 dark:bg-yellow-900/10'
            : 'border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900'
            }`}>
            <h3 className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Tu Plan Actual</h3>
            <div className="mt-2 flex items-center justify-between">
                <p className={`text-3xl font-bold ${isPro ? 'text-yellow-600 dark:text-yellow-500' : 'text-zinc-900 dark:text-zinc-50'
                    }`}>
                    {plan}
                </p>
                {!isPro && (
                    <a
                        href="/admin/subscription"
                        className="rounded bg-gradient-to-r from-yellow-500 to-amber-500 px-4 py-2 text-sm font-bold text-white shadow-sm hover:from-yellow-600 hover:to-amber-600 transition-all"
                    >
                        Actualizar a PRO
                    </a>
                )}
                {isPro && (
                    <span className="rounded-full bg-yellow-100 px-3 py-1 text-xs font-semibold text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
                        Suscripción Activa
                    </span>
                )}
            </div>
            {!isPro && (
                <p className="mt-2 text-xs text-zinc-500">
                    Actualiza a PRO para crear locales ilimitados y acceder a funciones avanzadas.
                </p>
            )}
        </div>
    );
}
