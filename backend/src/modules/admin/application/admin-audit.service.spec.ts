import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { AdminCloudService } from './admin-cloud.service';
import { Role } from 'src/modules/auth/domain/value-objects/role.enum';
import { AdminDocumentsQueryDto } from '../presentation/dto/admin-documents-query.dto';
import { AdminSubscriptionsQueryDto } from '../presentation/dto/admin-subscriptions-query.dto';

// --- Mocks ---

const mockQb = {
  where: jest.fn().mockReturnThis(),
  andWhere: jest.fn().mockReturnThis(),
  orderBy: jest.fn().mockReturnThis(),
  addOrderBy: jest.fn().mockReturnThis(),
  skip: jest.fn().mockReturnThis(),
  take: jest.fn().mockReturnThis(),
  getManyAndCount: jest.fn(),
};

const mockSubscriptionsRepo = {
  createQueryBuilder: jest.fn(() => mockQb),
  findOne: jest.fn(),
  save: jest.fn(),
};

const mockDocumentsRepo = {
  createQueryBuilder: jest.fn(() => mockQb),
  findOne: jest.fn(),
};

const mockReprocessOcrUseCase = {
  execute: jest.fn(),
};

const makeService = () =>
  new AdminCloudService(
    mockSubscriptionsRepo as any,
    mockDocumentsRepo as any,
    mockReprocessOcrUseCase as any,
  );

// --- Fixtures ---

const superAdmin = { role: Role.SUPER_ADMIN };
const userAdmin = { role: Role.USER_ADMIN };

const makeSubscription = (overrides: Partial<any> = {}) => ({
  id: 'sub-1',
  userId: 'user-1',
  name: 'Netflix',
  amount: 15,
  currency: 'EUR',
  status: 'active',
  frequency: 'monthly',
  createdAt: new Date('2026-01-01'),
  deletedAt: null,
  ...overrides,
});

const makeDocument = (overrides: Partial<any> = {}) => ({
  id: 'doc-1',
  userId: 'user-1',
  filename: 'facture.pdf',
  ocrStatus: 'completed',
  mimeType: 'application/pdf',
  fileSize: '147366',
  uploadedAt: new Date('2026-01-01'),
  deletedAt: null,
  ...overrides,
});

// --- Setup ---

beforeEach(() => {
  jest.clearAllMocks();

  mockSubscriptionsRepo.createQueryBuilder.mockReturnValue(mockQb);
  mockDocumentsRepo.createQueryBuilder.mockReturnValue(mockQb);

  mockQb.getManyAndCount.mockResolvedValue([[], 0]);
});

// --- assertPermission ---

describe('assertPermission', () => {
  it("leve ForbiddenException si le role n'a pas la permission", async () => {
    const service = makeService();
    const query = { page: 1, limit: 20 } as AdminDocumentsQueryDto;

    await expect(service.listDocuments(userAdmin, query)).rejects.toThrow(ForbiddenException);
  });

  it("ne leve pas d'exception si le role a la permission", async () => {
    const service = makeService();
    const query = { page: 1, limit: 20 } as AdminSubscriptionsQueryDto;

    await expect(service.listSubscriptions(userAdmin, query)).resolves.not.toThrow();
  });
});

// --- listSubscriptions ---

