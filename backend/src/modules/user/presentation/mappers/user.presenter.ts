import { EUser } from "src/infrastructure/database/entities";
import { UserMeResponseDto } from "../dto/user-me.response.dto";

export class UserPresenter {
  static toMe(user: EUser): UserMeResponseDto {
    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName ?? undefined,
      lastName: user.lastName ?? undefined,
      phone: user.phone ?? undefined,
      role: user.role_key,
      status: user.status,
      timezone: user.timezone,
      language: user.language,
      emailVerified: user.emailVerified,
      createdAt: user.createdAt,
    };
  }
}
