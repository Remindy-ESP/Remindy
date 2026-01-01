import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  Req,
  Res,
  UseGuards,
  HttpStatus,
  ParseUUIDPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import type { Response, Request } from 'express';
import { JwtAuthGuard } from 'src/modules/auth/presentation/guards/jwt-auth.guard';
import { RolesGuard } from 'src/modules/auth/presentation/guards/roles.guard';
import { Roles } from 'src/modules/auth/presentation/decorators/roles.decorator';
import { Role } from 'src/modules/auth/domain/value-objects/role.enum';
import { MfaRequiredGuard } from '../guards/mfa-required.guard';

// Use Cases
import { CreateAuditLogUseCase } from '../../application/use-cases/create-audit-log.use-case';
import { FindAllAuditLogsUseCase } from '../../application/use-cases/find-all-audit-logs.use-case';
import { FindAuditLogByIdUseCase } from '../../application/use-cases/find-audit-log-by-id.use-case';
import { GetAuditStatsUseCase } from '../../application/use-cases/get-audit-stats.use-case';
import { ExportAuditLogsUseCase } from '../../application/use-cases/export-audit-logs.use-case';

// DTOs
import { CreateAuditLogRequestDto } from '../dto/create-audit-log.request.dto';
import {
  AuditLogFilterRequestDto,
  ExportAuditLogsRequestDto,
  AuditStatsRequestDto,
} from '../dto/audit-log-filter.request.dto';
import { AuditLogResponseDto, PaginatedAuditLogsResponseDto } from '../dto/audit-log.response.dto';
import { AuditStatsResponseDto } from '../dto/audit-stats.response.dto';

interface RequestWithUser extends Request {
  user?: {
    userId: string;
    role?: string;
  };
}

@ApiTags('Audit')
@ApiBearerAuth('access-token')
@Controller('audit')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.USER_ADMIN, Role.SUPER_ADMIN)
export class AuditController {
  constructor(
    private readonly createAuditLogUseCase: CreateAuditLogUseCase,
    private readonly findAllAuditLogsUseCase: FindAllAuditLogsUseCase,
    private readonly findAuditLogByIdUseCase: FindAuditLogByIdUseCase,
    private readonly getAuditStatsUseCase: GetAuditStatsUseCase,
    private readonly exportAuditLogsUseCase: ExportAuditLogsUseCase,
  ) {}

  @Post('create')
  @ApiOperation({ summary: 'Create a manual audit log entry' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Audit log created successfully',
    type: AuditLogResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid input data',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized - JWT required',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Forbidden - Admin role required',
  })
  async create(
    @Req() req: RequestWithUser,
    @Body() dto: CreateAuditLogRequestDto,
  ): Promise<AuditLogResponseDto> {
    const actorUserId = req.user?.userId ?? null;
    const ipAddress = this.getClientIp(req);
    const userAgent = req.headers['user-agent'] ?? null;

    return this.createAuditLogUseCase.execute({
      actorUserId,
      action: dto.action,
      resourceType: dto.resourceType,
      resourceId: dto.resourceId,
      before: dto.before,
      after: dto.after,
      ipAddress,
      userAgent,
      severity: dto.severity,
      success: dto.success,
      errorMessage: dto.errorMessage,
    });
  }

  @Get('logs')
  @UseGuards(MfaRequiredGuard)
  @ApiOperation({ summary: 'Get paginated list of audit logs with filters' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'List of audit logs',
    type: PaginatedAuditLogsResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized - JWT required',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Forbidden - Admin role and MFA required',
  })
  async findAll(@Query() filter: AuditLogFilterRequestDto): Promise<PaginatedAuditLogsResponseDto> {
    return this.findAllAuditLogsUseCase.execute({
      actorUserId: filter.actorUserId,
      action: filter.action,
      resourceType: filter.resourceType,
      resourceId: filter.resourceId,
      severity: filter.severity,
      success: filter.success,
      dateFrom: filter.dateFrom ? new Date(filter.dateFrom) : undefined,
      dateTo: filter.dateTo ? new Date(filter.dateTo) : undefined,
      search: filter.search,
      page: filter.page,
      limit: filter.limit,
      sortBy: filter.sortBy,
      sortOrder: filter.sortOrder,
    });
  }

  @Get('stats')
  @UseGuards(MfaRequiredGuard)
  @ApiOperation({ summary: 'Get audit statistics for a period' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Audit statistics',
    type: AuditStatsResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized - JWT required',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Forbidden - Admin role and MFA required',
  })
  async getStats(@Query() query: AuditStatsRequestDto): Promise<AuditStatsResponseDto> {
    // Default to last 30 days if not specified
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    return this.getAuditStatsUseCase.execute({
      dateFrom: query.dateFrom ? new Date(query.dateFrom) : thirtyDaysAgo,
      dateTo: query.dateTo ? new Date(query.dateTo) : now,
    });
  }

  @Get('export')
  @UseGuards(MfaRequiredGuard)
  @ApiOperation({ summary: 'Export audit logs as CSV or JSON' })
  @ApiQuery({ name: 'format', enum: ['csv', 'json'], required: false })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Exported audit logs file',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized - JWT required',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Forbidden - Admin role and MFA required',
  })
  async export(@Query() query: ExportAuditLogsRequestDto, @Res() res: Response): Promise<void> {
    const result = await this.exportAuditLogsUseCase.execute({
      format: query.format ?? 'json',
      actorUserId: query.actorUserId,
      action: query.action,
      resourceType: query.resourceType,
      severity: query.severity,
      success: query.success,
      dateFrom: query.dateFrom ? new Date(query.dateFrom) : undefined,
      dateTo: query.dateTo ? new Date(query.dateTo) : undefined,
      search: query.search,
    });

    const filename = `audit-logs-${new Date().toISOString().split('T')[0]}`;
    const extension = query.format === 'csv' ? 'csv' : 'json';

    res.setHeader('Content-Type', result.contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${filename}.${extension}"`);
    res.send(result.data);
  }

  @Get('logs/:id')
  @UseGuards(MfaRequiredGuard)
  @ApiOperation({ summary: 'Get audit log details by ID' })
  @ApiParam({
    name: 'id',
    description: 'Audit log UUID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Audit log details',
    type: AuditLogResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Audit log not found',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized - JWT required',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Forbidden - Admin role and MFA required',
  })
  async findOne(@Param('id', ParseUUIDPipe) id: string): Promise<AuditLogResponseDto> {
    return this.findAuditLogByIdUseCase.execute(id);
  }

  private getClientIp(request: Request): string | null {
    const forwarded = request.headers['x-forwarded-for'];
    if (forwarded) {
      const ips = Array.isArray(forwarded) ? forwarded[0] : forwarded.split(',')[0];
      return ips.trim();
    }

    const realIp = request.headers['x-real-ip'];
    if (realIp) {
      return Array.isArray(realIp) ? realIp[0] : realIp;
    }

    return request.socket?.remoteAddress ?? request.ip ?? null;
  }
}
