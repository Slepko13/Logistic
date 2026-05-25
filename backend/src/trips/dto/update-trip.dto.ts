import { IsString, IsOptional, IsDateString, MaxLength } from 'class-validator';

export class UpdateTripDto {
  @IsOptional()
  @IsString()
  @MaxLength(128)
  route?: string;

  @IsOptional()
  @IsDateString()
  date?: string;
}
