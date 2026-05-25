import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, MaxLength } from 'class-validator';

export class UpdateUserDto {
  @ApiPropertyOptional({ example: '+380501234567' })
  @IsString()
  @IsOptional()
  @MaxLength(20)
  phone?: string;

  @ApiPropertyOptional({ example: 'Іван' })
  @IsString()
  @IsOptional()
  @MaxLength(50)
  first_name?: string;

  @ApiPropertyOptional({ example: 'Петренко' })
  @IsString()
  @IsOptional()
  @MaxLength(50)
  last_name?: string;
}
