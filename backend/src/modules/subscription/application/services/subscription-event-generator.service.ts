import { Injectable, Inject } from '@nestjs/common';
import { Event } from '../../../event/domain/event.entity';
import type { IEventRepository } from '../../../event/application/ports/event-repository.interface';
import { EVENT_REPOSITORY } from '../../../event/application/ports/event-repository.interface';
import type { SubscriptionFrequency } from '../../domain/subscription.entity';
import { Subscription } from '../../domain/subscription.entity';
import {
  addDaysUTC,
  addMonthsUTC,
  addYearsUTC,
  toUTCDateString,
} from '../../../../utils/date.utils';

export interface GenerateEventsOptions {
  subscription: Subscription;
  count: number;
  timezone?: string;
}

@Injectable()
export class SubscriptionEventGeneratorService {
  constructor(
    @Inject(EVENT_REPOSITORY)
    private readonly eventRepository: IEventRepository,
  ) {}

  /**
   * Génère une RRULE iCal à partir de la fréquence de l'abonnement
   */
  generateRruleFromFrequency(frequency: SubscriptionFrequency): string {
    switch (frequency) {
      case 'weekly':
        return 'FREQ=WEEKLY;INTERVAL=1';
      case 'monthly':
        return 'FREQ=MONTHLY;INTERVAL=1';
      case 'quarterly':
        return 'FREQ=MONTHLY;INTERVAL=3';
      case 'yearly':
        return 'FREQ=YEARLY;INTERVAL=1';
      default:
        return 'FREQ=MONTHLY;INTERVAL=1';
    }
  }

  /**
   * Calcule les dates d'occurrence à partir de la fréquence
   */
  calculateOccurrences(startDate: Date, frequency: SubscriptionFrequency, count: number): Date[] {
    const occurrences: Date[] = [];
    let currentDate = new Date(startDate);

    for (let i = 0; i < count; i++) {
      occurrences.push(new Date(currentDate));
      currentDate = this.addFrequencyInterval(currentDate, frequency);
    }

    return occurrences;
  }

  /**
   * Ajoute un intervalle de fréquence à une date (utilise UTC pour éviter les problèmes DST)
   */
  private addFrequencyInterval(date: Date, frequency: SubscriptionFrequency): Date {
    switch (frequency) {
      case 'weekly':
        return addDaysUTC(date, 7);
      case 'monthly':
        return addMonthsUTC(date, 1);
      case 'quarterly':
        return addMonthsUTC(date, 3);
      case 'yearly':
        return addYearsUTC(date, 1);
      default:
        return addMonthsUTC(date, 1);
    }
  }

  /**
   * Génère les événements de paiement pour un abonnement
   */
  async generateEventsForSubscription(options: GenerateEventsOptions): Promise<Event[]> {
    const { subscription, count } = options;

    // Récupérer les événements existants pour éviter les doublons
    const existingEvents = await this.eventRepository.findBySubscriptionId(subscription.id!);
    const existingDates = new Set(existingEvents.map(e => toUTCDateString(e.startsAt)));

    // Calculer les occurrences
    const occurrences = this.calculateOccurrences(
      subscription.startDate,
      subscription.frequency,
      count,
    );

    // Filtrer les occurrences qui existent déjà
    const newOccurrences = occurrences.filter(date => {
      const dateKey = toUTCDateString(date);
      return !existingDates.has(dateKey);
    });

    if (newOccurrences.length === 0) {
      return [];
    }

    // Créer les nouveaux événements
    const events = newOccurrences.map(
      startsAt =>
        new Event({
          subscriptionId: subscription.id!,
          title: `Paiement ${subscription.name}`,
          amount: subscription.amount,
          startsAt,
          status: 'scheduled',
          paymentStatus: 'pending',
        }),
    );

    return await this.eventRepository.createMany(events);
  }

  /**
   * Régénère les événements manquants pour maintenir X mois d'avance
   */
  async regenerateEventsIfNeeded(
    subscription: Subscription,
    monthsAhead: number = 12,
    thresholdMonths: number = 3,
  ): Promise<Event[]> {
    // Récupérer les événements existants
    const existingEvents = await this.eventRepository.findBySubscriptionId(subscription.id!);

    if (existingEvents.length === 0) {
      // Aucun événement, générer tout
      return this.generateEventsForSubscription({
        subscription,
        count: monthsAhead,
      });
    }

    // Trouver la date du dernier événement
    const lastEventDate = existingEvents.reduce((latest, event) => {
      return new Date(Math.max(event.startsAt.getTime(), latest.getTime()));
    }, new Date(0));

    // Calculer la date seuil (maintenant + threshold mois)
    const now = new Date();
    const thresholdDate = new Date(now);
    thresholdDate.setMonth(thresholdDate.getMonth() + thresholdMonths);

    // Si le dernier événement est avant le seuil, régénérer
    if (lastEventDate < thresholdDate) {
      // Calculer combien d'événements générer
      const targetDate = new Date(now);
      targetDate.setMonth(targetDate.getMonth() + monthsAhead);

      // Générer à partir de la dernière date
      const startFromDate = this.addFrequencyInterval(lastEventDate, subscription.frequency);
      const tempSubscription = new Subscription({
        ...this.subscriptionToProps(subscription),
        startDate: startFromDate,
      });

      // Calculer le nombre d'occurrences nécessaires
      let count = 0;
      let checkDate = new Date(startFromDate);
      while (checkDate <= targetDate && count < 24) {
        count++;
        checkDate = this.addFrequencyInterval(checkDate, subscription.frequency);
      }

      if (count > 0) {
        return this.generateEventsForSubscription({
          subscription: tempSubscription,
          count,
        });
      }
    }

    return [];
  }

  /**
   * Convertit une Subscription en props pour recréer une instance
   */
  private subscriptionToProps(subscription: Subscription) {
    return {
      id: subscription.id,
      userId: subscription.userId,
      contractId: subscription.contractId,
      name: subscription.name,
      amount: subscription.amount,
      currency: subscription.currency,
      frequency: subscription.frequency,
      startDate: subscription.startDate,
      nextDueDate: subscription.nextDueDate,
      trialStartDate: subscription.trialStartDate,
      trialEndDate: subscription.trialEndDate,
      status: subscription.status,
      color: subscription.color,
      notes: subscription.notes,
      createdAt: subscription.createdAt,
      updatedAt: subscription.updatedAt,
    };
  }
}
