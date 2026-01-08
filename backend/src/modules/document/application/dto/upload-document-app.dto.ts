export interface UploadDocumentAppDto {
  userId: string;
  filename: string;
  fileBuffer: Buffer;
  fileSize: number;
  mimeType: string;
  subscriptionId?: string;
  contractId?: number;
  userRole?: string;
}
