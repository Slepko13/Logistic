import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
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

  async findAllCompleted() {
    return this.prisma.trip.findMany({
      where: { status: 'completed' },
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
      orderBy: { id: 'desc' },
    });
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
    const trip = await this.findOne(id);

    // Update trip details
    await this.prisma.trip.update({
      where: { id: trip.id },
      data: {
        departure_city:
          updateTripDto.departure_city !== undefined ? updateTripDto.departure_city : undefined,
        departure_date: updateTripDto.departure_date
          ? new Date(updateTripDto.departure_date)
          : undefined,
        arrival_city:
          updateTripDto.arrival_city !== undefined ? updateTripDto.arrival_city : undefined,
        arrival_date: updateTripDto.arrival_date ? new Date(updateTripDto.arrival_date) : undefined,
        vehicle_id: updateTripDto.vehicle_id !== undefined ? updateTripDto.vehicle_id : undefined,
      },
    });

    // Handle driver assignments if provided
    if (updateTripDto.driverIds !== undefined) {
      // First, remove existing drivers for this trip
      await this.prisma.tripDriver.deleteMany({
        where: { trip_id: trip.id },
      });

      // Then add new drivers
      if (updateTripDto.driverIds.length > 0) {
        const driversData = updateTripDto.driverIds.map((userId) => ({
          trip_id: trip.id,
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

  async removeSeat(tripId: number, seatNumber: number) {
    await this.findOne(tripId);

    const seat = await this.prisma.tripSeat.findUnique({
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

    return this.prisma.tripSeat.delete({
      where: { id: seat.id },
    });
  }

  async updateSeat(tripId: number, seatNumber: number, dto: UpdateSeatDto, updatedById: number) {
    await this.findOne(tripId);

    // Seat must exist since we created 7 empty seats
    const seat = await this.prisma.tripSeat.findUnique({
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

    return this.prisma.tripSeat.update({
      where: { id: seat.id },
      data: {
        first_name: dto.first_name,
        last_name: dto.last_name,
        phone: dto.phone,
        baggage_info: dto.baggage_info
          ? (dto.baggage_info as unknown as import('@prisma/client').Prisma.InputJsonValue)
          : undefined,
        updated_by_id: updatedById,
      },
    });
  }

  // --- PARCELS ---

  async addParcel(tripId: number, dto: CreateParcelDto, updatedById: number) {
    await this.findOne(tripId);

    return this.prisma.tripParcel.create({
      data: {
        trip_id: tripId,
        first_name: dto.first_name,
        last_name: dto.last_name,
        phone: dto.phone,
        weight: dto.weight,
        delivery_address: dto.delivery_address,
        updated_by_id: updatedById,
      },
    });
  }

  async updateParcel(tripId: number, parcelId: number, dto: UpdateParcelDto, updatedById: number) {
    const parcel = await this.prisma.tripParcel.findUnique({
      where: { id: parcelId },
    });

    if (!parcel || parcel.trip_id !== tripId) {
      throw new NotFoundException('Parcel not found');
    }

    return this.prisma.tripParcel.update({
      where: { id: parcelId },
      data: {
        first_name: dto.first_name,
        last_name: dto.last_name,
        phone: dto.phone,
        weight: dto.weight,
        delivery_address: dto.delivery_address,
        is_delivered: dto.is_delivered,
        updated_by_id: updatedById,
      },
    });
  }

  async removeParcel(tripId: number, parcelId: number) {
    const parcel = await this.prisma.tripParcel.findUnique({
      where: { id: parcelId },
    });

    if (!parcel || parcel.trip_id !== tripId) {
      throw new NotFoundException('Parcel not found');
    }

    return this.prisma.tripParcel.delete({
      where: { id: parcelId },
    });
  }

  // --- TRIP COMPLETION ---

  async completeTrip(tripId: number) {
    const trip = await this.findOne(tripId);

    // 1. Mark current trip as completed
    await this.prisma.trip.update({
      where: { id: tripId },
      data: { status: 'completed' },
    });

    // 2. Create new active trip for the same vehicle
    const newTrip = await this.prisma.trip.create({
      data: {
        vehicle_id: trip.vehicle_id,
        status: 'active',
      },
    });

    // 3. Create 7 empty seats for the new trip
    const seatsData = Array.from({ length: 7 }).map((_, i) => ({
      trip_id: newTrip.id,
      seat_number: i + 1,
    }));

    await this.prisma.tripSeat.createMany({
      data: seatsData,
    });

    return this.findOne(newTrip.id);
  }
}
