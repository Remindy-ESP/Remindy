import { FolderRepository } from './folder.repository';
import { FolderEntity } from './folder.entity';
import { Folder } from '../../domain/folder.entity';
import { Repository } from 'typeorm';

// ── Helpers ────────────────────────────────────────────────────────────────

const makeEntity = (overrides: Partial<FolderEntity> = {}): FolderEntity => {
  const e = new FolderEntity();
  e.id = overrides.id ?? 'e-1';
  e.userId = overrides.userId ?? 'user-1';
  e.name = overrides.name ?? 'Bills';
  e.parentId = overrides.parentId;
  e.color = overrides.color;
  e.icon = overrides.icon;
  e.isDefault = overrides.isDefault ?? false;
  e.createdAt = overrides.createdAt ?? new Date('2024-01-01');
  e.updatedAt = overrides.updatedAt ?? new Date('2024-01-02');
  e.deletedAt = overrides.deletedAt;
  return e;
};

const makeFolder = (overrides: Partial<{
  id: string;
  userId: string;
  name: string;
  parentId: string;
}> = {}): Folder =>
  new Folder({
    id: overrides.id ?? 'f-1',
    userId: overrides.userId ?? 'user-1',
    name: overrides.name ?? 'Bills',
    parentId: overrides.parentId,
  });

// ── QueryBuilder mock ──────────────────────────────────────────────────────

const makeMockQueryBuilder = (result: FolderEntity | FolderEntity[] | null) => {
  const qb = {
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    leftJoin: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    getMany: jest.fn().mockResolvedValue(Array.isArray(result) ? result : result ? [result] : []),
    getOne: jest.fn().mockResolvedValue(Array.isArray(result) ? result[0] : result),
    getRawOne: jest.fn().mockResolvedValue({ count: '5' }),
  };
  return qb as any;
};

// ── Tests ──────────────────────────────────────────────────────────────────

