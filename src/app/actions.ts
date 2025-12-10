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

    // Calculate end time (assuming 1 hour slots for now)
    const start = new Date(startTime);
    const end = new Date(start.getTime() + 60 * 60 * 1000); // +1 hour

    try {
        const booking = await prisma.booking.create({
            data: {
                userId,
                courtId,
                startTime: start,
                endTime: end,
                totalPrice: price,
                status: 'CONFIRMED', // Auto-confirm for demo
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

export async function upsertSchedule(prevState: any, formData: FormData) {
    const session = await auth();
    if (!session?.user?.email) return { success: false, message: 'No autorizado' };

    const validatedFields = ScheduleSchema.safeParse({
        courtId: formData.get('courtId'),
        dayOfWeek: formData.get('dayOfWeek'),
        startTime: formData.get('startTime'),
        endTime: formData.get('endTime'),
        price: formData.get('price'),
    });

    if (!validatedFields.success) {
        return { success: false, message: 'Datos de horario inválidos' };
    }

    const { courtId, dayOfWeek, startTime, endTime, price } = validatedFields.data;

    try {
        // Remove existing schedule for this day to avoid duplicates/overlaps for now (simplification)
        await prisma.schedule.deleteMany({
            where: { courtId, dayOfWeek }
        });

        await prisma.schedule.create({
            data: { courtId, dayOfWeek, startTime, endTime, price }
        });

        revalidatePath(`/admin/venues`); // General revalidation
        return { success: true, message: 'Horario guardado' };
    } catch (error) {
        console.error(error);
        return { success: false, message: 'Error al guardar horario' };
    }
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
