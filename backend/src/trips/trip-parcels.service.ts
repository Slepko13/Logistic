import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { CreateParcelDto } from './dto/create-parcel.dto';
import { UpdateParcelDto } from './dto/update-parcel.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class TripParcelsService {
  constructor(private readonly prisma: PrismaService) {}

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
    const trip = await this.prisma.trip.findUnique({ where: { id: tripId } });
    if (!trip) throw new NotFoundException('Рейс не знайдено');

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
        throw new NotFoundException('Посилку не знайдено');
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
        throw new NotFoundException('Посилку не знайдено');
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
}
