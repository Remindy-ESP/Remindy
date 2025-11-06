import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EventEntity } from './infrastructure/persistence/event.entity';
import { EventRepository } from './infrastructure/repositories/event.repository';
import { EVENT_REPOSITORY } from './application/ports/event-repository.interface';
import { FindAllEventsUseCase } from './application/use-cases/find-all-events.use-case';
import { RescheduleEventUseCase } from './application/use-cases/reschedule-event.use-case';
import { EventController } from './presentation/controllers/event.controller';

@Module({
  imports: [TypeOrmModule.forFeature([EventEntity])],
  controllers: [EventController],
  providers: [
    {
      provide: EVENT_REPOSITORY,
      useClass: EventRepository,
    },
    FindAllEventsUseCase,
    RescheduleEventUseCase,
  ],
  exports: [EVENT_REPOSITORY],
})
export class EventModule {}
