import { PrismaClient } from '@prisma/client';
import Image from 'next/image';
import Link from 'next/link';
import BookingCalendar from '@/components/BookingCalendar';
import { auth } from '@/auth';

const prisma = new PrismaClient();

export const dynamic = 'force-dynamic';

async function getVenue(id: string) {
    const venueId = parseInt(id);
    if (isNaN(venueId)) return null;

    const venue = await prisma.venue.findUnique({
        where: { id: venueId },
        include: {
            courts: true,
            owner: true,
        },
    });
    return venue;
}

export default async function VenuePage({ params }: { params: Promise<{ id: string }> }) {
    // Await params in case it becomes async in future Next.js versions or is used in a way that requires it
    const { id } = await params;
    const session = await auth();
    const venue = await getVenue(id);

    if (!venue) {
        return (
            <div className="container mx-auto py-20 text-center">
                <h1 className="text-2xl font-bold">Local no encontrado</h1>
                <Link href="/search" className="text-green-600 hover:underline">
                    Volver al buscador
                </Link>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-8">

            {/* Header Section */}
            {/* Header Section Modernizado */}
            <div className="mb-10 overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900 md:flex">
                {/* Imagen del Local */}
                <div className="relative h-64 w-full md:h-auto md:w-1/2 lg:w-2/5">
                    <Image
                        src={venue.imageUrl || "https://images.unsplash.com/photo-1529900748604-07564a03e7a6?auto=format&fit=crop&q=80"}
                        alt={venue.name}
                        fill
                        className="object-cover"
                        priority
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent md:hidden" />
                </div>

                {/* Información y Acciones */}
                <div className="flex flex-col justify-center p-6 md:w-1/2 md:p-8 lg:w-3/5">
                    <div className="mb-4">
                        <h1 className="mb-2 text-3xl font-bold text-zinc-900 dark:text-zinc-50 md:text-4xl">{venue.name}</h1>
                        <p className="text-lg text-zinc-600 dark:text-zinc-400">{venue.description}</p>
                    </div>

                    <div className="mb-8 space-y-3 border-t border-zinc-100 pt-6 dark:border-zinc-800">
                        <div className="flex items-start gap-2 text-zinc-600 dark:text-zinc-400">
                            <span className="mt-0.5 text-lg">📍</span>
                            <div>
                                <span className="font-semibold text-zinc-900 dark:text-zinc-200">Ubicación:</span>
                                <p className="text-sm">{venue.address}, {venue.district}, {venue.city}</p>
                            </div>
                        </div>

                        {venue.googleMapsUrl && (
                            <a
                                href={venue.googleMapsUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1.5 text-sm font-medium text-green-600 hover:text-green-700 hover:underline ml-6"
                            >
                                Ver en Google Maps ↗
                            </a>
                        )}
                    </div>

                    {/* Botón de Contacto Optimizado */}
                    <div className="mt-auto">
                        <Link
                            href={`https://wa.me/${venue.owner.phoneNumber?.replace(/\D/g, '') || '51902293694'}`}
                            target="_blank"
                            className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[#25D366] px-6 py-3 font-bold text-white shadow-md transition-transform hover:scale-[1.02] hover:bg-[#128C7E] md:w-auto"
                        >
                            <span>💬 Contactar con el Encargado (WhatsApp)</span>
                        </Link>
                        <p className="mt-2 text-xs text-zinc-400 text-center md:text-left">
                            Consulta disponibilidad extra o dudas directamente.
                        </p>
                    </div>
                </div>
            </div>

            {/* Courts Selection */}
            <h2 className="mb-6 text-2xl font-bold text-zinc-900 dark:text-zinc-50">Canchas Disponibles</h2>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                {venue.courts.map((court) => (
                    <div key={court.id} className="group relative overflow-hidden rounded-2xl border border-zinc-100 bg-white p-8 shadow-lg transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 dark:border-zinc-800 dark:bg-zinc-900/50">
                        <div className="mb-6 flex items-center justify-between">
                            <h3 className="text-xl font-extrabold tracking-tight text-zinc-900 dark:text-white group-hover:text-green-600 transition-colors">
                                {court.name}
                            </h3>
                            <span className="rounded-full bg-zinc-100 px-3 py-1 text-xs font-bold uppercase tracking-wider text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
                                {court.sport}
                            </span>
                        </div>

                        <div className="mb-8 flex items-baseline gap-1">
                            <span className="text-4xl font-extrabold text-zinc-900 dark:text-white">
                                S/ {court.pricePerHour}
                            </span>
                            <span className="text-sm font-medium text-zinc-500">/ hora</span>
                        </div>

                        <div className="relative z-10">
                            <BookingCalendar
                                courtId={court.id}
                                pricePerHour={court.pricePerHour}
                                yapeQrUrl={venue.yapeQrUrl}
                                userRole={session?.user?.role}
                            />
                        </div>

                        {/* Decorative background element */}
                        <div className="absolute top-0 right-0 -mt-8 -mr-8 h-32 w-32 rounded-full bg-gradient-to-br from-green-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
                    </div>
                ))}
            </div>
        </div >
    );
}
