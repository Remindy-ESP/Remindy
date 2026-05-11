import { renderHook, act } from '@testing-library/react-native';
import { useDocuments } from '../useDocuments';
import { documentService } from '../../services/api';
import type { DocumentResponse } from '../../services/api/document.service';

jest.mock('../../services/api', () => ({
  documentService: {
    getAllDocuments: jest.fn(),
    uploadDocument: jest.fn(),
    updateDocument: jest.fn(),
    deleteDocument: jest.fn(),
    reprocessOcr: jest.fn(),
  },
}));

const mockDocumentService = documentService as jest.Mocked<typeof documentService>;

const makeDocument = (overrides: Partial<DocumentResponse> = {}): DocumentResponse => ({
  id: 'doc1',
  user_id: 'user1',
  filename: 'invoice.pdf',
  r2_key: 'users/user1/invoice.pdf',
  r2_bucket: 'remindy-bucket',
  file_hash: 'abc123',
  file_size: 102400,
  mime_type: 'application/pdf',
  ocr_status: 'pending',
  uploaded_at: '2024-01-01T00:00:00.000Z',
  updated_at: '2024-01-01T00:00:00.000Z',
  ...overrides,
});

const mockDocuments: DocumentResponse[] = [
  makeDocument({ id: 'doc1', filename: 'invoice.pdf' }),
  makeDocument({ id: 'doc2', filename: 'contract.pdf', ocr_status: 'completed' }),
];

