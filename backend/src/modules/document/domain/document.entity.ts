export type OcrStatus = 'pending' | 'processing' | 'completed' | 'failed';

export interface DocumentProps {
  id?: string;
  userId: string;
  subscriptionId?: string;
  contractId?: number;
  folderId?: string;
  filename: string;
  r2Key: string;
  r2Bucket: string;
  fileHash: string;
  fileSize: number;
  mimeType: string;
  ocrText?: string;
  ocrStatus: OcrStatus;
  ocrError?: string;
  uploadedAt?: Date;
  updatedAt?: Date;
  deletedAt?: Date;
}

export class Document {
  private _id?: string;
  private _userId: string;
  private _subscriptionId?: string;
  private _contractId?: number;
  private _folderId?: string;
  private _filename: string;
  private _r2Key: string;
  private _r2Bucket: string;
  private _fileHash: string;
  private _fileSize: number;
  private _mimeType: string;
  private _ocrText?: string;
  private _ocrStatus: OcrStatus;
  private _ocrError?: string;
  private _uploadedAt?: Date;
  private _updatedAt?: Date;
  private _deletedAt?: Date;

  constructor(props: DocumentProps) {
    this._id = props.id;
    this._userId = props.userId;
    this._subscriptionId = props.subscriptionId;
    this._contractId = props.contractId;
    this._folderId = props.folderId;
    this._filename = props.filename.trim();
    this._r2Key = props.r2Key.trim();
    this._r2Bucket = props.r2Bucket.trim();
    this._fileHash = props.fileHash.trim();
    this._fileSize = props.fileSize;
    this._mimeType = props.mimeType.trim();
    this._ocrText = props.ocrText?.trim();
    this._ocrStatus = props.ocrStatus;
    this._ocrError = props.ocrError?.trim();
    this._uploadedAt = props.uploadedAt;
    this._updatedAt = props.updatedAt;
    this._deletedAt = props.deletedAt;

    this.validate();
  }

  // Getters
  get id(): string | undefined {
    return this._id;
  }

  get userId(): string {
    return this._userId;
  }

  get subscriptionId(): string | undefined {
    return this._subscriptionId;
  }

  get contractId(): number | undefined {
    return this._contractId;
  }

  get folderId(): string | undefined {
    return this._folderId;
  }

  get filename(): string {
    return this._filename;
  }

  get r2Key(): string {
    return this._r2Key;
  }

  get r2Bucket(): string {
    return this._r2Bucket;
  }

  get fileHash(): string {
    return this._fileHash;
  }

  get fileSize(): number {
    return this._fileSize;
  }

  get mimeType(): string {
    return this._mimeType;
  }

  get ocrText(): string | undefined {
    return this._ocrText;
  }

  get ocrStatus(): OcrStatus {
    return this._ocrStatus;
  }

  get ocrError(): string | undefined {
    return this._ocrError;
  }

  get uploadedAt(): Date | undefined {
    return this._uploadedAt;
  }

  get updatedAt(): Date | undefined {
    return this._updatedAt;
  }

  get deletedAt(): Date | undefined {
    return this._deletedAt;
  }

  // Validation
  private validate(): void {
    if (!this._filename || this._filename.length === 0) {
      throw new Error('Document filename cannot be empty');
    }

    if (this._filename.length > 255) {
      throw new Error('Document filename cannot exceed 255 characters');
    }

    if (!this._r2Key || this._r2Key.length === 0) {
      throw new Error('Document R2 key cannot be empty');
    }

    if (this._fileSize <= 0 || this._fileSize > 52428800) {
      throw new Error('Document file size must be between 1 byte and 50MB (52428800 bytes)');
    }

    const validOcrStatuses: OcrStatus[] = ['pending', 'processing', 'completed', 'failed'];
    if (!validOcrStatuses.includes(this._ocrStatus)) {
      throw new Error('Invalid OCR status');
    }
  }

  // Business logic methods
  public updateOcrStatus(status: OcrStatus): void {
    const validOcrStatuses: OcrStatus[] = ['pending', 'processing', 'completed', 'failed'];
    if (!validOcrStatuses.includes(status)) {
      throw new Error('Invalid OCR status');
    }
    this._ocrStatus = status;
  }

  public updateOcrText(text: string): void {
    this._ocrText = text.trim();
    this._ocrStatus = 'completed';
    this._ocrError = undefined;
  }

  public setOcrError(error: string): void {
    this._ocrError = error.trim();
    this._ocrStatus = 'failed';
  }

  public startOcrProcessing(): void {
    this._ocrStatus = 'processing';
    this._ocrError = undefined;
  }

  public retryOcr(): void {
    this._ocrStatus = 'pending';
    this._ocrError = undefined;
    this._ocrText = undefined;
  }

  public linkToSubscription(subscriptionId: string): void {
    this._subscriptionId = subscriptionId;
  }

  public linkToContract(contractId: number): void {
    this._contractId = contractId;
  }

  public moveToFolder(folderId?: string): void {
    this._folderId = folderId;
    this._updatedAt = new Date();
  }

  public isPdf(): boolean {
    return this._mimeType === 'application/pdf';
  }

  public isImage(): boolean {
    return this._mimeType.startsWith('image/');
  }
}
