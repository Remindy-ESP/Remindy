import { useState } from 'react';
import { documentService } from '@/services/api';
import type { DocumentResponse } from '@/services/api/document.service';

export function useDocuments() {
  const [documents, setDocuments] = useState<DocumentResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchDocuments = async (filters?: {
    subscription_id?: string;
    contract_id?: number;
    ocr_status?: 'pending' | 'processing' | 'completed' | 'failed';
    mime_type?: string;
    limit?: number;
    sort?: string;
  }) => {
    try {
      setLoading(true);
      setError(null);
      const data = await documentService.getAllDocuments(filters);
      setDocuments(data);
    } catch (err) {
      console.error('Error fetching documents:', err);
      setError(err instanceof Error ? err.message : 'Failed to load documents');
    } finally {
      setLoading(false);
    }
  };

  const uploadDocument = async (params: {
    file: { uri: string; name: string; type: string; size?: number };
    subscription_id?: string;
    contract_id?: number;
  }) => {
    try {
      setLoading(true);
      setError(null);
      const document = await documentService.uploadDocument(params);
      setDocuments((prev) => [document, ...prev]);
      return document;
    } catch (err) {
      console.error('Error uploading document:', err);
      setError(err instanceof Error ? err.message : 'Failed to upload document');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateDocument = async (id: string, params: {
    filename?: string;
    folder_id?: string;
    subscription_id?: string | null;
  }) => {
    try {
      setLoading(true);
      setError(null);
      const updated = await documentService.updateDocument(id, params);
      setDocuments((prev) => prev.map((doc) => (doc.id === id ? updated : doc)));
      return updated;
    } catch (err) {
      console.error('Error updating document:', err);
      setError(err instanceof Error ? err.message : 'Failed to update document');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const deleteDocument = async (id: string) => {
    try {
      setLoading(true);
      setError(null);
      await documentService.deleteDocument(id);
      setDocuments((prev) => prev.filter((doc) => doc.id !== id));
    } catch (err) {
      console.error('Error deleting document:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete document');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const reprocessOcr = async (id: string, force?: boolean) => {
    try {
      setLoading(true);
      setError(null);
      const updated = await documentService.reprocessOcr(id, force);
      setDocuments((prev) => prev.map((doc) => (doc.id === id ? updated : doc)));
      return updated;
    } catch (err) {
      console.error('Error reprocessing OCR:', err);
      setError(err instanceof Error ? err.message : 'Failed to reprocess OCR');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    documents,
    loading,
    error,
    fetchDocuments,
    uploadDocument,
    updateDocument,
    deleteDocument,
    reprocessOcr,
  };
}