describe('listSubscriptions', () => {
  it('retourne items, total, page, limit', async () => {
    const subs = [makeSubscription(), makeSubscription({ id: 'sub-2' })];
    mockQb.getManyAndCount.mockResolvedValue([subs, 2]);

    const service = makeService();
    const result = await service.listSubscriptions(userAdmin, {
      page: 1,
      limit: 20,
    } as AdminSubscriptionsQueryDto);

    expect(result).toEqual({ items: subs, total: 2, page: 1, limit: 20 });
  });

  it('applique le filtre userId', async () => {
    const service = makeService();

    await service.listSubscriptions(userAdmin, {
      userId: 'user-abc',
      page: 1,
      limit: 20,
    } as AdminSubscriptionsQueryDto);

    expect(mockQb.andWhere).toHaveBeenCalledWith('s.userId = :userId', { userId: 'user-abc' });
  });

  it('applique le filtre status', async () => {
    const service = makeService();

    await service.listSubscriptions(userAdmin, {
      status: 'active',
      page: 1,
      limit: 20,
    } as AdminSubscriptionsQueryDto);

    expect(mockQb.andWhere).toHaveBeenCalledWith('s.status = :status', { status: 'active' });
  });

  it('applique le filtre frequency', async () => {
    const service = makeService();

    await service.listSubscriptions(userAdmin, {
      frequency: 'monthly',
      page: 1,
      limit: 20,
    } as AdminSubscriptionsQueryDto);

    expect(mockQb.andWhere).toHaveBeenCalledWith('s.frequency = :frequency', {
      frequency: 'monthly',
    });
  });

  it('applique le filtre currency', async () => {
    const service = makeService();

    await service.listSubscriptions(userAdmin, {
      currency: 'EUR',
      page: 1,
      limit: 20,
    } as AdminSubscriptionsQueryDto);

    expect(mockQb.andWhere).toHaveBeenCalledWith('s.currency = :currency', {
      currency: 'EUR',
    });
  });

  it('applique le filtre name en ILIKE', async () => {
    const service = makeService();

    await service.listSubscriptions(userAdmin, {
      name: 'netflix',
      page: 1,
      limit: 20,
    } as AdminSubscriptionsQueryDto);

    expect(mockQb.andWhere).toHaveBeenCalledWith('s.name ILIKE :name', {
      name: '%netflix%',
    });
  });

  it('applique les filtres amountMin et amountMax', async () => {
    const service = makeService();

    await service.listSubscriptions(userAdmin, {
      amountMin: 5,
      amountMax: 50,
      page: 1,
      limit: 20,
    } as AdminSubscriptionsQueryDto);

    expect(mockQb.andWhere).toHaveBeenCalledWith('s.amount >= :amountMin', { amountMin: 5 });
    expect(mockQb.andWhere).toHaveBeenCalledWith('s.amount <= :amountMax', { amountMax: 50 });
  });

  it('applique les filtres createdFrom et createdTo', async () => {
    const service = makeService();

    await service.listSubscriptions(userAdmin, {
      createdFrom: '2026-01-01',
      createdTo: '2026-12-31',
      page: 1,
      limit: 20,
    } as AdminSubscriptionsQueryDto);

    expect(mockQb.andWhere).toHaveBeenCalledWith('s.createdAt >= :createdFrom', {
      createdFrom: new Date('2026-01-01'),
    });
    expect(mockQb.andWhere).toHaveBeenCalledWith('s.createdAt <= :createdTo', {
      createdTo: new Date('2026-12-31'),
    });
  });

  it("n'applique aucun filtre si les champs sont absents", async () => {
    const service = makeService();

    await service.listSubscriptions(userAdmin, {
      page: 1,
      limit: 20,
    } as AdminSubscriptionsQueryDto);

    expect(mockQb.andWhere).not.toHaveBeenCalled();
  });

  it('applique le tri par defaut', async () => {
    const service = makeService();

    await service.listSubscriptions(userAdmin, {
      page: 1,
      limit: 20,
    } as AdminSubscriptionsQueryDto);

    expect(mockQb.orderBy).toHaveBeenCalledWith('s.createdAt', 'DESC');
    expect(mockQb.addOrderBy).toHaveBeenCalledWith('s.id', 'DESC');
  });

  it('applique un tri personnalise', async () => {
    const service = makeService();

    await service.listSubscriptions(userAdmin, {
      sortBy: 'amount',
      sortDir: 'ASC',
      page: 1,
      limit: 20,
    } as AdminSubscriptionsQueryDto);

    expect(mockQb.orderBy).toHaveBeenCalledWith('s.amount', 'ASC');
    expect(mockQb.addOrderBy).toHaveBeenCalledWith('s.id', 'DESC');
  });

  it('applique la pagination', async () => {
    const service = makeService();

    await service.listSubscriptions(userAdmin, {
      page: 3,
      limit: 10,
    } as AdminSubscriptionsQueryDto);

    expect(mockQb.skip).toHaveBeenCalledWith(20);
    expect(mockQb.take).toHaveBeenCalledWith(10);
  });

  it('leve ForbiddenException pour un role sans permission', async () => {
    const service = makeService();

    await expect(
      service.listSubscriptions({ role: Role.USER }, {
        page: 1,
        limit: 20,
      } as AdminSubscriptionsQueryDto),
    ).rejects.toThrow(ForbiddenException);
  });
});

// --- updateSharedSubscription ---

