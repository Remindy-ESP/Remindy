import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { SelectQueryBuilder, Repository } from 'typeorm';
import { Role } from 'src/modules/auth/domain/value-objects/role.enum';
import { permissionsForRole } from '../presentation/permissions/admin-permissions.map';
import { AdminPermission, AdminPermissions } from '../presentation/permissions/admin.permissions';
import { SubscriptionEntity } from 'src/modules/subscription/infrastructure/persistence/subscription.entity';
import { ReprocessOcrUseCase } from 'src/modules/document/application/use-cases/reprocess-ocr.use-case';
import { AdminDocumentsQueryDto } from '../presentation/dto/admin-documents-query.dto';
import { AdminSubscriptionsQueryDto } from '../presentation/dto/admin-subscriptions-query.dto';
import { UpdateSharedSubscriptionDto } from '../presentation/dto/update-shared-subscription.dto';
import { DocumentEntity } from 'src/modules/document/infrastructure/persistence/document.entity';

type QueryFilter = [boolean, string, Record<string, unknown>];

@Injectable()
export class AdminCloudService {
  constructor(
    @InjectRepository(SubscriptionEntity)
    private readonly subscriptionsRepo: Repository<SubscriptionEntity>,

    @InjectRepository(DocumentEntity)
    private readonly documentsRepo: Repository<DocumentEntity>,

    private readonly reprocessOcrUseCase: ReprocessOcrUseCase,
  ) {}

  private assertPermission(role: Role, permission: AdminPermission) {
    const perms = permissionsForRole(role);
    if (!perms.includes(permission)) {
      throw new ForbiddenException(`Permission requise : ${permission}`);
    }
  }

  private applyFilters<T extends object>(qb: SelectQueryBuilder<T>, filters: QueryFilter[]) {
    for (const [condition, clause, params] of filters) {
      if (condition) {
        qb.andWhere(clause, params);
      }
    }
  }

  private applyPagination<T extends object>(
    qb: SelectQueryBuilder<T>,
    page: number,
    limit: number,
  ) {
    qb.skip((page - 1) * limit).take(limit);
  }

  async listSubscriptions(actor: { role: Role }, query: AdminSubscriptionsQueryDto) {
    this.assertPermission(actor.role, AdminPermissions.SUBSCRIPTIONS_READ);

    const qb = this.subscriptionsRepo.createQueryBuilder('s').where('s.deletedAt IS NULL');

    const filters: QueryFilter[] = [
      [!!query.userId, 's.userId = :userId', { userId: query.userId }],
      [!!query.status, 's.status = :status', { status: query.status }],
      [!!query.frequency, 's.frequency = :frequency', { frequency: query.frequency }],
      [!!query.currency, 's.currency = :currency', { currency: query.currency }],
      [!!query.name, 's.name ILIKE :name', { name: `%${query.name}%` }],
      [query.amountMin !== undefined, 's.amount >= :amountMin', { amountMin: query.amountMin }],
      [query.amountMax !== undefined, 's.amount <= :amountMax', { amountMax: query.amountMax }],
      [
        !!query.createdFrom,
        's.createdAt >= :createdFrom',
        { createdFrom: new Date(query.createdFrom!) },
      ],
      [!!query.createdTo, 's.createdAt <= :createdTo', { createdTo: new Date(query.createdTo!) }],
    ];

    this.applyFilters(qb, filters);

    const sortableFields: Record<string, string> = {
      createdAt: 's.createdAt',
      amount: 's.amount',
      name: 's.name',
      status: 's.status',
      frequency: 's.frequency',
      currency: 's.currency',
      userId: 's.userId',
    };

    const sortField = sortableFields[query.sortBy ?? 'createdAt'] ?? 's.createdAt';
    const sortDir = query.sortDir ?? 'DESC';

    qb.orderBy(sortField, sortDir).addOrderBy('s.id', 'DESC');

    this.applyPagination(qb, query.page, query.limit);

    const [items, total] = await qb.getManyAndCount();

    return { items, total, page: query.page, limit: query.limit };
  }

  async updateSharedSubscription(
    actor: { role: Role },
    id: string,
    dto: UpdateSharedSubscriptionDto,
  ) {
    this.assertPermission(actor.role, AdminPermissions.CLOUD_WRITE);

    const sub = await this.subscriptionsRepo.findOne({ where: { id } });
    if (!sub) {
      throw new NotFoundException('Subscription not found');
    }

    Object.assign(sub, dto);
    return this.subscriptionsRepo.save(sub);
  }

  async listDocuments(actor: { role: Role }, query: AdminDocumentsQueryDto) {
    this.assertPermission(actor.role, AdminPermissions.CLOUD_READ);

    const qb = this.documentsRepo.createQueryBuilder('d').where('d.deletedAt IS NULL');

    const filters: QueryFilter[] = [
      [!!query.userId, 'd.userId = :userId', { userId: query.userId }],
      [
        !!query.subscriptionId,
        'd.subscriptionId = :subscriptionId',
        { subscriptionId: query.subscriptionId },
      ],
      [!!query.ocrStatus, 'd.ocrStatus = :ocrStatus', { ocrStatus: query.ocrStatus }],
      [!!query.mimeType, 'd.mimeType = :mimeType', { mimeType: query.mimeType }],
      [!!query.filename, 'd.filename ILIKE :filename', { filename: `%${query.filename}%` }],
      [
        !!query.uploadedFrom,
        'd.uploadedAt >= :uploadedFrom',
        { uploadedFrom: new Date(query.uploadedFrom!) },
      ],
      [
        !!query.uploadedTo,
        'd.uploadedAt <= :uploadedTo',
        { uploadedTo: new Date(query.uploadedTo!) },
      ],
    ];

    this.applyFilters(qb, filters);

    const sortableFields: Record<string, string> = {
      uploadedAt: 'd.uploadedAt',
      filename: 'd.filename',
      mimeType: 'd.mimeType',
      ocrStatus: 'd.ocrStatus',
      userId: 'd.userId',
      subscriptionId: 'd.subscriptionId',
      fileSize: 'CAST(d.fileSize AS integer)',
    };

    const sortField = sortableFields[query.sortBy ?? 'uploadedAt'] ?? 'd.uploadedAt';
    const sortDir = query.sortDir ?? 'DESC';

    qb.orderBy(sortField, sortDir).addOrderBy('d.id', 'DESC');

    this.applyPagination(qb, query.page, query.limit);

    const [items, total] = await qb.getManyAndCount();

    return { items, total, page: query.page, limit: query.limit };
  }

  async reprocessOcr(actor: { role: Role }, documentId: string, force: boolean) {
    this.assertPermission(actor.role, AdminPermissions.CLOUD_WRITE);

    const doc = await this.documentsRepo.findOne({ where: { id: documentId } });
    if (!doc) {
      throw new NotFoundException('Document not found');
    }

    return this.reprocessOcrUseCase.execute(documentId, doc.userId, { force });
  }
}
