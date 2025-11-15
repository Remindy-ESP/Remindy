import { Injectable, Inject, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import {
  ISubscriptionRepository,
  SUBSCRIPTION_REPOSITORY,
} from '../../../subscription/application/ports/subscription-repository.interface';
import {
  IEventSeriesRepository,
  EVENT_SERIES_REPOSITORY,
} from '../../../event-series/application/ports/event-series-repository.interface';
import { GenerateEventsFromSeriesUseCase } from '../../../event-series/application/use-cases/generate-events-from-series.use-case';
import { GenerateEventsForSubscriptionUseCase } from '../use-cases/generate-events-for-subscription.use-case';

@Injectable()
export class EventGenerationService {
  private readonly logger = new Logger(EventGenerationService.name);

  constructor(
    @Inject(SUBSCRIPTION_REPOSITORY)
    private readonly subscriptionRepository: ISubscriptionRepository,
    @Inject(EVENT_SERIES_REPOSITORY)
    private readonly eventSeriesRepository: IEventSeriesRepository,
    private readonly generateEventsFromSeriesUseCase: GenerateEventsFromSeriesUseCase,
    private readonly generateEventsForSubscriptionUseCase: GenerateEventsForSubscriptionUseCase,
  ) {}

  /**
   * Job CRON qui s'exécute tous les jours à minuit
   * Génère les événements pour les 12 prochains mois pour tous les abonnements actifs
   */
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async generateEventsForAllSubscriptions() {
    this.logger.log('Starting automatic event generation job...');

    try {
      // Récupérer tous les abonnements actifs
      const subscriptions = await this.subscriptionRepository.findAll({
        status: 'active',
      });

      this.logger.log(`Found ${subscriptions.length} active subscriptions`);

      let totalEventsGenerated = 0;

      for (const subscription of subscriptions) {
        try {
          // Chercher l'event_series pour cet abonnement
          const eventSeries = await this.eventSeriesRepository.findBySubscriptionId(subscription.id!);

          if (!eventSeries) {
            this.logger.warn(`No event series found for subscription ${subscription.id}`);
            continue;
          }

          // Générer les occurrences pour les 12 prochains mois
          const now = new Date();
          const endDate = new Date();
          endDate.setMonth(endDate.getMonth() + 12);

          const occurrences = await this.generateEventsFromSeriesUseCase.execute(
            eventSeries.id!,
            now,
            endDate,
            365, // Max 365 occurrences
          );

          // Créer les événements
          const events = await this.generateEventsForSubscriptionUseCase.execute({
            subscriptionId: subscription.id!,
            subscriptionName: subscription.name,
            subscriptionAmount: subscription.amount,
            eventSeriesId: eventSeries.id!,
            occurrences,
          });

          totalEventsGenerated += events.length;

          if (events.length > 0) {
            this.logger.log(
              `Generated ${events.length} events for subscription "${subscription.name}"`,
            );
          }
        } catch (error) {
          this.logger.error(
            `Error generating events for subscription ${subscription.id}: ${error.message}`,
          );
        }
      }

      this.logger.log(
        `Event generation job completed. Total events generated: ${totalEventsGenerated}`,
      );
    } catch (error) {
      this.logger.error(`Event generation job failed: ${error.message}`, error.stack);
    }
  }

  /**
   * Méthode manuelle pour générer les événements d'un abonnement spécifique
   * Peut être appelée via un endpoint ou un événement
   */
  async generateEventsForSubscription(subscriptionId: string): Promise<number> {
    this.logger.log(`Generating events for subscription ${subscriptionId}`);

    const subscription = await this.subscriptionRepository.findById(subscriptionId);

    if (!subscription) {
      throw new Error(`Subscription ${subscriptionId} not found`);
    }

    const eventSeries = await this.eventSeriesRepository.findBySubscriptionId(subscriptionId);

    if (!eventSeries) {
      throw new Error(`No event series found for subscription ${subscriptionId}`);
    }

    // Générer les occurrences pour les 12 prochains mois
    const now = new Date();
    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + 12);

    const occurrences = await this.generateEventsFromSeriesUseCase.execute(
      eventSeries.id!,
      now,
      endDate,
      365,
    );

    const events = await this.generateEventsForSubscriptionUseCase.execute({
      subscriptionId: subscription.id!,
      subscriptionName: subscription.name,
      subscriptionAmount: subscription.amount,
      eventSeriesId: eventSeries.id!,
      occurrences,
    });

    this.logger.log(`Generated ${events.length} events for subscription "${subscription.name}"`);

    return events.length;
  }
}
