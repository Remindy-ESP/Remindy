import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';

@Injectable()
export class AdminMfaGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest();
    const user = req.user;

    if (!user) throw new UnauthorizedException('Not authenticated');

    if (!user.mfaEnabled) {
      throw new ForbiddenException('MFA enrollment required for admin access');
    }
    if (!user.mfaVerified) {
      throw new ForbiddenException('MFA verification required');
    }

    return true;
  }
}
