import { Inject, Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { Budget } from '../../domain/budget.entity';
import type { IBudgetRepository } from '../ports/budget.repository.interface';
import { BUDGET_REPOSITORY } from '../ports/budget.repository.interface';
import { CreateBudgetAppDto } from '../dto/create-budget-app.dto';
import { UpdateBudgetAppDto } from '../dto/update-budget-app.dto';
import { BudgetFilterAppDto } from '../dto/budget-filter-app.dto';

@Injectable()
export class BudgetService {
  constructor(
    @Inject(BUDGET_REPOSITORY)
    private readonly budgetRepository: IBudgetRepository,
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
}
