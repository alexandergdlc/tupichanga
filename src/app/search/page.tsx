import Link from 'next/link';
import { PrismaClient } from '@prisma/client';
import Image from 'next/image';

const prisma = new PrismaClient();

// Force dynamic rendering so we always get the latest DB data
export const dynamic = 'force-dynamic';

async function getVenues() {
    const venues = await prisma.venue.findMany({
        include: {
            courts: true,
        },
    });
    return venues;
}

export default async function SearchPage() {
    const venues = await getVenues();

    return (
        <div className="container mx-auto px-4 py-8">
            <h1 className="mb-8 text-3xl font-bold text-zinc-900 dark:text-zinc-50">
                Locales Disponibles
            </h1>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                {venues.map((venue) => (
                    <Link
                        key={venue.id}
                        href={`/venue/${venue.id}`}
                        className="group relative overflow-hidden rounded-2xl border border-zinc-100 bg-white shadow-md transition-all duration-300 hover:-translate-y-1 hover:shadow-xl dark:border-zinc-800 dark:bg-zinc-900"
                    >
                        <div className="relative h-56 w-full overflow-hidden bg-zinc-100 dark:bg-zinc-800">
                            {/* Use a placeholder if no image, or the real image */}
                            <Image
                                src={venue.imageUrl || "https://images.unsplash.com/photo-1529900748604-07564a03e7a6?auto=format&fit=crop&q=80"}
                                alt={venue.name}
                                fill
                                className="object-cover transition-transform duration-500 group-hover:scale-105"
                            />
                            {/* Gradient Overlay for Text Visibility if needed, but keeping it clean for now */}
                            <div className="absolute top-3 right-3 rounded-full bg-white/90 px-3 py-1 text-xs font-bold text-zinc-900 shadow-sm backdrop-blur-md dark:bg-black/70 dark:text-white">
                                📍 {venue.district}
                            </div>
                        </div>

                        <div className="flex bg-white flex-col p-6 dark:bg-zinc-900">
                            <div className="mb-4 flex-1">
                                <h3 className="mb-2 text-xl font-bold tracking-tight text-zinc-900 dark:text-white group-hover:text-green-600 transition-colors">
                                    {venue.name}
                                </h3>
                                <p className="line-clamp-2 text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">
                                    {venue.description || "Disfruta de las mejores canchas deportivas con instalaciones de primera calidad."}
                                </p>
                            </div>

                            <div className="mt-4 flex items-center justify-between border-t border-zinc-100 pt-4 dark:border-zinc-800">
                                <div>
                                    <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Desde</p>
                                    <p className="text-lg font-bold text-zinc-900 dark:text-white">
                                        S/ {Math.min(...venue.courts.map(c => c.pricePerHour), 0)}
                                        <span className="text-xs font-normal text-zinc-500"> /hora</span>
                                    </p>
                                </div>
                                <span className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-bold text-white transition-colors group-hover:bg-green-600 dark:bg-white dark:text-zinc-900 dark:group-hover:bg-green-500">
                                    Ver Disponibilidad
                                </span>
                            </div>
                        </div>
                    </Link>
                ))}
            </div>

            {venues.length === 0 && (
                <div className="mt-12 text-center">
                    <p className="text-zinc-500">No se encontraron locales.</p>
                </div>
            )}
        </div>
    );
}
