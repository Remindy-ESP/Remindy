import { Controller, Body, Param, Query, UseGuards, Req, NotFoundException } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import type { Request } from 'express';
import { ThrottlerGuard } from '@nestjs/throttler';
import { CreateSubscriptionDto } from '../dto/create-subscription.dto';
import { UpdateSubscriptionDto } from '../dto/update-subscription.dto';
import { SubscriptionResponseDto } from '../dto/subscription-response.dto';
import { SubscriptionFilterDto } from '../dto/subscription-filter.dto';
import { CreateSubscriptionUseCase } from '../../application/use-cases/create-subscription.use-case';
import { UpdateSubscriptionUseCase } from '../../application/use-cases/update-subscription.use-case';
import { DeleteSubscriptionUseCase } from '../../application/use-cases/delete-subscription.use-case';
import { FindSubscriptionUseCase } from '../../application/use-cases/find-subscription.use-case';
import { FindAllSubscriptionsUseCase } from '../../application/use-cases/find-all-subscriptions.use-case';
import { FindSubscriptionsByPeriodUseCase } from '../../application/use-cases/find-subscriptions-by-period.use-case';
import { PauseSubscriptionUseCase } from '../../application/use-cases/pause-subscription.use-case';
import { ResumeSubscriptionUseCase } from '../../application/use-cases/resume-subscription.use-case';
import { FindSubscriptionEventsUseCase } from '../../application/use-cases/find-subscription-events.use-case';
import { SubscriptionPresentationMapper } from '../mappers/subscription-presentation.mapper';
import { JwtAuthGuard } from 'src/modules/auth/presentation/guards/jwt-auth.guard';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SubscriptionEntity } from '../../infrastructure/persistence/subscription.entity';
import { CategoryPresentationMapper } from '../../../category/presentation/mappers/category-presentation.mapper';
import { CategoryMapper } from '../../../category/infrastructure/mappers/category.mapper';
import {
  ApiSubscriptionCreate,
  ApiSubscriptionFindAll,
  ApiSubscriptionFindByFrequency,
  ApiSubscriptionFindById,
  ApiSubscriptionUpdate,
  ApiSubscriptionDelete,
  ApiSubscriptionPause,
  ApiSubscriptionResume,
  ApiSubscriptionGetEvents,
} from '../../../../swagger/decorators/api-subscription.decorator';

@ApiTags('Abonnements')
@Controller('subscriptions')
@UseGuards(ThrottlerGuard, JwtAuthGuard)
@ApiBearerAuth('access-token')
export class SubscriptionController {
  constructor(
    private readonly createSubscriptionUseCase: CreateSubscriptionUseCase,
    private readonly updateSubscriptionUseCase: UpdateSubscriptionUseCase,
    private readonly deleteSubscriptionUseCase: DeleteSubscriptionUseCase,
    private readonly findSubscriptionUseCase: FindSubscriptionUseCase,
    private readonly findAllSubscriptionsUseCase: FindAllSubscriptionsUseCase,
    private readonly findSubscriptionsByPeriodUseCase: FindSubscriptionsByPeriodUseCase,
    private readonly pauseSubscriptionUseCase: PauseSubscriptionUseCase,
    private readonly resumeSubscriptionUseCase: ResumeSubscriptionUseCase,
    private readonly findSubscriptionEventsUseCase: FindSubscriptionEventsUseCase,
    @InjectRepository(SubscriptionEntity)
    private readonly subscriptionRepository: Repository<SubscriptionEntity>,
  ) {}

  @ApiSubscriptionCreate()
  async create(
    @Req() req: Request,
    @Body() createDto: CreateSubscriptionDto,
  ): Promise<SubscriptionResponseDto> {
    const { user } = req as Request & { user: { userId: string; role: string } };
    createDto.userId = user.userId;

    const appDto = SubscriptionPresentationMapper.toCreateAppDto(createDto);
    const result = await this.createSubscriptionUseCase.execute(appDto);
    const responseDto = SubscriptionPresentationMapper.toResponseDto(result.subscription);
    responseDto.eventsGenerated = result.eventsGenerated;

    if (result.subscription.categoryId) {
      const entity = await this.subscriptionRepository.findOne({
        where: { id: result.subscription.id },
        relations: ['category'],
      });
      if (entity?.category) {
        const categoryDomain = CategoryMapper.toDomain(entity.category);
        responseDto.category = CategoryPresentationMapper.toResponseDto(categoryDomain);
      }
    }

    return responseDto;
  }

