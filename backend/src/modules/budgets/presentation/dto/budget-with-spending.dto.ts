import { ApiProperty } from '@nestjs/swagger';
import { BudgetResponseDto } from './budget-response.dto';

export class BudgetWithSpendingDto extends BudgetResponseDto {
  @ApiProperty({ example: 32.5, description: 'Sum of expenses charged against this budget in current window' })
  spent: number;

  @ApiProperty({ example: 17.5, description: 'amount - spent (can be negative if over budget)' })
  remaining: number;

  @ApiProperty({ example: 0.65, description: 'spent / amount, clamped to [0, +∞)' })
  progress: number;

  @ApiProperty({ example: false })
  isOverBudget: boolean;
}
