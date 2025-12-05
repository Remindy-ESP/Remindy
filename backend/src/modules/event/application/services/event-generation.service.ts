import { Injectable, Inject, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import type { ISubscriptionRepository } from '../../../subscription/application/ports/subscription-repository.interface';
import { SUBSCRIPTION_REPOSITORY } from '../../../subscription/application/ports/subscription-repository.interface';
import type { IEventSeriesRepository } from '../../../event-series/application/ports/event-series-repository.interface';
import { EVENT_SERIES_REPOSITORY } from '../../../event-series/application/ports/event-series-repository.interface';
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
   * CRON job that runs every day at midnight
   * Generates events for the next 12 months for all active subscriptions
   */
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async generateEventsForAllSubscriptions() {
    this.logger.log('Starting automatic event generation job...');

    try {
      // Fetch all active subscriptions
      const subscriptions = await this.subscriptionRepository.findAll({
        status: 'active',
      });

      this.logger.log(`Found ${subscriptions.length} active subscriptions`);

      let totalEventsGenerated = 0;

      for (const subscription of subscriptions) {
        try {
          // Chercher l'event_series pour cet abonnement
          const eventSeries = await this.eventSeriesRepository.findBySubscriptionId(
            subscription.id!,
          );

          if (!eventSeries) {
            this.logger.warn(`No event series found for subscription ${subscription.id}`);
            continue;
          }

          // Generate occurrences for the next 12 months
          const now = new Date();
          const endDate = new Date();
          endDate.setMonth(endDate.getMonth() + 12);

          const occurrences = await this.generateEventsFromSeriesUseCase.execute(
            eventSeries.id!,
            now,
            endDate,
            365, // Max 365 occurrences
          );

          // Create events
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
   * Manual method to generate events for a specific subscription
   * Can be called via an endpoint or an event
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

    // Generate occurrences for the next 12 months
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
