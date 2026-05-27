import apiClient from '@/shared/infrastructure/apiClient';
import type { Folder, CreateFolderRequest, UpdateFolderRequest, FolderFilters } from '@/services/api/types';

class FolderService {
  async createFolder(params: CreateFolderRequest): Promise<Folder> {
    const response = await apiClient.post<Folder>('/folders', params);
    return response.data;
  }

  async getAllFolders(filters?: FolderFilters): Promise<Folder[]> {
    const response = await apiClient.get<Folder[]>('/folders', {
      params: filters,
    });
    return response.data;
  }

  async updateFolder(id: string, params: UpdateFolderRequest): Promise<Folder> {
    const response = await apiClient.put<Folder>(`/folders/${id}`, params);
    return response.data;
  }

  async deleteFolder(id: string): Promise<void> {
    await apiClient.delete(`/folders/${id}`);
  }

  async moveDocumentToFolder(folderId: string, documentId: string): Promise<void> {
    await apiClient.post(`/folders/${folderId}/documents/${documentId}`);
  }
}

const folderService = new FolderService();
export { folderService };
export default folderService;
