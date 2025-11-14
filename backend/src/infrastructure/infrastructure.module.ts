import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EUser } from './database/entities/user.entity';
import { ContractEntity } from './database/entities/contract.entity';
import { RoleLimitEntity } from 'src/infrastructure/database/entities/role-limit.entity';
import { RgpdExportEntity } from './database/entities/rgpd-export.entity';
import { RoleEntity } from './database/entities/role.entity';
import { UserPreferenceEntity } from './database/entities/user-preference.entity';
import { UserSessionEntity } from './database/entities/user-session.entity';
@Module({
  imports: [TypeOrmModule.forFeature([EUser, ContractEntity, RoleLimitEntity, RgpdExportEntity, RoleEntity, UserPreferenceEntity, UserSessionEntity])],
  providers: [],
  exports: [],
})
export class InfrastructureModule {}
