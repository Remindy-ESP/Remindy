import { Severity } from '../enums/severity.enum';

export interface AuditLogProps {
  id?: string;
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
  createdAt: Date;
}

export class AuditLog {
  private constructor(private readonly props: AuditLogProps) {}

  // Factory method for creating new audit logs
  static create(params: {
    actorUserId: string | null;
    action: string;
    resourceType: string;
    resourceId?: string | null;
    before?: Record<string, unknown> | null;
    after?: Record<string, unknown> | null;
    ipAddress?: string | null;
    userAgent?: string | null;
    severity?: Severity;
    success?: boolean;
    errorMessage?: string | null;
  }): AuditLog {
    return new AuditLog({
      actorUserId: params.actorUserId,
      action: params.action,
      resourceType: params.resourceType,
      resourceId: params.resourceId ?? null,
      before: params.before ?? null,
      after: params.after ?? null,
      ipAddress: params.ipAddress ?? null,
      userAgent: params.userAgent ?? null,
      severity: params.severity ?? Severity.INFO,
      success: params.success ?? true,
      errorMessage: params.errorMessage ?? null,
      createdAt: new Date(),
    });
  }

  // Factory method for reconstituting from database
  static fromProps(props: AuditLogProps): AuditLog {
    return new AuditLog(props);
  }

  // Getters (audit logs are immutable - no setters)
  getId(): string {
    if (!this.props.id) {
      throw new Error('AuditLog ID is not defined');
    }
    return this.props.id;
  }

  hasId(): boolean {
    return !!this.props.id;
  }

  getActorUserId(): string | null {
    return this.props.actorUserId;
  }

  getAction(): string {
    return this.props.action;
  }

  getResourceType(): string {
    return this.props.resourceType;
  }

  getResourceId(): string | null {
    return this.props.resourceId;
  }

  getBefore(): Record<string, unknown> | null {
    return this.props.before;
  }

  getAfter(): Record<string, unknown> | null {
    return this.props.after;
  }

  getIpAddress(): string | null {
    return this.props.ipAddress;
  }

  getUserAgent(): string | null {
    return this.props.userAgent;
  }

  getSeverity(): Severity {
    return this.props.severity;
  }

  isSuccess(): boolean {
    return this.props.success;
  }

  getErrorMessage(): string | null {
    return this.props.errorMessage;
  }

  getCreatedAt(): Date {
    return this.props.createdAt;
  }

  // Get all props for mapping
  toProps(): AuditLogProps {
    return { ...this.props };
  }
}
