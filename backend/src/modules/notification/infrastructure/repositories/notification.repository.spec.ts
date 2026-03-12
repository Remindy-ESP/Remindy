import { Repository } from 'typeorm';
import { NotificationRepository } from './notification.repository';
import { NotificationEntity } from '../persistence/notification.entity';
import { NotificationMapper } from '../mappers/notification.mapper';
import { Notification } from '../../domain/notification.entity';

jest.mock('../mappers/notification.mapper');

function makeDomain(overrides = {}): Notification {
  return new Notification({
    id: 'notif-1',
    userId: 'user-1',
    type: 'reminder',
    channel: 'email',
    title: 'Payment Due',
    body: 'Your payment is due soon',
    status: 'pending',
    ...overrides,
  });
}

function makeEntity(overrides = {}): NotificationEntity {
  return Object.assign(new NotificationEntity(), {
    id: 'notif-1',
    userId: 'user-1',
    type: 'reminder',
    channel: 'email',
    title: 'Payment Due',
    body: 'Your payment is due soon',
    status: 'pending',
    createdAt: new Date(),
    ...overrides,
  });
}

type MockQB = {
  andWhere: jest.Mock;
  orderBy: jest.Mock;
  limit: jest.Mock;
  getMany: jest.Mock;
};

function createQBMock(): MockQB {
  const qb: MockQB = {
    andWhere: jest.fn(),
    orderBy: jest.fn(),
    limit: jest.fn(),
    getMany: jest.fn(),
  };
  qb.andWhere.mockReturnValue(qb);
  qb.orderBy.mockReturnValue(qb);
  qb.limit.mockReturnValue(qb);
  return qb;
}

