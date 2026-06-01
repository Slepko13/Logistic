import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { Prisma } from '@prisma/client';
import { UpdateTripDto } from './dto/update-trip.dto';
import { CreateTripDto } from './dto/create-trip.dto';

@Injectable()
export class TripsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAllActive() {
    return this.prisma.trip.findMany({
      where: { status: 'active' },
      include: {
        vehicle: true,
        drivers: {
          include: {
            user: {
              select: { id: true, first_name: true, last_name: true, phone: true },
            },
          },
        },
        seats: {
          orderBy: { seat_number: 'asc' },
        },
        parcels: {
          orderBy: { parcel_number: 'asc' },
        },
      },
      orderBy: { id: 'asc' },
    });
  }

  async findAllCompleted(query: {
    page?: number;
    limit?: number;
    search?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }) {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 10;
    const skip = (page - 1) * limit;

    const where: Prisma.TripWhereInput = { status: 'completed' };

    if (query.search) {
      // Allow searching by trip ID
      const searchNum = parseInt(query.search, 10);
      where.OR = [
        { departure_city: { contains: query.search, mode: 'insensitive' } },
        { arrival_city: { contains: query.search, mode: 'insensitive' } },
        { vehicle: { name: { contains: query.search, mode: 'insensitive' } } },
        { vehicle: { plate_number: { contains: query.search, mode: 'insensitive' } } },
      ];

      if (!isNaN(searchNum)) {
        where.OR.push({ id: searchNum });
      }
    }

    const orderBy: Prisma.TripOrderByWithRelationInput = {};
    if (query.sortBy) {
      orderBy[query.sortBy as keyof Prisma.TripOrderByWithRelationInput] =
        query.sortOrder || 'desc';
    } else {
      orderBy.id = 'desc'; // default
    }

    const [data, total] = await Promise.all([
      this.prisma.trip.findMany({
        where,
        include: {
          vehicle: true,
          drivers: {
            include: {
              user: {
                select: { id: true, first_name: true, last_name: true, phone: true },
              },
            },
          },
          seats: {
            orderBy: { seat_number: 'asc' },
          },
          parcels: {
            orderBy: { parcel_number: 'asc' },
          },
        },
        orderBy,
        skip,
        take: limit,
      }),
      this.prisma.trip.count({ where }),
    ]);

    return {
      data,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: number) {
    const trip = await this.prisma.trip.findUnique({
      where: { id },
      include: {
        vehicle: true,
        drivers: {
          include: {
            user: {
              select: { id: true, first_name: true, last_name: true, phone: true },
            },
          },
        },
        seats: {
          orderBy: { seat_number: 'asc' },
          include: {
            updated_by: {
              select: { first_name: true, last_name: true },
            },
          },
        },
        parcels: {
          orderBy: { parcel_number: 'asc' },
          include: {
            updated_by: {
              select: { first_name: true, last_name: true },
            },
          },
        },
      },
    });

    if (!trip) {
      throw new NotFoundException('Рейс не знайдено');
    }

    return trip;
  }

  async update(id: number, updateTripDto: UpdateTripDto, updatedById: number) {
    await this.prisma.$transaction(async (tx) => {
      const trip = await tx.trip.findUnique({
        where: { id },
      });

      if (!trip) {
        throw new NotFoundException(`Рейс з ID ${id} не знайдено`);
      }

      if (updateTripDto.version !== undefined && trip.version !== updateTripDto.version) {
        throw new ConflictException(
          'Дані були змінені іншим користувачем. Будь ласка, оновіть сторінку.',
        );
      }

      // Validate dates
      const newDepartureDate = updateTripDto.departure_date
        ? new Date(updateTripDto.departure_date)
        : trip.departure_date;
      const newArrivalDate = updateTripDto.arrival_date
        ? new Date(updateTripDto.arrival_date)
        : trip.arrival_date;

      if (newDepartureDate && newArrivalDate && newDepartureDate > newArrivalDate) {
        throw new BadRequestException('Дата відправлення не може бути пізнішою за дату прибуття');
      }

      await tx.trip.update({
        where: { id },
        data: {
          departure_city:
            updateTripDto.departure_city !== undefined ? updateTripDto.departure_city : undefined,
          departure_date: updateTripDto.departure_date
            ? new Date(updateTripDto.departure_date)
            : undefined,
          arrival_city:
            updateTripDto.arrival_city !== undefined ? updateTripDto.arrival_city : undefined,
          arrival_date: updateTripDto.arrival_date
            ? new Date(updateTripDto.arrival_date)
            : undefined,
          vehicle_id: updateTripDto.vehicle_id !== undefined ? updateTripDto.vehicle_id : undefined,
          version: { increment: 1 },
        },
      });

      await tx.tripHistory.create({
        data: {
          trip_id: id,
          user_id: updatedById,
          action: 'TRIP_UPDATED',
          details: 'Змінено деталі рейсу (міста, дати або автобус)',
          changes: {
            before: {
              departure_city: trip.departure_city,
              departure_date: trip.departure_date,
              arrival_city: trip.arrival_city,
              arrival_date: trip.arrival_date,
              vehicle_id: trip.vehicle_id,
            },
            after: {
              departure_city:
                updateTripDto.departure_city !== undefined
                  ? updateTripDto.departure_city
                  : trip.departure_city,
              departure_date: updateTripDto.departure_date
                ? new Date(updateTripDto.departure_date)
                : trip.departure_date,
              arrival_city:
                updateTripDto.arrival_city !== undefined
                  ? updateTripDto.arrival_city
                  : trip.arrival_city,
              arrival_date: updateTripDto.arrival_date
                ? new Date(updateTripDto.arrival_date)
                : trip.arrival_date,
              vehicle_id:
                updateTripDto.vehicle_id !== undefined ? updateTripDto.vehicle_id : trip.vehicle_id,
            },
          },
        },
      });

      // Handle driver assignments if provided
      if (updateTripDto.driverIds !== undefined) {
        // First, remove existing drivers for this trip
        await tx.tripDriver.deleteMany({
          where: { trip_id: id },
        });

        // Then add new drivers
        if (updateTripDto.driverIds.length > 0) {
          const driversData = updateTripDto.driverIds.map((userId) => ({
            trip_id: id,
            user_id: userId,
          }));
          await tx.tripDriver.createMany({
            data: driversData,
          });
        }
      }
    });

    return this.findOne(id); // Return fully hydrated trip
  }

  // --- TRIP COMPLETION ---

  async completeTrip(tripId: number, updatedById: number, version?: number) {
    return this.prisma.$transaction(async (tx) => {
      const trip = await tx.trip.findUnique({ where: { id: tripId } });
      if (!trip) throw new NotFoundException('Рейс не знайдено');

      if (version !== undefined && trip.version !== version) {
        throw new ConflictException(
          'Дані були змінені іншим користувачем. Будь ласка, оновіть сторінку.',
        );
      }

      // 1. Mark current trip as completed
      const completedTrip = await tx.trip.update({
        where: { id: tripId },
        data: { status: 'completed', version: { increment: 1 } },
      });
      await tx.tripHistory.create({
        data: {
          trip_id: tripId,
          user_id: updatedById,
          action: 'TRIP_COMPLETED',
          details: 'Рейс закрито',
          changes: {
            before: { status: trip.status },
            after: { status: 'completed' },
          },
        },
      });
      return completedTrip;
    });
  }

  // --- TRIP CREATION ---

  async createTrip(createTripDto: CreateTripDto, updatedById: number) {
    const existingActive = await this.prisma.trip.findFirst({
      where: { vehicle_id: createTripDto.vehicle_id, status: 'active' },
    });
    if (existingActive) {
      throw new BadRequestException('Для цього автобуса вже існує активний рейс.');
    }

    return this.prisma.$transaction(async (tx) => {
      const newTrip = await tx.trip.create({
        data: {
          vehicle_id: createTripDto.vehicle_id,
          status: 'active',
        },
      });

      const seatsCount = createTripDto.seatsCount || 7;
      const seatsData = Array.from({ length: seatsCount }).map((_, i) => ({
        trip_id: newTrip.id,
        seat_number: i + 1,
      }));

      await tx.tripSeat.createMany({
        data: seatsData,
      });

      await tx.tripHistory.create({
        data: {
          trip_id: newTrip.id,
          user_id: updatedById,
          action: 'TRIP_CREATED',
          details: `Створено новий рейс (${seatsCount} місць)`,
          changes: {
            after: {
              vehicle_id: createTripDto.vehicle_id,
              status: 'active',
              seats_count: seatsCount,
            },
          },
        },
      });

      return newTrip;
    });
  }

  // --- TRIP DELETION ---
  async removeTrip(tripId: number) {
    await this.findOne(tripId); // Check if exists
    return this.prisma.trip.delete({
      where: { id: tripId },
    });
  }
}
