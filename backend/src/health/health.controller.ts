import { Controller, Get, HttpException, HttpStatus } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { DatabaseService } from '../database/database.service';
import { HealthResponseDto } from './dto/health-response.dto';

@ApiTags('health')
@Controller('api')
export class HealthController {
  constructor(private readonly database: DatabaseService) {}

  @Get('health')
  @ApiOperation({ summary: 'Health check' })
  @ApiResponse({ status: 200, type: HealthResponseDto })
  async health() {
    try {
      await this.database.ping();
      return { status: 'ok', database: 'connected' };
    } catch (err) {
      throw new HttpException(
        {
          status: 'error',
          database: 'disconnected',
          message: (err as Error).message,
        },
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }
  }
}
