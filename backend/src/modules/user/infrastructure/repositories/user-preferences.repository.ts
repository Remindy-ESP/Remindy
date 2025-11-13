import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserPreferenceEntity } from '../../../../infrastructure/database/entities/user-preference.entity';

@Injectable()
export class UserPreferencesRepository {
  constructor(
    @InjectRepository(UserPreferenceEntity)
    private readonly preferencesRepository: Repository<UserPreferenceEntity>,
  ) {}

  async findByUserId(userId: string): Promise<UserPreferenceEntity | null> {
    return this.preferencesRepository.findOne({
      where: { userId },
    });
  }

  async createDefaultPreferences(userId: string): Promise<UserPreferenceEntity> {
    const preferences = this.preferencesRepository.create({
      userId,
      theme: 'light',
      notificationEmail: true,
      notificationPush: true,
      notificationSms: false,
      defaultReminderDelay: 3,
      currency: 'EUR',
      showOnlineStatus: true,
    });
    return this.preferencesRepository.save(preferences);
  }

  async update(
    userId: string,
    data: Partial<UserPreferenceEntity>,
  ): Promise<UserPreferenceEntity | null> {
    await this.preferencesRepository.update({ userId }, data);
    return this.findByUserId(userId);
  }

  async save(preferences: UserPreferenceEntity): Promise<UserPreferenceEntity> {
    return this.preferencesRepository.save(preferences);
  }

  async softDelete(userId: string): Promise<void> {
    await this.preferencesRepository.softDelete({ userId });
  }
}
