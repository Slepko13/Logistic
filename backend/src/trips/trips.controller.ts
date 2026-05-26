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
  Req,
} from '@nestjs/common';
import { TripsService } from './trips.service';
import { UpdateTripDto } from './dto/update-trip.dto';
import { AddDriverDto } from './dto/add-driver.dto';
import { UpdateSeatDto } from './dto/update-seat.dto';
import { CreateParcelDto } from './dto/create-parcel.dto';
import { UpdateParcelDto } from './dto/update-parcel.dto';
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

  @Get('history')
  findAllCompleted() {
    return this.tripsService.findAllCompleted();
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

  @Patch(':id/seats/:seatNumber')
  updateSeat(
    @Param('id', ParseIntPipe) id: number,
    @Param('seatNumber', ParseIntPipe) seatNumber: number,
    @Body() updateSeatDto: UpdateSeatDto,
    @Req() req: { user: { sub: number } },
  ) {
    return this.tripsService.updateSeat(id, seatNumber, updateSeatDto, req.user.sub);
  }

  @Post(':id/seats')
  addSeat(@Param('id', ParseIntPipe) id: number) {
    return this.tripsService.addSeat(id);
  }

  @Delete(':id/seats/:seatNumber')
  removeSeat(
    @Param('id', ParseIntPipe) id: number,
    @Param('seatNumber', ParseIntPipe) seatNumber: number,
  ) {
    return this.tripsService.removeSeat(id, seatNumber);
  }

  @Post(':id/parcels')
  addParcel(
    @Param('id', ParseIntPipe) id: number,
    @Body() createParcelDto: CreateParcelDto,
    @Req() req: { user: { sub: number } },
  ) {
    return this.tripsService.addParcel(id, createParcelDto, req.user.sub);
  }

  @Patch(':id/parcels/:parcelId')
  updateParcel(
    @Param('id', ParseIntPipe) id: number,
    @Param('parcelId', ParseIntPipe) parcelId: number,
    @Body() updateParcelDto: UpdateParcelDto,
    @Req() req: { user: { sub: number } },
  ) {
    return this.tripsService.updateParcel(id, parcelId, updateParcelDto, req.user.sub);
  }

  @Delete(':id/parcels/:parcelId')
  removeParcel(
    @Param('id', ParseIntPipe) id: number,
    @Param('parcelId', ParseIntPipe) parcelId: number,
  ) {
    return this.tripsService.removeParcel(id, parcelId);
  }

  @Post(':id/complete')
  completeTrip(@Param('id', ParseIntPipe) id: number) {
    return this.tripsService.completeTrip(id);
  }
}
