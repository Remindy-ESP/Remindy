import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminAuditLogEntity } from 'src/infrastructure/database/entities/admin-audit-log.entity';
import { AuditController } from './presentation/controllers/audit.controller';

@Module({
  imports: [TypeOrmModule.forFeature([AdminAuditLogEntity])],
  providers: [],
  controllers: [AuditController],
  exports: [TypeOrmModule],
})
export class AuditModule {}
