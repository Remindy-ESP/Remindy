import { Injectable, UnauthorizedException } from '@nestjs/common';
import { IUserAuthRepository } from '../../domain/repositories/user-auth.repository';
import { IUserSessionRepository } from '../../domain/repositories/user-session.repository';
import { IPasswordService } from '../../domain/services/password.service';
import { ITokenService } from '../../domain/services/token.service';
import { LoginRequestDto } from '../../presentation/dto/login-request.dto';
import { LoginResponseDto } from '../../presentation/dto/login-response.dto';

@Injectable()
export class LoginUseCase {
  constructor(
    private readonly userRepo: IUserAuthRepository,
    private readonly sessionRepo: IUserSessionRepository,
    private readonly passwordService: IPasswordService,
    private readonly tokenService: ITokenService,
  ) {}

  async execute(dto: LoginRequestDto): Promise<LoginResponseDto> {
    const user = await this.userRepo.findByEmail(dto.email);
    if (!user) throw new UnauthorizedException('Invalid credentials');

    const isValid = await this.passwordService.compare(
      dto.password,
      user.getPasswordHash(),
    );

    if (!isValid) throw new UnauthorizedException('Invalid credentials');

const refreshToken = this.tokenService.generateRefreshToken({
  sub: user.getId(),
});
    const refreshTokenHash = await this.passwordService.hash(refreshToken);

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);

    const session = await this.sessionRepo.createSession({
      userId: user.getId() || '',  
      refreshTokenHash,
      ipAddress: dto.ipAddress,
      userAgent: dto.userAgent,
      deviceName: dto.deviceName,
      expiresAt,
    });

    const accessToken = this.tokenService.generateAccessToken({
      userId: user.getId(),
      sessionId: session.id,
    });

    return {
      accessToken,
      refreshToken,
      userId: user.getId() || '',
    };
  }
}