describe('updateSharedSubscription', () => {
  it('met a jour et retourne la subscription', async () => {
    const sub = makeSubscription();
    mockSubscriptionsRepo.findOne.mockResolvedValue(sub);
    mockSubscriptionsRepo.save.mockResolvedValue({ ...sub, name: 'Disney+' });

    const service = makeService();
    const result = await service.updateSharedSubscription(superAdmin, 'sub-1', {
      name: 'Disney+',
    } as UpdateSharedSubscriptionDto);

    expect(mockSubscriptionsRepo.save).toHaveBeenCalledWith({ ...sub, name: 'Disney+' });
    expect(result.name).toBe('Disney+');
  });

  it('leve NotFoundException si subscription introuvable', async () => {
    mockSubscriptionsRepo.findOne.mockResolvedValue(null);

    const service = makeService();

    await expect(
      service.updateSharedSubscription(superAdmin, 'inexistant', {} as UpdateSharedSubscriptionDto),
    ).rejects.toThrow(NotFoundException);
  });

  it('leve ForbiddenException pour user_admin sans CLOUD_WRITE', async () => {
    const service = makeService();

    await expect(
      service.updateSharedSubscription(userAdmin, 'sub-1', {} as UpdateSharedSubscriptionDto),
    ).rejects.toThrow(ForbiddenException);
  });
});

// --- listDocuments ---

describe('listDocuments', () => {
  it('retourne items, total, page, limit', async () => {
    const docs = [makeDocument(), makeDocument({ id: 'doc-2' })];
    mockQb.getManyAndCount.mockResolvedValue([docs, 2]);

    const service = makeService();
    const result = await service.listDocuments(superAdmin, {
      page: 1,
      limit: 20,
    } as AdminDocumentsQueryDto);

    expect(result).toEqual({ items: docs, total: 2, page: 1, limit: 20 });
  });

  it('applique le filtre userId', async () => {
    const service = makeService();

    await service.listDocuments(superAdmin, {
      userId: 'user-abc',
      page: 1,
      limit: 20,
    } as AdminDocumentsQueryDto);

    expect(mockQb.andWhere).toHaveBeenCalledWith('d.userId = :userId', { userId: 'user-abc' });
  });

  it('applique le filtre subscriptionId', async () => {
    await makeService().listDocuments(superAdmin, {
      subscriptionId: 'sub-abc',
      page: 1,
      limit: 20,
    } as AdminDocumentsQueryDto);

    expect(mockQb.andWhere).toHaveBeenCalledWith('d.subscriptionId = :subscriptionId', {
      subscriptionId: 'sub-abc',
    });
  });

  it('applique le filtre ocrStatus', async () => {
    const service = makeService();

    await service.listDocuments(superAdmin, {
      ocrStatus: 'failed',
      page: 1,
      limit: 20,
    } as AdminDocumentsQueryDto);

    expect(mockQb.andWhere).toHaveBeenCalledWith('d.ocrStatus = :ocrStatus', {
      ocrStatus: 'failed',
    });
  });

  it('applique le filtre mimeType', async () => {
    const service = makeService();

    await service.listDocuments(superAdmin, {
      mimeType: 'application/pdf',
      page: 1,
      limit: 20,
    } as AdminDocumentsQueryDto);

    expect(mockQb.andWhere).toHaveBeenCalledWith('d.mimeType = :mimeType', {
      mimeType: 'application/pdf',
    });
  });

  it('applique le filtre filename en ILIKE', async () => {
    const service = makeService();

    await service.listDocuments(superAdmin, {
      filename: 'facture',
      page: 1,
      limit: 20,
    } as AdminDocumentsQueryDto);

    expect(mockQb.andWhere).toHaveBeenCalledWith('d.filename ILIKE :filename', {
      filename: '%facture%',
    });
  });

  it('applique les filtres uploadedFrom et uploadedTo', async () => {
    const service = makeService();

    await service.listDocuments(superAdmin, {
      uploadedFrom: '2026-01-01',
      uploadedTo: '2026-12-31',
      page: 1,
      limit: 20,
    } as AdminDocumentsQueryDto);

    expect(mockQb.andWhere).toHaveBeenCalledWith('d.uploadedAt >= :uploadedFrom', {
      uploadedFrom: new Date('2026-01-01'),
    });
    expect(mockQb.andWhere).toHaveBeenCalledWith('d.uploadedAt <= :uploadedTo', {
      uploadedTo: new Date('2026-12-31'),
    });
  });

  it("n'applique aucun filtre si les champs sont absents", async () => {
    const service = makeService();

    await service.listDocuments(superAdmin, {
      page: 1,
      limit: 20,
    } as AdminDocumentsQueryDto);

    expect(mockQb.andWhere).not.toHaveBeenCalled();
  });

  it('applique le tri par defaut', async () => {
    const service = makeService();

    await service.listDocuments(superAdmin, {
      page: 1,
      limit: 20,
    } as AdminDocumentsQueryDto);

    expect(mockQb.orderBy).toHaveBeenCalledWith('d.uploadedAt', 'DESC');
    expect(mockQb.addOrderBy).toHaveBeenCalledWith('d.id', 'DESC');
  });

  it('applique un tri personnalise', async () => {
    const service = makeService();

    await service.listDocuments(superAdmin, {
      sortBy: 'filename',
      sortDir: 'ASC',
      page: 1,
      limit: 20,
    } as AdminDocumentsQueryDto);

    expect(mockQb.orderBy).toHaveBeenCalledWith('d.filename', 'ASC');
    expect(mockQb.addOrderBy).toHaveBeenCalledWith('d.id', 'DESC');
  });

  it('applique le tri fileSize avec CAST', async () => {
    const service = makeService();

    await service.listDocuments(superAdmin, {
      sortBy: 'fileSize',
      sortDir: 'ASC',
      page: 1,
      limit: 20,
    } as AdminDocumentsQueryDto);

    expect(mockQb.orderBy).toHaveBeenCalledWith('CAST(d.fileSize AS integer)', 'ASC');
    expect(mockQb.addOrderBy).toHaveBeenCalledWith('d.id', 'DESC');
  });

  it('applique la pagination', async () => {
    const service = makeService();

    await service.listDocuments(superAdmin, {
      page: 2,
      limit: 10,
    } as AdminDocumentsQueryDto);

    expect(mockQb.skip).toHaveBeenCalledWith(10);
    expect(mockQb.take).toHaveBeenCalledWith(10);
  });

  it('leve ForbiddenException pour user_admin sans CLOUD_READ', async () => {
    const service = makeService();

    await expect(
      service.listDocuments(userAdmin, {
        page: 1,
        limit: 20,
      } as AdminDocumentsQueryDto),
    ).rejects.toThrow(ForbiddenException);
  });
});

