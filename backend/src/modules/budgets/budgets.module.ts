import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { EventModule } from '../event/event.module';
import { SubscriptionModule } from '../subscription/subscription.module';
import { BudgetEntity } from './infrastructure/persistence/budget.entity';
import { BudgetRepository } from './infrastructure/repositories/budget.repository';
import { BudgetService } from './application/services/budget.service';
import { BUDGET_REPOSITORY } from './application/ports/budget.repository.interface';
import { BudgetController } from './presentation/controllers/budget.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([BudgetEntity]),
    forwardRef(() => AuthModule),
    forwardRef(() => SubscriptionModule),
    forwardRef(() => EventModule),
  ],
  controllers: [BudgetController],
  providers: [
    {
      provide: BUDGET_REPOSITORY,
      useClass: BudgetRepository,
    },
    BudgetService,
  ],
  exports: [BUDGET_REPOSITORY, BudgetService],
})
export class BudgetsModule {}
