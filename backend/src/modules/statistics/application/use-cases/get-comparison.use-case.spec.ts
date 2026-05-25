import { Test, TestingModule } from '@nestjs/testing';
import { GetComparisonUseCase } from './get-comparison.use-case';
import { EVENT_REPOSITORY } from '../../../event/application/ports/event-repository.interface';
import type { IEventRepository } from '../../../event/application/ports/event-repository.interface';
import { FindAllSubscriptionsUseCase } from '../../../subscription/application/use-cases/find-all-subscriptions.use-case';
import { Subscription } from '../../../subscription/domain/subscription.entity';
import { Event } from '../../../event/domain/event.entity';
import { ComparisonQueryAppDto } from '../dto/comparison-query-app.dto';

const USER_ID = 'user-1';
const CURRENT_START = new Date('2026-05-01T00:00:00Z');
const CURRENT_END = new Date('2026-06-01T00:00:00Z');
const PREV_START = new Date('2026-04-01T00:00:00Z');
const PREV_END = new Date('2026-05-01T00:00:00Z');

function baseQuery(overrides: Partial<ComparisonQueryAppDto> = {}): ComparisonQueryAppDto {
  return {
    userId: USER_ID,
    currentStart: CURRENT_START,
    currentEnd: CURRENT_END,
    compareStart: PREV_START,
    compareEnd: PREV_END,
    ...overrides,
  };
}

