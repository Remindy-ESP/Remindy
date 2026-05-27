import apiClient from '@/shared/infrastructure/apiClient';
import type { StorageQuota } from '@/services/api/types';

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
