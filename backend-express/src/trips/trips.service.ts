import prisma from '../database/prisma';
import { CreateTripInput, UpdateTripInput } from './trips.schema';
import { AppError } from '../common/errors/AppError';

class TripsService {
  async create(data: CreateTripInput) {
    const vehicle = await prisma.vehicle.findUnique({ where: { id: data.vehicle_id } });
    if (!vehicle) throw new AppError('Vehicle not found', 404);

    return prisma.trip.create({
      data: {
        ...data,
        departure_date: data.departure_date ? new Date(data.departure_date) : null,
        arrival_date: data.arrival_date ? new Date(data.arrival_date) : null,
      },
      include: {
        vehicle: true,
      },
    });
  }

  async findAll() {
    return prisma.trip.findMany({
      include: {
        vehicle: true,
      },
      orderBy: { created_at: 'desc' },
    });
  }

  async findOne(id: number) {
    const trip = await prisma.trip.findUnique({
      where: { id },
      include: {
        vehicle: true,
      },
    });
    if (!trip) throw new AppError('Trip not found', 404);
    return trip;
  }

  async update(id: number, data: UpdateTripInput) {
    await this.findOne(id);
    
    const updateData: any = { ...data };
    if (data.departure_date) updateData.departure_date = new Date(data.departure_date);
    if (data.arrival_date) updateData.arrival_date = new Date(data.arrival_date);

    return prisma.trip.update({
      where: { id },
      data: updateData,
      include: {
        vehicle: true,
      },
    });
  }

  async remove(id: number) {
    await this.findOne(id);
    return prisma.trip.delete({ where: { id } });
  }
}

export const tripsService = new TripsService();
