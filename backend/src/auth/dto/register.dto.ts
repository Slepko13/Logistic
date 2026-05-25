import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, MinLength, MaxLength } from 'class-validator';

export class RegisterDto {
  @ApiProperty({ example: '+380501234567' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  phone!: string;

  @ApiProperty({ example: 'Іван' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  first_name!: string;

  @ApiProperty({ example: 'Петренко' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  last_name!: string;

  @ApiProperty({ example: 'password123' })
  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  @MaxLength(100)
  password!: string;
}
