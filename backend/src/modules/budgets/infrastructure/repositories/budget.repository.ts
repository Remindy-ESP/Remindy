import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { IBudgetRepository } from '../../application/ports/budget.repository.interface';
import { Budget } from '../../domain/budget.entity';
import { BudgetEntity } from '../persistence/budget.entity';
import { BudgetMapper } from '../mappers/budget.mapper';
import { BudgetFilterAppDto } from '../../application/dto/budget-filter-app.dto';

@Injectable()
export class BudgetRepository implements IBudgetRepository {
  constructor(
    @InjectRepository(BudgetEntity)
    private readonly repository: Repository<BudgetEntity>,
  ) {}

  async create(budget: Budget): Promise<Budget> {
    const entity = BudgetMapper.toPersistence(budget);
    const saved = await this.repository.save(entity);
    return BudgetMapper.toDomain(saved);
  }

  async findById(id: string): Promise<Budget | null> {
    const entity = await this.repository.findOne({ where: { id } });
    if (!entity) {
      return null;
    }
    return BudgetMapper.toDomain(entity);
  }

  async findAll(filters: BudgetFilterAppDto): Promise<Budget[]> {
    const qb = this.repository.createQueryBuilder('budget');
    qb.where('budget.userId = :userId', { userId: filters.userId });

    if (filters.isActive !== undefined) {
      qb.andWhere('budget.isActive = :isActive', { isActive: filters.isActive });
    }
    if (filters.categoryId) {
      qb.andWhere('budget.categoryId = :categoryId', { categoryId: filters.categoryId });
    }

    qb.orderBy('budget.createdAt', 'DESC');
    const entities = await qb.getMany();
    return BudgetMapper.toDomainArray(entities);
  }

  async update(id: string, budget: Budget): Promise<Budget | null> {
    const existing = await this.repository.findOne({ where: { id } });
    if (!existing) {
      return null;
    }
    const entity = BudgetMapper.toPersistence(budget);
    entity.id = id;
    const updated = await this.repository.save(entity);
    return BudgetMapper.toDomain(updated);
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.repository.delete(id);
    return (result.affected ?? 0) > 0;
  }

  async softDelete(id: string): Promise<boolean> {
    const result = await this.repository.softDelete(id);
    return (result.affected ?? 0) > 0;
  }
}
