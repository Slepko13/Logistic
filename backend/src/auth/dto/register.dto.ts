import { ApiProperty } from '@nestjs/swagger';

export class RegisterDto {
  @ApiProperty({ example: '+380501234567' })
  phone!: string;

  @ApiProperty({ example: 'Іван' })
  first_name!: string;

  @ApiProperty({ example: 'Петренко' })
  last_name!: string;

  @ApiProperty({ example: 'password123' })
  password!: string;
}
