/* istanbul ignore file */
import { Theme } from 'src/infrastructure/database/entities/user-preference.entity';

export class UpdateUserPreferencesRequest {
  theme?: Theme;

  notificationEmail?: boolean;

  notificationPush?: boolean;

  notificationSms?: boolean;

  defaultReminderDelay?: number;

  currency?: string;

  showOnlineStatus?: boolean;
}
