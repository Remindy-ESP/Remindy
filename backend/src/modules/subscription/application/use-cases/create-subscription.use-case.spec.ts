import { Test, TestingModule } from '@nestjs/testing';
import { CreateSubscriptionUseCase } from './create-subscription.use-case';
import { ISubscriptionRepository, SUBSCRIPTION_REPOSITORY } from '../ports/subscription-repository.interface';
import { Subscription } from '../../domain/subscription.entity';
import { CreateSubscriptionAppDto } from '../dto/create-subscription-app.dto';

describe('CreateSubscriptionUseCase', () => {
  let useCase: CreateSubscriptionUseCase;
  let repository: jest.Mocked<ISubscriptionRepository>;

  beforeEach(async () => {
    const mockRepository: Partial<jest.Mocked<ISubscriptionRepository>> = {
      create: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CreateSubscriptionUseCase,
        {
          provide: SUBSCRIPTION_REPOSITORY,
          useValue: mockRepository,
        },
      ],
    }).compile();

    useCase = module.get<CreateSubscriptionUseCase>(CreateSubscriptionUseCase);
    repository = module.get(SUBSCRIPTION_REPOSITORY);
  });

  it('should be defined', () => {
    expect(useCase).toBeDefined();
  });

  it('should create a subscription successfully', async () => {
    const dto: CreateSubscriptionAppDto = {
      userId: 'user-123',
      name: 'Netflix Premium',
      description: 'Monthly subscription',
      amount: 15.99,
      currency: 'EUR',
      periodType: 'month',
      startDate: new Date('2025-01-01'),
      endDate: new Date('2025-12-31'),
      isActive: true,
    };

    const expectedSubscription = new Subscription({
      id: 'subscription-123',
      userId: dto.userId,
      name: dto.name,
      description: dto.description,
      amount: dto.amount,
      currency: dto.currency.toUpperCase(),
      periodType: dto.periodType,
      startDate: dto.startDate,
      endDate: dto.endDate,
      isActive: dto.isActive,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    repository.create.mockResolvedValue(expectedSubscription);

    const result = await useCase.execute(dto);

    expect(result).toBe(expectedSubscription);
    expect(repository.create).toHaveBeenCalledTimes(1);
    expect(repository.create).toHaveBeenCalledWith(expect.any(Subscription));
  });

  it('should convert currency to uppercase', async () => {
    const dto: CreateSubscriptionAppDto = {
      userId: 'user-123',
      name: 'Spotify',
      amount: 9.99,
      currency: 'eur',
      periodType: 'month',
      startDate: new Date('2025-01-01'),
      isActive: true,
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
      periodType: 'month',
      startDate: new Date('2025-01-01'),
      isActive: true,
    };

    await expect(useCase.execute(dto)).rejects.toThrow('Subscription name cannot be empty');
  });

  it('should throw error when amount is negative', async () => {
    const dto: CreateSubscriptionAppDto = {
      userId: 'user-123',
      name: 'Test Subscription',
      amount: -10,
      currency: 'EUR',
      periodType: 'month',
      startDate: new Date('2025-01-01'),
      isActive: true,
    };

    await expect(useCase.execute(dto)).rejects.toThrow('Subscription amount cannot be negative');
  });

  it('should default isActive to true when not provided', async () => {
    const dto: CreateSubscriptionAppDto = {
      userId: 'user-123',
      name: 'Test Subscription',
      amount: 10,
      currency: 'EUR',
      periodType: 'month',
      startDate: new Date('2025-01-01'),
      isActive: undefined as any,
    };

    const expectedSubscription = new Subscription({
      ...dto,
      isActive: true,
    });

    repository.create.mockResolvedValue(expectedSubscription);

    await useCase.execute(dto);

    const createdSubscription = repository.create.mock.calls[0][0];
    expect(createdSubscription.isActive).toBe(true);
  });
});
