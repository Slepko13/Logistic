import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { AddDriverDto } from './dto/add-driver.dto';

@Injectable()
export class TripDriversService {
  constructor(private readonly prisma: PrismaService) {}

  async addDriver(tripId: number, addDriverDto: AddDriverDto, updatedById: number) {
    const trip = await this.prisma.trip.findUnique({ where: { id: tripId } });
    if (!trip) throw new NotFoundException('Рейс не знайдено');

    // Verify user exists and is a driver
    const user = await this.prisma.user.findUnique({
      where: { id: addDriverDto.userId },
    });

    if (!user) {
      throw new NotFoundException('Користувача не знайдено');
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
      throw new NotFoundException('Водія не знайдено на цьому рейсі');
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
}
