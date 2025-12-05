import { Injectable, Inject, BadRequestException } from '@nestjs/common';
import type { IReminderRepository } from '../ports/reminder-repository.interface';
import { REMINDER_REPOSITORY } from '../ports/reminder-repository.interface';
import { Reminder } from '../../domain/reminder.entity';
import { CreateReminderAppDto } from '../dto/create-reminder-app.dto';

@Injectable()
export class CreateReminderUseCase {
  constructor(
    @Inject(REMINDER_REPOSITORY)
    private readonly reminderRepository: IReminderRepository,
  ) {}

  async execute(dto: CreateReminderAppDto): Promise<Reminder> {
    try {
      // Create domain entity (validation happens in constructor)
      const reminder = new Reminder({
        userId: dto.userId,
        subscriptionId: dto.subscriptionId,
        type: dto.type,
        daysBefore: dto.daysBefore,
        enabled: dto.enabled,
        channel: dto.channel,
      });

      // Save to repository
      return await this.reminderRepository.save(reminder);
    } catch (error) {
      if (error instanceof Error) {
        throw new BadRequestException(error.message);
      }
      throw error;
    }
  }
}
