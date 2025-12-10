import { auth } from '@/auth';
import { PrismaClient } from '@prisma/client';
import Link from 'next/link';
import { redirect, notFound } from 'next/navigation';
import { deleteCourt } from '@/app/actions';

const prisma = new PrismaClient();

export default async function ManageVenuePage({ params }: { params: Promise<{ id: string }> }) {
    const session = await auth();
    if (!session?.user?.email) redirect('/login');

    const { id } = await params;
    const venueId = parseInt(id);
    if (isNaN(venueId)) notFound();

    const venue = await prisma.venue.findUnique({
        where: { id: venueId },
        include: {
            courts: true
        }
    });

    if (!venue) notFound();

    // Verify ownership
    const user = await prisma.user.findUnique({ where: { email: session.user.email } });
    if (venue.ownerId !== user?.id) {
        return <div className="p-8 text-center text-red-500">No tienes permisos para administrar este local.</div>;
    }

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="mb-8">
                <Link href="/admin" className="text-sm text-zinc-500 hover:text-zinc-900 mb-2 block">
                    ← Volver a Mis Locales
                </Link>
                <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-zinc-900 dark:text-white">{venue.name}</h1>
                        <p className="text-zinc-600 dark:text-zinc-400">{venue.address}, {venue.district}</p>
                    </div>
                    <div className="mt-4 flex gap-2 md:mt-0">
                        <Link
                            href={`/admin/venues/${venue.id}/dashboard`}
                            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700 shadow-sm"
                        >
                            📊 Ver Estadísticas
                        </Link>
                        <Link
                            href={`/admin/venues/${venue.id}/edit`}
                            className="rounded-md bg-white border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-900 hover:bg-zinc-50 dark:bg-zinc-800 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-700"
                        >
                            Editar Info
                        </Link>
                    </div>
                </div>
            </div>

            <div className="mb-8">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-50">Canchas ({venue.courts.length})</h2>
                    <Link
                        href={`/admin/venues/${venue.id}/courts/new`}
                        className="rounded bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
                    >
                        + Agregar Cancha
                    </Link>
                </div>

                <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
                    <table className="w-full text-left text-sm text-zinc-600 dark:text-zinc-400">
                        <thead className="bg-zinc-50 text-xs uppercase text-zinc-500 dark:bg-zinc-950 dark:text-zinc-400">
                            <tr>
                                <th className="px-6 py-3">Nombre</th>
                                <th className="px-6 py-3">Deporte</th>
                                <th className="px-6 py-3">Tipo</th>
                                <th className="px-6 py-3">Precio/Hora</th>
                                <th className="px-6 py-3 text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                            {venue.courts.map((court) => (
                                <tr key={court.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50">
                                    <td className="px-6 py-4 font-medium text-zinc-900 dark:text-zinc-200">{court.name}</td>
                                    <td className="px-6 py-4">{court.sport}</td>
                                    <td className="px-6 py-4">{court.type || 'Sintética'}</td>
                                    <td className="px-6 py-4">S/ {court.pricePerHour}</td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex justify-end gap-2">
                                            <Link
                                                href={`/admin/venues/${venue.id}/courts/${court.id}/edit`}
                                                className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 font-medium"
                                            >
                                                Editar
                                            </Link>
                                            <DeleteCourtButton courtId={court.id} venueId={venue.id} />
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {venue.courts.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-zinc-500">
                                        No hay canchas registradas. Agrega una para empezar a recibir reservas.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

function DeleteCourtButton({ courtId, venueId }: { courtId: number, venueId: number }) {
    return (
        <form action={async () => {
            'use server';
            await deleteCourt(courtId, venueId);
        }}>
            <button className="text-red-600 hover:text-red-900 dark:text-red-400 ml-2 font-medium">
                Eliminar
            </button>
        </form>
    );
}
