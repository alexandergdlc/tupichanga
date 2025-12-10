import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import CreateCourtForm from '@/components/CreateCourtForm';

export default async function NewCourtPage({ params }: { params: Promise<{ id: string }> }) {
    const session = await auth();
    if (!session?.user?.email) redirect('/login');

    const { id } = await params;
    const venueId = parseInt(id);

    return (
        <div className="container mx-auto px-4 py-8 max-w-2xl">
            <h1 className="mb-8 text-2xl font-bold text-zinc-900 dark:text-zinc-50">Agregar Nueva Cancha</h1>
            <CreateCourtForm venueId={venueId} />
        </div>
    );
}
