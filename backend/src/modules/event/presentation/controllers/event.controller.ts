import { Controller, Get, Put, Param, Query, Body, HttpCode, HttpStatus, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery } from '@nestjs/swagger';
import { ThrottlerGuard } from '@nestjs/throttler';
import { EventResponseDto } from '../dto/event-response.dto';
import { EventFilterDto } from '../dto/event-filter.dto';
import { RescheduleEventDto } from '../dto/reschedule-event.dto';
import { FindAllEventsUseCase } from '../../application/use-cases/find-all-events.use-case';
import { RescheduleEventUseCase } from '../../application/use-cases/reschedule-event.use-case';
import { EventPresentationMapper } from '../mappers/event-presentation.mapper';

@ApiTags('Calendar - Événements')
@Controller('v1/calendar')
@UseGuards(ThrottlerGuard)
export class EventController {
  constructor(
    private readonly findAllEventsUseCase: FindAllEventsUseCase,
    private readonly rescheduleEventUseCase: RescheduleEventUseCase,
  ) {}

  @Get('events')
  @ApiOperation({ summary: 'Récupérer les événements du calendrier avec filtres' })
  @ApiQuery({ name: 'start', required: false, description: 'Date de début (ISO 8601)', example: '2025-01-01T00:00:00Z' })
  @ApiQuery({ name: 'end', required: false, description: 'Date de fin (ISO 8601)', example: '2025-12-31T23:59:59Z' })
  @ApiQuery({ name: 'subscription_id', required: false, description: 'Filtrer par ID d\'abonnement' })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: ['scheduled', 'completed', 'canceled', 'failed'],
    description: 'Filtrer par statut',
  })
  @ApiQuery({
    name: 'payment_status',
    required: false,
    enum: ['pending', 'paid', 'failed'],
    description: 'Filtrer par statut de paiement',
  })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Nombre limite de résultats (1-1000)', example: 100 })
  @ApiQuery({
    name: 'sort',
    required: false,
    enum: ['starts_at:asc', 'starts_at:desc', 'amount:asc', 'amount:desc'],
    description: 'Tri des résultats',
    example: 'starts_at:asc',
  })
  @ApiResponse({
    status: 200,
    description: 'Liste des événements',
    type: [EventResponseDto],
  })
  async findAll(@Query() filters: EventFilterDto): Promise<EventResponseDto[]> {
    const appFilters = EventPresentationMapper.toFilterAppDto(filters);
    const events = await this.findAllEventsUseCase.execute(appFilters);
    return EventPresentationMapper.toResponseDtoArray(events);
  }

  @Put('event/:id/reschedule')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reprogrammer un événement' })
  @ApiParam({ name: 'id', description: 'ID de l\'événement' })
  @ApiResponse({
    status: 200,
    description: 'Événement reprogrammé avec succès',
    type: EventResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Événement non trouvé' })
  @ApiResponse({ status: 400, description: 'Données invalides' })
  async reschedule(
    @Param('id') id: string,
    @Body() rescheduleDto: RescheduleEventDto,
  ): Promise<EventResponseDto> {
    const appDto = EventPresentationMapper.toRescheduleAppDto(rescheduleDto);
    const event = await this.rescheduleEventUseCase.execute(id, appDto);
    return EventPresentationMapper.toResponseDto(event);
  }
}
