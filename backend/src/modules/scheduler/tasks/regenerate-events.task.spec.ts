import { Test, TestingModule } from '@nestjs/testing';
import { Logger } from '@nestjs/common';
import { RegenerateEventsTask } from './regenerate-events.task';
import { SubscriptionEventGeneratorService } from '../../subscription/application/services/subscription-event-generator.service';
import { SUBSCRIPTION_REPOSITORY } from '../../subscription/application/ports/subscription-repository.interface';
import { Subscription } from '../../subscription/domain/subscription.entity';

describe('RegenerateEventsTask', () => {
  let task: RegenerateEventsTask;
  let eventGeneratorService: jest.Mocked<SubscriptionEventGeneratorService>;
  let subscriptionRepository: any;
  let loggerSpy: jest.SpyInstance;

  const mockSubscription: Partial<Subscription> = {
    id: 'sub-123',
    userId: 'user-123',
    name: 'Netflix',
    amount: 15.99,
    currency: 'EUR',
    frequency: 'monthly',
    status: 'active',
    startDate: new Date('2025-01-01'),
    nextDueDate: new Date('2025-02-01'),
  };

  const mockEvent = {
    id: 'event-123',
    subscriptionId: 'sub-123',
    title: 'Netflix Payment',
    amount: 15.99,
    startsAt: new Date('2025-02-01'),
    status: 'scheduled',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RegenerateEventsTask,
        {
          provide: SubscriptionEventGeneratorService,
          useValue: {
            regenerateEventsIfNeeded: jest.fn(),
          },
        },
        {
          provide: SUBSCRIPTION_REPOSITORY,
          useValue: {
            findAll: jest.fn(),
          },
        },
      ],
    }).compile();

    task = module.get<RegenerateEventsTask>(RegenerateEventsTask);
    eventGeneratorService = module.get(SubscriptionEventGeneratorService);
    subscriptionRepository = module.get(SUBSCRIPTION_REPOSITORY);

    loggerSpy = jest.spyOn(Logger.prototype, 'log').mockImplementation();
    jest.spyOn(Logger.prototype, 'error').mockImplementation();
  });

  afterEach(() => {
    jest.clearAllMocks();
    loggerSpy.mockRestore();
  });

  describe('handleCron', () => {
    it('should process active subscriptions and generate events', async () => {
      subscriptionRepository.findAll.mockResolvedValue([
        mockSubscription,
        { ...mockSubscription, id: 'sub-456', name: 'Spotify' },
      ]);
      eventGeneratorService.regenerateEventsIfNeeded.mockResolvedValue([mockEvent, mockEvent]);

      await task.handleCron();

      expect(subscriptionRepository.findAll).toHaveBeenCalledWith({
        status: 'active',
      });
      expect(eventGeneratorService.regenerateEventsIfNeeded).toHaveBeenCalledTimes(2);
      expect(eventGeneratorService.regenerateEventsIfNeeded).toHaveBeenCalledWith(
        mockSubscription,
        12,
        3,
      );
      expect(loggerSpy).toHaveBeenCalledWith('Starting event regeneration task...');
      expect(loggerSpy).toHaveBeenCalledWith('Found 2 active subscriptions');
      expect(loggerSpy).toHaveBeenCalledWith(expect.stringContaining('Total events generated: 4'));
    });

    it('should handle empty subscription list', async () => {
      subscriptionRepository.findAll.mockResolvedValue([]);
      eventGeneratorService.regenerateEventsIfNeeded.mockResolvedValue([]);

      await task.handleCron();

      expect(subscriptionRepository.findAll).toHaveBeenCalledWith({
        status: 'active',
      });
      expect(eventGeneratorService.regenerateEventsIfNeeded).not.toHaveBeenCalled();
      expect(loggerSpy).toHaveBeenCalledWith('Found 0 active subscriptions');
      expect(loggerSpy).toHaveBeenCalledWith(expect.stringContaining('Total events generated: 0'));
    });

    it('should continue processing when one subscription fails', async () => {
      subscriptionRepository.findAll.mockResolvedValue([
        mockSubscription,
        { ...mockSubscription, id: 'sub-456', name: 'Spotify' },
      ]);
      eventGeneratorService.regenerateEventsIfNeeded
        .mockRejectedValueOnce(new Error('Failed to generate events'))
        .mockResolvedValueOnce([mockEvent]);

      await task.handleCron();

      expect(eventGeneratorService.regenerateEventsIfNeeded).toHaveBeenCalledTimes(2);
      expect(Logger.prototype.error).toHaveBeenCalledWith(
        expect.stringContaining('Failed to regenerate events for subscription'),
      );
      expect(loggerSpy).toHaveBeenCalledWith(expect.stringContaining('Total events generated: 1'));
    });

    it('should handle repository errors gracefully', async () => {
      subscriptionRepository.findAll.mockRejectedValue(new Error('Database error'));

      await task.handleCron();

      expect(Logger.prototype.error).toHaveBeenCalledWith(
        expect.stringContaining('Event regeneration task failed'),
      );
      expect(eventGeneratorService.regenerateEventsIfNeeded).not.toHaveBeenCalled();
    });

    it('should not log individual subscription when no events generated', async () => {
      subscriptionRepository.findAll.mockResolvedValue([mockSubscription]);
      eventGeneratorService.regenerateEventsIfNeeded.mockResolvedValue([]);

      await task.handleCron();

      expect(loggerSpy).toHaveBeenCalledWith('Starting event regeneration task...');
      expect(loggerSpy).toHaveBeenCalledWith('Found 1 active subscriptions');
      expect(loggerSpy).toHaveBeenCalledWith(expect.stringContaining('Total events generated: 0'));
      expect(loggerSpy).not.toHaveBeenCalledWith(expect.stringContaining('Generated 0 events'));
    });

    it('should log when events are generated for subscription', async () => {
      subscriptionRepository.findAll.mockResolvedValue([mockSubscription]);
      eventGeneratorService.regenerateEventsIfNeeded.mockResolvedValue([mockEvent, mockEvent]);

      await task.handleCron();

      expect(loggerSpy).toHaveBeenCalledWith(
        expect.stringContaining(`Generated 2 events for subscription ${mockSubscription.id}`),
      );
    });
  });

  describe('triggerManually', () => {
    it('should manually trigger event regeneration and return stats', async () => {
      subscriptionRepository.findAll.mockResolvedValue([
        mockSubscription,
        { ...mockSubscription, id: 'sub-456', name: 'Spotify' },
      ]);
      eventGeneratorService.regenerateEventsIfNeeded.mockResolvedValue([mockEvent, mockEvent]);

      const result = await task.triggerManually();

      expect(result).toEqual({
        subscriptionsProcessed: 2,
        eventsGenerated: 4,
      });
      expect(subscriptionRepository.findAll).toHaveBeenCalledWith({
        status: 'active',
      });
      expect(eventGeneratorService.regenerateEventsIfNeeded).toHaveBeenCalledTimes(2);
      expect(loggerSpy).toHaveBeenCalledWith('Manually triggering event regeneration...');
    });

    it('should return zero stats when no subscriptions exist', async () => {
      subscriptionRepository.findAll.mockResolvedValue([]);

      const result = await task.triggerManually();

      expect(result).toEqual({
        subscriptionsProcessed: 0,
        eventsGenerated: 0,
      });
      expect(eventGeneratorService.regenerateEventsIfNeeded).not.toHaveBeenCalled();
    });

    it('should continue processing and count successful events when one fails', async () => {
      subscriptionRepository.findAll.mockResolvedValue([
        mockSubscription,
        { ...mockSubscription, id: 'sub-456', name: 'Spotify' },
        { ...mockSubscription, id: 'sub-789', name: 'Disney+' },
      ]);
      eventGeneratorService.regenerateEventsIfNeeded
        .mockResolvedValueOnce([mockEvent])
        .mockRejectedValueOnce(new Error('Failed'))
        .mockResolvedValueOnce([mockEvent, mockEvent]);

      const result = await task.triggerManually();

      expect(result).toEqual({
        subscriptionsProcessed: 3,
        eventsGenerated: 3,
      });
      expect(Logger.prototype.error).toHaveBeenCalledWith(
        expect.stringContaining('Failed to regenerate events for subscription'),
      );
    });

    it('should use correct parameters for regeneration', async () => {
      subscriptionRepository.findAll.mockResolvedValue([mockSubscription]);
      eventGeneratorService.regenerateEventsIfNeeded.mockResolvedValue([]);

      await task.triggerManually();

      expect(eventGeneratorService.regenerateEventsIfNeeded).toHaveBeenCalledWith(
        mockSubscription,
        12,
        3,
      );
    });
  });
});
