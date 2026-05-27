import { IsString, IsNumber, MaxLength, IsNotEmpty, IsOptional } from 'class-validator';

export class CreateParcelDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(64)
  first_name!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(64)
  last_name!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  phone!: string;

  @IsNumber()
  weight!: number;

  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  delivery_address!: string;

  @IsOptional()
  @IsString()
  description?: string;
}
