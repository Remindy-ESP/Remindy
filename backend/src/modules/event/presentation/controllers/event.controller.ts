import {
  Controller,
  Get,
  Put,
  Patch,
  Delete,
  Param,
  Query,
  Body,
  HttpCode,
  HttpStatus,
  UseGuards,
  Req,
  NotFoundException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery, ApiBearerAuth } from '@nestjs/swagger';
import type { Request } from 'express';
import { ThrottlerGuard } from '@nestjs/throttler';
import { EventResponseDto } from '../dto/event-response.dto';
import { EventFilterDto } from '../dto/event-filter.dto';
import { RescheduleEventDto } from '../dto/reschedule-event.dto';
import { UpdateEventStatusDto } from '../dto/update-event-status.dto';
import { UpdateEventPaymentStatusDto } from '../dto/update-event-payment-status.dto';
import { FindAllEventsUseCase } from '../../application/use-cases/find-all-events.use-case';
import { RescheduleEventUseCase } from '../../application/use-cases/reschedule-event.use-case';
import { GetEventByIdUseCase } from '../../application/use-cases/get-event-by-id.use-case';
import { DeleteEventUseCase } from '../../application/use-cases/delete-event.use-case';
import { UpdateEventStatusUseCase } from '../../application/use-cases/update-event-status.use-case';
import { UpdateEventPaymentStatusUseCase } from '../../application/use-cases/update-event-payment-status.use-case';
import { EventPresentationMapper } from '../mappers/event-presentation.mapper';
import { JwtAuthGuard } from 'src/modules/auth/presentation/guards/jwt-auth.guard';
import { FindSubscriptionUseCase } from 'src/modules/subscription/application/use-cases/find-subscription.use-case';
import { FindAllSubscriptionsUseCase } from 'src/modules/subscription/application/use-cases/find-all-subscriptions.use-case';

@ApiTags('Calendar - Événements')
@Controller('calendar')
@UseGuards(ThrottlerGuard, JwtAuthGuard)
@ApiBearerAuth('access-token')
export class EventController {
  constructor(
    private readonly findAllEventsUseCase: FindAllEventsUseCase,
    private readonly rescheduleEventUseCase: RescheduleEventUseCase,
    private readonly getEventByIdUseCase: GetEventByIdUseCase,
    private readonly deleteEventUseCase: DeleteEventUseCase,
    private readonly updateEventStatusUseCase: UpdateEventStatusUseCase,
    private readonly updateEventPaymentStatusUseCase: UpdateEventPaymentStatusUseCase,
    private readonly findSubscriptionUseCase: FindSubscriptionUseCase,
    private readonly findAllSubscriptionsUseCase: FindAllSubscriptionsUseCase,
  ) {}