describe('FolderRepository', () => {
  let repo: FolderRepository;
  let mockOrmRepo: jest.Mocked<Repository<FolderEntity>>;

  beforeEach(() => {
    mockOrmRepo = {
      save: jest.fn(),
      findOne: jest.fn(),
      find: jest.fn(),
      delete: jest.fn(),
      softDelete: jest.fn(),
      restore: jest.fn(),
      count: jest.fn(),
      createQueryBuilder: jest.fn(),
      manager: { query: jest.fn() },
    } as any;

    repo = new FolderRepository(mockOrmRepo);
  });

  // ── save ──────────────────────────────────────────────────────────────────

  describe('save()', () => {
    it('should save a folder and return the domain entity', async () => {
      const folder = makeFolder();
      const savedEntity = makeEntity();
      mockOrmRepo.save.mockResolvedValue(savedEntity);

      const result = await repo.save(folder);

      expect(mockOrmRepo.save).toHaveBeenCalled();
      expect(result).toBeInstanceOf(Folder);
    });

    it('should propagate errors', async () => {
      mockOrmRepo.save.mockRejectedValue(new Error('DB error'));

      await expect(repo.save(makeFolder())).rejects.toThrow('DB error');
    });
  });

  // ── findById ──────────────────────────────────────────────────────────────

  describe('findById()', () => {
    it('should return a domain folder when found', async () => {
      mockOrmRepo.findOne.mockResolvedValue(makeEntity());

      const result = await repo.findById('e-1');

      expect(result).toBeInstanceOf(Folder);
      expect(result?.id).toBe('e-1');
    });

    it('should return null when not found', async () => {
      mockOrmRepo.findOne.mockResolvedValue(null);

      const result = await repo.findById('non-existent');

      expect(result).toBeNull();
    });

    it('should propagate errors', async () => {
      mockOrmRepo.findOne.mockRejectedValue(new Error('DB error'));

      await expect(repo.findById('e-1')).rejects.toThrow('DB error');
    });
  });

  // ── findByUserId ──────────────────────────────────────────────────────────

  describe('findByUserId()', () => {
    it('should call queryBuilder with deleted filter by default', async () => {
      const qb = makeMockQueryBuilder([makeEntity()]);
      mockOrmRepo.createQueryBuilder.mockReturnValue(qb);

      const result = await repo.findByUserId('user-1');

      expect(qb.andWhere).toHaveBeenCalledWith('folder.deleted_at IS NULL');
      expect(result).toHaveLength(1);
    });

    it('should skip deleted filter when includeDeleted is true', async () => {
      const qb = makeMockQueryBuilder([makeEntity(), makeEntity({ id: 'e-2', name: 'Other' })]);
      mockOrmRepo.createQueryBuilder.mockReturnValue(qb);

      const result = await repo.findByUserId('user-1', true);

      expect(qb.andWhere).not.toHaveBeenCalled();
      expect(result).toHaveLength(2);
    });

    it('should propagate errors', async () => {
      const qb = makeMockQueryBuilder([]);
      qb.getMany.mockRejectedValue(new Error('DB error'));
      mockOrmRepo.createQueryBuilder.mockReturnValue(qb);

      await expect(repo.findByUserId('user-1')).rejects.toThrow('DB error');
    });
  });

  // ── findRootFoldersByUserId ────────────────────────────────────────────────

  describe('findRootFoldersByUserId()', () => {
    it('should return root folders', async () => {
      mockOrmRepo.find.mockResolvedValue([makeEntity()]);

      const result = await repo.findRootFoldersByUserId('user-1');

      expect(result).toHaveLength(1);
      expect(result[0]).toBeInstanceOf(Folder);
    });

    it('should propagate errors', async () => {
      mockOrmRepo.find.mockRejectedValue(new Error('DB error'));

      await expect(repo.findRootFoldersByUserId('user-1')).rejects.toThrow('DB error');
    });
  });

  // ── findSubfolders ────────────────────────────────────────────────────────

  describe('findSubfolders()', () => {
    it('should return subfolders', async () => {
      mockOrmRepo.find.mockResolvedValue([makeEntity()]);

      const result = await repo.findSubfolders('parent-1');

      expect(result).toHaveLength(1);
    });

    it('should propagate errors', async () => {
      mockOrmRepo.find.mockRejectedValue(new Error('DB error'));

      await expect(repo.findSubfolders('parent-1')).rejects.toThrow('DB error');
    });
  });

  // ── findByNameAndUserId ───────────────────────────────────────────────────

  describe('findByNameAndUserId()', () => {
    it('should return a domain folder when found', async () => {
      const qb = makeMockQueryBuilder(makeEntity());
      mockOrmRepo.createQueryBuilder.mockReturnValue(qb);

      const result = await repo.findByNameAndUserId('Bills', 'user-1');

      expect(result).toBeInstanceOf(Folder);
    });

    it('should return null when not found', async () => {
      const qb = makeMockQueryBuilder(null);
      mockOrmRepo.createQueryBuilder.mockReturnValue(qb);

      const result = await repo.findByNameAndUserId('Unknown', 'user-1');

      expect(result).toBeNull();
    });

    it('should propagate errors', async () => {
      const qb = makeMockQueryBuilder(null);
      qb.getOne.mockRejectedValue(new Error('DB error'));
      mockOrmRepo.createQueryBuilder.mockReturnValue(qb);

      await expect(repo.findByNameAndUserId('Bills', 'user-1')).rejects.toThrow('DB error');
    });
  });

  // ── findDefaultFoldersByUserId ─────────────────────────────────────────────

  describe('findDefaultFoldersByUserId()', () => {
    it('should return default folders', async () => {
      mockOrmRepo.find.mockResolvedValue([makeEntity({ isDefault: true })]);

      const result = await repo.findDefaultFoldersByUserId('user-1');

      expect(result).toHaveLength(1);
      expect(result[0].isDefault).toBe(true);
    });

    it('should propagate errors', async () => {
      mockOrmRepo.find.mockRejectedValue(new Error('DB error'));

      await expect(repo.findDefaultFoldersByUserId('user-1')).rejects.toThrow('DB error');
    });
  });

  // ── delete ────────────────────────────────────────────────────────────────

  describe('delete()', () => {
    it('should hard delete a folder', async () => {
      mockOrmRepo.delete.mockResolvedValue({ affected: 1, raw: {} });

      await expect(repo.delete('e-1')).resolves.toBeUndefined();
      expect(mockOrmRepo.delete).toHaveBeenCalledWith('e-1');
    });

    it('should propagate errors', async () => {
      mockOrmRepo.delete.mockRejectedValue(new Error('DB error'));

      await expect(repo.delete('e-1')).rejects.toThrow('DB error');
    });
  });

  // ── softDelete ────────────────────────────────────────────────────────────

  describe('softDelete()', () => {
    it('should soft delete a folder', async () => {
      mockOrmRepo.softDelete.mockResolvedValue({ affected: 1, raw: {}, generatedMaps: [] });

      await expect(repo.softDelete('e-1')).resolves.toBeUndefined();
      expect(mockOrmRepo.softDelete).toHaveBeenCalledWith('e-1');
    });

    it('should propagate errors', async () => {
      mockOrmRepo.softDelete.mockRejectedValue(new Error('DB error'));

      await expect(repo.softDelete('e-1')).rejects.toThrow('DB error');
    });
  });

  // ── restore ───────────────────────────────────────────────────────────────

  describe('restore()', () => {
    it('should restore a soft-deleted folder', async () => {
      mockOrmRepo.restore.mockResolvedValue({ affected: 1, raw: {}, generatedMaps: [] });

      await expect(repo.restore('e-1')).resolves.toBeUndefined();
      expect(mockOrmRepo.restore).toHaveBeenCalledWith('e-1');
    });

    it('should propagate errors', async () => {
      mockOrmRepo.restore.mockRejectedValue(new Error('DB error'));

      await expect(repo.restore('e-1')).rejects.toThrow('DB error');
    });
  });

  // ── countDocumentsInFolder ────────────────────────────────────────────────

  describe('countDocumentsInFolder()', () => {
    it('should return the document count', async () => {
      const qb = makeMockQueryBuilder([]);
      // getRawOne already returns { count: '5' } by default
      mockOrmRepo.createQueryBuilder.mockReturnValue(qb);

      const result = await repo.countDocumentsInFolder('folder-1');

      expect(result).toBe(5);
    });

    it('should return 0 when getRawOne returns null-like result', async () => {
      const qb = makeMockQueryBuilder([]);
      qb.getRawOne.mockResolvedValue(null);
      mockOrmRepo.createQueryBuilder.mockReturnValue(qb);

      const result = await repo.countDocumentsInFolder('folder-1');

      expect(result).toBe(0);
    });

    it('should propagate errors', async () => {
      const qb = makeMockQueryBuilder([]);
      qb.getRawOne.mockRejectedValue(new Error('DB error'));
      mockOrmRepo.createQueryBuilder.mockReturnValue(qb);

      await expect(repo.countDocumentsInFolder('folder-1')).rejects.toThrow('DB error');
    });
  });

  // ── exists ────────────────────────────────────────────────────────────────

  describe('exists()', () => {
    it('should return true when folder exists', async () => {
      mockOrmRepo.count.mockResolvedValue(1);

      expect(await repo.exists('e-1')).toBe(true);
    });

    it('should return false when folder does not exist', async () => {
      mockOrmRepo.count.mockResolvedValue(0);

      expect(await repo.exists('e-1')).toBe(false);
    });

    it('should propagate errors', async () => {
      mockOrmRepo.count.mockRejectedValue(new Error('DB error'));

      await expect(repo.exists('e-1')).rejects.toThrow('DB error');
    });
  });

  // ── belongsToUser ─────────────────────────────────────────────────────────

  describe('belongsToUser()', () => {
    it('should return true when folder belongs to user', async () => {
      mockOrmRepo.count.mockResolvedValue(1);

      expect(await repo.belongsToUser('folder-1', 'user-1')).toBe(true);
    });

    it('should return false when folder does not belong to user', async () => {
      mockOrmRepo.count.mockResolvedValue(0);

      expect(await repo.belongsToUser('folder-1', 'user-1')).toBe(false);
    });

    it('should propagate errors', async () => {
      mockOrmRepo.count.mockRejectedValue(new Error('DB error'));

      await expect(repo.belongsToUser('folder-1', 'user-1')).rejects.toThrow('DB error');
    });
  });

  // ── moveDocumentsToFolder ─────────────────────────────────────────────────

  describe('moveDocumentsToFolder()', () => {
    it('should run UPDATE query with correct params', async () => {
      (mockOrmRepo.manager.query as jest.Mock).mockResolvedValue(undefined);

      await expect(repo.moveDocumentsToFolder('from-1', 'to-1')).resolves.toBeUndefined();
      expect(mockOrmRepo.manager.query).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE documents'),
        ['to-1', 'from-1'],
      );
    });

    it('should accept null as target folder (move to root)', async () => {
      (mockOrmRepo.manager.query as jest.Mock).mockResolvedValue(undefined);

      await expect(repo.moveDocumentsToFolder('from-1', null)).resolves.toBeUndefined();
      expect(mockOrmRepo.manager.query).toHaveBeenCalledWith(
        expect.any(String),
        [null, 'from-1'],
      );
    });

    it('should propagate errors', async () => {
      (mockOrmRepo.manager.query as jest.Mock).mockRejectedValue(new Error('DB error'));

      await expect(repo.moveDocumentsToFolder('from-1', 'to-1')).rejects.toThrow('DB error');
    });
  });
});
