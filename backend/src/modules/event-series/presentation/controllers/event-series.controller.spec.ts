import { JwtAuthGuard } from 'src/modules/auth/presentation/guards/jwt-auth.guard';
import { Test, TestingModule } from '@nestjs/testing';
import { ThrottlerGuard } from '@nestjs/throttler';
import { EventSeriesController } from './event-series.controller';
import { CreateEventSeriesUseCase } from '../../application/use-cases/create-event-series.use-case';
import { FindEventSeriesBySubscriptionUseCase } from '../../application/use-cases/find-event-series-by-subscription.use-case';
import { GenerateEventsFromSeriesUseCase } from '../../application/use-cases/generate-events-from-series.use-case';
import { FindSubscriptionUseCase } from 'src/modules/subscription/application/use-cases/find-subscription.use-case';
import { EventSeries } from '../../domain/event-series.entity';
import { CreateEventSeriesDto } from '../dto/create-event-series.dto';
import { Subscription } from 'src/modules/subscription/domain/subscription.entity';

describe('EventSeriesController', () => {
  let controller: EventSeriesController;
  let createEventSeriesUseCase: jest.Mocked<CreateEventSeriesUseCase>;
  let findBySubscriptionUseCase: jest.Mocked<FindEventSeriesBySubscriptionUseCase>;
  let generateEventsUseCase: jest.Mocked<GenerateEventsFromSeriesUseCase>;
  let findSubscriptionUseCase: jest.Mocked<FindSubscriptionUseCase>;

  const mockUser = {
    userId: 'user-123',
    role: 'user_premium',
  };

  const mockRequest = {
    user: mockUser,
  } as any;

  const mockSubscription = {
    id: 'subscription-123',
    userId: 'user-123',
    name: 'Netflix',
  } as unknown as Subscription;

  const mockEventSeries = {
    id: 'series-123',
    subscriptionId: 'subscription-123',
    rrule: 'FREQ=MONTHLY;INTERVAL=1',
    dtstart: new Date('2025-01-01T10:00:00.000Z'),
    timezone: 'Europe/Paris',
    exdates: [],
    rdates: [],
    createdAt: new Date('2025-01-01'),
    updatedAt: new Date('2025-01-01'),
  } as unknown as EventSeries;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [EventSeriesController],
      providers: [
        {
          provide: CreateEventSeriesUseCase,
          useValue: {
            execute: jest.fn(),
          },
        },
        {
          provide: FindEventSeriesBySubscriptionUseCase,
          useValue: {
            execute: jest.fn(),
          },
        },
        {
          provide: GenerateEventsFromSeriesUseCase,
          useValue: {
            execute: jest.fn(),
          },
        },
        {
          provide: FindSubscriptionUseCase,
          useValue: {
            findById: jest.fn(),
          },
        },
      ],
    })
      .overrideGuard(ThrottlerGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<EventSeriesController>(EventSeriesController);
    createEventSeriesUseCase = module.get(CreateEventSeriesUseCase);
    findBySubscriptionUseCase = module.get(FindEventSeriesBySubscriptionUseCase);
    generateEventsUseCase = module.get(GenerateEventsFromSeriesUseCase);
    findSubscriptionUseCase = module.get(FindSubscriptionUseCase);
  });

  describe('create', () => {
    it('should create a new event series', async () => {
      const createDto: CreateEventSeriesDto = {
        subscriptionId: 'subscription-123',
        rrule: 'FREQ=MONTHLY;INTERVAL=1',
        dtstart: '2025-01-01T10:00:00.000Z',
        timezone: 'Europe/Paris',
      };
      findSubscriptionUseCase.findById.mockResolvedValue(mockSubscription);
      createEventSeriesUseCase.execute.mockResolvedValue(mockEventSeries);

      const result = await controller.create(mockRequest, createDto);

      expect(result).toBeDefined();
      expect(result.id).toBe('series-123');
      expect(findSubscriptionUseCase.findById).toHaveBeenCalledWith('subscription-123');
      expect(createEventSeriesUseCase.execute).toHaveBeenCalledWith(
        expect.objectContaining({
          subscriptionId: 'subscription-123',
          rrule: 'FREQ=MONTHLY;INTERVAL=1',
          dtstart: expect.any(Date),
          timezone: 'Europe/Paris',
        }),
      );
    });

    it('should create event series with optional fields', async () => {
      const createDto: CreateEventSeriesDto = {
        subscriptionId: 'subscription-123',
        rrule: 'FREQ=WEEKLY',
        dtstart: '2025-01-01T10:00:00.000Z',
        exdates: ['2025-02-01T10:00:00.000Z'],
        rdates: ['2025-03-01T10:00:00.000Z'],
      };
      findSubscriptionUseCase.findById.mockResolvedValue(mockSubscription);
      createEventSeriesUseCase.execute.mockResolvedValue(mockEventSeries);

      const result = await controller.create(mockRequest, createDto);

      expect(result).toBeDefined();
      expect(createEventSeriesUseCase.execute).toHaveBeenCalledWith(
        expect.objectContaining({
          subscriptionId: 'subscription-123',
          exdates: expect.any(Array),
          rdates: expect.any(Array),
        }),
      );
    });

    it('should throw NotFoundException when subscription belongs to another user', async () => {
      const createDto: CreateEventSeriesDto = {
        subscriptionId: 'subscription-123',
        rrule: 'FREQ=MONTHLY;INTERVAL=1',
        dtstart: '2025-01-01T10:00:00.000Z',
      };
      const otherUserSubscription = {
        ...mockSubscription,
        userId: 'other-user-456',
      } as unknown as Subscription;
      findSubscriptionUseCase.findById.mockResolvedValue(otherUserSubscription);

      await expect(controller.create(mockRequest, createDto)).rejects.toThrow();
    });
  });

  describe('findBySubscription', () => {
    it('should find event series by subscription id', async () => {
      findSubscriptionUseCase.findById.mockResolvedValue(mockSubscription);
      findBySubscriptionUseCase.execute.mockResolvedValue(mockEventSeries);

      const result = await controller.findBySubscription(mockRequest, 'subscription-123');

      expect(result).toBeDefined();
      expect(result.subscriptionId).toBe('subscription-123');
      expect(findSubscriptionUseCase.findById).toHaveBeenCalledWith('subscription-123');
      expect(findBySubscriptionUseCase.execute).toHaveBeenCalledWith('subscription-123');
    });

    it('should throw NotFoundException when subscription belongs to another user', async () => {
      const otherUserSubscription = {
        ...mockSubscription,
        userId: 'other-user-456',
      } as unknown as Subscription;
      findSubscriptionUseCase.findById.mockResolvedValue(otherUserSubscription);

      await expect(
        controller.findBySubscription(mockRequest, 'subscription-123'),
      ).rejects.toThrow();
    });
  });

  describe('generateEvents', () => {
    it('should generate events with default parameters', async () => {
      const mockGeneratedEvents = [
        {
          subscriptionId: 'subscription-123',
          eventSeriesId: 'series-123',
          startsAt: new Date('2025-01-01'),
        },
        {
          subscriptionId: 'subscription-123',
          eventSeriesId: 'series-123',
          startsAt: new Date('2025-02-01'),
        },
      ];
      generateEventsUseCase.execute.mockResolvedValue(mockGeneratedEvents);
      findSubscriptionUseCase.findById.mockResolvedValue(mockSubscription);

      const result = await controller.generateEvents(mockRequest, 'series-123');

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(2);
      expect(findSubscriptionUseCase.findById).toHaveBeenCalledWith('subscription-123');
      expect(generateEventsUseCase.execute).toHaveBeenCalledWith(
        'series-123',
        expect.any(Date),
        expect.any(Date),
        365,
      );
    });

    it('should generate events with custom parameters', async () => {
      const mockGeneratedEvents = [
        {
          subscriptionId: 'subscription-123',
          eventSeriesId: 'series-123',
          startsAt: new Date('2025-01-01'),
        },
      ];
      generateEventsUseCase.execute.mockResolvedValue(mockGeneratedEvents);
      findSubscriptionUseCase.findById.mockResolvedValue(mockSubscription);

      const result = await controller.generateEvents(
        mockRequest,
        'series-123',
        '2025-01-01T00:00:00Z',
        '2025-12-31T23:59:59Z',
        12,
      );

      expect(result).toBeDefined();
      expect(generateEventsUseCase.execute).toHaveBeenCalledWith(
        'series-123',
        new Date('2025-01-01T00:00:00Z'),
        new Date('2025-12-31T23:59:59Z'),
        12,
      );
    });

    it('should throw NotFoundException when subscription belongs to another user', async () => {
      const mockGeneratedEvents = [
        {
          subscriptionId: 'subscription-123',
          eventSeriesId: 'series-123',
          startsAt: new Date('2025-01-01'),
        },
      ];
      const otherUserSubscription = {
        ...mockSubscription,
        userId: 'other-user-456',
      } as unknown as Subscription;
      generateEventsUseCase.execute.mockResolvedValue(mockGeneratedEvents);
      findSubscriptionUseCase.findById.mockResolvedValue(otherUserSubscription);

      await expect(controller.generateEvents(mockRequest, 'series-123')).rejects.toThrow();
    });
  });
});
