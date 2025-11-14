export interface RegisterUserDto {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
}