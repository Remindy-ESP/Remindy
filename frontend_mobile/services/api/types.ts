/**
 * API Types and Interfaces
 */

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
  user: User;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface User {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  photoR2Key?: string;
  photoUrl?: string;
  role: string;
  status: string;
  timezone: string;
  language: string;
  emailVerified: boolean;
  createdAt: string;
}

export interface UpdateUserRequest {
  firstName?: string;
  lastName?: string;
  phone?: string;
  language?: string;
  timezone?: string;
  photoR2Key?: string;
}

export interface UploadUserPhotoFile {
  uri: string;
  name: string;
  type: string;
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

// Event Types
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

export interface ApiResponse<T> {
  data: T;
  message?: string;
  statusCode?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
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
  totalFormatted: string;
  usedFormatted: string;
  availableFormatted: string;
}
