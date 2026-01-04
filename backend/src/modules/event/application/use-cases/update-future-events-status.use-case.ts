import { Injectable, Inject } from '@nestjs/common';
import type { IEventRepository } from '../ports/event-repository.interface';
import { EVENT_REPOSITORY } from '../ports/event-repository.interface';
import { EventStatus } from '../../domain/event.entity';

@Injectable()
export class UpdateFutureEventsStatusUseCase {
  constructor(
    @Inject(EVENT_REPOSITORY)
    private readonly eventRepository: IEventRepository,
  ) {}

  /**
   * Met à jour le statut de tous les événements futurs d'une subscription
   * @param subscriptionId - ID de la subscription
   * @param newStatus - Nouveau statut à appliquer
   * @returns Nombre d'événements mis à jour
   */
  async execute(subscriptionId: string, newStatus: EventStatus): Promise<number> {
    return await this.eventRepository.updateFutureEventsStatus(subscriptionId, newStatus);
  }
}
