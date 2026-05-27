import { Budget } from '../../domain/budget.entity';
import { CreateBudgetDto } from '../dto/create-budget.dto';
import { UpdateBudgetDto } from '../dto/update-budget.dto';
import { BudgetResponseDto } from '../dto/budget-response.dto';
import { BudgetWithSpendingDto } from '../dto/budget-with-spending.dto';
import { CreateBudgetAppDto } from '../../application/dto/create-budget-app.dto';
import { UpdateBudgetAppDto } from '../../application/dto/update-budget-app.dto';
import { BudgetSpending } from '../../application/services/budget.service';

export class BudgetPresentationMapper {
  static toCreateAppDto(dto: CreateBudgetDto, userId: string): CreateBudgetAppDto {
    return {
      userId,
      name: dto.name,
      amount: dto.amount,
      currency: dto.currency.toUpperCase(),
      period: dto.period,
      startDate: new Date(dto.startDate),
      endDate: dto.endDate ? new Date(dto.endDate) : null,
      categoryId: dto.categoryId ?? null,
      subscriptionIds: dto.subscriptionIds ?? [],
      isActive: dto.isActive,
      notes: dto.notes,
    };
  }

  static toUpdateAppDto(dto: UpdateBudgetDto): UpdateBudgetAppDto {
    return {
      name: dto.name,
      amount: dto.amount,
      currency: dto.currency?.toUpperCase(),
      period: dto.period,
      startDate: dto.startDate ? new Date(dto.startDate) : undefined,
      endDate: dto.endDate === undefined ? undefined : dto.endDate ? new Date(dto.endDate) : null,
      categoryId: dto.categoryId,
      subscriptionIds: dto.subscriptionIds,
      isActive: dto.isActive,
      notes: dto.notes,
    };
  }

  static toResponseDto(budget: Budget): BudgetResponseDto {
    const dto = new BudgetResponseDto();
    dto.id = budget.id!;
    dto.name = budget.name;
    dto.amount = budget.amount;
    dto.currency = budget.currency;
    dto.period = budget.period;
    dto.startDate = budget.startDate;
    dto.endDate = budget.endDate ?? null;
    dto.categoryId = budget.categoryId ?? null;
    dto.subscriptionIds = budget.subscriptionIds;
    dto.isActive = budget.isActive;
    dto.notes = budget.notes ?? null;
    dto.createdAt = budget.createdAt!;
    dto.updatedAt = budget.updatedAt!;
    return dto;
  }

  static toResponseDtoArray(budgets: Budget[]): BudgetResponseDto[] {
    return budgets.map(b => this.toResponseDto(b));
  }

  static toWithSpendingDto(budget: Budget, spending: BudgetSpending): BudgetWithSpendingDto {
    const base = this.toResponseDto(budget);
    const dto = new BudgetWithSpendingDto();
    Object.assign(dto, base);
    dto.spent = spending.spent;
    dto.remaining = spending.remaining;
    dto.progress = spending.progress;
    dto.isOverBudget = spending.isOverBudget;
    return dto;
  }
}
