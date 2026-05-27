import { IsString, IsOptional, IsArray, IsInt } from 'class-validator';

export class UpdateSeatDto {
  @IsOptional()
  @IsString()
  first_name?: string | null;

  @IsOptional()
  @IsString()
  last_name?: string | null;

  @IsOptional()
  @IsString()
  phone?: string | null;

  @IsOptional()
  @IsArray()
  baggage_info?: Record<string, unknown>[] | null;

  @IsOptional()
  @IsString()
  boarding_address?: string | null;

  @IsOptional()
  @IsInt()
  version?: number;
}
