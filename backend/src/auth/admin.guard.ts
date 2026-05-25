import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { UserRole } from '../users/user-role';

@Injectable()
export class AdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const { user } = context.switchToHttp().getRequest();
    if (user?.role !== UserRole.ADMIN) {
      throw new ForbiddenException('Доступ лише для адміністратора');
    }
    return true;
  }
}
