import { Test, TestingModule } from '@nestjs/testing';
import { ThrottlerGuard } from '@nestjs/throttler';
import { JwtAuthGuard } from 'src/modules/auth/presentation/guards/jwt-auth.guard';
import { EventController } from './event.controller';
import { FindAllEventsUseCase } from '../../application/use-cases/find-all-events.use-case';
import { GetEventByIdUseCase } from '../../application/use-cases/get-event-by-id.use-case';
import { RescheduleEventUseCase } from '../../application/use-cases/reschedule-event.use-case';
import { UpdateEventStatusUseCase } from '../../application/use-cases/update-event-status.use-case';
import { UpdateEventPaymentStatusUseCase } from '../../application/use-cases/update-event-payment-status.use-case';
import { DeleteEventUseCase } from '../../application/use-cases/delete-event.use-case';
import { Event } from '../../domain/event.entity';
import { EventFilterDto } from '../dto/event-filter.dto';
import { RescheduleEventDto } from '../dto/reschedule-event.dto';
import { UpdateEventStatusDto } from '../dto/update-event-status.dto';
import { UpdateEventPaymentStatusDto } from '../dto/update-event-payment-status.dto';

describe('EventController', () => {
  let controller: EventController;
  let findAllEventsUseCase: jest.Mocked<FindAllEventsUseCase>;
  let getEventByIdUseCase: jest.Mocked<GetEventByIdUseCase>;
  let rescheduleEventUseCase: jest.Mocked<RescheduleEventUseCase>;
  let updateEventStatusUseCase: jest.Mocked<UpdateEventStatusUseCase>;
  let updateEventPaymentStatusUseCase: jest.Mocked<UpdateEventPaymentStatusUseCase>;
  let deleteEventUseCase: jest.Mocked<DeleteEventUseCase>;

  const mockEvent = {
    id: 'event-123',
    subscriptionId: 'subscription-123',
    eventSeriesId: null,
    title: 'Netflix Payment',
    amount: 10.99,
    currency: 'EUR',
    startsAt: new Date('2025-02-01'),
    endsAt: new Date('2025-02-01'),
    status: 'scheduled',
    paymentStatus: 'pending',
    notes: null,
    createdAt: new Date('2025-01-01'),
    updatedAt: new Date('2025-01-01'),
  } as unknown as Event;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [EventController],
      providers: [
        {
          provide: FindAllEventsUseCase,
          useValue: {
            execute: jest.fn(),
          },
        },
        {
          provide: GetEventByIdUseCase,
          useValue: {
            execute: jest.fn(),
          },
        },
        {
          provide: RescheduleEventUseCase,
          useValue: {
            execute: jest.fn(),
          },
        },
        {
          provide: UpdateEventStatusUseCase,
          useValue: {
            execute: jest.fn(),
          },
        },
        {
          provide: UpdateEventPaymentStatusUseCase,
          useValue: {
            execute: jest.fn(),
          },
        },
        {
          provide: DeleteEventUseCase,
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

    controller = module.get<EventController>(EventController);
    findAllEventsUseCase = module.get(FindAllEventsUseCase);
    getEventByIdUseCase = module.get(GetEventByIdUseCase);
    rescheduleEventUseCase = module.get(RescheduleEventUseCase);
    updateEventStatusUseCase = module.get(UpdateEventStatusUseCase);
    updateEventPaymentStatusUseCase = module.get(UpdateEventPaymentStatusUseCase);
    deleteEventUseCase = module.get(DeleteEventUseCase);
  });

  describe('findAll', () => {
    it('should return an array of events', async () => {
      const filters: EventFilterDto = {};
      findAllEventsUseCase.execute.mockResolvedValue([mockEvent]);

      const result = await controller.findAll(filters);

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      expect(findAllEventsUseCase.execute).toHaveBeenCalled();
    });

    it('should pass filters to use case', async () => {
      const filters: EventFilterDto = {
        start: '2025-01-01T00:00:00Z',
        end: '2025-12-31T23:59:59Z',
        subscription_id: 'subscription-123',
        status: 'scheduled',
        payment_status: 'pending',
      };
      findAllEventsUseCase.execute.mockResolvedValue([mockEvent]);

      await controller.findAll(filters);

      expect(findAllEventsUseCase.execute).toHaveBeenCalledWith(
        expect.objectContaining({
          start: expect.any(Date),
          end: expect.any(Date),
          subscriptionId: 'subscription-123',
          status: 'scheduled',
          paymentStatus: 'pending',
        }),
      );
    });
  });

  describe('findOne', () => {
    it('should return a single event', async () => {
      getEventByIdUseCase.execute.mockResolvedValue(mockEvent);

      const result = await controller.findOne('event-123');

      expect(result).toBeDefined();
      expect(result.id).toBe('event-123');
      expect(getEventByIdUseCase.execute).toHaveBeenCalledWith('event-123');
    });
  });

  describe('reschedule', () => {
    it('should reschedule an event', async () => {
      const rescheduleDto: RescheduleEventDto = {
        starts_at: '2025-03-01T10:00:00.000Z',
        ends_at: '2025-03-01T11:00:00.000Z',
        notes: 'Rescheduled due to conflict',
      };
      const rescheduledEvent = {
        id: 'event-123',
        subscriptionId: 'subscription-123',
        eventSeriesId: null,
        title: 'Netflix Payment',
        amount: 10.99,
        currency: 'EUR',
        startsAt: new Date('2025-03-01T10:00:00.000Z'),
        endsAt: new Date('2025-03-01T11:00:00.000Z'),
        status: 'scheduled',
        paymentStatus: 'pending',
        notes: 'Rescheduled due to conflict',
        createdAt: new Date('2025-01-01'),
        updatedAt: new Date('2025-01-02'),
      } as unknown as Event;
      rescheduleEventUseCase.execute.mockResolvedValue(rescheduledEvent);

      const result = await controller.reschedule('event-123', rescheduleDto);

      expect(result).toBeDefined();
      expect(rescheduleEventUseCase.execute).toHaveBeenCalledWith(
        'event-123',
        expect.objectContaining({
          startsAt: expect.any(Date),
          endsAt: expect.any(Date),
          notes: 'Rescheduled due to conflict',
        }),
      );
    });
  });

  describe('updateStatus', () => {
    it('should update event status', async () => {
      const updateStatusDto: UpdateEventStatusDto = {
        status: 'completed',
      };
      const updatedEvent = {
        id: 'event-123',
        subscriptionId: 'subscription-123',
        eventSeriesId: null,
        title: 'Netflix Payment',
        amount: 10.99,
        currency: 'EUR',
        startsAt: new Date('2025-02-01'),
        endsAt: new Date('2025-02-01'),
        status: 'completed',
        paymentStatus: 'pending',
        notes: null,
        createdAt: new Date('2025-01-01'),
        updatedAt: new Date('2025-01-02'),
      } as unknown as Event;
      updateEventStatusUseCase.execute.mockResolvedValue(updatedEvent);

      const result = await controller.updateStatus('event-123', updateStatusDto);

      expect(result).toBeDefined();
      expect(result.status).toBe('completed');
      expect(updateEventStatusUseCase.execute).toHaveBeenCalledWith('event-123', 'completed');
    });
  });

  describe('updatePaymentStatus', () => {
    it('should update event payment status', async () => {
      const updatePaymentStatusDto: UpdateEventPaymentStatusDto = {
        paymentStatus: 'paid',
      };
      const updatedEvent = {
        id: 'event-123',
        subscriptionId: 'subscription-123',
        eventSeriesId: null,
        title: 'Netflix Payment',
        amount: 10.99,
        currency: 'EUR',
        startsAt: new Date('2025-02-01'),
        endsAt: new Date('2025-02-01'),
        status: 'scheduled',
        paymentStatus: 'paid',
        notes: null,
        createdAt: new Date('2025-01-01'),
        updatedAt: new Date('2025-01-02'),
      } as unknown as Event;
      updateEventPaymentStatusUseCase.execute.mockResolvedValue(updatedEvent);

      const result = await controller.updatePaymentStatus('event-123', updatePaymentStatusDto);

      expect(result).toBeDefined();
      expect(result.paymentStatus).toBe('paid');
      expect(updateEventPaymentStatusUseCase.execute).toHaveBeenCalledWith('event-123', 'paid');
    });
  });

  describe('delete', () => {
    it('should delete an event', async () => {
      deleteEventUseCase.execute.mockResolvedValue(undefined);

      await controller.delete('event-123');

      expect(deleteEventUseCase.execute).toHaveBeenCalledWith('event-123');
    });
  });
});
