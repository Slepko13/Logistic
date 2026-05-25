import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import * as dotenv from 'dotenv';
dotenv.config();

const dbUser = process.env.DB_USER || 'logistic';
const dbPassword = process.env.DB_PASSWORD || 'logistic';
const dbHost = process.env.DB_HOST === 'db' ? 'localhost' : process.env.DB_HOST || 'localhost';
const dbPort = process.env.DB_PORT || '5432';
const dbName = process.env.DB_NAME || 'logistic';

const databaseUrl =
  process.env.DATABASE_URL ||
  `postgresql://${dbUser}:${dbPassword}@${dbHost}:${dbPort}/${dbName}?schema=public`;

const pool = new Pool({ connectionString: databaseUrl });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('Seeding 6 default vehicles and trips...');

  for (let i = 1; i <= 6; i++) {
    const vehicleName = `Sprinter ${i}`;

    // Check if vehicle already exists
    let vehicle = await prisma.vehicle.findFirst({
      where: { name: vehicleName },
    });

    if (!vehicle) {
      vehicle = await prisma.vehicle.create({
        data: {
          name: vehicleName,
          plate_number: `AA${String(i).padStart(4, '0')}XX`,
        },
      });
      console.log(`Created Vehicle: ${vehicle.name}`);
    }

    // Check if active trip exists for this vehicle
    const activeTrip = await prisma.trip.findFirst({
      where: {
        vehicle_id: vehicle.id,
        status: 'active',
      },
    });

    if (!activeTrip) {
      const trip = await prisma.trip.create({
        data: {
          vehicle_id: vehicle.id,
          status: 'active',
        },
      });
      console.log(`Created Active Trip (ID: ${trip.id}) for Vehicle: ${vehicle.name}`);

      // Create 7 empty seats for this trip
      for (let s = 1; s <= 7; s++) {
        await prisma.tripSeat.create({
          data: {
            trip_id: trip.id,
            seat_number: s,
          },
        });
      }
      console.log(`Created 7 empty seats for Trip ${trip.id}`);
    }
  }

  console.log('Seeding completed successfully.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
