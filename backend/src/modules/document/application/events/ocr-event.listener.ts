import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';

@Injectable()
export class OcrEventListener {
  private readonly logger = new Logger(OcrEventListener.name);

  @OnEvent('ocr.started')
  handleOcrStarted(payload: any) {
    this.logger.log(`OCR started for document ${payload.documentId} (user: ${payload.userId})`);

    // TODO: Ici, on pourrait :
    // - Créer une notification in-app
    // - Envoyer un email
    // - Envoyer une notification push
    // - Logger dans un système de monitoring

    this.logger.debug(`Document: ${payload.filename}`);
  }

  @OnEvent('ocr.completed')
  handleOcrCompleted(payload: any) {
    this.logger.log(
      `OCR completed successfully for document ${payload.documentId} in ${payload.processingTime}ms`,
    );

    // TODO: Actions post-OCR
    // - Créer une notification de succès pour l'utilisateur
    // - Envoyer un email avec résumé des données extraites
    // - Mettre à jour les statistiques utilisateur
    // - Déclencher d'autres workflows (création événement, rappel, etc.)

    if (payload.parsedData.provider) {
      this.logger.debug(`Provider detected: ${payload.parsedData.provider}`);
    }

    if (payload.parsedData.amount && payload.parsedData.currency) {
      this.logger.debug(
        `Amount detected: ${payload.parsedData.amount} ${payload.parsedData.currency}`,
      );
    }

    if (payload.parsedData.confidence !== undefined) {
      this.logger.debug(`Parsing confidence: ${(payload.parsedData.confidence * 100).toFixed(1)}%`);
    }

    // Simuler la création d'une notification
    this.createNotification(
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      payload.userId,

      'success',
      `Document "${payload.filename}" traité avec succès`,
      {
        documentId: payload.documentId,
        // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
        extractedDataCount: Object.keys(payload.parsedData).filter(
          key => payload.parsedData[key] !== undefined,
        ).length,
      },
    );
  }

  @OnEvent('ocr.failed')
  handleOcrFailed(payload: any) {
    this.logger.error(
      `OCR failed for document ${payload.documentId} after ${payload.attempts} attempts: ${payload.error}`,
    );

    // TODO: Actions en cas d'échec
    // - Créer une notification d'erreur pour l'utilisateur
    // - Envoyer un email d'alerte
    // - Logger dans un système de monitoring/alerting
    // - Créer un ticket de support si nécessaire

    this.logger.error(`Document: ${payload.filename}`);
    this.logger.error(`User: ${payload.userId}`);

    // Simuler la création d'une notification d'erreur
    this.createNotification(
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      payload.userId,

      'error',
      `Échec du traitement du document "${payload.filename}"`,
      {
        documentId: payload.documentId,
        error: payload.error,
        attempts: payload.attempts,
      },
    );
  }

  @OnEvent('ocr.retrying')
  handleOcrRetrying(payload: any) {
    this.logger.warn(
      `OCR retrying for document ${payload.documentId} (attempt ${payload.attemptNumber}/${payload.maxAttempts})`,
    );

    // TODO: Actions lors d'un retry
    // - Logger les tentatives pour analyse
    // - Ajuster les paramètres si nécessaire
    // - Notifier l'utilisateur si c'est la dernière tentative

    this.logger.warn(`Reason: ${payload.error}`);

    if (payload.attemptNumber === payload.maxAttempts - 1) {
      this.logger.warn('This is the last retry attempt!');
    }
  }

  /**
   * Méthode helper pour créer une notification
   * Dans une vraie implémentation, cela appellerait le NotificationService
   */
  private createNotification(
    userId: string,
    type: 'success' | 'error' | 'info' | 'warning',
    message: string,
    _metadata?: any,
  ): void {
    this.logger.debug(
      `[NOTIFICATION] Creating ${type} notification for user ${userId}: ${message}`,
    );

    // TODO: Appeler le service de notification réel
    // await this.notificationService.create({
    //   userId,
    //   type,
    //   message,
    //   metadata,
    //   createdAt: new Date(),
    // });
  }

  /**
   * Statistiques globales sur les traitements OCR
   */
  @OnEvent('ocr.completed')
  trackOcrStats(payload: any) {
    // TODO: Tracker les statistiques
    // - Temps de traitement moyen
    // - Taux de succès
    // - Confiance moyenne du parsing
    // - Types de documents traités
    // - Utilisation des quotas

    const stats = {
      documentId: payload.documentId,
      processingTime: payload.processingTime,
      confidence: payload.parsedData.confidence,
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      fieldsExtracted: Object.keys(payload.parsedData).filter(
        key => payload.parsedData[key] !== undefined,
      ).length,
    };

    this.logger.debug(`OCR Stats: ${JSON.stringify(stats)}`);
  }
}
