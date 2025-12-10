'use server';

import { signIn, auth } from '@/auth';
import { AuthError } from 'next-auth';


import { PrismaClient } from '@prisma/client';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import bcrypt from 'bcryptjs';
import { z } from 'zod';

import { writeFile } from 'fs/promises';
import { join } from 'path';

const prisma = new PrismaClient();

async function saveFile(file: File): Promise<string | null> {
    if (!file || file.size === 0) return null;

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Create a unique filename
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const validFilename = file.name.replace(/[^a-z0-9.]/gi, '_').toLowerCase();
    const filename = `${uniqueSuffix}-${validFilename}`;

    // Save to public/uploads
    // Ensure "public/uploads" exists manually or programmatically. 
    // We created it via mkdir, but checking would be robust.
    const uploadDir = join(process.cwd(), 'public', 'uploads');
    const filepath = join(uploadDir, filename);

    try {
        await writeFile(filepath, buffer);
        return `/uploads/${filename}`;
    } catch (error) {
        console.error('Error saving file:', error);
        return null;
    }
}

// ... (imports)

export async function updateUserProfile(prevState: any, formData: FormData) {
    const session = await auth();
    if (!session?.user?.email) return { success: false, message: 'No sesión' };

    const name = formData.get('name') as string;
    const phoneNumber = formData.get('phoneNumber') as string;

    try {
        await prisma.user.update({
            where: { email: session.user.email },
            data: { name, phoneNumber }
        });
        revalidatePath('/profile');
        return { success: true, message: 'Perfil actualizado' };
    } catch (e) {
        return { success: false, message: 'Error al actualizar' };
    }
}

export async function getUpcomingBookings(email: string) {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return [];

    const now = new Date();
    // Fetch bookings for the next 12 hours (notification window)
    const notificationWindow = new Date(now.getTime() + 12 * 60 * 60 * 1000);

    const bookings = await prisma.booking.findMany({
        where: {
            userId: user.id,
            status: { in: ['PENDING', 'CONFIRMED'] },
            startTime: {
                gte: now,
                lte: notificationWindow
            }
        },
        include: {
            court: {
                include: { venue: true }
            }
        },
        orderBy: { startTime: 'asc' }
    });

    return bookings;
}

export async function createBooking(courtId: number, startTime: string, price: number) {
    const session = await auth();

    if (!session?.user?.email) {
        return { success: false, error: 'Debes iniciar sesión para reservar.' };
    }

    // Fetch user from DB to get ID
    const user = await prisma.user.findUnique({
        where: { email: session.user.email },
    });

    if (!user) {
        return { success: false, error: 'Usuario no encontrado.' };
    }

    const userId = user.id;

    if (user.role === 'OWNER') {
        return { success: false, error: 'Los dueños no pueden realizar reservas, solo ver la disponibilidad.' };
    }

    // Calculate end time (assuming 1 hour slots for now)
    const start = new Date(startTime);
    const end = new Date(start.getTime() + 60 * 60 * 1000); // +1 hour

    // Dynamic Price Calculation
    // 1. Get Day of Week (0-6)
    const dayOfWeek = start.getDay();

    // 2. Find matching Schedule
    const timeString = start.toTimeString().slice(0, 5); // "HH:MM"

    const schedule = await prisma.schedule.findFirst({
        where: {
            courtId: courtId,
            dayOfWeek: dayOfWeek,
            startTime: { lte: timeString },
            endTime: { gt: timeString }
        }
    });

    // 3. Fallback to court default price if no specific schedule
    let finalPrice = price; // Default from client (should be validated, but we use DB source of truth)

    if (schedule) {
        finalPrice = schedule.price;
    } else {
        // Fetch court default price to be safe
        const court = await prisma.court.findUnique({ where: { id: courtId } });
        if (court) finalPrice = court.pricePerHour;
    }

    // Prevent booking in the past
    const now = new Date();
    if (start < now) {
        return { success: false, error: 'No se pueden reservar fechas pasadas.' };
    }

    // 4. Overlap Check (Server-side constraint)
    const existingBooking = await prisma.booking.findFirst({
        where: {
            courtId,
            startTime: start, // Assuming exact slot match logic for now. For ranges, use gte/lt.
            status: { in: ['PENDING', 'CONFIRMED', 'COMPLETED'] }
        }
    });

    if (existingBooking) {
        return { success: false, error: 'Este horario ya no está disponible.' };
    }

    try {
        const booking = await prisma.booking.create({
            data: {
                userId,
                courtId,
                startTime: start,
                endTime: end,
                totalPrice: finalPrice,
                status: 'PENDING', // Default to PENDING as requested (Waiting)
            },
        });

        console.log('Booking created:', booking);

        // Revalidate the venue page to update availability (future feature)
        revalidatePath(`/venue/${booking.courtId}`);
        revalidatePath(`/my-bookings`);

        return { success: true, bookingId: booking.id };
    } catch (error) {
        console.error('Failed to create booking:', error);
        return { success: false, error: 'Failed to create booking' };
    }
}


