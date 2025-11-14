export abstract class ITokenService {
  abstract generateAccessToken(payload: any): string;
  abstract generateRefreshToken(payload: any): string;
}
