import { ReminderPresentationMapper } from './reminder-presentation.mapper';
import { Reminder } from '../../domain/reminder.entity';
import { ReminderFilterDto } from '../dto/reminder-filter.dto';
import { CreateReminderDto } from '../dto/create-reminder.dto';
import { UpdateReminderDto } from '../dto/update-reminder.dto';

describe('ReminderPresentationMapper', () => {
  describe('toResponseDto', () => {
    it('should map Reminder domain to ReminderResponseDto', () => {
      const reminder = new Reminder({
        id: 'reminder-123',
        userId: 'user-123',
        subscriptionId: 'sub-123',
        type: 'payment_due',
        daysBefore: 3,
        enabled: true,
        channel: 'email',
        createdAt: new Date('2025-01-01T10:00:00.000Z'),
        updatedAt: new Date('2025-01-02T10:00:00.000Z'),
      });

      const dto = ReminderPresentationMapper.toResponseDto(reminder);

      expect(dto.id).toBe('reminder-123');
      expect(dto.user_id).toBe('user-123');
      expect(dto.subscription_id).toBe('sub-123');
      expect(dto.type).toBe('payment_due');
      expect(dto.days_before).toBe(3);
      expect(dto.enabled).toBe(true);
      expect(dto.channel).toBe('email');
      expect(dto.created_at).toBe('2025-01-01T10:00:00.000Z');
      expect(dto.updated_at).toBe('2025-01-02T10:00:00.000Z');
      expect(dto.deleted_at).toBeUndefined();
    });

    it('should map Reminder with deletedAt', () => {
      const reminder = new Reminder({
        id: 'reminder-456',
        userId: 'user-456',
        type: 'payment_failed',
        daysBefore: 1,
        enabled: false,
        channel: 'push',
        createdAt: new Date('2025-01-01T10:00:00.000Z'),
        updatedAt: new Date('2025-01-02T10:00:00.000Z'),
        deletedAt: new Date('2025-01-03T10:00:00.000Z'),
      });

      const dto = ReminderPresentationMapper.toResponseDto(reminder);

      expect(dto.deleted_at).toBe('2025-01-03T10:00:00.000Z');
    });

    it('should map Reminder without subscriptionId', () => {
      const reminder = new Reminder({
        id: 'reminder-789',
        userId: 'user-789',
        subscriptionId: undefined,
        type: 'budget_alert',
        daysBefore: 5,
        enabled: true,
        channel: 'sms',
        createdAt: new Date('2025-01-01T10:00:00.000Z'),
        updatedAt: new Date('2025-01-02T10:00:00.000Z'),
      });

      const dto = ReminderPresentationMapper.toResponseDto(reminder);

      expect(dto.subscription_id).toBeUndefined();
    });

    it('should map different reminder types', () => {
      const types: Array<
        'payment_due' | 'payment_failed' | 'subscription_renewal' | 'budget_alert'
      > = ['payment_due', 'payment_failed', 'subscription_renewal', 'budget_alert'];

      types.forEach(type => {
        const reminder = new Reminder({
          id: `reminder-${type}`,
          userId: 'user-123',
          type,
          daysBefore: 3,
          enabled: true,
          channel: 'email',
          createdAt: new Date(),
          updatedAt: new Date(),
        });

        const dto = ReminderPresentationMapper.toResponseDto(reminder);

        expect(dto.type).toBe(type);
      });
    });

    it('should map different reminder channels', () => {
      const channels: Array<'email' | 'push' | 'sms'> = ['email', 'push', 'sms'];

      channels.forEach(channel => {
        const reminder = new Reminder({
          id: `reminder-${channel}`,
          userId: 'user-123',
          type: 'payment_due',
          daysBefore: 3,
          enabled: true,
          channel,
          createdAt: new Date(),
          updatedAt: new Date(),
        });

        const dto = ReminderPresentationMapper.toResponseDto(reminder);

        expect(dto.channel).toBe(channel);
      });
    });
  });

  describe('toResponseDtoArray', () => {
    it('should map array of Reminders to array of ReminderResponseDto', () => {
      const reminders = [
        new Reminder({
          id: 'reminder-1',
          userId: 'user-1',
          subscriptionId: 'sub-1',
          type: 'payment_due',
          daysBefore: 3,
          enabled: true,
          channel: 'email',
          createdAt: new Date(),
          updatedAt: new Date(),
        }),
        new Reminder({
          id: 'reminder-2',
          userId: 'user-2',
          subscriptionId: 'sub-2',
          type: 'payment_failed',
          daysBefore: 1,
          enabled: false,
          channel: 'push',
          createdAt: new Date(),
          updatedAt: new Date(),
        }),
      ];

      const dtos = ReminderPresentationMapper.toResponseDtoArray(reminders);

      expect(dtos).toHaveLength(2);
      expect(dtos[0].id).toBe('reminder-1');
      expect(dtos[1].id).toBe('reminder-2');
    });

    it('should return empty array when given empty array', () => {
      const dtos = ReminderPresentationMapper.toResponseDtoArray([]);

      expect(dtos).toEqual([]);
    });
  });

  describe('toFilterAppDto', () => {
    it('should map ReminderFilterDto to ReminderFilterAppDto with userId', () => {
      const filterDto: ReminderFilterDto = {
        subscription_id: 'sub-123',
        type: 'payment_due',
        enabled: true,
        limit: 10,
        sort: 'created_at:asc',
      };

      const appDto = ReminderPresentationMapper.toFilterAppDto('user-123', filterDto);

      expect(appDto.userId).toBe('user-123');
      expect(appDto.subscriptionId).toBe('sub-123');
      expect(appDto.type).toBe('payment_due');
      expect(appDto.enabled).toBe(true);
      expect(appDto.limit).toBe(10);
      expect(appDto.sort).toBe('created_at:asc');
    });

    it('should use default values when not provided', () => {
      const filterDto: ReminderFilterDto = {};

      const appDto = ReminderPresentationMapper.toFilterAppDto('user-456', filterDto);

      expect(appDto.userId).toBe('user-456');
      expect(appDto.limit).toBe(50);
      expect(appDto.sort).toBe('created_at:desc');
      expect(appDto.subscriptionId).toBeUndefined();
      expect(appDto.type).toBeUndefined();
      expect(appDto.enabled).toBeUndefined();
    });

    it('should handle partial filter dto', () => {
      const filterDto: ReminderFilterDto = {
        subscription_id: 'sub-789',
      };

      const appDto = ReminderPresentationMapper.toFilterAppDto('user-789', filterDto);

      expect(appDto.userId).toBe('user-789');
      expect(appDto.subscriptionId).toBe('sub-789');
      expect(appDto.limit).toBe(50);
      expect(appDto.sort).toBe('created_at:desc');
    });

    it('should map enabled false correctly', () => {
      const filterDto: ReminderFilterDto = {
        enabled: false,
      };

      const appDto = ReminderPresentationMapper.toFilterAppDto('user-111', filterDto);

      expect(appDto.enabled).toBe(false);
    });
  });

  describe('toCreateAppDto', () => {
    it('should map CreateReminderDto to CreateReminderAppDto with userId', () => {
      const createDto: CreateReminderDto = {
        subscription_id: 'sub-123',
        type: 'payment_due',
        days_before: 3,
        enabled: true,
        channel: 'email',
      };

      const appDto = ReminderPresentationMapper.toCreateAppDto('user-123', createDto);

      expect(appDto.userId).toBe('user-123');
      expect(appDto.subscriptionId).toBe('sub-123');
      expect(appDto.type).toBe('payment_due');
      expect(appDto.daysBefore).toBe(3);
      expect(appDto.enabled).toBe(true);
      expect(appDto.channel).toBe('email');
    });

    it('should use default enabled value when not provided', () => {
      const createDto: CreateReminderDto = {
        subscription_id: 'sub-456',
        type: 'subscription_renewal',
        days_before: 7,
        channel: 'sms',
      };

      const appDto = ReminderPresentationMapper.toCreateAppDto('user-456', createDto);

      expect(appDto.enabled).toBe(true);
    });

    it('should map reminder without subscriptionId', () => {
      const createDto: CreateReminderDto = {
        type: 'budget_alert',
        days_before: 5,
        enabled: false,
        channel: 'push',
      };

      const appDto = ReminderPresentationMapper.toCreateAppDto('user-789', createDto);

      expect(appDto.subscriptionId).toBeUndefined();
      expect(appDto.type).toBe('budget_alert');
    });

    it('should map different reminder types', () => {
      const types: Array<'payment_due' | 'payment_failed' | 'subscription_renewal'> = [
        'payment_due',
        'payment_failed',
        'subscription_renewal',
      ];

      types.forEach(type => {
        const createDto: CreateReminderDto = {
          subscription_id: 'sub-123',
          type,
          days_before: 3,
          channel: 'email',
        };

        const appDto = ReminderPresentationMapper.toCreateAppDto('user-123', createDto);

        expect(appDto.type).toBe(type);
      });
    });

    it('should map different reminder channels', () => {
      const channels: Array<'email' | 'push' | 'sms'> = ['email', 'push', 'sms'];

      channels.forEach(channel => {
        const createDto: CreateReminderDto = {
          subscription_id: 'sub-123',
          type: 'payment_due',
          days_before: 3,
          channel,
        };

        const appDto = ReminderPresentationMapper.toCreateAppDto('user-123', createDto);

        expect(appDto.channel).toBe(channel);
      });
    });
  });

  describe('toUpdateAppDto', () => {
    it('should map UpdateReminderDto to UpdateReminderAppDto', () => {
      const updateDto: UpdateReminderDto = {
        days_before: 7,
        enabled: false,
        channel: 'push',
      };

      const appDto = ReminderPresentationMapper.toUpdateAppDto(updateDto);

      expect(appDto.daysBefore).toBe(7);
      expect(appDto.enabled).toBe(false);
      expect(appDto.channel).toBe('push');
    });

    it('should handle partial update', () => {
      const updateDto: UpdateReminderDto = {
        enabled: true,
      };

      const appDto = ReminderPresentationMapper.toUpdateAppDto(updateDto);

      expect(appDto.enabled).toBe(true);
      expect(appDto.daysBefore).toBeUndefined();
      expect(appDto.channel).toBeUndefined();
    });

    it('should map days_before only', () => {
      const updateDto: UpdateReminderDto = {
        days_before: 14,
      };

      const appDto = ReminderPresentationMapper.toUpdateAppDto(updateDto);

      expect(appDto.daysBefore).toBe(14);
      expect(appDto.enabled).toBeUndefined();
      expect(appDto.channel).toBeUndefined();
    });

    it('should map channel only', () => {
      const updateDto: UpdateReminderDto = {
        channel: 'sms',
      };

      const appDto = ReminderPresentationMapper.toUpdateAppDto(updateDto);

      expect(appDto.channel).toBe('sms');
      expect(appDto.daysBefore).toBeUndefined();
      expect(appDto.enabled).toBeUndefined();
    });

    it('should handle empty update dto', () => {
      const updateDto: UpdateReminderDto = {};

      const appDto = ReminderPresentationMapper.toUpdateAppDto(updateDto);

      expect(appDto.daysBefore).toBeUndefined();
      expect(appDto.enabled).toBeUndefined();
      expect(appDto.channel).toBeUndefined();
    });
  });
});
