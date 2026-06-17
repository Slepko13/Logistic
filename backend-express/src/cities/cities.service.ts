import prisma from '../database/prisma';
import { CreateCityInput, UpdateCityInput } from './cities.schema';
import { AppError } from '../common/errors/AppError';

class CitiesService {
  async create(data: CreateCityInput) {
    const existing = await prisma.city.findFirst({
      where: { name: { equals: data.name, mode: 'insensitive' } },
    });

    if (existing) {
      throw new AppError('City already exists', 400);
    }

    return prisma.city.create({ data });
  }

  async findAll() {
    return prisma.city.findMany({
      orderBy: { name: 'asc' },
    });
  }

  async findOne(id: number) {
    const city = await prisma.city.findUnique({ where: { id } });
    if (!city) throw new AppError('City not found', 404);
    return city;
  }

  async update(id: number, data: UpdateCityInput) {
    await this.findOne(id);
    return prisma.city.update({
      where: { id },
      data,
    });
  }

  async remove(id: number) {
    await this.findOne(id);
    return prisma.city.delete({ where: { id } });
  }
}

export const citiesService = new CitiesService();