export async function authenticate(
    prevState: string | undefined,
    formData: FormData,
) {
    // ... existing authentication logic ...
    try {
        const email = formData.get('email') as string;
        let redirectTo = '/';

        if (email) {
            const user = await prisma.user.findUnique({ where: { email } });
            if (user?.role === 'OWNER') {
                redirectTo = '/admin';
            }
        }

        await signIn('credentials', {
            ...Object.fromEntries(formData),
            redirectTo,
        });
    } catch (error) {
        if (error instanceof AuthError) {
            switch (error.type) {
                case 'CredentialsSignin':
                    return 'Invalid credentials.';
                default:
                    return 'Something went wrong.';
            }
        }
        throw error;
    }
}

const RegisterSchema = z.object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    email: z.string().email('Invalid email address'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    role: z.enum(['CLIENT', 'OWNER']).optional(),
});

export async function registerUser(prevState: any, formData: FormData) {
    const validatedFields = RegisterSchema.safeParse({
        name: formData.get('name'),
        email: formData.get('email'),
        password: formData.get('password'),
        role: formData.get('role') || 'CLIENT',
    });

    if (!validatedFields.success) {
        return {
            success: false,
            errors: validatedFields.error.flatten().fieldErrors,
            message: 'Missing Fields. Failed to Register.',
        };
    }

    const { name, email, password, role } = validatedFields.data;

    try {
        const hashedPassword = await bcrypt.hash(password, 10);

        const user = await prisma.user.create({
            data: {
                name,
                email,
                password: hashedPassword,
                role: role || 'CLIENT',
            },
        });

        return { success: true, message: 'User created successfully' };

    } catch (error) {
        console.error('Registration error:', error);
        return {
            success: false,
            message: 'Database Error: Failed to Create User. Email might be taken.',
        };
    }
}

const VenueSchema = z.object({
    name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
    description: z.string().optional(),
    address: z.string().min(5, 'La dirección es muy corta'),
    city: z.string().min(2, 'Ciudad requerida'),
    district: z.string().optional(),
    // Validate loosely as we handle File extraction manually before parsing strict shapes if needed
    // or just treat them as optional here and process manually.
    imageUrl: z.any().optional(),
    yapeQrUrl: z.any().optional(),
});

