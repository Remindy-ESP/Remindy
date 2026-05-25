import { Test, TestingModule } from '@nestjs/testing';
import { BudgetService } from './budget.service';
import { BUDGET_REPOSITORY, IBudgetRepository } from '../ports/budget.repository.interface';
import { EVENT_REPOSITORY } from '../../../event/application/ports/event-repository.interface';
import type { IEventRepository } from '../../../event/application/ports/event-repository.interface';
import { FindAllSubscriptionsUseCase } from '../../../subscription/application/use-cases/find-all-subscriptions.use-case';
import { Budget } from '../../domain/budget.entity';
import { CreateBudgetAppDto } from '../dto/create-budget-app.dto';
import { Subscription } from '../../../subscription/domain/subscription.entity';
import { Event } from '../../../event/domain/event.entity';

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

  describe('findAll', () => {
    it('forwards filters to the repository', async () => {
      const list = [makeBudget(), makeBudget({ id: 'budget-2' })];
      budgetRepository.findAll.mockResolvedValue(list);

      const result = await service.findAll({ userId: USER_ID, isActive: true });

      expect(result).toBe(list);
      expect(budgetRepository.findAll).toHaveBeenCalledWith({ userId: USER_ID, isActive: true });
    });

    it('returns an empty list when none exist', async () => {
      budgetRepository.findAll.mockResolvedValue([]);
      const result = await service.findAll({ userId: USER_ID });
      expect(result).toEqual([]);
    });

    it('forwards categoryId when provided', async () => {
      budgetRepository.findAll.mockResolvedValue([]);
      await service.findAll({ userId: USER_ID, categoryId: 'cat-1' });
      expect(budgetRepository.findAll).toHaveBeenCalledWith({
        userId: USER_ID,
        categoryId: 'cat-1',
      });
    });
  });

  describe('findOne', () => {
    it('returns the budget when found and owned by the user', async () => {
      const budget = makeBudget();
      budgetRepository.findById.mockResolvedValue(budget);

      const result = await service.findOne('budget-1', USER_ID);

      expect(result).toBe(budget);
    });

    it('throws NotFoundException when the budget does not exist', async () => {
      budgetRepository.findById.mockResolvedValue(null);

      await expect(service.findOne('missing', USER_ID)).rejects.toThrow(
        'Budget with ID missing not found',
      );
    });

    it('throws ForbiddenException when the budget belongs to another user', async () => {
      const budget = makeBudget({ userId: 'other-user' });
      budgetRepository.findById.mockResolvedValue(budget);

      await expect(service.findOne('budget-1', USER_ID)).rejects.toThrow(
        'You can only access your own budgets',
      );
    });
  });

  describe('update', () => {
    it('applies partial updates and persists the budget', async () => {
      const budget = makeBudget();
      budgetRepository.findById.mockResolvedValue(budget);
      budgetRepository.update.mockImplementation(async (_id, b) => b);

      const result = await service.update(
        'budget-1',
        { name: 'New name', amount: 80, isActive: false },
        USER_ID,
      );

      expect(result.name).toBe('New name');
      expect(result.amount).toBe(80);
      expect(result.isActive).toBe(false);
      expect(budgetRepository.update).toHaveBeenCalledTimes(1);
    });

    it('updates dates together when both provided', async () => {
      const budget = makeBudget();
      budgetRepository.findById.mockResolvedValue(budget);
      budgetRepository.update.mockImplementation(async (_id, b) => b);

      const newStart = new Date('2026-02-01T00:00:00Z');
      const newEnd = new Date('2026-03-15T00:00:00Z');
      const result = await service.update(
        'budget-1',
        { startDate: newStart, endDate: newEnd },
        USER_ID,
      );

      expect(result.startDate).toEqual(newStart);
      expect(result.endDate).toEqual(newEnd);
    });

    it('updates only endDate when startDate is unchanged', async () => {
      const budget = makeBudget();
      budgetRepository.findById.mockResolvedValue(budget);
      budgetRepository.update.mockImplementation(async (_id, b) => b);

      const newEnd = new Date('2026-04-15T00:00:00Z');
      const result = await service.update('budget-1', { endDate: newEnd }, USER_ID);

      expect(result.endDate).toEqual(newEnd);
    });

    it('throws NotFoundException when the budget does not exist', async () => {
      budgetRepository.findById.mockResolvedValue(null);
      await expect(service.update('missing', { name: 'x' }, USER_ID)).rejects.toThrow(
        'Budget with ID missing not found',
      );
      expect(budgetRepository.update).not.toHaveBeenCalled();
    });

    it('throws ForbiddenException when the budget belongs to another user', async () => {
      const budget = makeBudget({ userId: 'other-user' });
      budgetRepository.findById.mockResolvedValue(budget);

      await expect(service.update('budget-1', { name: 'x' }, USER_ID)).rejects.toThrow(
        'You can only modify your own budgets',
      );
      expect(budgetRepository.update).not.toHaveBeenCalled();
    });

    it('throws when repository.update returns null', async () => {
      const budget = makeBudget();
      budgetRepository.findById.mockResolvedValue(budget);
      budgetRepository.update.mockResolvedValue(null);

      await expect(service.update('budget-1', { name: 'x' }, USER_ID)).rejects.toThrow(
        'Budget with ID budget-1 not found',
      );
    });
  });

  describe('calculateSpendingForBudget', () => {
    function makeSubscription(id: string, categoryId?: string): Subscription {
      return new Subscription({
        id,
        userId: USER_ID,
        name: `Sub ${id}`,
        amount: 10,
        currency: 'EUR',
        frequency: 'monthly',
        startDate: new Date('2025-01-01T00:00:00Z'),
        nextDueDate: new Date('2026-01-01T00:00:00Z'),
        status: 'active',
        categoryId,
      });
    }

    function makeEvent(subscriptionId: string, amount: number, opts: { canceled?: boolean } = {}): Event {
      return new Event({
        id: `event-${subscriptionId}-${amount}`,
        subscriptionId,
        title: 'charge',
        amount,
        startsAt: new Date('2026-01-15T00:00:00Z'),
        status: opts.canceled ? 'canceled' : 'completed',
      });
    }

    it('returns zero spending when user has no subscriptions', async () => {
      const budget = makeBudget();
      findAllSubscriptionsUseCase.execute.mockResolvedValue([]);

      const result = await service.calculateSpendingForBudget(budget);

      expect(result.spent).toBe(0);
      expect(result.remaining).toBe(50);
      expect(result.progress).toBe(0);
      expect(result.isOverBudget).toBe(false);
      expect(eventRepository.findAll).not.toHaveBeenCalled();
    });

    it('sums all completed event amounts when budget has no category filter', async () => {
      const budget = makeBudget();
      findAllSubscriptionsUseCase.execute.mockResolvedValue([
        makeSubscription('sub-1'),
        makeSubscription('sub-2'),
      ]);
      eventRepository.findAll.mockResolvedValue([
        makeEvent('sub-1', 12.5),
        makeEvent('sub-2', 7.25),
      ]);

      const result = await service.calculateSpendingForBudget(budget);

      expect(result.spent).toBe(19.75);
      expect(result.remaining).toBe(30.25);
      expect(result.progress).toBe(0.395);
      expect(result.isOverBudget).toBe(false);
    });

    it('filters spending to events from subscriptions in the budget category', async () => {
      const budget = makeBudget({ categoryId: 'cat-1' });
      findAllSubscriptionsUseCase.execute.mockResolvedValue([
        makeSubscription('sub-1', 'cat-1'),
        makeSubscription('sub-2', 'cat-other'),
      ]);
      eventRepository.findAll.mockResolvedValue([
        makeEvent('sub-1', 10),
        makeEvent('sub-2', 100),
      ]);

      const result = await service.calculateSpendingForBudget(budget);

      expect(result.spent).toBe(10);
      expect(result.remaining).toBe(40);
    });

    it('ignores canceled events', async () => {
      const budget = makeBudget();
      findAllSubscriptionsUseCase.execute.mockResolvedValue([makeSubscription('sub-1')]);
      eventRepository.findAll.mockResolvedValue([
        makeEvent('sub-1', 10),
        makeEvent('sub-1', 5, { canceled: true }),
      ]);

      const result = await service.calculateSpendingForBudget(budget);

      expect(result.spent).toBe(10);
    });

    it('flags isOverBudget when spent exceeds amount', async () => {
      const budget = makeBudget({ amount: 30 });
      findAllSubscriptionsUseCase.execute.mockResolvedValue([makeSubscription('sub-1')]);
      eventRepository.findAll.mockResolvedValue([makeEvent('sub-1', 35)]);

      const result = await service.calculateSpendingForBudget(budget);

      expect(result.spent).toBe(35);
      expect(result.remaining).toBe(-5);
      expect(result.isOverBudget).toBe(true);
    });

    it('queries events using the budget window derived from period', async () => {
      const budget = makeBudget({
        startDate: new Date('2026-04-01T00:00:00Z'),
        endDate: null,
        period: 'monthly',
      });
      findAllSubscriptionsUseCase.execute.mockResolvedValue([makeSubscription('sub-1')]);
      eventRepository.findAll.mockResolvedValue([]);

      await service.calculateSpendingForBudget(budget);

      expect(eventRepository.findAll).toHaveBeenCalledWith({
        start: new Date('2026-04-01T00:00:00Z'),
        end: new Date('2026-05-01T00:00:00Z'),
      });
    });

    it('uses explicit endDate when provided instead of the computed one', async () => {
      const budget = makeBudget({
        startDate: new Date('2026-04-01T00:00:00Z'),
        endDate: new Date('2026-06-30T00:00:00Z'),
        period: 'monthly',
      });
      findAllSubscriptionsUseCase.execute.mockResolvedValue([makeSubscription('sub-1')]);
      eventRepository.findAll.mockResolvedValue([]);

      await service.calculateSpendingForBudget(budget);

      expect(eventRepository.findAll).toHaveBeenCalledWith({
        start: new Date('2026-04-01T00:00:00Z'),
        end: new Date('2026-06-30T00:00:00Z'),
      });
    });
  });

  describe('getBudgetsWithSpending', () => {
    it('returns an empty list when no budgets', async () => {
      budgetRepository.findAll.mockResolvedValue([]);
      const result = await service.getBudgetsWithSpending({ userId: USER_ID });
      expect(result).toEqual([]);
    });

    it('attaches spending for each budget', async () => {
      const b1 = makeBudget({ id: 'b1', amount: 50 });
      const b2 = makeBudget({ id: 'b2', amount: 100 });
      budgetRepository.findAll.mockResolvedValue([b1, b2]);
      findAllSubscriptionsUseCase.execute.mockResolvedValue([]);

      const result = await service.getBudgetsWithSpending({ userId: USER_ID });

      expect(result).toHaveLength(2);
      expect(result[0].budget.id).toBe('b1');
      expect(result[0].spending.spent).toBe(0);
      expect(result[0].spending.remaining).toBe(50);
      expect(result[1].budget.id).toBe('b2');
      expect(result[1].spending.remaining).toBe(100);
    });
  });

  describe('remove', () => {
    it('deletes the budget when owned by the caller', async () => {
      const budget = makeBudget();
      budgetRepository.findById.mockResolvedValue(budget);
      budgetRepository.delete.mockResolvedValue(true);

      await service.remove('budget-1', USER_ID);

      expect(budgetRepository.delete).toHaveBeenCalledWith('budget-1');
    });

    it('throws NotFoundException when budget missing', async () => {
      budgetRepository.findById.mockResolvedValue(null);
      await expect(service.remove('missing', USER_ID)).rejects.toThrow(
        'Budget with ID missing not found',
      );
      expect(budgetRepository.delete).not.toHaveBeenCalled();
    });

    it('throws ForbiddenException when budget belongs to another user', async () => {
      const budget = makeBudget({ userId: 'other-user' });
      budgetRepository.findById.mockResolvedValue(budget);

      await expect(service.remove('budget-1', USER_ID)).rejects.toThrow(
        'You can only delete your own budgets',
      );
      expect(budgetRepository.delete).not.toHaveBeenCalled();
    });
  });
});
