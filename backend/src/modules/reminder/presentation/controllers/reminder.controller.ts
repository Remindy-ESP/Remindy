import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Query,
  Body,
  HttpCode,
  HttpStatus,
  UseGuards,
  Req,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { ThrottlerGuard } from '@nestjs/throttler';
import type { Request } from 'express';
import { ReminderResponseDto } from '../dto/reminder-response.dto';
import { ReminderFilterDto } from '../dto/reminder-filter.dto';
import { CreateReminderDto } from '../dto/create-reminder.dto';
import { UpdateReminderDto } from '../dto/update-reminder.dto';
import { FindAllRemindersUseCase } from '../../application/use-cases/find-all-reminders.use-case';
import { FindReminderByIdUseCase } from '../../application/use-cases/find-reminder-by-id.use-case';
import { CreateReminderUseCase } from '../../application/use-cases/create-reminder.use-case';
import { UpdateReminderUseCase } from '../../application/use-cases/update-reminder.use-case';
import { DeleteReminderUseCase } from '../../application/use-cases/delete-reminder.use-case';
import { ReminderPresentationMapper } from '../mappers/reminder-presentation.mapper';
import { JwtAuthGuard } from 'src/modules/auth/presentation/guards/jwt-auth.guard';

@ApiTags('Reminders')
@Controller('reminders')
@UseGuards(ThrottlerGuard, JwtAuthGuard)
@ApiBearerAuth('access-token')
export class ReminderController {
  constructor(
    private readonly findAllRemindersUseCase: FindAllRemindersUseCase,
    private readonly findReminderByIdUseCase: FindReminderByIdUseCase,
    private readonly createReminderUseCase: CreateReminderUseCase,
    private readonly updateReminderUseCase: UpdateReminderUseCase,
    private readonly deleteReminderUseCase: DeleteReminderUseCase,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Récupérer tous les rappels avec filtres optionnels' })
  @ApiQuery({
    name: 'subscription_id',
    required: false,
    description: 'Filtrer par ID de souscription',
  })
  @ApiQuery({ name: 'type', required: false, description: 'Filtrer par type de rappel' })
  @ApiQuery({ name: 'enabled', required: false, description: 'Filtrer par état actif/inactif' })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Nombre maximum de résultats',
    type: Number,
  })
  @ApiQuery({
    name: 'sort',
    required: false,
    description: 'Tri (created_at:asc|desc, updated_at:asc|desc)',
  })
  @ApiResponse({
    status: 200,
    description: 'Liste des rappels',
    type: [ReminderResponseDto],
  })
  async findAll(
    @Req() req: Request,
    @Query() filters: ReminderFilterDto,
  ): Promise<ReminderResponseDto[]> {
    const { user } = req as Request & { user: { userId: string; role: string } };
    const userId = user.userId;

    const appFilters = ReminderPresentationMapper.toFilterAppDto(userId, filters);
    const reminders = await this.findAllRemindersUseCase.execute(appFilters);
    return ReminderPresentationMapper.toResponseDtoArray(reminders);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Récupérer un rappel par son ID' })
  @ApiParam({ name: 'id', description: 'ID du rappel' })
  @ApiResponse({
    status: 200,
    description: 'Rappel trouvé',
    type: ReminderResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Rappel non trouvé' })
  async findOne(@Req() req: Request, @Param('id') id: string): Promise<ReminderResponseDto> {
    const { user } = req as Request & { user: { userId: string; role: string } };
    const userId = user.userId;

    const reminder = await this.findReminderByIdUseCase.execute(id, userId);
    return ReminderPresentationMapper.toResponseDto(reminder);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Créer un nouveau rappel' })
  @ApiResponse({
    status: 201,
    description: 'Rappel créé avec succès',
    type: ReminderResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Données invalides' })
  async create(
    @Req() req: Request,
    @Body() createDto: CreateReminderDto,
  ): Promise<ReminderResponseDto> {
    const { user } = req as Request & { user: { userId: string; role: string } };
    const userId = user.userId;

    const appDto = ReminderPresentationMapper.toCreateAppDto(userId, createDto);
    const reminder = await this.createReminderUseCase.execute(appDto);
    return ReminderPresentationMapper.toResponseDto(reminder);
  }

  @Put(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Mettre à jour un rappel' })
  @ApiParam({ name: 'id', description: 'ID du rappel' })
  @ApiResponse({
    status: 200,
    description: 'Rappel mis à jour avec succès',
    type: ReminderResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Rappel non trouvé' })
  @ApiResponse({ status: 400, description: 'Données invalides' })
  async update(
    @Req() req: Request,
    @Param('id') id: string,
    @Body() updateDto: UpdateReminderDto,
  ): Promise<ReminderResponseDto> {
    const { user } = req as Request & { user: { userId: string; role: string } };
    const userId = user.userId;

    const appDto = ReminderPresentationMapper.toUpdateAppDto(updateDto);
    const reminder = await this.updateReminderUseCase.execute(id, userId, appDto);
    return ReminderPresentationMapper.toResponseDto(reminder);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Supprimer un rappel (soft delete)' })
  @ApiParam({ name: 'id', description: 'ID du rappel' })
  @ApiResponse({
    status: 204,
    description: 'Rappel supprimé avec succès',
  })
  @ApiResponse({ status: 404, description: 'Rappel non trouvé' })
  async delete(@Req() req: Request, @Param('id') id: string): Promise<void> {
    const { user } = req as Request & { user: { userId: string; role: string } };
    const userId = user.userId;

    await this.deleteReminderUseCase.execute(id, userId);
  }
}
