import { IsInt, Min, Max, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateTripDto {
  @IsInt()
  @Type(() => Number)
  vehicle_id!: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  @Type(() => Number)
  seatsCount?: number;
}