export async function createVenue(prevState: any, formData: FormData) {
    const session = await auth();
    if (!session?.user?.email) {
        return { success: false, message: 'No autorizado' };
    }

    const user = await prisma.user.findUnique({ where: { email: session.user.email } });
    if (!user) return { success: false, message: 'Usuario no encontrado' };

    const validatedFields = VenueSchema.safeParse({
        name: formData.get('name'),
        description: formData.get('description'),
        address: formData.get('address'),
        city: formData.get('city'),
        district: formData.get('district'),
        imageUrl: formData.get('imageUrl'),
        yapeQrUrl: formData.get('yapeQrUrl'),
    });

    if (!validatedFields.success) {
        return {
            success: false,
            errors: validatedFields.error.flatten().fieldErrors,
            message: 'Faltan campos obligatorios',
        };
    }

    const { name, description, address, city, district } = validatedFields.data;

    // Manual file extraction
    const imageFile = formData.get('imageUrl') as File | null;
    const qrFile = formData.get('yapeQrUrl') as File | null;

    let imageUrlPath = 'https://images.unsplash.com/photo-1529900748604-07564a03e7a6?q=80&w=2070&auto=format&fit=crop';
    if (imageFile && imageFile.size > 0 && imageFile.name !== 'undefined') {
        const path = await saveFile(imageFile);
        if (path) imageUrlPath = path;
    } else if (typeof validatedFields.data.imageUrl === 'string' && validatedFields.data.imageUrl.startsWith('http')) {
        // Fallback if they sent a string URL directly (future proofing)
        imageUrlPath = validatedFields.data.imageUrl;
    }

    let yapeQrUrlPath = '';
    if (qrFile && qrFile.size > 0 && qrFile.name !== 'undefined') {
        const path = await saveFile(qrFile);
        if (path) yapeQrUrlPath = path;
    } else if (typeof validatedFields.data.yapeQrUrl === 'string') {
        yapeQrUrlPath = validatedFields.data.yapeQrUrl;
    }

    try {
        await prisma.venue.create({
            data: {
                name,
                description: description || '',
                address,
                city,
                district: district || '',
                imageUrl: imageUrlPath,
                yapeQrUrl: yapeQrUrlPath,
                googleMapsUrl: formData.get('googleMapsUrl') as string || '',
                ownerId: user.id
            },
        });

        revalidatePath('/admin');
        revalidatePath('/search');
        return { success: true, message: 'Local creado exitosamente' };
    } catch (error) {
        console.error('Error creating venue:', error);
        return { success: false, message: 'Error al crear el local en la base de datos' };
    }
}

export async function updateVenue(prevState: any, formData: FormData) {
    const session = await auth();
    if (!session?.user?.email) return { success: false, message: 'No autorizado' };

    const venueId = Number(formData.get('venueId'));

    // Verify ownership
    const venue = await prisma.venue.findUnique({ where: { id: venueId } });
    const user = await prisma.user.findUnique({ where: { email: session.user.email } });
    if (!venue || !user || venue.ownerId !== user.id) return { success: false, message: 'No autorizado' };


    const validatedFields = VenueSchema.safeParse({
        name: formData.get('name'),
        description: formData.get('description'),
        address: formData.get('address'),
        city: formData.get('city'),
        district: formData.get('district'),
        imageUrl: formData.get('imageUrl'),
        yapeQrUrl: formData.get('yapeQrUrl'),
    });

    if (!validatedFields.success) {
        return {
            success: false,
            errors: validatedFields.error.flatten().fieldErrors,
            message: 'Error en campos',
        };
    }

    const { name, description, address, city, district } = validatedFields.data;

    // Manual file extraction and handling
    const imageFile = formData.get('imageUrl') as File | null;
    const qrFile = formData.get('yapeQrUrl') as File | null;

    let imageUrlPath = venue.imageUrl;
    if (imageFile && imageFile.size > 0 && imageFile.name !== 'undefined') {
        const path = await saveFile(imageFile);
        if (path) imageUrlPath = path;
    } else if (typeof validatedFields.data.imageUrl === 'string' && validatedFields.data.imageUrl.startsWith('http')) {
        imageUrlPath = validatedFields.data.imageUrl;
    }

    let yapeQrUrlPath = venue.yapeQrUrl;
    if (qrFile && qrFile.size > 0 && qrFile.name !== 'undefined') {
        const path = await saveFile(qrFile);
        if (path) yapeQrUrlPath = path;
    } else if (typeof validatedFields.data.yapeQrUrl === 'string' && validatedFields.data.yapeQrUrl !== '') {
        yapeQrUrlPath = validatedFields.data.yapeQrUrl;
    }

    try {
        await prisma.venue.update({
            where: { id: venueId },
            data: {
                name, description, address, city, district,
                imageUrl: imageUrlPath,
                yapeQrUrl: yapeQrUrlPath,
                googleMapsUrl: formData.get('googleMapsUrl') as string || ''
            }
        });
        revalidatePath(`/admin/venues/${venueId}`);
        revalidatePath('/admin');
        revalidatePath('/search');

        // IMPORTANT: We need to revalidate the edit page specifically as well if it caches data
        revalidatePath(`/admin/venues/${venueId}/edit`);

        return { success: true, message: 'Local actualizado correctamente' };
    } catch (error) {
        console.error("Update venue error:", error);
        return { success: false, message: 'Error al actualizar local' };
    }
}

