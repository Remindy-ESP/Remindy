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
    const data = await res.json();
    if (!data.sub) throw new UnauthorizedException('Invalid Google token payload');
    return {
      providerId: data.sub as string,
      email: data.email as string,
      firstName: (data.given_name as string) ?? '',
      lastName: (data.family_name as string) ?? '',
    };
  }

  async exchangeCodeForIdToken(code: string, redirectUri: string): Promise<string> {
    const res = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: process.env.GOOGLE_CLIENT_ID ?? '',
        client_secret: process.env.GOOGLE_CLIENT_SECRET ?? '',
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }).toString(),
    });
    const data = await res.json();
    if (!res.ok || !data.id_token) {
      console.error('[Google token exchange] status:', res.status, 'body:', JSON.stringify(data));
      throw new UnauthorizedException('Google code exchange failed');
    }
    return data.id_token as string;
  }
}
