import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../database/prisma.service';
import { CreateVehicleDto } from './dto/create-vehicle.dto';
import { UpdateVehicleDto } from './dto/update-vehicle.dto';

@Injectable()
export class VehiclesService {
  constructor(private prisma: PrismaService) {}

  async create(createVehicleDto: CreateVehicleDto) {
    return this.prisma.vehicle.create({
      data: createVehicleDto,
    });
  }

  async findAll() {
    return this.prisma.vehicle.findMany({
      orderBy: { id: 'asc' },
    });
  }

  async findOne(id: number) {
    const vehicle = await this.prisma.vehicle.findUnique({
      where: { id },
    });
    if (!vehicle) {
      throw new NotFoundException(`Автобус з ID ${id} не знайдено`);
    }
    return vehicle;
  }

  async update(id: number, updateVehicleDto: UpdateVehicleDto) {
    await this.findOne(id); // Check if exists
    return this.prisma.vehicle.update({
      where: { id },
      data: updateVehicleDto,
    });
  }

  async remove(id: number) {
    await this.findOne(id); // Check if exists
    try {
      return await this.prisma.vehicle.delete({
        where: { id },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2003') {
        throw new BadRequestException(
          "Неможливо видалити автобус, оскільки він прив'язаний до існуючих рейсів.",
        );
      }
      throw error;
    }
  }
}
