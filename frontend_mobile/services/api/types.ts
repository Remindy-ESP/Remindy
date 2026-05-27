export {
  User,
  UpdateUserRequest,
  UploadUserPhotoFile,
  ApiResponse,
  PaginatedResponse,
  ThemePreference,
  UserPreferences,
  UpdateUserPreferencesRequest,
} from '@/shared/domain/types';
export type { User as UserType } from '@/shared/domain/types';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: import('@/shared/domain/types').User;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface RequestRgpdExport {
  format?: 'json' | 'csv';
}

export interface RgpdExportResponse {
  id: string;
  userId: string;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'expired';
  format: 'json' | 'csv';
  fileR2Key?: string;
  fileSize?: number;
  signedUrl?: string;
  expiresAt?: string;
  errorMessage?: string;
  requestedBy: 'user' | 'admin' | 'automated';
  createdAt: string;
  completedAt?: string;
}

export interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
  isSystem: boolean;
  userId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCategoryRequest {
  name: string;
  icon: string;
  color: string;
}

export interface UpdateCategoryRequest {
  name?: string;
  icon?: string;
  color?: string;
}

export interface Subscription {
  id: string;
  userId: string;
  contractId?: number;
  categoryId?: string;
  name: string;
  amount: number;
  currency: string;
  frequency: 'one-time' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';
  startDate: string;
  endDate?: string;
  nextDueDate: string;
  trialStartDate?: string;
  trialEndDate?: string;
  isTrialActive?: boolean;
  status: 'active' | 'paused' | 'cancelled' | 'trial';
  color?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  category?: Category;
}

export interface CreateSubscriptionRequest {
  name: string;
  amount: number;
  currency?: string;
  frequency: 'one-time'| 'weekly' | 'monthly' | 'quarterly' | 'yearly';
  startDate: string;
  endDate?: string;
  nextDueDate?: string;
  trialStartDate?: string;
  trialEndDate?: string;
  status?: 'active' | 'paused' | 'cancelled' | 'trial';
  color?: string;
  notes?: string;
  contractId?: number;
  categoryId?: string;
}

export interface UpdateSubscriptionRequest {
  name?: string;
  amount?: number;
  currency?: string;
  frequency?: 'one-time' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';
  startDate?: string;
  endDate?: string;
  nextDueDate?: string;
  trialStartDate?: string;
  trialEndDate?: string;
  status?: 'active' | 'paused' | 'cancelled' | 'trial';
  color?: string;
  notes?: string;
  contractId?: number;
  categoryId?: string;
}

export interface Event {
  id: string;
  title: string;
  description?: string;
  dueDate: string;
  status: 'scheduled' | 'completed' | 'canceled' | 'failed';
  subscriptionId: string;
  subscription?: Subscription;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

export interface Folder {
  id: string;
  userId: string;
  name: string;
  parentId?: string;
  color?: string;
  icon?: string;
  isDefault: boolean;
  documentCount?: number;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
}

export interface CreateFolderRequest {
  name: string;
  parentId?: string;
  color?: string;
  icon?: string;
}

export interface UpdateFolderRequest {
  name?: string;
  color?: string;
  icon?: string;
  parentId?: string;
}

export interface FolderFilters {
  parentId?: string;
  isDefault?: boolean;
  includeDeleted?: boolean;
}

export interface StorageQuota {
  totalBytes: number;
  usedBytes: number;
  availableBytes: number;
  usagePercentage: number;
  documentCount: number;
  maxDocuments: number;
  maxFileSize: number;
  totalFormatted: string;
  usedFormatted: string;
  availableFormatted: string;
  maxFileSizeFormatted: string;
}

export type NotificationType = 'reminder' | 'payment_overdue' | 'subscription_renewed' | 'trial_ending' | 'document_processed' | 'subscription_renewal' | 'document_expiry' | 'system';
export type NotificationChannel = 'email' | 'push' | 'sms';
export type NotificationStatus = 'pending' | 'sent' | 'failed' | 'snoozed';

export interface Notification {
  id: string;
  user_id: string;
  event_id?: string;
  reminder_id?: string;
  type: NotificationType;
  channel: NotificationChannel;
  title: string;
  body: string;
  sent_at?: string;
  read_at?: string;
  status: NotificationStatus;
  snoozed_until?: string;
  error_message?: string;
  metadata?: any;
  created_at: string;
  updated_at?: string;
}

export interface NotificationFilter {
  type?: NotificationType;
  channel?: NotificationChannel;
  status?: NotificationStatus;
  isRead?: boolean;
  limit?: number;
  sort?: string;
}

export interface NotificationResponse {
  data: Notification[];
  meta: {
    total: number;
    page: number;
    limit: number;
  };
}
