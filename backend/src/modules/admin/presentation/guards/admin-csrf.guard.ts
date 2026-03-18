import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Request } from 'express';

@Injectable()
export class AdminCsrfGuard implements CanActivate {
  canActivate(ctx: ExecutionContext): boolean {
    // Bypass CSRF en développement pour Swagger
    if (process.env.NODE_ENV === 'development') return true;

    const req = ctx.switchToHttp().getRequest<Request>();
    const method = req.method.toUpperCase();
    if (!['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) return true;

    const cookieToken = req.cookies?.csrfToken as string | undefined;
    const rawHeader = req.headers['x-csrf-token'];
    const headerToken = Array.isArray(rawHeader) ? rawHeader[0] : rawHeader;

    if (!cookieToken || !headerToken || cookieToken !== headerToken) {
      throw new ForbiddenException('CSRF token invalid');
    }
    return true;
  }
}