import { Test, TestingModule } from '@nestjs/testing';
import { UpdateFutureEventsStatusUseCase } from './update-future-events-status.use-case';
import { IEventRepository, EVENT_REPOSITORY } from '../ports/event-repository.interface';

describe('UpdateFutureEventsStatusUseCase', () => {
  let useCase: UpdateFutureEventsStatusUseCase;
  let repository: jest.Mocked<IEventRepository>;

  beforeEach(async () => {
    const mockRepository: Partial<jest.Mocked<IEventRepository>> = {
      updateFutureEventsStatus: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UpdateFutureEventsStatusUseCase,
        {
          provide: EVENT_REPOSITORY,
          useValue: mockRepository,
        },
      ],
    }).compile();

    useCase = module.get<UpdateFutureEventsStatusUseCase>(UpdateFutureEventsStatusUseCase);
    repository = module.get(EVENT_REPOSITORY);
  });

  it('should be defined', () => {
    expect(useCase).toBeDefined();
  });

  it('should update future events status to canceled', async () => {
    const subscriptionId = 'subscription-123';
    const newStatus = 'canceled';
    const affectedCount = 5;

    repository.updateFutureEventsStatus.mockResolvedValue(affectedCount);

    const result = await useCase.execute(subscriptionId, newStatus);

    expect(result).toBe(affectedCount);
    expect(repository.updateFutureEventsStatus).toHaveBeenCalledWith(subscriptionId, newStatus);
  });

  it('should update future events status to scheduled', async () => {
    const subscriptionId = 'subscription-456';
    const newStatus = 'scheduled';
    const affectedCount = 3;

    repository.updateFutureEventsStatus.mockResolvedValue(affectedCount);

    const result = await useCase.execute(subscriptionId, newStatus);

    expect(result).toBe(affectedCount);
    expect(repository.updateFutureEventsStatus).toHaveBeenCalledWith(subscriptionId, newStatus);
  });

  it('should return 0 when no events are updated', async () => {
    const subscriptionId = 'subscription-789';
    const newStatus = 'canceled';

    repository.updateFutureEventsStatus.mockResolvedValue(0);

    const result = await useCase.execute(subscriptionId, newStatus);

    expect(result).toBe(0);
    expect(repository.updateFutureEventsStatus).toHaveBeenCalledWith(subscriptionId, newStatus);
  });

  it('should handle repository errors', async () => {
    const subscriptionId = 'subscription-error';
    const newStatus = 'canceled';
    const error = new Error('Database error');

    repository.updateFutureEventsStatus.mockRejectedValue(error);

    await expect(useCase.execute(subscriptionId, newStatus)).rejects.toThrow('Database error');
    expect(repository.updateFutureEventsStatus).toHaveBeenCalledWith(subscriptionId, newStatus);
  });

  it('should update status to completed', async () => {
    const subscriptionId = 'subscription-completed';
    const newStatus = 'completed';
    const affectedCount = 2;

    repository.updateFutureEventsStatus.mockResolvedValue(affectedCount);

    const result = await useCase.execute(subscriptionId, newStatus);

    expect(result).toBe(affectedCount);
    expect(repository.updateFutureEventsStatus).toHaveBeenCalledWith(subscriptionId, newStatus);
  });

  it('should update status to failed', async () => {
    const subscriptionId = 'subscription-failed';
    const newStatus = 'failed';
    const affectedCount = 1;

    repository.updateFutureEventsStatus.mockResolvedValue(affectedCount);

    const result = await useCase.execute(subscriptionId, newStatus);

    expect(result).toBe(affectedCount);
    expect(repository.updateFutureEventsStatus).toHaveBeenCalledWith(subscriptionId, newStatus);
  });
});
