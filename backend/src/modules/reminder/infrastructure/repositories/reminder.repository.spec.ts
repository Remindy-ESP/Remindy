import { ReminderRepository } from './reminder.repository';
import { ReminderEntity } from '../persistence/reminder.entity';
import { Reminder } from '../../domain/reminder.entity';
import { Repository } from 'typeorm';
import { ReminderFilterAppDto } from '../../application/dto/reminder-filter-app.dto';

// ── Helpers ────────────────────────────────────────────────────────────────

const makeEntity = (overrides: Partial<ReminderEntity> = {}): ReminderEntity => {
  const e = new ReminderEntity();
  e.id = overrides.id ?? 'rem-1';
  e.userId = overrides.userId ?? 'user-1';
  e.subscriptionId = overrides.subscriptionId;
  e.type = overrides.type ?? 'payment_due';
  e.daysBefore = overrides.daysBefore ?? 3;
  e.enabled = overrides.enabled ?? true;
  e.channel = overrides.channel ?? 'email';
  e.createdAt = overrides.createdAt ?? new Date('2024-01-01');
  e.updatedAt = overrides.updatedAt ?? new Date('2024-01-02');
  e.deletedAt = overrides.deletedAt;
  return e;
};

const makeReminder = (overrides: Partial<{
  id: string;
  userId: string;
  subscriptionId: string;
  type: Reminder['type'];
  daysBefore: number;
  enabled: boolean;
  channel: Reminder['channel'];
}> = {}): Reminder =>
  new Reminder({
    id: overrides.id ?? 'rem-1',
    userId: overrides.userId ?? 'user-1',
    subscriptionId: overrides.subscriptionId,
    type: overrides.type ?? 'payment_due',
    daysBefore: overrides.daysBefore ?? 3,
    enabled: overrides.enabled ?? true,
    channel: overrides.channel ?? 'email',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-02'),
  });

// ── QueryBuilder mock ──────────────────────────────────────────────────────

const makeMockQueryBuilder = (entities: ReminderEntity[] = []) => {
  const qb: any = {
    andWhere: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    getMany: jest.fn().mockResolvedValue(entities),
  };
  return qb;
};

// ── Tests ──────────────────────────────────────────────────────────────────

