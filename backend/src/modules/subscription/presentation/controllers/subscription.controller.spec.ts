import { Test, TestingModule } from '@nestjs/testing';
import { ThrottlerGuard } from '@nestjs/throttler';
import { SubscriptionController } from './subscription.controller';
import { CreateSubscriptionUseCase } from '../../application/use-cases/create-subscription.use-case';
import { UpdateSubscriptionUseCase } from '../../application/use-cases/update-subscription.use-case';
import { DeleteSubscriptionUseCase } from '../../application/use-cases/delete-subscription.use-case';
import { FindSubscriptionUseCase } from '../../application/use-cases/find-subscription.use-case';
import { FindAllSubscriptionsUseCase } from '../../application/use-cases/find-all-subscriptions.use-case';
import { FindSubscriptionsByPeriodUseCase } from '../../application/use-cases/find-subscriptions-by-period.use-case';
import { PauseSubscriptionUseCase } from '../../application/use-cases/pause-subscription.use-case';
import { ResumeSubscriptionUseCase } from '../../application/use-cases/resume-subscription.use-case';
import { FindSubscriptionEventsUseCase } from '../../application/use-cases/find-subscription-events.use-case';
import { Subscription } from '../../domain/subscription.entity';
import { CreateSubscriptionDto } from '../dto/create-subscription.dto';
import { UpdateSubscriptionDto } from '../dto/update-subscription.dto';
import { SubscriptionFilterDto } from '../dto/subscription-filter.dto';

