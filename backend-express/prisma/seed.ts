import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  // 1. Setup Admin
  const adminPhone = process.env.INITIAL_ADMIN_PHONE || '+380503733160';
  const adminPassword = process.env.INITIAL_ADMIN_PASSWORD || '123456';

  let admin = await prisma.user.findUnique({
    where: { phone: adminPhone },
  });

  if (!admin) {
    const hashedPassword = await bcrypt.hash(adminPassword, 10);
    admin = await prisma.user.create({
      data: {
        phone: adminPhone,
        password_hash: hashedPassword,
        first_name: 'Admin',
        last_name: 'System',
        role: 'admin',
      },
    });
    console.log(`👤 Created admin user with phone ${adminPhone}`);
  } else {
    console.log(`👤 Admin user already exists (phone: ${adminPhone})`);
  }

  // 2. Clear old test data (excluding users, but removing trips, vehicles, cities)
  console.log('🧹 Clearing old test data (trips, vehicles, cities)...');
  await prisma.trip.deleteMany({});
  await prisma.vehicle.deleteMany({});
  await prisma.city.deleteMany({});

  // 3. Seed Cities
  console.log('🏙️ Seeding cities...');
  const cityNames = ['Київ', 'Львів', 'Івано-Франківськ', 'Чернівці', 'Хмельницький', 'Тернопіль'];
  const cities = [];
  for (const name of cityNames) {
    const city = await prisma.city.create({
      data: { name },
    });
    cities.push(city);
  }
  console.log(`🏙️ Seeded ${cities.length} cities`);

  // 4. Seed Vehicles (8 Mercedes Sprinters)
  console.log('🚐 Seeding vehicles (Mercedes Sprinter fleet)...');
  const vehicleData = [
    { name: 'Sprinter 1', plate_number: 'KA 1001 BB' },
    { name: 'Sprinter 2', plate_number: 'KA 1002 BB' },
    { name: 'Sprinter 3', plate_number: 'KA 1003 BB' },
    { name: 'Sprinter 4', plate_number: 'KA 1004 BB' },
    { name: 'Sprinter 5', plate_number: 'KA 1005 BB' },
    { name: 'Sprinter 6', plate_number: 'KA 1006 BB' },
    { name: 'Sprinter 7', plate_number: 'KA 1007 BB' },
    { name: 'Sprinter 8', plate_number: 'KA 1008 BB' },
  ];
  const vehicles = [];
  for (const data of vehicleData) {
    const vehicle = await prisma.vehicle.create({
      data,
    });
    vehicles.push(vehicle);
  }
  console.log(`🚐 Seeded ${vehicles.length} vehicles`);

  // 5. Seed Mock Active Trips
  console.log('🗺️ Seeding mock active trips...');

  // Trip 1: Kyiv -> Lviv (Sprinter 1)
  const departureDate1 = new Date();
  departureDate1.setDate(departureDate1.getDate() + 1); // tomorrow
  departureDate1.setHours(8, 0, 0, 0);

  const arrivalDate1 = new Date(departureDate1);
  arrivalDate1.setHours(arrivalDate1.getHours() + 7); // 7 hours later

  const trip1 = await prisma.trip.create({
    data: {
      vehicle_id: vehicles[0].id,
      departure_city: 'Київ',
      arrival_city: 'Львів',
      departure_date: departureDate1,
      arrival_date: arrivalDate1,
      status: 'active',
      version: 1,
    },
  });

  // Assign Admin as driver for Trip 1
  await prisma.tripDriver.create({
    data: {
      trip_id: trip1.id,
      user_id: admin.id,
    },
  });

  // Create 7 seats for Trip 1 (some occupied)
  const passengers1 = [
    {
      seat_number: 1,
      first_name: 'Микола',
      last_name: 'Коваленко',
      phone: '+380671112233',
      boarding_address: 'Київ, М. Житомирська',
      baggage_info: [{ count: 1, weight: 15 }],
    },
    {
      seat_number: 2,
      first_name: null,
      last_name: null,
      phone: null,
      boarding_address: null,
      baggage_info: null,
    },
    {
      seat_number: 3,
      first_name: 'Олена',
      last_name: 'Петренко',
      phone: '+380504445566',
      boarding_address: 'Київ, ЖД Вокзал',
      baggage_info: [{ count: 2, weight: 25 }],
    },
    {
      seat_number: 4,
      first_name: null,
      last_name: null,
      phone: null,
      boarding_address: null,
      baggage_info: null,
    },
    {
      seat_number: 5,
      first_name: 'Андрій',
      last_name: 'Шевченко',
      phone: '+380937778899',
      boarding_address: 'Київ, М. Академмістечко',
      baggage_info: null,
    },
    {
      seat_number: 6,
      first_name: null,
      last_name: null,
      phone: null,
      boarding_address: null,
      baggage_info: null,
    },
    {
      seat_number: 7,
      first_name: null,
      last_name: null,
      phone: null,
      boarding_address: null,
      baggage_info: null,
    },
  ];

  for (const seat of passengers1) {
    await prisma.tripSeat.create({
      data: {
        trip_id: trip1.id,
        seat_number: seat.seat_number,
        first_name: seat.first_name,
        last_name: seat.last_name,
        phone: seat.phone,
        boarding_address: seat.boarding_address,
        baggage_info: seat.baggage_info ? JSON.parse(JSON.stringify(seat.baggage_info)) : undefined,
        updated_by_id: admin.id,
        version: 1,
      },
    });
  }

  // Add parcels for Trip 1
  await prisma.tripParcel.createMany({
    data: [
      {
        trip_id: trip1.id,
        first_name: 'Сергій',
        last_name: 'Бондар',
        phone: '+380631234567',
        weight: 6.5,
        description: 'Коробка з деталями (крихке)',
        delivery_address: 'Львів, Нова Пошта №4',
        is_delivered: false,
        updated_by_id: admin.id,
        version: 1,
      },
      {
        trip_id: trip1.id,
        first_name: 'Тетяна',
        last_name: 'Лисенко',
        phone: '+380509876543',
        weight: 12.0,
        description: 'Валіза з одягом (синя)',
        delivery_address: 'Львів, вул. Зелена 15',
        is_delivered: true,
        updated_by_id: admin.id,
        version: 1,
      },
    ],
  });

  // Trip 2: Ivano-Frankivsk -> Kyiv (Sprinter 2)
  const departureDate2 = new Date();
  departureDate2.setDate(departureDate2.getDate() + 2); // in 2 days
  departureDate2.setHours(10, 30, 0, 0);

  const arrivalDate2 = new Date(departureDate2);
  arrivalDate2.setHours(arrivalDate2.getHours() + 9); // 9 hours later

  const trip2 = await prisma.trip.create({
    data: {
      vehicle_id: vehicles[1].id,
      departure_city: 'Івано-Франківськ',
      arrival_city: 'Київ',
      departure_date: departureDate2,
      arrival_date: arrivalDate2,
      status: 'active',
      version: 1,
    },
  });

  // Assign Admin as driver for Trip 2
  await prisma.tripDriver.create({
    data: {
      trip_id: trip2.id,
      user_id: admin.id,
    },
  });

  // Create 7 seats for Trip 2
  const passengers2 = [
    {
      seat_number: 1,
      first_name: null,
      last_name: null,
      phone: null,
      boarding_address: null,
      baggage_info: null,
    },
    {
      seat_number: 2,
      first_name: 'Дмитро',
      last_name: 'Сидоренко',
      phone: '+380678889900',
      boarding_address: 'Івано-Франківськ, автовокзал',
      baggage_info: [{ count: 1, weight: 10 }],
    },
    {
      seat_number: 3,
      first_name: null,
      last_name: null,
      phone: null,
      boarding_address: null,
      baggage_info: null,
    },
    {
      seat_number: 4,
      first_name: 'Юлія',
      last_name: 'Клименко',
      phone: '+380931115599',
      boarding_address: 'Калуш, центр',
      baggage_info: null,
    },
    {
      seat_number: 5,
      first_name: null,
      last_name: null,
      phone: null,
      boarding_address: null,
      baggage_info: null,
    },
    {
      seat_number: 6,
      first_name: null,
      last_name: null,
      phone: null,
      boarding_address: null,
      baggage_info: null,
    },
    {
      seat_number: 7,
      first_name: null,
      last_name: null,
      phone: null,
      boarding_address: null,
      baggage_info: null,
    },
  ];

  for (const seat of passengers2) {
    await prisma.tripSeat.create({
      data: {
        trip_id: trip2.id,
        seat_number: seat.seat_number,
        first_name: seat.first_name,
        last_name: seat.last_name,
        phone: seat.phone,
        boarding_address: seat.boarding_address,
        baggage_info: seat.baggage_info ? JSON.parse(JSON.stringify(seat.baggage_info)) : undefined,
        updated_by_id: admin.id,
        version: 1,
      },
    });
  }

  // Add parcels for Trip 2
  await prisma.tripParcel.create({
    data: {
      trip_id: trip2.id,
      first_name: 'Олександр',
      last_name: 'Кравчук',
      phone: '+380975554433',
      weight: 3.0,
      description: 'Документи в конверті',
      delivery_address: 'Київ, М. Вокзальна',
      is_delivered: false,
      updated_by_id: admin.id,
      version: 1,
    },
  });

  // Create empty active trips for the remaining Sprinters to populate the dashboard cards
  for (let i = 2; i < 8; i++) {
    const emptyTrip = await prisma.trip.create({
      data: {
        vehicle_id: vehicles[i].id,
        status: 'active',
        version: 1,
      },
    });

    // Create 7 empty seats for this trip
    const emptySeats = Array.from({ length: 7 }).map((_, idx) => ({
      trip_id: emptyTrip.id,
      seat_number: idx + 1,
    }));

    await prisma.tripSeat.createMany({
      data: emptySeats,
    });
  }

  console.log('🎉 Database seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
