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
import {
  ApiBearerAuth,
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiNoContentResponse,
  ApiQuery,
  ApiParam,
} from '@nestjs/swagger';
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
  @ApiOperation({ summary: 'Create a new budget for the authenticated user' })
  @ApiResponse({ status: 201, description: 'Budget created', type: BudgetResponseDto })
  @ApiResponse({ status: 400, description: 'Validation failed' })
  @ApiResponse({ status: 401, description: 'Not authenticated' })
  async create(
    @CurrentUser('id') userId: string,
    @Body() body: CreateBudgetDto,
  ): Promise<BudgetResponseDto> {
    const appDto = BudgetPresentationMapper.toCreateAppDto(body, userId);
    const budget = await this.budgetService.create(appDto);
    return BudgetPresentationMapper.toResponseDto(budget);
  }

  @Get()
  @ApiOperation({ summary: 'List the budgets owned by the authenticated user' })
  @ApiQuery({ name: 'isActive', required: false, type: Boolean })
  @ApiQuery({ name: 'categoryId', required: false, type: String })
  @ApiResponse({ status: 200, type: [BudgetResponseDto] })
  @ApiResponse({ status: 401, description: 'Not authenticated' })
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
  @ApiOperation({
    summary:
      'List the budgets owned by the authenticated user with their current-period spending attached',
  })
  @ApiQuery({ name: 'isActive', required: false, type: Boolean })
  @ApiQuery({ name: 'categoryId', required: false, type: String })
  @ApiResponse({ status: 200, type: [BudgetWithSpendingDto] })
  @ApiResponse({ status: 401, description: 'Not authenticated' })
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
  @ApiOperation({ summary: 'Get a single budget owned by the authenticated user' })
  @ApiParam({ name: 'id', description: 'Budget UUID' })
  @ApiResponse({ status: 200, type: BudgetResponseDto })
  @ApiResponse({ status: 401, description: 'Not authenticated' })
  @ApiResponse({ status: 403, description: 'Budget does not belong to the caller' })
  @ApiResponse({ status: 404, description: 'Budget not found' })
  async findOne(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
  ): Promise<BudgetResponseDto> {
    const budget = await this.budgetService.findOne(id, userId);
    return BudgetPresentationMapper.toResponseDto(budget);
  }

  @Get(':id/spending')
  @ApiOperation({ summary: 'Get a budget with its current-period spending attached' })
  @ApiParam({ name: 'id', description: 'Budget UUID' })
  @ApiResponse({ status: 200, type: BudgetWithSpendingDto })
  @ApiResponse({ status: 401, description: 'Not authenticated' })
  @ApiResponse({ status: 403, description: 'Budget does not belong to the caller' })
  @ApiResponse({ status: 404, description: 'Budget not found' })
  async findOneWithSpending(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
  ): Promise<BudgetWithSpendingDto> {
    const budget = await this.budgetService.findOne(id, userId);
    const spending = await this.budgetService.calculateSpendingForBudget(budget);
    return BudgetPresentationMapper.toWithSpendingDto(budget, spending);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update an existing budget' })
  @ApiParam({ name: 'id', description: 'Budget UUID' })
  @ApiResponse({ status: 200, type: BudgetResponseDto })
  @ApiResponse({ status: 400, description: 'Validation failed' })
  @ApiResponse({ status: 401, description: 'Not authenticated' })
  @ApiResponse({ status: 403, description: 'Budget does not belong to the caller' })
  @ApiResponse({ status: 404, description: 'Budget not found' })
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
  @ApiOperation({ summary: 'Delete a budget' })
  @ApiParam({ name: 'id', description: 'Budget UUID' })
  @ApiNoContentResponse({ description: 'Budget deleted' })
  @ApiResponse({ status: 401, description: 'Not authenticated' })
  @ApiResponse({ status: 403, description: 'Budget does not belong to the caller' })
  @ApiResponse({ status: 404, description: 'Budget not found' })
  async delete(@CurrentUser('id') userId: string, @Param('id') id: string): Promise<void> {
    await this.budgetService.remove(id, userId);
  }
}
