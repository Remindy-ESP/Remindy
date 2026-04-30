import { Test, TestingModule } from '@nestjs/testing';
import { ThrottlerGuard } from '@nestjs/throttler';
import { StatisticsController } from './statistics.controller';
import { GetExpenseSummaryUseCase } from '../../application/use-cases/get-expense-summary.use-case';
import type { ExpenseSummaryAppDto } from '../../application/dto/expense-summary-app.dto';
import { JwtAuthGuard } from '../../../auth/presentation/guards/jwt-auth.guard';

describe('StatisticsController', () => {
  let controller: StatisticsController;
  let useCase: jest.Mocked<GetExpenseSummaryUseCase>;

  beforeEach(async () => {
    const mockUseCase: Partial<jest.Mocked<GetExpenseSummaryUseCase>> = {
      execute: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [StatisticsController],
      providers: [{ provide: GetExpenseSummaryUseCase, useValue: mockUseCase }],
    })
      .overrideGuard(ThrottlerGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get(StatisticsController);
    useCase = module.get(GetExpenseSummaryUseCase);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getSummary', () => {
    it('passes the user id and period to the use-case and returns the mapped response', async () => {
      const appResult: ExpenseSummaryAppDto = {
        periodLabel: '5 octobre 2025',
        currentTotal: 203.85,
        previousTotal: 211.2,
        percentageChange: -3.5,
        trend: 'down',
        comparisonLabel: 'Comparo M-1',
      };
      useCase.execute.mockResolvedValue(appResult);

      const response = await controller.getSummary('user-123', { period: 'day' });

      expect(useCase.execute).toHaveBeenCalledWith({
        userId: 'user-123',
        period: 'day',
      });
      expect(response).toEqual(appResult);
    });

    it("forwards the 'week' period unchanged", async () => {
      useCase.execute.mockResolvedValue({
        periodLabel: 'Semaine du 6 octobre 2025',
        currentTotal: 0,
        previousTotal: 0,
        percentageChange: 0,
        trend: 'stable',
        comparisonLabel: 'Comparo S-1',
      });

      const response = await controller.getSummary('user-1', { period: 'week' });

      expect(useCase.execute).toHaveBeenCalledWith({ userId: 'user-1', period: 'week' });
      expect(response.comparisonLabel).toBe('Comparo S-1');
    });

    it("forwards the 'year' period unchanged", async () => {
      useCase.execute.mockResolvedValue({
        periodLabel: '2025',
        currentTotal: 4200,
        previousTotal: 3000,
        percentageChange: 40,
        trend: 'up',
        comparisonLabel: 'Comparo A-1',
      });

      const response = await controller.getSummary('user-1', { period: 'year' });

      expect(useCase.execute).toHaveBeenCalledWith({ userId: 'user-1', period: 'year' });
      expect(response.trend).toBe('up');
      expect(response.comparisonLabel).toBe('Comparo A-1');
    });

    it('propagates errors from the use-case', async () => {
      useCase.execute.mockRejectedValue(new Error('boom'));

      await expect(controller.getSummary('user-1', { period: 'month' })).rejects.toThrow('boom');
    });
  });
});