describe('ReminderRepository', () => {
  let repo: ReminderRepository;
  let mockOrmRepo: jest.Mocked<Repository<ReminderEntity>>;

  beforeEach(() => {
    mockOrmRepo = {
      findOne: jest.fn(),
      save: jest.fn(),
      softDelete: jest.fn(),
      createQueryBuilder: jest.fn(),
    } as any;

    repo = new ReminderRepository(mockOrmRepo);
  });

  // ── findById ──────────────────────────────────────────────────────────────

  describe('findById()', () => {
    it('should return a domain Reminder when found', async () => {
      mockOrmRepo.findOne.mockResolvedValue(makeEntity());

      const result = await repo.findById('rem-1');

      expect(result).toBeInstanceOf(Reminder);
      expect(result?.id).toBe('rem-1');
    });

    it('should return null when not found', async () => {
      mockOrmRepo.findOne.mockResolvedValue(null);

      const result = await repo.findById('non-existent');

      expect(result).toBeNull();
    });
  });

  // ── findAll ───────────────────────────────────────────────────────────────

  describe('findAll()', () => {
    it('should apply userId filter', async () => {
      const filters: ReminderFilterAppDto = { userId: 'user-1' };
      const qb = makeMockQueryBuilder([makeEntity()]);
      mockOrmRepo.createQueryBuilder.mockReturnValue(qb);

      const result = await repo.findAll(filters);

      expect(qb.andWhere).toHaveBeenCalledWith('reminder.deletedAt IS NULL');
      expect(qb.andWhere).toHaveBeenCalledWith('reminder.userId = :userId', { userId: 'user-1' });
      expect(result).toHaveLength(1);
      expect(result[0]).toBeInstanceOf(Reminder);
    });

    it('should apply subscriptionId filter when provided', async () => {
      const filters: ReminderFilterAppDto = { userId: 'user-1', subscriptionId: 'sub-1' };
      const qb = makeMockQueryBuilder([]);
      mockOrmRepo.createQueryBuilder.mockReturnValue(qb);

      await repo.findAll(filters);

      expect(qb.andWhere).toHaveBeenCalledWith(
        'reminder.subscriptionId = :subscriptionId',
        { subscriptionId: 'sub-1' },
      );
    });

    it('should apply type filter when provided', async () => {
      const filters: ReminderFilterAppDto = { userId: 'user-1', type: 'payment_due' };
      const qb = makeMockQueryBuilder([]);
      mockOrmRepo.createQueryBuilder.mockReturnValue(qb);

      await repo.findAll(filters);

      expect(qb.andWhere).toHaveBeenCalledWith('reminder.type = :type', { type: 'payment_due' });
    });

    it('should apply enabled filter when provided', async () => {
      const filters: ReminderFilterAppDto = { userId: 'user-1', enabled: true };
      const qb = makeMockQueryBuilder([]);
      mockOrmRepo.createQueryBuilder.mockReturnValue(qb);

      await repo.findAll(filters);

      expect(qb.andWhere).toHaveBeenCalledWith('reminder.enabled = :enabled', { enabled: true });
    });

    it('should apply limit when provided', async () => {
      const filters: ReminderFilterAppDto = { userId: 'user-1', limit: 10 };
      const qb = makeMockQueryBuilder([]);
      mockOrmRepo.createQueryBuilder.mockReturnValue(qb);

      await repo.findAll(filters);

      expect(qb.limit).toHaveBeenCalledWith(10);
    });

    it('should not apply limit when not provided', async () => {
      const filters: ReminderFilterAppDto = { userId: 'user-1' };
      const qb = makeMockQueryBuilder([]);
      mockOrmRepo.createQueryBuilder.mockReturnValue(qb);

      await repo.findAll(filters);

      expect(qb.limit).not.toHaveBeenCalled();
    });

    it('should default sort to created_at:desc when not provided', async () => {
      const filters: ReminderFilterAppDto = { userId: 'user-1' };
      const qb = makeMockQueryBuilder([]);
      mockOrmRepo.createQueryBuilder.mockReturnValue(qb);

      await repo.findAll(filters);

      expect(qb.orderBy).toHaveBeenCalledWith('reminder.createdAt', 'DESC');
    });

    it('should use updated_at field when sort field is not created_at', async () => {
      const filters: ReminderFilterAppDto = { userId: 'user-1', sort: 'updated_at:asc' };
      const qb = makeMockQueryBuilder([]);
      mockOrmRepo.createQueryBuilder.mockReturnValue(qb);

      await repo.findAll(filters);

      expect(qb.orderBy).toHaveBeenCalledWith('reminder.updatedAt', 'ASC');
    });

    it('should apply no optional filters when all are absent', async () => {
      const filters: ReminderFilterAppDto = { userId: 'user-1' };
      const qb = makeMockQueryBuilder([makeEntity(), makeEntity({ id: 'rem-2' })]);
      mockOrmRepo.createQueryBuilder.mockReturnValue(qb);

      const result = await repo.findAll(filters);

      expect(result).toHaveLength(2);
    });
  });

  // ── save ──────────────────────────────────────────────────────────────────

  describe('save()', () => {
    it('should save and return a domain Reminder', async () => {
      const reminder = makeReminder();
      const savedEntity = makeEntity();
      mockOrmRepo.save.mockResolvedValue(savedEntity);

      const result = await repo.save(reminder);

      expect(mockOrmRepo.save).toHaveBeenCalled();
      expect(result).toBeInstanceOf(Reminder);
    });
  });

  // ── update ────────────────────────────────────────────────────────────────

  describe('update()', () => {
    it('should return the updated domain Reminder when found', async () => {
      const reminder = makeReminder();
      const existingEntity = makeEntity();
      const updatedEntity = makeEntity({ daysBefore: 7 });

      mockOrmRepo.findOne.mockResolvedValue(existingEntity);
      mockOrmRepo.save.mockResolvedValue(updatedEntity);

      const result = await repo.update('rem-1', reminder);

      expect(result).toBeInstanceOf(Reminder);
      expect(mockOrmRepo.save).toHaveBeenCalled();
    });

    it('should set entity id before saving during update', async () => {
      const reminder = makeReminder({ id: undefined as any });
      const existingEntity = makeEntity();
      const updatedEntity = makeEntity();

      mockOrmRepo.findOne.mockResolvedValue(existingEntity);
      mockOrmRepo.save.mockResolvedValue(updatedEntity);

      await repo.update('rem-1', reminder);

      const savedArg = (mockOrmRepo.save as jest.Mock).mock.calls[0][0] as ReminderEntity;
      expect(savedArg.id).toBe('rem-1');
    });

    it('should return null when reminder to update is not found', async () => {
      mockOrmRepo.findOne.mockResolvedValue(null);

      const result = await repo.update('non-existent', makeReminder());

      expect(result).toBeNull();
      expect(mockOrmRepo.save).not.toHaveBeenCalled();
    });
  });

  // ── delete ────────────────────────────────────────────────────────────────

  describe('delete()', () => {
    it('should soft-delete the reminder', async () => {
      mockOrmRepo.softDelete.mockResolvedValue({ affected: 1, raw: {}, generatedMaps: [] });

      await expect(repo.delete('rem-1')).resolves.toBeUndefined();
      expect(mockOrmRepo.softDelete).toHaveBeenCalledWith('rem-1');
    });
  });
});
