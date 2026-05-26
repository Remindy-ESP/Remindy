import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { UserPreferenceEntity } from '../../../../infrastructure/database/entities/user-preference.entity';
import { Theme } from 'src/infrastructure/database/entities/user-preference.entity';

@Injectable()
export class UserPreferencesRepository {
  constructor(
    @InjectRepository(UserPreferenceEntity)
    private readonly preferencesRepository: Repository<UserPreferenceEntity>,
  ) {}

  async findByUserId(userId: string): Promise<UserPreferenceEntity | null> {
    return this.preferencesRepository.findOne({
      where: { userId, deletedAt: IsNull() },
    });
  }

  async createDefaultPreferences(userId: string): Promise<UserPreferenceEntity> {
    const preferences = this.preferencesRepository.create({
      userId,
      theme: Theme.LIGHT,
      notificationEmail: true,
      notificationPush: true,
      notificationSms: false,
      defaultReminderDelay: 3,
      currency: 'EUR',
      showOnlineStatus: true,
      monthlyReportEnabled: true,
    });
    return this.preferencesRepository.save(preferences);
  }

  async update(userId: string, data: Partial<UserPreferenceEntity>): Promise<UserPreferenceEntity> {
    let prefs = await this.findByUserId(userId);

    prefs ??= await this.createDefaultPreferences(userId);

    // merge proprement les champs envoyés
    if (data.theme !== undefined) prefs.theme = data.theme;
    if (data.notificationEmail !== undefined) prefs.notificationEmail = data.notificationEmail;
    if (data.notificationPush !== undefined) prefs.notificationPush = data.notificationPush;
    if (data.notificationSms !== undefined) prefs.notificationSms = data.notificationSms;
    if (data.defaultReminderDelay !== undefined)
      prefs.defaultReminderDelay = data.defaultReminderDelay;
    if (data.currency !== undefined) prefs.currency = data.currency;
    if (data.showOnlineStatus !== undefined) prefs.showOnlineStatus = data.showOnlineStatus;
    if (data.monthlyReportEnabled !== undefined)
      prefs.monthlyReportEnabled = data.monthlyReportEnabled;

    const saved = await this.preferencesRepository.save(prefs);
    return saved;
  }

  async save(preferences: UserPreferenceEntity): Promise<UserPreferenceEntity> {
    return this.preferencesRepository.save(preferences);
  }

  async softDelete(userId: string): Promise<void> {
    await this.preferencesRepository.softDelete({ userId });
  }
}
