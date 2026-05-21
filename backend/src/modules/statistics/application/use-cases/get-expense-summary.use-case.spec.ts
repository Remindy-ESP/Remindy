import { Test, TestingModule } from '@nestjs/testing';
import { GetExpenseSummaryUseCase } from './get-expense-summary.use-case';
import {
  EVENT_REPOSITORY,
  type IEventRepository,
} from '../../../event/application/ports/event-repository.interface';
import { Event } from '../../../event/domain/event.entity';
import { FindAllSubscriptionsUseCase } from '../../../subscription/application/use-cases/find-all-subscriptions.use-case';
import { Subscription } from '../../../subscription/domain/subscription.entity';

const USER_ID = 'user-1';
const OTHER_USER_ID = 'user-2';

function makeSubscription(id: string, userId: string = USER_ID): Subscription {
  return new Subscription({
    id,
    userId,
    name: `sub-${id}`,
    amount: 0,
    currency: 'EUR',
    frequency: 'monthly',
    startDate: new Date('2024-01-01T00:00:00Z'),
    nextDueDate: new Date('2025-01-01T00:00:00Z'),
    status: 'active',
  });
}

function makeEvent(amount: number, subscriptionId: string, startsAt: Date): Event {
  return new Event({
    subscriptionId,
    title: `event-${subscriptionId}`,
    amount,
    startsAt,
    status: 'completed',
  });
}

