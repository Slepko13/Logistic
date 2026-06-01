import {
  Controller,
  Patch,
  Post,
  Delete,
  Body,
  Param,
  ParseIntPipe,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import { TripSeatsService } from './trip-seats.service';
import { UpdateSeatDto } from './dto/update-seat.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('api/trips/:id/seats')
export class TripSeatsController {
  constructor(private readonly tripSeatsService: TripSeatsService) {}

  @Patch(':seatNumber')
  updateSeat(
    @Param('id', ParseIntPipe) id: number,
    @Param('seatNumber', ParseIntPipe) seatNumber: number,
    @Body() updateSeatDto: UpdateSeatDto,
    @Req() req: { user: { id: number } },
  ) {
    return this.tripSeatsService.updateSeat(id, seatNumber, updateSeatDto, req.user.id);
  }

  @Post()
  addSeat(@Param('id', ParseIntPipe) id: number) {
    return this.tripSeatsService.addSeat(id);
  }

  @Delete(':seatNumber')
  removeSeat(
    @Param('id', ParseIntPipe) id: number,
    @Param('seatNumber', ParseIntPipe) seatNumber: number,
    @Req() req: { user: { id: number } },
    @Query('version', new ParseIntPipe({ optional: true })) version?: number,
  ) {
    return this.tripSeatsService.removeSeat(id, seatNumber, req.user.id, version);
  }
}
