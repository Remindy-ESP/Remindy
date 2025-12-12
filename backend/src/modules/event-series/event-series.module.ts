import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EventSeriesEntity } from './infrastructure/persistence/event-series.entity';
import { EventSeriesRepository } from './infrastructure/repositories/event-series.repository';
import { EVENT_SERIES_REPOSITORY } from './application/ports/event-series-repository.interface';
import { CreateEventSeriesUseCase } from './application/use-cases/create-event-series.use-case';
import { FindEventSeriesBySubscriptionUseCase } from './application/use-cases/find-event-series-by-subscription.use-case';
import { GenerateEventsFromSeriesUseCase } from './application/use-cases/generate-events-from-series.use-case';
import { EventSeriesController } from './presentation/controllers/event-series.controller';
import { SubscriptionModule } from '../subscription/subscription.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([EventSeriesEntity]),
    forwardRef(() => SubscriptionModule),
    forwardRef(() => AuthModule),
  ],
  controllers: [EventSeriesController],
  providers: [
    {
      provide: EVENT_SERIES_REPOSITORY,
      useClass: EventSeriesRepository,
    },
    CreateEventSeriesUseCase,
    FindEventSeriesBySubscriptionUseCase,
    GenerateEventsFromSeriesUseCase,
  ],
  exports: [
    EVENT_SERIES_REPOSITORY,
    CreateEventSeriesUseCase,
    FindEventSeriesBySubscriptionUseCase,
    GenerateEventsFromSeriesUseCase,
  ],
})
export class EventSeriesModule {}
