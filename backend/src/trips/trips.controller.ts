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
import { CreateTripDto } from './dto/create-trip.dto';
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
  createTrip(@Body() createTripDto: CreateTripDto, @Req() req: { user: { id: number } }) {
    return this.tripsService.createTrip(createTripDto, req.user.id);
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

  @Post(':id/complete')
  completeTrip(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: { user: { id: number } },
    @Query('version', new ParseIntPipe({ optional: true })) version?: number,
  ) {
    return this.tripsService.completeTrip(id, req.user.id, version);
  }
}
