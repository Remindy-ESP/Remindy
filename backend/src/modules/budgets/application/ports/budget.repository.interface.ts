import { Budget } from '../../domain/budget.entity';
import { BudgetFilterAppDto } from '../dto/budget-filter-app.dto';

export interface IBudgetRepository {
  create(budget: Budget): Promise<Budget>;
  findById(id: string): Promise<Budget | null>;
  findAll(filters: BudgetFilterAppDto): Promise<Budget[]>;
  update(id: string, budget: Budget): Promise<Budget | null>;
  delete(id: string): Promise<boolean>;
  softDelete(id: string): Promise<boolean>;
}

export const BUDGET_REPOSITORY = Symbol('IBudgetRepository');
