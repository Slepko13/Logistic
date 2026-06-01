import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class TripHistoryService {
  constructor(private readonly prisma: PrismaService) {}

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

    const orderBy: Prisma.TripHistoryOrderByWithRelationInput = {};
    if (query?.sortBy) {
      orderBy[query.sortBy as keyof Prisma.TripHistoryOrderByWithRelationInput] =
        query.sortOrder || 'desc';
    } else {
      orderBy.created_at = 'desc';
    }

    const [data, total] = await Promise.all([
      this.prisma.tripHistory.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        include: {
          user: {
            select: { first_name: true, last_name: true },
          },
        },
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
