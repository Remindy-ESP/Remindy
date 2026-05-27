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

export type ThemePreference = 'light' | 'dark' | 'auto';

export interface UserPreferences {
  userId: string;
  theme: ThemePreference;
  notificationEmail: boolean;
  notificationPush: boolean;
  notificationSms: boolean;
  defaultReminderDelay: number;
  currency: string;
  showOnlineStatus: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateUserPreferencesRequest {
  theme?: ThemePreference;
  notificationEmail?: boolean;
  notificationPush?: boolean;
  notificationSms?: boolean;
  defaultReminderDelay?: number;
  currency?: string;
  showOnlineStatus?: boolean;
}