const CourtSchema = z.object({
    name: z.string().min(2, 'Nombre requerido'),
    sport: z.string().min(2, 'Deporte requerido'),
    type: z.string().optional(),
    pricePerHour: z.coerce.number().min(0, 'Precio inválido'),
});

export async function createCourt(prevState: any, formData: FormData) {
    const session = await auth();
    if (!session?.user?.email) return { success: false, message: 'No autorizado' };

    const venueId = Number(formData.get('venueId'));
    if (!venueId) return { success: false, message: 'ID de local inválido' };

    const validatedFields = CourtSchema.safeParse({
        name: formData.get('name'),
        sport: formData.get('sport'),
        type: formData.get('type'),
        pricePerHour: formData.get('pricePerHour'),
    });

    if (!validatedFields.success) {
        return { success: false, errors: validatedFields.error.flatten().fieldErrors, message: 'Error en campos' };
    }

    const { name, sport, type, pricePerHour } = validatedFields.data;

    try {
        await prisma.court.create({
            data: {
                venueId,
                name,
                sport,
                type: type || 'Sintética',
                pricePerHour,
            }
        });
        revalidatePath(`/admin/venues/${venueId}`);
        return { success: true, message: 'Cancha creada' };
    } catch (error: any) {
        console.error('Error creating court:', error);
        return { success: false, message: `Error al crear cancha: ${error.message}` };
    }
}

export async function deleteCourt(courtId: number, venueId: number) {
    const session = await auth();
    if (!session?.user?.email) return { success: false, message: 'No autorizado' };

    try {
        await prisma.court.delete({ where: { id: courtId } });
        revalidatePath(`/admin/venues/${venueId}`);
        return { success: true, message: 'Cancha eliminada' };
    } catch (error) {
        return { success: false, message: 'Error al eliminar' };
    }
}

export async function updateCourt(prevState: any, formData: FormData) {
    const session = await auth();
    if (!session?.user?.email) return { success: false, message: 'No autorizado' };

    const courtId = Number(formData.get('courtId'));
    const venueId = Number(formData.get('venueId'));

    const validatedFields = CourtSchema.safeParse({
        name: formData.get('name'),
        sport: formData.get('sport'),
        type: formData.get('type'),
        pricePerHour: formData.get('pricePerHour'),
    });

    if (!validatedFields.success) {
        return { success: false, errors: validatedFields.error.flatten().fieldErrors, message: 'Error en campos' };
    }

    const { name, sport, type, pricePerHour } = validatedFields.data;

    try {
        await prisma.court.update({
            where: { id: courtId },
            data: { name, sport, type, pricePerHour }
        });
        revalidatePath(`/admin/venues/${venueId}`);
        return { success: true, message: 'Cancha actualizada' };
    } catch (error) {
        return { success: false, message: 'Error al actualizar' };
    }
}

const ScheduleSchema = z.object({
    courtId: z.coerce.number(),
    dayOfWeek: z.coerce.number().min(0).max(6),
    startTime: z.string().regex(/^\d{2}:\d{2}$/, 'Formato HH:MM'),
    endTime: z.string().regex(/^\d{2}:\d{2}$/, 'Formato HH:MM'),
    price: z.coerce.number().min(0),
});