describe('useDocuments', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('initial state', () => {
    it('starts with empty documents, not loading, no error', () => {
      const { result } = renderHook(() => useDocuments());

      expect(result.current.documents).toEqual([]);
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBeNull();
    });

    it('exposes all expected functions', () => {
      const { result } = renderHook(() => useDocuments());

      expect(typeof result.current.fetchDocuments).toBe('function');
      expect(typeof result.current.uploadDocument).toBe('function');
      expect(typeof result.current.updateDocument).toBe('function');
      expect(typeof result.current.deleteDocument).toBe('function');
      expect(typeof result.current.reprocessOcr).toBe('function');
    });
  });

  describe('fetchDocuments', () => {
    it('fetches and sets documents successfully', async () => {
      mockDocumentService.getAllDocuments.mockResolvedValue(mockDocuments);

      const { result } = renderHook(() => useDocuments());

      await act(async () => {
        await result.current.fetchDocuments();
      });

      expect(result.current.documents).toEqual(mockDocuments);
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBeNull();
    });

    it('passes filters to the service', async () => {
      mockDocumentService.getAllDocuments.mockResolvedValue([]);

      const { result } = renderHook(() => useDocuments());
      const filters = { subscription_id: 'sub1', ocr_status: 'completed' as const };

      await act(async () => {
        await result.current.fetchDocuments(filters);
      });

      expect(mockDocumentService.getAllDocuments).toHaveBeenCalledWith(filters);
    });

    it('fetches without filters when called with no arguments', async () => {
      mockDocumentService.getAllDocuments.mockResolvedValue([]);

      const { result } = renderHook(() => useDocuments());

      await act(async () => {
        await result.current.fetchDocuments();
      });

      expect(mockDocumentService.getAllDocuments).toHaveBeenCalledWith(undefined);
    });

    it('sets error when fetch fails with an Error', async () => {
      mockDocumentService.getAllDocuments.mockRejectedValue(new Error('Network error'));

      const { result } = renderHook(() => useDocuments());

      await act(async () => {
        await result.current.fetchDocuments();
      });

      expect(result.current.error).toBe('Network error');
      expect(result.current.loading).toBe(false);
      expect(result.current.documents).toEqual([]);
    });

    it('sets generic error for non-Error rejections', async () => {
      mockDocumentService.getAllDocuments.mockRejectedValue('oops');

      const { result } = renderHook(() => useDocuments());

      await act(async () => {
        await result.current.fetchDocuments();
      });

      expect(result.current.error).toBe('Failed to load documents');
    });

    it('clears error before fetching', async () => {
      mockDocumentService.getAllDocuments.mockRejectedValueOnce(new Error('First error'));

      const { result } = renderHook(() => useDocuments());

      await act(async () => {
        await result.current.fetchDocuments();
      });
      expect(result.current.error).toBe('First error');

      mockDocumentService.getAllDocuments.mockResolvedValueOnce(mockDocuments);

      await act(async () => {
        await result.current.fetchDocuments();
      });
      expect(result.current.error).toBeNull();
    });
  });

  describe('uploadDocument', () => {
    const uploadParams = {
      file: { uri: 'file://test.pdf', name: 'test.pdf', type: 'application/pdf', size: 1024 },
      subscription_id: 'sub1',
      folderId: 'folder1',
    };

    it('uploads a document and prepends it to the list', async () => {
      const uploaded = makeDocument({ id: 'doc-new', filename: 'test.pdf' });
      mockDocumentService.getAllDocuments.mockResolvedValue(mockDocuments);
      mockDocumentService.uploadDocument.mockResolvedValue(uploaded);

      const { result } = renderHook(() => useDocuments());

      // Load initial documents first
      await act(async () => {
        await result.current.fetchDocuments();
      });

      await act(async () => {
        await result.current.uploadDocument(uploadParams);
      });

      expect(result.current.documents[0]).toEqual(uploaded);
      expect(result.current.documents).toHaveLength(3);
    });

    it('passes correct params to the service (maps folderId to folder_id)', async () => {
      const uploaded = makeDocument({ id: 'doc-new' });
      mockDocumentService.uploadDocument.mockResolvedValue(uploaded);

      const { result } = renderHook(() => useDocuments());

      await act(async () => {
        await result.current.uploadDocument(uploadParams);
      });

      expect(mockDocumentService.uploadDocument).toHaveBeenCalledWith({
        file: uploadParams.file,
        subscription_id: 'sub1',
        contract_id: undefined,
        folder_id: 'folder1',
      });
    });

    it('returns the uploaded document', async () => {
      const uploaded = makeDocument({ id: 'doc-new' });
      mockDocumentService.uploadDocument.mockResolvedValue(uploaded);

      const { result } = renderHook(() => useDocuments());

      let returnValue: DocumentResponse | undefined;
      await act(async () => {
        returnValue = await result.current.uploadDocument(uploadParams);
      });

      expect(returnValue).toEqual(uploaded);
    });

    it('throws and sets error when upload fails', async () => {
      mockDocumentService.uploadDocument.mockRejectedValue(new Error('Upload failed'));

      const { result } = renderHook(() => useDocuments());

      await act(async () => {
        await expect(result.current.uploadDocument(uploadParams)).rejects.toThrow('Upload failed');
      });

      expect(result.current.error).toBe('Upload failed');
      expect(result.current.loading).toBe(false);
    });
  });

  describe('updateDocument', () => {
    it('updates a document in the list', async () => {
      mockDocumentService.getAllDocuments.mockResolvedValue(mockDocuments);
      const updatedDoc = makeDocument({ id: 'doc1', filename: 'renamed.pdf' });
      mockDocumentService.updateDocument.mockResolvedValue(updatedDoc);

      const { result } = renderHook(() => useDocuments());

      await act(async () => {
        await result.current.fetchDocuments();
      });

      await act(async () => {
        await result.current.updateDocument('doc1', { filename: 'renamed.pdf' });
      });

      const found = result.current.documents.find((d) => d.id === 'doc1');
      expect(found?.filename).toBe('renamed.pdf');
    });

    it('returns the updated document', async () => {
      const updatedDoc = makeDocument({ id: 'doc1', filename: 'renamed.pdf' });
      mockDocumentService.updateDocument.mockResolvedValue(updatedDoc);

      const { result } = renderHook(() => useDocuments());

      let returnValue: DocumentResponse | undefined;
      await act(async () => {
        returnValue = await result.current.updateDocument('doc1', { filename: 'renamed.pdf' });
      });

      expect(returnValue).toEqual(updatedDoc);
    });

    it('throws and sets error when update fails', async () => {
      mockDocumentService.updateDocument.mockRejectedValue(new Error('Update failed'));

      const { result } = renderHook(() => useDocuments());

      await act(async () => {
        await expect(result.current.updateDocument('doc1', {})).rejects.toThrow('Update failed');
      });

      expect(result.current.error).toBe('Update failed');
    });
  });

  describe('deleteDocument', () => {
    it('removes the document from the list after deletion', async () => {
      mockDocumentService.getAllDocuments.mockResolvedValue(mockDocuments);
      mockDocumentService.deleteDocument.mockResolvedValue(undefined);

      const { result } = renderHook(() => useDocuments());

      await act(async () => {
        await result.current.fetchDocuments();
      });
      expect(result.current.documents).toHaveLength(2);

      await act(async () => {
        await result.current.deleteDocument('doc1');
      });

      expect(result.current.documents).toHaveLength(1);
      expect(result.current.documents.find((d) => d.id === 'doc1')).toBeUndefined();
    });

    it('throws and sets error when delete fails', async () => {
      mockDocumentService.deleteDocument.mockRejectedValue(new Error('Delete failed'));

      const { result } = renderHook(() => useDocuments());

      await act(async () => {
        await expect(result.current.deleteDocument('doc1')).rejects.toThrow('Delete failed');
      });

      expect(result.current.error).toBe('Delete failed');
    });
  });

  describe('reprocessOcr', () => {
    it('updates the document in the list with new OCR status', async () => {
      mockDocumentService.getAllDocuments.mockResolvedValue(mockDocuments);
      const reprocessed = makeDocument({ id: 'doc1', ocr_status: 'processing' });
      mockDocumentService.reprocessOcr.mockResolvedValue(reprocessed);

      const { result } = renderHook(() => useDocuments());

      await act(async () => {
        await result.current.fetchDocuments();
      });

      await act(async () => {
        await result.current.reprocessOcr('doc1');
      });

      const found = result.current.documents.find((d) => d.id === 'doc1');
      expect(found?.ocr_status).toBe('processing');
    });

    it('passes force flag to the service', async () => {
      const reprocessed = makeDocument({ id: 'doc1' });
      mockDocumentService.reprocessOcr.mockResolvedValue(reprocessed);

      const { result } = renderHook(() => useDocuments());

      await act(async () => {
        await result.current.reprocessOcr('doc1', true);
      });

      expect(mockDocumentService.reprocessOcr).toHaveBeenCalledWith('doc1', true);
    });

    it('returns the updated document', async () => {
      const reprocessed = makeDocument({ id: 'doc1', ocr_status: 'completed' });
      mockDocumentService.reprocessOcr.mockResolvedValue(reprocessed);

      const { result } = renderHook(() => useDocuments());

      let returnValue: DocumentResponse | undefined;
      await act(async () => {
        returnValue = await result.current.reprocessOcr('doc1');
      });

      expect(returnValue).toEqual(reprocessed);
    });

    it('throws and sets error when reprocess fails', async () => {
      mockDocumentService.reprocessOcr.mockRejectedValue(new Error('OCR failed'));

      const { result } = renderHook(() => useDocuments());

      await act(async () => {
        await expect(result.current.reprocessOcr('doc1')).rejects.toThrow('OCR failed');
      });

      expect(result.current.error).toBe('OCR failed');
    });
  });
});
