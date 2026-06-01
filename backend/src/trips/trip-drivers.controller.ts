import {
  Controller,
  Post,
  Delete,
  Body,
  Param,
  ParseIntPipe,
  UseGuards,
  Req,
} from '@nestjs/common';
import { TripDriversService } from './trip-drivers.service';
import { AddDriverDto } from './dto/add-driver.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AdminGuard } from '../auth/admin.guard';

@UseGuards(JwtAuthGuard, AdminGuard)
@Controller('api/trips/:id/drivers')
export class TripDriversController {
  constructor(private readonly tripDriversService: TripDriversService) {}

  @Post()
  addDriver(
    @Param('id', ParseIntPipe) id: number,
    @Body() addDriverDto: AddDriverDto,
    @Req() req: { user: { id: number } },
  ) {
    return this.tripDriversService.addDriver(id, addDriverDto, req.user.id);
  }

  @Delete(':userId')
  removeDriver(
    @Param('id', ParseIntPipe) id: number,
    @Param('userId', ParseIntPipe) userId: number,
    @Req() req: { user: { id: number } },
  ) {
    return this.tripDriversService.removeDriver(id, userId, req.user.id);
  }
}