// --- reprocessOcr ---

describe('reprocessOcr', () => {
  it('appelle execute avec les bons parametres', async () => {
    const doc = makeDocument({ ocrStatus: 'failed' });
    mockDocumentsRepo.findOne.mockResolvedValue(doc);
    mockReprocessOcrUseCase.execute.mockResolvedValue({ ...doc, ocrStatus: 'pending' });

    const service = makeService();

    await service.reprocessOcr(superAdmin, 'doc-1', true);

    expect(mockReprocessOcrUseCase.execute).toHaveBeenCalledWith('doc-1', doc.userId, {
      force: true,
    });
  });

  it('transmet force false correctement', async () => {
    const doc = makeDocument({ ocrStatus: 'failed' });
    mockDocumentsRepo.findOne.mockResolvedValue(doc);
    mockReprocessOcrUseCase.execute.mockResolvedValue(doc);

    const service = makeService();

    await service.reprocessOcr(superAdmin, 'doc-1', false);

    expect(mockReprocessOcrUseCase.execute).toHaveBeenCalledWith('doc-1', doc.userId, {
      force: false,
    });
  });

  it('leve NotFoundException si document introuvable', async () => {
    mockDocumentsRepo.findOne.mockResolvedValue(null);

    const service = makeService();

    await expect(service.reprocessOcr(superAdmin, 'inexistant', true)).rejects.toThrow(
      NotFoundException,
    );
    expect(mockReprocessOcrUseCase.execute).not.toHaveBeenCalled();
  });

  it('leve ForbiddenException pour user_admin avant le findOne', async () => {
    const service = makeService();

    await expect(service.reprocessOcr(userAdmin, 'doc-1', true)).rejects.toThrow(
      ForbiddenException,
    );
    expect(mockDocumentsRepo.findOne).not.toHaveBeenCalled();
  });

  it("propage l'erreur du use-case", async () => {
    const doc = makeDocument();
    mockDocumentsRepo.findOne.mockResolvedValue(doc);
    mockReprocessOcrUseCase.execute.mockRejectedValue(new Error('Queue failure'));

    const service = makeService();

    await expect(service.reprocessOcr(superAdmin, 'doc-1', true)).rejects.toThrow('Queue failure');
  });
});