export async function saveDaySchedules(prevState: any, formData: FormData) {
    const session = await auth();
    if (!session?.user?.email) return { success: false, message: 'No autorizado' };

    const courtId = Number(formData.get('courtId'));
    const dayOfWeek = Number(formData.get('dayOfWeek'));
    const schedulesJson = formData.get('schedules') as string;

    if (!courtId || isNaN(dayOfWeek) || !schedulesJson) {
        return { success: false, message: 'Datos inválidos' };
    }

    try {
        const schedules = JSON.parse(schedulesJson);

        // Transaction: Delete old schedules for this day, insert new ones
        await prisma.$transaction(async (tx) => {
            // Delete existing
            await tx.schedule.deleteMany({
                where: { courtId, dayOfWeek }
            });

            // Insert new
            if (schedules.length > 0) {
                await tx.schedule.createMany({
                    data: schedules.map((s: any) => ({
                        courtId,
                        dayOfWeek,
                        startTime: s.startTime,
                        endTime: s.endTime,
                        price: parseFloat(s.price)
                    }))
                });
            }
        });

        revalidatePath(`/admin/venues`);
        return { success: true, message: 'Horarios guardados correctamente' };
    } catch (error) {
        console.error('Error saving schedules:', error);
        return { success: false, message: 'Error al guardar horarios' };
    }
}


export async function expireBookings() {
    try {
        await prisma.booking.updateMany({
            where: {
                status: { in: ['PENDING', 'CONFIRMED'] },
                endTime: { lt: new Date() }
            },
            data: { status: 'COMPLETED' }
        });
    } catch (e) {
        console.error("Error auto-completing bookings:", e);
    }
}

export async function getDocAvailability(courtId: number, date: string) {
    // 0. Auto-complete past bookings
    await expireBookings();

    // 1. Get schedules for the day of the week
    const targetDate = new Date(date);
    // Fix: new Date(date) processes as UTC (usually) or local depending on string format? 
    // "YYYY-MM-DD" usually parses as UTC midnight.
    // getDay() returns 0-6 based on local time or UTC? 
    // It's safer to rely on the input string yyyy-mm-dd and ensure we treat it consistently.
    // Let's assume standard "2024-05-10" input.
    // We want the day of week for this date.
    // We'll append T12:00:00 to ensure we are in the middle of the day to avoid timezone shifts changing the day.
    const dayOfWeek = new Date(`${date}T12:00:00`).getDay();

    const schedules = await prisma.schedule.findMany({
        where: { courtId, dayOfWeek },
        orderBy: { startTime: 'asc' }
    });

    // 2. Get existing bookings for the date
    const startOfDay = new Date(`${date}T00:00:00`);
    const endOfDay = new Date(`${date}T23:59:59`);

    const bookings = await prisma.booking.findMany({
        where: {
            courtId,
            startTime: {
                gte: startOfDay,
                lte: endOfDay
            },
            // Booking Logic: PENDING, CONFIRMED, COMPLETED block the slot. REJECTED/CANCELLED do not.
            status: { in: ['PENDING', 'CONFIRMED', 'COMPLETED'] }
        }
    });

    // 3. Generate hourly slots based on schedules
    const slots: any[] = [];

    // Helper to parse time string "HH:MM" to minutes
    const toMinutes = (time: string) => {
        const [h, m] = time.split(':').map(Number);
        return h * 60 + m;
    };

    // Helper to format minutes to "HH:MM"
    const toTimeStr = (mins: number) => {
        const h = Math.floor(mins / 60);
        const m = mins % 60;
        return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
    };

    schedules.forEach(schedule => {
        let currentMins = toMinutes(schedule.startTime);
        const endMins = toMinutes(schedule.endTime);

        while (currentMins < endMins) {
            const slotStartStr = toTimeStr(currentMins);
            const slotEndMins = currentMins + 60; // 1 hour slots hardcoded for now

            // Don't go past the schedule end
            if (slotEndMins > endMins) break;

            // Check if booked
            // We compare hours. Bookings are saved as Date objects.
            // We strip time from booking.startTime and compare.
            const isBooked = bookings.some(b => {
                const bTime = b.startTime.toTimeString().slice(0, 5); // HH:MM
                return bTime === slotStartStr;
            });

            slots.push({
                time: slotStartStr,
                price: schedule.price,
                isBooked: isBooked
            });

            currentMins += 60;
        }
    });

    return slots;
}


