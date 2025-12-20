import { Test, TestingModule } from '@nestjs/testing';
import { CreateSubscriptionUseCase } from './create-subscription.use-case';
import {
  ISubscriptionRepository,
  SUBSCRIPTION_REPOSITORY,
} from '../ports/subscription-repository.interface';
import { Subscription } from '../../domain/subscription.entity';
import { CreateSubscriptionAppDto } from '../dto/create-subscription-app.dto';
import { SubscriptionEventGeneratorService } from '../services/subscription-event-generator.service';

describe('CreateSubscriptionUseCase', () => {
  let useCase: CreateSubscriptionUseCase;
  let repository: jest.Mocked<ISubscriptionRepository>;
  let eventGeneratorService: jest.Mocked<SubscriptionEventGeneratorService>;

  beforeEach(async () => {
    const mockRepository: Partial<jest.Mocked<ISubscriptionRepository>> = {
      create: jest.fn(),
    };

    const mockEventGeneratorService: Partial<jest.Mocked<SubscriptionEventGeneratorService>> = {
      generateEventsForSubscription: jest.fn().mockResolvedValue([]),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CreateSubscriptionUseCase,
        {
          provide: SUBSCRIPTION_REPOSITORY,
          useValue: mockRepository,
        },
        {
          provide: SubscriptionEventGeneratorService,
          useValue: mockEventGeneratorService,
        },
      ],
    }).compile();

    useCase = module.get<CreateSubscriptionUseCase>(CreateSubscriptionUseCase);
    repository = module.get(SUBSCRIPTION_REPOSITORY);
    eventGeneratorService = module.get(SubscriptionEventGeneratorService);
  });

  it('should be defined', () => {
    expect(useCase).toBeDefined();
  });

  it('should create a subscription successfully', async () => {
    const dto: CreateSubscriptionAppDto = {
      userId: 'user-123',
      name: 'Netflix Premium',
      amount: 15.99,
      currency: 'EUR',
      frequency: 'monthly',
      startDate: new Date('2025-01-01'),
      nextDueDate: new Date('2025-02-01'),
      status: 'active',
      notes: 'Monthly subscription',
    };

    const expectedSubscription = new Subscription({
      id: 'subscription-123',
      userId: dto.userId,
      name: dto.name,
      amount: dto.amount,
      currency: dto.currency.toUpperCase(),
      frequency: dto.frequency,
      startDate: dto.startDate,
      nextDueDate: dto.nextDueDate,
      status: dto.status,
      notes: dto.notes,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    repository.create.mockResolvedValue(expectedSubscription);
    eventGeneratorService.generateEventsForSubscription.mockResolvedValue([]);

    const result = await useCase.execute(dto);

    expect(result.subscription).toBe(expectedSubscription);
    expect(result.eventsGenerated).toBe(0);
    expect(repository.create).toHaveBeenCalledTimes(1);
    expect(repository.create).toHaveBeenCalledWith(expect.any(Subscription));
  });

  it('should convert currency to uppercase', async () => {
    const dto: CreateSubscriptionAppDto = {
      userId: 'user-123',
      name: 'Spotify',
      amount: 9.99,
      currency: 'eur',
      frequency: 'monthly',
      startDate: new Date('2025-01-01'),
      nextDueDate: new Date('2025-02-01'),
      status: 'active',
      generateEvents: false,
    };

    const expectedSubscription = new Subscription({
      ...dto,
      currency: 'EUR',
    });

    repository.create.mockResolvedValue(expectedSubscription);

    await useCase.execute(dto);

    const createdSubscription = repository.create.mock.calls[0][0];
    expect(createdSubscription.currency).toBe('EUR');
  });

  it('should throw error when creating subscription with invalid data', async () => {
    const dto: CreateSubscriptionAppDto = {
      userId: 'user-123',
      name: '',
      amount: 15.99,
      currency: 'EUR',
      frequency: 'monthly',
      startDate: new Date('2025-01-01'),
      nextDueDate: new Date('2025-02-01'),
      status: 'active',
    };

    await expect(useCase.execute(dto)).rejects.toThrow('Subscription name cannot be empty');
  });

  it('should throw error when amount is negative', async () => {
    const dto: CreateSubscriptionAppDto = {
      userId: 'user-123',
      name: 'Test Subscription',
      amount: -10,
      currency: 'EUR',
      frequency: 'monthly',
      startDate: new Date('2025-01-01'),
      nextDueDate: new Date('2025-02-01'),
      status: 'active',
    };

    await expect(useCase.execute(dto)).rejects.toThrow('Subscription amount cannot be negative');
  });

  it('should create subscription with valid frequency', async () => {
    const dto: CreateSubscriptionAppDto = {
      userId: 'user-123',
      name: 'Test Subscription',
      amount: 10,
      currency: 'EUR',
      frequency: 'quarterly',
      startDate: new Date('2025-01-01'),
      nextDueDate: new Date('2025-04-01'),
      status: 'active',
      generateEvents: false,
    };

    const expectedSubscription = new Subscription({
      ...dto,
    });

    repository.create.mockResolvedValue(expectedSubscription);

    await useCase.execute(dto);

    const createdSubscription = repository.create.mock.calls[0][0];
    expect(createdSubscription.frequency).toBe('quarterly');
  });
});
