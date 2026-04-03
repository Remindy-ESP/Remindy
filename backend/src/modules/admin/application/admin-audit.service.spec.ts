import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { AdminCloudService } from './admin-cloud.service';
import { Role } from 'src/modules/auth/domain/value-objects/role.enum';
import { AdminDocumentsQueryDto } from '../presentation/dto/admin-documents-query.dto';
import { AdminSubscriptionsQueryDto } from '../presentation/dto/admin-subscriptions-query.dto';
import { UpdateSharedSubscriptionDto } from '../presentation/dto/update-shared-subscription.dto';

jest.mock('../presentation/permissions/admin-permissions.map', () => ({
  permissionsForRole: (role: Role) => {
    if (role === Role.SUPER_ADMIN) {
      return [
        'admin.subscriptions.read',
        'admin.subscriptions.write',
        'admin.cloud.read',
        'admin.cloud.write',
      ];
    }
    if (role === Role.USER_ADMIN) {
      return ['admin.subscriptions.read'];
    }
    return [];
  },
}));

const mockQb = {
  where: jest.fn().mockReturnThis(),
  andWhere: jest.fn().mockReturnThis(),
  orderBy: jest.fn().mockReturnThis(),
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

beforeEach(() => {
  jest.clearAllMocks();
  mockSubscriptionsRepo.createQueryBuilder.mockReturnValue(mockQb);
  mockDocumentsRepo.createQueryBuilder.mockReturnValue(mockQb);
  mockQb.getManyAndCount.mockResolvedValue([[], 0]);
});

describe('AdminCloudService.listSubscriptions()', () => {
  it('retourne items, total, page, limit', async () => {
    const subs = [makeSubscription(), makeSubscription({ id: 'sub-2' })];
    mockQb.getManyAndCount.mockResolvedValue([subs, 2]);

    const result = await makeService().listSubscriptions(userAdmin, {
      page: 1,
      limit: 20,
    } as AdminSubscriptionsQueryDto);

    expect(result).toEqual({ items: subs, total: 2, page: 1, limit: 20 });
  });

  it('applique le filtre userId', async () => {
    await makeService().listSubscriptions(userAdmin, {
      userId: 'user-abc',
      page: 1,
      limit: 20,
    } as AdminSubscriptionsQueryDto);
    expect(mockQb.andWhere).toHaveBeenCalledWith('s.userId = :userId', { userId: 'user-abc' });
  });

  it('applique le filtre status', async () => {
    await makeService().listSubscriptions(userAdmin, {
      status: 'active',
      page: 1,
      limit: 20,
    } as AdminSubscriptionsQueryDto);
    expect(mockQb.andWhere).toHaveBeenCalledWith('s.status = :status', { status: 'active' });
  });

  it('applique le filtre frequency', async () => {
    await makeService().listSubscriptions(userAdmin, {
      frequency: 'monthly',
      page: 1,
      limit: 20,
    } as AdminSubscriptionsQueryDto);
    expect(mockQb.andWhere).toHaveBeenCalledWith('s.frequency = :frequency', {
      frequency: 'monthly',
    });
  });

  it('applique le filtre name en ILIKE', async () => {
    await makeService().listSubscriptions(userAdmin, {
      name: 'netflix',
      page: 1,
      limit: 20,
    } as AdminSubscriptionsQueryDto);
    expect(mockQb.andWhere).toHaveBeenCalledWith('s.name ILIKE :name', { name: '%netflix%' });
  });

  it('applique les filtres amountMin et amountMax', async () => {
    await makeService().listSubscriptions(userAdmin, {
      amountMin: 5,
      amountMax: 50,
      page: 1,
      limit: 20,
    } as AdminSubscriptionsQueryDto);
    expect(mockQb.andWhere).toHaveBeenCalledWith('s.amount >= :amountMin', { amountMin: 5 });
    expect(mockQb.andWhere).toHaveBeenCalledWith('s.amount <= :amountMax', { amountMax: 50 });
  });

  it('applique les filtres createdFrom et createdTo', async () => {
    await makeService().listSubscriptions(userAdmin, {
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

  it("n'applique aucun andWhere si aucun filtre", async () => {
    await makeService().listSubscriptions(userAdmin, {
      page: 1,
      limit: 20,
    } as AdminSubscriptionsQueryDto);
    expect(mockQb.andWhere).not.toHaveBeenCalled();
  });

  it('applique la pagination — page 3, limit 10 → skip 20', async () => {
    await makeService().listSubscriptions(userAdmin, {
      page: 3,
      limit: 10,
    } as AdminSubscriptionsQueryDto);
    expect(mockQb.skip).toHaveBeenCalledWith(20);
    expect(mockQb.take).toHaveBeenCalledWith(10);
  });

  it('lève ForbiddenException pour un rôle sans SUBSCRIPTIONS_READ', async () => {
    await expect(
      makeService().listSubscriptions({ role: Role.USER }, {
        page: 1,
        limit: 20,
      } as AdminSubscriptionsQueryDto),
    ).rejects.toThrow(ForbiddenException);
    expect(mockQb.getManyAndCount).not.toHaveBeenCalled();
  });
});

describe('AdminCloudService.updateSharedSubscription()', () => {
  it('met à jour et retourne la subscription', async () => {
    const sub = makeSubscription();
    mockSubscriptionsRepo.findOne.mockResolvedValue(sub);
    mockSubscriptionsRepo.save.mockResolvedValue({ ...sub, name: 'Disney+' });

    const result = await makeService().updateSharedSubscription(superAdmin, 'sub-1', {
      name: 'Disney+',
    } as UpdateSharedSubscriptionDto);

    expect(mockSubscriptionsRepo.save).toHaveBeenCalledWith({ ...sub, name: 'Disney+' });
    expect(result.name).toBe('Disney+');
  });

  it('lève NotFoundException si subscription introuvable', async () => {
    mockSubscriptionsRepo.findOne.mockResolvedValue(null);

    await expect(
      makeService().updateSharedSubscription(
        superAdmin,
        'inexistant',
        {} as UpdateSharedSubscriptionDto,
      ),
    ).rejects.toThrow(NotFoundException);
    expect(mockSubscriptionsRepo.save).not.toHaveBeenCalled();
  });

  it('lève ForbiddenException pour USER_ADMIN (pas CLOUD_WRITE)', async () => {
    await expect(
      makeService().updateSharedSubscription(userAdmin, 'sub-1', {} as UpdateSharedSubscriptionDto),
    ).rejects.toThrow(ForbiddenException);
    expect(mockSubscriptionsRepo.findOne).not.toHaveBeenCalled();
  });
});

describe('AdminCloudService.listDocuments()', () => {
  it('retourne items, total, page, limit', async () => {
    const docs = [makeDocument(), makeDocument({ id: 'doc-2' })];
    mockQb.getManyAndCount.mockResolvedValue([docs, 2]);

    const result = await makeService().listDocuments(superAdmin, {
      page: 1,
      limit: 20,
    } as AdminDocumentsQueryDto);

    expect(result).toEqual({ items: docs, total: 2, page: 1, limit: 20 });
  });

  it('applique le filtre userId', async () => {
    await makeService().listDocuments(superAdmin, {
      userId: 'user-abc',
      page: 1,
      limit: 20,
    } as AdminDocumentsQueryDto);
    expect(mockQb.andWhere).toHaveBeenCalledWith('d.userId = :userId', { userId: 'user-abc' });
  });

  it('applique le filtre ocrStatus', async () => {
    await makeService().listDocuments(superAdmin, {
      ocrStatus: 'failed',
      page: 1,
      limit: 20,
    } as AdminDocumentsQueryDto);
    expect(mockQb.andWhere).toHaveBeenCalledWith('d.ocrStatus = :ocrStatus', {
      ocrStatus: 'failed',
    });
  });

  it('applique le filtre filename en ILIKE', async () => {
    await makeService().listDocuments(superAdmin, {
      filename: 'facture',
      page: 1,
      limit: 20,
    } as AdminDocumentsQueryDto);
    expect(mockQb.andWhere).toHaveBeenCalledWith('d.filename ILIKE :filename', {
      filename: '%facture%',
    });
  });

  it('applique le filtre mimeType', async () => {
    await makeService().listDocuments(superAdmin, {
      mimeType: 'application/pdf',
      page: 1,
      limit: 20,
    } as AdminDocumentsQueryDto);
    expect(mockQb.andWhere).toHaveBeenCalledWith('d.mimeType = :mimeType', {
      mimeType: 'application/pdf',
    });
  });

  it('applique le filtre subscriptionId', async () => {
    await makeService().listDocuments(superAdmin, {
      subscriptionId: 'sub-abc',
      page: 1,
      limit: 20,
    } as AdminDocumentsQueryDto);
    expect(mockQb.andWhere).toHaveBeenCalledWith('d.subscriptionId = :subId', { subId: 'sub-abc' });
  });

  it('applique les filtres uploadedFrom et uploadedTo', async () => {
    await makeService().listDocuments(superAdmin, {
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

  it("n'applique aucun andWhere si aucun filtre", async () => {
    await makeService().listDocuments(superAdmin, { page: 1, limit: 20 } as AdminDocumentsQueryDto);
    expect(mockQb.andWhere).not.toHaveBeenCalled();
  });

  it('applique la pagination — page 2, limit 10 → skip 10', async () => {
    await makeService().listDocuments(superAdmin, { page: 2, limit: 10 } as AdminDocumentsQueryDto);
    expect(mockQb.skip).toHaveBeenCalledWith(10);
    expect(mockQb.take).toHaveBeenCalledWith(10);
  });

  it('lève ForbiddenException pour USER_ADMIN (pas CLOUD_READ)', async () => {
    await expect(
      makeService().listDocuments(userAdmin, { page: 1, limit: 20 } as AdminDocumentsQueryDto),
    ).rejects.toThrow(ForbiddenException);
    expect(mockQb.getManyAndCount).not.toHaveBeenCalled();
  });
});

describe('AdminCloudService.reprocessOcr()', () => {
  it('appelle le use case avec les bons paramètres (force: true)', async () => {
    const doc = makeDocument({ ocrStatus: 'failed' });
    mockDocumentsRepo.findOne.mockResolvedValue(doc);
    mockReprocessOcrUseCase.execute.mockResolvedValue({ ...doc, ocrStatus: 'pending' });

    await makeService().reprocessOcr(superAdmin, 'doc-1', true);

    expect(mockReprocessOcrUseCase.execute).toHaveBeenCalledWith('doc-1', doc.userId, {
      force: true,
    });
  });

  it('appelle le use case avec force: false', async () => {
    const doc = makeDocument();
    mockDocumentsRepo.findOne.mockResolvedValue(doc);
    mockReprocessOcrUseCase.execute.mockResolvedValue(doc);

    await makeService().reprocessOcr(superAdmin, 'doc-1', false);

    expect(mockReprocessOcrUseCase.execute).toHaveBeenCalledWith('doc-1', doc.userId, {
      force: false,
    });
  });

  it('lève NotFoundException si document introuvable', async () => {
    mockDocumentsRepo.findOne.mockResolvedValue(null);

    await expect(makeService().reprocessOcr(superAdmin, 'inexistant', true)).rejects.toThrow(
      NotFoundException,
    );
    expect(mockReprocessOcrUseCase.execute).not.toHaveBeenCalled();
  });

  it('lève ForbiddenException pour USER_ADMIN avant le findOne', async () => {
    await expect(makeService().reprocessOcr(userAdmin, 'doc-1', true)).rejects.toThrow(
      ForbiddenException,
    );
    expect(mockDocumentsRepo.findOne).not.toHaveBeenCalled();
  });

  it("propage l'erreur du use case", async () => {
    mockDocumentsRepo.findOne.mockResolvedValue(makeDocument());
    mockReprocessOcrUseCase.execute.mockRejectedValue(new Error('Queue failure'));

    await expect(makeService().reprocessOcr(superAdmin, 'doc-1', true)).rejects.toThrow(
      'Queue failure',
    );
  });
});
