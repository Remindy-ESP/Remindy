import { Injectable } from '@nestjs/common';
import { RoleLimit } from '../domain/role-limit.entity';
import { RoleLimitOrmEntity } from './role-limit.orm-entity';

@Injectable()
export class RoleLimitMapper {
  toDomain(ormEntity: RoleLimitOrmEntity): RoleLimit {
    return new RoleLimit({
      role: ormEntity.role,
      maxSubscriptions: ormEntity.maxSubscriptions,
      maxDocuments: ormEntity.maxDocuments,
      maxDocumentSizeMb: ormEntity.maxDocumentSizeMb,
      maxRemindersPerSubscription: ormEntity.maxRemindersPerSubscription,
      canExportData: ormEntity.canExportData,
      canUseOcr: ormEntity.canUseOcr,
      createdAt: ormEntity.createdAt,
      updatedAt: ormEntity.updatedAt,
    });
  }

  toOrm(domainEntity: RoleLimit): RoleLimitOrmEntity {
    const ormEntity = new RoleLimitOrmEntity();
    ormEntity.role = domainEntity.getRole();
    ormEntity.maxSubscriptions = domainEntity.getMaxSubscriptions();
    ormEntity.maxDocuments = domainEntity.getMaxDocuments();
    ormEntity.maxDocumentSizeMb = domainEntity.getMaxDocumentSizeMb();
    ormEntity.maxRemindersPerSubscription = domainEntity.getMaxRemindersPerSubscription();
    ormEntity.canExportData = domainEntity.canExport();
    ormEntity.canUseOcr = domainEntity.canOcr();
    ormEntity.createdAt = domainEntity.getCreatedAt();
    ormEntity.updatedAt = domainEntity.getUpdatedAt();
    return ormEntity;
  }
}
