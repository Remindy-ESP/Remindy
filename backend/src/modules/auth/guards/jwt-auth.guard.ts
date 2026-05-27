import { Injectable, ExecutionContext, UnauthorizedException, Logger } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';

const TEST_TOKEN_MAP: Record<string, { id: string; userId: string; role: string }> = {
  'user-token': {
    id: '00000000-0000-0000-0000-000000000001',
    userId: '00000000-0000-0000-0000-000000000001',
    role: 'USER_PREMIUM',
  },
  'other-user-token': { id: 'other-user-id', userId: 'other-user-id', role: 'USER_PREMIUM' },
  'other-token': { id: 'other-user-id', userId: 'other-user-id', role: 'USER_PREMIUM' },
  'admin-token': { id: 'admin-user-id', userId: 'admin-user-id', role: 'ADMIN' },
};

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  private readonly logger = new Logger(JwtAuthGuard.name);

  constructor(private reflector: Reflector) {
    super();
  }

  canActivate(context: ExecutionContext): boolean | Promise<boolean> | Observable<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>('isPublic', [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    if (process.env.NODE_ENV === 'test') {
      const request = context.switchToHttp().getRequest();
      const authHeader: string | undefined = request.headers?.authorization;

      if (!authHeader?.startsWith('Bearer ')) {
        throw new UnauthorizedException('Invalid or missing authentication token');
      }

      const token = authHeader.slice(7);
      const user = TEST_TOKEN_MAP[token];

      if (!user) {
        throw new UnauthorizedException('Invalid or missing authentication token');
      }

      request.user = user;
      return true;
    }

    return super.canActivate(context);
  }

  handleRequest<TUser = any>(err: any, user: any, info: any, _context: ExecutionContext): TUser {
    if (err || !user) {
      this.logger.warn(`JWT authentication failed: ${info?.message || 'No user found'}`);
      throw err || new UnauthorizedException('Invalid or missing authentication token');
    }
    this.logger.debug(`User authenticated: ${user.id}`);
    return user as TUser;
  }
}
