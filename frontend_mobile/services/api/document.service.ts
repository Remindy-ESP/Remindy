import apiClient from './client';

export interface DocumentResponse {
  id: string;
  user_id: string;
  subscription_id?: string;
  contract_id?: number;
  folder_id?: string;
  filename: string;
  r2_key: string;
  r2_bucket: string;
  file_hash: string;
  file_size: number;
  mime_type: string;
  ocr_text?: string;
  ocr_status: 'pending' | 'processing' | 'completed' | 'failed';
  ocr_error?: string;
  uploaded_at: string;
  updated_at: string;
  deleted_at?: string;
  // Champs parsed par Gemini
  parsed_provider?: string;
  parsed_amount?: number;
  parsed_currency?: string;
  parsed_date?: string;
  parsed_frequency?: 'mensuel' | 'trimestriel' | 'semestriel' | 'annuel' | 'ponctuel';
  parsed_category?: string;
  parsing_confidence?: number;
}

export interface UploadDocumentParams {
  file: {
    uri: string;
    name: string;
    type: string;
    size?: number;
  };
  subscription_id?: string;
  contract_id?: number;
}

class DocumentService {
  /**
   * Upload a document (PDF or image)
   * Max size: 10MB
   */
  async uploadDocument(params: UploadDocumentParams): Promise<DocumentResponse> {
    console.log('[DocumentService] Starting upload with params:', {
      fileName: params.file.name,
      fileType: params.file.type,
      fileSize: params.file.size,
      uri: params.file.uri,
    });

    try {
      const formData = new FormData();

      // CRITICAL: React Native needs this EXACT format for file uploads
      // The 'as any' is required because TypeScript doesn't know about RN's FormData
      formData.append('file', {
        uri: params.file.uri,
        type: params.file.type || 'application/pdf',
        name: params.file.name,
      } as any);

      if (params.subscription_id) {
        formData.append('subscription_id', params.subscription_id);
      }

      if (params.contract_id) {
        formData.append('contract_id', params.contract_id.toString());
      }

      console.log('[DocumentService] FormData prepared:', formData);
      console.log('[DocumentService] Sending POST to /documents/upload');

      const response = await apiClient.post<DocumentResponse>('/documents/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 120000,
      });

      console.log('[DocumentService] Upload successful:', response.data.id);
      return response.data;
    } catch (error: any) {
      console.error('[DocumentService] Upload FAILED:');
      console.error('  - Message:', error.message);
      console.error('  - Status:', error.response?.status);
      console.error('  - Data:', JSON.stringify(error.response?.data, null, 2));
      console.error('  - Headers:', error.response?.headers);
      throw error;
    }
  }

  /**
   * Get a specific document by ID
   */
  async getDocument(id: string): Promise<DocumentResponse> {
    try {
      const response = await apiClient.get<DocumentResponse>(`/documents/${id}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get all documents with optional filters
   */
  async getAllDocuments(filters?: {
    subscription_id?: string;
    contract_id?: number;
    ocr_status?: 'pending' | 'processing' | 'completed' | 'failed';
    mime_type?: string;
    limit?: number;
    sort?: string;
  }): Promise<DocumentResponse[]> {
    try {
      const response = await apiClient.get<DocumentResponse[]>('/documents', {
        params: filters,
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Update a document (filename, folder, subscription link)
   */
  async updateDocument(id: string, params: {
    filename?: string;
    folder_id?: string;
    subscription_id?: string | null;
  }): Promise<DocumentResponse> {
    try {
      const response = await apiClient.put<DocumentResponse>(`/documents/${id}`, params);
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Delete a document (soft delete)
   */
  async deleteDocument(id: string): Promise<void> {
    try {
      await apiClient.delete(`/documents/${id}`);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Reprocess OCR for a document
   */
  async reprocessOcr(id: string, force?: boolean): Promise<DocumentResponse> {
    try {
      const response = await apiClient.post<DocumentResponse>(
        `/documents/${id}/reprocess-ocr`,
        { force: force || false }
      );
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get user quota usage
   */
  async getQuota(): Promise<{
    documentsCount: number;
    maxDocuments: number;
    storageUsed: number;
    maxStorage: number;
    storageUsedPercent: number;
    documentsUsedPercent: number;
    storageUsedFormatted: string;
    maxStorageFormatted: string;
  }> {
    try {
      const response = await apiClient.get('/documents/quota');
      return response.data;
    } catch (error) {
      throw error;
    }
  }
}

export default new DocumentService();
