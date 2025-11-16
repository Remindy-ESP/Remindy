import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RoleEntity } from '../../infrastructure/database/entities/role.entity';
import { RoleLimitEntity } from '../../infrastructure/database/entities/role-limit.entity';

// Services
import { RoleService } from './application/services/role.service';

// Repositories
import { RoleRepository } from './infrastructure/repositories/role.repository';
import { RoleLimitRepository } from './infrastructure/repositories/role-limit.repository';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      RoleEntity,
      RoleLimitEntity,
    ]),
  ],
  providers: [
    // Services
    RoleService,
    // Repositories
    RoleRepository,
    RoleLimitRepository,
  ],
  exports: [
    RoleService,
    RoleRepository,
    RoleLimitRepository,
  ],
})
export class RolesModule {}
