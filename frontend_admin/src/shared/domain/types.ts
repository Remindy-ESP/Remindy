// --- Enums ---

export enum Role {
  USER_FREEMIUM = 'user_freemium',
  USER_PREMIUM = 'user_premium',
  USER_ADMIN = 'user_admin',
  SUPER_ADMIN = 'super_admin',
}

export enum UserStatus {
  ACTIVE = 'active',
  VERIFIED = 'verified',
  BANNED = 'banned',
  INACTIVE = 'inactive',
}

export enum Severity {
  INFO = 'info',
  WARNING = 'warning',
  CRITICAL = 'critical',
}

export enum AdminPermission {
  DASHBOARD_READ = 'admin.dashboard.read',
  USERS_READ = 'admin.users.read',
  USERS_WRITE = 'admin.users.write',
  SUPPORT_READ = 'admin.support.read',
  SUPPORT_WRITE = 'admin.support.write',
  SUBSCRIPTIONS_READ = 'admin.subscriptions.read',
  SUBSCRIPTIONS_WRITE = 'admin.subscriptions.write',
  AUDIT_READ = 'admin.audit.read',
  SECURITY_READ = 'admin.security.read',
  SECURITY_WRITE = 'admin.security.write',
  RGPD_EXPORT = 'admin.rgpd.export',
  RGPD_DELETE = 'admin.rgpd.delete',
  CLOUD_READ = 'admin.cloud.read',
  CLOUD_WRITE = 'admin.cloud.write',
  RBAC_READ = 'admin.rbac.read',
  RBAC_WRITE = 'admin.rbac.write',
}

// --- DTOs ---

export interface AdminUser {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  role: Role;
  status: UserStatus;
  emailVerified: boolean;
  mfaEnabled: boolean;
  lastLoginAt: string | null;
  createdAt: string;
}

export interface AdminUserDetail extends AdminUser {
  failedLoginCount: number;
  updatedAt: string;
  deletedAt: string | null;
  sessionsCount: number;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
}

export interface AdminMeResponse {
  id: string;
  role: Role;
  mfaEnabled: boolean;
  mfaVerified: boolean;
  permissions: AdminPermission[];
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  userId: string;
}

export interface MfaSetupResponse {
  otpauthUrl: string;
  qrCodeDataUrl: string;
}

export interface MfaVerifyResponse {
  accessToken: string;
}

export interface UserListQuery {
  q?: string;
  role?: Role;
  status?: UserStatus;
  emailVerified?: boolean;
  mfaEnabled?: boolean;
  page?: number;
  limit?: number;
  sortBy?: 'createdAt' | 'lastLoginAt' | 'email' | 'status';
  sortDir?: 'ASC' | 'DESC';
}

// --- Audit ---

export interface AuditLog {
  id: string;
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
  createdAt: string;
}

