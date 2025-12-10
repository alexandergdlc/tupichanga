import { auth } from '@/auth';
import { PrismaClient } from '@prisma/client';
import { redirect, notFound } from 'next/navigation';
import EditCourtForm from '@/components/EditCourtForm';

const prisma = new PrismaClient();

export default async function EditCourtPage({ params }: { params: Promise<{ id: string, courtId: string }> }) {
    const session = await auth();
    if (!session?.user?.email) redirect('/login');

    const { id, courtId: cId } = await params;
    const venueId = parseInt(id);
    const courtId = parseInt(cId);

    const court = await prisma.court.findUnique({
        where: { id: courtId },
        include: { schedules: true }
    });

    if (!court || court.venueId !== venueId) notFound();

    return (
        <div className="container mx-auto px-4 py-8 max-w-4xl">
            <h1 className="mb-8 text-2xl font-bold text-zinc-900 dark:text-zinc-50">Editar Cancha: {court.name}</h1>
            <EditCourtForm court={court} venueId={venueId} />
        </div>
    );
}
