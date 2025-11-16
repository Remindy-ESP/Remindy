import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReminderEntity } from './infrastructure/persistence/reminder.entity';
import { ReminderController } from './presentation/controllers/reminder.controller';
import { ReminderRepository } from './infrastructure/repositories/reminder.repository';
import { REMINDER_REPOSITORY } from './application/ports/reminder-repository.interface';
import { FindAllRemindersUseCase } from './application/use-cases/find-all-reminders.use-case';
import { FindReminderByIdUseCase } from './application/use-cases/find-reminder-by-id.use-case';
import { CreateReminderUseCase } from './application/use-cases/create-reminder.use-case';
import { UpdateReminderUseCase } from './application/use-cases/update-reminder.use-case';
import { DeleteReminderUseCase } from './application/use-cases/delete-reminder.use-case';

@Module({
  imports: [TypeOrmModule.forFeature([ReminderEntity])],
  controllers: [ReminderController],
  providers: [
    {
      provide: REMINDER_REPOSITORY,
      useClass: ReminderRepository,
    },
    FindAllRemindersUseCase,
    FindReminderByIdUseCase,
    CreateReminderUseCase,
    UpdateReminderUseCase,
    DeleteReminderUseCase,
  ],
  exports: [
    REMINDER_REPOSITORY,
    FindAllRemindersUseCase,
    FindReminderByIdUseCase,
    CreateReminderUseCase,
    UpdateReminderUseCase,
    DeleteReminderUseCase,
  ],
})
export class ReminderModule {}
