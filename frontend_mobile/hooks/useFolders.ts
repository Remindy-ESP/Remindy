import { useState } from 'react';
import { folderService } from '@/services/api';
import type { Folder, CreateFolderRequest, UpdateFolderRequest, FolderFilters } from '@/services/api';
import i18n from '@/i18n';

export function useFolders() {
  const [folders, setFolders] = useState<Folder[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchFolders = async (filters?: FolderFilters) => {
    try {
      setLoading(true);
      setError(null);
      const data = await folderService.getAllFolders(filters);
      setFolders(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error fetching folders:', err);
      setError(err instanceof Error ? err.message : i18n.t('errors.foldersLoadFailed'));
    } finally {
      setLoading(false);
    }
  };

  const createFolder = async (params: CreateFolderRequest) => {
    try {
      setLoading(true);
      setError(null);
      const folder = await folderService.createFolder(params);
      setFolders((prev) => [...prev, folder]);
      return folder;
    } catch (err: any) {
      if (err?.response?.status !== 409) {
        console.error('Error creating folder:', err);
        setError(err instanceof Error ? err.message : i18n.t('errors.folderCreateFailed'));
      }
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateFolder = async (id: string, params: UpdateFolderRequest) => {
    try {
      setLoading(true);
      setError(null);
      const updated = await folderService.updateFolder(id, params);
      setFolders((prev) => prev.map((folder) => (folder.id === id ? updated : folder)));
      return updated;
    } catch (err) {
      console.error('Error updating folder:', err);
      setError(err instanceof Error ? err.message : i18n.t('errors.folderUpdateFailed'));
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const deleteFolder = async (id: string) => {
    try {
      setLoading(true);
      setError(null);
      await folderService.deleteFolder(id);
      setFolders((prev) => prev.filter((folder) => folder.id !== id));
    } catch (err) {
      console.error('Error deleting folder:', err);
      setError(err instanceof Error ? err.message : i18n.t('errors.folderDeleteFailed'));
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const moveDocumentToFolder = async (folderId: string, documentId: string) => {
    try {
      setLoading(true);
      setError(null);
      await folderService.moveDocumentToFolder(folderId, documentId);
    } catch (err) {
      console.error('Error moving document:', err);
      setError(err instanceof Error ? err.message : i18n.t('errors.documentMoveFailed'));
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    folders,
    loading,
    error,
    fetchFolders,
    createFolder,
    updateFolder,
    deleteFolder,
    moveDocumentToFolder,
  };
}
