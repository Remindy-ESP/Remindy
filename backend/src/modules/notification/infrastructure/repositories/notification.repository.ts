import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { INotificationRepository } from '../../application/ports/notification-repository.interface';
import { Notification } from '../../domain/notification.entity';
import { NotificationEntity } from '../persistence/notification.entity';
import { NotificationMapper } from '../mappers/notification.mapper';
import { NotificationFilterAppDto } from '../../application/dto/notification-filter-app.dto';

@Injectable()
export class NotificationRepository implements INotificationRepository {
  constructor(
    @InjectRepository(NotificationEntity)
    private readonly repository: Repository<NotificationEntity>,
  ) {}

  async findById(id: string): Promise<Notification | null> {
    const entity = await this.repository.findOne({
      where: { id },
    });

    if (!entity) {
      return null;
    }

    return NotificationMapper.toDomain(entity);
  }

  async findAll(filters: NotificationFilterAppDto): Promise<Notification[]> {
    const queryBuilder = this.repository.createQueryBuilder('notification');

    // Filter by userId (required)
    queryBuilder.andWhere('notification.userId = :userId', { userId: filters.userId });

    if (filters.type) {
      queryBuilder.andWhere('notification.type = :type', { type: filters.type });
    }

    if (filters.channel) {
      queryBuilder.andWhere('notification.channel = :channel', { channel: filters.channel });
    }

    if (filters.status) {
      queryBuilder.andWhere('notification.status = :status', { status: filters.status });
    }

    if (filters.isRead !== undefined) {
      if (filters.isRead) {
        queryBuilder.andWhere('notification.readAt IS NOT NULL');
      } else {
        queryBuilder.andWhere('notification.readAt IS NULL');
      }
    }

    // Sorting
    const sort = filters.sort ?? 'created_at:desc';
    const [field, order] = sort.split(':');
    const orderField = field === 'created_at' ? 'notification.createdAt' : 'notification.sentAt';
    const orderDirection = order.toUpperCase() as 'ASC' | 'DESC';
    queryBuilder.orderBy(orderField, orderDirection);

    // Limit
    if (filters.limit) {
      queryBuilder.limit(filters.limit);
    }

    const entities = await queryBuilder.getMany();
    return NotificationMapper.toDomainArray(entities);
  }

  async update(id: string, notification: Notification): Promise<Notification | null> {
    const existing = await this.repository.findOne({ where: { id } });

    if (!existing) {
      return null;
    }

    const entity = NotificationMapper.toPersistence(notification);
    entity.id = id;

    const updated = await this.repository.save(entity);
    return NotificationMapper.toDomain(updated);
  }
}
