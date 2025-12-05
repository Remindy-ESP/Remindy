export interface DocumentFilterAppDto {
  userId: string;
  subscriptionId?: string;
  contractId?: number;
  ocrStatus?: 'pending' | 'processing' | 'completed' | 'failed';
  mimeType?: string;
  limit?: number;
  sort?: string;
}
