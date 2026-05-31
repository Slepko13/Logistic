import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { CreateCityDto } from './dto/create-city.dto';
import { UpdateCityDto } from './dto/update-city.dto';

@Injectable()
export class CitiesService {
  constructor(private prisma: PrismaService) {}

  async create(createCityDto: CreateCityDto) {
    try {
      return await this.prisma.city.create({
        data: createCityDto,
      });
    } catch (err) {
      const e = err as { code?: string };
      if (e.code === 'P2002') {
        throw new ConflictException('Місто з такою назвою вже існує');
      }
      throw e;
    }
  }

  async findAll() {
    return this.prisma.city.findMany({
      orderBy: { name: 'asc' },
    });
  }

  async findOne(id: number) {
    const city = await this.prisma.city.findUnique({
      where: { id },
    });
    if (!city) {
      throw new NotFoundException(`Місто з ID ${id} не знайдено`);
    }
    return city;
  }

  async update(id: number, updateCityDto: UpdateCityDto) {
    await this.findOne(id);
    try {
      return await this.prisma.city.update({
        where: { id },
        data: updateCityDto,
      });
    } catch (err) {
      const e = err as { code?: string };
      if (e.code === 'P2002') {
        throw new ConflictException('Місто з такою назвою вже існує');
      }
      throw e;
    }
  }

  async remove(id: number) {
    await this.findOne(id);
    return this.prisma.city.delete({
      where: { id },
    });
  }
}
