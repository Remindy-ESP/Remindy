import { Test, TestingModule } from '@nestjs/testing';
import { BudgetService } from './budget.service';
import { BUDGET_REPOSITORY, IBudgetRepository } from '../ports/budget.repository.interface';
import { EVENT_REPOSITORY } from '../../../event/application/ports/event-repository.interface';
import type { IEventRepository } from '../../../event/application/ports/event-repository.interface';
import { FindAllSubscriptionsUseCase } from '../../../subscription/application/use-cases/find-all-subscriptions.use-case';
import { Budget } from '../../domain/budget.entity';
import { CreateBudgetAppDto } from '../dto/create-budget-app.dto';

describe('BudgetService', () => {
  let service: BudgetService;
  let budgetRepository: jest.Mocked<IBudgetRepository>;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  let eventRepository: jest.Mocked<IEventRepository>;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  let findAllSubscriptionsUseCase: jest.Mocked<FindAllSubscriptionsUseCase>;

  const USER_ID = 'user-123';

  function makeBudget(overrides: Partial<ConstructorParameters<typeof Budget>[0]> = {}): Budget {
    return new Budget({
      id: 'budget-1',
      userId: USER_ID,
      name: 'Streaming',
      amount: 50,
      currency: 'EUR',
      period: 'monthly',
      startDate: new Date('2026-01-01T00:00:00Z'),
      endDate: new Date('2026-02-01T00:00:00Z'),
      isActive: true,
      createdAt: new Date('2026-01-01T00:00:00Z'),
      updatedAt: new Date('2026-01-01T00:00:00Z'),
      ...overrides,
    });
  }

  beforeEach(async () => {
    const mockBudgetRepo: Partial<jest.Mocked<IBudgetRepository>> = {
      create: jest.fn(),
      findById: jest.fn(),
      findAll: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    };
    const mockEventRepo: Partial<jest.Mocked<IEventRepository>> = {
      findAll: jest.fn().mockResolvedValue([]),
    };
    const mockFindAllSubs: Partial<jest.Mocked<FindAllSubscriptionsUseCase>> = {
      execute: jest.fn().mockResolvedValue([]),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BudgetService,
        { provide: BUDGET_REPOSITORY, useValue: mockBudgetRepo },
        { provide: EVENT_REPOSITORY, useValue: mockEventRepo },
        { provide: FindAllSubscriptionsUseCase, useValue: mockFindAllSubs },
      ],
    }).compile();

    service = module.get<BudgetService>(BudgetService);
    budgetRepository = module.get(BUDGET_REPOSITORY);
    eventRepository = module.get(EVENT_REPOSITORY);
    findAllSubscriptionsUseCase = module.get(FindAllSubscriptionsUseCase);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    const baseDto: CreateBudgetAppDto = {
      userId: USER_ID,
      name: 'Streaming',
      amount: 50,
      currency: 'EUR',
      period: 'monthly',
      startDate: new Date('2026-01-01T00:00:00Z'),
    };

    it('persists a budget built from the DTO', async () => {
      const created = makeBudget();
      budgetRepository.create.mockResolvedValue(created);

      const result = await service.create(baseDto);

      expect(result).toBe(created);
      expect(budgetRepository.create).toHaveBeenCalledTimes(1);
      const passed = budgetRepository.create.mock.calls[0][0];
      expect(passed).toBeInstanceOf(Budget);
      expect(passed.userId).toBe(USER_ID);
      expect(passed.name).toBe('Streaming');
      expect(passed.amount).toBe(50);
      expect(passed.period).toBe('monthly');
    });

    it('defaults isActive to true when omitted', async () => {
      budgetRepository.create.mockImplementation(async b => b);
      const result = await service.create(baseDto);
      expect(result.isActive).toBe(true);
    });

    it('respects explicit isActive=false', async () => {
      budgetRepository.create.mockImplementation(async b => b);
      const result = await service.create({ ...baseDto, isActive: false });
      expect(result.isActive).toBe(false);
    });

    it('preserves explicit endDate', async () => {
      budgetRepository.create.mockImplementation(async b => b);
      const end = new Date('2026-03-01T00:00:00Z');
      const result = await service.create({ ...baseDto, endDate: end });
      expect(result.endDate).toEqual(end);
    });

    it('scopes the persisted budget to the caller userId', async () => {
      budgetRepository.create.mockImplementation(async b => b);
      await service.create({ ...baseDto, userId: 'someone-else' });
      const passed = budgetRepository.create.mock.calls[0][0];
      expect(passed.userId).toBe('someone-else');
    });

    it('rejects when amount is zero', async () => {
      await expect(service.create({ ...baseDto, amount: 0 })).rejects.toThrow(
        'Budget amount must be greater than zero',
      );
      expect(budgetRepository.create).not.toHaveBeenCalled();
    });

    it('rejects when name is empty', async () => {
      await expect(service.create({ ...baseDto, name: '' })).rejects.toThrow(
        'Budget name cannot be empty',
      );
      expect(budgetRepository.create).not.toHaveBeenCalled();
    });

    it('rejects when currency is not 3 chars', async () => {
      await expect(service.create({ ...baseDto, currency: 'EU' })).rejects.toThrow(
        'Currency must be a valid ISO 4217 code',
      );
    });

    it('rejects when period is invalid', async () => {
      await expect(
        // @ts-expect-error invalid by design
        service.create({ ...baseDto, period: 'weekly' }),
      ).rejects.toThrow('Invalid period');
    });

    it('rejects when explicit endDate is before startDate', async () => {
      await expect(
        service.create({
          ...baseDto,
          endDate: new Date('2025-12-01T00:00:00Z'),
        }),
      ).rejects.toThrow('End date must be after start date');
    });
  });
});
