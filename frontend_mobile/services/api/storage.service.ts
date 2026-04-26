import apiClient from './client';
import type { StorageQuota } from './types';

class StorageService {
  async getQuota(): Promise<StorageQuota> {
    try {
      const response = await apiClient.get<StorageQuota>('/storage/quota');
      return response.data;
    } catch (error) {
      throw error;
    }
  }
}

export default new StorageService();
