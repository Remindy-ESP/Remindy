import { Test, TestingModule } from '@nestjs/testing';
import { ThrottlerGuard } from '@nestjs/throttler';
import { ReminderController } from './reminder.controller';
import { FindAllRemindersUseCase } from '../../application/use-cases/find-all-reminders.use-case';
import { FindReminderByIdUseCase } from '../../application/use-cases/find-reminder-by-id.use-case';
import { CreateReminderUseCase } from '../../application/use-cases/create-reminder.use-case';
import { UpdateReminderUseCase } from '../../application/use-cases/update-reminder.use-case';
import { DeleteReminderUseCase } from '../../application/use-cases/delete-reminder.use-case';
import { Reminder } from '../../domain/reminder.entity';
import { CreateReminderDto } from '../dto/create-reminder.dto';
import { UpdateReminderDto } from '../dto/update-reminder.dto';
import { ReminderFilterDto } from '../dto/reminder-filter.dto';
import { JwtAuthGuard } from 'src/modules/auth/presentation/guards/jwt-auth.guard';

describe('ReminderController', () => {
  let controller: ReminderController;
  let findAllRemindersUseCase: jest.Mocked<FindAllRemindersUseCase>;
  let findReminderByIdUseCase: jest.Mocked<FindReminderByIdUseCase>;
  let createReminderUseCase: jest.Mocked<CreateReminderUseCase>;
  let updateReminderUseCase: jest.Mocked<UpdateReminderUseCase>;
  let deleteReminderUseCase: jest.Mocked<DeleteReminderUseCase>;

  const mockUserId = '123e4567-e89b-12d3-a456-426614174000';
  const mockRequest = {
    user: { userId: mockUserId, role: 'user_freemium' },
  } as any;

  const mockReminder = {
    id: 'reminder-123',
    userId: mockUserId,
    subscriptionId: 'subscription-123',
    type: 'payment_due',
    daysBefore: 3,
    enabled: true,
    channel: 'email',
    createdAt: new Date('2025-01-01'),
    updatedAt: new Date('2025-01-01'),
  } as Reminder;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ReminderController],
      providers: [
        {
          provide: FindAllRemindersUseCase,
          useValue: {
            execute: jest.fn(),
          },
        },
        {
          provide: FindReminderByIdUseCase,
          useValue: {
            execute: jest.fn(),
          },
        },
        {
          provide: CreateReminderUseCase,
          useValue: {
            execute: jest.fn(),
          },
        },
        {
          provide: UpdateReminderUseCase,
          useValue: {
            execute: jest.fn(),
          },
        },
        {
          provide: DeleteReminderUseCase,
          useValue: {
            execute: jest.fn(),
          },
        },
      ],
    })
      .overrideGuard(ThrottlerGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<ReminderController>(ReminderController);
    findAllRemindersUseCase = module.get(FindAllRemindersUseCase);
    findReminderByIdUseCase = module.get(FindReminderByIdUseCase);
    createReminderUseCase = module.get(CreateReminderUseCase);
    updateReminderUseCase = module.get(UpdateReminderUseCase);
    deleteReminderUseCase = module.get(DeleteReminderUseCase);
  });

  describe('findAll', () => {
    it('should return an array of reminders', async () => {
      const filters: ReminderFilterDto = {};
      findAllRemindersUseCase.execute.mockResolvedValue([mockReminder]);

      const result = await controller.findAll(mockRequest, filters);

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      expect(findAllRemindersUseCase.execute).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: mockUserId,
        }),
      );
    });

    it('should pass filters to use case', async () => {
      const filters: ReminderFilterDto = {
        subscription_id: 'subscription-123',
        type: 'payment_due',
        enabled: true,
      };
      findAllRemindersUseCase.execute.mockResolvedValue([mockReminder]);

      await controller.findAll(mockRequest, filters);

      expect(findAllRemindersUseCase.execute).toHaveBeenCalledWith(
        expect.objectContaining({
          subscriptionId: 'subscription-123',
          type: 'payment_due',
          enabled: true,
        }),
      );
    });
  });

  describe('findOne', () => {
    it('should return a single reminder', async () => {
      findReminderByIdUseCase.execute.mockResolvedValue(mockReminder);

      const result = await controller.findOne(mockRequest, 'reminder-123');

      expect(result).toBeDefined();
      expect(result.id).toBe('reminder-123');
      expect(findReminderByIdUseCase.execute).toHaveBeenCalledWith('reminder-123', mockUserId);
    });
  });

  describe('create', () => {
    it('should create a new reminder', async () => {
      const createDto: CreateReminderDto = {
        subscription_id: 'subscription-123',
        type: 'payment_due',
        days_before: 3,
        enabled: true,
        channel: 'email',
      };
      createReminderUseCase.execute.mockResolvedValue(mockReminder);

      const result = await controller.create(mockRequest, createDto);

      expect(result).toBeDefined();
      expect(result.id).toBe('reminder-123');
      expect(createReminderUseCase.execute).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: mockUserId,
          subscriptionId: 'subscription-123',
          type: 'payment_due',
          daysBefore: 3,
          enabled: true,
          channel: 'email',
        }),
      );
    });
  });

  describe('update', () => {
    it('should update a reminder', async () => {
      const updateDto: UpdateReminderDto = {
        days_before: 5,
        enabled: false,
      };
      const updatedReminder = {
        id: 'reminder-123',
        userId: mockUserId,
        subscriptionId: 'subscription-123',
        type: 'payment_due',
        daysBefore: 5,
        enabled: false,
        channel: 'email',
        createdAt: new Date('2025-01-01'),
        updatedAt: new Date('2025-01-02'),
      } as Reminder;
      updateReminderUseCase.execute.mockResolvedValue(updatedReminder);

      const result = await controller.update(mockRequest, 'reminder-123', updateDto);

      expect(result).toBeDefined();
      expect(result.days_before).toBe(5);
      expect(result.enabled).toBe(false);
      expect(updateReminderUseCase.execute).toHaveBeenCalledWith(
        'reminder-123',
        mockUserId,
        expect.objectContaining({
          daysBefore: 5,
          enabled: false,
        }),
      );
    });
  });

  describe('delete', () => {
    it('should delete a reminder', async () => {
      deleteReminderUseCase.execute.mockResolvedValue(undefined);

      await controller.delete(mockRequest, 'reminder-123');

      expect(deleteReminderUseCase.execute).toHaveBeenCalledWith('reminder-123', mockUserId);
    });
  });
});