describe('NotificationRepository', () => {
  let sut: NotificationRepository;
  let repo: jest.Mocked<Partial<Repository<NotificationEntity>>>;

  beforeEach(() => {
    jest.clearAllMocks();
    repo = {
      save: jest.fn(),
      findOne: jest.fn(),
      softDelete: jest.fn(),
      createQueryBuilder: jest.fn(),
    };
    sut = new NotificationRepository(repo as Repository<NotificationEntity>);
  });

  describe('findById', () => {
    it('returns domain when found', async () => {
      const entity = makeEntity();
      const domain = makeDomain();
      (repo.findOne as jest.Mock).mockResolvedValue(entity);
      (NotificationMapper.toDomain as jest.Mock).mockReturnValue(domain);

      const result = await sut.findById('notif-1');

      expect(repo.findOne).toHaveBeenCalledWith({ where: { id: 'notif-1' } });
      expect(result).toBe(domain);
    });

    it('returns null when not found', async () => {
      (repo.findOne as jest.Mock).mockResolvedValue(null);
      const result = await sut.findById('missing');
      expect(result).toBeNull();
      expect(NotificationMapper.toDomain).not.toHaveBeenCalled();
    });
  });

  describe('findAll', () => {
    it('filters by userId and uses default sort', async () => {
      const qb = createQBMock();
      (repo.createQueryBuilder as jest.Mock).mockReturnValue(qb);
      qb.getMany.mockResolvedValue([]);
      (NotificationMapper.toDomainArray as jest.Mock).mockReturnValue([]);

      await sut.findAll({ userId: 'user-1' });

      expect(qb.andWhere).toHaveBeenCalledWith('notification.userId = :userId', { userId: 'user-1' });
      expect(qb.orderBy).toHaveBeenCalledWith('notification.createdAt', 'DESC');
    });

    it('applies type filter', async () => {
      const qb = createQBMock();
      (repo.createQueryBuilder as jest.Mock).mockReturnValue(qb);
      qb.getMany.mockResolvedValue([]);
      (NotificationMapper.toDomainArray as jest.Mock).mockReturnValue([]);

      await sut.findAll({ userId: 'user-1', type: 'reminder' });

      expect(qb.andWhere).toHaveBeenCalledWith('notification.type = :type', { type: 'reminder' });
    });

    it('applies channel filter', async () => {
      const qb = createQBMock();
      (repo.createQueryBuilder as jest.Mock).mockReturnValue(qb);
      qb.getMany.mockResolvedValue([]);
      (NotificationMapper.toDomainArray as jest.Mock).mockReturnValue([]);

      await sut.findAll({ userId: 'user-1', channel: 'push' });

      expect(qb.andWhere).toHaveBeenCalledWith('notification.channel = :channel', { channel: 'push' });
    });

    it('applies status filter', async () => {
      const qb = createQBMock();
      (repo.createQueryBuilder as jest.Mock).mockReturnValue(qb);
      qb.getMany.mockResolvedValue([]);
      (NotificationMapper.toDomainArray as jest.Mock).mockReturnValue([]);

      await sut.findAll({ userId: 'user-1', status: 'sent' });

      expect(qb.andWhere).toHaveBeenCalledWith('notification.status = :status', { status: 'sent' });
    });

    it('applies isRead=true filter (readAt IS NOT NULL)', async () => {
      const qb = createQBMock();
      (repo.createQueryBuilder as jest.Mock).mockReturnValue(qb);
      qb.getMany.mockResolvedValue([]);
      (NotificationMapper.toDomainArray as jest.Mock).mockReturnValue([]);

      await sut.findAll({ userId: 'user-1', isRead: true });

      expect(qb.andWhere).toHaveBeenCalledWith('notification.readAt IS NOT NULL');
    });

    it('applies isRead=false filter (readAt IS NULL)', async () => {
      const qb = createQBMock();
      (repo.createQueryBuilder as jest.Mock).mockReturnValue(qb);
      qb.getMany.mockResolvedValue([]);
      (NotificationMapper.toDomainArray as jest.Mock).mockReturnValue([]);

      await sut.findAll({ userId: 'user-1', isRead: false });

      expect(qb.andWhere).toHaveBeenCalledWith('notification.readAt IS NULL');
    });

    it('applies limit', async () => {
      const qb = createQBMock();
      (repo.createQueryBuilder as jest.Mock).mockReturnValue(qb);
      qb.getMany.mockResolvedValue([]);
      (NotificationMapper.toDomainArray as jest.Mock).mockReturnValue([]);

      await sut.findAll({ userId: 'user-1', limit: 10 });

      expect(qb.limit).toHaveBeenCalledWith(10);
    });

    it('applies custom sort sent_at:asc', async () => {
      const qb = createQBMock();
      (repo.createQueryBuilder as jest.Mock).mockReturnValue(qb);
      qb.getMany.mockResolvedValue([]);
      (NotificationMapper.toDomainArray as jest.Mock).mockReturnValue([]);

      await sut.findAll({ userId: 'user-1', sort: 'sent_at:asc' });

      expect(qb.orderBy).toHaveBeenCalledWith('notification.sentAt', 'ASC');
    });

    it('returns mapped domain array', async () => {
      const qb = createQBMock();
      (repo.createQueryBuilder as jest.Mock).mockReturnValue(qb);
      const entities = [makeEntity()];
      const domains = [makeDomain()];
      qb.getMany.mockResolvedValue(entities);
      (NotificationMapper.toDomainArray as jest.Mock).mockReturnValue(domains);

      const result = await sut.findAll({ userId: 'user-1' });

      expect(result).toBe(domains);
    });
  });

  describe('save', () => {
    it('maps to persistence, saves, and maps back', async () => {
      const domain = makeDomain();
      const entity = makeEntity();
      const saved = makeEntity({ id: 'saved-id' });
      const savedDomain = makeDomain({ id: 'saved-id' });

      (NotificationMapper.toPersistence as jest.Mock).mockReturnValue(entity);
      (repo.save as jest.Mock).mockResolvedValue(saved);
      (NotificationMapper.toDomain as jest.Mock).mockReturnValue(savedDomain);

      const result = await sut.save(domain);

      expect(NotificationMapper.toPersistence).toHaveBeenCalledWith(domain);
      expect(repo.save).toHaveBeenCalledWith(entity);
      expect(result).toBe(savedDomain);
    });
  });

  describe('update', () => {
    it('updates and returns domain when found', async () => {
      const domain = makeDomain();
      const existing = makeEntity();
      const updatedEntity = makeEntity({ status: 'sent' });
      const updatedDomain = makeDomain({ status: 'sent' });

      (repo.findOne as jest.Mock).mockResolvedValue(existing);
      (NotificationMapper.toPersistence as jest.Mock).mockReturnValue(makeEntity());
      (repo.save as jest.Mock).mockResolvedValue(updatedEntity);
      (NotificationMapper.toDomain as jest.Mock).mockReturnValue(updatedDomain);

      const result = await sut.update('notif-1', domain);

      expect(repo.findOne).toHaveBeenCalledWith({ where: { id: 'notif-1' } });
      expect(result).toBe(updatedDomain);
    });

    it('returns null when not found', async () => {
      (repo.findOne as jest.Mock).mockResolvedValue(null);
      const result = await sut.update('missing', makeDomain());
      expect(result).toBeNull();
    });
  });

  describe('delete', () => {
    it('calls softDelete on the repository', async () => {
      (repo.softDelete as jest.Mock).mockResolvedValue({ affected: 1 });
      await sut.delete('notif-1');
      expect(repo.softDelete).toHaveBeenCalledWith('notif-1');
    });
  });
});
