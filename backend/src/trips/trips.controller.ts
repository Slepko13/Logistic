import {
  Controller,
  Get,
  Patch,
  Post,
  Delete,
  Body,
  Param,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import { TripsService } from './trips.service';
import { UpdateTripDto } from './dto/update-trip.dto';
import { AddDriverDto } from './dto/add-driver.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AdminGuard } from '../auth/admin.guard';

@UseGuards(JwtAuthGuard)
@Controller('api/trips')
export class TripsController {
  constructor(private readonly tripsService: TripsService) {}

  @Get()
  findAllActive() {
    return this.tripsService.findAllActive();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.tripsService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() updateTripDto: UpdateTripDto) {
    return this.tripsService.update(id, updateTripDto);
  }

  @UseGuards(AdminGuard)
  @Post(':id/drivers')
  addDriver(@Param('id', ParseIntPipe) id: number, @Body() addDriverDto: AddDriverDto) {
    return this.tripsService.addDriver(id, addDriverDto);
  }

  @UseGuards(AdminGuard)
  @Delete(':id/drivers/:userId')
  removeDriver(
    @Param('id', ParseIntPipe) id: number,
    @Param('userId', ParseIntPipe) userId: number,
  ) {
    return this.tripsService.removeDriver(id, userId);
  }
}