export async function deleteSchedule(scheduleId: number) {
    try {
        await prisma.schedule.delete({ where: { id: scheduleId } });
        return { success: true };
    } catch (error) {
        return { success: false };
    }
}

export async function getVenueStats(venueId: number) {
    const session = await auth();
    if (!session?.user?.email) return { error: 'Unauthorized' };

    const venue = await prisma.venue.findUnique({
        where: { id: venueId },
        include: {
            courts: {
                include: {
                    bookings: {
                        where: {
                            startTime: {
                                gte: new Date(new Date().setFullYear(new Date().getFullYear() - 1))
                            }
                        }
                    }
                }
            }
        }
    });

    if (!venue) return { error: 'Venue not found' };

    // Check ownership
    const user = await prisma.user.findUnique({ where: { email: session.user.email } });
    if (!user || venue.ownerId !== user.id) return { error: 'Unauthorized' };

    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    let totalRevenue = 0;
    let totalBookings = 0;

    // Prepare structures for histogram
    const monthlyStats: Record<string, number> = {};

    const courtsData = venue.courts.map(court => {
        let courtRevenue = 0;
        let courtBookings = 0;
        const courtMonthlyStats: Record<string, number> = {};

        court.bookings.forEach(booking => {
            // ONLY count valid bookings
            // Consistent stat logic: Confirmed/Completed are revenue
            if (booking.status !== 'CONFIRMED' && booking.status !== 'COMPLETED') return;

            const date = new Date(booking.startTime);
            const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

            // Total stats (Accumulate all fetched bookings - Last 12 Months)
            // Removed current month filter to show TOTAL revenue matchhing total bookings
            totalRevenue += booking.totalPrice;
            courtRevenue += booking.totalPrice;

            // Global stats accumulators
            monthlyStats[monthKey] = (monthlyStats[monthKey] || 0) + 1;
            courtMonthlyStats[monthKey] = (courtMonthlyStats[monthKey] || 0) + 1;

            courtBookings++;
            // Note: totalBookings variable in line 509 is unused effectively as we use trueTotalBookings later, 
            // but let's keep logic clean.
            totalBookings++;
        });

        return {
            id: court.id,
            name: court.name,
            totalBookings: courtBookings, // This is "Last 12 months confirmed bookings" per court logic above
            revenue: courtRevenue, // This is "Current Month Revenue" per court
            monthlyStats: courtMonthlyStats
        };
    });

    // Histogram Data Processing
    const last12Months = Array.from({ length: 12 }, (_, i) => {
        const d = new Date();
        d.setMonth(d.getMonth() - (11 - i));
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    });

    const histogramData = last12Months.map(key => ({
        month: key,
        count: monthlyStats[key] || 0
    }));

    const detailedCourts = courtsData.map(c => ({
        ...c,
        histogram: last12Months.map(key => ({
            month: key,
            count: c.monthlyStats[key] || 0
        }))
    }));

    const popularCourt = detailedCourts.reduce((prev, current) =>
        (prev.totalBookings > current.totalBookings) ? prev : current
        , { name: 'N/A', totalBookings: -1 });

    // Recent Bookings (Separate query for efficiency/sorting)
    const recentBookings = await prisma.booking.findMany({
        where: { court: { venueId: venueId } },
        orderBy: { startTime: 'desc' },
        take: 5,
        include: { user: { select: { name: true, email: true } }, court: { select: { name: true } } }
    });

    // True Total Bookings (All time) count query directly from DB for accuracy
    const trueTotalBookings = await prisma.booking.count({
        where: {
            court: { venueId: venueId },
            status: { in: ['CONFIRMED', 'COMPLETED'] }
        }
    });

    return {
        revenue: totalRevenue,
        totalBookings: trueTotalBookings,
        popularCourtName: popularCourt.name,
        recentBookings,
        histogramData,
        detailedCourts
    };
}

