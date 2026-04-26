/**
 * Événements émis par le système OCR
 */

export class OcrCompletedEvent {
  constructor(
    public readonly documentId: string,
    public readonly userId: string,
    public readonly filename: string,
    public readonly ocrText: string,
    public readonly parsedData: {
      provider?: string;
      amount?: number;
      currency?: string;
      date?: Date;
      frequency?: string;
      category?: string;
      confidence?: number;
    },
    public readonly processingTime: number,
  ) {}
}

export class OcrFailedEvent {
  constructor(
    public readonly documentId: string,
    public readonly userId: string,
    public readonly filename: string,
    public readonly error: string,
    public readonly attempts: number,
  ) {}
}

export class OcrStartedEvent {
  constructor(
    public readonly documentId: string,
    public readonly userId: string,
    public readonly filename: string,
  ) {}
}

export class OcrRetryingEvent {
  constructor(
    public readonly documentId: string,
    public readonly userId: string,
    public readonly filename: string,
    public readonly attemptNumber: number,
    public readonly maxAttempts: number,
    public readonly error: string,
  ) {}
}
