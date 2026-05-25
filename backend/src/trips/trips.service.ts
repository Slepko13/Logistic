import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { UpdateTripDto } from './dto/update-trip.dto';
import { AddDriverDto } from './dto/add-driver.dto';

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

    // Parse date if provided
    let parsedDate = undefined;
    if (updateTripDto.date) {
      parsedDate = new Date(updateTripDto.date);
    }

    return this.prisma.trip.update({
      where: { id: trip.id },
      data: {
        route: updateTripDto.route !== undefined ? updateTripDto.route : undefined,
        date: parsedDate !== undefined ? parsedDate : undefined,
      },
    });
  }

  async addDriver(tripId: number, addDriverDto: AddDriverDto) {
    const trip = await this.findOne(tripId);

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
}