export async function getBookings(courtId: number, date: string) {
    // date format YYYY-MM-DD
    // We need to find bookings that overlap or match this day.
    // Assuming simple hour slots: start matches the date.

    // Create Date objects for start and end of search day
    // Note: 'date' string parsing might depend on timezone, assuming local/UTC consistency or using string comparison
    const searchDateStart = new Date(`${date}T00:00:00`);
    const searchDateEnd = new Date(`${date}T23:59:59`);

    const bookings = await prisma.booking.findMany({
        where: {
            courtId: courtId,
            startTime: {
                gte: searchDateStart,
                lte: searchDateEnd
            }
        },
        select: {
            startTime: true
        }
    });

    // Return array of hours strings "HH:MM"
    return bookings.map(b => {
        const d = new Date(b.startTime);
        // Format to HH:MM. Ensure leading zeros.
        // Assuming database saves in correct timezone or local time. 
        // For simplicity in this demo, we extract hours directly.
        // If DB is UTC, this might need adjustment. Next.js/Prisma usually handles this well if ENV is set.
        // Let's rely on toTimeString or getHours/getMinutes.
        const hours = d.getHours().toString().padStart(2, '0');
        const minutes = d.getMinutes().toString().padStart(2, '0');
        return `${hours}:${minutes}`;
    });
}

export async function rescheduleBooking(bookingId: number, newStartTime: string) {
    const session = await auth();
    if (!session?.user?.email) return { success: false, message: 'No autorizado' };

    const user = await prisma.user.findUnique({ where: { email: session.user.email } });
    if (!user) return { success: false, message: 'Usuario no encontrado' };

    // Verify booking ownership
    const booking = await prisma.booking.findUnique({
        where: { id: bookingId },
        include: { court: true }
    });

    if (!booking) return { success: false, message: 'Reserva no encontrada' };

    // Allow users to modify their own bookings, or owners to modify any? 
    // For now, strict ownership or exact owner of venue.
    // Assuming user owns booking.
    if (booking.userId !== user.id) {
        // Check if user is owner of the venue?
        const venue = await prisma.venue.findUnique({ where: { id: booking.court.venueId } });
        if (venue?.ownerId !== user.id) {
            return { success: false, message: 'No tienes permiso para modificar esta reserva' };
        }
    }

    // Verify status allows rescheduling
    if (booking.status === 'REJECTED' || booking.status === 'COMPLETED') {
        return { success: false, message: 'No se puede reprogramar una reserva rechazada o completada.' };
    }

    const start = new Date(newStartTime);
    const end = new Date(start.getTime() + 60 * 60 * 1000); // +1 hour

    // Check availability (exclude current booking)
    const conflict = await prisma.booking.findFirst({
        where: {
            courtId: booking.courtId,
            id: { not: bookingId }, // Exclude self
            startTime: {
                lt: end,
                gte: start
            }
        }
    });

    if (conflict) {
        return { success: false, message: 'El horario seleccionado ya está ocupado.' };
    }

    try {
        await prisma.booking.update({
            where: { id: bookingId },
            data: {
                startTime: start,
                endTime: end
            }
        });

        revalidatePath('/my-bookings');
        revalidatePath(`/venue/${booking.courtId}`);
        return { success: true, message: 'Reserva reprogramada exitosamente' };
    } catch (error) {
        console.error('Reschedule error:', error);
        return { success: false, message: 'Error al actualizar reserva' };
    }
}

