import { Injectable, Inject } from '@nestjs/common';
import { EventSeries } from '../../domain/event-series.entity';
import { CreateEventSeriesAppDto } from '../dto/create-event-series-app.dto';
import type { IEventSeriesRepository } from '../ports/event-series-repository.interface';
import { EVENT_SERIES_REPOSITORY } from '../ports/event-series-repository.interface';

@Injectable()
export class CreateEventSeriesUseCase {
  constructor(
    @Inject(EVENT_SERIES_REPOSITORY)
    private readonly repository: IEventSeriesRepository,
  ) {}

  async execute(dto: CreateEventSeriesAppDto): Promise<EventSeries> {
    const eventSeries = new EventSeries({
      subscriptionId: dto.subscriptionId,
      rrule: dto.rrule,
      dtstart: dto.dtstart,
      timezone: dto.timezone || 'Europe/Paris',
      exdates: dto.exdates,
      rdates: dto.rdates,
    });

    return await this.repository.create(eventSeries);
  }
}
