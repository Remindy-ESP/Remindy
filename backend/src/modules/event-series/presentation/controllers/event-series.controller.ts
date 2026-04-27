import { Controller, Body, Param, Query, UseGuards, Req, NotFoundException } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
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
import {
  ApiEventSeriesCreate,
  ApiEventSeriesFindBySubscription,
  ApiEventSeriesGenerate,
} from '../../../../swagger/decorators/api-event-series.decorator';

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

  @ApiEventSeriesCreate()
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

  @ApiEventSeriesFindBySubscription()
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

  @ApiEventSeriesGenerate()
  async generateEvents(
    @Req() req: Request,
    @Param('id') id: string,
    @Query('start') start?: string,
    @Query('end') end?: string,
    @Query('max') max?: number,
  ) {
    const { user } = req as Request & { user: { userId: string; role: string } };

    const startDate = start ? new Date(start) : new Date();
    const endDate = end ? new Date(end) : new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);
    const maxOccurrences = max ? Number(max) : 365;

    const occurrences = await this.generateEventsUseCase.execute(
      id,
      startDate,
      endDate,
      maxOccurrences,
    );

    if (occurrences.length > 0) {
      const subscription = await this.findSubscriptionUseCase.findById(
        occurrences[0].subscriptionId,
      );
      if (subscription.userId !== user.userId) {
        throw new NotFoundException(`Event series with id ${id} not found`);
      }
    }

    return occurrences;
  }
}
