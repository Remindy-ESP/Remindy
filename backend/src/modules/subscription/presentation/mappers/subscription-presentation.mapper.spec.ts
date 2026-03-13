import { SubscriptionPresentationMapper } from './subscription-presentation.mapper';
import { Subscription } from '../../domain/subscription.entity';
import { CreateSubscriptionDto } from '../dto/create-subscription.dto';
import { UpdateSubscriptionDto } from '../dto/update-subscription.dto';
import { SubscriptionFilterDto } from '../dto/subscription-filter.dto';

describe('SubscriptionPresentationMapper', () => {
  describe('toCreateAppDto', () => {
    it('should map CreateSubscriptionDto to CreateSubscriptionAppDto', () => {
      const createDto: CreateSubscriptionDto = {
        userId: 'user-123',
        contractId: 123,
        name: 'Netflix',
        amount: 9.99,
        currency: 'USD',
        frequency: 'monthly',
        startDate: '2025-01-01T00:00:00.000Z',
        nextDueDate: '2025-02-01T00:00:00.000Z',
        trialStartDate: '2024-12-01T00:00:00.000Z',
        trialEndDate: '2024-12-31T00:00:00.000Z',
        status: 'trial',
        color: '#FF0000',
        notes: 'Test notes',
      };

      const appDto = SubscriptionPresentationMapper.toCreateAppDto(createDto);

      expect(appDto.userId).toBe('user-123');
      expect(appDto.contractId).toBe(123);
      expect(appDto.name).toBe('Netflix');
      expect(appDto.amount).toBe(9.99);
      expect(appDto.currency).toBe('USD');
      expect(appDto.frequency).toBe('monthly');
      expect(appDto.startDate).toEqual(new Date('2025-01-01T00:00:00.000Z'));
      expect(appDto.nextDueDate).toEqual(new Date('2025-02-01T00:00:00.000Z'));
      expect(appDto.trialStartDate).toEqual(new Date('2024-12-01T00:00:00.000Z'));
      expect(appDto.trialEndDate).toEqual(new Date('2024-12-31T00:00:00.000Z'));
      expect(appDto.status).toBe('trial');
      expect(appDto.color).toBe('#FF0000');
      expect(appDto.notes).toBe('Test notes');
    });

    it('should use default values when not provided', () => {
      const createDto: CreateSubscriptionDto = {
        userId: 'user-456',
        name: 'Spotify',
        amount: 4.99,
        frequency: 'monthly',
        startDate: '2025-01-01T00:00:00.000Z',
      };

      const appDto = SubscriptionPresentationMapper.toCreateAppDto(createDto);

      expect(appDto.currency).toBe('EUR');
      expect(appDto.status).toBe('active');
      expect(appDto.nextDueDate).toBeDefined();
    });

    it('should calculate nextDueDate for monthly frequency', () => {
      const createDto: CreateSubscriptionDto = {
        userId: 'user-789',
        name: 'Test',
        amount: 10,
        frequency: 'monthly',
        startDate: '2025-01-15T00:00:00.000Z',
      };

      const appDto = SubscriptionPresentationMapper.toCreateAppDto(createDto);

      const expectedDate = new Date('2025-01-15T00:00:00.000Z');
      expectedDate.setMonth(expectedDate.getMonth() + 1);
      expect(appDto.nextDueDate.toISOString()).toBe(expectedDate.toISOString());
    });

    it('should calculate nextDueDate for weekly frequency', () => {
      const createDto: CreateSubscriptionDto = {
        userId: 'user-789',
        name: 'Test',
        amount: 10,
        frequency: 'weekly',
        startDate: '2025-01-15T00:00:00.000Z',
      };

      const appDto = SubscriptionPresentationMapper.toCreateAppDto(createDto);

      const expectedDate = new Date('2025-01-15T00:00:00.000Z');
      expectedDate.setDate(expectedDate.getDate() + 7);
      expect(appDto.nextDueDate.toISOString()).toBe(expectedDate.toISOString());
    });

    it('should return startDate as nextDueDate for one-time frequency', () => {
      const createDto: CreateSubscriptionDto = {
        userId: 'user-abc',
        name: 'One-time purchase',
        amount: 50,
        frequency: 'one-time',
        startDate: '2025-03-01T00:00:00.000Z',
      };

      const appDto = SubscriptionPresentationMapper.toCreateAppDto(createDto);

      expect(appDto.nextDueDate.toISOString()).toBe('2025-03-01T00:00:00.000Z');
    });

    it('should calculate nextDueDate for quarterly frequency', () => {
      const createDto: CreateSubscriptionDto = {
        userId: 'user-q',
        name: 'Quarterly sub',
        amount: 30,
        frequency: 'quarterly',
        startDate: '2025-01-01T00:00:00.000Z',
      };

      const appDto = SubscriptionPresentationMapper.toCreateAppDto(createDto);

      const expectedDate = new Date('2025-01-01T00:00:00.000Z');
      expectedDate.setMonth(expectedDate.getMonth() + 3);
      expect(appDto.nextDueDate.toISOString()).toBe(expectedDate.toISOString());
    });

    it('should calculate nextDueDate for yearly frequency', () => {
      const createDto: CreateSubscriptionDto = {
        userId: 'user-y',
        name: 'Yearly sub',
        amount: 100,
        frequency: 'yearly',
        startDate: '2025-01-01T00:00:00.000Z',
      };

      const appDto = SubscriptionPresentationMapper.toCreateAppDto(createDto);

      const expectedDate = new Date('2025-01-01T00:00:00.000Z');
      expectedDate.setFullYear(expectedDate.getFullYear() + 1);
      expect(appDto.nextDueDate.toISOString()).toBe(expectedDate.toISOString());
    });

    it('should throw when userId is not provided', () => {
      const createDto: CreateSubscriptionDto = {
        name: 'Test',
        amount: 10,
        frequency: 'monthly',
        startDate: '2025-01-01T00:00:00.000Z',
      } as CreateSubscriptionDto;

      expect(() => SubscriptionPresentationMapper.toCreateAppDto(createDto)).toThrow(
        'userId is required for creating subscriptions',
      );
    });

    it('should convert endDate when provided', () => {
      const createDto: CreateSubscriptionDto = {
        userId: 'user-1',
        name: 'Test',
        amount: 10,
        frequency: 'monthly',
        startDate: '2025-01-01T00:00:00.000Z',
        nextDueDate: '2025-02-01T00:00:00.000Z',
        endDate: '2026-01-01T00:00:00.000Z',
      };

      const appDto = SubscriptionPresentationMapper.toCreateAppDto(createDto);
      expect(appDto.endDate).toEqual(new Date('2026-01-01T00:00:00.000Z'));
    });
  });

  describe('toUpdateAppDto', () => {
    it('should map UpdateSubscriptionDto to UpdateSubscriptionAppDto', () => {
      const updateDto: UpdateSubscriptionDto = {
        name: 'Netflix Premium',
        amount: 14.99,
        frequency: 'monthly',
      };

      const appDto = SubscriptionPresentationMapper.toUpdateAppDto(updateDto);

      expect(appDto.name).toBe('Netflix Premium');
      expect(appDto.amount).toBe(14.99);
      expect(appDto.frequency).toBe('monthly');
    });

    it('should handle partial update', () => {
      const updateDto: UpdateSubscriptionDto = {
        status: 'paused',
      };

      const appDto = SubscriptionPresentationMapper.toUpdateAppDto(updateDto);

      expect(appDto.status).toBe('paused');
      expect(appDto.name).toBeUndefined();
      expect(appDto.amount).toBeUndefined();
    });

    it('should convert date strings to Date objects when provided', () => {
      const updateDto: UpdateSubscriptionDto = {
        startDate: '2025-03-01T00:00:00.000Z',
        endDate: '2026-03-01T00:00:00.000Z',
        nextDueDate: '2025-04-01T00:00:00.000Z',
        trialStartDate: '2025-01-01T00:00:00.000Z',
        trialEndDate: '2025-01-31T00:00:00.000Z',
      };

      const appDto = SubscriptionPresentationMapper.toUpdateAppDto(updateDto);

      expect(appDto.startDate).toEqual(new Date('2025-03-01T00:00:00.000Z'));
      expect(appDto.endDate).toEqual(new Date('2026-03-01T00:00:00.000Z'));
      expect(appDto.nextDueDate).toEqual(new Date('2025-04-01T00:00:00.000Z'));
      expect(appDto.trialStartDate).toEqual(new Date('2025-01-01T00:00:00.000Z'));
      expect(appDto.trialEndDate).toEqual(new Date('2025-01-31T00:00:00.000Z'));
    });
  });

  describe('toFilterAppDto', () => {
    it('should map SubscriptionFilterDto to SubscriptionFilterAppDto', () => {
      const filterDto: SubscriptionFilterDto = {
        userId: 'user-123',
        contractId: 123,
        name: 'Netflix',
        currency: 'EUR',
        frequency: 'monthly',
        status: 'active',
      };

      const appDto = SubscriptionPresentationMapper.toFilterAppDto(filterDto);

      expect(appDto.userId).toBe('user-123');
      expect(appDto.contractId).toBe(123);
      expect(appDto.name).toBe('Netflix');
      expect(appDto.currency).toBe('EUR');
      expect(appDto.frequency).toBe('monthly');
      expect(appDto.status).toBe('active');
    });

    it('should handle partial filter', () => {
      const filterDto: SubscriptionFilterDto = {
        userId: 'user-456',
      };

      const appDto = SubscriptionPresentationMapper.toFilterAppDto(filterDto);

      expect(appDto.userId).toBe('user-456');
      expect(appDto.contractId).toBeUndefined();
      expect(appDto.name).toBeUndefined();
    });
  });

  describe('toResponseDto', () => {
    it('should map Subscription domain to SubscriptionResponseDto', () => {
      const subscription = new Subscription({
        id: 'sub-123',
        userId: 'user-123',
        contractId: 123,
        name: 'Netflix',
        amount: 9.99,
        currency: 'EUR',
        frequency: 'monthly',
        startDate: new Date('2025-01-01'),
        nextDueDate: new Date('2025-02-01'),
        trialStartDate: new Date('2024-12-01'),
        trialEndDate: new Date('2024-12-31'),
        status: 'active',
        color: '#FF0000',
        notes: 'Test notes',
        createdAt: new Date('2025-01-01T10:00:00.000Z'),
        updatedAt: new Date('2025-01-02T10:00:00.000Z'),
      });

      const dto = SubscriptionPresentationMapper.toResponseDto(subscription);

      expect(dto.id).toBe('sub-123');
      expect(dto.userId).toBe('user-123');
      expect(dto.contractId).toBe(123);
      expect(dto.name).toBe('Netflix');
      expect(dto.amount).toBe(9.99);
      expect(dto.currency).toBe('EUR');
      expect(dto.frequency).toBe('monthly');
      expect(dto.startDate).toEqual(new Date('2025-01-01'));
      expect(dto.nextDueDate).toEqual(new Date('2025-02-01'));
      expect(dto.trialStartDate).toEqual(new Date('2024-12-01'));
      expect(dto.trialEndDate).toEqual(new Date('2024-12-31'));
      expect(dto.status).toBe('active');
      expect(dto.color).toBe('#FF0000');
      expect(dto.notes).toBe('Test notes');
    });

    it('should map Subscription without optional fields', () => {
      const subscription = new Subscription({
        id: 'sub-456',
        userId: 'user-456',
        name: 'Spotify',
        amount: 4.99,
        currency: 'USD',
        frequency: 'monthly',
        startDate: new Date('2025-01-01'),
        nextDueDate: new Date('2025-02-01'),
        status: 'active',
        createdAt: new Date('2025-01-01T10:00:00.000Z'),
        updatedAt: new Date('2025-01-02T10:00:00.000Z'),
      });

      const dto = SubscriptionPresentationMapper.toResponseDto(subscription);

      expect(dto.contractId).toBeUndefined();
      expect(dto.trialStartDate).toBeUndefined();
      expect(dto.trialEndDate).toBeUndefined();
      expect(dto.color).toBeUndefined();
      expect(dto.notes).toBeUndefined();
    });
  });

  describe('toResponseDtoArray', () => {
    it('should map array of Subscriptions to array of SubscriptionResponseDto', () => {
      const subscriptions = [
        new Subscription({
          id: 'sub-1',
          userId: 'user-1',
          name: 'Netflix',
          amount: 9.99,
          currency: 'EUR',
          frequency: 'monthly',
          startDate: new Date(),
          nextDueDate: new Date(),
          status: 'active',
          createdAt: new Date(),
          updatedAt: new Date(),
        }),
        new Subscription({
          id: 'sub-2',
          userId: 'user-2',
          name: 'Spotify',
          amount: 4.99,
          currency: 'USD',
          frequency: 'monthly',
          startDate: new Date(),
          nextDueDate: new Date(),
          status: 'active',
          createdAt: new Date(),
          updatedAt: new Date(),
        }),
      ];

      const dtos = SubscriptionPresentationMapper.toResponseDtoArray(subscriptions);

      expect(dtos).toHaveLength(2);
      expect(dtos[0].id).toBe('sub-1');
      expect(dtos[1].id).toBe('sub-2');
    });
  });
});
