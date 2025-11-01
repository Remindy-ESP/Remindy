import { Module } from '@nestjs/common';
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

@Module({
  imports: [TypeOrmModule.forFeature([SubscriptionEntity])],
  controllers: [SubscriptionController],
  providers: [
    {
      provide: SUBSCRIPTION_REPOSITORY,
      useClass: SubscriptionRepository,
    },
    CreateSubscriptionUseCase,
    UpdateSubscriptionUseCase,
    DeleteSubscriptionUseCase,
    FindSubscriptionUseCase,
    FindAllSubscriptionsUseCase,
    FindSubscriptionsByPeriodUseCase,
  ],
  exports: [
    SUBSCRIPTION_REPOSITORY,
    CreateSubscriptionUseCase,
    UpdateSubscriptionUseCase,
    DeleteSubscriptionUseCase,
    FindSubscriptionUseCase,
    FindAllSubscriptionsUseCase,
    FindSubscriptionsByPeriodUseCase,
  ],
})
export class SubscriptionModule {}
