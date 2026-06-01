import {
  Controller,
  Get,
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
import { TripParcelsService } from './trip-parcels.service';
import { CreateParcelDto } from './dto/create-parcel.dto';
import { UpdateParcelDto } from './dto/update-parcel.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('api/trips/:id/parcels')
export class TripParcelsController {
  constructor(private readonly tripParcelsService: TripParcelsService) {}

  @Get()
  getParcels(
    @Param('id', ParseIntPipe) id: number,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
    @Query('status') status?: string,
    @Query('sortBy') sortBy?: string,
    @Query('sortOrder') sortOrder?: 'asc' | 'desc',
  ) {
    return this.tripParcelsService.getTripParcels(id, {
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
      search,
      status,
      sortBy,
      sortOrder,
    });
  }

  @Post()
  addParcel(
    @Param('id', ParseIntPipe) id: number,
    @Body() createParcelDto: CreateParcelDto,
    @Req() req: { user: { id: number } },
  ) {
    return this.tripParcelsService.addParcel(id, createParcelDto, req.user.id);
  }

  @Patch(':parcelId')
  updateParcel(
    @Param('id', ParseIntPipe) id: number,
    @Param('parcelId', ParseIntPipe) parcelId: number,
    @Body() updateParcelDto: UpdateParcelDto,
    @Req() req: { user: { id: number } },
  ) {
    return this.tripParcelsService.updateParcel(id, parcelId, updateParcelDto, req.user.id);
  }

  @Delete(':parcelId')
  removeParcel(
    @Param('id', ParseIntPipe) id: number,
    @Param('parcelId', ParseIntPipe) parcelId: number,
    @Req() req: { user: { id: number } },
    @Query('version', new ParseIntPipe({ optional: true })) version?: number,
  ) {
    return this.tripParcelsService.removeParcel(id, parcelId, req.user.id, version);
  }
}
