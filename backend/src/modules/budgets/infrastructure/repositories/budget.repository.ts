import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { IBudgetRepository } from '../../application/ports/budget.repository.interface';
import { Budget } from '../../domain/budget.entity';
import { BudgetEntity } from '../persistence/budget.entity';
import { BudgetMapper } from '../mappers/budget.mapper';
import { BudgetFilterAppDto } from '../../application/dto/budget-filter-app.dto';

const RELATIONS = ['subscriptions'];

@Injectable()
export class BudgetRepository implements IBudgetRepository {
  constructor(
    @InjectRepository(BudgetEntity)
    private readonly repository: Repository<BudgetEntity>,
  ) {}

  async create(budget: Budget): Promise<Budget> {
    const entity = BudgetMapper.toPersistence(budget);
    const saved = await this.repository.save(entity);
    await this.syncSubscriptions(saved.id, budget.subscriptionIds);
    const withRelations = await this.repository.findOne({
      where: { id: saved.id },
      relations: RELATIONS,
    });
    return BudgetMapper.toDomain(withRelations!);
  }

  async findById(id: string): Promise<Budget | null> {
    const entity = await this.repository.findOne({ where: { id }, relations: RELATIONS });
    if (!entity) return null;
    return BudgetMapper.toDomain(entity);
  }

  async findAll(filters: BudgetFilterAppDto): Promise<Budget[]> {
    const qb = this.repository
      .createQueryBuilder('budget')
      .leftJoinAndSelect('budget.subscriptions', 'subscription')
      .where('budget.userId = :userId', { userId: filters.userId });

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
    const existing = await this.repository.findOne({ where: { id }, relations: RELATIONS });
    if (!existing) return null;

    const entity = BudgetMapper.toPersistence(budget);
    entity.id = id;
    await this.repository.save(entity);
    await this.syncSubscriptions(id, budget.subscriptionIds);

    const withRelations = await this.repository.findOne({ where: { id }, relations: RELATIONS });
    return BudgetMapper.toDomain(withRelations!);
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.repository.delete(id);
    return (result.affected ?? 0) > 0;
  }

  async softDelete(id: string): Promise<boolean> {
    const result = await this.repository.softDelete(id);
    return (result.affected ?? 0) > 0;
  }

  private async syncSubscriptions(budgetId: string, newIds: string[]): Promise<void> {
    const existing = await this.repository.findOne({
      where: { id: budgetId },
      relations: RELATIONS,
    });
    const existingIds = existing?.subscriptions?.map(s => s.id) ?? [];
    await this.repository
      .createQueryBuilder()
      .relation(BudgetEntity, 'subscriptions')
      .of(budgetId)
      .addAndRemove(newIds, existingIds);
  }
}