  @Get('events')
  @ApiOperation({ summary: 'Récupérer les événements du calendrier avec filtres' })
  @ApiQuery({
    name: 'start',
    required: false,
    description: 'Date de début (ISO 8601)',
    example: '2025-01-01T00:00:00Z',
  })
  @ApiQuery({
    name: 'end',
    required: false,
    description: 'Date de fin (ISO 8601)',
    example: '2025-12-31T23:59:59Z',
  })
  @ApiQuery({
    name: 'subscription_id',
    required: false,
    description: "Filtrer par ID d'abonnement",
  })
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
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Nombre limite de résultats (1-1000)',
    example: 100,
  })
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
  async findAll(
    @Req() req: Request,
    @Query() filters: EventFilterDto,
  ): Promise<EventResponseDto[]> {
    const { user } = req as Request & { user: { userId: string; role: string } };

    const userSubscriptions = await this.findAllSubscriptionsUseCase.execute({ userId: user.userId });
    const userSubscriptionIds = userSubscriptions.map(sub => sub.id!);

    const appFilters = EventPresentationMapper.toFilterAppDto(filters);
    const events = await this.findAllEventsUseCase.execute(appFilters);

    const userEvents = events.filter(event => userSubscriptionIds.includes(event.subscriptionId));
    return EventPresentationMapper.toResponseDtoArray(userEvents);
  }

  @Get('event/:id')
  @ApiOperation({ summary: 'Récupérer un événement par son ID' })
  @ApiParam({ name: 'id', description: "ID de l'événement" })
  @ApiResponse({
    status: 200,
    description: 'Événement trouvé',
    type: EventResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Événement non trouvé' })
  async findOne(@Req() req: Request, @Param('id') id: string): Promise<EventResponseDto> {
    const { user } = req as Request & { user: { userId: string; role: string } };
    const event = await this.getEventByIdUseCase.execute(id);

    const subscription = await this.findSubscriptionUseCase.findById(event.subscriptionId);
    if (subscription.userId !== user.userId) {
      throw new NotFoundException(`Event with id ${id} not found`);
    }

    return EventPresentationMapper.toResponseDto(event);
  }

  @Put('event/:id/reschedule')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reprogrammer un événement' })
  @ApiParam({ name: 'id', description: "ID de l'événement" })
  @ApiResponse({
    status: 200,
    description: 'Événement reprogrammé avec succès',
    type: EventResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Événement non trouvé' })
  @ApiResponse({ status: 400, description: 'Données invalides' })
  async reschedule(
    @Req() req: Request,
    @Param('id') id: string,
    @Body() rescheduleDto: RescheduleEventDto,
  ): Promise<EventResponseDto> {
    const { user } = req as Request & { user: { userId: string; role: string } };
    const existing = await this.getEventByIdUseCase.execute(id);

    const subscription = await this.findSubscriptionUseCase.findById(existing.subscriptionId);
    if (subscription.userId !== user.userId) {
      throw new NotFoundException(`Event with id ${id} not found`);
    }

    const appDto = EventPresentationMapper.toRescheduleAppDto(rescheduleDto);
    const event = await this.rescheduleEventUseCase.execute(id, appDto);
    return EventPresentationMapper.toResponseDto(event);
  }

  @Patch('event/:id/status')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Mettre à jour le statut d'un événement" })
  @ApiParam({ name: 'id', description: "ID de l'événement" })
  @ApiResponse({
    status: 200,
    description: 'Statut mis à jour avec succès',
    type: EventResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Événement non trouvé' })
  @ApiResponse({ status: 400, description: 'Transition de statut invalide' })
  async updateStatus(
    @Req() req: Request,
    @Param('id') id: string,
    @Body() updateStatusDto: UpdateEventStatusDto,
  ): Promise<EventResponseDto> {
    const { user } = req as Request & { user: { userId: string; role: string } };
    const existing = await this.getEventByIdUseCase.execute(id);

    const subscription = await this.findSubscriptionUseCase.findById(existing.subscriptionId);
    if (subscription.userId !== user.userId) {
      throw new NotFoundException(`Event with id ${id} not found`);
    }

    const event = await this.updateEventStatusUseCase.execute(id, updateStatusDto.status);
    return EventPresentationMapper.toResponseDto(event);
  }

  @Patch('event/:id/payment-status')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Mettre à jour le statut de paiement d'un événement" })
  @ApiParam({ name: 'id', description: "ID de l'événement" })
  @ApiResponse({
    status: 200,
    description: 'Statut de paiement mis à jour avec succès',
    type: EventResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Événement non trouvé' })
  async updatePaymentStatus(
    @Req() req: Request,
    @Param('id') id: string,
    @Body() updatePaymentStatusDto: UpdateEventPaymentStatusDto,
  ): Promise<EventResponseDto> {
    const { user } = req as Request & { user: { userId: string; role: string } };
    const existing = await this.getEventByIdUseCase.execute(id);

    const subscription = await this.findSubscriptionUseCase.findById(existing.subscriptionId);
    if (subscription.userId !== user.userId) {
      throw new NotFoundException(`Event with id ${id} not found`);
    }

    const event = await this.updateEventPaymentStatusUseCase.execute(
      id,
      updatePaymentStatusDto.paymentStatus,
    );
    return EventPresentationMapper.toResponseDto(event);
  }

  @Delete('event/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Supprimer un événement (soft delete)' })
  @ApiParam({ name: 'id', description: "ID de l'événement" })
  @ApiResponse({
    status: 204,
    description: 'Événement supprimé avec succès',
  })
  @ApiResponse({ status: 404, description: 'Événement non trouvé' })
  async delete(@Req() req: Request, @Param('id') id: string): Promise<void> {
    const { user } = req as Request & { user: { userId: string; role: string } };
    const existing = await this.getEventByIdUseCase.execute(id);

    const subscription = await this.findSubscriptionUseCase.findById(existing.subscriptionId);
    if (subscription.userId !== user.userId) {
      throw new NotFoundException(`Event with id ${id} not found`);
    }

    await this.deleteEventUseCase.execute(id);
  }
}
