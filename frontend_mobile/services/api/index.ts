/**
 * API Services Index
 * Central export point for all API services
 */

// Export API client
export { default as apiClient } from './client';
export { apiClient as client } from './client';

// Export services
export { default as authService } from './auth.service';
export { default as categoryService } from './category.service';
export { default as subscriptionService } from './subscription.service';
export { default as userService } from './user.service';
export { default as eventService } from './event.service';
export { default as documentService } from './document.service';
export { default as folderService } from './folder.service';
export { default as storageService } from './storage.service';

// Export types
export * from './types';

// Export utilities
export * from './utils';
