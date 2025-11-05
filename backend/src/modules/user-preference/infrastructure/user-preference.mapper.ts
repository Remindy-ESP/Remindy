import { Injectable } from '@nestjs/common';
import { UserPreference, Theme } from '../domain/user-preference.entity';
import { UserPreferenceOrmEntity, ThemeOrm } from './user-preference.orm-entity';

@Injectable()
export class UserPreferenceMapper {
  toDomain(ormEntity: UserPreferenceOrmEntity): UserPreference {
    return new UserPreference({
      userId: ormEntity.userId,
      theme: this.mapThemeToDomain(ormEntity.theme),
      notificationEmail: ormEntity.notificationEmail,
      notificationPush: ormEntity.notificationPush,
      notificationSms: ormEntity.notificationSms,
      defaultReminderDelay: ormEntity.defaultReminderDelay,
      currency: ormEntity.currency,
      showOnlineStatus: ormEntity.showOnlineStatus,
      createdAt: ormEntity.createdAt,
      updatedAt: ormEntity.updatedAt,
      deletedAt: ormEntity.deletedAt,
    });
  }

  toOrm(domainEntity: UserPreference): UserPreferenceOrmEntity {
    const ormEntity = new UserPreferenceOrmEntity();
    ormEntity.userId = domainEntity.getUserId();
    ormEntity.theme = this.mapThemeToOrm(domainEntity.getTheme());
    ormEntity.notificationEmail = domainEntity.isEmailNotificationEnabled();
    ormEntity.notificationPush = domainEntity.isPushNotificationEnabled();
    ormEntity.notificationSms = domainEntity.isSmsNotificationEnabled();
    ormEntity.defaultReminderDelay = domainEntity.getDefaultReminderDelay();
    ormEntity.currency = domainEntity.getCurrency();
    ormEntity.showOnlineStatus = domainEntity.shouldShowOnlineStatus();
    ormEntity.createdAt = domainEntity.getCreatedAt();
    ormEntity.updatedAt = domainEntity.getUpdatedAt();
    ormEntity.deletedAt = domainEntity.getDeletedAt();
    return ormEntity;
  }

  private mapThemeToDomain(ormTheme: ThemeOrm): Theme {
    switch (ormTheme) {
      case ThemeOrm.LIGHT:
        return Theme.LIGHT;
      case ThemeOrm.DARK:
        return Theme.DARK;
      case ThemeOrm.AUTO:
        return Theme.AUTO;
      default:
        return Theme.LIGHT;
    }
  }

  private mapThemeToOrm(domainTheme: Theme): ThemeOrm {
    switch (domainTheme) {
      case Theme.LIGHT:
        return ThemeOrm.LIGHT;
      case Theme.DARK:
        return ThemeOrm.DARK;
      case Theme.AUTO:
        return ThemeOrm.AUTO;
      default:
        return ThemeOrm.LIGHT;
    }
  }
}
