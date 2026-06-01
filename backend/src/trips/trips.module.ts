import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';

import { TripsController } from './trips.controller';
import { TripsService } from './trips.service';

import { TripDriversController } from './trip-drivers.controller';
import { TripDriversService } from './trip-drivers.service';

import { TripSeatsController } from './trip-seats.controller';
import { TripSeatsService } from './trip-seats.service';

import { TripParcelsController } from './trip-parcels.controller';
import { TripParcelsService } from './trip-parcels.service';

import { TripHistoryController } from './trip-history.controller';
import { TripHistoryService } from './trip-history.service';

@Module({
  imports: [DatabaseModule],
  controllers: [
    TripsController,
    TripDriversController,
    TripSeatsController,
    TripParcelsController,
    TripHistoryController,
  ],
  providers: [
    TripsService,
    TripDriversService,
    TripSeatsService,
    TripParcelsService,
    TripHistoryService,
  ],
})
export class TripsModule {}
