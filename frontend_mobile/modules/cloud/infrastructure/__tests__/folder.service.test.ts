import folderService from '@/modules/cloud/infrastructure/folderApi';
import apiClient from '@/shared/infrastructure/apiClient';
import {
  Folder,
  CreateFolderRequest,
  UpdateFolderRequest,
  FolderFilters,
} from '../types';

// Mock the API client
jest.mock('@/shared/infrastructure/apiClient');

const mockApiClient = apiClient as jest.Mocked<typeof apiClient>;

describe('FolderService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const mockFolder: Folder = {
    id: 'folder1',
    userId: 'user1',
    name: 'Work Documents',
    color: '#3498db',
    icon: '💼',
    isDefault: false,
    documentCount: 5,
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
  };

  const mockFolderWithParent: Folder = {
    id: 'folder2',
    userId: 'user1',
    name: 'Invoices',
    parentId: 'folder1',
    color: '#2ecc71',
    icon: '🧾',
    isDefault: false,
    documentCount: 3,
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
  };

  const mockDefaultFolder: Folder = {
    id: 'folder-default',
    userId: 'user1',
    name: 'General',
    isDefault: true,
    documentCount: 10,
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
  };

  const mockFolders: Folder[] = [mockFolder, mockFolderWithParent, mockDefaultFolder];

  describe('createFolder', () => {
    it('creates a new folder with all fields', async () => {
      const createData: CreateFolderRequest = {
        name: 'New Folder',
        color: '#e74c3c',
        icon: '📁',
      };

      const newFolder: Folder = {
        id: 'folder3',
        userId: 'user1',
        ...createData,
        isDefault: false,
        documentCount: 0,
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
      };

      mockApiClient.post.mockResolvedValue({ data: newFolder });

      const result = await folderService.createFolder(createData);

      expect(mockApiClient.post).toHaveBeenCalledWith('/folders', createData);
      expect(result).toEqual(newFolder);
      expect(result.name).toBe('New Folder');
      expect(result.color).toBe('#e74c3c');
    });

    it('creates a folder with just a name', async () => {
      const createData: CreateFolderRequest = { name: 'Simple Folder' };
      const newFolder: Folder = {
        id: 'folder4',
        userId: 'user1',
        name: 'Simple Folder',
        isDefault: false,
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
      };

      mockApiClient.post.mockResolvedValue({ data: newFolder });

      const result = await folderService.createFolder(createData);

      expect(mockApiClient.post).toHaveBeenCalledWith('/folders', createData);
      expect(result.name).toBe('Simple Folder');
    });

    it('creates a subfolder with parentId', async () => {
      const createData: CreateFolderRequest = {
        name: 'Sub Folder',
        parentId: 'folder1',
      };

      const newFolder: Folder = {
        id: 'folder5',
        userId: 'user1',
        name: 'Sub Folder',
        parentId: 'folder1',
        isDefault: false,
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
      };

      mockApiClient.post.mockResolvedValue({ data: newFolder });

      const result = await folderService.createFolder(createData);

      expect(result.parentId).toBe('folder1');
    });

    it('newly created folder has documentCount of 0', async () => {
      const createData: CreateFolderRequest = { name: 'Empty Folder' };
      const newFolder: Folder = {
        id: 'folder6',
        userId: 'user1',
        name: 'Empty Folder',
        isDefault: false,
        documentCount: 0,
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
      };

      mockApiClient.post.mockResolvedValue({ data: newFolder });

      const result = await folderService.createFolder(createData);

      expect(result.documentCount).toBe(0);
    });

    it('throws on duplicate folder name', async () => {
      const error = new Error('Folder name already exists');
      mockApiClient.post.mockRejectedValue(error);

      await expect(
        folderService.createFolder({ name: 'Work Documents' })
      ).rejects.toThrow('Folder name already exists');
    });

    it('throws on validation error for empty name', async () => {
      const error = new Error('Validation failed: name is required');
      mockApiClient.post.mockRejectedValue(error);

      await expect(
        folderService.createFolder({ name: '' })
      ).rejects.toThrow('Validation failed');
    });

    it('throws on unauthorized access', async () => {
      const error = new Error('Unauthorized');
      mockApiClient.post.mockRejectedValue(error);

      await expect(
        folderService.createFolder({ name: 'New Folder' })
      ).rejects.toThrow('Unauthorized');
    });

    it('throws on network error', async () => {
      const error = new Error('Network error');
      mockApiClient.post.mockRejectedValue(error);

      await expect(
        folderService.createFolder({ name: 'New Folder' })
      ).rejects.toThrow('Network error');
    });
  });

  describe('getAllFolders', () => {
    it('fetches all folders without filters', async () => {
      mockApiClient.get.mockResolvedValue({ data: mockFolders });

      const result = await folderService.getAllFolders();

      expect(mockApiClient.get).toHaveBeenCalledWith('/folders', {
        params: undefined,
      });
      expect(result).toEqual(mockFolders);
      expect(result).toHaveLength(3);
    });

    it('fetches folders with parentId filter', async () => {
      const filters: FolderFilters = { parentId: 'folder1' };
      mockApiClient.get.mockResolvedValue({ data: [mockFolderWithParent] });

      const result = await folderService.getAllFolders(filters);

      expect(mockApiClient.get).toHaveBeenCalledWith('/folders', {
        params: { parentId: 'folder1' },
      });
      expect(result).toHaveLength(1);
      expect(result[0].parentId).toBe('folder1');
    });

    it('fetches only default folders', async () => {
      const filters: FolderFilters = { isDefault: true };
      mockApiClient.get.mockResolvedValue({ data: [mockDefaultFolder] });

      const result = await folderService.getAllFolders(filters);

      expect(mockApiClient.get).toHaveBeenCalledWith('/folders', {
        params: { isDefault: true },
      });
      expect(result[0].isDefault).toBe(true);
    });

    it('fetches folders including deleted ones', async () => {
      const deletedFolder: Folder = {
        ...mockFolder,
        id: 'folder-deleted',
        deletedAt: '2024-01-15T00:00:00.000Z',
      };

      const filters: FolderFilters = { includeDeleted: true };
      mockApiClient.get.mockResolvedValue({ data: [...mockFolders, deletedFolder] });

      const result = await folderService.getAllFolders(filters);

      expect(mockApiClient.get).toHaveBeenCalledWith('/folders', {
        params: { includeDeleted: true },
      });
      expect(result).toHaveLength(4);
    });

    it('fetches folders with multiple filters', async () => {
      const filters: FolderFilters = { isDefault: false, includeDeleted: false };
      mockApiClient.get.mockResolvedValue({ data: [mockFolder, mockFolderWithParent] });

      await folderService.getAllFolders(filters);

      expect(mockApiClient.get).toHaveBeenCalledWith('/folders', {
        params: { isDefault: false, includeDeleted: false },
      });
    });

    it('returns empty array when no folders exist', async () => {
      mockApiClient.get.mockResolvedValue({ data: [] });

      const result = await folderService.getAllFolders();

      expect(result).toEqual([]);
    });

    it('throws on network error', async () => {
      const error = new Error('Network error');
      mockApiClient.get.mockRejectedValue(error);

      await expect(folderService.getAllFolders()).rejects.toThrow('Network error');
    });

    it('throws on unauthorized access', async () => {
      const error = new Error('Unauthorized');
      mockApiClient.get.mockRejectedValue(error);

      await expect(folderService.getAllFolders()).rejects.toThrow('Unauthorized');
    });
  });

  describe('updateFolder', () => {
    it('updates folder name', async () => {
      const updateData: UpdateFolderRequest = { name: 'Updated Work Docs' };
      const updatedFolder: Folder = { ...mockFolder, name: 'Updated Work Docs' };

      mockApiClient.put.mockResolvedValue({ data: updatedFolder });

      const result = await folderService.updateFolder('folder1', updateData);

      expect(mockApiClient.put).toHaveBeenCalledWith('/folders/folder1', updateData);
      expect(result.name).toBe('Updated Work Docs');
    });

    it('updates folder color', async () => {
      const updateData: UpdateFolderRequest = { color: '#9b59b6' };
      const updatedFolder: Folder = { ...mockFolder, color: '#9b59b6' };

      mockApiClient.put.mockResolvedValue({ data: updatedFolder });

      const result = await folderService.updateFolder('folder1', updateData);

      expect(result.color).toBe('#9b59b6');
    });

    it('updates folder icon', async () => {
      const updateData: UpdateFolderRequest = { icon: '📂' };
      const updatedFolder: Folder = { ...mockFolder, icon: '📂' };

      mockApiClient.put.mockResolvedValue({ data: updatedFolder });

      const result = await folderService.updateFolder('folder1', updateData);

      expect(result.icon).toBe('📂');
    });

    it('moves folder to a new parent', async () => {
      const updateData: UpdateFolderRequest = { parentId: 'folder-default' };
      const movedFolder: Folder = { ...mockFolder, parentId: 'folder-default' };

      mockApiClient.put.mockResolvedValue({ data: movedFolder });

      const result = await folderService.updateFolder('folder1', updateData);

      expect(result.parentId).toBe('folder-default');
    });

    it('updates multiple fields at once', async () => {
      const updateData: UpdateFolderRequest = {
        name: 'Renamed Folder',
        color: '#1abc9c',
        icon: '🗂️',
      };

      const updatedFolder: Folder = { ...mockFolder, ...updateData };
      mockApiClient.put.mockResolvedValue({ data: updatedFolder });

      const result = await folderService.updateFolder('folder1', updateData);

      expect(result.name).toBe('Renamed Folder');
      expect(result.color).toBe('#1abc9c');
      expect(result.icon).toBe('🗂️');
    });

    it('throws on folder not found', async () => {
      const error = new Error('Folder not found');
      mockApiClient.put.mockRejectedValue(error);

      await expect(
        folderService.updateFolder('invalid-id', { name: 'Test' })
      ).rejects.toThrow('Folder not found');
    });

    it('throws on unauthorized access', async () => {
      const error = new Error('Unauthorized');
      mockApiClient.put.mockRejectedValue(error);

      await expect(
        folderService.updateFolder('folder1', { name: 'Test' })
      ).rejects.toThrow('Unauthorized');
    });

    it('throws on server error', async () => {
      const error = new Error('Internal server error');
      mockApiClient.put.mockRejectedValue(error);

      await expect(
        folderService.updateFolder('folder1', { name: 'Test' })
      ).rejects.toThrow('Internal server error');
    });
  });

  describe('deleteFolder', () => {
    it('deletes a folder by ID', async () => {
      mockApiClient.delete.mockResolvedValue({ data: undefined });

      await folderService.deleteFolder('folder1');

      expect(mockApiClient.delete).toHaveBeenCalledWith('/folders/folder1');
    });

    it('throws on folder not found', async () => {
      const error = new Error('Folder not found');
      mockApiClient.delete.mockRejectedValue(error);

      await expect(folderService.deleteFolder('invalid-id')).rejects.toThrow('Folder not found');
    });

    it('throws when trying to delete default folder', async () => {
      const error = new Error('Cannot delete default folder');
      mockApiClient.delete.mockRejectedValue(error);

      await expect(folderService.deleteFolder('folder-default')).rejects.toThrow('Cannot delete default folder');
    });

    it('throws on unauthorized access', async () => {
      const error = new Error('Unauthorized');
      mockApiClient.delete.mockRejectedValue(error);

      await expect(folderService.deleteFolder('folder1')).rejects.toThrow('Unauthorized');
    });

    it('can delete multiple folders sequentially', async () => {
      mockApiClient.delete.mockResolvedValue({ data: undefined });

      await folderService.deleteFolder('folder1');
      await folderService.deleteFolder('folder2');

      expect(mockApiClient.delete).toHaveBeenCalledTimes(2);
      expect(mockApiClient.delete).toHaveBeenNthCalledWith(1, '/folders/folder1');
      expect(mockApiClient.delete).toHaveBeenNthCalledWith(2, '/folders/folder2');
    });
  });

  describe('moveDocumentToFolder', () => {
    it('moves a document to a folder', async () => {
      mockApiClient.post.mockResolvedValue({ data: undefined });

      await folderService.moveDocumentToFolder('folder1', 'doc1');

      expect(mockApiClient.post).toHaveBeenCalledWith('/folders/folder1/documents/doc1');
    });

    it('moves a document to the default folder', async () => {
      mockApiClient.post.mockResolvedValue({ data: undefined });

      await folderService.moveDocumentToFolder('folder-default', 'doc2');

      expect(mockApiClient.post).toHaveBeenCalledWith('/folders/folder-default/documents/doc2');
    });

    it('throws on folder not found', async () => {
      const error = new Error('Folder not found');
      mockApiClient.post.mockRejectedValue(error);

      await expect(
        folderService.moveDocumentToFolder('invalid-folder', 'doc1')
      ).rejects.toThrow('Folder not found');
    });

    it('throws on document not found', async () => {
      const error = new Error('Document not found');
      mockApiClient.post.mockRejectedValue(error);

      await expect(
        folderService.moveDocumentToFolder('folder1', 'invalid-doc')
      ).rejects.toThrow('Document not found');
    });

    it('throws on unauthorized access', async () => {
      const error = new Error('Unauthorized');
      mockApiClient.post.mockRejectedValue(error);

      await expect(
        folderService.moveDocumentToFolder('folder1', 'doc1')
      ).rejects.toThrow('Unauthorized');
    });

    it('throws on network error', async () => {
      const error = new Error('Network error');
      mockApiClient.post.mockRejectedValue(error);

      await expect(
        folderService.moveDocumentToFolder('folder1', 'doc1')
      ).rejects.toThrow('Network error');
    });
  });

  describe('Error Handling', () => {
    it('handles timeout error on getAllFolders', async () => {
      const error = new Error('Request timeout');
      mockApiClient.get.mockRejectedValue(error);

      await expect(folderService.getAllFolders()).rejects.toThrow('Request timeout');
    });

    it('handles server 500 error on createFolder', async () => {
      const error = new Error('Internal server error');
      mockApiClient.post.mockRejectedValue(error);

      await expect(
        folderService.createFolder({ name: 'Test' })
      ).rejects.toThrow('Internal server error');
    });

    it('handles 403 forbidden on updateFolder', async () => {
      const error = new Error('Forbidden');
      mockApiClient.put.mockRejectedValue(error);

      await expect(
        folderService.updateFolder('folder1', { name: 'Test' })
      ).rejects.toThrow('Forbidden');
    });
  });
});
