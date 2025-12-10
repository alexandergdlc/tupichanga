import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { PrismaClient } from '@prisma/client';
import ProfileForm from '@/components/ProfileForm';

const prisma = new PrismaClient();

export default async function ProfilePage() {
    const session = await auth();
    if (!session?.user?.email) redirect('/login');

    const user = await prisma.user.findUnique({
        where: { email: session.user.email }
    });

    if (!user) redirect('/login');

    return (
        <div className="container mx-auto max-w-4xl px-4 py-12">
            <h1 className="mb-8 text-3xl font-bold text-zinc-900 dark:text-zinc-50">Configuración de Cuenta</h1>

            <div className="rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
                <ProfileForm user={user} />
            </div>
        </div>
    );
}
