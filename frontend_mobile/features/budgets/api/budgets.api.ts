import apiClient from '@/services/api/client';
import {
  Budget,
  BudgetListFilters,
  BudgetWithSpending,
  CreateBudgetInput,
  UpdateBudgetInput,
} from '../types/budget.types';

const BASE_PATH = '/budgets';
const client = apiClient;

function buildParams(filters?: BudgetListFilters): Record<string, string> | undefined {
  if (!filters) return undefined;
  const params: Record<string, string> = {};
  if (filters.isActive !== undefined) params.isActive = String(filters.isActive);
  if (filters.categoryId) params.categoryId = filters.categoryId;
  return Object.keys(params).length > 0 ? params : undefined;
}

export const budgetsApi = {
  async list(filters?: BudgetListFilters): Promise<Budget[]> {
    const response = await client.get<Budget[]>(BASE_PATH, { params: buildParams(filters) });
    return response.data;
  },

  async listWithSpending(filters?: BudgetListFilters): Promise<BudgetWithSpending[]> {
    const response = await client.get<BudgetWithSpending[]>(`${BASE_PATH}/with-spending`, {
      params: buildParams(filters),
    });
    return response.data;
  },

  async getOne(id: string): Promise<Budget> {
    const response = await client.get<Budget>(`${BASE_PATH}/${id}`);
    return response.data;
  },

  async getOneWithSpending(id: string): Promise<BudgetWithSpending> {
    const response = await client.get<BudgetWithSpending>(`${BASE_PATH}/${id}/spending`);
    return response.data;
  },

  async create(input: CreateBudgetInput): Promise<Budget> {
    const response = await client.post<Budget>(BASE_PATH, input);
    return response.data;
  },

  async update(id: string, input: UpdateBudgetInput): Promise<Budget> {
    const response = await client.patch<Budget>(`${BASE_PATH}/${id}`, input);
    return response.data;
  },

  async remove(id: string): Promise<void> {
    await client.delete(`${BASE_PATH}/${id}`);
  },
};
