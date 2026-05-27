import { Injectable, UnauthorizedException } from '@nestjs/common';
import { OAuthUserInfo } from './google-oauth.service';

@Injectable()
export class MicrosoftOAuthService {
  async verifyAccessToken(accessToken: string): Promise<OAuthUserInfo> {
    const res = await fetch('https://graph.microsoft.com/v1.0/me', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!res.ok) throw new UnauthorizedException('Invalid Microsoft token');
    const data = await res.json();
    if (!data.id) throw new UnauthorizedException('Invalid Microsoft token payload');
    const email = (data.mail ?? data.userPrincipalName) as string;
    return {
      providerId: data.id as string,
      email,
      firstName: (data.givenName as string) ?? '',
      lastName: (data.surname as string) ?? '',
    };
  }
}