export async function updateProfile(prevState: any, formData: FormData) {
    const session = await auth();
    if (!session?.user?.email) return { success: false, message: 'No autorizado' };

    const user = await prisma.user.findUnique({ where: { email: session.user.email } });
    if (!user) return { success: false, message: 'Usuario no encontrado' };

    const name = formData.get('name') as string;
    const currentPassword = formData.get('currentPassword') as string;
    const newPassword = formData.get('newPassword') as string;
    const imageFile = formData.get('image') as File | null;

    const dataToUpdate: any = {};

    if (name && name.trim() !== '' && name !== user.name) {
        dataToUpdate.name = name;
    }

    if (imageFile && imageFile.size > 0 && imageFile.name !== 'undefined') {
        const path = await saveFile(imageFile);
        if (path) dataToUpdate.image = path;
    }

    if (newPassword) {
        if (newPassword.length < 6) {
            return { success: false, message: 'La nueva contraseña debe tener al menos 6 caracteres.' };
        }
        if (!currentPassword) {
            return { success: false, message: 'Ingresa tu contraseña actual para cambiarla.' };
        }
        const isValid = await bcrypt.compare(currentPassword, user.password);
        if (!isValid) {
            return { success: false, message: 'La contraseña actual es incorrecta.' };
        }
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        dataToUpdate.password = hashedPassword;
    }

    if (Object.keys(dataToUpdate).length === 0) {
        return { success: true, message: 'No se detectaron cambios.' };
    }

    try {
        await prisma.user.update({
            where: { email: session.user.email },
            data: dataToUpdate
        });
        revalidatePath('/profile');
        revalidatePath('/');
        return { success: true, message: 'Perfil actualizado correctamente.' };
    } catch (e) {
        console.error(e);
        return { success: false, message: 'Error al actualizar perfil.' };
    }
}

export async function getAllOwnerBookings(page: number = 1, pageSize: number = 10, courtId: number | null = null) {
    const session = await auth();
    if (!session?.user?.email) return { success: false, message: 'No autorizado' };

    const user = await prisma.user.findUnique({ where: { email: session.user.email } });
    if (!user || user.role !== 'OWNER') return { success: false, message: 'No autorizado' };

    const skip = (page - 1) * pageSize;

    // Filter logic: Must belong to owner, optionally filter by specific court
    const whereClause: any = {
        court: {
            venue: {
                ownerId: user.id
            }
        }
    };

    if (courtId) {
        whereClause.court.id = courtId;
    }

    try {
        const totalCount = await prisma.booking.count({
            where: whereClause
        });

        const bookings = await prisma.booking.findMany({
            where: whereClause,
            take: pageSize,
            skip: skip,
            orderBy: { startTime: 'desc' },
            include: {
                user: { select: { name: true, email: true } },
                court: {
                    select: {
                        name: true,
                        venue: { select: { name: true } }
                    }
                }
            }
        });

        const totalPages = Math.ceil(totalCount / pageSize);

        return {
            success: true,
            bookings,
            pagination: {
                currentPage: page,
                totalPages,
                totalCount,
                pageSize
            }
        };

    } catch (error) {
        console.error("Error fetching paginated bookings:", error);
        return { success: false, message: 'Error al obtener reservas' };
    }
}

export async function updateBookingStatus(bookingId: number, status: string) {
    const session = await auth();
    if (!session?.user?.email) return { success: false, message: 'No autorizado' };

    const user = await prisma.user.findUnique({ where: { email: session.user.email } });
    if (!user || user.role !== 'OWNER') return { success: false, message: 'No autorizado' };

    try {
        // Verify ownership
        const booking = await prisma.booking.findUnique({
            where: { id: bookingId },
            include: { court: { include: { venue: true } } }
        });

        if (!booking) return { success: false, message: 'Reserva no encontrada' };

        if (booking.court.venue.ownerId !== user.id) {
            return { success: false, message: 'No tienes permiso para modificar esta reserva' };
        }

        // Valid statuses
        const validStatuses = ['PENDING', 'CONFIRMED', 'REJECTED', 'COMPLETED'];
        if (!validStatuses.includes(status)) {
            return { success: false, message: 'Estado inválido' };
        }

        await prisma.booking.update({
            where: { id: bookingId },
            data: { status }
        });

        revalidatePath('/admin');
        return { success: true, message: 'Estado actualizado correctamente' };
    } catch (error) {
        console.error("Error updating booking status:", error);
        return { success: false, message: 'Error al actualizar estado' };
    }
}
