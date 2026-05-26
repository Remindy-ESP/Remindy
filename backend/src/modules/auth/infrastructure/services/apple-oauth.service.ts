import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type { JwtVerifyOptions } from '@nestjs/jwt';
import * as crypto from 'crypto';

export interface AppleOAuthUserInfo {
  providerId: string;
  email: string | null;
}

@Injectable()
export class AppleOAuthService {
  private jwksCache: { keys: any[]; cachedAt: number } | null = null;
  private readonly CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24h

  constructor(private readonly jwtService: JwtService) {}

  async verifyIdentityToken(identityToken: string): Promise<AppleOAuthUserInfo> {
    const [headerB64] = identityToken.split('.');
    const header = JSON.parse(Buffer.from(headerB64, 'base64url').toString());
    const jwks = await this.fetchAppleJwks();
    const jwk = jwks.find((k: any) => k.kid === header.kid);
    if (!jwk) throw new UnauthorizedException('Apple: unknown token key');
    const publicKey = crypto.createPublicKey({ key: jwk, format: 'jwk' });
    const pem = publicKey.export({ type: 'spki', format: 'pem' }) as string;
    let payload: Record<string, unknown>;
    try {
      const verifyOptions: JwtVerifyOptions = {
        publicKey: pem,
        algorithms: ['RS256'],
        issuer: 'https://appleid.apple.com',
      };
      payload = this.jwtService.verify<Record<string, unknown>>(identityToken, verifyOptions);
    } catch {
      throw new UnauthorizedException('Apple: invalid identity token');
    }
    return {
      providerId: payload['sub'] as string,
      email: (payload['email'] as string) ?? null,
    };
  }

  private async fetchAppleJwks(): Promise<any[]> {
    if (this.jwksCache && Date.now() - this.jwksCache.cachedAt < this.CACHE_TTL_MS) {
      return this.jwksCache.keys;
    }
    const res = await fetch('https://appleid.apple.com/auth/keys');
    if (!res.ok) throw new UnauthorizedException('Failed to fetch Apple JWKS');
    const { keys } = (await res.json()) as { keys: any[] };
    this.jwksCache = { keys, cachedAt: Date.now() };
    return keys;
  }
}
