import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    console.log('Start seeding ...')

    // Clean existing data
    await prisma.booking.deleteMany()
    await prisma.schedule.deleteMany()
    await prisma.court.deleteMany()
    await prisma.venue.deleteMany()
    await prisma.user.deleteMany()

    const fs = require('fs');
    const path = require('path');
    const backupPath = path.join(__dirname, 'backup.json');

    if (fs.existsSync(backupPath)) {
        console.log('📦 Backup detectado! Restaurando desde prisma/backup.json...');
        const backupData = JSON.parse(fs.readFileSync(backupPath, 'utf-8'));

        // Restore Users
        for (const user of backupData.users) {
            await prisma.user.create({ data: user });
        }
        console.log(`✅ Restaurados ${backupData.users.length} usuarios.`);

        // Restore Venues & Courts
        // Note: Courts are nested creation in backup usually? 
        // Our backup script splits them or includes them? Backup script used "include: { courts: true }".
        // So we can just create venue with courts.
        for (const venue of backupData.venues) {
            // Need to handle IDs properly? 
            // Prisma create can accept ID if we configure it, but usually auto-increment.
            // If we want to keep relationships, we must rely on manual ID insertion or re-mapping.
            // For simple seed restore, we can try to force ID if provider allows, or just create new.
            // To keep simple: let's strip IDs and recreate. But that breaks Owner link if IDs change.
            // SOLUTION: We must connect by Email for owner.

            // Note: Simplest persistent backup for dev is to NOT strip IDs and assume DB is clean.
            // SQL Server supports Identity Insert if enabled, but Prisma handles 'data.id' often.
            // Let's try to restore with IDs. If it fails, we fallback to new IDs.
            // But preserving IDs is critical for consistency.

            // Strip ID from venue to be safe and re-connect owner by email? No, we need ownerID.
            // If we restored users WITH IDs, then ownerID is valid.

            // So strategy: Restore exact data objects.
            await prisma.venue.create({
                data: {
                    ...venue,
                    courts: {
                        create: venue.courts.map((c: any) => {
                            const { id, venueId, ...rest } = c; // Strip court ID to let auto-inc work, or keep it?
                            // Let's strip ID for safety in child records unless vital.
                            return rest;
                        })
                    }
                }
            });
        }
        console.log(`✅ Restaurados ${backupData.venues.length} locales.`);

        console.log('⚠️ Restauración desde backup completada. Se omiten datos de prueba por defecto.');
        return;
    }

    console.log('⚠️ No hay backup encontrado (prisma/backup.json). Generando datos de prueba por defecto...');

    const bcrypt = require('bcryptjs')
    const hashedPassword = await bcrypt.hash('123456', 10)

    // 1. Create Users
    // Jhor Marinio (Owner)
    const jhor = await prisma.user.create({
        data: {
            email: 'jhor.marinio@tupichanga.pe',
            name: 'Jhor Marinio',
            password: hashedPassword,
            role: 'OWNER',
            image: 'https://images.unsplash.com/photo-1599566150163-29194dcaad36?auto=format&fit=crop&q=80'
        } as any,
    })

    // Diego Flores (Owner)
    const diego = await prisma.user.create({
        data: {
            email: 'diego.flores@tupichanga.pe',
            name: 'Diego Flores',
            password: hashedPassword,
            role: 'OWNER',
            image: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80'
        } as any,
    })

    // Client (Test User)
    const client = await prisma.user.create({
        data: {
            email: 'cliente@gmail.com',
            name: 'Carlos Cliente',
            password: hashedPassword,
            role: 'CLIENT',
            image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80'
        } as any,
    })

    console.log(`Created users: ${jhor.name}, ${diego.name}, ${client.name}`)

    // 2. Create Venues for Jhor Marinio (3 Venues, Ayacucho)
    const jhorVenuesData = [
        {
            name: 'Complejo Deportivo Maracaná Ayacucho',
            description: 'El mejor grass sintético de Huamanga. Abierto las 24 horas.',
            address: 'Av. Mariscal Cáceres 450',
            city: 'Ayacucho',
            imageUrl: 'https://images.unsplash.com/photo-1529900748604-07564a03e7a6?q=80&w=2070',
            courts: [
                { name: 'Cancha 1 - Fútbol 7', sport: 'Futbol', pricePerHour: 80.00, type: 'Sintética' },
                { name: 'Loza 1 - Voley/Futsal', sport: 'Voley', pricePerHour: 40.00, type: 'Losa' }
            ]
        },
        {
            name: 'El Coloso de Huamanga',
            description: 'Amplias instalaciones con estacionamiento y zona de parrillas.',
            address: 'Jr. 28 de Julio 123',
            city: 'Ayacucho',
            imageUrl: 'https://images.unsplash.com/photo-1575361204480-aadea25e6e68?q=80&w=2071',
            courts: [
                { name: 'Estadio Principal', sport: 'Futbol', pricePerHour: 120.00, type: 'Grass Natural' },
                { name: 'Cancha Voley A', sport: 'Voley', pricePerHour: 50.00, type: 'Sintética' }
            ]
        },
        {
            name: 'Club Campestre Yanamilla',
            description: 'Disfruta del deporte al aire libre con la mejor vista de Ayacucho.',
            address: 'Vía de Evitamiento Km 5',
            city: 'Ayacucho',
            imageUrl: 'https://images.unsplash.com/photo-1555412619-354c7280d877?q=80&w=1974',
            courts: [
                { name: 'Cancha Pro 1', sport: 'Futbol', pricePerHour: 100.00, type: 'FIFA Quality' },
                { name: 'Campo Multiusos', sport: 'Voley', pricePerHour: 45.00, type: 'Concreto' }
            ]
        }
    ];

    for (const venue of jhorVenuesData) {
        await prisma.venue.create({
            data: {
                name: venue.name,
                description: venue.description,
                address: venue.address,
                city: venue.city,
                imageUrl: venue.imageUrl,
                ownerId: jhor.id,
                courts: { create: venue.courts }
            } as any
        })
    }

    // 3. Create Venues for Diego Flores (2 Venues, Ayacucho)
    const diegoVenuesData = [
        {
            name: 'Estadio Leoncio Prado',
            description: 'La tradición del deporte en Ayacucho. Canchas renovadas.',
            address: 'Parque Leoncio Prado S/N',
            city: 'Ayacucho',
            imageUrl: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?q=80&w=2070',
            courts: [
                { name: 'Campo A - Futbol', sport: 'Futbol', pricePerHour: 90.00, type: 'Sintética' },
                { name: 'Net Alta - Voley', sport: 'Voley', pricePerHour: 40.00, type: 'Losa' }
            ]
        },
        {
            name: 'Polideportivo Nery García',
            description: 'Complejo moderno cerca al mercado Nery García.',
            address: 'Jr. Los Andes 567',
            city: 'Ayacucho',
            imageUrl: 'https://images.unsplash.com/photo-1518605348400-43ded9d2948b?q=80&w=2070',
            courts: [
                { name: 'Cancha Techada 1', sport: 'Futbol', pricePerHour: 110.00, type: 'Sintética Techada' },
                { name: 'Cancha Techada Voley', sport: 'Voley', pricePerHour: 60.00, type: 'Piso Flotante' }
            ]
        }
    ];

    for (const venue of diegoVenuesData) {
        await prisma.venue.create({
            data: {
                name: venue.name,
                description: venue.description,
                address: venue.address,
                city: venue.city,
                imageUrl: venue.imageUrl,
                ownerId: diego.id,
                courts: { create: venue.courts }
            } as any
        })
    }

    console.log(`Created venues for Owners`)

    // 4. Create Bookings (Historial)
    const bookings = []

    // Fetch all courts to be sure
    const allCourts = await prisma.court.findMany()

    const now = new Date()

    for (let i = 0; i < 50; i++) { // 50 Random bookings
        const randomCourt = allCourts[Math.floor(Math.random() * allCourts.length)]
        if (!randomCourt) continue;

        const daysAgo = Math.floor(Math.random() * 60) // Last 2 months
        const bookingDate = new Date(now)
        bookingDate.setDate(bookingDate.getDate() - daysAgo)
        bookingDate.setHours(Math.floor(Math.random() * 14) + 8, 0, 0, 0) // 8am to 10pm

        bookings.push({
            courtId: randomCourt.id,
            userId: client.id,
            startTime: bookingDate,
            endTime: new Date(bookingDate.getTime() + 60 * 60 * 1000),
            totalPrice: randomCourt.pricePerHour,
            status: 'CONFIRMED'
        })
    }

    // Add future bookings
    for (let i = 0; i < 5; i++) {
        const randomCourt = allCourts[Math.floor(Math.random() * allCourts.length)]
        if (!randomCourt) continue;

        const daysFuture = Math.floor(Math.random() * 7) + 1
        const bookingDate = new Date(now)
        bookingDate.setDate(bookingDate.getDate() + daysFuture)
        bookingDate.setHours(18 + i, 0, 0, 0)

        bookings.push({
            courtId: randomCourt.id,
            userId: client.id,
            startTime: bookingDate,
            endTime: new Date(bookingDate.getTime() + 60 * 60 * 1000),
            totalPrice: randomCourt.pricePerHour,
            status: 'CONFIRMED'
        })
    }

    await prisma.booking.createMany({ data: bookings })

    console.log(`Created ${bookings.length} sample bookings`)
}

main()
    .then(async () => {
        await prisma.$disconnect()
    })
    .catch(async (e) => {
        console.error(e)
        await prisma.$disconnect()
        process.exit(1)
    })
