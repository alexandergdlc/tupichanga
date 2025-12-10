import { auth } from '@/auth';
import VenueForm from '@/components/VenueForm';
import { redirect } from 'next/navigation';

export default async function NewVenuePage() {
    const session = await auth();
    if (!session?.user?.email) {
        redirect('/login');
    }

    return (
        <div className="container mx-auto px-4 py-8 max-w-2xl">
            <h1 className="mb-8 text-3xl font-bold text-zinc-900 dark:text-zinc-50">Registrar Nuevo Local</h1>
            <VenueForm />
        </div>
    );
}
