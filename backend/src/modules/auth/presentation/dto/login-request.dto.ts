export class LoginRequestDto {
  email: string;
  password: string;
  ipAddress: string;   
  userAgent?: string;
  deviceName?: string;
}