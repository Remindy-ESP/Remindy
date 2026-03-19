import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Request } from 'express';

@Injectable()
export class AdminCsrfGuard implements CanActivate {
  constructor(private readonly eventEmitter: EventEmitter2) {}

  canActivate(ctx: ExecutionContext): boolean {
    // if (process.env.NODE_ENV === 'development') return true;

    const req = ctx.switchToHttp().getRequest<Request & { user?: { id?: string } }>();
    const method = req.method.toUpperCase();

    if (!['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) return true;

    const cookieToken = req.cookies?.csrfToken as string | undefined;
    const rawHeader = req.headers['x-csrf-token'];
    const headerToken = Array.isArray(rawHeader) ? rawHeader[0] : rawHeader;

    if (!cookieToken || !headerToken || cookieToken !== headerToken) {
      this.eventEmitter.emit('security.csrf.violation', {
        userId: req.user?.id,
        ipAddress: req.ip,
        resource: `${method} ${req.path}`,
      });
      throw new ForbiddenException('CSRF token invalid');
    }

    return true;
  }
}
