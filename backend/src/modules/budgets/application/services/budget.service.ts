import { Inject, Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { Budget } from '../../domain/budget.entity';
import type { IBudgetRepository } from '../ports/budget.repository.interface';
import { BUDGET_REPOSITORY } from '../ports/budget.repository.interface';
import { CreateBudgetAppDto } from '../dto/create-budget-app.dto';
import { UpdateBudgetAppDto } from '../dto/update-budget-app.dto';
import { BudgetFilterAppDto } from '../dto/budget-filter-app.dto';
import { EVENT_REPOSITORY } from '../../../event/application/ports/event-repository.interface';
import type { IEventRepository } from '../../../event/application/ports/event-repository.interface';
import { FindAllSubscriptionsUseCase } from '../../../subscription/application/use-cases/find-all-subscriptions.use-case';
import { Subscription } from '../../../subscription/domain/subscription.entity';

export interface BudgetSpending {
  spent: number;
  remaining: number;
  progress: number;
  isOverBudget: boolean;
  windowStart: Date;
  windowEnd: Date;
}

@Injectable()
export class BudgetService {
  constructor(
    @Inject(BUDGET_REPOSITORY)
    private readonly budgetRepository: IBudgetRepository,
    @Inject(EVENT_REPOSITORY)
    private readonly eventRepository: IEventRepository,
    private readonly findAllSubscriptionsUseCase: FindAllSubscriptionsUseCase,
  ) {}

  async create(dto: CreateBudgetAppDto): Promise<Budget> {
    const budget = new Budget({
      userId: dto.userId,
      name: dto.name,
      amount: dto.amount,
      currency: dto.currency,
      period: dto.period,
      startDate: dto.startDate,
      endDate: dto.endDate ?? null,
      categoryId: dto.categoryId ?? null,
      subscriptionIds: dto.subscriptionIds ?? [],
      isActive: dto.isActive ?? true,
      notes: dto.notes,
    });
    return this.budgetRepository.create(budget);
  }

  async findAll(filters: BudgetFilterAppDto): Promise<Budget[]> {
    return this.budgetRepository.findAll(filters);
  }

  async findOne(id: string, userId: string): Promise<Budget> {
    const budget = await this.budgetRepository.findById(id);
    if (!budget) {
      throw new NotFoundException(`Budget with ID ${id} not found`);
    }
    if (!budget.belongsToUser(userId)) {
      throw new ForbiddenException('You can only access your own budgets');
    }
    return budget;
  }

  async update(id: string, dto: UpdateBudgetAppDto, userId: string): Promise<Budget> {
    const existing = await this.budgetRepository.findById(id);
    if (!existing) {
      throw new NotFoundException(`Budget with ID ${id} not found`);
    }
    if (!existing.belongsToUser(userId)) {
      throw new ForbiddenException('You can only modify your own budgets');
    }

    if (dto.name !== undefined) existing.updateName(dto.name);
    if (dto.amount !== undefined) existing.updateAmount(dto.amount);
    if (dto.currency !== undefined) existing.updateCurrency(dto.currency);
    if (dto.period !== undefined) existing.updatePeriod(dto.period);
    if (dto.categoryId !== undefined) existing.updateCategoryId(dto.categoryId);
    if (dto.subscriptionIds !== undefined) existing.updateSubscriptionIds(dto.subscriptionIds);
    if (dto.notes !== undefined) existing.updateNotes(dto.notes);
    if (dto.isActive !== undefined) {
      if (dto.isActive) existing.activate();
      else existing.deactivate();
    }
    if (dto.startDate !== undefined) {
      existing.updateDates(dto.startDate, dto.endDate ?? existing.endDate ?? null);
    } else if (dto.endDate !== undefined) {
      existing.updateDates(existing.startDate, dto.endDate);
    }

    const updated = await this.budgetRepository.update(id, existing);
    if (!updated) {
      throw new NotFoundException(`Budget with ID ${id} not found`);
    }
    return updated;
  }

  async remove(id: string, userId: string): Promise<void> {
    const existing = await this.budgetRepository.findById(id);
    if (!existing) {
      throw new NotFoundException(`Budget with ID ${id} not found`);
    }
    if (!existing.belongsToUser(userId)) {
      throw new ForbiddenException('You can only delete your own budgets');
    }
    await this.budgetRepository.delete(id);
  }

  async getBudgetsWithSpending(
    filters: BudgetFilterAppDto,
  ): Promise<Array<{ budget: Budget; spending: BudgetSpending }>> {
    const budgets = await this.budgetRepository.findAll(filters);
    if (budgets.length === 0) {
      return [];
    }

    return Promise.all(
      budgets.map(async budget => ({
        budget,
        spending: await this.calculateSpendingForBudget(budget),
      })),
    );
  }

  async calculateSpendingForBudget(budget: Budget): Promise<BudgetSpending> {
    const windowStart = budget.startDate;
    const windowEnd = budget.computeEndDate();

    let allowedSubscriptionIds: Set<string>;

    if (budget.subscriptionIds.length > 0) {
      // Explicit subscription links take priority over category filtering
      allowedSubscriptionIds = new Set(budget.subscriptionIds);
    } else {
      const userSubscriptions = await this.findAllSubscriptionsUseCase.execute({
        userId: budget.userId,
      });
      allowedSubscriptionIds = filterSubscriptionIdsForBudget(
        userSubscriptions,
        budget.categoryId ?? null,
      );
    }

    if (allowedSubscriptionIds.size === 0) {
      return buildSpending(0, budget.amount, windowStart, windowEnd);
    }

    const events = await this.eventRepository.findAll({
      start: windowStart,
      end: windowEnd,
    });

    const spent = events.reduce((total, event) => {
      if (!allowedSubscriptionIds.has(event.subscriptionId)) return total;
      if (event.status === 'canceled') return total;
      return total + event.amount;
    }, 0);

    return buildSpending(spent, budget.amount, windowStart, windowEnd);
  }
}

function filterSubscriptionIdsForBudget(
  subscriptions: Subscription[],
  categoryId: string | null,
): Set<string> {
  const ids = new Set<string>();
  for (const sub of subscriptions) {
    if (!sub.id) continue;
    if (categoryId && sub.categoryId !== categoryId) continue;
    ids.add(sub.id);
  }
  return ids;
}

function buildSpending(
  spent: number,
  amount: number,
  windowStart: Date,
  windowEnd: Date,
): BudgetSpending {
  const remaining = round2(amount - spent);
  const progress = amount > 0 ? round4(spent / amount) : 0;
  return {
    spent: round2(spent),
    remaining,
    progress,
    isOverBudget: spent > amount,
    windowStart,
    windowEnd,
  };
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

function round4(n: number): number {
  return Math.round(n * 10000) / 10000;
}
