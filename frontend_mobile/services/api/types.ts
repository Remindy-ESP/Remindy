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
  frequency: 'weekly' | 'monthly' | 'quarterly' | 'yearly';
  startDate: string;
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
  frequency: 'weekly' | 'monthly' | 'quarterly' | 'yearly';
  startDate: string;
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
  frequency?: 'weekly' | 'monthly' | 'quarterly' | 'yearly';
  startDate?: string;
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
  status: 'PENDING' | 'COMPLETED' | 'RESCHEDULED';
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
