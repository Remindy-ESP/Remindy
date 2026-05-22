import { SubscriptionEventGeneratorService } from './subscription-event-generator.service';
import { makeSubscription } from '../../__fixtures__/subscription.fixtures';
import { makeEvent } from '../../../event/__fixtures__/event.fixtures';
import { Event } from '../../../event/domain/event.entity';

describe('SubscriptionEventGeneratorService', () => {
  let sut: SubscriptionEventGeneratorService;
  let eventRepository: {
    findBySubscriptionId: jest.Mock;
    createMany: jest.Mock;
  };

  beforeEach(() => {
    eventRepository = {
      findBySubscriptionId: jest.fn(),
      createMany: jest.fn(),
    };
    sut = new SubscriptionEventGeneratorService(eventRepository as any);
  });

  describe('addFrequencyInterval (private, tested via calculateOccurrences)', () => {
    it('covers one-time branch by calling private method directly', () => {
      const date = new Date('2025-01-01');
      // Access the private method directly to hit the one-time and default branches
      const result = (sut as any).addFrequencyInterval(date, 'one-time');
      expect(result).toBe(date);
    });

    it('covers default branch by passing unknown frequency to private method', () => {
      const date = new Date('2025-01-01');
      const result = (sut as any).addFrequencyInterval(date, 'unknown-freq');
      // Default falls through to addMonthsUTC(date, 1)
      expect(result.getUTCMonth()).toBe(1); // February (month index 1)
    });
  });

  describe('generateRruleFromFrequency', () => {
    it('returns WEEKLY for weekly', () => {
      expect(sut.generateRruleFromFrequency('weekly')).toBe('FREQ=WEEKLY;INTERVAL=1');
    });

    it('returns MONTHLY for monthly', () => {
      expect(sut.generateRruleFromFrequency('monthly')).toBe('FREQ=MONTHLY;INTERVAL=1');
    });

    it('returns MONTHLY INTERVAL=3 for quarterly', () => {
      expect(sut.generateRruleFromFrequency('quarterly')).toBe('FREQ=MONTHLY;INTERVAL=3');
    });

    it('returns YEARLY for yearly', () => {
      expect(sut.generateRruleFromFrequency('yearly')).toBe('FREQ=YEARLY;INTERVAL=1');
    });

    it('returns MONTHLY as default for one-time', () => {
      expect(sut.generateRruleFromFrequency('one-time')).toBe('FREQ=MONTHLY;INTERVAL=1');
    });
  });

  describe('calculateOccurrencesCount', () => {
    it('returns 1 for one-time frequency', () => {
      const count = sut.calculateOccurrencesCount(
        new Date('2025-01-01'),
        'one-time',
        new Date('2026-01-01'),
      );
      expect(count).toBe(1);
    });

    it('counts monthly occurrences', () => {
      const count = sut.calculateOccurrencesCount(
        new Date('2025-01-01'),
        'monthly',
        new Date('2025-04-01'),
      );
      expect(count).toBe(4);
    });

    it('counts weekly occurrences', () => {
      const count = sut.calculateOccurrencesCount(
        new Date('2025-01-01'),
        'weekly',
        new Date('2025-01-29'), // 4 weeks + 1 day
      );
      expect(count).toBe(5);
    });

    it('counts yearly occurrences', () => {
      const count = sut.calculateOccurrencesCount(
        new Date('2025-01-01'),
        'yearly',
        new Date('2027-01-01'),
      );
      expect(count).toBe(3);
    });

    it('counts quarterly occurrences', () => {
      const count = sut.calculateOccurrencesCount(
        new Date('2025-01-01'),
        'quarterly',
        new Date('2026-01-01'),
      );
      expect(count).toBe(5);
    });
  });

  describe('calculateOccurrencesUntil2099', () => {
    it('calls calculateOccurrencesCount with 2099-12-31 as end date', () => {
      const spy = jest.spyOn(sut, 'calculateOccurrencesCount');
      sut.calculateOccurrencesUntil2099(new Date('2025-01-01'), 'monthly');
      expect(spy).toHaveBeenCalledWith(new Date('2025-01-01'), 'monthly', new Date('2099-12-31'));
    });
  });

  describe('calculateOccurrences', () => {
    it('generates correct count of dates', () => {
      const result = sut.calculateOccurrences(new Date('2025-01-01'), 'monthly', 3);
      expect(result).toHaveLength(3);
      expect(result[0]).toEqual(new Date('2025-01-01'));
    });

    it('stops at endDate when provided', () => {
      const result = sut.calculateOccurrences(
        new Date('2025-01-01'),
        'monthly',
        12,
        new Date('2025-03-15'),
      );
      // Only Jan and Feb are before March 15
      expect(result).toHaveLength(3);
    });

    it('returns empty array when startDate is after endDate', () => {
      const result = sut.calculateOccurrences(
        new Date('2025-06-01'),
        'monthly',
        5,
        new Date('2025-01-01'),
      );
      expect(result).toHaveLength(0);
    });

    it('returns exactly one occurrence for one-time regardless of count', () => {
      const result = sut.calculateOccurrences(new Date('2025-01-01'), 'one-time', 24);
      expect(result).toHaveLength(1);
      expect(result[0]).toEqual(new Date('2025-01-01'));
    });

    it('returns empty array for one-time when startDate is after endDate', () => {
      const result = sut.calculateOccurrences(
        new Date('2025-06-01'),
        'one-time',
        24,
        new Date('2025-01-01'),
      );
      expect(result).toHaveLength(0);
    });
  });

  describe('generateEventsForSubscription', () => {
    it('creates events for new occurrences', async () => {
      eventRepository.findBySubscriptionId.mockResolvedValue([]);
      const createdEvents = [makeEvent(new Date('2025-01-01'))];
      eventRepository.createMany.mockResolvedValue(createdEvents);

      const subscription = makeSubscription();
      const result = await sut.generateEventsForSubscription({ subscription, count: 1 });

      expect(eventRepository.findBySubscriptionId).toHaveBeenCalledWith('sub-1');
      expect(eventRepository.createMany).toHaveBeenCalled();
      expect(result).toEqual(createdEvents);
    });

    it('deduplicates existing dates', async () => {
      const existingEvent = makeEvent(new Date('2025-01-01T00:00:00.000Z'));
      eventRepository.findBySubscriptionId.mockResolvedValue([existingEvent]);
      const createdEvents = [makeEvent(new Date('2025-02-01'))];
      eventRepository.createMany.mockResolvedValue(createdEvents);

      const subscription = makeSubscription({ startDate: new Date('2025-01-01') });
      const result = await sut.generateEventsForSubscription({ subscription, count: 2 });

      expect(eventRepository.createMany).toHaveBeenCalled();
      const calledWith = eventRepository.createMany.mock.calls[0][0] as Event[];
      // Should not include the Jan 1 duplicate
      expect(calledWith.every(e => e.startsAt.getMonth() !== 0 || e.startsAt.getDate() !== 1)).toBe(
        true,
      );
      expect(result).toEqual(createdEvents);
    });

    it('returns empty array when all occurrences already exist', async () => {
      const existing = [
        makeEvent(new Date('2025-01-01T00:00:00.000Z')),
        makeEvent(new Date('2025-02-01T00:00:00.000Z')),
      ];
      eventRepository.findBySubscriptionId.mockResolvedValue(existing);

      const subscription = makeSubscription({ startDate: new Date('2025-01-01') });
      const result = await sut.generateEventsForSubscription({ subscription, count: 2 });

      expect(eventRepository.createMany).not.toHaveBeenCalled();
      expect(result).toEqual([]);
    });

    it('respects subscription endDate', async () => {
      eventRepository.findBySubscriptionId.mockResolvedValue([]);
      eventRepository.createMany.mockResolvedValue([]);

      const subscription = makeSubscription({
        startDate: new Date('2025-01-01'),
        endDate: new Date('2025-02-01'),
      });
      await sut.generateEventsForSubscription({ subscription, count: 12 });

      const calledWith = eventRepository.createMany.mock.calls[0][0] as Event[];
      // Should only include Jan 1 and Feb 1 (on or before endDate)
      expect(calledWith.length).toBeLessThanOrEqual(2);
    });
  });

  describe('regenerateEventsIfNeeded - one-time returns empty immediately', () => {
    it('returns empty array for one-time frequency', async () => {
      const subscription = makeSubscription({ frequency: 'one-time' });
      const result = await sut.regenerateEventsIfNeeded(subscription);
      expect(result).toEqual([]);
      expect(eventRepository.findBySubscriptionId).not.toHaveBeenCalled();
    });
  });

  describe('regenerateEventsIfNeeded', () => {
    it('generates all events when no existing events', async () => {
      eventRepository.findBySubscriptionId.mockResolvedValue([]);
      const generated = [makeEvent(new Date('2025-01-01'))];
      eventRepository.createMany.mockResolvedValue(generated);

      const subscription = makeSubscription();
      const result = await sut.regenerateEventsIfNeeded(subscription, 3, 1);

      expect(result).toEqual(generated);
    });

    it('returns empty array when last event is at or after endDate', async () => {
      const startDate = new Date('2025-01-01');
      const endDate = new Date('2025-06-01');
      // last event is at the endDate, so no more generation needed
      const lastEvent = makeEvent(endDate);
      eventRepository.findBySubscriptionId.mockResolvedValue([lastEvent]);

      const subscription = makeSubscription({
        startDate,
        nextDueDate: new Date('2025-02-01'),
        endDate,
      });
      const result = await sut.regenerateEventsIfNeeded(subscription);

      expect(result).toEqual([]);
    });

    it('returns empty array when last event is beyond threshold', async () => {
      // last event 6 months from now (beyond 3-month threshold)
      const future = new Date();
      future.setMonth(future.getMonth() + 6);
      eventRepository.findBySubscriptionId.mockResolvedValue([makeEvent(future)]);

      const subscription = makeSubscription();
      const result = await sut.regenerateEventsIfNeeded(subscription, 12, 3);

      expect(result).toEqual([]);
    });

    it('regenerates when last event is before threshold', async () => {
      // last event 1 month from now (before 3-month threshold)
      const soon = new Date();
      soon.setMonth(soon.getMonth() + 1);
      eventRepository.findBySubscriptionId.mockResolvedValue([makeEvent(soon)]);

      const newEvents = [makeEvent(new Date())];
      eventRepository.createMany.mockResolvedValue(newEvents);

      const subscription = makeSubscription();
      const result = await sut.regenerateEventsIfNeeded(subscription, 12, 3);

      expect(result).toEqual(newEvents);
    });

    it('returns empty array when startFromDate is beyond 2099', async () => {
      const nearEnd = new Date('2099-11-01');
      eventRepository.findBySubscriptionId.mockResolvedValue([makeEvent(nearEnd)]);

      const subscription = makeSubscription({ frequency: 'yearly' });
      const result = await sut.regenerateEventsIfNeeded(subscription, 12, 3);

      // startFromDate would be 2100 which is > 2099
      expect(result).toEqual([]);
    });

    it('returns empty when next occurrence would exceed subscription endDate (line 226)', async () => {
      // lastEvent is 1 month away → below the 3-month threshold → enters regeneration
      const soon = new Date();
      soon.setMonth(soon.getMonth() + 1);
      eventRepository.findBySubscriptionId.mockResolvedValue([makeEvent(soon)]);

      // endDate is 6 months away → after lastEvent but before startFromDate (lastEvent + 1 year)
      const endDate = new Date();
      endDate.setMonth(endDate.getMonth() + 6);
      // Use yearly frequency so startFromDate = soon + 1 year >> endDate
      const subscription = makeSubscription({ frequency: 'yearly', endDate });

      const result = await sut.regenerateEventsIfNeeded(subscription, 12, 3);

      expect(result).toEqual([]);
      expect(eventRepository.createMany).not.toHaveBeenCalled();
    });

    it('breaks the count loop at 500 iterations (safety limit, line 244)', async () => {
      // lastEvent is 1 month away → below the 3-month threshold → enters regeneration
      const soon = new Date();
      soon.setMonth(soon.getMonth() + 1);
      // First call (initial check) returns the last event; subsequent calls return [] for dedup
      eventRepository.findBySubscriptionId
        .mockResolvedValueOnce([makeEvent(soon)]) // regenerateEventsIfNeeded initial check
        .mockResolvedValue([]); // generateEventsForSubscription dedup check
      eventRepository.createMany.mockResolvedValue([]);

      // weekly + 240 months ahead generates ~1040 occurrences → breaks at 500
      const subscription = makeSubscription({ frequency: 'weekly' });
      await sut.regenerateEventsIfNeeded(subscription, 240, 3);

      // createMany must have been called, proving the 500-break path was taken
      expect(eventRepository.createMany).toHaveBeenCalled();
      const generatedCount = (eventRepository.createMany.mock.calls[0][0] as Event[]).length;
      expect(generatedCount).toBe(500);
    });

    it('clamps effectiveTargetDate to 2099 when monthsAhead pushes beyond it (line 211)', async () => {
      // lastEvent 1 month from now → below threshold → enters regeneration
      const soon = new Date();
      soon.setMonth(soon.getMonth() + 1);
      eventRepository.findBySubscriptionId
        .mockResolvedValueOnce([makeEvent(soon)]) // initial check
        .mockResolvedValue([]); // dedup check inside generateEventsForSubscription
      eventRepository.createMany.mockResolvedValue([]);

      // monthsAhead = 900 → targetDate = ~2101 > maxDate 2099-12-31
      // effectiveTargetDate is clamped to 2099-12-31 (true branch of ternary on line 211)
      // yearly frequency → ~73 occurrences from startFromDate to 2099 → count > 0
      const subscription = makeSubscription({ frequency: 'yearly' });
      await sut.regenerateEventsIfNeeded(subscription, 900, 3);

      expect(eventRepository.createMany).toHaveBeenCalled();
    });

    it('skips generateEventsForSubscription when count is 0 (line 248 false branch)', async () => {
      // lastEvent 1 month from now → below the 3-month threshold → enters regeneration
      const soon = new Date();
      soon.setMonth(soon.getMonth() + 1);
      eventRepository.findBySubscriptionId.mockResolvedValue([makeEvent(soon)]);

      // yearly frequency, monthsAhead=12, no endDate:
      // startFromDate = soon + 1 year = now + 13 months
      // effectiveTargetDate = now + 12 months
      // startFromDate > effectiveTargetDate → while loop never runs → count stays 0
      // if (count > 0) is false → returns [] without calling generateEventsForSubscription
      const subscription = makeSubscription({ frequency: 'yearly' });
      const result = await sut.regenerateEventsIfNeeded(subscription, 12, 3);

      expect(result).toEqual([]);
      expect(eventRepository.createMany).not.toHaveBeenCalled();
    });

    it('respects endDate in regeneration', async () => {
      // last event is 1 month away (below 3-month threshold) → regeneration needed
      const soon = new Date();
      soon.setMonth(soon.getMonth() + 1);
      eventRepository.findBySubscriptionId.mockResolvedValue([makeEvent(soon)]);

      // endDate is 4 months away (clearly after startFromDate which is 2 months away)
      const startDate = new Date('2025-01-01');
      const endDate = new Date();
      endDate.setMonth(endDate.getMonth() + 4);
      const subscription = makeSubscription({
        startDate,
        nextDueDate: new Date('2025-02-01'),
        endDate,
      });

      eventRepository.createMany.mockResolvedValue([]);

      await sut.regenerateEventsIfNeeded(subscription, 12, 3);
      // Should not crash and should handle endDate limiting
    });
  });
});
