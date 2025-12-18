const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Starting robust seeding...');

    // 1. Clean Database (Optional but recommended for clean slate)
    // Be careful if you want to keep data, but for a presentation seed, cleaning is usually best.
    await prisma.booking.deleteMany();
    await prisma.schedule.deleteMany();
    await prisma.court.deleteMany();
    await prisma.venue.deleteMany();
    await prisma.paymentAttempt.deleteMany();
    await prisma.user.deleteMany();

    console.log('🧹 Database cleaned.');

    // 2. Create Users
    const password = await bcrypt.hash('123456', 10);

    // Pro Owner
    const owner = await prisma.user.create({
        data: {
            email: 'demo@tupichanga.com',
            name: 'Admin TuPichanga',
            password,
            role: 'OWNER',
            plan: 'PRO',
            subscriptionStatus: 'ACTIVE',
            image: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80',
        },
    });

    // Generic Client (to make bookings)
    const client = await prisma.user.create({
        data: {
            email: 'cliente@demo.com',
            name: 'Cliente Frecuente',
            password,
            role: 'CLIENT',
        },
    });

    console.log(`👤 Created Owner: ${owner.email} & Client: ${client.email}`);

    // 3. Create Venues
    const venuesData = [
        {
            name: 'Complejo Deportivo "El Golazo"',
            city: 'Lima',
            district: 'Miraflores',
            address: 'Av. El Ejército 123',
            description: 'El mejor grass sintético de Miraflores. Estacionamiento privado.',
            imageUrl: 'https://images.unsplash.com/photo-1529900748604-07564a03e7a6?auto=format&fit=crop&q=80',
        },
        {
            name: 'Soccer Plaza San Isidro',
            city: 'Lima',
            district: 'San Isidro',
            address: 'Ca. Los Laureles 456',
            description: 'Canchas techadas y camerinos de lujo.',
            imageUrl: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&q=80',
        },
        {
            name: 'Centro Deportivo Norte',
            city: 'Lima',
            district: 'Los Olivos',
            address: 'Av. Antúnez de Mayolo 789',
            description: 'Abierto las 24 horas. Seguridad garantizada.',
            imageUrl: 'https://images.unsplash.com/photo-1552667466-07770ae110d0?auto=format&fit=crop&q=80',
        },
    ];

    const venues = [];
    for (const v of venuesData) {
        const venue = await prisma.venue.create({
            data: {
                ...v,
                ownerId: owner.id,
            },
        });
        venues.push(venue);

        // Create Courts for this Venue
        await prisma.court.createMany({
            data: [
                { name: 'Cancha 1 (F5)', sport: 'Fútbol', type: 'Sintética', pricePerHour: 80, venueId: venue.id },
                { name: 'Cancha 2 (F7)', sport: 'Fútbol', type: 'Sintética', pricePerHour: 120, venueId: venue.id },
            ],
        });
    }

    // Refetch courts to get IDs
    const allCourts = await prisma.court.findMany();
    console.log(`🏟️ Created ${venues.length} Venues and ${allCourts.length} Courts.`);

    // 4. Generate Bookings
    const bookingsData = [];

    // Helper: Random int between min and max
    const randomInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;

    // A. Past Bookings (Last 30 days) - Status: COMPLETED
    // We want bars in the chart, so let's cluster them a bit or make them random.
    for (let i = 0; i < 50; i++) {
        const daysAgo = randomInt(1, 30);
        const bookingDate = new Date();
        bookingDate.setDate(bookingDate.getDate() - daysAgo);

        // Random hour between 6pm and 11pm (18 - 23)
        const hour = randomInt(18, 23);
        bookingDate.setHours(hour, 0, 0, 0);

        const end = new Date(bookingDate);
        end.setHours(hour + 1);

        const randomCourt = allCourts[Math.floor(Math.random() * allCourts.length)];

        bookingsData.push({
            userId: client.id,
            courtId: randomCourt.id,
            startTime: bookingDate,
            endTime: end,
            totalPrice: randomCourt.pricePerHour,
            status: 'COMPLETED',
        });
    }

    // B. Future Bookings (Next 7 days) - Status: CONFIRMED
    for (let i = 0; i < 5; i++) {
        const daysAhead = randomInt(1, 7);
        const bookingDate = new Date();
        bookingDate.setDate(bookingDate.getDate() + daysAhead);

        // Random hour
        const hour = randomInt(16, 22);
        bookingDate.setHours(hour, 0, 0, 0);

        const end = new Date(bookingDate);
        end.setHours(hour + 1);

        const randomCourt = allCourts[Math.floor(Math.random() * allCourts.length)];

        bookingsData.push({
            userId: client.id,
            courtId: randomCourt.id,
            startTime: bookingDate,
            endTime: end,
            totalPrice: randomCourt.pricePerHour,
            status: 'CONFIRMED',
        });
    }

    await prisma.booking.createMany({
        data: bookingsData,
    });

    console.log(`📅 Generated ${bookingsData.length} Bookings (50 Past, 5 Future).`);
    console.log('✅ Seed executed successfully!');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
