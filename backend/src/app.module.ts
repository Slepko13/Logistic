import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { DatabaseModule } from './database/database.module';
import { HealthController } from './health/health.controller';
import { UsersController } from './users/users.controller';

@Module({
  imports: [DatabaseModule, AuthModule],
  controllers: [HealthController, UsersController],
  providers: [],
})
export class AppModule {}
