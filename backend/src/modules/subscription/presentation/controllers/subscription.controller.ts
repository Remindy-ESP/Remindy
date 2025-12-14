import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  UseGuards,
  Req,
  NotFoundException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery, ApiBearerAuth } from '@nestjs/swagger';
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
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Créer un nouvel abonnement' })
  @ApiResponse({
    status: 201,
    description: 'Abonnement créé avec succès',
    type: SubscriptionResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Données invalides' })
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
    return responseDto;
  }

  @Get()
  @ApiOperation({ summary: 'Récupérer tous les abonnements avec filtres optionnels' })
  @ApiQuery({ name: 'contractId', required: false, description: 'Filtrer par ID de contrat' })
  @ApiQuery({ name: 'name', required: false, description: 'Filtrer par nom (recherche partielle)' })
  @ApiQuery({ name: 'currency', required: false, description: 'Filtrer par devise' })
  @ApiQuery({
    name: 'frequency',
    required: false,
    enum: ['weekly', 'monthly', 'quarterly', 'yearly'],
    description: 'Filtrer par fréquence de facturation',
  })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: ['active', 'paused', 'cancelled', 'trial'],
    description: 'Filtrer par statut',
  })
  @ApiResponse({
    status: 200,
    description: 'Liste des abonnements',
    type: [SubscriptionResponseDto],
  })
  async findAll(
    @Req() req: Request,
    @Query() filters: SubscriptionFilterDto,
  ): Promise<SubscriptionResponseDto[]> {
    const { user } = req as Request & { user: { userId: string; role: string } };
    filters.userId = user.userId;

    const appFilters = SubscriptionPresentationMapper.toFilterAppDto(filters);
    const subscriptions = await this.findAllSubscriptionsUseCase.execute(appFilters);
    return SubscriptionPresentationMapper.toResponseDtoArray(subscriptions);
  }

  @Get('frequency/:type')
  @ApiOperation({ summary: 'Récupérer les abonnements par fréquence de facturation' })
  @ApiParam({
    name: 'type',
    enum: ['weekly', 'monthly', 'quarterly', 'yearly'],
    description: 'Fréquence de facturation (weekly/monthly/quarterly/yearly)',
  })
  @ApiResponse({
    status: 200,
    description: 'Liste des abonnements pour la fréquence spécifiée',
    type: [SubscriptionResponseDto],
  })
  @ApiResponse({ status: 400, description: 'Fréquence invalide' })
  async findByFrequency(
    @Req() req: Request,
    @Param('type') type: string,
  ): Promise<SubscriptionResponseDto[]> {
    const { user } = req as Request & { user: { userId: string; role: string } };
    const subscriptions = await this.findSubscriptionsByPeriodUseCase.execute(type);
    const userSubscriptions = subscriptions.filter(sub => sub.userId === user.userId);
    return SubscriptionPresentationMapper.toResponseDtoArray(userSubscriptions);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Récupérer un abonnement par son ID' })
  @ApiParam({ name: 'id', description: "ID de l'abonnement" })
  @ApiResponse({
    status: 200,
    description: 'Abonnement trouvé',
    type: SubscriptionResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Abonnement non trouvé' })
  async findById(@Req() req: Request, @Param('id') id: string): Promise<SubscriptionResponseDto> {
    const { user } = req as Request & { user: { userId: string; role: string } };
    const subscription = await this.findSubscriptionUseCase.findById(id);

    if (subscription.userId !== user.userId) {
      throw new NotFoundException(`Subscription with id ${id} not found`);
    }

    return SubscriptionPresentationMapper.toResponseDto(subscription);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Mettre à jour un abonnement' })
  @ApiParam({ name: 'id', description: "ID de l'abonnement" })
  @ApiResponse({
    status: 200,
    description: 'Abonnement mis à jour avec succès',
    type: SubscriptionResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Abonnement non trouvé' })
  @ApiResponse({ status: 400, description: 'Données invalides' })
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

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Supprimer un abonnement (soft delete)' })
  @ApiParam({ name: 'id', description: "ID de l'abonnement" })
  @ApiResponse({ status: 204, description: 'Abonnement supprimé avec succès' })
  @ApiResponse({ status: 404, description: 'Abonnement non trouvé' })
  async delete(@Req() req: Request, @Param('id') id: string): Promise<void> {
    const { user } = req as Request & { user: { userId: string; role: string } };
    const existing = await this.findSubscriptionUseCase.findById(id);

    if (existing.userId !== user.userId) {
      throw new NotFoundException(`Subscription with id ${id} not found`);
    }

    await this.deleteSubscriptionUseCase.execute(id);
  }

  @Post(':id/pause')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Mettre en pause un abonnement' })
  @ApiParam({ name: 'id', description: "ID de l'abonnement" })
  @ApiResponse({
    status: 200,
    description: 'Abonnement mis en pause avec succès',
    type: SubscriptionResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Abonnement non trouvé' })
  async pause(@Req() req: Request, @Param('id') id: string): Promise<SubscriptionResponseDto> {
    const { user } = req as Request & { user: { userId: string; role: string } };
    const existing = await this.findSubscriptionUseCase.findById(id);

    if (existing.userId !== user.userId) {
      throw new NotFoundException(`Subscription with id ${id} not found`);
    }

    const subscription = await this.pauseSubscriptionUseCase.execute(id);
    return SubscriptionPresentationMapper.toResponseDto(subscription);
  }

  @Post(':id/resume')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Réactiver un abonnement en pause' })
  @ApiParam({ name: 'id', description: "ID de l'abonnement" })
  @ApiResponse({
    status: 200,
    description: 'Abonnement réactivé avec succès',
    type: SubscriptionResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Abonnement non trouvé' })
  async resume(@Req() req: Request, @Param('id') id: string): Promise<SubscriptionResponseDto> {
    const { user } = req as Request & { user: { userId: string; role: string } };
    const existing = await this.findSubscriptionUseCase.findById(id);

    if (existing.userId !== user.userId) {
      throw new NotFoundException(`Subscription with id ${id} not found`);
    }

    const subscription = await this.resumeSubscriptionUseCase.execute(id);
    return SubscriptionPresentationMapper.toResponseDto(subscription);
  }

  @Get(':id/events')
  @ApiOperation({ summary: "Récupérer tous les événements d'un abonnement" })
  @ApiParam({ name: 'id', description: "ID de l'abonnement" })
  @ApiResponse({
    status: 200,
    description: "Liste des événements de l'abonnement",
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          subscriptionId: { type: 'string' },
          eventSeriesId: { type: 'string' },
          title: { type: 'string' },
          amount: { type: 'number' },
          startsAt: { type: 'string', format: 'date-time' },
          endsAt: { type: 'string', format: 'date-time' },
          status: { type: 'string' },
          paymentStatus: { type: 'string' },
          notes: { type: 'string', format: 'date-time' },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
      },
    },
  })
  @ApiResponse({ status: 404, description: 'Abonnement non trouvé' })
  async getEvents(@Req() req: Request, @Param('id') id: string) {
    const { user } = req as Request & { user: { userId: string; role: string } };
    const existing = await this.findSubscriptionUseCase.findById(id);

    if (existing.userId !== user.userId) {
      throw new NotFoundException(`Subscription with id ${id} not found`);
    }

    return await this.findSubscriptionEventsUseCase.execute(id);
  }
}
