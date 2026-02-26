import apiClient from './client';
import type { Folder, CreateFolderRequest, UpdateFolderRequest, FolderFilters } from './types';

class FolderService {
  async createFolder(params: CreateFolderRequest): Promise<Folder> {
    try {
      const response = await apiClient.post<Folder>('/folders', params);
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  async getAllFolders(filters?: FolderFilters): Promise<Folder[]> {
    try {
      const response = await apiClient.get<Folder[]>('/folders', {
        params: filters,
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  async updateFolder(id: string, params: UpdateFolderRequest): Promise<Folder> {
    try {
      const response = await apiClient.put<Folder>(`/folders/${id}`, params);
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  async deleteFolder(id: string): Promise<void> {
    try {
      await apiClient.delete(`/folders/${id}`);
    } catch (error) {
      throw error;
    }
  }

  async moveDocumentToFolder(folderId: string, documentId: string): Promise<void> {
    try {
      await apiClient.post(`/folders/${folderId}/documents/${documentId}`);
    } catch (error) {
      throw error;
    }
  }
}

export default new FolderService();
