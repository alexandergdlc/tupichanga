import { PrismaClient } from '@prisma/client';
import Link from 'next/link';
import Image from 'next/image';

const prisma = new PrismaClient();

export const dynamic = 'force-dynamic';

export default async function Home() {
  const venues = await prisma.venue.findMany({
    include: {
      courts: true,
    },
    orderBy: {
      createdAt: 'desc',
    }
  });

  return (
    <div className="flex min-h-screen flex-col">
      {/* Hero Section Simplificado */}
      <section className="bg-zinc-900 py-12 text-white">
        <div className="container mx-auto px-4 text-center">
          <h1 className="mb-4 text-4xl font-bold md:text-5xl lg:text-6xl">
            Reserva tu cancha <span className="text-green-500">al toque</span>
          </h1>
          <p className="mx-auto mb-8 max-w-2xl text-lg text-zinc-400">
            Encuentra las mejores canchas de tu ciudad. Fútbol, Voley y más. Sin llamadas, sin espera.
          </p>
        </div>
      </section>

      {/* Grid de Locales */}
      <section className="bg-zinc-50 py-12 dark:bg-zinc-950 flex-grow">
        <div className="container mx-auto px-4">
          <h2 className="mb-8 text-2xl font-bold text-zinc-900 dark:text-white">Locales Disponibles</h2>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {venues.map((venue) => {
              const prices = venue.courts.map(c => c.pricePerHour).filter(p => p > 0);
              const minPrice = prices.length > 0 ? Math.min(...prices) : null;

              return (
                <Link key={venue.id} href={`/venue/${venue.id}`} className="group block h-full">
                  <div className="relative flex h-full flex-col overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl dark:border-zinc-800 dark:bg-zinc-900">

                    {/* Image Section */}
                    <div className="relative h-56 w-full overflow-hidden bg-zinc-200">
                      <Image
                        src={venue.imageUrl || "https://images.unsplash.com/photo-1529900748604-07564a03e7a6?auto=format&fit=crop&q=80"}
                        alt={venue.name}
                        fill
                        className="object-cover transition duration-500 group-hover:scale-110"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-60" />

                      {/* Badge sobre la imagen (Pill style) */}
                      <span className="absolute top-4 right-4 rounded-full border border-white/20 bg-white/90 px-3 py-1 text-xs font-bold tracking-wide text-zinc-900 shadow-sm backdrop-blur-md dark:bg-black/80 dark:text-white">
                        📍 {venue.district || venue.city}
                      </span>
                    </div>

                    {/* Content Section */}
                    <div className="flex flex-grow flex-col p-6">
                      <div className="mb-1">
                        <h3 className="text-2xl font-bold tracking-tight text-zinc-900 group-hover:text-green-600 dark:text-zinc-50 transition-colors">
                          {venue.name}
                        </h3>
                      </div>

                      <p className="mb-4 text-sm font-medium text-zinc-500 line-clamp-2 dark:text-zinc-400">
                        {venue.address}
                      </p>

                      <div className="mt-auto space-y-4">
                        {/* Price & Courts Info */}
                        <div className="flex items-baseline justify-between border-t border-zinc-100 pt-4 dark:border-zinc-800">
                          <div className="text-sm text-zinc-500">
                            ⚽ {venue.courts.length} {venue.courts.length === 1 ? 'cancha' : 'canchas'}
                          </div>
                          <div className="text-right">
                            {minPrice ? (
                              <>
                                <span className="text-xs text-zinc-400 block">Desde</span>
                                <span className="text-lg font-bold text-zinc-900 dark:text-white">S/ {minPrice}</span>
                                <span className="text-xs text-zinc-500"> /hora</span>
                              </>
                            ) : (
                              <span className="text-sm font-bold text-green-600">Consultar Precio</span>
                            )}
                          </div>
                        </div>

                        {/* Primary CTA */}
                        <button className="w-full rounded-lg bg-zinc-900 py-3 text-sm font-bold text-white shadow-md transition-colors hover:bg-zinc-800 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200">
                          Ver Horarios y Reservar
                        </button>
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}

            {venues.length === 0 && (
              <div className="col-span-full py-20 text-center">
                <p className="text-zinc-500">No hay locales registrados aún.</p>
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
