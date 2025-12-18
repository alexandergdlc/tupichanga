'use client';

import { useFormStatus } from 'react-dom';
import { useActionState } from 'react';
import { submitPayment } from '@/app/actions';
import { useState } from 'react';

const initialState = {
    message: '',
    success: false
};

export default function SubscriptionForm() {
    const [state, dispatch] = useActionState(submitPayment, initialState);

    if (state.success) {
        return (
            <div className="bg-green-50 border border-green-200 text-green-700 p-4 rounded-lg text-center">
                <h3 className="font-bold text-lg mb-2">¡Solicitud Recibida!</h3>
                <p>{state.message}</p>
                <div className="mt-4">
                    <a href="/admin" className="text-sm underline font-medium">Volver al Dashboard</a>
                </div>
            </div>
        );
    }

    return (
        <form action={dispatch} className="space-y-4">
            <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">Código de Operación</label>
                <input
                    type="text"
                    name="operationCode"
                    required
                    placeholder="Ej. 1234567"
                    className="mt-1 block w-full rounded-md border border-zinc-300 px-3 py-2 text-sm"
                />
                <p className="text-xs text-zinc-500 mt-1">Tip: Usa <b>DEMO123</b> para activación inmediata.</p>
            </div>

            <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">Adjuntar Voucher (Imagen)</label>
                <input
                    type="file"
                    name="voucherImage"
                    accept="image/*"
                    className="mt-1 block w-full text-sm text-zinc-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-zinc-100 file:text-zinc-700 hover:file:bg-zinc-200"
                />
            </div>

            {state.message && <p className="text-red-500 text-sm">{state.message}</p>}

            <SubmitButton />
        </form>
    );
}

function SubmitButton() {
    const { pending } = useFormStatus();

    return (
        <button
            disabled={pending}
            className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded transition-colors disabled:opacity-50"
        >
            {pending ? 'Enviando...' : 'Enviar Solicitud de Activación'}
        </button>
    );
}
