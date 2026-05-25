import {
  IsString,
  IsOptional,
  IsDateString,
  MaxLength,
  IsInt,
  IsArray,
  ArrayUnique,
} from 'class-validator';

export class UpdateTripDto {
  @IsOptional()
  @IsString()
  @MaxLength(64)
  departure_city?: string;

  @IsOptional()
  @IsDateString()
  departure_date?: string;

  @IsOptional()
  @IsString()
  @MaxLength(64)
  arrival_city?: string;

  @IsOptional()
  @IsDateString()
  arrival_date?: string;

  @IsOptional()
  @IsInt()
  vehicle_id?: number;

  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @IsInt({ each: true })
  driverIds?: number[];
}
