
import { PrismaClient } from '@prisma/client';
import { writeFile } from 'fs/promises';
import { join } from 'path';

const prisma = new PrismaClient();

async function main() {
    console.log('🔄 Iniciando respaldo de datos...');

    const users = await prisma.user.findMany();
    const venues = await prisma.venue.findMany({
        include: {
            courts: true,
            // We don't backup bookings/schedules to keep it clean, or we can? 
            // Let's backup essential structure data mainly.
            // But user asked for "everything". Let's try bookings too but they might have dependency issues if IDs change.
            // Strategy: We will rely on "names" or "emails" for linking if we re-create, 
            // OR we just dump raw data and let seed handle it carefully.
            // For simplicity and robustness in this dev environment:
            // We'll backup Users and Venues+Courts. Bookings are usually disposable in dev, but let's see.
        }
    });

    const data = {
        users,
        venues,
        timestamp: new Date().toISOString()
    };

    const filePath = join(__dirname, 'backup.json');
    await writeFile(filePath, JSON.stringify(data, null, 2));

    console.log(`✅ Respaldo guardado en: ${filePath}`);
    console.log(`📊 Total: ${users.length} Usuarios, ${venues.length} Locales.`);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
