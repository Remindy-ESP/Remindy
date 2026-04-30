import { Module, forwardRef } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { EventModule } from '../event/event.module';
import { SubscriptionModule } from '../subscription/subscription.module';
import { GetExpenseSummaryUseCase } from './application/use-cases/get-expense-summary.use-case';
import { StatisticsController } from './presentation/controllers/statistics.controller';

@Module({
  imports: [
    forwardRef(() => AuthModule),
    forwardRef(() => SubscriptionModule),
    forwardRef(() => EventModule),
  ],
  controllers: [StatisticsController],
  providers: [GetExpenseSummaryUseCase],
})
export class StatisticsModule {}
