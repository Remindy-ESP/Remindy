import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';
import { JwtTokenService } from '../../infrastructure/services/jwt-token.service';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly jwtService: JwtTokenService) {}

  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<Request>();

    const authHeader = req.headers.authorization;
    if (!authHeader) {
      throw new UnauthorizedException('Missing Authorization header');
    }

    const [type, token] = authHeader.split(' ');
    if (type !== 'Bearer' || !token) {
      throw new UnauthorizedException('Invalid Authorization format');
    }

    try {
      const payload = this.jwtService.verifyAccessToken(token);
      (req as any).user = {
        userId: payload.sub,
        role: payload.role,
      };
      console.log('[JwtAuthGuard] req.user =', (req as any).user);
      return true;
    } catch (err) {
      throw new UnauthorizedException('Invalid or expired token');
    }
  }}