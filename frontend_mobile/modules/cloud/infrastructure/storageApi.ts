import apiClient from '@/shared/infrastructure/apiClient';
import type { StorageQuota } from '@/services/api/types';

class StorageService {
  async getQuota(): Promise<StorageQuota> {
    const response = await apiClient.get<StorageQuota>('/storage/quota');
    return response.data;
  }
}

const storageService = new StorageService();
export { storageService };
export default storageService;
