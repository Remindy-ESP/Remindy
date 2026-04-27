import { Injectable } from '@nestjs/common';
import { authenticator } from 'otplib';

@Injectable()
export class TotpService {
  constructor() {
    authenticator.options = { window: 1 };
  }

  generateSecret() {
    return authenticator.generateSecret();
  }

  buildOtpAuthUrl(email: string, issuer: string, secret: string) {
    return authenticator.keyuri(email, issuer, secret);
  }

  verify(code: string, secret: string) {
    return authenticator.verify({ token: code, secret });
  }
}
