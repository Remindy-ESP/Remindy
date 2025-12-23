/**
 * API Types and Interfaces
 */

// Auth Types
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

// User Types
export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateUserRequest {
  firstName?: string;
  lastName?: string;
  email?: string;
}

// Category Types
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

// Subscription Types
export interface Subscription {
  id: string;
  userId: string;
  contractId?: number;
  name: string;
  amount: number; // Backend uses 'amount', not 'price'
  currency: string;
  frequency: 'weekly' | 'monthly' | 'quarterly' | 'yearly'; // Backend uses 'frequency', not 'billingCycle'
  startDate: string;
  nextDueDate: string;
  trialStartDate?: string;
  trialEndDate?: string;
  isTrialActive?: boolean;
  status: 'active' | 'paused' | 'cancelled' | 'trial'; // Backend uses lowercase
  color?: string;
  notes?: string; // Backend uses 'notes', not 'description'
  createdAt: string;
  updatedAt: string;
}

export interface CreateSubscriptionRequest {
  name: string;
  description?: string;
  price: number;
  billingCycle: 'MONTHLY' | 'YEARLY' | 'WEEKLY' | 'DAILY';
  startDate: string;
  endDate?: string;
  categoryId?: string;
  reminderDays?: number;
}

export interface UpdateSubscriptionRequest {
  name?: string;
  description?: string;
  price?: number;
  billingCycle?: 'MONTHLY' | 'YEARLY' | 'WEEKLY' | 'DAILY';
  startDate?: string;
  endDate?: string;
  status?: 'ACTIVE' | 'PAUSED' | 'CANCELLED';
  categoryId?: string;
  reminderDays?: number;
}

// Event Types
export interface Event {
  id: string;
  title: string;
  description?: string;
  dueDate: string;
  status: 'PENDING' | 'COMPLETED' | 'RESCHEDULED';
  subscriptionId: string;
  subscription?: Subscription;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

// API Response wrapper
export interface ApiResponse<T> {
  data: T;
  message?: string;
  statusCode?: number;
}

// Pagination
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}
