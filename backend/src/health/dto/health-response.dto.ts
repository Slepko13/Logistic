import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class HealthResponseDto {
  @ApiProperty({ enum: ['ok', 'error'], example: 'ok' })
  status!: string;

  @ApiProperty({ enum: ['connected', 'disconnected'], example: 'connected' })
  database!: string;

  @ApiPropertyOptional({ example: 'Connection refused' })
  message?: string;
}
