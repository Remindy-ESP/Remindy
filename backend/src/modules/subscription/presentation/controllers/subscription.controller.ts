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
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery } from '@nestjs/swagger';
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
import { SubscriptionPresentationMapper } from '../mappers/subscription-presentation.mapper';

@ApiTags('Abonnements')
@Controller('subscriptions')
export class SubscriptionController {
  constructor(
    private readonly createSubscriptionUseCase: CreateSubscriptionUseCase,
    private readonly updateSubscriptionUseCase: UpdateSubscriptionUseCase,
    private readonly deleteSubscriptionUseCase: DeleteSubscriptionUseCase,
    private readonly findSubscriptionUseCase: FindSubscriptionUseCase,
    private readonly findAllSubscriptionsUseCase: FindAllSubscriptionsUseCase,
    private readonly findSubscriptionsByPeriodUseCase: FindSubscriptionsByPeriodUseCase,
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
  async create(@Body() createDto: CreateSubscriptionDto): Promise<SubscriptionResponseDto> {
    const appDto = SubscriptionPresentationMapper.toCreateAppDto(createDto);
    const subscription = await this.createSubscriptionUseCase.execute(appDto);
    return SubscriptionPresentationMapper.toResponseDto(subscription);
  }

  @Get()
  @ApiOperation({ summary: 'Récupérer tous les abonnements avec filtres optionnels' })
  @ApiQuery({ name: 'userId', required: false, description: 'Filtrer par ID utilisateur' })
  @ApiQuery({ name: 'name', required: false, description: 'Filtrer par nom (recherche partielle)' })
  @ApiQuery({ name: 'currency', required: false, description: 'Filtrer par devise' })
  @ApiQuery({
    name: 'periodType',
    required: false,
    enum: ['day', 'week', 'month', 'year'],
    description: 'Filtrer par type de période',
  })
  @ApiQuery({ name: 'isActive', required: false, type: Boolean, description: 'Filtrer par statut actif' })
  @ApiResponse({
    status: 200,
    description: 'Liste des abonnements',
    type: [SubscriptionResponseDto],
  })
  async findAll(@Query() filters: SubscriptionFilterDto): Promise<SubscriptionResponseDto[]> {
    const appFilters = SubscriptionPresentationMapper.toFilterAppDto(filters);
    const subscriptions = await this.findAllSubscriptionsUseCase.execute(appFilters);
    return SubscriptionPresentationMapper.toResponseDtoArray(subscriptions);
  }

  @Get('period/:type')
  @ApiOperation({ summary: 'Récupérer les abonnements par type de période' })
  @ApiParam({
    name: 'type',
    enum: ['day', 'week', 'month', 'year'],
    description: 'Type de période (day/week/month/year)',
  })
  @ApiResponse({
    status: 200,
    description: 'Liste des abonnements pour le type de période spécifié',
    type: [SubscriptionResponseDto],
  })
  @ApiResponse({ status: 400, description: 'Type de période invalide' })
  async findByPeriod(@Param('type') type: string): Promise<SubscriptionResponseDto[]> {
    const subscriptions = await this.findSubscriptionsByPeriodUseCase.execute(type);
    return SubscriptionPresentationMapper.toResponseDtoArray(subscriptions);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Récupérer un abonnement par son ID' })
  @ApiParam({ name: 'id', description: 'ID de l\'abonnement' })
  @ApiResponse({
    status: 200,
    description: 'Abonnement trouvé',
    type: SubscriptionResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Abonnement non trouvé' })
  async findById(@Param('id') id: string): Promise<SubscriptionResponseDto> {
    const subscription = await this.findSubscriptionUseCase.findById(id);
    return SubscriptionPresentationMapper.toResponseDto(subscription);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Mettre à jour un abonnement' })
  @ApiParam({ name: 'id', description: 'ID de l\'abonnement' })
  @ApiResponse({
    status: 200,
    description: 'Abonnement mis à jour avec succès',
    type: SubscriptionResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Abonnement non trouvé' })
  @ApiResponse({ status: 400, description: 'Données invalides' })
  async update(
    @Param('id') id: string,
    @Body() updateDto: UpdateSubscriptionDto,
  ): Promise<SubscriptionResponseDto> {
    const appDto = SubscriptionPresentationMapper.toUpdateAppDto(updateDto);
    const subscription = await this.updateSubscriptionUseCase.execute(id, appDto);
    return SubscriptionPresentationMapper.toResponseDto(subscription);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Supprimer un abonnement (soft delete)' })
  @ApiParam({ name: 'id', description: 'ID de l\'abonnement' })
  @ApiResponse({ status: 204, description: 'Abonnement supprimé avec succès' })
  @ApiResponse({ status: 404, description: 'Abonnement non trouvé' })
  async delete(@Param('id') id: string): Promise<void> {
    await this.deleteSubscriptionUseCase.execute(id);
  }
}
