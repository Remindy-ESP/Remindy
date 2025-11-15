import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EventEntity } from './infrastructure/persistence/event.entity';
import { EventRepository } from './infrastructure/repositories/event.repository';
import { EVENT_REPOSITORY } from './application/ports/event-repository.interface';
import { FindAllEventsUseCase } from './application/use-cases/find-all-events.use-case';
import { RescheduleEventUseCase } from './application/use-cases/reschedule-event.use-case';
import { CreateEventUseCase } from './application/use-cases/create-event.use-case';
import { GenerateEventsForSubscriptionUseCase } from './application/use-cases/generate-events-for-subscription.use-case';
import { EventGenerationService } from './application/services/event-generation.service';
import { EventController } from './presentation/controllers/event.controller';
import { SubscriptionModule } from '../subscription/subscription.module';
import { EventSeriesModule } from '../event-series/event-series.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([EventEntity]),
    SubscriptionModule,
    EventSeriesModule,
  ],
  controllers: [EventController],
  providers: [
    {
      provide: EVENT_REPOSITORY,
      useClass: EventRepository,
    },
    FindAllEventsUseCase,
    RescheduleEventUseCase,
    CreateEventUseCase,
    GenerateEventsForSubscriptionUseCase,
    EventGenerationService,
  ],
  exports: [EVENT_REPOSITORY, CreateEventUseCase, GenerateEventsForSubscriptionUseCase],
})
export class EventModule {}
