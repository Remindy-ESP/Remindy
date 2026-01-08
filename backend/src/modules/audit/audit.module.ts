import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminAuditLogEntity } from 'src/infrastructure/database/entities/admin-audit-log.entity';
import { EUser } from 'src/infrastructure/database/entities/user.entity';
import { AuditController } from './presentation/controllers/audit.controller';

// Domain
import { IAuditLogRepository } from './domain/repositories/audit-log.repository';

// Application
import { IAuditExportService } from './application/ports/audit-export.service';
import { CreateAuditLogUseCase } from './application/use-cases/create-audit-log.use-case';
import { FindAllAuditLogsUseCase } from './application/use-cases/find-all-audit-logs.use-case';
import { FindAuditLogByIdUseCase } from './application/use-cases/find-audit-log-by-id.use-case';
import { GetAuditStatsUseCase } from './application/use-cases/get-audit-stats.use-case';
import { ExportAuditLogsUseCase } from './application/use-cases/export-audit-logs.use-case';

// Infrastructure
import { AuditLogTypeOrmRepository } from './infrastructure/repositories/audit-log-typeorm.repository';
import { AuditLogMapper } from './infrastructure/mappers/audit-log.mapper';
import { AuditExportService } from './infrastructure/services/audit-export.service';

// Presentation
import { AuditInterceptor } from './presentation/interceptors/audit.interceptor';
import { MfaRequiredGuard } from './presentation/guards/mfa-required.guard';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([AdminAuditLogEntity, EUser]),
    forwardRef(() => AuthModule),
  ],
  providers: [
    // Mappers
    AuditLogMapper,

    // Repository
    {
      provide: IAuditLogRepository,
      useClass: AuditLogTypeOrmRepository,
    },

    // Services
    {
      provide: IAuditExportService,
      useClass: AuditExportService,
    },

    // Use Cases
    CreateAuditLogUseCase,
    FindAllAuditLogsUseCase,
    FindAuditLogByIdUseCase,
    GetAuditStatsUseCase,
    ExportAuditLogsUseCase,

    // Interceptors & Guards
    AuditInterceptor,
    MfaRequiredGuard,
  ],
  controllers: [AuditController],
  exports: [TypeOrmModule, IAuditLogRepository, CreateAuditLogUseCase, AuditInterceptor],
})
export class AuditModule {}
