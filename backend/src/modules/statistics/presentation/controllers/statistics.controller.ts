import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ThrottlerGuard } from '@nestjs/throttler';
import { CurrentUser } from '../../../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../../auth/presentation/guards/jwt-auth.guard';
import { GetExpenseSummaryUseCase } from '../../application/use-cases/get-expense-summary.use-case';
import { ExpenseSummaryQueryDto } from '../dto/expense-summary-query.dto';
import { ExpenseSummaryResponseDto } from '../dto/expense-summary-response.dto';
import { StatisticsPresentationMapper } from '../mappers/statistics-presentation.mapper';

@ApiTags('Statistiques')
@Controller('statistics')
@UseGuards(ThrottlerGuard, JwtAuthGuard)
@ApiBearerAuth('access-token')
export class StatisticsController {
  constructor(private readonly getExpenseSummaryUseCase: GetExpenseSummaryUseCase) {}

  @Get('summary')
  @ApiOperation({
    summary: 'Bilan des dépenses pour une période donnée avec comparaison',
  })
  @ApiResponse({
    status: 200,
    description: 'Bilan des dépenses calculé pour la période demandée',
    type: ExpenseSummaryResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Paramètre period invalide' })
  @ApiResponse({ status: 401, description: 'Non authentifié' })
  async getSummary(
    @CurrentUser('id') userId: string,
    @Query() query: ExpenseSummaryQueryDto,
  ): Promise<ExpenseSummaryResponseDto> {
    const result = await this.getExpenseSummaryUseCase.execute({
      userId,
      period: query.period,
    });
    return StatisticsPresentationMapper.toExpenseSummaryResponse(result);
  }
}
