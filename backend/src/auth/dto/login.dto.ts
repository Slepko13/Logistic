import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({ example: '+380501234567' })
  phone!: string;

  @ApiProperty({ example: 'password123' })
  password!: string;
}
