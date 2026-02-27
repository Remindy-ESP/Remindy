import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable, tap, catchError, throwError } from 'rxjs';
import { Request } from 'express';
import { AUDIT_KEY, AuditConfig } from '../decorators/audit.decorator';
import { CreateAuditLogUseCase } from '../../application/use-cases/create-audit-log.use-case';
import { Severity } from '../../domain/enums/severity.enum';

interface RequestWithUser extends Request {
  user?: {
    userId: string;
    role?: string;
  };
}

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(
    private readonly reflector: Reflector,
    private readonly createAuditLogUseCase: CreateAuditLogUseCase,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const auditConfig = this.reflector.get<AuditConfig>(AUDIT_KEY, context.getHandler());

    // If no @Audit decorator, skip
    if (!auditConfig) {
      return next.handle();
    }

    const request = context.switchToHttp().getRequest<RequestWithUser>();
    const actorUserId = request.user?.userId ?? null;

    // Extract resource ID from params or body
    const resourceId = this.extractResourceId(request, auditConfig);

    // Capture request context
    const ipAddress = this.getClientIp(request);
    const userAgent = request.headers['user-agent'] ?? null;

    // Capture before state (request body for mutations)
    const before = this.captureBeforeState(request);

    return next.handle().pipe(
      tap(response => {
        // Success: capture after state and log
        const after = this.captureAfterState(response);

        this.createAuditLog({
          actorUserId,
          action: auditConfig.action,
          resourceType: auditConfig.resourceType,
          resourceId,
          before,
          after,
          ipAddress,
          userAgent,
          severity: auditConfig.severity ?? Severity.INFO,
          success: true,
          errorMessage: null,
        });
      }),
      catchError(error => {
        // Error: log with success=false
        this.createAuditLog({
          actorUserId,
          action: auditConfig.action,
          resourceType: auditConfig.resourceType,
          resourceId,
          before,
          after: null,
          ipAddress,
          userAgent,
          severity: auditConfig.severity ?? Severity.WARNING,
          success: false,
          errorMessage: error instanceof Error ? error.message : String(error),
        });

        return throwError(() => error as Error);
      }),
    );
  }

  private extractResourceId(request: Request, config: AuditConfig): string | null {
    // Try route param first
    if (config.resourceIdParam && request.params[config.resourceIdParam]) {
      const param = request.params[config.resourceIdParam];
      return Array.isArray(param) ? param[0] : param;
    }

    // Try body field
    if (config.resourceIdBody && request.body?.[config.resourceIdBody]) {
      return String(request.body[config.resourceIdBody]);
    }

    return null;
  }

  private getClientIp(request: Request): string | null {
    // Check for forwarded IP (behind proxy)
    const forwarded = request.headers['x-forwarded-for'];
    if (forwarded) {
      const ips = Array.isArray(forwarded) ? forwarded[0] : forwarded.split(',')[0];
      return ips.trim();
    }

    // Check for real IP header
    const realIp = request.headers['x-real-ip'];
    if (realIp) {
      return Array.isArray(realIp) ? realIp[0] : realIp;
    }

    // Fall back to socket address
    return request.socket?.remoteAddress ?? request.ip ?? null;
  }

  private captureBeforeState(request: Request): Record<string, unknown> | null {
    // For POST/PUT/PATCH, capture the request body
    if (['POST', 'PUT', 'PATCH'].includes(request.method) && request.body) {
      return this.sanitizeForAudit(request.body as Record<string, unknown>);
    }

    // For DELETE, capture route params
    if (request.method === 'DELETE' && Object.keys(request.params).length > 0) {
      return { params: request.params };
    }

    return null;
  }

  private captureAfterState(response: unknown): Record<string, unknown> | null {
    if (!response) {
      return null;
    }

    if (typeof response === 'object') {
      return this.sanitizeForAudit(response as Record<string, unknown>);
    }

    return { result: response };
  }

  private sanitizeForAudit(data: Record<string, unknown>): Record<string, unknown> {
    const sensitiveFields = [
      'password',
      'passwordHash',
      'token',
      'accessToken',
      'refreshToken',
      'secret',
      'mfaSecret',
      'apiKey',
    ];

    const sanitized: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(data)) {
      if (sensitiveFields.some(field => key.toLowerCase().includes(field.toLowerCase()))) {
        sanitized[key] = '[REDACTED]';
      } else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        sanitized[key] = this.sanitizeForAudit(value as Record<string, unknown>);
      } else {
        sanitized[key] = value;
      }
    }

    return sanitized;
  }

  private createAuditLog(params: {
    actorUserId: string | null;
    action: string;
    resourceType: string;
    resourceId: string | null;
    before: Record<string, unknown> | null;
    after: Record<string, unknown> | null;
    ipAddress: string | null;
    userAgent: string | null;
    severity: Severity;
    success: boolean;
    errorMessage: string | null;
  }): void {
    // Fire and forget - don't await, don't block the response
    this.createAuditLogUseCase.execute(params).catch(err => {
      // Log error but don't fail the request
      console.error('Failed to create audit log:', err);
    });
  }
}