describe('SubscriptionController', () => {
  let controller: SubscriptionController;
  let createSubscriptionUseCase: jest.Mocked<CreateSubscriptionUseCase>;
  let updateSubscriptionUseCase: jest.Mocked<UpdateSubscriptionUseCase>;
  let deleteSubscriptionUseCase: jest.Mocked<DeleteSubscriptionUseCase>;
  let findSubscriptionUseCase: jest.Mocked<FindSubscriptionUseCase>;
  let findAllSubscriptionsUseCase: jest.Mocked<FindAllSubscriptionsUseCase>;
  let findSubscriptionsByPeriodUseCase: jest.Mocked<FindSubscriptionsByPeriodUseCase>;
  let pauseSubscriptionUseCase: jest.Mocked<PauseSubscriptionUseCase>;
  let resumeSubscriptionUseCase: jest.Mocked<ResumeSubscriptionUseCase>;
  let findSubscriptionEventsUseCase: jest.Mocked<FindSubscriptionEventsUseCase>;

  const mockUserId = '123e4567-e89b-12d3-a456-426614174000';
  const mockRequest = {
    user: { userId: mockUserId, role: 'user_freemium' },
  } as any;

  const mockSubscription = {
    id: 'subscription-123',
    userId: mockUserId,
    contractId: 1,
    name: 'Netflix Premium',
    amount: 15.99,
    currency: 'EUR',
    frequency: 'monthly',
    startDate: new Date('2025-01-01'),
    nextDueDate: new Date('2025-02-01'),
    trialStartDate: null,
    trialEndDate: null,
    status: 'active',
    color: '#FF0000',
    notes: 'Premium subscription',
    createdAt: new Date('2025-01-01'),
    updatedAt: new Date('2025-01-01'),
    isTrialActive: false,
  } as unknown as Subscription;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SubscriptionController],
      providers: [
        {
          provide: CreateSubscriptionUseCase,
          useValue: { execute: jest.fn() },
        },
        {
          provide: UpdateSubscriptionUseCase,
          useValue: { execute: jest.fn() },
        },
        {
          provide: DeleteSubscriptionUseCase,
          useValue: { execute: jest.fn() },
        },
        {
          provide: FindSubscriptionUseCase,
          useValue: { findById: jest.fn() },
        },
        {
          provide: FindAllSubscriptionsUseCase,
          useValue: { execute: jest.fn() },
        },
        {
          provide: FindSubscriptionsByPeriodUseCase,
          useValue: { execute: jest.fn() },
        },
        {
          provide: PauseSubscriptionUseCase,
          useValue: { execute: jest.fn() },
        },
        {
          provide: ResumeSubscriptionUseCase,
          useValue: { execute: jest.fn() },
        },
        {
          provide: FindSubscriptionEventsUseCase,
          useValue: { execute: jest.fn() },
        },
      ],
    })
      .overrideGuard(ThrottlerGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<SubscriptionController>(SubscriptionController);
    createSubscriptionUseCase = module.get(CreateSubscriptionUseCase);
    updateSubscriptionUseCase = module.get(UpdateSubscriptionUseCase);
    deleteSubscriptionUseCase = module.get(DeleteSubscriptionUseCase);
    findSubscriptionUseCase = module.get(FindSubscriptionUseCase);
    findAllSubscriptionsUseCase = module.get(FindAllSubscriptionsUseCase);
    findSubscriptionsByPeriodUseCase = module.get(FindSubscriptionsByPeriodUseCase);
    pauseSubscriptionUseCase = module.get(PauseSubscriptionUseCase);
    resumeSubscriptionUseCase = module.get(ResumeSubscriptionUseCase);
    findSubscriptionEventsUseCase = module.get(FindSubscriptionEventsUseCase);
  });

  describe('create', () => {
    it('should create a new subscription', async () => {
      const createDto: CreateSubscriptionDto = {
        contractId: 1,
        name: 'Netflix Premium',
        amount: 15.99,
        currency: 'EUR',
        frequency: 'monthly',
        startDate: '2025-01-01',
        status: 'active',
      };
      createSubscriptionUseCase.execute.mockResolvedValue(mockSubscription);

      const result = await controller.create(mockRequest, createDto);

      expect(result).toBeDefined();
      expect(result.id).toBe('subscription-123');
      expect(createSubscriptionUseCase.execute).toHaveBeenCalled();
    });
  });

  describe('findAll', () => {
    it('should return an array of subscriptions', async () => {
      const filters: SubscriptionFilterDto = {};
      findAllSubscriptionsUseCase.execute.mockResolvedValue([mockSubscription]);

      const result = await controller.findAll(filters);

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      expect(findAllSubscriptionsUseCase.execute).toHaveBeenCalled();
    });

    it('should pass filters to use case', async () => {
      const filters: SubscriptionFilterDto = {
        userId: 'user-123',
        frequency: 'monthly',
        status: 'active',
      };
      findAllSubscriptionsUseCase.execute.mockResolvedValue([mockSubscription]);

      await controller.findAll(filters);

      expect(findAllSubscriptionsUseCase.execute).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'user-123',
          frequency: 'monthly',
          status: 'active',
        }),
      );
    });
  });

  describe('findByFrequency', () => {
    it('should return subscriptions by frequency', async () => {
      findSubscriptionsByPeriodUseCase.execute.mockResolvedValue([mockSubscription]);

      const result = await controller.findByFrequency('monthly');

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      expect(findSubscriptionsByPeriodUseCase.execute).toHaveBeenCalledWith('monthly');
    });
  });

  describe('findById', () => {
    it('should return a single subscription', async () => {
      findSubscriptionUseCase.findById.mockResolvedValue(mockSubscription);

      const result = await controller.findById('subscription-123');

      expect(result).toBeDefined();
      expect(result.id).toBe('subscription-123');
      expect(findSubscriptionUseCase.findById).toHaveBeenCalledWith('subscription-123');
    });
  });

  describe('update', () => {
    it('should update a subscription', async () => {
      const updateDto: UpdateSubscriptionDto = {
        name: 'Netflix Standard',
        amount: 12.99,
      };
      const updatedSubscription = {
        ...mockSubscription,
        name: 'Netflix Standard',
        amount: 12.99,
        updatedAt: new Date('2025-01-02'),
      } as unknown as Subscription;
      updateSubscriptionUseCase.execute.mockResolvedValue(updatedSubscription);

      const result = await controller.update('subscription-123', updateDto);

      expect(result).toBeDefined();
      expect(result.name).toBe('Netflix Standard');
      expect(result.amount).toBe(12.99);
      expect(updateSubscriptionUseCase.execute).toHaveBeenCalledWith(
        'subscription-123',
        expect.objectContaining({
          name: 'Netflix Standard',
          amount: 12.99,
        }),
      );
    });
  });

  describe('delete', () => {
    it('should delete a subscription', async () => {
      deleteSubscriptionUseCase.execute.mockResolvedValue(undefined);

      await controller.delete('subscription-123');

      expect(deleteSubscriptionUseCase.execute).toHaveBeenCalledWith('subscription-123');
    });
  });

  describe('pause', () => {
    it('should pause a subscription', async () => {
      const pausedSubscription = {
        ...mockSubscription,
        status: 'paused',
        updatedAt: new Date('2025-01-02'),
      } as unknown as Subscription;
      pauseSubscriptionUseCase.execute.mockResolvedValue(pausedSubscription);

      const result = await controller.pause('subscription-123');

      expect(result).toBeDefined();
      expect(result.status).toBe('paused');
      expect(pauseSubscriptionUseCase.execute).toHaveBeenCalledWith('subscription-123');
    });
  });

  describe('resume', () => {
    it('should resume a subscription', async () => {
      resumeSubscriptionUseCase.execute.mockResolvedValue(mockSubscription);

      const result = await controller.resume('subscription-123');

      expect(result).toBeDefined();
      expect(result.status).toBe('active');
      expect(resumeSubscriptionUseCase.execute).toHaveBeenCalledWith('subscription-123');
    });
  });

  describe('getEvents', () => {
    it('should return subscription events', async () => {
      const mockEvents = [
        {
          id: 'event-123',
          subscriptionId: 'subscription-123',
          title: 'Netflix Payment',
          amount: 15.99,
          startsAt: new Date('2025-02-01'),
          status: 'scheduled',
          createdAt: new Date('2025-01-01'),
          updatedAt: new Date('2025-01-01'),
        },
      ];
      findSubscriptionEventsUseCase.execute.mockResolvedValue(mockEvents as any);

      const result = await controller.getEvents('subscription-123');

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      expect(findSubscriptionEventsUseCase.execute).toHaveBeenCalledWith('subscription-123');
    });
  });
});
