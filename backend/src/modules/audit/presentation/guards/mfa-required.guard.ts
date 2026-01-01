import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EUser } from 'src/infrastructure/database/entities/user.entity';

/**
 * Guard that requires MFA to be enabled for accessing protected resources.
 *
 * This guard checks if the authenticated user has MFA enabled.
 * If MFA is not enabled, access is denied with a 403 Forbidden response.
 *
 * @example
 * @UseGuards(JwtAuthGuard, MfaRequiredGuard)
 * @Get('audit/logs')
 * async getAuditLogs() { ... }
 */
@Injectable()
export class MfaRequiredGuard implements CanActivate {
  constructor(
    @InjectRepository(EUser)
    private readonly userRepository: Repository<EUser>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user as { userId?: string } | undefined;

    if (!user?.userId) {
      throw new ForbiddenException('Authentication required');
    }

    const dbUser = await this.userRepository.findOne({
      where: { id: user.userId },
      select: ['id', 'mfaEnabled'],
    });

    if (!dbUser) {
      throw new ForbiddenException('User not found');
    }

    if (!dbUser.mfaEnabled) {
      throw new ForbiddenException(
        'MFA is required to access audit logs. Please enable MFA in your account settings.',
      );
    }

    return true;
  }
}
