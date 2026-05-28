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
  Query,
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
  findAllCompleted(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
    @Query('sortBy') sortBy?: string,
    @Query('sortOrder') sortOrder?: 'asc' | 'desc',
  ) {
    return this.tripsService.findAllCompleted({
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
      search,
      sortBy,
      sortOrder,
    });
  }

  @UseGuards(AdminGuard)
  @Post()
  createTrip(
    @Body('vehicle_id', ParseIntPipe) vehicleId: number,
    @Req() req: { user: { id: number } },
  ) {
    return this.tripsService.createTrip(vehicleId, req.user.id);
  }

  @Get(':id/history')
  getTripHistory(
    @Param('id', ParseIntPipe) id: number,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
    @Query('filterAction') filterAction?: string,
    @Query('sortBy') sortBy?: string,
    @Query('sortOrder') sortOrder?: 'asc' | 'desc',
  ) {
    return this.tripsService.getTripHistory(id, {
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
      search,
      filterAction,
      sortBy,
      sortOrder,
    });
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.tripsService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateTripDto: UpdateTripDto,
    @Req() req: { user: { id: number } },
  ) {
    return this.tripsService.update(id, updateTripDto, req.user.id);
  }

  @UseGuards(AdminGuard)
  @Delete(':id')
  deleteTrip(@Param('id', ParseIntPipe) id: number) {
    return this.tripsService.removeTrip(id);
  }

  @UseGuards(AdminGuard)
  @Post(':id/drivers')
  addDriver(
    @Param('id', ParseIntPipe) id: number,
    @Body() addDriverDto: AddDriverDto,
    @Req() req: { user: { id: number } },
  ) {
    return this.tripsService.addDriver(id, addDriverDto, req.user.id);
  }

  @UseGuards(AdminGuard)
  @Delete(':id/drivers/:userId')
  removeDriver(
    @Param('id', ParseIntPipe) id: number,
    @Param('userId', ParseIntPipe) userId: number,
    @Req() req: { user: { id: number } },
  ) {
    return this.tripsService.removeDriver(id, userId, req.user.id);
  }

  @Patch(':id/seats/:seatNumber')
  updateSeat(
    @Param('id', ParseIntPipe) id: number,
    @Param('seatNumber', ParseIntPipe) seatNumber: number,
    @Body() updateSeatDto: UpdateSeatDto,
    @Req() req: { user: { id: number } },
  ) {
    return this.tripsService.updateSeat(id, seatNumber, updateSeatDto, req.user.id);
  }

  @Post(':id/seats')
  addSeat(@Param('id', ParseIntPipe) id: number) {
    return this.tripsService.addSeat(id);
  }

  @Delete(':id/seats/:seatNumber')
  removeSeat(
    @Param('id', ParseIntPipe) id: number,
    @Param('seatNumber', ParseIntPipe) seatNumber: number,
    @Query('version', new ParseIntPipe({ optional: true })) version?: number,
  ) {
    return this.tripsService.removeSeat(id, seatNumber, version);
  }

  @Get(':id/parcels')
  getParcels(
    @Param('id', ParseIntPipe) id: number,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
    @Query('status') status?: string,
    @Query('sortBy') sortBy?: string,
    @Query('sortOrder') sortOrder?: 'asc' | 'desc',
  ) {
    return this.tripsService.getTripParcels(id, {
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
      search,
      status,
      sortBy,
      sortOrder,
    });
  }

  @Post(':id/parcels')
  addParcel(
    @Param('id', ParseIntPipe) id: number,
    @Body() createParcelDto: CreateParcelDto,
    @Req() req: { user: { id: number } },
  ) {
    return this.tripsService.addParcel(id, createParcelDto, req.user.id);
  }

  @Patch(':id/parcels/:parcelId')
  updateParcel(
    @Param('id', ParseIntPipe) id: number,
    @Param('parcelId', ParseIntPipe) parcelId: number,
    @Body() updateParcelDto: UpdateParcelDto,
    @Req() req: { user: { id: number } },
  ) {
    return this.tripsService.updateParcel(id, parcelId, updateParcelDto, req.user.id);
  }

  @Delete(':id/parcels/:parcelId')
  removeParcel(
    @Param('id', ParseIntPipe) id: number,
    @Param('parcelId', ParseIntPipe) parcelId: number,
    @Req() req: { user: { id: number } },
    @Query('version', new ParseIntPipe({ optional: true })) version?: number,
  ) {
    return this.tripsService.removeParcel(id, parcelId, req.user.id, version);
  }

  @Post(':id/complete')
  completeTrip(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: { user: { id: number } },
    @Query('version', new ParseIntPipe({ optional: true })) version?: number,
  ) {
    return this.tripsService.completeTrip(id, req.user.id, version);
  }
}
