import { EventSeries } from '../../domain/event-series.entity';
import { CreateEventSeriesDto } from '../dto/create-event-series.dto';
import { EventSeriesResponseDto } from '../dto/event-series-response.dto';
import { CreateEventSeriesAppDto } from '../../application/dto/create-event-series-app.dto';

export class EventSeriesPresentationMapper {
  static toCreateAppDto(dto: CreateEventSeriesDto): CreateEventSeriesAppDto {
    return {
      subscriptionId: dto.subscriptionId,
      rrule: dto.rrule,
      dtstart: new Date(dto.dtstart),
      timezone: dto.timezone || 'Europe/Paris',
      exdates: dto.exdates?.map(d => new Date(d)),
      rdates: dto.rdates?.map(d => new Date(d)),
    };
  }

  static toResponseDto(domain: EventSeries): EventSeriesResponseDto {
    return {
      id: domain.id!,
      subscriptionId: domain.subscriptionId,
      rrule: domain.rrule,
      dtstart: domain.dtstart,
      timezone: domain.timezone,
      exdates: domain.exdates,
      rdates: domain.rdates,
      createdAt: domain.createdAt!,
      updatedAt: domain.updatedAt!,
    };
  }
}