function makeSub(id: string, categoryId?: string): Subscription {
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

function makeEvent(subscriptionId: string, amount: number, canceled = false): Event {
  return new Event({
    id: `e-${subscriptionId}-${amount}`,
    subscriptionId,
    title: 'charge',
    amount,
    startsAt: new Date('2026-05-15T00:00:00Z'),
    status: canceled ? 'canceled' : 'completed',
  });
}

describe('GetComparisonUseCase', () => {
  let useCase: GetComparisonUseCase;
  let eventRepository: jest.Mocked<IEventRepository>;
  let findAllSubsUseCase: jest.Mocked<FindAllSubscriptionsUseCase>;

  beforeEach(async () => {
    const mockEventRepo: Partial<jest.Mocked<IEventRepository>> = {
      findAll: jest.fn().mockResolvedValue([]),
    };
    const mockFindAllSubs: Partial<jest.Mocked<FindAllSubscriptionsUseCase>> = {
      execute: jest.fn().mockResolvedValue([]),
    };
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GetComparisonUseCase,
        { provide: EVENT_REPOSITORY, useValue: mockEventRepo },
        { provide: FindAllSubscriptionsUseCase, useValue: mockFindAllSubs },
      ],
    }).compile();

    useCase = module.get<GetComparisonUseCase>(GetComparisonUseCase);
    eventRepository = module.get(EVENT_REPOSITORY);
    findAllSubsUseCase = module.get(FindAllSubscriptionsUseCase);
  });

  it('returns zero totals when user has no subscriptions', async () => {
    const result = await useCase.execute(baseQuery());
    expect(result.current.total).toBe(0);
    expect(result.previous.total).toBe(0);
    expect(result.delta).toBe(0);
    expect(result.percentageChange).toBe(0);
    expect(result.trend).toBe('stable');
    expect(eventRepository.findAll).not.toHaveBeenCalled();
  });

  it('computes equal totals as delta=0 / trend=stable', async () => {
    findAllSubsUseCase.execute.mockResolvedValue([makeSub('s1')]);
    eventRepository.findAll
      .mockResolvedValueOnce([makeEvent('s1', 25)])
      .mockResolvedValueOnce([makeEvent('s1', 25)]);

    const result = await useCase.execute(baseQuery());

    expect(result.current.total).toBe(25);
    expect(result.previous.total).toBe(25);
    expect(result.delta).toBe(0);
    expect(result.percentageChange).toBe(0);
    expect(result.trend).toBe('stable');
  });

  it('detects an increase (trend=up)', async () => {
    findAllSubsUseCase.execute.mockResolvedValue([makeSub('s1')]);
    eventRepository.findAll
      .mockResolvedValueOnce([makeEvent('s1', 60)])
      .mockResolvedValueOnce([makeEvent('s1', 40)]);

    const result = await useCase.execute(baseQuery());

    expect(result.current.total).toBe(60);
    expect(result.previous.total).toBe(40);
    expect(result.delta).toBe(20);
    expect(result.percentageChange).toBe(50);
    expect(result.trend).toBe('up');
  });

  it('detects a decrease (trend=down)', async () => {
    findAllSubsUseCase.execute.mockResolvedValue([makeSub('s1')]);
    eventRepository.findAll
      .mockResolvedValueOnce([makeEvent('s1', 30)])
      .mockResolvedValueOnce([makeEvent('s1', 50)]);

    const result = await useCase.execute(baseQuery());

    expect(result.current.total).toBe(30);
    expect(result.previous.total).toBe(50);
    expect(result.delta).toBe(-20);
    expect(result.percentageChange).toBe(-40);
    expect(result.trend).toBe('down');
  });

  it('reports 100% up when previous is zero and current > 0', async () => {
    findAllSubsUseCase.execute.mockResolvedValue([makeSub('s1')]);
    eventRepository.findAll.mockResolvedValueOnce([makeEvent('s1', 12)]).mockResolvedValueOnce([]);

    const result = await useCase.execute(baseQuery());

    expect(result.previous.total).toBe(0);
    expect(result.current.total).toBe(12);
    expect(result.percentageChange).toBe(100);
    expect(result.trend).toBe('up');
  });

  it('reports 0% / stable when both periods are zero', async () => {
    findAllSubsUseCase.execute.mockResolvedValue([makeSub('s1')]);
    eventRepository.findAll.mockResolvedValueOnce([]).mockResolvedValueOnce([]);

    const result = await useCase.execute(baseQuery());

    expect(result.percentageChange).toBe(0);
    expect(result.trend).toBe('stable');
  });

  it('ignores canceled events', async () => {
    findAllSubsUseCase.execute.mockResolvedValue([makeSub('s1')]);
    eventRepository.findAll
      .mockResolvedValueOnce([makeEvent('s1', 30), makeEvent('s1', 50, true)])
      .mockResolvedValueOnce([makeEvent('s1', 20)]);

    const result = await useCase.execute(baseQuery());

    expect(result.current.total).toBe(30);
    expect(result.previous.total).toBe(20);
  });

  it('filters by categoryId when provided', async () => {
    findAllSubsUseCase.execute.mockResolvedValue([makeSub('s1', 'cat-a'), makeSub('s2', 'cat-b')]);
    eventRepository.findAll
      .mockResolvedValueOnce([makeEvent('s1', 10), makeEvent('s2', 99)])
      .mockResolvedValueOnce([makeEvent('s1', 5), makeEvent('s2', 99)]);

    const result = await useCase.execute(baseQuery({ categoryId: 'cat-a' }));

    expect(result.current.total).toBe(10);
    expect(result.previous.total).toBe(5);
  });

  it('rejects when currentEnd is not after currentStart', async () => {
    await expect(
      useCase.execute(
        baseQuery({ currentStart: new Date('2026-05-05'), currentEnd: new Date('2026-05-01') }),
      ),
    ).rejects.toThrow('currentEnd must be after currentStart');
  });

  it('rejects when compareEnd is not after compareStart', async () => {
    await expect(
      useCase.execute(
        baseQuery({ compareStart: new Date('2026-04-05'), compareEnd: new Date('2026-04-01') }),
      ),
    ).rejects.toThrow('compareEnd must be after compareStart');
  });

  it('passes the right date ranges to the event repository', async () => {
    findAllSubsUseCase.execute.mockResolvedValue([makeSub('s1')]);
    eventRepository.findAll.mockResolvedValueOnce([]).mockResolvedValueOnce([]);

    await useCase.execute(baseQuery());

    expect(eventRepository.findAll).toHaveBeenNthCalledWith(1, {
      start: CURRENT_START,
      end: CURRENT_END,
    });
    expect(eventRepository.findAll).toHaveBeenNthCalledWith(2, {
      start: PREV_START,
      end: PREV_END,
    });
  });
});
