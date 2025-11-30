import { UpdateUserPreferencesDto } from '../dto';
import { UpdateUserPreferencesRequest } from '../../application/dto/update-user-preferences.request';
import { Theme } from 'src/infrastructure/database/entities/user-preference.entity';

export class UserPreferencesMapper {
  static toInput(
    dto: UpdateUserPreferencesDto,
  ): UpdateUserPreferencesRequest {
    return {
      theme: dto.theme as Theme | undefined,
      notificationEmail: dto.notificationEmail,
      notificationPush: dto.notificationPush,
      notificationSms: dto.notificationSms,
      defaultReminderDelay: dto.defaultReminderDelay,
      currency: dto.currency,
      showOnlineStatus: dto.showOnlineStatus,
    };
  }
}
