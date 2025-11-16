import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EventEntity } from './infrastructure/persistence/event.entity';
import { EventRepository } from './infrastructure/repositories/event.repository';
import { EVENT_REPOSITORY } from './application/ports/event-repository.interface';
import { FindAllEventsUseCase } from './application/use-cases/find-all-events.use-case';
import { RescheduleEventUseCase } from './application/use-cases/reschedule-event.use-case';
import { CreateEventUseCase } from './application/use-cases/create-event.use-case';
import { GenerateEventsForSubscriptionUseCase } from './application/use-cases/generate-events-for-subscription.use-case';
import { GetEventByIdUseCase } from './application/use-cases/get-event-by-id.use-case';
import { DeleteEventUseCase } from './application/use-cases/delete-event.use-case';
import { UpdateEventStatusUseCase } from './application/use-cases/update-event-status.use-case';
import { UpdateEventPaymentStatusUseCase } from './application/use-cases/update-event-payment-status.use-case';
import { EventGenerationService } from './application/services/event-generation.service';
import { EventController } from './presentation/controllers/event.controller';
import { SubscriptionModule } from '../subscription/subscription.module';
import { EventSeriesModule } from '../event-series/event-series.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([EventEntity]),
    forwardRef(() => SubscriptionModule),
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
    GetEventByIdUseCase,
    DeleteEventUseCase,
    UpdateEventStatusUseCase,
    UpdateEventPaymentStatusUseCase,
    EventGenerationService,
  ],
  exports: [EVENT_REPOSITORY, CreateEventUseCase, GenerateEventsForSubscriptionUseCase],
})
export class EventModule {}
