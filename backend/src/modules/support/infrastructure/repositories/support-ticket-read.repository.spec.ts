import { getRepositoryToken } from '@nestjs/typeorm';
import { Test, TestingModule } from '@nestjs/testing';
import { Repository } from 'typeorm';
import { SupportTicketReadRepository } from './support-ticket-read.repository';
import { SupportTicketEntity } from 'src/infrastructure/database/entities';
import { SupportTicketAuthorType } from '../../domain/enums/support-ticket-author-type.enum';

type MockQB = {
  leftJoinAndSelect: jest.Mock;
  where: jest.Mock;
  andWhere: jest.Mock;
  orderBy: jest.Mock;
  skip: jest.Mock;
  take: jest.Mock;
  getManyAndCount: jest.Mock;
};

function createQBMock(): MockQB {
  const qb: any = {
    leftJoinAndSelect: jest.fn(),
    where: jest.fn(),
    andWhere: jest.fn(),
    orderBy: jest.fn(),
    skip: jest.fn(),
    take: jest.fn(),
    getManyAndCount: jest.fn(),
  };
  qb.leftJoinAndSelect.mockReturnValue(qb);
  qb.where.mockReturnValue(qb);
  qb.andWhere.mockReturnValue(qb);
  qb.orderBy.mockReturnValue(qb);
  qb.skip.mockReturnValue(qb);
  qb.take.mockReturnValue(qb);
  return qb;
}

function makeTicketEntity(overrides: Partial<any> = {}): any {
  return {
    id: 'ticket-1',
    subject: 'Test subject',
    status: 'open',
    priority: 'medium',
    category: null,
    createdAt: new Date('2025-01-01'),
    updatedAt: new Date('2025-01-01'),
    lastReplyAt: null,
    closedAt: null,
    userId: 'user-1',
    assignedAdmin: null,
    messages: [],
    ...overrides,
  };
}