describe('GetExpenseSummaryUseCase', () => {
  let useCase: GetExpenseSummaryUseCase;
  let eventRepository: jest.Mocked<IEventRepository>;
  let findAllSubscriptionsUseCase: jest.Mocked<FindAllSubscriptionsUseCase>;

  beforeEach(async () => {
    const mockEventRepository: Partial<jest.Mocked<IEventRepository>> = {
      findAll: jest.fn(),
    };
    const mockFindAllSubscriptions: Partial<jest.Mocked<FindAllSubscriptionsUseCase>> = {
      execute: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GetExpenseSummaryUseCase,
        { provide: EVENT_REPOSITORY, useValue: mockEventRepository },
        { provide: FindAllSubscriptionsUseCase, useValue: mockFindAllSubscriptions },
      ],
    }).compile();

    useCase = module.get(GetExpenseSummaryUseCase);
    eventRepository = module.get(EVENT_REPOSITORY);
    findAllSubscriptionsUseCase = module.get(FindAllSubscriptionsUseCase);
  });

  it('should be defined', () => {
    expect(useCase).toBeDefined();
  });

  describe('date range resolution per period', () => {
    beforeEach(() => {
      findAllSubscriptionsUseCase.execute.mockResolvedValue([makeSubscription('s1')]);
      eventRepository.findAll.mockResolvedValue([]);
    });

    it("'day' uses month-to-date vs same range last month", async () => {
      const reference = new Date(2025, 9, 5, 14, 30); // 5 oct 2025

      await useCase.execute({ userId: USER_ID, period: 'day', referenceDate: reference });

      const [currentCall, previousCall] = eventRepository.findAll.mock.calls;
      expect(currentCall[0]?.start).toEqual(new Date(2025, 9, 1, 0, 0, 0, 0));
      expect(currentCall[0]?.end?.getDate()).toBe(5);
      expect(currentCall[0]?.end?.getMonth()).toBe(9);
      expect(previousCall[0]?.start).toEqual(new Date(2025, 8, 1, 0, 0, 0, 0));
      expect(previousCall[0]?.end?.getDate()).toBe(5);
      expect(previousCall[0]?.end?.getMonth()).toBe(8);
    });

    it("'week' uses last full week vs the week before (Monday-first)", async () => {
      const reference = new Date(2025, 9, 15); // Wed 15 oct 2025 (current week starts Mon 13)

      await useCase.execute({ userId: USER_ID, period: 'week', referenceDate: reference });

      const [currentCall, previousCall] = eventRepository.findAll.mock.calls;
      // Last full week: Mon 6 → Sun 12
      expect(currentCall[0]?.start).toEqual(new Date(2025, 9, 6, 0, 0, 0, 0));
      expect(currentCall[0]?.end?.getDate()).toBe(12);
      // Week before: Mon 29 sept → Sun 5 oct
      expect(previousCall[0]?.start).toEqual(new Date(2025, 8, 29, 0, 0, 0, 0));
      expect(previousCall[0]?.end?.getDate()).toBe(5);
      expect(previousCall[0]?.end?.getMonth()).toBe(9);
    });

    it("'month' uses current month vs previous month", async () => {
      const reference = new Date(2025, 9, 5);

      await useCase.execute({ userId: USER_ID, period: 'month', referenceDate: reference });

      const [currentCall, previousCall] = eventRepository.findAll.mock.calls;
      expect(currentCall[0]?.start).toEqual(new Date(2025, 9, 1, 0, 0, 0, 0));
      expect(currentCall[0]?.end?.getDate()).toBe(31);
      expect(previousCall[0]?.start).toEqual(new Date(2025, 8, 1, 0, 0, 0, 0));
      expect(previousCall[0]?.end?.getDate()).toBe(30);
    });

    it("'year' uses current year vs previous year", async () => {
      const reference = new Date(2025, 5, 15);

      await useCase.execute({ userId: USER_ID, period: 'year', referenceDate: reference });

      const [currentCall, previousCall] = eventRepository.findAll.mock.calls;
      expect(currentCall[0]?.start).toEqual(new Date(2025, 0, 1, 0, 0, 0, 0));
      expect(currentCall[0]?.end?.getFullYear()).toBe(2025);
      expect(previousCall[0]?.start).toEqual(new Date(2024, 0, 1, 0, 0, 0, 0));
      expect(previousCall[0]?.end?.getFullYear()).toBe(2024);
    });
  });

  describe('amount aggregation and user scoping', () => {
    it('sums amounts of events whose subscription belongs to the user', async () => {
      findAllSubscriptionsUseCase.execute.mockResolvedValue([
        makeSubscription('s1'),
        makeSubscription('s2'),
      ]);
      eventRepository.findAll
        .mockResolvedValueOnce([
          makeEvent(50.5, 's1', new Date(2025, 9, 2)),
          makeEvent(100, 's2', new Date(2025, 9, 3)),
        ])
        .mockResolvedValueOnce([makeEvent(40, 's1', new Date(2025, 8, 2))]);

      const result = await useCase.execute({
        userId: USER_ID,
        period: 'month',
        referenceDate: new Date(2025, 9, 5),
      });

      expect(result.currentTotal).toBe(150.5);
      expect(result.previousTotal).toBe(40);
    });

    it("excludes events whose subscription is not in the user's set", async () => {
      findAllSubscriptionsUseCase.execute.mockResolvedValue([makeSubscription('s1')]);
      eventRepository.findAll
        .mockResolvedValueOnce([
          makeEvent(10, 's1', new Date(2025, 9, 2)),
          makeEvent(999, 'other-user-sub', new Date(2025, 9, 3)),
        ])
        .mockResolvedValueOnce([]);

      const result = await useCase.execute({
        userId: USER_ID,
        period: 'month',
        referenceDate: new Date(2025, 9, 5),
      });

      expect(result.currentTotal).toBe(10);
    });

    it('returns zero totals when the user has no subscriptions and skips event queries', async () => {
      findAllSubscriptionsUseCase.execute.mockResolvedValue([]);

      const result = await useCase.execute({
        userId: OTHER_USER_ID,
        period: 'month',
        referenceDate: new Date(2025, 9, 5),
      });

      expect(result.currentTotal).toBe(0);
      expect(result.previousTotal).toBe(0);
      expect(result.percentageChange).toBe(0);
      expect(result.trend).toBe('stable');
      expect(eventRepository.findAll).not.toHaveBeenCalled();
    });

    it('returns zero totals when the user has subs but no events fall in either window', async () => {
      findAllSubscriptionsUseCase.execute.mockResolvedValue([makeSubscription('s1')]);
      eventRepository.findAll.mockResolvedValue([]);

      const result = await useCase.execute({
        userId: USER_ID,
        period: 'month',
        referenceDate: new Date(2025, 9, 5),
      });

      expect(result.currentTotal).toBe(0);
      expect(result.previousTotal).toBe(0);
      expect(result.trend).toBe('stable');
    });
  });

  describe('percentageChange and trend', () => {
    function setup(current: number, previous: number) {
      findAllSubscriptionsUseCase.execute.mockResolvedValue([makeSubscription('s1')]);
      eventRepository.findAll
        .mockResolvedValueOnce(current > 0 ? [makeEvent(current, 's1', new Date(2025, 9, 2))] : [])
        .mockResolvedValueOnce(
          previous > 0 ? [makeEvent(previous, 's1', new Date(2025, 8, 2))] : [],
        );
    }

    it("previous=0 + current=0 → 0%, 'stable'", async () => {
      setup(0, 0);
      const result = await useCase.execute({
        userId: USER_ID,
        period: 'month',
        referenceDate: new Date(2025, 9, 5),
      });
      expect(result.percentageChange).toBe(0);
      expect(result.trend).toBe('stable');
    });

    it("previous=0 + current>0 → 100%, 'up' (sentinel)", async () => {
      setup(50, 0);
      const result = await useCase.execute({
        userId: USER_ID,
        period: 'month',
        referenceDate: new Date(2025, 9, 5),
      });
      expect(result.percentageChange).toBe(100);
      expect(result.trend).toBe('up');
    });

    it("current=0 + previous>0 → -100%, 'down'", async () => {
      setup(0, 80);
      const result = await useCase.execute({
        userId: USER_ID,
        period: 'month',
        referenceDate: new Date(2025, 9, 5),
      });
      expect(result.percentageChange).toBe(-100);
      expect(result.trend).toBe('down');
    });

    it("exact zero change → 0%, 'stable'", async () => {
      setup(123.45, 123.45);
      const result = await useCase.execute({
        userId: USER_ID,
        period: 'month',
        referenceDate: new Date(2025, 9, 5),
      });
      expect(result.percentageChange).toBe(0);
      expect(result.trend).toBe('stable');
    });

    it("tiny change within ±0.1% threshold → 'stable'", async () => {
      // current/previous = 1000.05 / 1000 → +0.005% rounds to 0.0
      setup(1000.05, 1000);
      const result = await useCase.execute({
        userId: USER_ID,
        period: 'month',
        referenceDate: new Date(2025, 9, 5),
      });
      expect(result.percentageChange).toBe(0);
      expect(result.trend).toBe('stable');
    });

    it("large positive change is rounded to 1 decimal and trends 'up'", async () => {
      // (350 - 100) / 100 * 100 = 250.0
      setup(350, 100);
      const result = await useCase.execute({
        userId: USER_ID,
        period: 'month',
        referenceDate: new Date(2025, 9, 5),
      });
      expect(result.percentageChange).toBe(250);
      expect(result.trend).toBe('up');
    });

    it("large negative change is rounded to 1 decimal and trends 'down'", async () => {
      // (25 - 200) / 200 * 100 = -87.5
      setup(25, 200);
      const result = await useCase.execute({
        userId: USER_ID,
        period: 'month',
        referenceDate: new Date(2025, 9, 5),
      });
      expect(result.percentageChange).toBe(-87.5);
      expect(result.trend).toBe('down');
    });

    it('modest positive change rounds to 1 decimal', async () => {
      // (211.20 - 203.85) / 203.85 * 100 ≈ 3.604... → 3.6
      setup(211.2, 203.85);
      const result = await useCase.execute({
        userId: USER_ID,
        period: 'month',
        referenceDate: new Date(2025, 9, 5),
      });
      expect(result.percentageChange).toBe(3.6);
      expect(result.trend).toBe('up');
    });
  });

  describe('labels', () => {
    beforeEach(() => {
      findAllSubscriptionsUseCase.execute.mockResolvedValue([makeSubscription('s1')]);
      eventRepository.findAll.mockResolvedValue([]);
    });

    it("uses 'Comparo M-1' for day", async () => {
      const result = await useCase.execute({
        userId: USER_ID,
        period: 'day',
        referenceDate: new Date(2025, 9, 5),
      });
      expect(result.comparisonLabel).toBe('Comparo M-1');
      expect(result.periodLabel).toBe('5 octobre 2025');
    });

    it("uses 'Comparo S-1' for week", async () => {
      const result = await useCase.execute({
        userId: USER_ID,
        period: 'week',
        referenceDate: new Date(2025, 9, 15),
      });
      expect(result.comparisonLabel).toBe('Comparo S-1');
      expect(result.periodLabel).toContain('Semaine du');
    });

    it("uses 'Comparo M-1' for month", async () => {
      const result = await useCase.execute({
        userId: USER_ID,
        period: 'month',
        referenceDate: new Date(2025, 9, 5),
      });
      expect(result.comparisonLabel).toBe('Comparo M-1');
      expect(result.periodLabel).toBe('Octobre 2025');
    });

    it("uses 'Comparo A-1' for year", async () => {
      const result = await useCase.execute({
        userId: USER_ID,
        period: 'year',
        referenceDate: new Date(2025, 9, 5),
      });
      expect(result.comparisonLabel).toBe('Comparo A-1');
      expect(result.periodLabel).toBe('2025');
    });
  });

  describe('rounding of totals', () => {
    it('rounds currentTotal and previousTotal to 2 decimals', async () => {
      findAllSubscriptionsUseCase.execute.mockResolvedValue([makeSubscription('s1')]);
      eventRepository.findAll
        .mockResolvedValueOnce([
          makeEvent(10.123, 's1', new Date(2025, 9, 2)),
          makeEvent(20.456, 's1', new Date(2025, 9, 3)),
        ])
        .mockResolvedValueOnce([makeEvent(15.999, 's1', new Date(2025, 8, 2))]);

      const result = await useCase.execute({
        userId: USER_ID,
        period: 'month',
        referenceDate: new Date(2025, 9, 5),
      });

      expect(result.currentTotal).toBe(30.58);
      expect(result.previousTotal).toBe(16);
    });
  });

  describe('default reference date', () => {
    it('uses now() when referenceDate is omitted', async () => {
      findAllSubscriptionsUseCase.execute.mockResolvedValue([makeSubscription('s1')]);
      eventRepository.findAll.mockResolvedValue([]);

      const result = await useCase.execute({ userId: USER_ID, period: 'year' });

      expect(result.periodLabel).toBe(String(new Date().getFullYear()));
    });
  });
});
