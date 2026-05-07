import { FolderPresentationMapper } from './folder-presentation.mapper';
import { Folder } from '../../domain/folder.entity';
import { FolderFilterDto } from '../dto/folder.dto';

const makeFolder = (
  overrides: Partial<{
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
  }> = {},
): Folder =>
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

describe('FolderPresentationMapper', () => {
  describe('toResponseDto()', () => {
    it('should map a folder to a response DTO without documentCount', () => {
      const folder = makeFolder();
      const dto = FolderPresentationMapper.toResponseDto(folder);

      expect(dto.id).toBe('folder-1');
      expect(dto.userId).toBe('user-1');
      expect(dto.name).toBe('Bills');
      expect(dto.isDefault).toBe(false);
      expect(dto.documentCount).toBeUndefined();
    });

    it('should map a folder with optional fields and documentCount', () => {
      const now = new Date();
      const folder = makeFolder({
        parentId: 'parent-1',
        color: '#3B82F6',
        icon: '📁',
        isDefault: true,
        deletedAt: now,
      });
      const dto = FolderPresentationMapper.toResponseDto(folder, 7);

      expect(dto.parentId).toBe('parent-1');
      expect(dto.color).toBe('#3B82F6');
      expect(dto.icon).toBe('📁');
      expect(dto.isDefault).toBe(true);
      expect(dto.deletedAt).toBe(now);
      expect(dto.documentCount).toBe(7);
    });
  });

  describe('toResponseDtoArray()', () => {
    it('should map an array of folders without counts', () => {
      const folders = [makeFolder({ id: 'f-1' }), makeFolder({ id: 'f-2', name: 'Contrats' })];
      const dtos = FolderPresentationMapper.toResponseDtoArray(folders);

      expect(dtos).toHaveLength(2);
      expect(dtos[0].id).toBe('f-1');
      expect(dtos[0].documentCount).toBeUndefined();
    });

    it('should map folders with a documentCounts map', () => {
      const folders = [makeFolder({ id: 'f-1' }), makeFolder({ id: 'f-2', name: 'Contrats' })];
      const counts = new Map<string, number>([
        ['f-1', 3],
        ['f-2', 0],
      ]);

      const dtos = FolderPresentationMapper.toResponseDtoArray(folders, counts);

      expect(dtos[0].documentCount).toBe(3);
      expect(dtos[1].documentCount).toBe(0);
    });

    it('should handle folders with no matching count in map', () => {
      const folders = [makeFolder({ id: 'f-1' })];
      const counts = new Map<string, number>(); // empty map

      const dtos = FolderPresentationMapper.toResponseDtoArray(folders, counts);

      expect(dtos[0].documentCount).toBeUndefined();
    });

    it('should return empty array for empty input', () => {
      expect(FolderPresentationMapper.toResponseDtoArray([])).toEqual([]);
    });
  });

  describe('toCreateAppDto()', () => {
    it('should map userId and dto fields to app DTO', () => {
      const presentationDto = { name: 'My Folder', parentId: 'p-1', color: '#FF0000', icon: '📂' };
      const appDto = FolderPresentationMapper.toCreateAppDto('user-1', presentationDto);

      expect(appDto.userId).toBe('user-1');
      expect(appDto.name).toBe('My Folder');
      expect(appDto.parentId).toBe('p-1');
      expect(appDto.color).toBe('#FF0000');
      expect(appDto.icon).toBe('📂');
    });

    it('should handle missing optional fields gracefully', () => {
      const presentationDto = { name: 'Simple' };
      const appDto = FolderPresentationMapper.toCreateAppDto('user-1', presentationDto);

      expect(appDto.parentId).toBeUndefined();
      expect(appDto.color).toBeUndefined();
      expect(appDto.icon).toBeUndefined();
    });
  });

  describe('toUpdateAppDto()', () => {
    it('should map all update fields', () => {
      const presentationDto = { name: 'New', color: '#00FF00', icon: '⚡', parentId: 'p-2' };
      const appDto = FolderPresentationMapper.toUpdateAppDto(presentationDto);

      expect(appDto.name).toBe('New');
      expect(appDto.color).toBe('#00FF00');
      expect(appDto.icon).toBe('⚡');
      expect(appDto.parentId).toBe('p-2');
    });
  });

  describe('toFilterAppDto()', () => {
    it('should map filter DTO with userId', () => {
      const filterDto: FolderFilterDto = { parentId: 'p-1', isDefault: true, includeDeleted: true };
      const appDto = FolderPresentationMapper.toFilterAppDto('user-1', filterDto);

      expect(appDto.userId).toBe('user-1');
      expect(appDto.parentId).toBe('p-1');
      expect(appDto.isDefault).toBe(true);
      expect(appDto.includeDeleted).toBe(true);
    });

    it('should default includeDeleted to false', () => {
      const filterDto: FolderFilterDto = {};
      const appDto = FolderPresentationMapper.toFilterAppDto('user-1', filterDto);

      expect(appDto.includeDeleted).toBe(false);
    });
  });

  describe('toMoveDocumentAppDto()', () => {
    it('should map userId, folderId, documentId', () => {
      const appDto = FolderPresentationMapper.toMoveDocumentAppDto('user-1', 'folder-1', 'doc-1');

      expect(appDto.userId).toBe('user-1');
      expect(appDto.folderId).toBe('folder-1');
      expect(appDto.documentId).toBe('doc-1');
    });
  });
});
