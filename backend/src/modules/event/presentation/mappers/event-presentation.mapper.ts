import { Event } from '../../domain/event.entity';
import { EventResponseDto } from '../dto/event-response.dto';
import { EventFilterDto } from '../dto/event-filter.dto';
import { EventFilterAppDto } from '../../application/dto/event-filter-app.dto';
import { RescheduleEventDto } from '../dto/reschedule-event.dto';
import { RescheduleEventAppDto } from '../../application/dto/reschedule-event-app.dto';

export class EventPresentationMapper {
  static toResponseDto(event: Event): EventResponseDto {
    const startsAtISO = event.startsAt.toISOString();
    return {
      id: event.id!,
      subscriptionId: event.subscriptionId,
      eventSeriesId: event.eventSeriesId,
      title: event.title,
      description: event.notes, // Map notes to description for frontend compatibility
      amount: event.amount,
      startsAt: startsAtISO,
      dueDate: startsAtISO, // Alias pour compatibilité frontend
      endsAt: event.endsAt?.toISOString(),
      status: event.status,
      paymentStatus: event.paymentStatus,
      notes: event.notes,
      userId: '', // Will be set by controller
      subscription: undefined, // Will be set by controller
      createdAt: event.createdAt!.toISOString(),
      updatedAt: event.updatedAt!.toISOString(),
    };
  }

  static toResponseDtoArray(events: Event[]): EventResponseDto[] {
    return events.map(event => this.toResponseDto(event));
  }

  static toFilterAppDto(dto: EventFilterDto): EventFilterAppDto {
    return {
      start: dto.start ? new Date(dto.start) : undefined,
      end: dto.end ? new Date(dto.end) : undefined,
      subscriptionId: dto.subscription_id,
      status: dto.status,
      paymentStatus: dto.payment_status,
      limit: dto.limit ?? 100,
      sort: dto.sort ?? 'starts_at:asc',
    };
  }

  static toRescheduleAppDto(dto: RescheduleEventDto): RescheduleEventAppDto {
    return {
      startsAt: new Date(dto.starts_at),
      endsAt: dto.ends_at ? new Date(dto.ends_at) : undefined,
      notes: dto.notes,
    };
  }
}
