import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  HttpCode,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { ThrottlerGuard } from '@nestjs/throttler';
import { JwtAuthGuard } from '../../../auth/presentation/guards/jwt-auth.guard';
import { CurrentUser } from '../../../auth/decorators/current-user.decorator';
import { BudgetService } from '../../application/services/budget.service';
import { CreateBudgetDto } from '../dto/create-budget.dto';
import { UpdateBudgetDto } from '../dto/update-budget.dto';
import { BudgetResponseDto } from '../dto/budget-response.dto';
import { BudgetWithSpendingDto } from '../dto/budget-with-spending.dto';
import { BudgetPresentationMapper } from '../mappers/budget-presentation.mapper';

@ApiTags('Budgets')
@ApiBearerAuth('access-token')
@Controller('budgets')
@UseGuards(ThrottlerGuard, JwtAuthGuard)
export class BudgetController {
  constructor(private readonly budgetService: BudgetService) {}

  @Post()
  async create(
    @CurrentUser('id') userId: string,
    @Body() body: CreateBudgetDto,
  ): Promise<BudgetResponseDto> {
    const appDto = BudgetPresentationMapper.toCreateAppDto(body, userId);
    const budget = await this.budgetService.create(appDto);
    return BudgetPresentationMapper.toResponseDto(budget);
  }

  @Get()
  async findAll(
    @CurrentUser('id') userId: string,
    @Query('isActive') isActive?: string,
    @Query('categoryId') categoryId?: string,
  ): Promise<BudgetResponseDto[]> {
    const budgets = await this.budgetService.findAll({
      userId,
      isActive: isActive === undefined ? undefined : isActive === 'true',
      categoryId,
    });
    return BudgetPresentationMapper.toResponseDtoArray(budgets);
  }

  @Get('with-spending')
  async findAllWithSpending(
    @CurrentUser('id') userId: string,
    @Query('isActive') isActive?: string,
    @Query('categoryId') categoryId?: string,
  ): Promise<BudgetWithSpendingDto[]> {
    const result = await this.budgetService.getBudgetsWithSpending({
      userId,
      isActive: isActive === undefined ? undefined : isActive === 'true',
      categoryId,
    });
    return result.map(({ budget, spending }) =>
      BudgetPresentationMapper.toWithSpendingDto(budget, spending),
    );
  }

  @Get(':id')
  async findOne(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
  ): Promise<BudgetResponseDto> {
    const budget = await this.budgetService.findOne(id, userId);
    return BudgetPresentationMapper.toResponseDto(budget);
  }

  @Get(':id/spending')
  async findOneWithSpending(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
  ): Promise<BudgetWithSpendingDto> {
    const budget = await this.budgetService.findOne(id, userId);
    const spending = await this.budgetService.calculateSpendingForBudget(budget);
    return BudgetPresentationMapper.toWithSpendingDto(budget, spending);
  }

  @Patch(':id')
  async update(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
    @Body() body: UpdateBudgetDto,
  ): Promise<BudgetResponseDto> {
    const appDto = BudgetPresentationMapper.toUpdateAppDto(body);
    const updated = await this.budgetService.update(id, appDto, userId);
    return BudgetPresentationMapper.toResponseDto(updated);
  }

  @Delete(':id')
  @HttpCode(204)
  async delete(@CurrentUser('id') userId: string, @Param('id') id: string): Promise<void> {
    await this.budgetService.remove(id, userId);
  }
}
