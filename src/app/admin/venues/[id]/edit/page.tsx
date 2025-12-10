import { auth } from '@/auth';
import { PrismaClient } from '@prisma/client';
import { redirect } from 'next/navigation';
import VenueForm from '@/components/VenueForm';
import { updateVenue } from '@/app/actions';

const prisma = new PrismaClient();

export default async function EditVenuePage({ params }: { params: Promise<{ id: string }> }) {
    const session = await auth();
    if (!session?.user?.email) {
        redirect('/');
    }

    const { id } = await params;
    const venue = await prisma.venue.findUnique({
        where: { id: Number(id) },
    });

    if (!venue) {
        return <div className="p-8 text-center">Local no encontrado</div>;
    }

    const user = await prisma.user.findUnique({ where: { email: session.user.email } });

    if (venue.ownerId !== user?.id) {
        return <div className="p-8 text-center">No tienes permiso para editar este local</div>;
    }

    return (
        <div className="container mx-auto max-w-2xl px-4 py-12">
            <h1 className="mb-8 text-3xl font-bold text-zinc-900 dark:text-white">Editar Local</h1>
            <VenueForm venue={venue} action={updateVenue} />
        </div>
    );
}
