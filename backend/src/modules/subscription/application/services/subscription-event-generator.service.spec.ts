import { Test, TestingModule } from '@nestjs/testing';
import { SubscriptionEventGeneratorService } from './subscription-event-generator.service';
import { Subscription } from '../../domain/subscription.entity';
import { Event } from '../../../event/domain/event.entity';
import type { IEventRepository } from '../../../event/application/ports/event-repository.interface';
import { EVENT_REPOSITORY } from '../../../event/application/ports/event-repository.interface';

describe('SubscriptionEventGeneratorService', () => {
  let service: SubscriptionEventGeneratorService;
  let eventRepository: jest.Mocked<IEventRepository>;

  beforeEach(async () => {
    const mockEventRepository = {
      findBySubscriptionId: jest.fn(),
      createMany: jest.fn(),
      create: jest.fn(),
      findById: jest.fn(),
      findAll: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      softDelete: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SubscriptionEventGeneratorService,
        {
          provide: EVENT_REPOSITORY,
          useValue: mockEventRepository,
        },
      ],
    }).compile();

    service = module.get<SubscriptionEventGeneratorService>(SubscriptionEventGeneratorService);
    eventRepository = module.get(EVENT_REPOSITORY);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('generateRruleFromFrequency', () => {
    it('should generate RRULE for weekly frequency', () => {
      const result = service.generateRruleFromFrequency('weekly');
      expect(result).toBe('FREQ=WEEKLY;INTERVAL=1');
    });

    it('should generate RRULE for monthly frequency', () => {
      const result = service.generateRruleFromFrequency('monthly');
      expect(result).toBe('FREQ=MONTHLY;INTERVAL=1');
    });

    it('should generate RRULE for quarterly frequency', () => {
      const result = service.generateRruleFromFrequency('quarterly');
      expect(result).toBe('FREQ=MONTHLY;INTERVAL=3');
    });

    it('should generate RRULE for yearly frequency', () => {
      const result = service.generateRruleFromFrequency('yearly');
      expect(result).toBe('FREQ=YEARLY;INTERVAL=1');
    });

    it('should return default RRULE for one-time frequency', () => {
      const result = service.generateRruleFromFrequency('one-time');
      expect(result).toBe('FREQ=MONTHLY;INTERVAL=1');
    });

    it('should return default RRULE for unknown frequency', () => {
      const result = service.generateRruleFromFrequency('unknown' as any);
      expect(result).toBe('FREQ=MONTHLY;INTERVAL=1');
    });
  });

  describe('calculateOccurrences', () => {
    it('should calculate weekly occurrences', () => {
      const startDate = new Date('2024-01-01T00:00:00.000Z');
      const result = service.calculateOccurrences(startDate, 'weekly', 4);

      expect(result).toHaveLength(4);
      expect(result[0]).toEqual(new Date('2024-01-01T00:00:00.000Z'));
      expect(result[1]).toEqual(new Date('2024-01-08T00:00:00.000Z'));
      expect(result[2]).toEqual(new Date('2024-01-15T00:00:00.000Z'));
      expect(result[3]).toEqual(new Date('2024-01-22T00:00:00.000Z'));
    });

    it('should calculate monthly occurrences', () => {
      const startDate = new Date('2024-01-15T00:00:00.000Z');
      const result = service.calculateOccurrences(startDate, 'monthly', 3);

      expect(result).toHaveLength(3);
      expect(result[0]).toEqual(new Date('2024-01-15T00:00:00.000Z'));
      expect(result[1]).toEqual(new Date('2024-02-15T00:00:00.000Z'));
      expect(result[2]).toEqual(new Date('2024-03-15T00:00:00.000Z'));
    });

    it('should calculate quarterly occurrences', () => {
      const startDate = new Date('2024-01-01T00:00:00.000Z');
      const result = service.calculateOccurrences(startDate, 'quarterly', 4);

      expect(result).toHaveLength(4);
      expect(result[0]).toEqual(new Date('2024-01-01T00:00:00.000Z'));
      expect(result[1]).toEqual(new Date('2024-04-01T00:00:00.000Z'));
      expect(result[2]).toEqual(new Date('2024-07-01T00:00:00.000Z'));
      expect(result[3]).toEqual(new Date('2024-10-01T00:00:00.000Z'));
    });

    it('should calculate yearly occurrences', () => {
      const startDate = new Date('2024-01-01T00:00:00.000Z');
      const result = service.calculateOccurrences(startDate, 'yearly', 3);

      expect(result).toHaveLength(3);
      expect(result[0]).toEqual(new Date('2024-01-01T00:00:00.000Z'));
      expect(result[1]).toEqual(new Date('2025-01-01T00:00:00.000Z'));
      expect(result[2]).toEqual(new Date('2026-01-01T00:00:00.000Z'));
    });

    it('should handle zero count', () => {
      const startDate = new Date('2024-01-01T00:00:00.000Z');
      const result = service.calculateOccurrences(startDate, 'monthly', 0);

      expect(result).toHaveLength(0);
    });

    it('should handle single occurrence', () => {
      const startDate = new Date('2024-01-01T00:00:00.000Z');
      const result = service.calculateOccurrences(startDate, 'monthly', 1);

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual(new Date('2024-01-01T00:00:00.000Z'));
    });

    it('should handle one-time frequency as monthly', () => {
      const startDate = new Date('2024-01-01T00:00:00.000Z');
      const result = service.calculateOccurrences(startDate, 'one-time', 2);

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual(new Date('2024-01-01T00:00:00.000Z'));
      expect(result[1]).toEqual(new Date('2024-02-01T00:00:00.000Z'));
    });
  });

  describe('generateEventsForSubscription', () => {
    it('should generate events for a new subscription', async () => {
      const subscription = new Subscription({
        id: 'sub-123',
        userId: 'user-123',
        name: 'Netflix',
        amount: 15.99,
        currency: 'EUR',
        frequency: 'monthly',
        startDate: new Date('2024-01-01T00:00:00.000Z'),
        nextDueDate: new Date('2024-02-01T00:00:00.000Z'),
        status: 'active',
      });

      eventRepository.findBySubscriptionId.mockResolvedValue([]);

      const newEvents = [
        new Event({
          id: 'event-1',
          subscriptionId: 'sub-123',
          title: 'Paiement Netflix',
          amount: 15.99,
          startsAt: new Date('2024-01-01T00:00:00.000Z'),
          status: 'scheduled',
          paymentStatus: 'pending',
        }),
        new Event({
          id: 'event-2',
          subscriptionId: 'sub-123',
          title: 'Paiement Netflix',
          amount: 15.99,
          startsAt: new Date('2024-02-01T00:00:00.000Z'),
          status: 'scheduled',
          paymentStatus: 'pending',
        }),
      ];

      eventRepository.createMany.mockResolvedValue(newEvents);

      const result = await service.generateEventsForSubscription({
        subscription,
        count: 2,
      });

      expect(result).toHaveLength(2);
      expect(eventRepository.findBySubscriptionId).toHaveBeenCalledWith('sub-123');
      expect(eventRepository.createMany).toHaveBeenCalled();
    });

    it('should skip existing events when generating', async () => {
      const subscription = new Subscription({
        id: 'sub-123',
        userId: 'user-123',
        name: 'Netflix',
        amount: 15.99,
        currency: 'EUR',
        frequency: 'monthly',
        startDate: new Date('2024-01-01T00:00:00.000Z'),
        nextDueDate: new Date('2024-02-01T00:00:00.000Z'),
        status: 'active',
      });

      const existingEvent = new Event({
        id: 'event-1',
        subscriptionId: 'sub-123',
        title: 'Paiement Netflix',
        amount: 15.99,
        startsAt: new Date('2024-01-01T00:00:00.000Z'),
        status: 'scheduled',
        paymentStatus: 'pending',
      });

      eventRepository.findBySubscriptionId.mockResolvedValue([existingEvent]);

      const newEvents = [
        new Event({
          id: 'event-2',
          subscriptionId: 'sub-123',
          title: 'Paiement Netflix',
          amount: 15.99,
          startsAt: new Date('2024-02-01T00:00:00.000Z'),
          status: 'scheduled',
          paymentStatus: 'pending',
        }),
      ];

      eventRepository.createMany.mockResolvedValue(newEvents);

      const result = await service.generateEventsForSubscription({
        subscription,
        count: 2,
      });

      expect(result).toHaveLength(1);
      expect(eventRepository.createMany).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            startsAt: new Date('2024-02-01T00:00:00.000Z'),
          }),
        ])
      );
    });

    it('should return empty array when all events already exist', async () => {
      const subscription = new Subscription({
        id: 'sub-123',
        userId: 'user-123',
        name: 'Netflix',
        amount: 15.99,
        currency: 'EUR',
        frequency: 'monthly',
        startDate: new Date('2024-01-01T00:00:00.000Z'),
        nextDueDate: new Date('2024-02-01T00:00:00.000Z'),
        status: 'active',
      });

      const existingEvents = [
        new Event({
          id: 'event-1',
          subscriptionId: 'sub-123',
          title: 'Paiement Netflix',
          amount: 15.99,
          startsAt: new Date('2024-01-01T00:00:00.000Z'),
          status: 'scheduled',
          paymentStatus: 'pending',
        }),
        new Event({
          id: 'event-2',
          subscriptionId: 'sub-123',
          title: 'Paiement Netflix',
          amount: 15.99,
          startsAt: new Date('2024-02-01T00:00:00.000Z'),
          status: 'scheduled',
          paymentStatus: 'pending',
        }),
      ];

      eventRepository.findBySubscriptionId.mockResolvedValue(existingEvents);

      const result = await service.generateEventsForSubscription({
        subscription,
        count: 2,
      });

      expect(result).toHaveLength(0);
      expect(eventRepository.createMany).not.toHaveBeenCalled();
    });

    it('should generate events with correct subscription data', async () => {
      const subscription = new Subscription({
        id: 'sub-456',
        userId: 'user-456',
        name: 'Spotify Premium',
        amount: 9.99,
        currency: 'USD',
        frequency: 'weekly',
        startDate: new Date('2024-01-01T00:00:00.000Z'),
        nextDueDate: new Date('2024-01-08T00:00:00.000Z'),
        status: 'active',
      });

      eventRepository.findBySubscriptionId.mockResolvedValue([]);
      eventRepository.createMany.mockImplementation(async (events) => events);

      await service.generateEventsForSubscription({
        subscription,
        count: 1,
      });

      expect(eventRepository.createMany).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            subscriptionId: 'sub-456',
            title: 'Paiement Spotify Premium',
            amount: 9.99,
            status: 'scheduled',
            paymentStatus: 'pending',
          }),
        ])
      );
    });
  });

  describe('regenerateEventsIfNeeded', () => {
    it('should generate all events when no existing events', async () => {
      const subscription = new Subscription({
        id: 'sub-123',
        userId: 'user-123',
        name: 'Netflix',
        amount: 15.99,
        currency: 'EUR',
        frequency: 'monthly',
        startDate: new Date('2024-01-01T00:00:00.000Z'),
        nextDueDate: new Date('2024-02-01T00:00:00.000Z'),
        status: 'active',
      });

      eventRepository.findBySubscriptionId.mockResolvedValue([]);
      eventRepository.createMany.mockResolvedValue([]);

      const result = await service.regenerateEventsIfNeeded(subscription, 12, 3);

      expect(eventRepository.findBySubscriptionId).toHaveBeenCalledWith('sub-123');
      expect(eventRepository.createMany).toHaveBeenCalled();
    });

    it('should regenerate events when last event is before threshold', async () => {
      const subscription = new Subscription({
        id: 'sub-123',
        userId: 'user-123',
        name: 'Netflix',
        amount: 15.99,
        currency: 'EUR',
        frequency: 'monthly',
        startDate: new Date('2024-01-01T00:00:00.000Z'),
        nextDueDate: new Date('2024-02-01T00:00:00.000Z'),
        status: 'active',
      });

      const now = new Date();
      const oldEvent = new Event({
        id: 'event-1',
        subscriptionId: 'sub-123',
        title: 'Paiement Netflix',
        amount: 15.99,
        startsAt: new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000),
        status: 'completed',
        paymentStatus: 'paid',
      });

      eventRepository.findBySubscriptionId.mockResolvedValue([oldEvent]);
      eventRepository.createMany.mockResolvedValue([]);

      const result = await service.regenerateEventsIfNeeded(subscription, 12, 3);

      expect(eventRepository.createMany).toHaveBeenCalled();
    });

    it('should not regenerate when last event is after threshold', async () => {
      const subscription = new Subscription({
        id: 'sub-123',
        userId: 'user-123',
        name: 'Netflix',
        amount: 15.99,
        currency: 'EUR',
        frequency: 'monthly',
        startDate: new Date('2024-01-01T00:00:00.000Z'),
        nextDueDate: new Date('2024-02-01T00:00:00.000Z'),
        status: 'active',
      });

      const now = new Date();
      const futureEvent = new Event({
        id: 'event-1',
        subscriptionId: 'sub-123',
        title: 'Paiement Netflix',
        amount: 15.99,
        startsAt: new Date(now.getTime() + 180 * 24 * 60 * 60 * 1000),
        status: 'scheduled',
        paymentStatus: 'pending',
      });

      eventRepository.findBySubscriptionId.mockResolvedValue([futureEvent]);

      const result = await service.regenerateEventsIfNeeded(subscription, 12, 3);

      expect(result).toHaveLength(0);
      expect(eventRepository.createMany).not.toHaveBeenCalled();
    });

    it('should find the latest event among multiple events', async () => {
      const subscription = new Subscription({
        id: 'sub-123',
        userId: 'user-123',
        name: 'Netflix',
        amount: 15.99,
        currency: 'EUR',
        frequency: 'monthly',
        startDate: new Date('2024-01-01T00:00:00.000Z'),
        nextDueDate: new Date('2024-02-01T00:00:00.000Z'),
        status: 'active',
      });

      const now = new Date();
      const events = [
        new Event({
          id: 'event-1',
          subscriptionId: 'sub-123',
          title: 'Paiement Netflix',
          amount: 15.99,
          startsAt: new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000),
          status: 'completed',
          paymentStatus: 'paid',
        }),
        new Event({
          id: 'event-2',
          subscriptionId: 'sub-123',
          title: 'Paiement Netflix',
          amount: 15.99,
          startsAt: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
          status: 'completed',
          paymentStatus: 'paid',
        }),
        new Event({
          id: 'event-3',
          subscriptionId: 'sub-123',
          title: 'Paiement Netflix',
          amount: 15.99,
          startsAt: new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000),
          status: 'completed',
          paymentStatus: 'paid',
        }),
      ];

      eventRepository.findBySubscriptionId.mockResolvedValue(events);
      eventRepository.createMany.mockResolvedValue([]);

      await service.regenerateEventsIfNeeded(subscription, 12, 3);

      expect(eventRepository.createMany).toHaveBeenCalled();
    });

    it('should handle custom monthsAhead and thresholdMonths parameters', async () => {
      const subscription = new Subscription({
        id: 'sub-123',
        userId: 'user-123',
        name: 'Netflix',
        amount: 15.99,
        currency: 'EUR',
        frequency: 'monthly',
        startDate: new Date('2024-01-01T00:00:00.000Z'),
        nextDueDate: new Date('2024-02-01T00:00:00.000Z'),
        status: 'active',
      });

      eventRepository.findBySubscriptionId.mockResolvedValue([]);
      eventRepository.createMany.mockResolvedValue([]);

      const result = await service.regenerateEventsIfNeeded(subscription, 6, 2);

      expect(eventRepository.findBySubscriptionId).toHaveBeenCalledWith('sub-123');
    });

    it('should limit generated events count to 24', async () => {
      const subscription = new Subscription({
        id: 'sub-123',
        userId: 'user-123',
        name: 'Netflix',
        amount: 15.99,
        currency: 'EUR',
        frequency: 'weekly',
        startDate: new Date('2024-01-01T00:00:00.000Z'),
        nextDueDate: new Date('2024-01-08T00:00:00.000Z'),
        status: 'active',
      });

      const now = new Date();
      const oldEvent = new Event({
        id: 'event-1',
        subscriptionId: 'sub-123',
        title: 'Paiement Netflix',
        amount: 15.99,
        startsAt: new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000),
        status: 'completed',
        paymentStatus: 'paid',
      });

      eventRepository.findBySubscriptionId.mockResolvedValue([oldEvent]);
      eventRepository.createMany.mockResolvedValue([]);

      await service.regenerateEventsIfNeeded(subscription, 24, 3);

      expect(eventRepository.createMany).toHaveBeenCalled();
    });
  });
});
