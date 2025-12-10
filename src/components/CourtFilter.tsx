'use client';

import { useRouter, useSearchParams } from 'next/navigation';

interface Court {
    id: number;
    name: string;
    venue: {
        name: string;
    };
}

interface CourtFilterProps {
    courts: Court[];
}

export default function CourtFilter({ courts }: CourtFilterProps) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const currentCourtId = searchParams.get('courtId') || '';

    const handleFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const courtId = e.target.value;
        const params = new URLSearchParams(searchParams.toString());

        if (courtId) {
            params.set('courtId', courtId);
        } else {
            params.delete('courtId');
        }

        // Reset to page 1 when filter changes
        params.set('page', '1');

        router.push(`/admin?${params.toString()}`);
    };

    return (
        <div className="flex items-center gap-2">
            <label htmlFor="court-filter" className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
                Filtrar por cancha:
            </label>
            <select
                id="court-filter"
                value={currentCourtId}
                onChange={handleFilterChange}
                className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
            >
                <option value="">Todas las canchas</option>
                {courts.map((court) => (
                    <option key={court.id} value={court.id}>
                        {court.venue.name} - {court.name}
                    </option>
                ))}
            </select>
        </div>
    );
}
