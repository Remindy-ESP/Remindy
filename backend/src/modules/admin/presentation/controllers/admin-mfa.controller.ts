import { Body, Controller, ForbiddenException, Post, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';
import * as qrcode from 'qrcode';
import { Throttle, seconds } from '@nestjs/throttler';
import { AdminPreMfa } from '../decorators/admin-pre-mfa.decorator';
import { UserMfaTypeOrmRepository } from '../../infrastructure/database/repositories/user-mfa-typeorm.repository';
import { TotpService } from '../../infrastructure/services/totp.service';
import { ITokenService } from 'src/modules/auth/domain/services/token.service';
import { Role } from 'src/modules/auth/domain/value-objects/role.enum';
import { UserThrottlerGuard } from '../guards/user-throttler.guard';

type AdminAuthRequest = Request & {
  user: {
    id: string;
    role: Role;
    mfaEnabled?: boolean;
    mfaVerified?: boolean;
  };
};

@UseGuards(UserThrottlerGuard)
@Controller('admin/auth/mfa')
export class AdminMfaController {
  constructor(
    private readonly userMfaRepo: UserMfaTypeOrmRepository,
    private readonly totp: TotpService,
    private readonly tokenService: ITokenService,
  ) {}

  @Throttle({ default: { limit: 1, ttl: 60 } })
  @Post('throttle-test')
  test() {
    return { ok: true };
  }

  @Throttle({ default: { limit: 3, ttl: seconds(300) } })
  @Post('setup')
  @AdminPreMfa()
  async setup(@Req() req: AdminAuthRequest) {
    const userId = req.user.id;

    const user = await this.userMfaRepo.findByIdForMfa(userId);
    if (!user) throw new ForbiddenException('User not found');
    if (user.mfaEnabled) throw new ForbiddenException('MFA already enabled');

    const secret = this.totp.generateSecret();
    await this.userMfaRepo.setSecret(userId, secret);

    const otpauthUrl = this.totp.buildOtpAuthUrl(user.email, 'Remindy Admin', secret);
    const qrCodeDataUrl = await qrcode.toDataURL(otpauthUrl);

    return { otpauthUrl, qrCodeDataUrl };
  }

  @Throttle({ default: { limit: 3, ttl: seconds(60) } })
  @Post('enable')
  @AdminPreMfa()
  async enable(@Req() req: AdminAuthRequest, @Body() body: { code: string }) {
    const userId = req.user.id;
    const role = req.user.role;

    await this.userMfaRepo.ensureEncryptedSecret(userId);

    const secret = await this.userMfaRepo.getDecryptedSecret(userId);
    if (!secret) throw new ForbiddenException('MFA not enabled');

    if (!this.totp.verify(body.code, secret)) {
      throw new ForbiddenException('Invalid MFA code');
    }

    await this.userMfaRepo.enable(userId);

    const accessToken = this.tokenService.generateAccessToken({
      sub: userId,
      role,
      mfaEnabled: true,
      mfaVerified: true,
    });

    await this.userMfaRepo.resetFailedLogin(userId);
    return { accessToken };
  }

  @Throttle({ default: { limit: 5, ttl: seconds(60) } })
  @Post('verify')
  @AdminPreMfa()
  async verify(@Req() req: AdminAuthRequest, @Body() body: { code: string }) {
    const userId = req.user.id;
    const role = req.user.role;

    const user = await this.userMfaRepo.findByIdForMfa(userId);
    if (!user?.mfaEnabled) throw new ForbiddenException('MFA not enabled');

    await this.userMfaRepo.ensureEncryptedSecret(userId);

    const secret = await this.userMfaRepo.getDecryptedSecret(userId);
    if (!secret) throw new ForbiddenException('MFA not enabled');

    if (!this.totp.verify(body.code, secret)) {
      await this.userMfaRepo.incrementFailedLogin(userId);
      throw new ForbiddenException('Invalid MFA code');
    }

    const accessToken = this.tokenService.generateAccessToken({
      sub: userId,
      role,
      mfaEnabled: true,
      mfaVerified: true,
    });

    await this.userMfaRepo.resetFailedLogin(userId);
    return { accessToken };
  }
}
