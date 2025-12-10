import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { getVenueStats } from '@/app/actions';
import Link from 'next/link';
import DashboardCharts from '@/components/DashboardCharts';

export default async function VenueDashboardPage({ params }: { params: Promise<{ id: string }> }) {
    const session = await auth();
    if (!session?.user?.email) redirect('/login');

    const { id } = await params;
    const venueId = parseInt(id);

    const stats = await getVenueStats(venueId);

    if (!stats || 'error' in stats) {
        return (
            <div className="container mx-auto p-4">
                <div className="rounded-md bg-red-50 p-4 text-red-700">
                    Error cargando estadísticas o no autorizado.
                </div>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="mb-6 flex items-center justify-between">
                <div>
                    <Link href={`/admin/venues/${venueId}`} className="text-sm text-zinc-500 hover:text-zinc-900 mb-2 block">
                        ← Volver al Local
                    </Link>
                    <h1 className="text-3xl font-bold text-zinc-900 dark:text-white">Dashboard de Rendimiento</h1>
                    <p className="text-zinc-600 dark:text-zinc-400">Resumen de actividad y ganancias</p>
                </div>
            </div>

            {/* Advanced Dashboard (Charts + Stats Cards) */}
            <div className="mb-8">
                <DashboardCharts
                    globalHistogram={stats.histogramData}
                    courts={stats.detailedCourts}
                    globalStats={{
                        revenue: stats.revenue,
                        totalBookings: stats.totalBookings,
                        popularCourtName: stats.popularCourtName
                    }}
                />
            </div>

            {/* Recent Bookings Table */}
            <div className="rounded-lg border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
                <div className="border-b border-zinc-200 px-6 py-4 dark:border-zinc-800">
                    <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">Reservas Recientes</h2>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-zinc-600 dark:text-zinc-400">
                        <thead className="bg-zinc-50 text-xs uppercase text-zinc-700 dark:bg-zinc-950 dark:text-zinc-300">
                            <tr>
                                <th className="px-6 py-3">Usuario</th>
                                <th className="px-6 py-3">Cancha</th>
                                <th className="px-6 py-3">Fecha</th>
                                <th className="px-6 py-3 text-right">Precio</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                            {stats.recentBookings.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="px-6 py-8 text-center text-zinc-500">
                                        No hay reservas recientes registradas.
                                    </td>
                                </tr>
                            ) : (
                                stats.recentBookings.map((booking: any) => (
                                    <tr key={booking.id} className="group transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-800/50">
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col">
                                                <span className="font-medium text-zinc-900 dark:text-zinc-200">{booking.user.name || "Usuario"}</span>
                                                <span className="text-xs text-zinc-500">{booking.user.email}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="inline-flex items-center rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs font-medium text-zinc-800 dark:bg-zinc-800 dark:text-zinc-300">
                                                {booking.court.name}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-zinc-600 dark:text-zinc-400 tabular-nums">
                                            {new Date(booking.startTime).toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' })}
                                            <span className="mx-2 text-zinc-300">|</span>
                                            {new Date(booking.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </td>
                                        <td className="px-6 py-4 text-right font-bold text-emerald-600 tabular-nums">
                                            S/ {booking.totalPrice.toFixed(2)}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
