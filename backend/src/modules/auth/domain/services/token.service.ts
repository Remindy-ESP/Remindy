export abstract class ITokenService {
  abstract generateAccessToken(payload: any): string;
  abstract generateRefreshToken(payload: any): string;

  abstract verifyAccessToken(token: string): {
    sub: string;
    [key: string]: any;
  };

  abstract verifyRefreshToken(token: string): {
    sub: string;
    sessionId?: string;
    [key: string]: any;
  };
}
