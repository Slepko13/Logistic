import prisma from '../database/prisma';
import { CreateVehicleInput, UpdateVehicleInput } from './vehicles.schema';
import { AppError } from '../common/errors/AppError';

class VehiclesService {
  async create(data: CreateVehicleInput) {
    if (data.plate_number) {
      const existing = await prisma.vehicle.findFirst({
        where: { plate_number: data.plate_number },
      });

      if (existing) {
        throw new AppError('Vehicle with this plate number already exists', 400);
      }
    }

    return prisma.vehicle.create({ data });
  }

  async findAll() {
    return prisma.vehicle.findMany({
      orderBy: { name: 'asc' },
    });
  }

  async findOne(id: number) {
    const vehicle = await prisma.vehicle.findUnique({ where: { id } });
    if (!vehicle) throw new AppError('Vehicle not found', 404);
    return vehicle;
  }

  async update(id: number, data: UpdateVehicleInput) {
    await this.findOne(id);
    return prisma.vehicle.update({
      where: { id },
      data,
    });
  }

  async remove(id: number) {
    await this.findOne(id);
    return prisma.vehicle.delete({ where: { id } });
  }
}

export const vehiclesService = new VehiclesService();
