import { Repository } from 'typeorm';
import { EventRepository } from './event.repository';
import { EventEntity } from '../persistence/event.entity';
import { EventMapper } from '../mappers/event.mapper';
import { Event } from '../../domain/event.entity';

jest.mock('../mappers/event.mapper');

function makeDomain(overrides = {}): Event {
  return new Event({
    id: 'evt-1',
    subscriptionId: 'sub-1',
    title: 'Paiement Netflix',
    amount: 9.99,
    startsAt: new Date('2025-01-01'),
    status: 'scheduled',
    ...overrides,
  });
}

function makeEntity(overrides = {}): EventEntity {
  return Object.assign(new EventEntity(), {
    id: 'evt-1',
    subscriptionId: 'sub-1',
    title: 'Paiement Netflix',
    amount: 9.99,
    startsAt: new Date('2025-01-01'),
    status: 'scheduled',
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  });
}

type MockQB = {
  andWhere: jest.Mock;
  orderBy: jest.Mock;
  limit: jest.Mock;
  getMany: jest.Mock;
  update: jest.Mock;
  set: jest.Mock;
  where: jest.Mock;
  execute: jest.Mock;
};

function createQBMock(): MockQB {
  const qb: MockQB = {
    andWhere: jest.fn(),
    orderBy: jest.fn(),
    limit: jest.fn(),
    getMany: jest.fn(),
    update: jest.fn(),
    set: jest.fn(),
    where: jest.fn(),
    execute: jest.fn(),
  };
  qb.andWhere.mockReturnValue(qb);
  qb.orderBy.mockReturnValue(qb);
  qb.limit.mockReturnValue(qb);
  qb.update.mockReturnValue(qb);
  qb.set.mockReturnValue(qb);
  qb.where.mockReturnValue(qb);
  return qb;
}

