import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RoleLimitOrmEntity } from './infrastructure/role-limit.orm-entity';
import { RoleLimitMapper } from './infrastructure/role-limit.mapper';
import { RoleLimitRepository } from './infrastructure/role-limit.repository';
import { ROLE_LIMIT_REPOSITORY } from './domain/role-limit.repository.interface';
import { RoleLimitService } from './application/role-limit.service';
import { RoleLimitController } from './application/role-limit.controller';

@Module({
  imports: [TypeOrmModule.forFeature([RoleLimitOrmEntity])],
  controllers: [RoleLimitController],
  providers: [
    RoleLimitMapper,
    RoleLimitService,
    {
      provide: ROLE_LIMIT_REPOSITORY,
      useClass: RoleLimitRepository,
    },
  ],
  exports: [ROLE_LIMIT_REPOSITORY, RoleLimitMapper, RoleLimitService],
})
export class RoleLimitModule {}
