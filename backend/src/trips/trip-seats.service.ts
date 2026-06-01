import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { UpdateSeatDto } from './dto/update-seat.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class TripSeatsService {
  constructor(private readonly prisma: PrismaService) {}

  async addSeat(tripId: number) {
    const trip = await this.prisma.trip.findUnique({ where: { id: tripId } });
    if (!trip) throw new NotFoundException('Рейс не знайдено');

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

  async removeSeat(tripId: number, seatNumber: number, updatedById: number, version?: number) {
    const trip = await this.prisma.trip.findUnique({ where: { id: tripId } });
    if (!trip) throw new NotFoundException('Рейс не знайдено');

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
        throw new NotFoundException('Місце не знайдено');
      }

      if (version !== undefined && seat.version !== version) {
        throw new ConflictException(
          'Дані були змінені іншим користувачем. Будь ласка, оновіть сторінку.',
        );
      }

      // If seat has a passenger, log the deletion
      if (seat.first_name || seat.last_name || seat.phone) {
        await tx.tripHistory.create({
          data: {
            trip_id: tripId,
            user_id: updatedById,
            action: 'SEAT_UPDATED', // Can reuse SEAT_UPDATED or use a new one, but let's stick to standard
            details: `Видалено місце ${seatNumber} з пасажиром (${seat.first_name || ''} ${seat.last_name || ''})`,
            changes: {
              before: {
                first_name: seat.first_name,
                last_name: seat.last_name,
                phone: seat.phone,
                boarding_address: seat.boarding_address,
                baggage_info: seat.baggage_info,
              },
              after: {
                deleted: true,
              },
            },
          },
        });
      }

      return tx.tripSeat.delete({
        where: { id: seat.id },
      });
    });
  }

  async updateSeat(tripId: number, seatNumber: number, dto: UpdateSeatDto, updatedById: number) {
    const trip = await this.prisma.trip.findUnique({ where: { id: tripId } });
    if (!trip) throw new NotFoundException('Рейс не знайдено');

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
        throw new NotFoundException('Місце не знайдено');
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
            ? (dto.baggage_info as unknown as Prisma.InputJsonValue)
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
}
