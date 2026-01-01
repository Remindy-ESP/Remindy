/**
 * API Utility Functions
 */

import { AxiosError } from 'axios';

/**
 * Backend error response structure
 */
interface BackendErrorResponse {
  message?: string | string[];
  error?: string;
  statusCode?: number;
}

/**
 * Extract error message from backend response
 * Handles both string and array messages from NestJS ValidationPipe
 */
export function getErrorMessage(error: unknown, defaultMessage = 'An error occurred'): string {
  if (!error) return defaultMessage;

  // Handle Axios errors
  if (error && typeof error === 'object' && 'response' in error) {
    const axiosError = error as AxiosError<BackendErrorResponse>;
    const data = axiosError.response?.data;

    if (data?.message) {
      // Handle array of messages (from ValidationPipe)
      if (Array.isArray(data.message)) {
        return data.message.join(', ');
      }
      // Handle string message
      if (typeof data.message === 'string') {
        return data.message;
      }
    }

    // Fallback to error field
    if (data?.error && typeof data.error === 'string') {
      return data.error;
    }
  }

  // Handle standard Error objects
  if (error instanceof Error) {
    return error.message;
  }

  // Fallback to default message
  return defaultMessage;
}

/**
 * Check if error is a network error (no response from server)
 */
export function isNetworkError(error: unknown): boolean {
  if (error && typeof error === 'object' && 'response' in error) {
    const axiosError = error as AxiosError;
    return !axiosError.response;
  }
  return false;
}

/**
 * Get HTTP status code from error
 */
export function getErrorStatusCode(error: unknown): number | null {
  if (error && typeof error === 'object' && 'response' in error) {
    const axiosError = error as AxiosError;
    return axiosError.response?.status ?? null;
  }
  return null;
}