export interface AuditLogsResponse {
  data: AuditLog[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface AuditLogQuery {
  actorUserId?: string;
  action?: string;
  resourceType?: string;
  resourceId?: string;
  severity?: Severity;
  success?: boolean;
  dateFrom?: string;
  dateTo?: string;
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: 'createdAt' | 'action' | 'severity';
  sortOrder?: 'ASC' | 'DESC';
}

// --- Support ---

export enum SupportTicketStatus {
  OPEN = 'open',
  PENDING_USER = 'pending_user',
  RESOLVED = 'resolved',
  CLOSED = 'closed',
}

export enum SupportTicketPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  URGENT = 'urgent',
}

export enum SupportTicketCategory {
  TECHNICAL = 'technical',
  BILLING = 'billing',
  ACCOUNT = 'account',
  SUBSCRIPTION = 'subscription',
  BUG = 'bug',
  FEATURE_REQUEST = 'feature_request',
  OTHER = 'other',
}

export enum SupportTicketAuthorType {
  USER = 'user',
  ADMIN = 'admin',
  SYSTEM = 'system',
}

export interface SupportTicketUser {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
}

export interface SupportTicket {
  id: string;
  subject: string;
  status: SupportTicketStatus;
  priority: SupportTicketPriority;
  category: SupportTicketCategory | null;
  createdAt: string;
  updatedAt: string;
  lastReplyAt: string | null;
  closedAt: string | null;
  user: SupportTicketUser | null;
  assignedAdmin: SupportTicketUser | null;
}

export interface SupportTicketMessage {
  id: string;
  authorType: SupportTicketAuthorType;
  body: string;
  createdAt: string;
  author: SupportTicketUser | null;
}

export interface SupportTicketDetail extends SupportTicket {
  messages: SupportTicketMessage[];
}

export interface AdminTicketsQuery {
  q?: string;
  status?: SupportTicketStatus;
  priority?: SupportTicketPriority;
  category?: SupportTicketCategory;
  page?: number;
  limit?: number;
  sortBy?: 'createdAt' | 'updatedAt' | 'lastReplyAt' | 'priority' | 'status';
  sortDir?: 'ASC' | 'DESC';
}

export interface AdminReplyTicketRequest {
  message: string;
  status?: SupportTicketStatus;
}

// --- Security ---

export enum SecurityEventType {
  LOGIN_SUCCESS = 'login.success',
  LOGIN_FAILURE = 'login.failure',
  LOGIN_BRUTE_FORCE = 'login.brute_force',
  LOGOUT = 'logout',
  PASSWORD_RESET = 'password.reset',
  ADMIN_USER_BANNED = 'admin.user.banned',
  ADMIN_USER_UNBANNED = 'admin.user.unbanned',
  ADMIN_SESSION_REVOKED = 'admin.session.revoked',
  IP_BLOCKED = 'ip.blocked',
  IP_UNBLOCKED = 'ip.unblocked',
  CSRF_VIOLATION = 'csrf.violation',
}

export interface SecurityLog {
  id: string;
  eventType: SecurityEventType;
  severity: Severity;
  userId: string | null;
  userEmail: string | null;
  ipAddress: string | null;
  userAgent: string | null;
  resource: string | null;
  metadata: Record<string, unknown> | null;
  isSuspicious: boolean;
  createdAt: string;
}

export type SuspiciousEvent = SecurityLog;

export enum BlockReason {
  BRUTE_FORCE = 'brute_force',
  SUSPICIOUS_ACTIVITY = 'suspicious_activity',
  MANUAL = 'manual',
  RATE_LIMIT = 'rate_limit',
  CSRF_ATTACK = 'csrf_attack',
}

export interface BlockedIp {
  id: string;
  ipAddress: string;
  reason: BlockReason;
  notes: string | null;
  blockedUntil: string | null;
  isActive: boolean;
  blockedBy: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface SecurityPolicy {
  id: string;
  maxLoginAttempts: number;
  lockoutDurationMinutes: number;
  sessionTimeoutMinutes: number;
  requireMfaForAdmin: boolean;
  minPasswordLength: number;
  requireUppercase: boolean;
  requireNumbers: boolean;
  requireSpecialChars: boolean;
  passwordExpiryDays: number;
  rateLimitPerMinute: number;
  autoBlockAfterRequests: number;
  autoBlockDurationMinutes: number;
  allowedOrigins: string[];
  createdAt: string;
  updatedAt: string;
}

export interface SecurityStats {
  criticalEventsLast24h: number;
  suspiciousEventsLast24h: number;
  activeBlockedIps: number;
}

export interface SecurityLogQuery {
  eventType?: SecurityEventType;
  severity?: Severity;
  userId?: string;
  ipAddress?: string;
  isSuspicious?: boolean;
  from?: string;
  to?: string;
  page?: number;
  limit?: number;
}

export interface BlockIpRequest {
  ipAddress: string;
  reason: BlockReason;
  notes?: string;
  durationMinutes?: number;
}

export interface UpdateSecurityPolicyRequest {
  maxLoginAttempts?: number;
  lockoutDurationMinutes?: number;
  sessionTimeoutMinutes?: number;
  requireMfaForAdmin?: boolean;
  minPasswordLength?: number;
  requireUppercase?: boolean;
  requireNumbers?: boolean;
  requireSpecialChars?: boolean;
  passwordExpiryDays?: number;
  rateLimitPerMinute?: number;
  autoBlockAfterRequests?: number;
  autoBlockDurationMinutes?: number;
  allowedOrigins?: string[];
}

export interface IpActivity {
  ipAddress: string;
  isBlocked: boolean;
  recentLogs: SecurityLog[];
}

// --- RBAC ---
// `Role` enum (above) is the static role hierarchy used at the auth layer.
// `RbacRole` is the dynamic, admin-managed RBAC entity exposed via /admin/roles.

export interface RbacRole {
  key: string;
  label: string;
  description: string | null;
  createdAt: string;
}

export interface Permission {
  key: string;
}

export interface RoleWithPermissions extends RbacRole {
  isSystem: boolean;
  permissions: string[];
  /** Optional — backend doesn't expose it yet. */
  userCount?: number;
}

export interface CreateRoleRequest {
  key: string;
  label: string;
  description?: string;
}

export interface UpdateRoleRequest {
  label?: string;
  description?: string;
}

export interface RolePermissionResponse {
  key: string;
  permissions: string[];
}

// --- Subscriptions ---

export enum SubscriptionStatus {
  ACTIVE = 'active',
  PAUSED = 'paused',
  CANCELLED = 'cancelled',
  TRIAL = 'trial',
}

export type SubscriptionPlan =
  | 'one-time'
  | 'weekly'
  | 'monthly'
  | 'quarterly'
  | 'yearly';

export interface Subscription {
  id: string;
  userId: string;
  contractId: number | null;
  categoryId: string | null;
  name: string;
  amount: number;
  currency: string;
  frequency: SubscriptionPlan;
  startDate: string;
  endDate: string | null;
  nextDueDate: string;
  trialStartDate: string | null;
  trialEndDate: string | null;
  status: SubscriptionStatus;
  color: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export type SharedSubscription = Subscription;

export interface SubscriptionQuery {
  userId?: string;
  status?: SubscriptionStatus;
  frequency?: SubscriptionPlan;
  name?: string;
  currency?: string;
  amountMin?: number;
  amountMax?: number;
  createdFrom?: string;
  createdTo?: string;
  sortBy?: 'createdAt' | 'name' | 'amount' | 'nextDueDate' | 'status';
  sortDir?: 'ASC' | 'DESC';
  page?: number;
  limit?: number;
}

// --- Cloud / Documents ---

export enum OcrStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
}

export interface AdminDocument {
  id: string;
  userId: string;
  subscriptionId: string | null;
  contractId: number | null;
  folderId: string | null;
  filename: string;
  r2Key: string;
  r2Bucket: string;
  fileHash: string;
  fileSize: number;
  mimeType: string;
  ocrStatus: OcrStatus;
  ocrError: string | null;
  uploadedAt: string;
  updatedAt: string;
  parsedProvider: string | null;
  parsedAmount: number | null;
  parsedCurrency: string | null;
  parsedDate: string | null;
  parsedFrequency: string | null;
  parsedCategory: string | null;
  parsingConfidence: number | null;
}

export interface AdminDocumentQuery {
  userId?: string;
  subscriptionId?: string;
  ocrStatus?: OcrStatus;
  filename?: string;
  mimeType?: string;
  uploadedFrom?: string;
  uploadedTo?: string;
  sortBy?: 'uploadedAt' | 'filename' | 'fileSize' | 'ocrStatus';
  sortDir?: 'ASC' | 'DESC';
  page?: number;
  limit?: number;
}

// --- RGPD ---

export enum RgpdExportStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
  EXPIRED = 'expired',
}

export type RgpdExportRequestedBy = 'user' | 'admin' | 'automated';
export type RgpdExportFormat = 'json' | 'csv';

export interface RgpdExport {
  id: string;
  userId: string;
  status: RgpdExportStatus;
  format: RgpdExportFormat;
  fileR2Key: string | null;
  fileSize: number | null;
  signedUrl: string | null;
  expiresAt: string | null;
  errorMessage: string | null;
  requestedBy: RgpdExportRequestedBy;
  ipAddress: string | null;
  createdAt: string;
  completedAt: string | null;
}

export interface RgpdExportQuery {
  userId?: string;
  status?: RgpdExportStatus;
  requestedBy?: RgpdExportRequestedBy;
  page?: number;
  limit?: number;
}

// --- Dashboard overview (aggregated KPIs) ---

export interface DashboardUsersStats {
  total: number;
  new24h: number;
  new7d: number;
  new30d: number;
  active7d: number;
  banned: number;
  emailVerifiedRate: number;
  mfaEnabledRate: number;
}

export interface DashboardSubscriptionsStats {
  total: number;
  active: number;
  inactive: number;
  expiringIn7d: number;
  estimatedMrr: number;
  byFrequency: Record<string, number>;
}

export interface DashboardSupportStats {
  open: number;
  pendingUser: number;
  resolved: number;
  closed: number;
  highPriorityOpen: number;
  staleOver24h: number;
  created24h: number;
}

export interface DashboardCloudStats {
  totalDocuments: number;
  totalStorageBytes: number;
  totalStorageFormatted: string;
  ocrPending: number;
  ocrProcessing: number;
  ocrCompleted: number;
  ocrFailed: number;
  ocrFailureRate: number;
  uploaded24h: number;
}

export interface DashboardSecurityStats {
  loginFailures24h: number;
  suspicious24h: number;
  critical24h: number;
  csrfViolations24h: number;
  activeBlockedIps: number;
}

export interface DashboardJobsStats {
  waiting: number;
  active: number;
  completed: number;
  failed: number;
  delayed: number;
  errorRate: number;
}

export interface DashboardOverview {
  generatedAt: string;
  users: DashboardUsersStats;
  subscriptions: DashboardSubscriptionsStats;
  support: DashboardSupportStats;
  cloud: DashboardCloudStats;
  security: DashboardSecurityStats;
  jobs: DashboardJobsStats;
}
