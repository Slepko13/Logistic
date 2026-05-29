import { ApiProperty } from '@nestjs/swagger';

export class PublicUserDto {
  @ApiProperty({ example: 1 })
  id!: number;

  @ApiProperty({ example: '+380501234567' })
  phone!: string;

  @ApiProperty({ example: 'Іван' })
  first_name!: string;

  @ApiProperty({ example: 'Петренко' })
  last_name!: string;

  @ApiProperty({ enum: ['admin', 'driver'], example: 'driver' })
  role!: string;

  @ApiProperty({ example: true, description: 'Чи може користувач бути призначений водієм на рейс' })
  is_driver!: boolean;
}

export class UserListItemDto extends PublicUserDto {
  @ApiProperty({ example: '2024-01-01T00:00:00.000Z' })
  created_at!: string;
}
