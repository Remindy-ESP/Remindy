import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import type { ISubscriptionRepository } from '../ports/subscription-repository.interface';
import { SUBSCRIPTION_REPOSITORY } from '../ports/subscription-repository.interface';
import type { IEventRepository } from 'src/modules/event/application/ports/event-repository.interface';
import { EVENT_REPOSITORY } from 'src/modules/event/application/ports/event-repository.interface';
import { Subscription } from '../../domain/subscription.entity';
import { UpdateSubscriptionAppDto } from '../dto/update-subscription-app.dto';
import { UpdateFutureEventsStatusUseCase } from 'src/modules/event/application/use-cases/update-future-events-status.use-case';
import { SubscriptionEventGeneratorService } from '../services/subscription-event-generator.service';

@Injectable()
export class UpdateSubscriptionUseCase {
  constructor(
    @Inject(SUBSCRIPTION_REPOSITORY)
    private readonly subscriptionRepository: ISubscriptionRepository,
    @Inject(EVENT_REPOSITORY)
    private readonly eventRepository: IEventRepository,
    private readonly updateFutureEventsStatusUseCase: UpdateFutureEventsStatusUseCase,
    private readonly eventGeneratorService: SubscriptionEventGeneratorService,
  ) {}

  async execute(id: string, dto: UpdateSubscriptionAppDto): Promise<Subscription> {
    const existingSubscription = await this.subscriptionRepository.findById(id);

    if (!existingSubscription) {
      throw new NotFoundException(`Subscription with id ${id} not found`);
    }

    // Capturer les anciennes valeurs AVANT les modifications
    const oldStartDate = new Date(existingSubscription.startDate);

    // Apply updates
    if (dto.contractId !== undefined) {
      existingSubscription.updateContractId(dto.contractId);
    }

    if (dto.categoryId !== undefined) {
      existingSubscription.updateCategoryId(dto.categoryId);
    }

    if (dto.name !== undefined) {
      existingSubscription.updateName(dto.name);
    }

    if (dto.amount !== undefined) {
      existingSubscription.updateAmount(dto.amount);
    }

    if (dto.currency !== undefined) {
      existingSubscription.updateCurrency(dto.currency);
    }

    if (dto.frequency !== undefined) {
      existingSubscription.updateFrequency(dto.frequency);
    }

    if (dto.startDate !== undefined || dto.nextDueDate !== undefined || dto.endDate !== undefined) {
      const newStartDate = dto.startDate ?? existingSubscription.startDate;
      // If startDate changed but nextDueDate wasn't explicitly provided, pass undefined so the
      // entity recalculates nextDueDate from the new startDate + frequency automatically.
      const newNextDueDate =
        dto.nextDueDate ?? (dto.startDate !== undefined ? undefined : existingSubscription.nextDueDate);
      const newEndDate = dto.endDate !== undefined ? dto.endDate : existingSubscription.endDate;
      existingSubscription.updateDates(newStartDate, newNextDueDate, newEndDate);
    }

    if (dto.trialStartDate !== undefined || dto.trialEndDate !== undefined) {
      const newTrialStartDate = dto.trialStartDate ?? existingSubscription.trialStartDate;
      const newTrialEndDate = dto.trialEndDate ?? existingSubscription.trialEndDate;
      existingSubscription.updateTrialDates(newTrialStartDate, newTrialEndDate);
    }

    if (dto.status !== undefined) {
      const oldStatus = existingSubscription.status;
      existingSubscription.updateStatus(dto.status);

      // Mettre à jour les événements futurs en fonction du changement de statut
      if (oldStatus !== dto.status) {
        await this.updateFutureEventsBasedOnSubscriptionStatus(id, dto.status);
      }
    }

    if (dto.color !== undefined) {
      existingSubscription.updateColor(dto.color);
    }

    if (dto.notes !== undefined) {
      existingSubscription.updateNotes(dto.notes);
    }

    const updated = await this.subscriptionRepository.update(id, existingSubscription);

    if (!updated) {
      throw new NotFoundException(`Failed to update subscription with id ${id}`);
    }

    // Si le calendrier est modifié (dates ou fréquence), resynchroniser les événements
    if (dto.endDate !== undefined || dto.startDate !== undefined || dto.frequency !== undefined) {
      // 1. Si la date de début ou la fréquence changent, le planning entier est recalculé :
      //    annuler tous les événements futurs scheduled pour repartir sur une base propre.
      //    La déduplication dans generateEventsForSubscription ignore les 'canceled',
      //    ce qui permet de recréer les événements aux nouvelles dates.
      if (dto.startDate !== undefined || dto.frequency !== undefined) {
        await this.eventRepository.updateFutureEventsStatus(id, 'canceled');
      }

      // 1b. Si la date de début a changé, annuler aussi l'événement à l'ANCIENNE date de début
      //     (qui peut être dans le passé et ne serait pas touché par updateFutureEventsStatus)
      if (dto.startDate !== undefined) {
        await this.eventRepository.cancelScheduledEventOnDate(id, oldStartDate);
      }

      // 2. Annuler les événements planifiés au-delà de la nouvelle date de fin (raccourcissement)
      if (updated.endDate) {
        await this.eventRepository.cancelEventsAfterDate(id, updated.endDate);
      }

      // 3. Générer les événements manquants / recréer le calendrier depuis la nouvelle startDate
      //    (generateEventsForSubscription déduplique en ignorant les 'canceled')
      if (updated.frequency !== 'one-time') {
        const horizon = new Date();
        horizon.setMonth(horizon.getMonth() + 24);
        const effectiveEnd = updated.endDate
          ? new Date(Math.min(new Date(updated.endDate).getTime(), horizon.getTime()))
          : horizon;
        const count = this.eventGeneratorService.calculateOccurrencesCount(
          updated.startDate,
          updated.frequency,
          effectiveEnd,
        );
        await this.eventGeneratorService.generateEventsForSubscription({
          subscription: updated,
          count,
        });
      }
    }

    return updated;
  }

  /**
   * Met à jour le statut des événements futurs en fonction du statut de la subscription
   */
  private async updateFutureEventsBasedOnSubscriptionStatus(
    subscriptionId: string,
    subscriptionStatus: 'active' | 'paused' | 'cancelled' | 'trial',
  ): Promise<void> {
    let eventStatus: 'scheduled' | 'canceled';

    switch (subscriptionStatus) {
      case 'paused':
      case 'cancelled':
        eventStatus = 'canceled';
        break;
      case 'active':
      case 'trial':
        // Note: On ne réactive pas automatiquement les événements annulés
        // car ils ont pu être annulés individuellement
        return;
      default:
        return;
    }

    await this.updateFutureEventsStatusUseCase.execute(subscriptionId, eventStatus);
  }
}
