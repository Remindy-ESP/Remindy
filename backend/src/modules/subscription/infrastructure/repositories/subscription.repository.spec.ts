import { Repository } from 'typeorm';
import { SubscriptionRepository } from './subscription.repository';
import { SubscriptionEntity } from '../persistence/subscription.entity';
import { SubscriptionMapper } from '../mappers/subscription.mapper';
import { makeSubscription as makeDomain, makeSubscriptionEntity as makeEntity } from '../../__fixtures__/subscription.fixtures';

jest.mock('../mappers/subscription.mapper');

type MockQB = {
  leftJoinAndSelect: jest.Mock;
  andWhere: jest.Mock;
  orderBy: jest.Mock;
  getMany: jest.Mock;
};

function createQBMock(): MockQB {
  const qb: MockQB = {
    leftJoinAndSelect: jest.fn(),
    andWhere: jest.fn(),
    orderBy: jest.fn(),
    getMany: jest.fn(),
  };
  qb.leftJoinAndSelect.mockReturnValue(qb);
  qb.andWhere.mockReturnValue(qb);
  qb.orderBy.mockReturnValue(qb);
  return qb;
}

describe('SubscriptionRepository', () => {
  let sut: SubscriptionRepository;
  let repo: jest.Mocked<Partial<Repository<SubscriptionEntity>>>;

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
    sut = new SubscriptionRepository(repo as Repository<SubscriptionEntity>);
  });

  describe('create', () => {
    it('maps to persistence, saves, and maps back to domain', async () => {
      const domain = makeDomain();
      const entity = makeEntity();
      const saved = makeEntity({ name: 'saved' });
      const savedDomain = makeDomain({ name: 'saved' });

      (SubscriptionMapper.toPersistence as jest.Mock).mockReturnValue(entity);
      (repo.save as jest.Mock).mockResolvedValue(saved);
      (SubscriptionMapper.toDomain as jest.Mock).mockReturnValue(savedDomain);

      const result = await sut.create(domain);

      expect(SubscriptionMapper.toPersistence).toHaveBeenCalledWith(domain);
      expect(repo.save).toHaveBeenCalledWith(entity);
      expect(result).toBe(savedDomain);
    });
  });

  describe('findById', () => {
    it('returns domain when found', async () => {
      const entity = makeEntity();
      const domain = makeDomain();
      (repo.findOne as jest.Mock).mockResolvedValue(entity);
      (SubscriptionMapper.toDomain as jest.Mock).mockReturnValue(domain);

      const result = await sut.findById('sub-1');

      expect(repo.findOne).toHaveBeenCalledWith({ where: { id: 'sub-1' }, relations: ['category'] });
      expect(result).toBe(domain);
    });

    it('returns null when not found', async () => {
      (repo.findOne as jest.Mock).mockResolvedValue(null);
      const result = await sut.findById('missing');
      expect(result).toBeNull();
    });
  });

  describe('findAll', () => {
    it('returns all subscriptions without filters', async () => {
      const qb = createQBMock();
      (repo.createQueryBuilder as jest.Mock).mockReturnValue(qb);
      const entities = [makeEntity()];
      const domains = [makeDomain()];
      qb.getMany.mockResolvedValue(entities);
      (SubscriptionMapper.toDomainArray as jest.Mock).mockReturnValue(domains);

      const result = await sut.findAll();

      expect(result).toBe(domains);
      expect(qb.andWhere).not.toHaveBeenCalled();
    });

    it('applies userId filter', async () => {
      const qb = createQBMock();
      (repo.createQueryBuilder as jest.Mock).mockReturnValue(qb);
      qb.getMany.mockResolvedValue([]);
      (SubscriptionMapper.toDomainArray as jest.Mock).mockReturnValue([]);

      await sut.findAll({ userId: 'user-1' });

      expect(qb.andWhere).toHaveBeenCalledWith('subscription.userId = :userId', { userId: 'user-1' });
    });

    it('applies contractId filter', async () => {
      const qb = createQBMock();
      (repo.createQueryBuilder as jest.Mock).mockReturnValue(qb);
      qb.getMany.mockResolvedValue([]);
      (SubscriptionMapper.toDomainArray as jest.Mock).mockReturnValue([]);

      await sut.findAll({ contractId: 42 });

      expect(qb.andWhere).toHaveBeenCalledWith('subscription.contractId = :contractId', { contractId: 42 });
    });

    it('applies name filter (ILIKE)', async () => {
      const qb = createQBMock();
      (repo.createQueryBuilder as jest.Mock).mockReturnValue(qb);
      qb.getMany.mockResolvedValue([]);
      (SubscriptionMapper.toDomainArray as jest.Mock).mockReturnValue([]);

      await sut.findAll({ name: 'net' });

      expect(qb.andWhere).toHaveBeenCalledWith('subscription.name ILIKE :name', { name: '%net%' });
    });

    it('applies currency filter', async () => {
      const qb = createQBMock();
      (repo.createQueryBuilder as jest.Mock).mockReturnValue(qb);
      qb.getMany.mockResolvedValue([]);
      (SubscriptionMapper.toDomainArray as jest.Mock).mockReturnValue([]);

      await sut.findAll({ currency: 'EUR' });

      expect(qb.andWhere).toHaveBeenCalledWith('subscription.currency = :currency', { currency: 'EUR' });
    });

    it('applies frequency filter', async () => {
      const qb = createQBMock();
      (repo.createQueryBuilder as jest.Mock).mockReturnValue(qb);
      qb.getMany.mockResolvedValue([]);
      (SubscriptionMapper.toDomainArray as jest.Mock).mockReturnValue([]);

      await sut.findAll({ frequency: 'monthly' });

      expect(qb.andWhere).toHaveBeenCalledWith('subscription.frequency = :frequency', { frequency: 'monthly' });
    });

    it('applies status filter', async () => {
      const qb = createQBMock();
      (repo.createQueryBuilder as jest.Mock).mockReturnValue(qb);
      qb.getMany.mockResolvedValue([]);
      (SubscriptionMapper.toDomainArray as jest.Mock).mockReturnValue([]);

      await sut.findAll({ status: 'active' });

      expect(qb.andWhere).toHaveBeenCalledWith('subscription.status = :status', { status: 'active' });
    });

    it('applies categoryId filter', async () => {
      const qb = createQBMock();
      (repo.createQueryBuilder as jest.Mock).mockReturnValue(qb);
      qb.getMany.mockResolvedValue([]);
      (SubscriptionMapper.toDomainArray as jest.Mock).mockReturnValue([]);

      await sut.findAll({ categoryId: 'cat-1' });

      expect(qb.andWhere).toHaveBeenCalledWith('subscription.categoryId = :categoryId', { categoryId: 'cat-1' });
    });
  });

  describe('findByFrequency', () => {
    it('returns subscriptions for given frequency', async () => {
      const entities = [makeEntity()];
      const domains = [makeDomain()];
      (repo.find as jest.Mock).mockResolvedValue(entities);
      (SubscriptionMapper.toDomainArray as jest.Mock).mockReturnValue(domains);

      const result = await sut.findByFrequency('monthly');

      expect(repo.find).toHaveBeenCalledWith({
        where: { frequency: 'monthly' },
        order: { createdAt: 'DESC' },
      });
      expect(result).toBe(domains);
    });
  });

  describe('update', () => {
    it('updates and returns domain when found', async () => {
      const domain = makeDomain();
      const entity = makeEntity();
      const updatedEntity = makeEntity({ name: 'Updated' });
      const updatedDomain = makeDomain({ name: 'Updated' });

      (repo.findOne as jest.Mock).mockResolvedValue(entity);
      (SubscriptionMapper.toPersistence as jest.Mock).mockReturnValue(makeEntity());
      (repo.save as jest.Mock).mockResolvedValue(updatedEntity);
      (SubscriptionMapper.toDomain as jest.Mock).mockReturnValue(updatedDomain);

      const result = await sut.update('sub-1', domain);

      expect(repo.findOne).toHaveBeenCalledWith({ where: { id: 'sub-1' } });
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
      expect(await sut.delete('sub-1')).toBe(true);
    });

    it('returns false when affected is 0', async () => {
      (repo.delete as jest.Mock).mockResolvedValue({ affected: 0 });
      expect(await sut.delete('sub-1')).toBe(false);
    });

    it('returns false when affected is undefined', async () => {
      (repo.delete as jest.Mock).mockResolvedValue({ affected: undefined });
      expect(await sut.delete('sub-1')).toBe(false);
    });
  });

  describe('softDelete', () => {
    it('returns true when affected > 0', async () => {
      (repo.softDelete as jest.Mock).mockResolvedValue({ affected: 1 });
      expect(await sut.softDelete('sub-1')).toBe(true);
    });

    it('returns false when affected is 0', async () => {
      (repo.softDelete as jest.Mock).mockResolvedValue({ affected: 0 });
      expect(await sut.softDelete('sub-1')).toBe(false);
    });
  });
});