describe('EventRepository', () => {
  let sut: EventRepository;
  let repo: jest.Mocked<Partial<Repository<EventEntity>>>;

  beforeEach(() => {
    jest.clearAllMocks();
    repo = {
      save: jest.fn(),
      findOne: jest.fn(),
      find: jest.fn(),
      delete: jest.fn(),
      softDelete: jest.fn(),
      createQueryBuilder: jest.fn(),
    };
    sut = new EventRepository(repo as Repository<EventEntity>);
  });

  describe('create', () => {
    it('maps to persistence, saves, and maps back to domain', async () => {
      const domain = makeDomain();
      const entity = makeEntity();
      const saved = makeEntity({ id: 'saved-id' });
      const savedDomain = makeDomain({ id: 'saved-id' });

      (EventMapper.toPersistence as jest.Mock).mockReturnValue(entity);
      (repo.save as jest.Mock).mockResolvedValue(saved);
      (EventMapper.toDomain as jest.Mock).mockReturnValue(savedDomain);

      const result = await sut.create(domain);

      expect(EventMapper.toPersistence).toHaveBeenCalledWith(domain);
      expect(repo.save).toHaveBeenCalledWith(entity);
      expect(result).toBe(savedDomain);
    });
  });

  describe('createMany', () => {
    it('maps array to persistence, saves, and maps back', async () => {
      const domains = [makeDomain(), makeDomain({ id: 'evt-2' })];
      const entities = [makeEntity(), makeEntity({ id: 'evt-2' })];
      const savedEntities = [...entities];
      const savedDomains = [...domains];

      (EventMapper.toPersistence as jest.Mock)
        .mockReturnValueOnce(entities[0])
        .mockReturnValueOnce(entities[1]);
      (repo.save as jest.Mock).mockResolvedValue(savedEntities);
      (EventMapper.toDomainArray as jest.Mock).mockReturnValue(savedDomains);

      const result = await sut.createMany(domains);

      expect(repo.save).toHaveBeenCalledWith(entities);
      expect(result).toBe(savedDomains);
    });
  });

  describe('findById', () => {
    it('returns domain when found', async () => {
      const entity = makeEntity();
      const domain = makeDomain();
      (repo.findOne as jest.Mock).mockResolvedValue(entity);
      (EventMapper.toDomain as jest.Mock).mockReturnValue(domain);

      const result = await sut.findById('evt-1');

      expect(repo.findOne).toHaveBeenCalledWith({ where: { id: 'evt-1' } });
      expect(result).toBe(domain);
    });

    it('returns null when not found', async () => {
      (repo.findOne as jest.Mock).mockResolvedValue(null);
      const result = await sut.findById('missing');
      expect(result).toBeNull();
    });
  });

  describe('findAll', () => {
    it('uses default limit 100 and ASC order when no filters', async () => {
      const qb = createQBMock();
      (repo.createQueryBuilder as jest.Mock).mockReturnValue(qb);
      qb.getMany.mockResolvedValue([]);
      (EventMapper.toDomainArray as jest.Mock).mockReturnValue([]);

      await sut.findAll();

      expect(qb.orderBy).toHaveBeenCalledWith('event.startsAt', 'ASC');
      expect(qb.limit).toHaveBeenCalledWith(100);
    });

    it('applies start date filter', async () => {
      const qb = createQBMock();
      (repo.createQueryBuilder as jest.Mock).mockReturnValue(qb);
      qb.getMany.mockResolvedValue([]);
      (EventMapper.toDomainArray as jest.Mock).mockReturnValue([]);
      const start = new Date('2025-01-01');

      await sut.findAll({ start });

      expect(qb.andWhere).toHaveBeenCalledWith('event.startsAt >= :start', { start });
    });

    it('applies end date filter', async () => {
      const qb = createQBMock();
      (repo.createQueryBuilder as jest.Mock).mockReturnValue(qb);
      qb.getMany.mockResolvedValue([]);
      (EventMapper.toDomainArray as jest.Mock).mockReturnValue([]);
      const end = new Date('2025-12-31');

      await sut.findAll({ end });

      expect(qb.andWhere).toHaveBeenCalledWith('event.startsAt <= :end', { end });
    });

    it('applies subscriptionId filter', async () => {
      const qb = createQBMock();
      (repo.createQueryBuilder as jest.Mock).mockReturnValue(qb);
      qb.getMany.mockResolvedValue([]);
      (EventMapper.toDomainArray as jest.Mock).mockReturnValue([]);

      await sut.findAll({ subscriptionId: 'sub-1' });

      expect(qb.andWhere).toHaveBeenCalledWith('event.subscriptionId = :subscriptionId', { subscriptionId: 'sub-1' });
    });

    it('applies status filter', async () => {
      const qb = createQBMock();
      (repo.createQueryBuilder as jest.Mock).mockReturnValue(qb);
      qb.getMany.mockResolvedValue([]);
      (EventMapper.toDomainArray as jest.Mock).mockReturnValue([]);

      await sut.findAll({ status: 'completed' });

      expect(qb.andWhere).toHaveBeenCalledWith('event.status = :status', { status: 'completed' });
    });

    it('applies paymentStatus filter', async () => {
      const qb = createQBMock();
      (repo.createQueryBuilder as jest.Mock).mockReturnValue(qb);
      qb.getMany.mockResolvedValue([]);
      (EventMapper.toDomainArray as jest.Mock).mockReturnValue([]);

      await sut.findAll({ paymentStatus: 'paid' });

      expect(qb.andWhere).toHaveBeenCalledWith('event.paymentStatus = :paymentStatus', { paymentStatus: 'paid' });
    });

    it('applies custom sort (amount:desc)', async () => {
      const qb = createQBMock();
      (repo.createQueryBuilder as jest.Mock).mockReturnValue(qb);
      qb.getMany.mockResolvedValue([]);
      (EventMapper.toDomainArray as jest.Mock).mockReturnValue([]);

      await sut.findAll({ sort: 'amount:desc' });

      expect(qb.orderBy).toHaveBeenCalledWith('event.amount', 'DESC');
    });

    it('applies limit', async () => {
      const qb = createQBMock();
      (repo.createQueryBuilder as jest.Mock).mockReturnValue(qb);
      qb.getMany.mockResolvedValue([]);
      (EventMapper.toDomainArray as jest.Mock).mockReturnValue([]);

      await sut.findAll({ limit: 5 });

      expect(qb.limit).toHaveBeenCalledWith(5);
    });

    it('uses default sort starts_at:asc when filters provided without sort', async () => {
      const qb = createQBMock();
      (repo.createQueryBuilder as jest.Mock).mockReturnValue(qb);
      qb.getMany.mockResolvedValue([]);
      (EventMapper.toDomainArray as jest.Mock).mockReturnValue([]);

      await sut.findAll({ subscriptionId: 'sub-1' });

      expect(qb.orderBy).toHaveBeenCalledWith('event.startsAt', 'ASC');
    });
  });

  describe('findBySubscriptionId', () => {
    it('returns events ordered by startsAt ASC', async () => {
      const entities = [makeEntity()];
      const domains = [makeDomain()];
      (repo.find as jest.Mock).mockResolvedValue(entities);
      (EventMapper.toDomainArray as jest.Mock).mockReturnValue(domains);

      const result = await sut.findBySubscriptionId('sub-1');

      expect(repo.find).toHaveBeenCalledWith({
        where: { subscriptionId: 'sub-1' },
        order: { startsAt: 'ASC' },
      });
      expect(result).toBe(domains);
    });
  });

  describe('update', () => {
    it('updates and returns domain when found', async () => {
      const domain = makeDomain();
      const existing = makeEntity();
      const updatedEntity = makeEntity({ status: 'completed' });
      const updatedDomain = makeDomain({ status: 'completed' });

      (repo.findOne as jest.Mock).mockResolvedValue(existing);
      (EventMapper.toPersistence as jest.Mock).mockReturnValue(makeEntity());
      (repo.save as jest.Mock).mockResolvedValue(updatedEntity);
      (EventMapper.toDomain as jest.Mock).mockReturnValue(updatedDomain);

      const result = await sut.update('evt-1', domain);

      expect(repo.findOne).toHaveBeenCalledWith({ where: { id: 'evt-1' } });
      expect(result).toBe(updatedDomain);
    });

    it('returns null when not found', async () => {
      (repo.findOne as jest.Mock).mockResolvedValue(null);
      const result = await sut.update('missing', makeDomain());
      expect(result).toBeNull();
    });
  });

  describe('delete', () => {
    it('returns true when affected > 0', async () => {
      (repo.delete as jest.Mock).mockResolvedValue({ affected: 1 });
      expect(await sut.delete('evt-1')).toBe(true);
    });

    it('returns false when affected is 0', async () => {
      (repo.delete as jest.Mock).mockResolvedValue({ affected: 0 });
      expect(await sut.delete('evt-1')).toBe(false);
    });

    it('returns false when affected is undefined', async () => {
      (repo.delete as jest.Mock).mockResolvedValue({ affected: undefined });
      expect(await sut.delete('evt-1')).toBe(false);
    });
  });

  describe('softDelete', () => {
    it('returns true when affected > 0', async () => {
      (repo.softDelete as jest.Mock).mockResolvedValue({ affected: 2 });
      expect(await sut.softDelete('evt-1')).toBe(true);
    });

    it('returns false when affected is 0', async () => {
      (repo.softDelete as jest.Mock).mockResolvedValue({ affected: 0 });
      expect(await sut.softDelete('evt-1')).toBe(false);
    });
  });

  describe('updateFutureEventsStatus', () => {
    it('returns count of affected rows', async () => {
      const qb = createQBMock();
      (repo.createQueryBuilder as jest.Mock).mockReturnValue(qb);
      qb.execute.mockResolvedValue({ affected: 3 });

      const result = await sut.updateFutureEventsStatus('sub-1', 'canceled');

      expect(qb.update).toHaveBeenCalledWith(EventEntity);
      expect(qb.set).toHaveBeenCalledWith({ status: 'canceled' });
      expect(qb.where).toHaveBeenCalledWith('subscriptionId = :subscriptionId', { subscriptionId: 'sub-1' });
      expect(qb.andWhere).toHaveBeenCalledWith('status = :scheduledStatus', { scheduledStatus: 'scheduled' });
      expect(result).toBe(3);
    });

    it('returns 0 when affected is undefined', async () => {
      const qb = createQBMock();
      (repo.createQueryBuilder as jest.Mock).mockReturnValue(qb);
      qb.execute.mockResolvedValue({ affected: undefined });

      const result = await sut.updateFutureEventsStatus('sub-1', 'canceled');

      expect(result).toBe(0);
    });
  });
});
