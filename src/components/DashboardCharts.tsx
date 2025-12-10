'use client';

import { useState } from 'react';

interface HistogramData {
    month: string;
    count: number;
}

interface CourtData {
    id: number;
    name: string;
    totalBookings: number;
    revenue: number;
    histogram: HistogramData[];
}

interface DashboardChartsProps {
    globalHistogram: HistogramData[];
    courts: CourtData[];
    globalStats: {
        revenue: number;
        totalBookings: number;
        popularCourtName: string;
    };
}

export default function DashboardCharts({ globalHistogram, courts, globalStats }: DashboardChartsProps) {
    const [selectedCourtId, setSelectedCourtId] = useState<number | 'all'>('all');

    const selectedCourt = selectedCourtId === 'all' ? null : courts.find(c => c.id === selectedCourtId);

    const currentHistogram = selectedCourt
        ? selectedCourt.histogram
        : globalHistogram;

    const currentRevenue = selectedCourt ? selectedCourt.revenue : globalStats.revenue;
    const currentBookings = selectedCourt ? selectedCourt.totalBookings : globalStats.totalBookings;
    const currentPopular = selectedCourt ? selectedCourt.name : globalStats.popularCourtName;

    const maxCount = Math.max(...currentHistogram.map(d => d.count), 1);

    return (
        <div className="space-y-8">
            {/* Dynamic Stats Cards */}
            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                <div className="rounded-xl border border-zinc-100 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 transition-all duration-300 hover:shadow-md">
                    <h3 className="text-sm font-semibold uppercase tracking-wider text-zinc-400">
                        {selectedCourt ? 'Ingresos (Cancha)' : 'Ingresos Totales (Mes)'}
                    </h3>
                    <p className="mt-4 text-4xl font-extrabold tracking-tight text-zinc-900 dark:text-white">
                        S/ {currentRevenue.toLocaleString()}
                    </p>
                </div>
                <div className="rounded-xl border border-zinc-100 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 transition-all duration-300 hover:shadow-md">
                    <h3 className="text-sm font-semibold uppercase tracking-wider text-zinc-400">
                        {selectedCourt ? 'Reservas (Cancha)' : 'Total de Reservas'}
                    </h3>
                    <p className="mt-4 text-4xl font-extrabold tracking-tight text-blue-500 dark:text-blue-400">
                        {currentBookings}
                    </p>
                </div>
                <div className="rounded-xl border border-zinc-100 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 transition-all duration-300 hover:shadow-md">
                    <h3 className="text-sm font-semibold uppercase tracking-wider text-zinc-400">
                        {selectedCourt ? 'Cancha Seleccionada' : 'Cancha Más Popular'}
                    </h3>
                    <p className="mt-4 text-2xl font-bold tracking-tight text-purple-500 line-clamp-1 dark:text-purple-400">
                        {currentPopular}
                    </p>
                </div>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-100 pb-4 dark:border-zinc-800">
                <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-50">
                    {selectedCourtId === 'all' ? 'Tendencia de Reservas' : `Tendencia: ${selectedCourt?.name}`}
                </h2>

                <select
                    value={selectedCourtId}
                    onChange={(e) => setSelectedCourtId(e.target.value === 'all' ? 'all' : Number(e.target.value))}
                    className="rounded-lg border-zinc-200 bg-zinc-50 py-2 pl-3 pr-8 text-sm font-medium text-zinc-700 shadow-sm focus:border-zinc-900 focus:ring-zinc-900 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200"
                >
                    <option value="all">📊 Vista Global</option>
                    {courts.map(court => (
                        <option key={court.id} value={court.id}>⚽ {court.name}</option>
                    ))}
                </select>
            </div>

            {/* Histogram Chart */}
            <div className="h-72 w-full rounded-2xl border border-zinc-100 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 flex items-end justify-between gap-3">
                {currentHistogram.map((item) => {
                    const heightPercentage = (item.count / maxCount) * 100;
                    const isZero = item.count === 0;
                    return (
                        <div key={item.month} className="flex flex-1 flex-col items-center gap-3 group h-full justify-end">
                            <div className="relative w-full flex items-end justify-center h-full rounded-t-lg overflow-hidden">
                                <div
                                    style={{ height: `${heightPercentage}%` }}
                                    className={`w-full max-w-[40px] rounded-t-md transition-all duration-500 relative ${isZero ? 'bg-zinc-100 dark:bg-zinc-800 h-1' : 'bg-emerald-500 dark:bg-emerald-600 group-hover:bg-emerald-400'}`}
                                >
                                    {!isZero && (
                                        <div className="opacity-0 group-hover:opacity-100 absolute -top-10 left-1/2 -translate-x-1/2 bg-zinc-900 text-white text-xs font-bold px-2 py-1 rounded shadow-lg transition-all duration-200 -translate-y-2 group-hover:translate-y-0 whitespace-nowrap z-10">
                                            {item.count}
                                        </div>
                                    )}
                                </div>
                            </div>
                            <span className="text-xs font-medium text-zinc-400 group-hover:text-zinc-900 dark:group-hover:text-zinc-200 transition-colors uppercase tracking-wide">
                                {item.month.split('-')[1]}
                            </span>
                        </div>
                    );
                })}
            </div>

            {/* Quick Stats Grid for Courts */}
            {selectedCourtId === 'all' && (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {courts.map(court => (
                        <div key={court.id} className="group flex items-center justify-between rounded-xl border border-zinc-100 bg-zinc-50/50 p-4 transition-colors hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-900/50 dark:hover:border-zinc-700">
                            <div>
                                <h4 className="font-semibold text-zinc-900 dark:text-zinc-100">{court.name}</h4>
                                <p className="text-xs text-zinc-500">{court.totalBookings} reservas (12m)</p>
                            </div>
                            <div className="text-right">
                                <span className="block text-sm font-bold text-emerald-600 dark:text-emerald-500">S/ {court.revenue}</span>
                                <span className="text-xs text-zinc-400">Ingresos Totales</span>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
