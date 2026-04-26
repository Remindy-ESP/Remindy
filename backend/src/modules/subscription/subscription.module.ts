import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SubscriptionController } from './presentation/controllers/subscription.controller';
import { SubscriptionEntity } from './infrastructure/persistence/subscription.entity';
import { SubscriptionRepository } from './infrastructure/repositories/subscription.repository';
import { SUBSCRIPTION_REPOSITORY } from './application/ports/subscription-repository.interface';
import { CreateSubscriptionUseCase } from './application/use-cases/create-subscription.use-case';
import { UpdateSubscriptionUseCase } from './application/use-cases/update-subscription.use-case';
import { DeleteSubscriptionUseCase } from './application/use-cases/delete-subscription.use-case';
import { FindSubscriptionUseCase } from './application/use-cases/find-subscription.use-case';
import { FindAllSubscriptionsUseCase } from './application/use-cases/find-all-subscriptions.use-case';
import { FindSubscriptionsByPeriodUseCase } from './application/use-cases/find-subscriptions-by-period.use-case';
import { PauseSubscriptionUseCase } from './application/use-cases/pause-subscription.use-case';
import { ResumeSubscriptionUseCase } from './application/use-cases/resume-subscription.use-case';
import { FindSubscriptionEventsUseCase } from './application/use-cases/find-subscription-events.use-case';
import { SubscriptionEventGeneratorService } from './application/services/subscription-event-generator.service';
import { EventModule } from '../event/event.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([SubscriptionEntity]),
    forwardRef(() => EventModule),
    forwardRef(() => AuthModule),
  ],
  controllers: [SubscriptionController],
  providers: [
    {
      provide: SUBSCRIPTION_REPOSITORY,
      useClass: SubscriptionRepository,
    },
    SubscriptionEventGeneratorService,
    CreateSubscriptionUseCase,
    UpdateSubscriptionUseCase,
    DeleteSubscriptionUseCase,
    FindSubscriptionUseCase,
    FindAllSubscriptionsUseCase,
    FindSubscriptionsByPeriodUseCase,
    PauseSubscriptionUseCase,
    ResumeSubscriptionUseCase,
    FindSubscriptionEventsUseCase,
  ],
  exports: [
    SUBSCRIPTION_REPOSITORY,
    SubscriptionEventGeneratorService,
    CreateSubscriptionUseCase,
    UpdateSubscriptionUseCase,
    DeleteSubscriptionUseCase,
    FindSubscriptionUseCase,
    FindAllSubscriptionsUseCase,
    FindSubscriptionsByPeriodUseCase,
    PauseSubscriptionUseCase,
    ResumeSubscriptionUseCase,
  ],
})
export class SubscriptionModule {}
