import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { Prisma } from '@prisma/client';
import { UpdateTripDto } from './dto/update-trip.dto';
import { AddDriverDto } from './dto/add-driver.dto';
import { UpdateSeatDto } from './dto/update-seat.dto';
import { CreateParcelDto } from './dto/create-parcel.dto';
import { UpdateParcelDto } from './dto/update-parcel.dto';

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
      throw new NotFoundException('Trip not found');
    }

    return trip;
  }

  async update(id: number, updateTripDto: UpdateTripDto, updatedById: number) {
    await this.prisma.$transaction(async (tx) => {
      const trip = await tx.trip.findUnique({
        where: { id },
      });

      if (!trip) {
        throw new NotFoundException(`Trip with ID ${id} not found`);
      }

      if (updateTripDto.version !== undefined && trip.version !== updateTripDto.version) {
        throw new ConflictException(
          'Дані були змінені іншим користувачем. Будь ласка, оновіть сторінку.',
        );
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
    });

    // Handle driver assignments if provided
    if (updateTripDto.driverIds !== undefined) {
      // First, remove existing drivers for this trip
      await this.prisma.tripDriver.deleteMany({
        where: { trip_id: id },
      });

      // Then add new drivers
      if (updateTripDto.driverIds.length > 0) {
        const driversData = updateTripDto.driverIds.map((userId) => ({
          trip_id: id,
          user_id: userId,
        }));
        await this.prisma.tripDriver.createMany({
          data: driversData,
        });
      }
    }

    return this.findOne(id); // Return fully hydrated trip
  }

  async addDriver(tripId: number, addDriverDto: AddDriverDto, updatedById: number) {
    await this.findOne(tripId);

    // Verify user exists and is a driver
    const user = await this.prisma.user.findUnique({
      where: { id: addDriverDto.userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (!user.is_driver) {
      throw new BadRequestException('Користувач не є водієм');
    }

    // Check if already added
    const existing = await this.prisma.tripDriver.findUnique({
      where: {
        trip_id_user_id: {
          trip_id: tripId,
          user_id: addDriverDto.userId,
        },
      },
    });

    if (existing) {
      return existing; // already there
    }

    return this.prisma.$transaction(async (tx) => {
      const driver = await tx.tripDriver.create({
        data: {
          trip_id: tripId,
          user_id: addDriverDto.userId,
        },
      });
      await tx.tripHistory.create({
        data: {
          trip_id: tripId,
          user_id: updatedById,
          action: 'DRIVER_ADDED',
          details: `Додано водія: ${user.first_name} ${user.last_name}`,
          changes: {
            after: { driver: `${user.first_name} ${user.last_name}` },
          },
        },
      });
      return driver;
    });
  }

  async removeDriver(tripId: number, userId: number, updatedById: number) {
    const existing = await this.prisma.tripDriver.findUnique({
      where: {
        trip_id_user_id: {
          trip_id: tripId,
          user_id: userId,
        },
      },
    });

    if (!existing) {
      throw new NotFoundException('Driver not found on this trip');
    }

    return this.prisma.$transaction(async (tx) => {
      await tx.tripDriver.delete({
        where: {
          trip_id_user_id: {
            trip_id: tripId,
            user_id: userId,
          },
        },
      });
      const user = await tx.user.findUnique({ where: { id: userId } });
      const driverName = user ? `${user.first_name} ${user.last_name}` : `ID: ${userId}`;

      await tx.tripHistory.create({
        data: {
          trip_id: tripId,
          user_id: updatedById,
          action: 'DRIVER_REMOVED',
          details: `Видалено водія: ${driverName}`,
          changes: {
            before: { driver: driverName },
          },
        },
      });
      return { success: true };
    });
  }

  // --- SEATS ---

  async addSeat(tripId: number) {
    await this.findOne(tripId);

    // Find highest seat number for this trip
    const maxSeat = await this.prisma.tripSeat.aggregate({
      where: { trip_id: tripId },
      _max: { seat_number: true },
    });

    const nextSeatNumber = (maxSeat._max.seat_number || 0) + 1;

    return this.prisma.tripSeat.create({
      data: {
        trip_id: tripId,
        seat_number: nextSeatNumber,
      },
    });
  }

  async removeSeat(tripId: number, seatNumber: number, version?: number) {
    await this.findOne(tripId);

    return this.prisma.$transaction(async (tx) => {
      const seat = await tx.tripSeat.findUnique({
        where: {
          trip_id_seat_number: {
            trip_id: tripId,
            seat_number: seatNumber,
          },
        },
      });

      if (!seat) {
        throw new NotFoundException('Seat not found');
      }

      if (version !== undefined && seat.version !== version) {
        throw new ConflictException(
          'Дані були змінені іншим користувачем. Будь ласка, оновіть сторінку.',
        );
      }

      return tx.tripSeat.delete({
        where: { id: seat.id },
      });
    });
  }

  async updateSeat(tripId: number, seatNumber: number, dto: UpdateSeatDto, updatedById: number) {
    await this.findOne(tripId);

    return this.prisma.$transaction(async (tx) => {
      const seat = await tx.tripSeat.findUnique({
        where: {
          trip_id_seat_number: {
            trip_id: tripId,
            seat_number: seatNumber,
          },
        },
      });

      if (!seat) {
        throw new NotFoundException('Seat not found');
      }

      if (dto.version !== undefined && seat.version !== dto.version) {
        throw new ConflictException(
          'Дані були змінені іншим користувачем. Будь ласка, оновіть сторінку.',
        );
      }

      const updatedSeat = await tx.tripSeat.update({
        where: { id: seat.id },
        data: {
          first_name: dto.first_name,
          last_name: dto.last_name,
          phone: dto.phone,
          baggage_info: dto.baggage_info
            ? (dto.baggage_info as unknown as import('@prisma/client').Prisma.InputJsonValue)
            : undefined,
          boarding_address: dto.boarding_address,
          updated_by_id: updatedById,
          version: { increment: 1 },
        },
      });

      await tx.tripHistory.create({
        data: {
          trip_id: tripId,
          user_id: updatedById,
          action: 'SEAT_UPDATED',
          details: `Оновлено місце ${seatNumber} (Пасажир: ${dto.first_name || ''} ${dto.last_name || ''})`,
          changes: {
            before: {
              first_name: seat.first_name,
              last_name: seat.last_name,
              phone: seat.phone,
              boarding_address: seat.boarding_address,
              baggage_info: seat.baggage_info,
            },
            after: {
              first_name: dto.first_name !== undefined ? dto.first_name : seat.first_name,
              last_name: dto.last_name !== undefined ? dto.last_name : seat.last_name,
              phone: dto.phone !== undefined ? dto.phone : seat.phone,
              boarding_address:
                dto.boarding_address !== undefined ? dto.boarding_address : seat.boarding_address,
              baggage_info: (dto.baggage_info !== undefined
                ? dto.baggage_info
                : seat.baggage_info) as unknown as Prisma.InputJsonValue,
            },
          },
        },
      });

      return updatedSeat;
    });
  }

  // --- PARCELS ---

  async getTripParcels(
    tripId: number,
    query: {
      page?: number;
      limit?: number;
      search?: string;
      status?: string;
      sortBy?: string;
      sortOrder?: 'asc' | 'desc';
    },
  ) {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 10;
    const skip = (page - 1) * limit;

    const where: Prisma.TripParcelWhereInput = { trip_id: tripId };

    if (query.status === 'delivered') {
      where.is_delivered = true;
    } else if (query.status === 'pending') {
      where.is_delivered = false;
    }

    if (query.search) {
      const searchNum = parseInt(query.search, 10);
      where.OR = [
        { first_name: { contains: query.search, mode: 'insensitive' } },
        { last_name: { contains: query.search, mode: 'insensitive' } },
        { phone: { contains: query.search, mode: 'insensitive' } },
      ];
      if (!isNaN(searchNum)) {
        where.OR.push({ parcel_number: { equals: searchNum } });
      }
    }

    let orderBy:
      | Prisma.TripParcelOrderByWithRelationInput
      | Prisma.TripParcelOrderByWithRelationInput[] = { parcel_number: 'asc' };
    const sortOrder = query.sortOrder === 'desc' ? 'desc' : 'asc';

    if (query.sortBy === 'sender') {
      orderBy = [{ last_name: sortOrder }, { first_name: sortOrder }];
    } else if (query.sortBy === 'phone') {
      orderBy = { phone: sortOrder };
    } else if (query.sortBy === 'status') {
      orderBy = { is_delivered: sortOrder };
    }

    const [data, total] = await Promise.all([
      this.prisma.tripParcel.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        include: {
          updated_by: {
            select: { first_name: true, last_name: true },
          },
        },
      }),
      this.prisma.tripParcel.count({ where }),
    ]);

    return {
      data,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  async addParcel(tripId: number, dto: CreateParcelDto, updatedById: number) {
    await this.findOne(tripId);

    return this.prisma.$transaction(async (tx) => {
      const parcel = await tx.tripParcel.create({
        data: {
          trip_id: tripId,
          first_name: dto.first_name,
          last_name: dto.last_name,
          phone: dto.phone,
          weight: dto.weight,
          description: dto.description,
          delivery_address: dto.delivery_address,
          updated_by_id: updatedById,
        },
      });

      await tx.tripHistory.create({
        data: {
          trip_id: tripId,
          user_id: updatedById,
          action: 'PARCEL_ADDED',
          details: `Додано посилку №${parcel.parcel_number} (Відправник: ${dto.first_name} ${dto.last_name})`,
          changes: {
            after: {
              first_name: dto.first_name,
              last_name: dto.last_name,
              phone: dto.phone,
              weight: dto.weight,
              description: dto.description,
              delivery_address: dto.delivery_address,
            },
          },
        },
      });
      return parcel;
    });
  }

  async updateParcel(tripId: number, parcelId: number, dto: UpdateParcelDto, updatedById: number) {
    return this.prisma.$transaction(async (tx) => {
      const parcel = await tx.tripParcel.findUnique({
        where: { id: parcelId },
      });

      if (!parcel || parcel.trip_id !== tripId) {
        throw new NotFoundException('Parcel not found');
      }

      if (dto.version !== undefined && parcel.version !== dto.version) {
        throw new ConflictException(
          'Дані були змінені іншим користувачем. Будь ласка, оновіть сторінку.',
        );
      }

      const updatedParcel = await tx.tripParcel.update({
        where: { id: parcelId },
        data: {
          first_name: dto.first_name,
          last_name: dto.last_name,
          phone: dto.phone,
          weight: dto.weight,
          description: dto.description,
          delivery_address: dto.delivery_address,
          is_delivered: dto.is_delivered,
          updated_by_id: updatedById,
          version: { increment: 1 },
        },
      });

      await tx.tripHistory.create({
        data: {
          trip_id: tripId,
          user_id: updatedById,
          action: 'PARCEL_UPDATED',
          details: `Оновлено посилку №${parcel.parcel_number}`,
          changes: {
            before: {
              first_name: parcel.first_name,
              last_name: parcel.last_name,
              phone: parcel.phone,
              weight: parcel.weight,
              description: parcel.description,
              delivery_address: parcel.delivery_address,
              is_delivered: parcel.is_delivered,
            },
            after: {
              first_name: dto.first_name !== undefined ? dto.first_name : parcel.first_name,
              last_name: dto.last_name !== undefined ? dto.last_name : parcel.last_name,
              phone: dto.phone !== undefined ? dto.phone : parcel.phone,
              weight: dto.weight !== undefined ? dto.weight : parcel.weight,
              description: dto.description !== undefined ? dto.description : parcel.description,
              delivery_address:
                dto.delivery_address !== undefined ? dto.delivery_address : parcel.delivery_address,
              is_delivered: dto.is_delivered !== undefined ? dto.is_delivered : parcel.is_delivered,
            },
          },
        },
      });

      return updatedParcel;
    });
  }

  async removeParcel(tripId: number, parcelId: number, updatedById: number, version?: number) {
    return this.prisma.$transaction(async (tx) => {
      const parcel = await tx.tripParcel.findUnique({
        where: { id: parcelId },
      });

      if (!parcel || parcel.trip_id !== tripId) {
        throw new NotFoundException('Parcel not found');
      }

      if (version !== undefined && parcel.version !== version) {
        throw new ConflictException(
          'Дані були змінені іншим користувачем. Будь ласка, оновіть сторінку.',
        );
      }

      await tx.tripParcel.delete({
        where: { id: parcelId },
      });
      await tx.tripHistory.create({
        data: {
          trip_id: tripId,
          user_id: updatedById,
          action: 'PARCEL_REMOVED',
          details: `Видалено посилку №${parcel.parcel_number}`,
          changes: {
            before: {
              first_name: parcel.first_name,
              last_name: parcel.last_name,
              phone: parcel.phone,
              weight: parcel.weight,
              description: parcel.description,
              delivery_address: parcel.delivery_address,
              is_delivered: parcel.is_delivered,
            },
          },
        },
      });
      return { success: true };
    });
  }

  // --- TRIP COMPLETION ---

  async completeTrip(tripId: number, updatedById: number, version?: number) {
    return this.prisma.$transaction(async (tx) => {
      const trip = await tx.trip.findUnique({ where: { id: tripId } });
      if (!trip) throw new NotFoundException('Trip not found');

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

  async createTrip(vehicleId: number, updatedById: number) {
    const existingActive = await this.prisma.trip.findFirst({
      where: { vehicle_id: vehicleId, status: 'active' },
    });
    if (existingActive) {
      throw new BadRequestException('Для цього автобуса вже існує активний рейс.');
    }

    return this.prisma.$transaction(async (tx) => {
      const newTrip = await tx.trip.create({
        data: {
          vehicle_id: vehicleId,
          status: 'active',
        },
      });

      const seatsData = Array.from({ length: 7 }).map((_, i) => ({
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
          details: 'Створено новий рейс',
          changes: {
            after: {
              vehicle_id: vehicleId,
              status: 'active',
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

  async getTripHistory(
    tripId: number,
    query?: {
      page?: number;
      limit?: number;
      search?: string;
      filterAction?: string;
      sortBy?: string;
      sortOrder?: 'asc' | 'desc';
    },
  ) {
    const page = query?.page || 1;
    const limit = query?.limit || 10;
    const skip = (page - 1) * limit;

    const where: Prisma.TripHistoryWhereInput = {
      trip_id: tripId,
    };

    if (query?.filterAction) {
      if (query.filterAction === 'trip') {
        where.action = { startsWith: 'TRIP_' };
      } else if (query.filterAction === 'parcel') {
        where.action = { startsWith: 'PARCEL_' };
      } else if (query.filterAction === 'seat') {
        where.action = { startsWith: 'SEAT_' };
      } else if (query.filterAction === 'driver') {
        where.action = { startsWith: 'DRIVER_' };
      } else {
        where.action = query.filterAction;
      }
    }

    if (query?.search) {
      where.OR = [
        { details: { contains: query.search, mode: 'insensitive' } },
        { action: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    let orderBy: Prisma.TripHistoryOrderByWithRelationInput = { created_at: 'desc' };
    if (query?.sortBy) {
      orderBy = {
        [query.sortBy]: query.sortOrder || 'desc',
      };
    }

    const [data, total] = await Promise.all([
      this.prisma.tripHistory.findMany({
        where,
        include: {
          user: {
            select: { id: true, first_name: true, last_name: true, role: true },
          },
        },
        orderBy,
        skip,
        take: limit,
      }),
      this.prisma.tripHistory.count({ where }),
    ]);

    return {
      data,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }
}
