import { Injectable, NotFoundException } from "@nestjs/common";
import { UserPreferencesRepository } from "../../infrastructure/repositories/user-preferences.repository";
import { UpdateUserPreferencesDto } from "../../presentation/dto";
import { UpdateUserPreferencesRequest } from "../dto/update-user-preferences.request";
import { Theme } from "src/infrastructure/database/entities/user-preference.entity";


@Injectable()
export class UpdateUserPreferencesUseCase {
  constructor(
    private readonly preferencesRepo: UserPreferencesRepository,
  ) {}

  async execute(userId: string, dto: UpdateUserPreferencesDto) {
  return this.preferencesRepo.update(userId, {
    theme: dto.theme as Theme | undefined,
    notificationEmail: dto.notificationEmail,
    notificationPush: dto.notificationPush,
    notificationSms: dto.notificationSms,
    defaultReminderDelay: dto.defaultReminderDelay,
    currency: dto.currency,
    showOnlineStatus: dto.showOnlineStatus,
  });
}

}