  @ApiSubscriptionFindAll()
  async findAll(
    @Req() req: Request,
    @Query() filters: SubscriptionFilterDto,
  ): Promise<SubscriptionResponseDto[]> {
    const { user } = req as Request & { user: { userId: string; role: string } };
    filters.userId = user.userId;

    const appFilters = SubscriptionPresentationMapper.toFilterAppDto(filters);
    const subscriptions = await this.findAllSubscriptionsUseCase.execute(appFilters);
    const responseDtos = SubscriptionPresentationMapper.toResponseDtoArray(subscriptions);
    const subscriptionIds = subscriptions
      .map(s => s.id)
      .filter((id): id is string => id !== undefined);
    const entities = await this.subscriptionRepository.find({
      where: subscriptionIds.map(id => ({ id })),
      relations: ['category'],
    });

    responseDtos.forEach(dto => {
      const entity = entities?.find(e => e.id === dto.id);
      if (entity?.category) {
        const categoryDomain = CategoryMapper.toDomain(entity.category);
        dto.category = CategoryPresentationMapper.toResponseDto(categoryDomain);
      }
    });

    return responseDtos;
  }

  @ApiSubscriptionFindByFrequency()
  async findByFrequency(
    @Req() req: Request,
    @Param('type') type: string,
  ): Promise<SubscriptionResponseDto[]> {
    const { user } = req as Request & { user: { userId: string; role: string } };
    const subscriptions = await this.findSubscriptionsByPeriodUseCase.execute(type);
    const userSubscriptions = subscriptions.filter(sub => sub.userId === user.userId);
    return SubscriptionPresentationMapper.toResponseDtoArray(userSubscriptions);
  }

  @ApiSubscriptionFindById()
  async findById(@Req() req: Request, @Param('id') id: string): Promise<SubscriptionResponseDto> {
    const { user } = req as Request & { user: { userId: string; role: string } };
    const subscription = await this.findSubscriptionUseCase.findById(id);

    if (subscription.userId !== user.userId) {
      throw new NotFoundException(`Subscription with id ${id} not found`);
    }

    const responseDto = SubscriptionPresentationMapper.toResponseDto(subscription);

    if (subscription.categoryId) {
      const entity = await this.subscriptionRepository.findOne({
        where: { id },
        relations: ['category'],
      });
      if (entity?.category) {
        const categoryDomain = CategoryMapper.toDomain(entity.category);
        responseDto.category = CategoryPresentationMapper.toResponseDto(categoryDomain);
      }
    }

    return responseDto;
  }

  @ApiSubscriptionUpdate()
  async update(
    @Req() req: Request,
    @Param('id') id: string,
    @Body() updateDto: UpdateSubscriptionDto,
  ): Promise<SubscriptionResponseDto> {
    const { user } = req as Request & { user: { userId: string; role: string } };
    const existing = await this.findSubscriptionUseCase.findById(id);

    if (existing.userId !== user.userId) {
      throw new NotFoundException(`Subscription with id ${id} not found`);
    }

    const appDto = SubscriptionPresentationMapper.toUpdateAppDto(updateDto);
    const subscription = await this.updateSubscriptionUseCase.execute(id, appDto);
    return SubscriptionPresentationMapper.toResponseDto(subscription);
  }

  @ApiSubscriptionDelete()
  async delete(@Req() req: Request, @Param('id') id: string): Promise<void> {
    const { user } = req as Request & { user: { userId: string; role: string } };
    const existing = await this.findSubscriptionUseCase.findById(id);

    if (existing.userId !== user.userId) {
      throw new NotFoundException(`Subscription with id ${id} not found`);
    }

    await this.deleteSubscriptionUseCase.execute(id);
  }

  @ApiSubscriptionPause()
  async pause(@Req() req: Request, @Param('id') id: string): Promise<SubscriptionResponseDto> {
    const { user } = req as Request & { user: { userId: string; role: string } };
    const existing = await this.findSubscriptionUseCase.findById(id);

    if (existing.userId !== user.userId) {
      throw new NotFoundException(`Subscription with id ${id} not found`);
    }

    const subscription = await this.pauseSubscriptionUseCase.execute(id);
    return SubscriptionPresentationMapper.toResponseDto(subscription);
  }

  @ApiSubscriptionResume()
  async resume(@Req() req: Request, @Param('id') id: string): Promise<SubscriptionResponseDto> {
    const { user } = req as Request & { user: { userId: string; role: string } };
    const existing = await this.findSubscriptionUseCase.findById(id);

    if (existing.userId !== user.userId) {
      throw new NotFoundException(`Subscription with id ${id} not found`);
    }

    const subscription = await this.resumeSubscriptionUseCase.execute(id);
    return SubscriptionPresentationMapper.toResponseDto(subscription);
  }

  @ApiSubscriptionGetEvents()
  async getEvents(@Req() req: Request, @Param('id') id: string) {
    const { user } = req as Request & { user: { userId: string; role: string } };
    const existing = await this.findSubscriptionUseCase.findById(id);

    if (existing.userId !== user.userId) {
      throw new NotFoundException(`Subscription with id ${id} not found`);
    }

    return await this.findSubscriptionEventsUseCase.execute(id);
  }
}
