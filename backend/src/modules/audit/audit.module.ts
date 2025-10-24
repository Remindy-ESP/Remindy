import { Module } from '@nestjs/common';
import { AuditController } from './presentation/controllers/audit.controller';

@Module({
  providers: [],
  controllers: [AuditController],
})
export class AuditModule {}
