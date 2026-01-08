import { Test, TestingModule } from '@nestjs/testing';
import { Logger } from '@nestjs/common';
import { EventGenerationService } from './event-generation.service';
import { SUBSCRIPTION_REPOSITORY } from '../../../subscription/application/ports/subscription-repository.interface';
import { EVENT_SERIES_REPOSITORY } from '../../../event-series/application/ports/event-series-repository.interface';
import { GenerateEventsFromSeriesUseCase } from '../../../event-series/application/use-cases/generate-events-from-series.use-case';
import { GenerateEventsForSubscriptionUseCase } from '../use-cases/generate-events-for-subscription.use-case';
import { Subscription } from '../../../subscription/domain/subscription.entity';
import { EventSeries } from '../../../event-series/domain/event-series.entity';
import { Event } from '../../domain/event.entity';

describe('EventGenerationService', () => {
  let service: EventGenerationService;
  let subscriptionRepository: any;
  let eventSeriesRepository: any;
  let generateEventsFromSeriesUseCase: jest.Mocked<GenerateEventsFromSeriesUseCase>;
  let generateEventsForSubscriptionUseCase: jest.Mocked<GenerateEventsForSubscriptionUseCase>;
  let loggerLogSpy: jest.SpyInstance;
  let loggerWarnSpy: jest.SpyInstance;
  let loggerErrorSpy: jest.SpyInstance;

  beforeEach(async () => {
    const mockSubscriptionRepository = {
      findAll: jest.fn(),
      findById: jest.fn(),
    };

    const mockEventSeriesRepository = {
      findBySubscriptionId: jest.fn(),
    };

    const mockGenerateEventsFromSeriesUseCase = {
      execute: jest.fn(),
    };

    const mockGenerateEventsForSubscriptionUseCase = {
      execute: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EventGenerationService,
        {
          provide: SUBSCRIPTION_REPOSITORY,
          useValue: mockSubscriptionRepository,
        },
        {
          provide: EVENT_SERIES_REPOSITORY,
          useValue: mockEventSeriesRepository,
        },
        {
          provide: GenerateEventsFromSeriesUseCase,
          useValue: mockGenerateEventsFromSeriesUseCase,
        },
        {
          provide: GenerateEventsForSubscriptionUseCase,
          useValue: mockGenerateEventsForSubscriptionUseCase,
        },
      ],
    }).compile();

    service = module.get<EventGenerationService>(EventGenerationService);
    subscriptionRepository = module.get(SUBSCRIPTION_REPOSITORY);
    eventSeriesRepository = module.get(EVENT_SERIES_REPOSITORY);
    generateEventsFromSeriesUseCase = module.get(GenerateEventsFromSeriesUseCase);
    generateEventsForSubscriptionUseCase = module.get(GenerateEventsForSubscriptionUseCase);

    // Spy on logger methods
    loggerLogSpy = jest.spyOn(Logger.prototype, 'log').mockImplementation();
    loggerWarnSpy = jest.spyOn(Logger.prototype, 'warn').mockImplementation();
    loggerErrorSpy = jest.spyOn(Logger.prototype, 'error').mockImplementation();
  });

  afterEach(() => {
    loggerLogSpy.mockRestore();
    loggerWarnSpy.mockRestore();
    loggerErrorSpy.mockRestore();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('generateEventsForAllSubscriptions', () => {
    it('should generate events for all active subscriptions', async () => {
      const subscription = new Subscription({
        id: 'sub-123',
        userId: 'user-123',
        name: 'Netflix',
        amount: 15.99,
        currency: 'EUR',
        frequency: 'monthly',
        startDate: new Date('2024-01-01'),
        nextDueDate: new Date('2024-02-01'),
        status: 'active',
      });

      const eventSeries = new EventSeries({
        id: 'series-123',
        subscriptionId: 'sub-123',
        rrule: 'FREQ=MONTHLY;INTERVAL=1',
        dtstart: new Date('2024-01-01'),
        timezone: 'UTC',
      });

      const mockOccurrences = [new Date('2024-01-01'), new Date('2024-02-01')];

      const mockEvents = [
        new Event({
          id: 'event-1',
          subscriptionId: 'sub-123',
          title: 'Netflix Payment',
          amount: 15.99,
          startsAt: mockOccurrences[0],
          status: 'scheduled',
        }),
        new Event({
          id: 'event-2',
          subscriptionId: 'sub-123',
          title: 'Netflix Payment',
          amount: 15.99,
          startsAt: mockOccurrences[1],
          status: 'scheduled',
        }),
      ];

      subscriptionRepository.findAll.mockResolvedValue([subscription]);
      eventSeriesRepository.findBySubscriptionId.mockResolvedValue(eventSeries);
      generateEventsFromSeriesUseCase.execute.mockResolvedValue(mockOccurrences);
      generateEventsForSubscriptionUseCase.execute.mockResolvedValue(mockEvents);

      await service.generateEventsForAllSubscriptions();

      expect(subscriptionRepository.findAll).toHaveBeenCalledWith({ status: 'active' });
      expect(eventSeriesRepository.findBySubscriptionId).toHaveBeenCalledWith('sub-123');
      expect(generateEventsFromSeriesUseCase.execute).toHaveBeenCalled();
      expect(generateEventsForSubscriptionUseCase.execute).toHaveBeenCalledWith({
        subscriptionId: 'sub-123',
        subscriptionName: 'Netflix',
        subscriptionAmount: 15.99,
        eventSeriesId: 'series-123',
        occurrences: mockOccurrences,
      });
      expect(loggerLogSpy).toHaveBeenCalledWith(expect.stringContaining('Starting automatic event generation job'));
      expect(loggerLogSpy).toHaveBeenCalledWith(expect.stringContaining('Found 1 active subscriptions'));
      expect(loggerLogSpy).toHaveBeenCalledWith(expect.stringContaining('Generated 2 events'));
      expect(loggerLogSpy).toHaveBeenCalledWith(expect.stringContaining('Total events generated: 2'));
    });

    it('should handle subscriptions without event series', async () => {
      const subscription = new Subscription({
        id: 'sub-123',
        userId: 'user-123',
        name: 'Netflix',
        amount: 15.99,
        currency: 'EUR',
        frequency: 'monthly',
        startDate: new Date('2024-01-01'),
        nextDueDate: new Date('2024-02-01'),
        status: 'active',
      });

      subscriptionRepository.findAll.mockResolvedValue([subscription]);
      eventSeriesRepository.findBySubscriptionId.mockResolvedValue(null);

      await service.generateEventsForAllSubscriptions();

      expect(loggerWarnSpy).toHaveBeenCalledWith(expect.stringContaining('No event series found'));
      expect(generateEventsFromSeriesUseCase.execute).not.toHaveBeenCalled();
      expect(generateEventsForSubscriptionUseCase.execute).not.toHaveBeenCalled();
    });

    it('should handle empty subscriptions list', async () => {
      subscriptionRepository.findAll.mockResolvedValue([]);

      await service.generateEventsForAllSubscriptions();

      expect(loggerLogSpy).toHaveBeenCalledWith(expect.stringContaining('Found 0 active subscriptions'));
      expect(eventSeriesRepository.findBySubscriptionId).not.toHaveBeenCalled();
    });

    it('should continue processing other subscriptions when one fails', async () => {
      const subscription1 = new Subscription({
        id: 'sub-1',
        userId: 'user-123',
        name: 'Netflix',
        amount: 15.99,
        currency: 'EUR',
        frequency: 'monthly',
        startDate: new Date('2024-01-01'),
        nextDueDate: new Date('2024-02-01'),
        status: 'active',
      });

      const subscription2 = new Subscription({
        id: 'sub-2',
        userId: 'user-123',
        name: 'Spotify',
        amount: 9.99,
        currency: 'EUR',
        frequency: 'monthly',
        startDate: new Date('2024-01-01'),
        nextDueDate: new Date('2024-02-01'),
        status: 'active',
      });

      const eventSeries = new EventSeries({
        id: 'series-2',
        subscriptionId: 'sub-2',
        rrule: 'FREQ=MONTHLY;INTERVAL=1',
        dtstart: new Date('2024-01-01'),
        timezone: 'UTC',
      });

      subscriptionRepository.findAll.mockResolvedValue([subscription1, subscription2]);
      eventSeriesRepository.findBySubscriptionId
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(eventSeries);
      generateEventsFromSeriesUseCase.execute.mockResolvedValue([new Date()]);
      generateEventsForSubscriptionUseCase.execute.mockResolvedValue([]);

      await service.generateEventsForAllSubscriptions();

      expect(eventSeriesRepository.findBySubscriptionId).toHaveBeenCalledTimes(2);
      expect(loggerWarnSpy).toHaveBeenCalledWith(expect.stringContaining('No event series found for subscription sub-1'));
    });

    it('should handle errors during event generation for individual subscription', async () => {
      const subscription = new Subscription({
        id: 'sub-123',
        userId: 'user-123',
        name: 'Netflix',
        amount: 15.99,
        currency: 'EUR',
        frequency: 'monthly',
        startDate: new Date('2024-01-01'),
        nextDueDate: new Date('2024-02-01'),
        status: 'active',
      });

      const eventSeries = new EventSeries({
        id: 'series-123',
        subscriptionId: 'sub-123',
        rrule: 'FREQ=MONTHLY;INTERVAL=1',
        dtstart: new Date('2024-01-01'),
        timezone: 'UTC',
      });

      subscriptionRepository.findAll.mockResolvedValue([subscription]);
      eventSeriesRepository.findBySubscriptionId.mockResolvedValue(eventSeries);
      generateEventsFromSeriesUseCase.execute.mockRejectedValue(new Error('Generation failed'));

      await service.generateEventsForAllSubscriptions();

      expect(loggerErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('Error generating events for subscription sub-123'),
      );
    });

    it('should handle top-level errors gracefully', async () => {
      subscriptionRepository.findAll.mockRejectedValue(new Error('Database error'));

      await service.generateEventsForAllSubscriptions();

      expect(loggerErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('Event generation job failed'),
        expect.any(String),
      );
    });

    it('should not log event generation when 0 events generated', async () => {
      const subscription = new Subscription({
        id: 'sub-123',
        userId: 'user-123',
        name: 'Netflix',
        amount: 15.99,
        currency: 'EUR',
        frequency: 'monthly',
        startDate: new Date('2024-01-01'),
        nextDueDate: new Date('2024-02-01'),
        status: 'active',
      });

      const eventSeries = new EventSeries({
        id: 'series-123',
        subscriptionId: 'sub-123',
        rrule: 'FREQ=MONTHLY;INTERVAL=1',
        dtstart: new Date('2024-01-01'),
        timezone: 'UTC',
      });

      subscriptionRepository.findAll.mockResolvedValue([subscription]);
      eventSeriesRepository.findBySubscriptionId.mockResolvedValue(eventSeries);
      generateEventsFromSeriesUseCase.execute.mockResolvedValue([]);
      generateEventsForSubscriptionUseCase.execute.mockResolvedValue([]);

      await service.generateEventsForAllSubscriptions();

      expect(loggerLogSpy).toHaveBeenCalledWith(expect.stringContaining('Total events generated: 0'));
      expect(loggerLogSpy).not.toHaveBeenCalledWith(expect.stringContaining('Generated 0 events for subscription'));
    });
  });

  describe('generateEventsForSubscription', () => {
    it('should generate events for a specific subscription', async () => {
      const subscription = new Subscription({
        id: 'sub-123',
        userId: 'user-123',
        name: 'Netflix',
        amount: 15.99,
        currency: 'EUR',
        frequency: 'monthly',
        startDate: new Date('2024-01-01'),
        nextDueDate: new Date('2024-02-01'),
        status: 'active',
      });

      const eventSeries = new EventSeries({
        id: 'series-123',
        subscriptionId: 'sub-123',
        rrule: 'FREQ=MONTHLY;INTERVAL=1',
        dtstart: new Date('2024-01-01'),
        timezone: 'UTC',
      });

      const mockOccurrences = [new Date('2024-01-01'), new Date('2024-02-01')];

      const mockEvents = [
        new Event({
          id: 'event-1',
          subscriptionId: 'sub-123',
          title: 'Netflix Payment',
          amount: 15.99,
          startsAt: mockOccurrences[0],
          status: 'scheduled',
        }),
        new Event({
          id: 'event-2',
          subscriptionId: 'sub-123',
          title: 'Netflix Payment',
          amount: 15.99,
          startsAt: mockOccurrences[1],
          status: 'scheduled',
        }),
      ];

      subscriptionRepository.findById.mockResolvedValue(subscription);
      eventSeriesRepository.findBySubscriptionId.mockResolvedValue(eventSeries);
      generateEventsFromSeriesUseCase.execute.mockResolvedValue(mockOccurrences);
      generateEventsForSubscriptionUseCase.execute.mockResolvedValue(mockEvents);

      const result = await service.generateEventsForSubscription('sub-123');

      expect(result).toBe(2);
      expect(subscriptionRepository.findById).toHaveBeenCalledWith('sub-123');
      expect(eventSeriesRepository.findBySubscriptionId).toHaveBeenCalledWith('sub-123');
      expect(generateEventsFromSeriesUseCase.execute).toHaveBeenCalledWith(
        'series-123',
        expect.any(Date),
        expect.any(Date),
        365,
      );
      expect(generateEventsForSubscriptionUseCase.execute).toHaveBeenCalledWith({
        subscriptionId: 'sub-123',
        subscriptionName: 'Netflix',
        subscriptionAmount: 15.99,
        eventSeriesId: 'series-123',
        occurrences: mockOccurrences,
      });
      expect(loggerLogSpy).toHaveBeenCalledWith(expect.stringContaining('Generating events for subscription sub-123'));
      expect(loggerLogSpy).toHaveBeenCalledWith(expect.stringContaining('Generated 2 events for subscription "Netflix"'));
    });

    it('should throw error when subscription not found', async () => {
      subscriptionRepository.findById.mockResolvedValue(null);

      await expect(service.generateEventsForSubscription('non-existent')).rejects.toThrow(
        'Subscription non-existent not found',
      );

      expect(subscriptionRepository.findById).toHaveBeenCalledWith('non-existent');
      expect(eventSeriesRepository.findBySubscriptionId).not.toHaveBeenCalled();
    });

    it('should throw error when event series not found', async () => {
      const subscription = new Subscription({
        id: 'sub-123',
        userId: 'user-123',
        name: 'Netflix',
        amount: 15.99,
        currency: 'EUR',
        frequency: 'monthly',
        startDate: new Date('2024-01-01'),
        nextDueDate: new Date('2024-02-01'),
        status: 'active',
      });

      subscriptionRepository.findById.mockResolvedValue(subscription);
      eventSeriesRepository.findBySubscriptionId.mockResolvedValue(null);

      await expect(service.generateEventsForSubscription('sub-123')).rejects.toThrow(
        'No event series found for subscription sub-123',
      );

      expect(eventSeriesRepository.findBySubscriptionId).toHaveBeenCalledWith('sub-123');
      expect(generateEventsFromSeriesUseCase.execute).not.toHaveBeenCalled();
    });

    it('should generate 0 events when no occurrences found', async () => {
      const subscription = new Subscription({
        id: 'sub-123',
        userId: 'user-123',
        name: 'Netflix',
        amount: 15.99,
        currency: 'EUR',
        frequency: 'monthly',
        startDate: new Date('2024-01-01'),
        nextDueDate: new Date('2024-02-01'),
        status: 'active',
      });

      const eventSeries = new EventSeries({
        id: 'series-123',
        subscriptionId: 'sub-123',
        rrule: 'FREQ=MONTHLY;INTERVAL=1',
        dtstart: new Date('2024-01-01'),
        timezone: 'UTC',
      });

      subscriptionRepository.findById.mockResolvedValue(subscription);
      eventSeriesRepository.findBySubscriptionId.mockResolvedValue(eventSeries);
      generateEventsFromSeriesUseCase.execute.mockResolvedValue([]);
      generateEventsForSubscriptionUseCase.execute.mockResolvedValue([]);

      const result = await service.generateEventsForSubscription('sub-123');

      expect(result).toBe(0);
      expect(loggerLogSpy).toHaveBeenCalledWith(expect.stringContaining('Generated 0 events'));
    });
  });
});
