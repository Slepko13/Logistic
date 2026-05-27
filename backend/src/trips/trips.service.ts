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

  async update(id: number, updateTripDto: UpdateTripDto) {
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

  async addDriver(tripId: number, addDriverDto: AddDriverDto) {
    await this.findOne(tripId);

    // Verify user exists and is a driver
    const user = await this.prisma.user.findUnique({
      where: { id: addDriverDto.userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.role !== 'driver' && user.role !== 'admin') {
      throw new BadRequestException('User is not a driver');
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

    return this.prisma.tripDriver.create({
      data: {
        trip_id: tripId,
        user_id: addDriverDto.userId,
      },
    });
  }

  async removeDriver(tripId: number, userId: number) {
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

    return this.prisma.tripDriver.delete({
      where: {
        trip_id_user_id: {
          trip_id: tripId,
          user_id: userId,
        },
      },
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

      return tx.tripSeat.update({
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

    return this.prisma.tripParcel.create({
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

      return tx.tripParcel.update({
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
    });
  }

  async removeParcel(tripId: number, parcelId: number, version?: number) {
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

      return tx.tripParcel.delete({
        where: { id: parcelId },
      });
    });
  }

  // --- TRIP COMPLETION ---

  async completeTrip(tripId: number, version?: number) {
    return this.prisma.$transaction(async (tx) => {
      const trip = await tx.trip.findUnique({ where: { id: tripId } });
      if (!trip) throw new NotFoundException('Trip not found');

      if (version !== undefined && trip.version !== version) {
        throw new ConflictException(
          'Дані були змінені іншим користувачем. Будь ласка, оновіть сторінку.',
        );
      }

      // 1. Mark current trip as completed
      return tx.trip.update({
        where: { id: tripId },
        data: { status: 'completed', version: { increment: 1 } },
      });
    });
  }

  // --- TRIP CREATION ---

  async createTrip(vehicleId: number) {
    const existingActive = await this.prisma.trip.findFirst({
      where: { vehicle_id: vehicleId, status: 'active' },
    });
    if (existingActive) {
      throw new BadRequestException('Для цього автобуса вже існує активний рейс.');
    }

    const newTrip = await this.prisma.trip.create({
      data: {
        vehicle_id: vehicleId,
        status: 'active',
      },
    });

    const seatsData = Array.from({ length: 7 }).map((_, i) => ({
      trip_id: newTrip.id,
      seat_number: i + 1,
    }));

    await this.prisma.tripSeat.createMany({
      data: seatsData,
    });

    return newTrip;
  }

  // --- TRIP DELETION ---
  async removeTrip(tripId: number) {
    await this.findOne(tripId); // Check if exists
    return this.prisma.trip.delete({
      where: { id: tripId },
    });
  }
}
