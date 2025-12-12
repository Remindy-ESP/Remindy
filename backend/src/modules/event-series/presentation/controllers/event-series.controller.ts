import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  HttpCode,
  HttpStatus,
  UseGuards,
  Query,
  Req,
  NotFoundException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery, ApiBearerAuth } from '@nestjs/swagger';
import type { Request } from 'express';
import { ThrottlerGuard } from '@nestjs/throttler';
import { CreateEventSeriesDto } from '../dto/create-event-series.dto';
import { EventSeriesResponseDto } from '../dto/event-series-response.dto';
import { CreateEventSeriesUseCase } from '../../application/use-cases/create-event-series.use-case';
import { FindEventSeriesBySubscriptionUseCase } from '../../application/use-cases/find-event-series-by-subscription.use-case';
import { GenerateEventsFromSeriesUseCase } from '../../application/use-cases/generate-events-from-series.use-case';
import { EventSeriesPresentationMapper } from '../mappers/event-series-presentation.mapper';
import { JwtAuthGuard } from 'src/modules/auth/presentation/guards/jwt-auth.guard';
import { FindSubscriptionUseCase } from 'src/modules/subscription/application/use-cases/find-subscription.use-case';

@ApiTags('Event Series - Récurrence')
@Controller('event-series')
@UseGuards(ThrottlerGuard, JwtAuthGuard)
@ApiBearerAuth('access-token')
export class EventSeriesController {
  constructor(
    private readonly createEventSeriesUseCase: CreateEventSeriesUseCase,
    private readonly findBySubscriptionUseCase: FindEventSeriesBySubscriptionUseCase,
    private readonly generateEventsUseCase: GenerateEventsFromSeriesUseCase,
    private readonly findSubscriptionUseCase: FindSubscriptionUseCase,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Créer une règle de récurrence pour un abonnement' })
  @ApiResponse({
    status: 201,
    description: 'Règle de récurrence créée avec succès',
    type: EventSeriesResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Données invalides' })
  async create(
    @Req() req: Request,
    @Body() createDto: CreateEventSeriesDto,
  ): Promise<EventSeriesResponseDto> {
    const { user } = req as Request & { user: { userId: string; role: string } };

    const subscription = await this.findSubscriptionUseCase.findById(createDto.subscriptionId);
    if (subscription.userId !== user.userId) {
      throw new NotFoundException(`Subscription with id ${createDto.subscriptionId} not found`);
    }

    const appDto = EventSeriesPresentationMapper.toCreateAppDto(createDto);
    const eventSeries = await this.createEventSeriesUseCase.execute(appDto);
    return EventSeriesPresentationMapper.toResponseDto(eventSeries);
  }

  @Get('subscription/:subscriptionId')
  @ApiOperation({ summary: "Récupérer la règle de récurrence d'un abonnement" })
  @ApiParam({ name: 'subscriptionId', description: "ID de l'abonnement" })
  @ApiResponse({
    status: 200,
    description: 'Règle de récurrence trouvée',
    type: EventSeriesResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Règle de récurrence non trouvée' })
  async findBySubscription(
    @Req() req: Request,
    @Param('subscriptionId') subscriptionId: string,
  ): Promise<EventSeriesResponseDto> {
    const { user } = req as Request & { user: { userId: string; role: string } };

    const subscription = await this.findSubscriptionUseCase.findById(subscriptionId);
    if (subscription.userId !== user.userId) {
      throw new NotFoundException(`Subscription with id ${subscriptionId} not found`);
    }

    const eventSeries = await this.findBySubscriptionUseCase.execute(subscriptionId);
    return EventSeriesPresentationMapper.toResponseDto(eventSeries);
  }

  @Get(':id/generate')
  @ApiOperation({ summary: "Générer les occurrences d'événements pour une période" })
  @ApiParam({ name: 'id', description: 'ID de la règle de récurrence' })
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
    name: 'max',
    required: false,
    type: Number,
    description: "Nombre maximum d'occurrences",
    example: 12,
  })
  @ApiResponse({
    status: 200,
    description: 'Occurrences générées',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          subscriptionId: { type: 'string' },
          eventSeriesId: { type: 'string' },
          startsAt: { type: 'string', format: 'date-time' },
        },
      },
    },
  })
  async generateEvents(
    @Req() req: Request,
    @Param('id') id: string,
    @Query('start') start?: string,
    @Query('end') end?: string,
    @Query('max') max?: number,
  ) {
    const { user } = req as Request & { user: { userId: string; role: string } };

    const startDate = start ? new Date(start) : new Date();
    const endDate = end ? new Date(end) : new Date(Date.now() + 365 * 24 * 60 * 60 * 1000); // +1 year
    const maxOccurrences = max ? Number(max) : 365;

    const occurrences = await this.generateEventsUseCase.execute(id, startDate, endDate, maxOccurrences);

    if (occurrences.length > 0) {
      const subscription = await this.findSubscriptionUseCase.findById(occurrences[0].subscriptionId);
      if (subscription.userId !== user.userId) {
        throw new NotFoundException(`Event series with id ${id} not found`);
      }
    }

    return occurrences;
  }
}
