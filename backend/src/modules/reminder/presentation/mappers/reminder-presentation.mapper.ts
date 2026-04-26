import { Reminder, ReminderType, ReminderChannel } from '../../domain/reminder.entity';
import { ReminderResponseDto } from '../dto/reminder-response.dto';
import { ReminderFilterDto } from '../dto/reminder-filter.dto';
import { ReminderFilterAppDto } from '../../application/dto/reminder-filter-app.dto';
import { CreateReminderDto } from '../dto/create-reminder.dto';
import { CreateReminderAppDto } from '../../application/dto/create-reminder-app.dto';
import { UpdateReminderDto } from '../dto/update-reminder.dto';
import { UpdateReminderAppDto } from '../../application/dto/update-reminder-app.dto';

export class ReminderPresentationMapper {
  static toResponseDto(reminder: Reminder): ReminderResponseDto {
    return {
      id: reminder.id!,
      user_id: reminder.userId,
      subscription_id: reminder.subscriptionId,
      type: reminder.type,
      days_before: reminder.daysBefore,
      enabled: reminder.enabled,
      channel: reminder.channel,
      created_at: reminder.createdAt!.toISOString(),
      updated_at: reminder.updatedAt!.toISOString(),
      deleted_at: reminder.deletedAt?.toISOString(),
    };
  }

  static toResponseDtoArray(reminders: Reminder[]): ReminderResponseDto[] {
    return reminders.map(reminder => this.toResponseDto(reminder));
  }

  static toFilterAppDto(userId: string, dto: ReminderFilterDto): ReminderFilterAppDto {
    return {
      userId,
      subscriptionId: dto.subscription_id,
      type: dto.type,
      enabled: dto.enabled,
      limit: dto.limit ?? 50,
      sort: dto.sort ?? 'created_at:desc',
    };
  }

  static toCreateAppDto(userId: string, dto: CreateReminderDto): CreateReminderAppDto {
    return {
      userId,
      subscriptionId: dto.subscription_id,
      type: dto.type as ReminderType,
      daysBefore: dto.days_before,
      enabled: dto.enabled ?? true,
      channel: dto.channel as ReminderChannel,
    };
  }

  static toUpdateAppDto(dto: UpdateReminderDto): UpdateReminderAppDto {
    return {
      daysBefore: dto.days_before,
      enabled: dto.enabled,
      channel: dto.channel as ReminderChannel | undefined,
    };
  }
}
