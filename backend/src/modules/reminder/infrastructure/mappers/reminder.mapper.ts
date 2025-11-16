import { Reminder } from '../../domain/reminder.entity';
import { ReminderEntity } from '../persistence/reminder.entity';

export class ReminderMapper {
  static toDomain(entity: ReminderEntity): Reminder {
    const reminder = new Reminder({
      id: entity.id,
      userId: entity.userId,
      subscriptionId: entity.subscriptionId,
      type: entity.type,
      daysBefore: entity.daysBefore,
      enabled: entity.enabled,
      channel: entity.channel,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
      deletedAt: entity.deletedAt,
    });

    return reminder;
  }

  static toPersistence(reminder: Reminder): ReminderEntity {
    const entity = new ReminderEntity();

    if (reminder.id) {
      entity.id = reminder.id;
    }
    entity.userId = reminder.userId;
    entity.subscriptionId = reminder.subscriptionId;
    entity.type = reminder.type;
    entity.daysBefore = reminder.daysBefore;
    entity.enabled = reminder.enabled;
    entity.channel = reminder.channel;
    if (reminder.createdAt) {
      entity.createdAt = reminder.createdAt;
    }
    if (reminder.updatedAt) {
      entity.updatedAt = reminder.updatedAt;
    }
    if (reminder.deletedAt) {
      entity.deletedAt = reminder.deletedAt;
    }

    return entity;
  }

  static toDomainArray(entities: ReminderEntity[]): Reminder[] {
    return entities.map((entity) => this.toDomain(entity));
  }
}
