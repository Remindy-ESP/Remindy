import { renderHook, act } from '@testing-library/react-native';
import { useFolders } from '../useFolders';
import { folderService } from '../../services/api';
import type { Folder } from '../../services/api/types';

jest.mock('../../services/api', () => ({
  folderService: {
    getAllFolders: jest.fn(),
    createFolder: jest.fn(),
    updateFolder: jest.fn(),
    deleteFolder: jest.fn(),
    moveDocumentToFolder: jest.fn(),
  },
}));

const mockFolderService = folderService as jest.Mocked<typeof folderService>;

const makeFolder = (overrides: Partial<Folder> = {}): Folder => ({
  id: 'folder1',
  userId: 'user1',
  name: 'My Folder',
  isDefault: false,
  documentCount: 0,
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
  ...overrides,
});

const mockFolders: Folder[] = [
  makeFolder({ id: 'folder1', name: 'Invoices' }),
  makeFolder({ id: 'folder2', name: 'Contracts', isDefault: true }),
];

describe('useFolders', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('initial state', () => {
    it('starts with empty folders, not loading, no error', () => {
      const { result } = renderHook(() => useFolders());

      expect(result.current.folders).toEqual([]);
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBeNull();
    });

    it('exposes all expected functions', () => {
      const { result } = renderHook(() => useFolders());

      expect(typeof result.current.fetchFolders).toBe('function');
      expect(typeof result.current.createFolder).toBe('function');
      expect(typeof result.current.updateFolder).toBe('function');
      expect(typeof result.current.deleteFolder).toBe('function');
      expect(typeof result.current.moveDocumentToFolder).toBe('function');
    });
  });

  describe('fetchFolders', () => {
    it('fetches and sets folders successfully', async () => {
      mockFolderService.getAllFolders.mockResolvedValue(mockFolders);

      const { result } = renderHook(() => useFolders());

      await act(async () => {
        await result.current.fetchFolders();
      });

      expect(result.current.folders).toEqual(mockFolders);
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBeNull();
    });

    it('passes filters to the service', async () => {
      mockFolderService.getAllFolders.mockResolvedValue([]);

      const { result } = renderHook(() => useFolders());
      const filters = { isDefault: true, parentId: 'parent1' };

      await act(async () => {
        await result.current.fetchFolders(filters);
      });

      expect(mockFolderService.getAllFolders).toHaveBeenCalledWith(filters);
    });

    it('fetches without filters when called with no arguments', async () => {
      mockFolderService.getAllFolders.mockResolvedValue([]);

      const { result } = renderHook(() => useFolders());

      await act(async () => {
        await result.current.fetchFolders();
      });

      expect(mockFolderService.getAllFolders).toHaveBeenCalledWith(undefined);
    });

    it('sets error when fetch fails with an Error', async () => {
      mockFolderService.getAllFolders.mockRejectedValue(new Error('Network error'));

      const { result } = renderHook(() => useFolders());

      await act(async () => {
        await result.current.fetchFolders();
      });

      expect(result.current.error).toBe('Network error');
      expect(result.current.loading).toBe(false);
      expect(result.current.folders).toEqual([]);
    });

    it('sets generic error for non-Error rejections', async () => {
      mockFolderService.getAllFolders.mockRejectedValue('some error');

      const { result } = renderHook(() => useFolders());

      await act(async () => {
        await result.current.fetchFolders();
      });

      expect(result.current.error).toBe('Failed to load folders');
    });

    it('clears previous error before re-fetching', async () => {
      mockFolderService.getAllFolders.mockRejectedValueOnce(new Error('First error'));

      const { result } = renderHook(() => useFolders());

      await act(async () => {
        await result.current.fetchFolders();
      });
      expect(result.current.error).toBe('First error');

      mockFolderService.getAllFolders.mockResolvedValueOnce(mockFolders);

      await act(async () => {
        await result.current.fetchFolders();
      });
      expect(result.current.error).toBeNull();
    });
  });

  describe('createFolder', () => {
    it('appends the new folder to the list', async () => {
      mockFolderService.getAllFolders.mockResolvedValue(mockFolders);
      const newFolder = makeFolder({ id: 'folder3', name: 'Photos' });
      mockFolderService.createFolder.mockResolvedValue(newFolder);

      const { result } = renderHook(() => useFolders());

      await act(async () => {
        await result.current.fetchFolders();
      });
      expect(result.current.folders).toHaveLength(2);

      await act(async () => {
        await result.current.createFolder({ name: 'Photos' });
      });

      expect(result.current.folders).toHaveLength(3);
      expect(result.current.folders[2]).toEqual(newFolder);
    });

    it('returns the created folder', async () => {
      const newFolder = makeFolder({ id: 'folder3', name: 'Photos' });
      mockFolderService.createFolder.mockResolvedValue(newFolder);

      const { result } = renderHook(() => useFolders());

      let returnValue: Folder | undefined;
      await act(async () => {
        returnValue = await result.current.createFolder({ name: 'Photos' });
      });

      expect(returnValue).toEqual(newFolder);
    });

    it('passes params to the service', async () => {
      const newFolder = makeFolder({ id: 'folder3', name: 'Photos', color: '#blue' });
      mockFolderService.createFolder.mockResolvedValue(newFolder);

      const { result } = renderHook(() => useFolders());
      const params = { name: 'Photos', color: '#blue', parentId: 'parent1' };

      await act(async () => {
        await result.current.createFolder(params);
      });

      expect(mockFolderService.createFolder).toHaveBeenCalledWith(params);
    });

    it('throws and sets error when create fails', async () => {
      mockFolderService.createFolder.mockRejectedValue(new Error('Create failed'));

      const { result } = renderHook(() => useFolders());

      await act(async () => {
        await expect(result.current.createFolder({ name: 'Test' })).rejects.toThrow('Create failed');
      });

      expect(result.current.error).toBe('Create failed');
      expect(result.current.loading).toBe(false);
    });
  });

  describe('updateFolder', () => {
    it('updates the folder in the list', async () => {
      mockFolderService.getAllFolders.mockResolvedValue(mockFolders);
      const updated = makeFolder({ id: 'folder1', name: 'Renamed Invoices' });
      mockFolderService.updateFolder.mockResolvedValue(updated);

      const { result } = renderHook(() => useFolders());

      await act(async () => {
        await result.current.fetchFolders();
      });

      await act(async () => {
        await result.current.updateFolder('folder1', { name: 'Renamed Invoices' });
      });

      const found = result.current.folders.find((f) => f.id === 'folder1');
      expect(found?.name).toBe('Renamed Invoices');
    });

    it('returns the updated folder', async () => {
      const updated = makeFolder({ id: 'folder1', name: 'Renamed' });
      mockFolderService.updateFolder.mockResolvedValue(updated);

      const { result } = renderHook(() => useFolders());

      let returnValue: Folder | undefined;
      await act(async () => {
        returnValue = await result.current.updateFolder('folder1', { name: 'Renamed' });
      });

      expect(returnValue).toEqual(updated);
    });

    it('does not alter other folders when updating one', async () => {
      mockFolderService.getAllFolders.mockResolvedValue(mockFolders);
      const updated = makeFolder({ id: 'folder1', name: 'New Name' });
      mockFolderService.updateFolder.mockResolvedValue(updated);

      const { result } = renderHook(() => useFolders());

      await act(async () => {
        await result.current.fetchFolders();
      });
      await act(async () => {
        await result.current.updateFolder('folder1', { name: 'New Name' });
      });

      const folder2 = result.current.folders.find((f) => f.id === 'folder2');
      expect(folder2?.name).toBe('Contracts');
    });

    it('throws and sets error when update fails', async () => {
      mockFolderService.updateFolder.mockRejectedValue(new Error('Update failed'));

      const { result } = renderHook(() => useFolders());

      await act(async () => {
        await expect(result.current.updateFolder('folder1', {})).rejects.toThrow('Update failed');
      });

      expect(result.current.error).toBe('Update failed');
    });
  });

  describe('deleteFolder', () => {
    it('removes the folder from the list', async () => {
      mockFolderService.getAllFolders.mockResolvedValue(mockFolders);
      mockFolderService.deleteFolder.mockResolvedValue(undefined);

      const { result } = renderHook(() => useFolders());

      await act(async () => {
        await result.current.fetchFolders();
      });
      expect(result.current.folders).toHaveLength(2);

      await act(async () => {
        await result.current.deleteFolder('folder1');
      });

      expect(result.current.folders).toHaveLength(1);
      expect(result.current.folders.find((f) => f.id === 'folder1')).toBeUndefined();
    });

    it('does not remove other folders', async () => {
      mockFolderService.getAllFolders.mockResolvedValue(mockFolders);
      mockFolderService.deleteFolder.mockResolvedValue(undefined);

      const { result } = renderHook(() => useFolders());

      await act(async () => {
        await result.current.fetchFolders();
      });
      await act(async () => {
        await result.current.deleteFolder('folder1');
      });

      expect(result.current.folders[0].id).toBe('folder2');
    });

    it('throws and sets error when delete fails', async () => {
      mockFolderService.deleteFolder.mockRejectedValue(new Error('Delete failed'));

      const { result } = renderHook(() => useFolders());

      await act(async () => {
        await expect(result.current.deleteFolder('folder1')).rejects.toThrow('Delete failed');
      });

      expect(result.current.error).toBe('Delete failed');
    });
  });

  describe('moveDocumentToFolder', () => {
    it('calls the service with correct arguments', async () => {
      mockFolderService.moveDocumentToFolder.mockResolvedValue(undefined);

      const { result } = renderHook(() => useFolders());

      await act(async () => {
        await result.current.moveDocumentToFolder('folder1', 'doc1');
      });

      expect(mockFolderService.moveDocumentToFolder).toHaveBeenCalledWith('folder1', 'doc1');
    });

    it('sets loading to false after successful move', async () => {
      mockFolderService.moveDocumentToFolder.mockResolvedValue(undefined);

      const { result } = renderHook(() => useFolders());

      await act(async () => {
        await result.current.moveDocumentToFolder('folder1', 'doc1');
      });

      expect(result.current.loading).toBe(false);
    });

    it('throws and sets error when move fails', async () => {
      mockFolderService.moveDocumentToFolder.mockRejectedValue(new Error('Move failed'));

      const { result } = renderHook(() => useFolders());

      await act(async () => {
        await expect(result.current.moveDocumentToFolder('folder1', 'doc1')).rejects.toThrow(
          'Move failed'
        );
      });

      expect(result.current.error).toBe('Move failed');
      expect(result.current.loading).toBe(false);
    });

    it('sets generic error for non-Error rejections', async () => {
      mockFolderService.moveDocumentToFolder.mockRejectedValue('bad thing');

      const { result } = renderHook(() => useFolders());

      await act(async () => {
        await expect(result.current.moveDocumentToFolder('folder1', 'doc1')).rejects.toBe(
          'bad thing'
        );
      });

      expect(result.current.error).toBe('Failed to move document');
    });
  });
});
