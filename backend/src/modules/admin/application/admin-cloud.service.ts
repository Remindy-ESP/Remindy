import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Role } from 'src/modules/auth/domain/value-objects/role.enum';
import { permissionsForRole } from '../presentation/permissions/admin-permissions.map';
import { AdminPermission, AdminPermissions } from '../presentation/permissions/admin.permissions';
import { SubscriptionEntity } from 'src/modules/subscription/infrastructure/persistence/subscription.entity';
import { ReprocessOcrUseCase } from 'src/modules/document/application/use-cases/reprocess-ocr.use-case';
import { AdminDocumentsQueryDto } from '../presentation/dto/admin-documents-query.dto';
import { AdminSubscriptionsQueryDto } from '../presentation/dto/admin-subscriptions-query.dto';
import { UpdateSharedSubscriptionDto } from '../presentation/dto/update-shared-subscription.dto';
import { DocumentEntity } from 'src/modules/document/infrastructure/persistence/document.entity';

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

  async listSubscriptions(actor: { role: Role }, query: AdminSubscriptionsQueryDto) {
    this.assertPermission(actor.role, AdminPermissions.SUBSCRIPTIONS_READ);

    const qb = this.subscriptionsRepo.createQueryBuilder('s').where('s.deletedAt IS NULL');

    if (query.userId) qb.andWhere('s.userId = :userId', { userId: query.userId });
    if (query.status) qb.andWhere('s.status = :status', { status: query.status });
    if (query.frequency) qb.andWhere('s.frequency = :frequency', { frequency: query.frequency });
    if (query.currency) qb.andWhere('s.currency = :currency', { currency: query.currency });
    if (query.name) qb.andWhere('s.name ILIKE :name', { name: `%${query.name}%` });
    if (query.amountMin !== undefined)
      qb.andWhere('s.amount >= :amountMin', { amountMin: query.amountMin });
    if (query.amountMax !== undefined)
      qb.andWhere('s.amount <= :amountMax', { amountMax: query.amountMax });
    if (query.createdFrom)
      qb.andWhere('s.createdAt >= :createdFrom', { createdFrom: new Date(query.createdFrom) });
    if (query.createdTo)
      qb.andWhere('s.createdAt <= :createdTo', { createdTo: new Date(query.createdTo) });

    qb.orderBy(`s.${query.sortBy ?? 'createdAt'}`, query.sortDir ?? 'DESC')
      .skip((query.page - 1) * query.limit)
      .take(query.limit);

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
    if (!sub) throw new NotFoundException('Subscription not found');

    Object.assign(sub, dto);
    return this.subscriptionsRepo.save(sub);
  }

  async listDocuments(actor: { role: Role }, query: AdminDocumentsQueryDto) {
    this.assertPermission(actor.role, AdminPermissions.CLOUD_READ);

    const qb = this.documentsRepo.createQueryBuilder('d').where('d.deletedAt IS NULL');

    if (query.userId) qb.andWhere('d.userId = :userId', { userId: query.userId });
    if (query.subscriptionId)
      qb.andWhere('d.subscriptionId = :subId', { subId: query.subscriptionId });
    if (query.ocrStatus) qb.andWhere('d.ocrStatus = :ocrStatus', { ocrStatus: query.ocrStatus });
    if (query.mimeType) qb.andWhere('d.mimeType = :mimeType', { mimeType: query.mimeType });
    if (query.filename)
      qb.andWhere('d.filename ILIKE :filename', { filename: `%${query.filename}%` });
    if (query.uploadedFrom)
      qb.andWhere('d.uploadedAt >= :uploadedFrom', { uploadedFrom: new Date(query.uploadedFrom) });
    if (query.uploadedTo)
      qb.andWhere('d.uploadedAt <= :uploadedTo', { uploadedTo: new Date(query.uploadedTo) });

    qb.orderBy(`d.${query.sortBy ?? 'uploadedAt'}`, query.sortDir ?? 'DESC')
      .skip((query.page - 1) * query.limit)
      .take(query.limit);
    const sortField =
      query.sortBy === 'fileSize'
        ? `CAST(d.fileSize AS integer)`
        : `d.${query.sortBy ?? 'uploadedAt'}`;

    qb.orderBy(sortField, query.sortDir ?? 'DESC');

    const [items, total] = await qb.getManyAndCount();
    return { items, total, page: query.page, limit: query.limit };
  }

  async reprocessOcr(actor: { role: Role }, documentId: string, force: boolean) {
    this.assertPermission(actor.role, AdminPermissions.CLOUD_WRITE);

    const doc = await this.documentsRepo.findOne({ where: { id: documentId } });
    if (!doc) throw new NotFoundException('Document not found');

    return this.reprocessOcrUseCase.execute(documentId, doc.userId, { force });
  }
}
