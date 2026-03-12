import { EventGenerationService } from './event-generation.service';
import { Event } from '../../domain/event.entity';
import { EventSeries } from '../../../event-series/domain/event-series.entity';
import { Subscription } from '../../../subscription/domain/subscription.entity';

function makeSubscription(overrides = {}): Subscription {
  return new Subscription({
    id: 'sub-1',
    userId: 'user-1',
    name: 'Netflix',
    amount: 9.99,
    currency: 'EUR',
    frequency: 'monthly',
    startDate: new Date('2025-01-01'),
    nextDueDate: new Date('2025-02-01'),
    status: 'active',
    ...overrides,
  });
}

function makeEventSeries(overrides = {}): EventSeries {
  return new EventSeries({
    id: 'series-1',
    subscriptionId: 'sub-1',
    rrule: 'FREQ=MONTHLY;INTERVAL=1',
    dtstart: new Date('2025-01-01'),
    timezone: 'Europe/Paris',
    ...overrides,
  });
}

function makeEvent(): Event {
  return new Event({
    id: 'evt-1',
    subscriptionId: 'sub-1',
    title: 'Paiement Netflix',
    amount: 9.99,
    startsAt: new Date('2025-01-01'),
    status: 'scheduled',
  });
}

describe('EventGenerationService', () => {
  let sut: EventGenerationService;
  let subscriptionRepository: { findAll: jest.Mock; findById: jest.Mock };
  let eventSeriesRepository: { findBySubscriptionId: jest.Mock };
  let generateEventsFromSeriesUseCase: { execute: jest.Mock };
  let generateEventsForSubscriptionUseCase: { execute: jest.Mock };

  beforeEach(() => {
    subscriptionRepository = {
      findAll: jest.fn(),
      findById: jest.fn(),
    };
    eventSeriesRepository = {
      findBySubscriptionId: jest.fn(),
    };
    generateEventsFromSeriesUseCase = { execute: jest.fn() };
    generateEventsForSubscriptionUseCase = { execute: jest.fn() };

    sut = new EventGenerationService(
      subscriptionRepository as any,
      eventSeriesRepository as any,
      generateEventsFromSeriesUseCase as any,
      generateEventsForSubscriptionUseCase as any,
    );
  });

  describe('generateEventsForAllSubscriptions', () => {
    it('generates events for active subscriptions with event series', async () => {
      const sub = makeSubscription();
      const series = makeEventSeries();
      const occurrences = [new Date('2025-02-01')];
      const events = [makeEvent()];

      subscriptionRepository.findAll.mockResolvedValue([sub]);
      eventSeriesRepository.findBySubscriptionId.mockResolvedValue(series);
      generateEventsFromSeriesUseCase.execute.mockResolvedValue(occurrences);
      generateEventsForSubscriptionUseCase.execute.mockResolvedValue(events);

      await sut.generateEventsForAllSubscriptions();

      expect(subscriptionRepository.findAll).toHaveBeenCalledWith({ status: 'active' });
      expect(eventSeriesRepository.findBySubscriptionId).toHaveBeenCalledWith('sub-1');
      expect(generateEventsFromSeriesUseCase.execute).toHaveBeenCalledWith(
        'series-1',
        expect.any(Date),
        expect.any(Date),
        365,
      );
      expect(generateEventsForSubscriptionUseCase.execute).toHaveBeenCalledWith({
        subscriptionId: 'sub-1',
        subscriptionName: 'Netflix',
        subscriptionAmount: 9.99,
        eventSeriesId: 'series-1',
        occurrences,
      });
    });

    it('warns and skips when no event series found for a subscription', async () => {
      const sub = makeSubscription();
      subscriptionRepository.findAll.mockResolvedValue([sub]);
      eventSeriesRepository.findBySubscriptionId.mockResolvedValue(null);

      await sut.generateEventsForAllSubscriptions();

      expect(generateEventsFromSeriesUseCase.execute).not.toHaveBeenCalled();
    });

    it('logs 0 events when none are generated', async () => {
      const sub = makeSubscription();
      const series = makeEventSeries();

      subscriptionRepository.findAll.mockResolvedValue([sub]);
      eventSeriesRepository.findBySubscriptionId.mockResolvedValue(series);
      generateEventsFromSeriesUseCase.execute.mockResolvedValue([]);
      generateEventsForSubscriptionUseCase.execute.mockResolvedValue([]);

      await expect(sut.generateEventsForAllSubscriptions()).resolves.not.toThrow();
    });

    it('continues processing other subscriptions when one fails', async () => {
      const sub1 = makeSubscription({ id: 'sub-1' });
      const sub2 = makeSubscription({ id: 'sub-2' });
      const series = makeEventSeries();

      subscriptionRepository.findAll.mockResolvedValue([sub1, sub2]);
      eventSeriesRepository.findBySubscriptionId
        .mockRejectedValueOnce(new Error('DB error'))
        .mockResolvedValueOnce(series);
      generateEventsFromSeriesUseCase.execute.mockResolvedValue([]);
      generateEventsForSubscriptionUseCase.execute.mockResolvedValue([]);

      await expect(sut.generateEventsForAllSubscriptions()).resolves.not.toThrow();
      expect(eventSeriesRepository.findBySubscriptionId).toHaveBeenCalledTimes(2);
    });

    it('handles outer error gracefully', async () => {
      subscriptionRepository.findAll.mockRejectedValue(new Error('Connection failed'));

      await expect(sut.generateEventsForAllSubscriptions()).resolves.not.toThrow();
    });

    it('handles empty subscriptions list', async () => {
      subscriptionRepository.findAll.mockResolvedValue([]);

      await sut.generateEventsForAllSubscriptions();

      expect(eventSeriesRepository.findBySubscriptionId).not.toHaveBeenCalled();
    });
  });

  describe('generateEventsForSubscription', () => {
    it('generates events and returns count', async () => {
      const sub = makeSubscription();
      const series = makeEventSeries();
      const occurrences = [new Date('2025-02-01'), new Date('2025-03-01')];
      const events = [makeEvent(), makeEvent()];

      subscriptionRepository.findById.mockResolvedValue(sub);
      eventSeriesRepository.findBySubscriptionId.mockResolvedValue(series);
      generateEventsFromSeriesUseCase.execute.mockResolvedValue(occurrences);
      generateEventsForSubscriptionUseCase.execute.mockResolvedValue(events);

      const count = await sut.generateEventsForSubscription('sub-1');

      expect(subscriptionRepository.findById).toHaveBeenCalledWith('sub-1');
      expect(count).toBe(2);
    });

    it('throws when subscription not found', async () => {
      subscriptionRepository.findById.mockResolvedValue(null);

      await expect(sut.generateEventsForSubscription('missing')).rejects.toThrow(
        'Subscription missing not found',
      );
    });

    it('throws when event series not found', async () => {
      subscriptionRepository.findById.mockResolvedValue(makeSubscription());
      eventSeriesRepository.findBySubscriptionId.mockResolvedValue(null);

      await expect(sut.generateEventsForSubscription('sub-1')).rejects.toThrow(
        'No event series found for subscription sub-1',
      );
    });
  });
});
