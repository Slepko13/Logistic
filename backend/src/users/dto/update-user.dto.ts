import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateUserDto {
  @ApiPropertyOptional({ example: '+380501234567' })
  phone?: string;

  @ApiPropertyOptional({ example: 'Іван' })
  first_name?: string;

  @ApiPropertyOptional({ example: 'Петренко' })
  last_name?: string;
}
