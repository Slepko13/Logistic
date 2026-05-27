import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, MinLength, MaxLength, IsEnum, IsOptional } from 'class-validator';
import { UserRole, UserRoleType } from '../user-role';

export class CreateUserDto {
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

  @ApiPropertyOptional({ example: 'driver', enum: UserRole })
  @IsEnum(UserRole)
  @IsOptional()
  role?: UserRoleType;
}
