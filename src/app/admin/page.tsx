import { auth } from '@/auth';
import { PrismaClient } from '@prisma/client';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getAllOwnerBookings, expireBookings, getDashboardStats } from '@/app/actions';
import CourtFilter from '@/components/CourtFilter';
import BookingStatusManager from '@/components/BookingStatusManager';
import SubscriptionStatus from '@/components/SubscriptionStatus';

const prisma = new PrismaClient();

async function getOwnerData(email: string) {
    await expireBookings();
    const user = await prisma.user.findUnique({
        where: { email },
        include: {
            venues: {
                include: {
                    courts: {
                        include: {
                            bookings: {
                                orderBy: { startTime: 'desc' },
                                take: 5, // Just for stats calculation or mini preview if needed, but we rely on getAllOwnerBookings for the main table
                            }
                        }
                    }
                }
            }
        }
    });
    return user;
}

export default async function AdminPage({
    searchParams,
}: {
    searchParams: Promise<{ page?: string; courtId?: string }>;
}) {
    const session = await auth();

    if (!session?.user?.email) {
        redirect('/login');
    }

    const { page, courtId } = await searchParams;
    const user = await getOwnerData(session.user.email);

    if (!user) {
        return <div>Usuario no encontrado</div>;
    }

    const currentPage = Number(page) || 1;
    const currentCourtId = courtId ? Number(courtId) : null;
    const { bookings: paginatedBookings, pagination } = await getAllOwnerBookings(currentPage, 10, currentCourtId);

    // Calculate stats
    const totalVenues = user.venues.length;
    const allCourts = user.venues.flatMap(v => v.courts);
    const totalCourts = allCourts.length;

    // Revenue Calculation (Agregate with Filter)
    const revenueWhere: any = {
        court: {
            venue: {
                ownerId: user.id
            }
        },
        status: { in: ['CONFIRMED', 'COMPLETED'] }
    };

    if (currentCourtId) {
        revenueWhere.court.id = currentCourtId;
    }

    const revenueAgg = await prisma.booking.aggregate({
        _sum: {
            totalPrice: true
        },
        where: revenueWhere
    });

    const totalRevenue = revenueAgg._sum.totalPrice || 0;
    const totalBookingsCount = pagination?.totalCount || 0;


    return (
        <div className="container mx-auto px-4 py-8">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-50">Panel de Administración</h1>
                    <p className="text-zinc-600 dark:text-zinc-400">Bienvenido de nuevo, {user.name}</p>
                </div>
                <div className="flex items-center gap-4">
                    <Link href="/" className="text-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-300">
                        Volver al inicio
                    </Link>
                    <Link href="/admin/venues/new" className="rounded bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 dark:bg-zinc-50 dark:text-zinc-900">
                        + Nuevo Local
                    </Link>
                </div>
            </div>

            {/* Subscription Manager */}
            <div className="mb-8">
                <SubscriptionStatus plan={user.plan} />
            </div>

            {/* My Venues List */}
            <div className="mb-8">
                <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-50 mb-4">Mis Locales</h2>
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {user.venues.map((venue) => (
                        <div key={venue.id} className="group relative overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm transition-all hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900">
                            <div className="aspect-video w-full overflow-hidden bg-zinc-100 dark:bg-zinc-800">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                    src={venue.imageUrl || 'https://images.unsplash.com/photo-1529900748604-07564a03e7a6?auto=format&fit=crop&q=80'}
                                    alt={venue.name}
                                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                                />
                            </div>
                            <div className="p-4">
                                <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">{venue.name}</h3>
                                <p className="text-sm text-zinc-500 dark:text-zinc-400">{venue.district}, {venue.city}</p>
                                <div className="mt-4 flex items-center justify-between">
                                    <span className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
                                        {venue.courts.length} {venue.courts.length === 1 ? 'Cancha' : 'Canchas'}
                                    </span>
                                    <Link
                                        href={`/admin/venues/${venue.id}`}
                                        className="rounded-md bg-zinc-900 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-zinc-700 dark:bg-zinc-50 dark:text-zinc-900"
                                    >
                                        Administrar
                                    </Link>
                                </div>
                            </div>
                        </div>
                    ))}
                    {user.venues.length === 0 && (
                        <div className="col-span-full py-12 text-center rounded-xl border border-dashed border-zinc-300 dark:border-zinc-700">
                            <p className="text-zinc-500">No tienes locales registrados.</p>
                            <Link href="/admin/venues/new" className="mt-2 text-green-600 hover:underline">
                                ¡Crea tu primer local!
                            </Link>
                        </div>
                    )}
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-4 mb-8">
                <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
                    <h3 className="text-sm font-medium text-zinc-500">Locales Activos</h3>
                    <p className="mt-2 text-3xl font-bold text-zinc-900 dark:text-zinc-50">{totalVenues}</p>
                </div>
                <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
                    <h3 className="text-sm font-medium text-zinc-500">Canchas Totales</h3>
                    <p className="mt-2 text-3xl font-bold text-zinc-900 dark:text-zinc-50">{totalCourts}</p>
                </div>
                <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
                    <h3 className="text-sm font-medium text-zinc-500">Reservas {currentCourtId ? '(Filtrado)' : 'Totales'}</h3>
                    <p className="mt-2 text-3xl font-bold text-zinc-900 dark:text-zinc-50">{totalBookingsCount}</p>
                </div>
                <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
                    <h3 className="text-sm font-medium text-green-500">Ingresos {currentCourtId ? '(Filtrado)' : 'Totales'}</h3>
                    <p className="mt-2 text-3xl font-bold text-zinc-900 dark:text-zinc-50">S/ {totalRevenue}</p>
                </div>
            </div>

            {/* Pagination Controls - Added above or below table? Below is standard */}

            {/* Recent Bookings Table */}
            <div className="rounded-xl border border-zinc-200 bg-white overflow-hidden dark:border-zinc-800 dark:bg-zinc-900 shadow-sm flex flex-col">
                <div className="border-b border-zinc-200 px-6 py-4 dark:border-zinc-800 flex flex-col sm:flex-row justify-between items-center gap-4">
                    <div className="flex items-center gap-4">
                        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">Reservas Globales</h2>
                        <span className="text-xs text-zinc-500">Página {currentPage} de {pagination?.totalPages || 1}</span>
                    </div>

                    {/* Filter Component */}
                    <CourtFilter courts={allCourts.map(c => ({ id: c.id, name: c.name, venue: { name: user.venues.find(v => v.id === c.venueId)?.name || '' } }))} />
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-zinc-600 dark:text-zinc-400">
                        <thead className="bg-zinc-50 text-xs uppercase text-zinc-500 dark:bg-zinc-950 dark:text-zinc-400">
                            <tr>
                                <th className="px-6 py-3">ID</th>
                                <th className="px-6 py-3">Cliente</th>
                                <th className="px-6 py-3">Local / Cancha</th>
                                <th className="px-6 py-3">Fecha</th>
                                <th className="px-6 py-3">Estado</th>
                                <th className="px-6 py-3 text-right">Monto</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                            {!paginatedBookings || paginatedBookings.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-8 text-center">No hay reservas {currentCourtId ? 'para esta cancha' : 'recientes'}.</td>
                                </tr>
                            ) : (
                                paginatedBookings.map((booking) => (
                                    <tr key={booking.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50">
                                        <td className="px-6 py-4 font-medium">#{booking.id}</td>
                                        <td className="px-6 py-4">{booking.user?.name || 'Cliente'}</td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col">
                                                <span className="font-medium text-zinc-900 dark:text-zinc-200">{booking.court.venue.name}</span>
                                                <span className="text-xs">{booking.court.name}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            {new Date(booking.startTime).toLocaleDateString()} <br />
                                            {new Date(booking.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </td>
                                        <td className="px-6 py-4">
                                            <BookingStatusManager
                                                bookingId={booking.id}
                                                currentStatus={booking.status}
                                            />
                                        </td>
                                        <td className="px-6 py-4 text-right font-medium text-zinc-900 dark:text-zinc-200">
                                            S/ {booking.totalPrice}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination Footer */}
                {(pagination?.totalPages || 0) > 1 && (
                    <div className="flex items-center justify-between border-t border-zinc-200 bg-white px-4 py-3 sm:px-6 dark:border-zinc-700 dark:bg-zinc-900">
                        <div className="flex flex-1 justify-between sm:hidden">
                            <Link
                                href={`/admin?page=${currentPage - 1}${currentCourtId ? `&courtId=${currentCourtId}` : ''}`}
                                className={`relative inline-flex items-center rounded-md border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 ${currentPage <= 1 ? 'pointer-events-none opacity-50' : ''}`}
                            >
                                Anterior
                            </Link>
                            <Link
                                href={`/admin?page=${currentPage + 1}${currentCourtId ? `&courtId=${currentCourtId}` : ''}`}
                                className={`relative ml-3 inline-flex items-center rounded-md border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 ${currentPage >= (pagination?.totalPages || 1) ? 'pointer-events-none opacity-50' : ''}`}
                            >
                                Siguiente
                            </Link>
                        </div>
                        <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
                            <div>
                                <p className="text-sm text-zinc-700 dark:text-zinc-400">
                                    Mostrando <span className="font-medium">{((pagination?.currentPage || 1) - 1) * 10 + 1}</span> a <span className="font-medium">{Math.min((pagination?.currentPage || 1) * 10, pagination?.totalCount || 0)}</span> de <span className="font-medium">{pagination?.totalCount}</span> resultados
                                </p>
                            </div>
                            <div>
                                <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
                                    <Link
                                        href={`/admin?page=${currentPage - 1}${currentCourtId ? `&courtId=${currentCourtId}` : ''}`}
                                        className={`relative inline-flex items-center rounded-l-md px-2 py-2 text-zinc-400 ring-1 ring-inset ring-zinc-300 hover:bg-zinc-50 focus:z-20 focus:outline-offset-0 ${currentPage <= 1 ? 'pointer-events-none opacity-50' : ''}`}
                                    >
                                        <span className="sr-only">Anterior</span>
                                        &larr;
                                    </Link>

                                    {/* Simplified Page Numbers */}
                                    {Array.from({ length: pagination?.totalPages || 1 }, (_, i) => i + 1).map((p) => {
                                        // Simple logic: render all if pages < 10, otherwise basic window
                                        // For MVP, just render logic or max 5 pages? 
                                        // Let's render all for now assuming < 10 pages for demo
                                        if (pagination && pagination.totalPages > 10 && Math.abs(p - currentPage) > 2 && p !== 1 && p !== pagination.totalPages) return null;
                                        // Add dots logic later if needed.

                                        const isActive = p === currentPage;
                                        return (
                                            <Link
                                                key={p}
                                                href={`/admin?page=${p}${currentCourtId ? `&courtId=${currentCourtId}` : ''}`}
                                                className={`relative inline-flex items-center px-4 py-2 text-sm font-semibold ${isActive
                                                    ? 'z-10 bg-green-600 text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-600'
                                                    : 'text-zinc-900 ring-1 ring-inset ring-zinc-300 hover:bg-zinc-50 focus:z-20 focus:outline-offset-0 dark:text-zinc-200 dark:ring-zinc-700 dark:hover:bg-zinc-800'
                                                    }`}
                                            >
                                                {p}
                                            </Link>
                                        )
                                    })}

                                    <Link
                                        href={`/admin?page=${currentPage + 1}${currentCourtId ? `&courtId=${currentCourtId}` : ''}`}
                                        className={`relative inline-flex items-center rounded-r-md px-2 py-2 text-zinc-400 ring-1 ring-inset ring-zinc-300 hover:bg-zinc-50 focus:z-20 focus:outline-offset-0 ${currentPage >= (pagination?.totalPages || 1) ? 'pointer-events-none opacity-50' : ''}`}
                                    >
                                        <span className="sr-only">Siguiente</span>
                                        &rarr;
                                    </Link>
                                </nav>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
