import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { OcrService } from '../services/ocr.service';
import { GeminiParserService } from '../services/gemini-parser.service';
import { CloudflareR2Service } from '../services/cloudflare-r2.service';
import { Inject } from '@nestjs/common';
import { DOCUMENT_REPOSITORY } from '../../application/ports/document-repository.interface';
import type { IDocumentRepository } from '../../application/ports/document-repository.interface';

export interface OcrJobData {
  documentId: string;
  userId: string;
  r2Key: string;
  mimeType: string;
  filename: string;
}

export interface OcrJobResult {
  documentId: string;
  ocrText: string;
  parsedData: {
    provider?: string;
    amount?: number;
    currency?: string;
    date?: Date;
    frequency?: string;
    category?: string;
    confidence?: number;
  };
}

interface QueueJob {
  id: string;
  data: OcrJobData;
  status: 'waiting' | 'active' | 'completed' | 'failed';
  attempts: number;
  maxAttempts: number;
  error?: string;
  result?: OcrJobResult;
  createdAt: Date;
  startedAt?: Date;
  completedAt?: Date;
}

@Injectable()
export class InMemoryQueueService implements OnModuleDestroy {
  private readonly logger = new Logger(InMemoryQueueService.name);
  private readonly queue: QueueJob[] = [];
  private readonly completedJobs: QueueJob[] = [];
  private readonly failedJobs: QueueJob[] = [];
  private isProcessing = false;
  private workerInterval: NodeJS.Timeout | null = null;
  private jobIdCounter = 0;

  constructor(
    private readonly ocrService: OcrService,
    private readonly geminiParser: GeminiParserService,
    private readonly r2Service: CloudflareR2Service,
    @Inject(DOCUMENT_REPOSITORY)
    private readonly documentRepository: IDocumentRepository,
    private readonly eventEmitter: EventEmitter2,
  ) {
    // Démarrer le worker automatiquement
    this.startWorker();
  }

  onModuleDestroy() {
    this.stopWorker();
  }

  /**
   * Ajoute un document à la queue pour traitement OCR asynchrone
   */
  addDocumentToQueue(
    documentId: string,
    userId: string,
    r2Key: string,
    mimeType: string,
    filename: string,
  ): Promise<string> {
    const jobId = `ocr-job-${++this.jobIdCounter}-${Date.now()}`;

    const job: QueueJob = {
      id: jobId,
      data: { documentId, userId, r2Key, mimeType, filename },
      status: 'waiting',
      attempts: 0,
      maxAttempts: 3,
      createdAt: new Date(),
    };

    this.queue.push(job);
    this.logger.log(`Document ${documentId} added to queue with job ID ${jobId}`);

    // Trigger processing immediately
    void this.processQueue();

    return Promise.resolve(jobId);
  }

  /**
   * Démarre le worker qui traite la queue
   */
  private startWorker(): void {
    if (this.workerInterval) return;

    // Vérifier la queue toutes les 2 secondes
    this.workerInterval = setInterval(() => {
      void this.processQueue();
    }, 2000);

    this.logger.log('Queue worker started');
  }

  /**
   * Arrête le worker
   */
  private stopWorker(): void {
    if (this.workerInterval) {
      clearInterval(this.workerInterval);
      this.workerInterval = null;
      this.logger.log('Queue worker stopped');
    }
  }

