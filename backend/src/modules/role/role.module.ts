import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RoleOrmEntity } from './infrastructure/role.orm-entity';
import { RoleMapper } from './infrastructure/role.mapper';
import { RoleRepository } from './infrastructure/role.repository';
import { ROLE_REPOSITORY } from './domain/role.repository.interface';
import { RoleService } from './application/role.service';
import { RoleController } from './application/role.controller';

@Module({
  imports: [TypeOrmModule.forFeature([RoleOrmEntity])],
  controllers: [RoleController],
  providers: [
    RoleMapper,
    RoleService,
    {
      provide: ROLE_REPOSITORY,
      useClass: RoleRepository,
    },
  ],
  exports: [ROLE_REPOSITORY, RoleMapper, RoleService],
})
export class RoleModule {}
