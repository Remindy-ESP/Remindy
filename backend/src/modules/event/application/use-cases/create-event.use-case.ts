import { Injectable, Inject } from '@nestjs/common';
import { Event } from '../../domain/event.entity';
import { IEventRepository, EVENT_REPOSITORY } from '../ports/event-repository.interface';

export interface CreateEventDto {
  subscriptionId: string;
  eventSeriesId?: string;
  title: string;
  amount: number;
  startsAt: Date;
  endsAt?: Date;
  status?: 'scheduled' | 'completed' | 'canceled' | 'failed';
  paymentStatus?: 'pending' | 'paid' | 'failed';
  notes?: string;
}

@Injectable()
export class CreateEventUseCase {
  constructor(
    @Inject(EVENT_REPOSITORY)
    private readonly repository: IEventRepository,
  ) {}

  async execute(dto: CreateEventDto): Promise<Event> {
    const event = new Event({
      subscriptionId: dto.subscriptionId,
      eventSeriesId: dto.eventSeriesId,
      title: dto.title,
      amount: dto.amount,
      startsAt: dto.startsAt,
      endsAt: dto.endsAt,
      status: dto.status || 'scheduled',
      paymentStatus: dto.paymentStatus,
      notes: dto.notes,
    });

    return await this.repository.create(event);
  }

  async createMany(dtos: CreateEventDto[]): Promise<Event[]> {
    const events = dtos.map(
      (dto) =>
        new Event({
          subscriptionId: dto.subscriptionId,
          eventSeriesId: dto.eventSeriesId,
          title: dto.title,
          amount: dto.amount,
          startsAt: dto.startsAt,
          endsAt: dto.endsAt,
          status: dto.status || 'scheduled',
          paymentStatus: dto.paymentStatus,
          notes: dto.notes,
        }),
    );

    return await this.repository.createMany(events);
  }
}
