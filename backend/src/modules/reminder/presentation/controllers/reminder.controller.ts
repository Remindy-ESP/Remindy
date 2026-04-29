import { Controller, Body, Param, Query, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
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
import {
  ApiReminderFindAll,
  ApiReminderFindOne,
  ApiReminderCreate,
  ApiReminderUpdate,
  ApiReminderDelete,
} from '../../../../swagger/decorators/api-reminder.decorator';

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

  @ApiReminderFindAll()
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

  @ApiReminderFindOne()
  async findOne(@Req() req: Request, @Param('id') id: string): Promise<ReminderResponseDto> {
    const { user } = req as Request & { user: { userId: string; role: string } };
    const userId = user.userId;

    const reminder = await this.findReminderByIdUseCase.execute(id, userId);
    return ReminderPresentationMapper.toResponseDto(reminder);
  }

  @ApiReminderCreate()
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

  @ApiReminderUpdate()
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

  @ApiReminderDelete()
  async delete(@Req() req: Request, @Param('id') id: string): Promise<void> {
    const { user } = req as Request & { user: { userId: string; role: string } };
    const userId = user.userId;

    await this.deleteReminderUseCase.execute(id, userId);
  }
}
