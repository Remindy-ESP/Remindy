import { Injectable, UnauthorizedException } from '@nestjs/common';

export interface OAuthUserInfo {
  providerId: string;
  email: string;
  firstName: string;
  lastName: string;
}

@Injectable()
export class GoogleOAuthService {
  async verifyIdToken(idToken: string): Promise<OAuthUserInfo> {
    const url = `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(idToken)}`;
    const res = await fetch(url);
    if (!res.ok) throw new UnauthorizedException('Invalid Google token');
    const data = (await res.json()) as any;
    if (!data.sub) throw new UnauthorizedException('Invalid Google token payload');
    return {
      providerId: data.sub as string,
      email: data.email as string,
      firstName: (data.given_name as string) ?? '',
      lastName: (data.family_name as string) ?? '',
    };
  }
}
