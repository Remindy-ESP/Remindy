import { Injectable, Logger, Inject } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { SubscriptionEventGeneratorService } from '../../subscription/application/services/subscription-event-generator.service';
import type { ISubscriptionRepository } from '../../subscription/application/ports/subscription-repository.interface';
import { SUBSCRIPTION_REPOSITORY } from '../../subscription/application/ports/subscription-repository.interface';

@Injectable()
export class RegenerateEventsTask {
  private readonly logger = new Logger(RegenerateEventsTask.name);

  constructor(
    private readonly eventGeneratorService: SubscriptionEventGeneratorService,
    @Inject(SUBSCRIPTION_REPOSITORY)
    private readonly subscriptionRepository: ISubscriptionRepository,
  ) {}

  /**
   * Cron job qui s'exécute tous les jours à 2h du matin
   * Régénère les événements manquants pour toutes les subscriptions actives
   */
  @Cron(CronExpression.EVERY_DAY_AT_2AM)
  async handleCron() {
    this.logger.log('Starting event regeneration task...');

    try {
      // Récupérer toutes les subscriptions actives
      const subscriptions = await this.subscriptionRepository.findAll({
        status: 'active',
      });

      this.logger.log(`Found ${subscriptions.length} active subscriptions`);

      let totalEventsGenerated = 0;

      for (const subscription of subscriptions) {
        try {
          const events = await this.eventGeneratorService.regenerateEventsIfNeeded(
            subscription,
            24, // Maintenir 24 mois d'avance (jusqu'en 2099 pour les abonnements sans fin)
            6, // Régénérer si moins de 6 mois d'avance
          );

          if (events.length > 0) {
            this.logger.log(
              `Generated ${events.length} events for subscription ${subscription.id} (${subscription.name})`,
            );
            totalEventsGenerated += events.length;
          }
        } catch (error) {
          this.logger.error(
            `Failed to regenerate events for subscription ${subscription.id}: ${error}`,
          );
        }
      }

      this.logger.log(
        `Event regeneration task completed. Total events generated: ${totalEventsGenerated}`,
      );
    } catch (error) {
      this.logger.error(`Event regeneration task failed: ${error}`);
    }
  }

  /**
   * Méthode pour déclencher manuellement la régénération (utile pour les tests)
   */
  async triggerManually(): Promise<{ subscriptionsProcessed: number; eventsGenerated: number }> {
    this.logger.log('Manually triggering event regeneration...');

    const subscriptions = await this.subscriptionRepository.findAll({
      status: 'active',
    });

    let totalEventsGenerated = 0;

    for (const subscription of subscriptions) {
      try {
        const events = await this.eventGeneratorService.regenerateEventsIfNeeded(
          subscription,
          24,
          6,
        );
        totalEventsGenerated += events.length;
      } catch (error) {
        this.logger.error(
          `Failed to regenerate events for subscription ${subscription.id}: ${error}`,
        );
      }
    }

    return {
      subscriptionsProcessed: subscriptions.length,
      eventsGenerated: totalEventsGenerated,
    };
  }
}
