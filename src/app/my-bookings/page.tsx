import { auth } from '@/auth';
import { PrismaClient } from '@prisma/client';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import MyBookingsClient from '@/components/MyBookingsClient';

const prisma = new PrismaClient();

export const dynamic = 'force-dynamic';

async function getUserBookings(email: string) {
    const user = await prisma.user.findUnique({
        where: { email },
        include: {
            bookings: {
                include: {
                    court: {
                        include: {
                            venue: true
                        }
                    }
                },
                orderBy: { startTime: 'desc' }
            }
        }
    });
    return user?.bookings || [];
}

export default async function MyBookingsPage() {
    const session = await auth();

    if (!session?.user?.email) {
        redirect('/login');
    }

    const bookings = await getUserBookings(session.user.email);

    return <MyBookingsClient initialBookings={bookings} />;
}
