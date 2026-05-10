import { Controller, Body, Param, Query, UseGuards, Req, NotFoundException } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
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
import { SubscriptionPresentationMapper } from 'src/modules/subscription/presentation/mappers/subscription-presentation.mapper';
import {
  ApiEventFindAll,
  ApiEventFindOne,
  ApiEventReschedule,
  ApiEventUpdateStatus,
  ApiEventUpdatePaymentStatus,
  ApiEventDelete,
} from '../../../../swagger/decorators/api-event.decorator';

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

  @ApiEventFindAll()
  async findAll(
    @Req() req: Request,
    @Query() filters: EventFilterDto,
  ): Promise<EventResponseDto[]> {
    const { user } = req as Request & { user: { userId: string; role: string } };

    const userSubscriptions = await this.findAllSubscriptionsUseCase.execute({
      userId: user.userId,
    });
    const userSubscriptionIds = new Set(userSubscriptions.map(sub => sub.id!));
    const subscriptionMap = new Map(userSubscriptions.map(sub => [sub.id!, sub]));

    const appFilters = EventPresentationMapper.toFilterAppDto(filters);
    const events = await this.findAllEventsUseCase.execute(appFilters);

    const userEvents = events.filter(event => userSubscriptionIds.has(event.subscriptionId));

    return userEvents.map(event => {
      const dto = EventPresentationMapper.toResponseDto(event);
      const subscription = subscriptionMap.get(event.subscriptionId);
      return {
        ...dto,
        subscription: subscription
          ? SubscriptionPresentationMapper.toResponseDto(subscription)
          : undefined,
        userId: user.userId,
      };
    });
  }

  @ApiEventFindOne()
  async findOne(@Req() req: Request, @Param('id') id: string): Promise<EventResponseDto> {
    const { user } = req as Request & { user: { userId: string; role: string } };
    const event = await this.getEventByIdUseCase.execute(id);

    const subscription = await this.findSubscriptionUseCase.findById(event.subscriptionId);
    if (subscription.userId !== user.userId) {
      throw new NotFoundException(`Event with id ${id} not found`);
    }

    return EventPresentationMapper.toResponseDto(event);
  }

  @ApiEventReschedule()
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

  @ApiEventUpdateStatus()
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

  @ApiEventUpdatePaymentStatus()
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

  @ApiEventDelete()
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