describe('SupportTicketReadRepository', () => {
  let sut: SupportTicketReadRepository;
  let ticketsRepo: jest.Mocked<Partial<Repository<SupportTicketEntity>>>;

  beforeEach(async () => {
    ticketsRepo = {
      createQueryBuilder: jest.fn(),
      findOne: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SupportTicketReadRepository,
        {
          provide: getRepositoryToken(SupportTicketEntity),
          useValue: ticketsRepo,
        },
      ],
    }).compile();

    sut = module.get<SupportTicketReadRepository>(SupportTicketReadRepository);
  });

  describe('listMine', () => {
    it('should return paginated list with basic filters', async () => {
      const qb = createQBMock();
      ticketsRepo.createQueryBuilder!.mockReturnValue(qb as any);

      const ticket = makeTicketEntity();
      qb.getManyAndCount.mockResolvedValue([[ticket], 1]);

      const result = await sut.listMine('user-1', { page: 1, limit: 10 });

      expect(result.total).toBe(1);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(10);
      expect(result.items).toHaveLength(1);
      expect(result.items[0].id).toBe('ticket-1');
      expect(result.items[0].assignedAdmin).toBeNull();
    });

    it('should apply status filter when provided', async () => {
      const qb = createQBMock();
      ticketsRepo.createQueryBuilder!.mockReturnValue(qb as any);
      qb.getManyAndCount.mockResolvedValue([[], 0]);

      await sut.listMine('user-1', { page: 1, limit: 10, status: 'open' as any });

      expect(qb.andWhere).toHaveBeenCalledWith('ticket.status = :status', { status: 'open' });
    });

    it('should apply category filter when provided', async () => {
      const qb = createQBMock();
      ticketsRepo.createQueryBuilder!.mockReturnValue(qb as any);
      qb.getManyAndCount.mockResolvedValue([[], 0]);

      await sut.listMine('user-1', { page: 1, limit: 10, category: 'billing' as any });

      expect(qb.andWhere).toHaveBeenCalledWith('ticket.category = :category', {
        category: 'billing',
      });
    });

    it('should not apply status or category filter when not provided', async () => {
      const qb = createQBMock();
      ticketsRepo.createQueryBuilder!.mockReturnValue(qb as any);
      qb.getManyAndCount.mockResolvedValue([[], 0]);

      await sut.listMine('user-1', { page: 1, limit: 10 });

      expect(qb.andWhere).not.toHaveBeenCalled();
    });

    it('should map assignedAdmin when present', async () => {
      const qb = createQBMock();
      ticketsRepo.createQueryBuilder!.mockReturnValue(qb as any);

      const ticket = makeTicketEntity({
        assignedAdmin: {
          id: 'admin-1',
          email: 'admin@example.com',
          firstName: 'Admin',
          lastName: 'User',
        },
      });
      qb.getManyAndCount.mockResolvedValue([[ticket], 1]);

      const result = await sut.listMine('user-1', { page: 2, limit: 5 });

      expect(result.page).toBe(2);
      expect(result.limit).toBe(5);
      expect(result.items[0].assignedAdmin).toEqual({
        id: 'admin-1',
        email: 'admin@example.com',
        firstName: 'Admin',
        lastName: 'User',
      });
    });

    it('should calculate correct skip offset for pagination', async () => {
      const qb = createQBMock();
      ticketsRepo.createQueryBuilder!.mockReturnValue(qb as any);
      qb.getManyAndCount.mockResolvedValue([[], 0]);

      await sut.listMine('user-1', { page: 3, limit: 20 });

      expect(qb.skip).toHaveBeenCalledWith(40); // (3-1)*20 = 40
      expect(qb.take).toHaveBeenCalledWith(20);
    });
  });

  describe('findMineById', () => {
    it('should return null when ticket not found', async () => {
      ticketsRepo.findOne!.mockResolvedValue(null);

      const result = await sut.findMineById('user-1', 'ticket-999');

      expect(result).toBeNull();
    });

    it('should return mapped ticket with messages and no admin', async () => {
      const ticket = makeTicketEntity({
        messages: [
          {
            id: 'msg-1',
            authorType: SupportTicketAuthorType.USER,
            body: 'Hello',
            createdAt: new Date('2025-01-01'),
            authorUser: {
              id: 'user-1',
              email: 'user@example.com',
              firstName: 'User',
              lastName: 'Test',
            },
            authorAdmin: null,
          },
        ],
      });
      ticketsRepo.findOne!.mockResolvedValue(ticket);

      const result = await sut.findMineById('user-1', 'ticket-1');

      expect(result).not.toBeNull();
      expect(result!.messages).toHaveLength(1);
      expect(result!.messages[0].authorType).toBe(SupportTicketAuthorType.USER);
      expect(result!.messages[0].author).toEqual({
        id: 'user-1',
        email: 'user@example.com',
        firstName: 'User',
        lastName: 'Test',
      });
    });

    it('should map admin author for admin messages', async () => {
      const ticket = makeTicketEntity({
        messages: [
          {
            id: 'msg-2',
            authorType: SupportTicketAuthorType.ADMIN,
            body: 'Reply from admin',
            createdAt: new Date('2025-01-02'),
            authorUser: null,
            authorAdmin: {
              id: 'admin-1',
              email: 'admin@example.com',
              firstName: 'Admin',
              lastName: 'Person',
            },
          },
        ],
      });
      ticketsRepo.findOne!.mockResolvedValue(ticket);

      const result = await sut.findMineById('user-1', 'ticket-1');

      expect(result!.messages[0].authorType).toBe(SupportTicketAuthorType.ADMIN);
      expect(result!.messages[0].author).toEqual({
        id: 'admin-1',
        email: 'admin@example.com',
        firstName: 'Admin',
        lastName: 'Person',
      });
    });

    it('should return null author for SYSTEM type messages', async () => {
      const ticket = makeTicketEntity({
        messages: [
          {
            id: 'msg-3',
            authorType: SupportTicketAuthorType.SYSTEM,
            body: 'System message',
            createdAt: new Date('2025-01-03'),
            authorUser: null,
            authorAdmin: null,
          },
        ],
      });
      ticketsRepo.findOne!.mockResolvedValue(ticket);

      const result = await sut.findMineById('user-1', 'ticket-1');

      expect(result!.messages[0].author).toBeNull();
    });

    it('should return null author for USER type when authorUser is null', async () => {
      const ticket = makeTicketEntity({
        messages: [
          {
            id: 'msg-4',
            authorType: SupportTicketAuthorType.USER,
            body: 'User message without user',
            createdAt: new Date('2025-01-04'),
            authorUser: null,
            authorAdmin: null,
          },
        ],
      });
      ticketsRepo.findOne!.mockResolvedValue(ticket);

      const result = await sut.findMineById('user-1', 'ticket-1');

      expect(result!.messages[0].author).toBeNull();
    });

    it('should return null author for ADMIN type when authorAdmin is null', async () => {
      const ticket = makeTicketEntity({
        messages: [
          {
            id: 'msg-5',
            authorType: SupportTicketAuthorType.ADMIN,
            body: 'Admin message without admin',
            createdAt: new Date('2025-01-05'),
            authorUser: null,
            authorAdmin: null,
          },
        ],
      });
      ticketsRepo.findOne!.mockResolvedValue(ticket);

      const result = await sut.findMineById('user-1', 'ticket-1');

      expect(result!.messages[0].author).toBeNull();
    });

    it('should handle null messages array gracefully', async () => {
      const ticket = makeTicketEntity({ messages: null });
      ticketsRepo.findOne!.mockResolvedValue(ticket);

      const result = await sut.findMineById('user-1', 'ticket-1');

      expect(result!.messages).toHaveLength(0);
    });

    it('should map assignedAdmin in findMineById', async () => {
      const ticket = makeTicketEntity({
        assignedAdmin: {
          id: 'admin-1',
          email: 'admin@example.com',
          firstName: 'Admin',
          lastName: 'User',
        },
      });
      ticketsRepo.findOne!.mockResolvedValue(ticket);

      const result = await sut.findMineById('user-1', 'ticket-1');

      expect(result!.assignedAdmin).toEqual({
        id: 'admin-1',
        email: 'admin@example.com',
        firstName: 'Admin',
        lastName: 'User',
      });
    });
  });

  describe('findMineRecordById', () => {
    it('should return the raw ticket entity when found', async () => {
      const ticket = makeTicketEntity();
      ticketsRepo.findOne!.mockResolvedValue(ticket);

      const result = await sut.findMineRecordById('user-1', 'ticket-1');

      expect(result).toEqual(ticket);
      expect(ticketsRepo.findOne).toHaveBeenCalledWith({
        where: { id: 'ticket-1', userId: 'user-1' },
      });
    });

    it('should return null when ticket not found', async () => {
      ticketsRepo.findOne!.mockResolvedValue(null);

      const result = await sut.findMineRecordById('user-1', 'ticket-999');

      expect(result).toBeNull();
    });
  });
});
