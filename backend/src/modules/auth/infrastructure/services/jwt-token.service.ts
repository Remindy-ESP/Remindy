import { Injectable, UnauthorizedException } from '@nestjs/common';
import * as jwt from 'jsonwebtoken';

@Injectable()
export class JwtTokenService {
  
  generateAccessToken(payload: any): string {
    return jwt.sign(
      payload,
      process.env.JWT_ACCESS_TOKEN_SECRET!,   
      { 
        expiresIn: process.env.JWT_ACCESS_TOKEN_EXPIRATION as string | number || '15m'  
      } as jwt.SignOptions 
    );
  }

  generateRefreshToken(payload: any): string {
    const exp = process.env.JWT_REFRESH_TOKEN_EXPIRATION || '30d';

    if (!exp || typeof exp !== 'string') {
      throw new Error(`Invalid JWT_REFRESH_TOKEN_EXPIRATION: "${exp}"`);
    }

    return jwt.sign(
      payload, 
      process.env.JWT_REFRESH_TOKEN_SECRET!, 
      {
        expiresIn: exp,
      } as jwt.SignOptions 
    );
  }
  verifyRefreshToken(token: string): any {
    try {
      return jwt.verify(
        token,
        process.env.JWT_REFRESH_TOKEN_SECRET!,
      );
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }
  verifyAccessToken(token: string): any {
    try {
      return jwt.verify(
        token,
        process.env.JWT_ACCESS_TOKEN_SECRET!,
      );
    } catch {
      throw new UnauthorizedException('Invalid or expired access token');
    }
  }
  generatePasswordResetToken(payload: { sub: string }): string {
    return jwt.sign(
      {
        ...payload,
        type: 'password-reset',
      },
      process.env.JWT_PASSWORD_RESET_SECRET!,
      {
        expiresIn: '15m',
      },
    );
  }
}