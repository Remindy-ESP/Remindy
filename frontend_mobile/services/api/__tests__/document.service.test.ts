import documentService, { DocumentResponse, UploadDocumentParams } from '../document.service';
import client, { apiClient } from '../client';

// Mock the API client
jest.mock('../client', () => {
  const mockAxiosInstance = {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    patch: jest.fn(),
    delete: jest.fn(),
  };

  const mockApiClientClass = {
    getBaseURL: jest.fn(() => 'http://localhost:3000'),
    setAccessToken: jest.fn(() => Promise.resolve()),
    setRefreshToken: jest.fn(() => Promise.resolve()),
    clearTokens: jest.fn(() => Promise.resolve()),
    getAccessToken: jest.fn(() => Promise.resolve(null)),
    isAuthenticated: jest.fn(() => Promise.resolve(false)),
  };

  return {
    __esModule: true,
    default: mockAxiosInstance,
    apiClient: mockApiClientClass,
  };
});

const mockClient = client as jest.Mocked<typeof client>;
const mockApiClient = apiClient as jest.Mocked<typeof apiClient>;

describe('DocumentService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset getBaseURL to default value
    mockApiClient.getBaseURL.mockReturnValue('http://localhost:3000');
  });

  const mockDocument: DocumentResponse = {
    id: 'doc1',
    user_id: 'user1',
    filename: 'invoice.pdf',
    r2_key: 'documents/user1/invoice.pdf',
    r2_bucket: 'remindy-bucket',
    file_hash: 'abc123hash',
    file_size: 102400,
    mime_type: 'application/pdf',
    ocr_status: 'completed',
    ocr_text: 'Invoice #001 — Amount: 29.99 EUR',
    uploaded_at: '2024-01-01T00:00:00.000Z',
    updated_at: '2024-01-01T00:00:00.000Z',
  };

  const mockDocumentWithParsed: DocumentResponse = {
    ...mockDocument,
    id: 'doc2',
    parsed_provider: 'Netflix',
    parsed_amount: 15.99,
    parsed_currency: 'EUR',
    parsed_date: '2024-01-01',
    parsed_frequency: 'mensuel',
    parsed_category: 'streaming',
    parsing_confidence: 0.95,
  };

  describe('uploadDocument', () => {
    const uploadParams: UploadDocumentParams = {
      file: {
        uri: 'file:///local/invoice.pdf',
        name: 'invoice.pdf',
        type: 'application/pdf',
        size: 102400,
      },
    };

    it('uploads a document with FormData', async () => {
      mockClient.post.mockResolvedValue({ data: mockDocument });

      const result = await documentService.uploadDocument(uploadParams);

      expect(mockClient.post).toHaveBeenCalledWith(
        '/documents/upload',
        expect.any(FormData),
        expect.objectContaining({
          headers: { 'Content-Type': 'multipart/form-data' },
          timeout: 120000,
        })
      );
      expect(result).toEqual(mockDocument);
    });

    it('uploads document with subscription_id', async () => {
      const paramsWithSubscription: UploadDocumentParams = {
        ...uploadParams,
        subscription_id: 'sub-123',
      };

      mockClient.post.mockResolvedValue({ data: mockDocument });

      await documentService.uploadDocument(paramsWithSubscription);

      const formData = mockClient.post.mock.calls[0][1] as FormData;
      expect(formData).toBeDefined();
      expect(mockClient.post).toHaveBeenCalledWith(
        '/documents/upload',
        expect.any(FormData),
        expect.any(Object)
      );
    });

    it('uploads document with folder_id', async () => {
      const paramsWithFolder: UploadDocumentParams = {
        ...uploadParams,
        folder_id: 'folder-456',
      };

      mockClient.post.mockResolvedValue({ data: mockDocument });

      await documentService.uploadDocument(paramsWithFolder);

      expect(mockClient.post).toHaveBeenCalledWith(
        '/documents/upload',
        expect.any(FormData),
        expect.any(Object)
      );
    });

    it('uploads document with contract_id', async () => {
      const paramsWithContract: UploadDocumentParams = {
        ...uploadParams,
        contract_id: 42,
      };

      mockClient.post.mockResolvedValue({ data: mockDocument });

      await documentService.uploadDocument(paramsWithContract);

      expect(mockClient.post).toHaveBeenCalledWith(
        '/documents/upload',
        expect.any(FormData),
        expect.any(Object)
      );
    });

    it('sets 120 second timeout for upload', async () => {
      mockClient.post.mockResolvedValue({ data: mockDocument });

      await documentService.uploadDocument(uploadParams);

      const callArgs = mockClient.post.mock.calls[0];
      expect(callArgs[2]).toMatchObject({ timeout: 120000 });
    });

    it('returns document with correct id', async () => {
      mockClient.post.mockResolvedValue({ data: mockDocument });

      const result = await documentService.uploadDocument(uploadParams);

      expect(result.id).toBe('doc1');
      expect(result.filename).toBe('invoice.pdf');
    });

    it('throws on file too large error', async () => {
      const error = new Error('File size exceeds 10MB limit');
      mockClient.post.mockRejectedValue(error);

      await expect(documentService.uploadDocument(uploadParams)).rejects.toThrow('File size exceeds 10MB limit');
    });

    it('throws on unsupported mime type', async () => {
      const error = new Error('Unsupported file type');
      mockClient.post.mockRejectedValue(error);

      await expect(documentService.uploadDocument(uploadParams)).rejects.toThrow('Unsupported file type');
    });

    it('throws on network error', async () => {
      const error = new Error('Network error');
      mockClient.post.mockRejectedValue(error);

      await expect(documentService.uploadDocument(uploadParams)).rejects.toThrow('Network error');
    });

    it('throws on unauthorized error', async () => {
      const error = new Error('Unauthorized');
      mockClient.post.mockRejectedValue(error);

      await expect(documentService.uploadDocument(uploadParams)).rejects.toThrow('Unauthorized');
    });
  });

  describe('getDocument', () => {
    it('fetches a document by ID', async () => {
      mockClient.get.mockResolvedValue({ data: mockDocument });

      const result = await documentService.getDocument('doc1');

      expect(mockClient.get).toHaveBeenCalledWith('/documents/doc1');
      expect(result).toEqual(mockDocument);
    });

    it('returns document with parsed fields', async () => {
      mockClient.get.mockResolvedValue({ data: mockDocumentWithParsed });

      const result = await documentService.getDocument('doc2');

      expect(result.parsed_provider).toBe('Netflix');
      expect(result.parsed_amount).toBe(15.99);
      expect(result.parsed_currency).toBe('EUR');
      expect(result.parsed_frequency).toBe('mensuel');
      expect(result.parsing_confidence).toBe(0.95);
    });

    it('returns document with ocr fields', async () => {
      mockClient.get.mockResolvedValue({ data: mockDocument });

      const result = await documentService.getDocument('doc1');

      expect(result.ocr_status).toBe('completed');
      expect(result.ocr_text).toBe('Invoice #001 — Amount: 29.99 EUR');
    });

    it('throws on document not found', async () => {
      const error = new Error('Document not found');
      mockClient.get.mockRejectedValue(error);

      await expect(documentService.getDocument('invalid-id')).rejects.toThrow('Document not found');
    });

    it('throws on unauthorized access', async () => {
      const error = new Error('Unauthorized');
      mockClient.get.mockRejectedValue(error);

      await expect(documentService.getDocument('doc1')).rejects.toThrow('Unauthorized');
    });
  });

  describe('getAllDocuments', () => {
    it('fetches all documents without filters', async () => {
      const mockDocuments = [mockDocument, mockDocumentWithParsed];
      mockClient.get.mockResolvedValue({ data: mockDocuments });

      const result = await documentService.getAllDocuments();

      expect(mockClient.get).toHaveBeenCalledWith('/documents', { params: undefined });
      expect(result).toEqual(mockDocuments);
      expect(result).toHaveLength(2);
    });

    it('fetches documents with subscription_id filter', async () => {
      mockClient.get.mockResolvedValue({ data: [mockDocument] });

      const result = await documentService.getAllDocuments({ subscription_id: 'sub-123' });

      expect(mockClient.get).toHaveBeenCalledWith('/documents', {
        params: { subscription_id: 'sub-123' },
      });
      expect(result).toHaveLength(1);
    });

    it('fetches documents with ocr_status filter', async () => {
      mockClient.get.mockResolvedValue({ data: [mockDocument] });

      await documentService.getAllDocuments({ ocr_status: 'completed' });

      expect(mockClient.get).toHaveBeenCalledWith('/documents', {
        params: { ocr_status: 'completed' },
      });
    });

    it('fetches documents with limit filter', async () => {
      mockClient.get.mockResolvedValue({ data: [mockDocument] });

      await documentService.getAllDocuments({ limit: 10 });

      expect(mockClient.get).toHaveBeenCalledWith('/documents', {
        params: { limit: 10 },
      });
    });

    it('fetches documents with multiple filters', async () => {
      mockClient.get.mockResolvedValue({ data: [] });

      await documentService.getAllDocuments({
        subscription_id: 'sub-123',
        ocr_status: 'pending',
        mime_type: 'application/pdf',
        limit: 5,
      });

      expect(mockClient.get).toHaveBeenCalledWith('/documents', {
        params: {
          subscription_id: 'sub-123',
          ocr_status: 'pending',
          mime_type: 'application/pdf',
          limit: 5,
        },
      });
    });

    it('returns empty array when no documents found', async () => {
      mockClient.get.mockResolvedValue({ data: [] });

      const result = await documentService.getAllDocuments();

      expect(result).toEqual([]);
    });

    it('throws on network error', async () => {
      const error = new Error('Network error');
      mockClient.get.mockRejectedValue(error);

      await expect(documentService.getAllDocuments()).rejects.toThrow('Network error');
    });
  });

  describe('updateDocument', () => {
    it('updates document filename', async () => {
      const updatedDoc = { ...mockDocument, filename: 'new-invoice.pdf' };
      mockClient.put.mockResolvedValue({ data: updatedDoc });

      const result = await documentService.updateDocument('doc1', { filename: 'new-invoice.pdf' });

      expect(mockClient.put).toHaveBeenCalledWith('/documents/doc1', { filename: 'new-invoice.pdf' });
      expect(result.filename).toBe('new-invoice.pdf');
    });

    it('updates document folder_id', async () => {
      const updatedDoc = { ...mockDocument, folder_id: 'folder-789' };
      mockClient.put.mockResolvedValue({ data: updatedDoc });

      const result = await documentService.updateDocument('doc1', { folder_id: 'folder-789' });

      expect(mockClient.put).toHaveBeenCalledWith('/documents/doc1', { folder_id: 'folder-789' });
      expect(result.folder_id).toBe('folder-789');
    });

    it('unlinks document from subscription by setting null', async () => {
      const updatedDoc = { ...mockDocument, subscription_id: undefined };
      mockClient.put.mockResolvedValue({ data: updatedDoc });

      const result = await documentService.updateDocument('doc1', { subscription_id: null });

      expect(mockClient.put).toHaveBeenCalledWith('/documents/doc1', { subscription_id: null });
      expect(result.subscription_id).toBeUndefined();
    });

    it('updates multiple fields at once', async () => {
      const updatedDoc = { ...mockDocument, filename: 'updated.pdf', folder_id: 'folder-1' };
      mockClient.put.mockResolvedValue({ data: updatedDoc });

      await documentService.updateDocument('doc1', {
        filename: 'updated.pdf',
        folder_id: 'folder-1',
      });

      expect(mockClient.put).toHaveBeenCalledWith('/documents/doc1', {
        filename: 'updated.pdf',
        folder_id: 'folder-1',
      });
    });

    it('throws on document not found', async () => {
      const error = new Error('Document not found');
      mockClient.put.mockRejectedValue(error);

      await expect(documentService.updateDocument('invalid-id', { filename: 'test.pdf' })).rejects.toThrow('Document not found');
    });
  });

  describe('deleteDocument', () => {
    it('soft-deletes a document by ID', async () => {
      mockClient.delete.mockResolvedValue({ data: undefined });

      await documentService.deleteDocument('doc1');

      expect(mockClient.delete).toHaveBeenCalledWith('/documents/doc1');
    });

    it('throws on document not found', async () => {
      const error = new Error('Document not found');
      mockClient.delete.mockRejectedValue(error);

      await expect(documentService.deleteDocument('invalid-id')).rejects.toThrow('Document not found');
    });

    it('throws on unauthorized access', async () => {
      const error = new Error('Unauthorized');
      mockClient.delete.mockRejectedValue(error);

      await expect(documentService.deleteDocument('doc1')).rejects.toThrow('Unauthorized');
    });

    it('can delete multiple documents sequentially', async () => {
      mockClient.delete.mockResolvedValue({ data: undefined });

      await documentService.deleteDocument('doc1');
      await documentService.deleteDocument('doc2');

      expect(mockClient.delete).toHaveBeenCalledTimes(2);
      expect(mockClient.delete).toHaveBeenNthCalledWith(1, '/documents/doc1');
      expect(mockClient.delete).toHaveBeenNthCalledWith(2, '/documents/doc2');
    });
  });

  describe('reprocessOcr', () => {
    it('reprocesses OCR for a document', async () => {
      const reprocessedDoc = { ...mockDocument, ocr_status: 'processing' as const };
      mockClient.post.mockResolvedValue({ data: reprocessedDoc });

      const result = await documentService.reprocessOcr('doc1');

      expect(mockClient.post).toHaveBeenCalledWith(
        '/documents/doc1/reprocess-ocr',
        { force: false }
      );
      expect(result.ocr_status).toBe('processing');
    });

    it('reprocesses OCR with force flag', async () => {
      const reprocessedDoc = { ...mockDocument, ocr_status: 'processing' as const };
      mockClient.post.mockResolvedValue({ data: reprocessedDoc });

      await documentService.reprocessOcr('doc1', true);

      expect(mockClient.post).toHaveBeenCalledWith(
        '/documents/doc1/reprocess-ocr',
        { force: true }
      );
    });

    it('defaults force to false when not specified', async () => {
      mockClient.post.mockResolvedValue({ data: mockDocument });

      await documentService.reprocessOcr('doc1');

      const callArgs = mockClient.post.mock.calls[0];
      expect(callArgs[1]).toEqual({ force: false });
    });

    it('throws on document not found', async () => {
      const error = new Error('Document not found');
      mockClient.post.mockRejectedValue(error);

      await expect(documentService.reprocessOcr('invalid-id')).rejects.toThrow('Document not found');
    });
  });

  describe('getDownloadUrl', () => {
    it('returns the correct download URL', () => {
      mockApiClient.getBaseURL.mockReturnValue('http://localhost:3000');

      const url = documentService.getDownloadUrl('doc1');

      expect(mockApiClient.getBaseURL).toHaveBeenCalled();
      expect(url).toBe('http://localhost:3000/documents/doc1/download');
    });

    it('builds URL with different base URLs', () => {
      mockApiClient.getBaseURL.mockReturnValue('https://api.remindy.com');

      const url = documentService.getDownloadUrl('doc-abc');

      expect(url).toBe('https://api.remindy.com/documents/doc-abc/download');
    });

    it('includes document ID in the URL', () => {
      mockApiClient.getBaseURL.mockReturnValue('http://localhost:3000');

      const url = documentService.getDownloadUrl('my-unique-doc-id');

      expect(url).toContain('my-unique-doc-id');
      expect(url).toContain('/download');
    });
  });

  describe('getQuota', () => {
    const mockQuota = {
      documentsCount: 5,
      maxDocuments: 50,
      storageUsed: 5242880,
      maxStorage: 104857600,
      storageUsedPercent: 5,
      documentsUsedPercent: 10,
      storageUsedFormatted: '5 MB',
      maxStorageFormatted: '100 MB',
    };

    it('fetches the user quota', async () => {
      mockClient.get.mockResolvedValue({ data: mockQuota });

      const result = await documentService.getQuota();

      expect(mockClient.get).toHaveBeenCalledWith('/documents/quota');
      expect(result).toEqual(mockQuota);
    });

    it('returns correct quota fields', async () => {
      mockClient.get.mockResolvedValue({ data: mockQuota });

      const result = await documentService.getQuota();

      expect(result.documentsCount).toBe(5);
      expect(result.maxDocuments).toBe(50);
      expect(result.storageUsed).toBe(5242880);
      expect(result.storageUsedPercent).toBe(5);
      expect(result.storageUsedFormatted).toBe('5 MB');
    });

    it('throws on network error', async () => {
      const error = new Error('Network error');
      mockClient.get.mockRejectedValue(error);

      await expect(documentService.getQuota()).rejects.toThrow('Network error');
    });

    it('throws on unauthorized access', async () => {
      const error = new Error('Unauthorized');
      mockClient.get.mockRejectedValue(error);

      await expect(documentService.getQuota()).rejects.toThrow('Unauthorized');
    });
  });

  describe('Error Handling', () => {
    it('handles timeout during upload', async () => {
      const error = new Error('Upload timeout');
      mockClient.post.mockRejectedValue(error);

      await expect(
        documentService.uploadDocument({
          file: { uri: 'file:///test.pdf', name: 'test.pdf', type: 'application/pdf' },
        })
      ).rejects.toThrow('Upload timeout');
    });

    it('handles server 500 error on get', async () => {
      const error = new Error('Internal server error');
      mockClient.get.mockRejectedValue(error);

      await expect(documentService.getDocument('doc1')).rejects.toThrow('Internal server error');
    });
  });
});
