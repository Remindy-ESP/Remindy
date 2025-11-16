import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { IReminderRepository } from '../../application/ports/reminder-repository.interface';
import { Reminder } from '../../domain/reminder.entity';
import { ReminderEntity } from '../persistence/reminder.entity';
import { ReminderMapper } from '../mappers/reminder.mapper';
import { ReminderFilterAppDto } from '../../application/dto/reminder-filter-app.dto';

@Injectable()
export class ReminderRepository implements IReminderRepository {
  constructor(
    @InjectRepository(ReminderEntity)
    private readonly repository: Repository<ReminderEntity>,
  ) {}

  async findById(id: string): Promise<Reminder | null> {
    const entity = await this.repository.findOne({
      where: { id, deletedAt: IsNull() },
    });

    if (!entity) {
      return null;
    }

    return ReminderMapper.toDomain(entity);
  }

  async findAll(filters: ReminderFilterAppDto): Promise<Reminder[]> {
    const queryBuilder = this.repository.createQueryBuilder('reminder');

    // Only return non-deleted reminders
    queryBuilder.andWhere('reminder.deletedAt IS NULL');

    // Filter by userId (required)
    queryBuilder.andWhere('reminder.userId = :userId', { userId: filters.userId });

    if (filters.subscriptionId) {
      queryBuilder.andWhere('reminder.subscriptionId = :subscriptionId', {
        subscriptionId: filters.subscriptionId,
      });
    }

    if (filters.type) {
      queryBuilder.andWhere('reminder.type = :type', { type: filters.type });
    }

    if (filters.enabled !== undefined) {
      queryBuilder.andWhere('reminder.enabled = :enabled', { enabled: filters.enabled });
    }

    // Sorting
    const sort = filters.sort ?? 'created_at:desc';
    const [field, order] = sort.split(':');
    const orderField = field === 'created_at' ? 'reminder.createdAt' : 'reminder.updatedAt';
    const orderDirection = order.toUpperCase() as 'ASC' | 'DESC';
    queryBuilder.orderBy(orderField, orderDirection);

    // Limit
    if (filters.limit) {
      queryBuilder.limit(filters.limit);
    }

    const entities = await queryBuilder.getMany();
    return ReminderMapper.toDomainArray(entities);
  }

  async save(reminder: Reminder): Promise<Reminder> {
    const entity = ReminderMapper.toPersistence(reminder);
    const saved = await this.repository.save(entity);
    return ReminderMapper.toDomain(saved);
  }

  async update(id: string, reminder: Reminder): Promise<Reminder | null> {
    const existing = await this.repository.findOne({
      where: { id, deletedAt: IsNull() },
    });

    if (!existing) {
      return null;
    }

    const entity = ReminderMapper.toPersistence(reminder);
    entity.id = id;

    const updated = await this.repository.save(entity);
    return ReminderMapper.toDomain(updated);
  }

  async delete(id: string): Promise<void> {
    await this.repository.softDelete(id);
  }
}
