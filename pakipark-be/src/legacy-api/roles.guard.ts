import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';

const STAFF_ROLES = new Set(['admin', 'staff', 'teller', 'business_partner']);

@Injectable()
export class AdminOrTellerGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    if (STAFF_ROLES.has(request.user?.role)) return true;
    throw new ForbiddenException('Admin access required');
  }
}

@Injectable()
export class AdminOnlyGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    if (request.user?.role === 'admin') return true;
    throw new ForbiddenException('Admin access required');
  }
}
