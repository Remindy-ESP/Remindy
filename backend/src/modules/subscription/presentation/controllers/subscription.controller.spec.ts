import { Test, TestingModule } from '@nestjs/testing';
import { ThrottlerGuard } from '@nestjs/throttler';
import { JwtAuthGuard } from 'src/modules/auth/presentation/guards/jwt-auth.guard';
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
            .overrideGuard(JwtAuthGuard)
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
            const createResult = {
                subscription: mockSubscription,
                eventsGenerated: 12,
            };
            createSubscriptionUseCase.execute.mockResolvedValue(createResult);

            const result = await controller.create(mockRequest, createDto);

            expect(result).toBeDefined();
            expect(result.id).toBe('subscription-123');
            expect(result.eventsGenerated).toBe(12);
            expect(createSubscriptionUseCase.execute).toHaveBeenCalled();
        });
    });

    describe('findAll', () => {
        it('should return an array of subscriptions', async () => {
            const filters: SubscriptionFilterDto = {};
            findAllSubscriptionsUseCase.execute.mockResolvedValue([mockSubscription]);

            const result = await controller.findAll(mockRequest, filters);

            expect(result).toBeDefined();
            expect(Array.isArray(result)).toBe(true);
            expect(findAllSubscriptionsUseCase.execute).toHaveBeenCalledWith(
                expect.objectContaining({
                    userId: 'user-123',
                }),
            );
        });

        it('should pass filters to use case', async () => {
            const filters: SubscriptionFilterDto = {
                frequency: 'monthly',
                status: 'active',
            };
            findAllSubscriptionsUseCase.execute.mockResolvedValue([mockSubscription]);

            await controller.findAll(mockRequest, filters);

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

            const result = await controller.findByFrequency(mockRequest, 'monthly');

            expect(result).toBeDefined();
            expect(Array.isArray(result)).toBe(true);
            expect(findSubscriptionsByPeriodUseCase.execute).toHaveBeenCalledWith('monthly');
        });

        it('should filter subscriptions to only include user subscriptions', async () => {
            const otherSubscription = {
                ...mockSubscription,
                id: 'subscription-456',
                userId: 'other-user',
            } as unknown as Subscription;

            findSubscriptionsByPeriodUseCase.execute.mockResolvedValue([
                mockSubscription,
                otherSubscription,
            ]);

            const result = await controller.findByFrequency(mockRequest, 'monthly');

            expect(result).toHaveLength(1);
            expect(result[0].id).toBe('subscription-123');
        });
    });

    describe('findById', () => {
        it('should return a single subscription', async () => {
            findSubscriptionUseCase.findById.mockResolvedValue(mockSubscription);

            const result = await controller.findById(mockRequest, 'subscription-123');

            expect(result).toBeDefined();
            expect(result.id).toBe('subscription-123');
            expect(findSubscriptionUseCase.findById).toHaveBeenCalledWith('subscription-123');
        });

        it('should throw NotFoundException when subscription belongs to another user', async () => {
            const otherUserSubscription = {
                ...mockSubscription,
                userId: 'other-user',
            } as unknown as Subscription;

            findSubscriptionUseCase.findById.mockResolvedValue(otherUserSubscription);

            await expect(controller.findById(mockRequest, 'subscription-123')).rejects.toThrow();
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

            findSubscriptionUseCase.findById.mockResolvedValue(mockSubscription);
            updateSubscriptionUseCase.execute.mockResolvedValue(updatedSubscription);

            const result = await controller.update(mockRequest, 'subscription-123', updateDto);

            expect(result).toBeDefined();
            expect(result.name).toBe('Netflix Standard');
            expect(result.amount).toBe(12.99);
            expect(findSubscriptionUseCase.findById).toHaveBeenCalledWith('subscription-123');
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
            findSubscriptionUseCase.findById.mockResolvedValue(mockSubscription);
            deleteSubscriptionUseCase.execute.mockResolvedValue(undefined);

            await controller.delete(mockRequest, 'subscription-123');

            expect(findSubscriptionUseCase.findById).toHaveBeenCalledWith('subscription-123');
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

            findSubscriptionUseCase.findById.mockResolvedValue(mockSubscription);
            pauseSubscriptionUseCase.execute.mockResolvedValue(pausedSubscription);

            const result = await controller.pause(mockRequest, 'subscription-123');

            expect(result).toBeDefined();
            expect(result.status).toBe('paused');
            expect(findSubscriptionUseCase.findById).toHaveBeenCalledWith('subscription-123');
            expect(pauseSubscriptionUseCase.execute).toHaveBeenCalledWith('subscription-123');
        });
    });

    describe('resume', () => {
        it('should resume a subscription', async () => {
            findSubscriptionUseCase.findById.mockResolvedValue(mockSubscription);
            resumeSubscriptionUseCase.execute.mockResolvedValue(mockSubscription);

            const result = await controller.resume(mockRequest, 'subscription-123');

            expect(result).toBeDefined();
            expect(result.status).toBe('active');
            expect(findSubscriptionUseCase.findById).toHaveBeenCalledWith('subscription-123');
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

            findSubscriptionUseCase.findById.mockResolvedValue(mockSubscription);
            findSubscriptionEventsUseCase.execute.mockResolvedValue(mockEvents as any);

            const result = await controller.getEvents(mockRequest, 'subscription-123');

            expect(result).toBeDefined();
            expect(Array.isArray(result)).toBe(true);
            expect(findSubscriptionUseCase.findById).toHaveBeenCalledWith('subscription-123');
            expect(findSubscriptionEventsUseCase.execute).toHaveBeenCalledWith('subscription-123');
        });
    });
});