import { Controller, Get, Param, ParseIntPipe, Query, UseGuards } from '@nestjs/common';
import { TripHistoryService } from './trip-history.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('api/trips/:id/history')
export class TripHistoryController {
  constructor(private readonly tripHistoryService: TripHistoryService) {}

  @Get()
  getTripHistory(
    @Param('id', ParseIntPipe) id: number,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
    @Query('filterAction') filterAction?: string,
    @Query('sortBy') sortBy?: string,
    @Query('sortOrder') sortOrder?: 'asc' | 'desc',
  ) {
    return this.tripHistoryService.getTripHistory(id, {
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
      search,
      filterAction,
      sortBy,
      sortOrder,
    });
  }
}
