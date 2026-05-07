import { FolderPersistenceMapper } from './folder-persistence.mapper';
import { Folder } from '../../domain/folder.entity';
import { FolderEntity } from './folder.entity';

const makeEntity = (overrides: Partial<FolderEntity> = {}): FolderEntity => {
  const e = new FolderEntity();
  e.id = overrides.id ?? 'entity-1';
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
  color: string;
  icon: string;
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date;
}> = {}): Folder =>
  new Folder({
    id: overrides.id ?? 'folder-1',
    userId: overrides.userId ?? 'user-1',
    name: overrides.name ?? 'Bills',
    parentId: overrides.parentId,
    color: overrides.color,
    icon: overrides.icon,
    isDefault: overrides.isDefault ?? false,
    createdAt: overrides.createdAt ?? new Date('2024-01-01'),
    updatedAt: overrides.updatedAt ?? new Date('2024-01-02'),
    deletedAt: overrides.deletedAt,
  });

describe('FolderPersistenceMapper', () => {
  describe('toPersistence()', () => {
    it('should map a full domain folder to a persistence entity', () => {
      const now = new Date();
      const folder = makeFolder({
        id: 'f-1',
        parentId: 'p-1',
        color: '#3B82F6',
        icon: '📁',
        isDefault: true,
        createdAt: now,
        updatedAt: now,
        deletedAt: now,
      });

      const entity = FolderPersistenceMapper.toPersistence(folder);

      expect(entity).toBeInstanceOf(FolderEntity);
      expect(entity.id).toBe('f-1');
      expect(entity.userId).toBe('user-1');
      expect(entity.name).toBe('Bills');
      expect(entity.parentId).toBe('p-1');
      expect(entity.color).toBe('#3B82F6');
      expect(entity.icon).toBe('📁');
      expect(entity.isDefault).toBe(true);
      expect(entity.createdAt).toBe(now);
      expect(entity.updatedAt).toBe(now);
      expect(entity.deletedAt).toBe(now);
    });

    it('should not set entity.id when domain folder has no id', () => {
      const folder = new Folder({ userId: 'user-1', name: 'No ID' });
      const entity = FolderPersistenceMapper.toPersistence(folder);
      // id is not assigned so it stays as FolderEntity default (undefined/auto-generated)
      expect(entity.userId).toBe('user-1');
    });

    it('should not set entity.createdAt/updatedAt when domain folder has none', () => {
      const folder = new Folder({ userId: 'user-1', name: 'No dates' });
      const entity = FolderPersistenceMapper.toPersistence(folder);
      // Those should remain unset (TypeORM auto fills them on insert)
      expect(entity.createdAt).toBeUndefined();
      expect(entity.updatedAt).toBeUndefined();
    });

    it('should not set entity.deletedAt when domain folder is not deleted', () => {
      const folder = makeFolder();
      const entity = FolderPersistenceMapper.toPersistence(folder);
      expect(entity.deletedAt).toBeUndefined();
    });
  });

  describe('toDomain()', () => {
    it('should map a persistence entity to a domain folder', () => {
      const now = new Date();
      const entity = makeEntity({
        id: 'e-1',
        parentId: 'p-1',
        color: '#10B981',
        icon: '📋',
        isDefault: true,
        createdAt: now,
        updatedAt: now,
        deletedAt: now,
      });

      const folder = FolderPersistenceMapper.toDomain(entity);

      expect(folder).toBeInstanceOf(Folder);
      expect(folder.id).toBe('e-1');
      expect(folder.userId).toBe('user-1');
      expect(folder.name).toBe('Bills');
      expect(folder.parentId).toBe('p-1');
      expect(folder.color).toBe('#10B981');
      expect(folder.icon).toBe('📋');
      expect(folder.isDefault).toBe(true);
      expect(folder.createdAt).toBe(now);
      expect(folder.updatedAt).toBe(now);
      expect(folder.deletedAt).toBe(now);
    });

    it('should map a minimal entity', () => {
      const entity = makeEntity({ parentId: undefined, color: undefined, icon: undefined });
      const folder = FolderPersistenceMapper.toDomain(entity);

      expect(folder.parentId).toBeUndefined();
      expect(folder.color).toBeUndefined();
      expect(folder.icon).toBeUndefined();
    });
  });

  describe('toDomainArray()', () => {
    it('should map an array of entities to domain folders', () => {
      const entities = [makeEntity({ id: 'e-1' }), makeEntity({ id: 'e-2', name: 'Contrats' })];
      const folders = FolderPersistenceMapper.toDomainArray(entities);

      expect(folders).toHaveLength(2);
      expect(folders[0]).toBeInstanceOf(Folder);
      expect(folders[0].id).toBe('e-1');
      expect(folders[1].name).toBe('Contrats');
    });

    it('should return an empty array when given an empty array', () => {
      expect(FolderPersistenceMapper.toDomainArray([])).toEqual([]);
    });
  });

  describe('toPersistenceArray()', () => {
    it('should map an array of domain folders to persistence entities', () => {
      const folders = [makeFolder({ id: 'f-1' }), makeFolder({ id: 'f-2', name: 'Contrats' })];
      const entities = FolderPersistenceMapper.toPersistenceArray(folders);

      expect(entities).toHaveLength(2);
      expect(entities[0]).toBeInstanceOf(FolderEntity);
      expect(entities[0].id).toBe('f-1');
      expect(entities[1].name).toBe('Contrats');
    });

    it('should return an empty array when given an empty array', () => {
      expect(FolderPersistenceMapper.toPersistenceArray([])).toEqual([]);
    });
  });
});
