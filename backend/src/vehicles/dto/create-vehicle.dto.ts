import { IsString, IsOptional, MaxLength } from 'class-validator';

export class CreateVehicleDto {
  @IsString()
  @MaxLength(64)
  name!: string;

  @IsString()
  @IsOptional()
  @MaxLength(20)
  plate_number?: string;
}