  /**
   * Traite les jobs en attente dans la queue
   */
  private async processQueue(): Promise<void> {
    if (this.isProcessing || this.queue.length === 0) {
      return;
    }

    this.isProcessing = true;

    try {
      // Traiter jusqu'à 3 jobs en parallèle
      const jobsToProcess = this.queue.filter(job => job.status === 'waiting').slice(0, 3);

      if (jobsToProcess.length > 0) {
        await Promise.all(jobsToProcess.map(job => this.processJob(job)));
      }
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Traite un job individuel
   */
  private async processJob(job: QueueJob): Promise<void> {
    const { documentId, userId, r2Key, mimeType, filename } = job.data;

    job.status = 'active';
    job.attempts++;
    job.startedAt = new Date();

    this.logger.log(
      `Processing job ${job.id} for document ${documentId} (attempt ${job.attempts}/${job.maxAttempts})`,
    );

    // Émettre événement de démarrage
    this.eventEmitter.emit('ocr.started', {
      documentId,
      userId,
      filename,
      jobId: job.id,
    });

    try {
      // 1. Mettre à jour le statut à "processing"
      await this.documentRepository.updateOcrStatus(documentId, 'processing');

      // 2. Télécharger le fichier depuis R2
      this.logger.debug(`Downloading file from R2: ${r2Key}`);
      const fileBuffer = await this.withTimeout(
        this.r2Service.downloadFile(r2Key),
        30000, // 30 seconds for download
        'File download timed out after 30 seconds',
      );

      // 3. Extraire le texte via OCR (with timeout)
      this.logger.debug(`Extracting text from ${mimeType} file`);
      const rawText = await this.withTimeout(
        this.ocrService.extractText(fileBuffer, mimeType),
        120000, // 2 minutes for OCR extraction
        'OCR extraction timed out after 2 minutes',
      );
      const ocrText = this.ocrService.cleanExtractedText(rawText);

      if (!ocrText || ocrText.trim().length === 0) {
        // Différencier entre extraction vide (document sans texte) et échec
        const errorMsg =
          rawText === ''
            ? 'Document appears to be blank or contains no readable text (possible scanned image with no content)'
            : 'Text extraction completed but produced no readable content after cleaning';
        throw new Error(errorMsg);
      }

      this.logger.debug(`Extracted ${ocrText.length} characters of text`);

      // 4. Parser les données via Gemini (with timeout)
      this.logger.debug(`Parsing document data with Gemini AI`);
      const parsedData = await this.withTimeout(
        this.geminiParser.parseDocument(ocrText),
        60000, // 1 minute for Gemini parsing
        'Gemini parsing timed out after 1 minute',
      );

      // 5. Mettre à jour le document avec les résultats
      await this.documentRepository.updateOcrAndParsedData(documentId, {
        ocrText,
        ocrStatus: 'completed',
        parsedProvider: parsedData.provider,
        parsedAmount: parsedData.amount,
        parsedCurrency: parsedData.currency,
        parsedDate: parsedData.date,
        parsedFrequency: parsedData.frequency,
        parsedCategory: parsedData.category,
        parsingConfidence: parsedData.confidence,
      });

      // Succès !
      job.status = 'completed';
      job.completedAt = new Date();
      job.result = { documentId, ocrText, parsedData };

      this.logger.log(`Successfully completed OCR processing for document ${documentId}`);

      // Déplacer vers completedJobs et retirer de la queue
      this.removeFromQueue(job.id);
      this.completedJobs.push(job);

      // Limiter la taille de l'historique
      if (this.completedJobs.length > 100) {
        this.completedJobs.shift();
      }

      // Émettre événement de succès
      this.eventEmitter.emit('ocr.completed', {
        documentId,
        userId,
        filename,
        ocrText,
        parsedData,
        processingTime: job.completedAt.getTime() - job.startedAt.getTime(),
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Error processing document ${documentId}: ${errorMessage}`);

      // Si on a encore des tentatives, remettre en attente avec backoff
      if (job.attempts < job.maxAttempts) {
        job.status = 'waiting';
        const delay = Math.pow(2, job.attempts) * 5000; // Backoff exponentiel: 5s, 10s, 20s

        this.logger.log(
          `Retrying job ${job.id} in ${delay}ms (attempt ${job.attempts}/${job.maxAttempts})`,
        );

        // Émettre événement de retry
        this.eventEmitter.emit('ocr.retrying', {
          documentId,
          userId,
          filename,
          attempt: job.attempts,
          maxAttempts: job.maxAttempts,
          delay,
          error: errorMessage,
        });

        // Attendre avant de réessayer
        setTimeout(() => {
          void this.processQueue();
        }, delay);
      } else {
        // Toutes les tentatives épuisées, marquer comme failed
        job.status = 'failed';
        job.error = errorMessage;
        job.completedAt = new Date();

        await this.documentRepository.updateOcrStatus(
          documentId,
          'failed',
          `OCR failed after ${job.maxAttempts} attempts: ${errorMessage}`,
        );

        this.logger.error(
          `Document ${documentId} marked as failed after ${job.maxAttempts} attempts`,
        );

        // Déplacer vers failedJobs
        this.removeFromQueue(job.id);
        this.failedJobs.push(job);

        // Limiter la taille de l'historique
        if (this.failedJobs.length > 200) {
          this.failedJobs.shift();
        }

        // Émettre événement d'échec
        this.eventEmitter.emit('ocr.failed', {
          documentId,
          userId,
          filename,
          error: errorMessage,
          attempts: job.attempts,
        });
      }
    }
  }

  /**
   * Retire un job de la queue
   */
  private removeFromQueue(jobId: string): void {
    const index = this.queue.findIndex(j => j.id === jobId);
    if (index !== -1) {
      this.queue.splice(index, 1);
    }
  }

  /**
   * Récupère le statut d'un job
   */
  async getJobStatus(jobId: string): Promise<{
    id: string;
    status: string;
    progress: number;
    attempts: number;
    failedReason?: string;
    result?: any;
  }> {
    // Chercher dans toutes les listes
    const job =
      this.queue.find(j => j.id === jobId) ||
      this.completedJobs.find(j => j.id === jobId) ||
      this.failedJobs.find(j => j.id === jobId);

    if (!job) {
      throw new Error(`Job ${jobId} not found`);
    }

    return Promise.resolve({
      id: job.id,
      status: job.status,
      progress: job.status === 'completed' ? 100 : job.status === 'active' ? 50 : 0,
      attempts: job.attempts,
      failedReason: job.error,
      result: job.result,
    });
  }

  /**
   * Obtient des statistiques sur la queue
   */
  getQueueStats(): Promise<{
    waiting: number;
    active: number;
    completed: number;
    failed: number;
    delayed: number;
  }> {
    return Promise.resolve({
      waiting: this.queue.filter(j => j.status === 'waiting').length,
      active: this.queue.filter(j => j.status === 'active').length,
      completed: this.completedJobs.length,
      failed: this.failedJobs.length,
      delayed: 0, // Pas de notion de delayed dans cette implémentation simple
    });
  }

  /**
   * Wrapper pour ajouter un timeout à une promesse
   */
  private async withTimeout<T>(
    promise: Promise<T>,
    timeoutMs: number,
    errorMessage: string,
  ): Promise<T> {
    return Promise.race([
      promise,
      new Promise<T>((_, reject) => setTimeout(() => reject(new Error(errorMessage)), timeoutMs)),
    ]);
  }
}
