import { Injectable } from '@nestjs/common';
import * as jwt from 'jsonwebtoken';

@Injectable()
export class JwtTokenService {
  
  generateAccessToken(payload: any): string {
    return jwt.sign(
      payload,
      process.env.JWT_ACCESS_TOKEN_SECRET!,   
      { expiresIn: process.env.JWT_ACCESS_TOKEN_EXPIRATION || '15m' }
    );
  }

  generateRefreshToken(payload: any): string {
  const exp = process.env.JWT_REFRESH_TOKEN_EXPIRATION || '30d';

  if (!exp || typeof exp !== 'string') {
    throw new Error(`Invalid JWT_REFRESH_TOKEN_EXPIRATION: "${exp}"`);
  }

  return jwt.sign(payload, process.env.JWT_REFRESH_TOKEN_SECRET!, {
    expiresIn: exp,
  });
}
}