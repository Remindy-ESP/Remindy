import { Folder } from './folder.entity';

describe('Folder (domain entity)', () => {
  // ── Constructor / validation ──────────────────────────────────────────────

  describe('constructor', () => {
    it('should create a folder with valid props', () => {
      const folder = new Folder({ userId: 'user-1', name: 'Bills' });
      expect(folder.userId).toBe('user-1');
      expect(folder.name).toBe('Bills');
      expect(folder.isDefault).toBe(false);
    });

    it('should accept all optional props', () => {
      const now = new Date();
      const folder = new Folder({
        id: 'id-1',
        userId: 'user-1',
        name: 'Test',
        parentId: 'parent-1',
        color: '#AABBCC',
        icon: '📁',
        isDefault: true,
        createdAt: now,
        updatedAt: now,
        deletedAt: now,
      });
      expect(folder.id).toBe('id-1');
      expect(folder.parentId).toBe('parent-1');
      expect(folder.color).toBe('#AABBCC');
      expect(folder.icon).toBe('📁');
      expect(folder.isDefault).toBe(true);
      expect(folder.createdAt).toBe(now);
      expect(folder.updatedAt).toBe(now);
      expect(folder.deletedAt).toBe(now);
    });

    it('should throw when userId is empty string', () => {
      expect(() => new Folder({ userId: '', name: 'Bills' })).toThrow('User ID is required');
    });

    it('should throw when userId is whitespace only', () => {
      expect(() => new Folder({ userId: '   ', name: 'Bills' })).toThrow('User ID is required');
    });

    it('should throw when name is empty string', () => {
      expect(() => new Folder({ userId: 'user-1', name: '' })).toThrow('Folder name is required');
    });

    it('should throw when name is whitespace only', () => {
      expect(() => new Folder({ userId: 'user-1', name: '   ' })).toThrow(
        'Folder name is required',
      );
    });

    it('should throw when name exceeds 255 characters', () => {
      expect(() => new Folder({ userId: 'user-1', name: 'a'.repeat(256) })).toThrow(
        'Folder name is too long',
      );
    });

    it('should throw when color format is invalid', () => {
      expect(() => new Folder({ userId: 'user-1', name: 'Bills', color: 'red' })).toThrow(
        'Invalid color format',
      );
    });

    it('should accept valid hex color', () => {
      const folder = new Folder({ userId: 'user-1', name: 'Bills', color: '#3B82F6' });
      expect(folder.color).toBe('#3B82F6');
    });
  });

  // ── rename() ─────────────────────────────────────────────────────────────

  describe('rename()', () => {
    it('should rename the folder and update updatedAt', () => {
      const folder = new Folder({ userId: 'user-1', name: 'Old' });
      folder.rename('New');
      expect(folder.name).toBe('New');
      expect(folder.updatedAt).toBeInstanceOf(Date);
    });

    it('should trim the new name', () => {
      const folder = new Folder({ userId: 'user-1', name: 'Old' });
      folder.rename('  Trimmed  ');
      expect(folder.name).toBe('Trimmed');
    });

    it('should throw when new name is empty', () => {
      const folder = new Folder({ userId: 'user-1', name: 'Old' });
      expect(() => folder.rename('')).toThrow('Folder name cannot be empty');
    });

    it('should throw when new name is whitespace', () => {
      const folder = new Folder({ userId: 'user-1', name: 'Old' });
      expect(() => folder.rename('   ')).toThrow('Folder name cannot be empty');
    });

    it('should throw when new name exceeds 255 characters', () => {
      const folder = new Folder({ userId: 'user-1', name: 'Old' });
      expect(() => folder.rename('a'.repeat(256))).toThrow('Folder name is too long');
    });
  });

  // ── changeColor() ─────────────────────────────────────────────────────────

  describe('changeColor()', () => {
    it('should change color and update updatedAt', () => {
      const folder = new Folder({ userId: 'user-1', name: 'Bills' });
      folder.changeColor('#FF0000');
      expect(folder.color).toBe('#FF0000');
      expect(folder.updatedAt).toBeInstanceOf(Date);
    });

    it('should accept empty string (unset color)', () => {
      const folder = new Folder({ userId: 'user-1', name: 'Bills', color: '#FF0000' });
      folder.changeColor('');
      expect(folder.color).toBe('');
    });

    it('should throw when new color format is invalid', () => {
      const folder = new Folder({ userId: 'user-1', name: 'Bills' });
      expect(() => folder.changeColor('blue')).toThrow('Invalid color format');
    });
  });

  // ── changeIcon() ──────────────────────────────────────────────────────────

  describe('changeIcon()', () => {
    it('should change icon and update updatedAt', () => {
      const folder = new Folder({ userId: 'user-1', name: 'Bills' });
      folder.changeIcon('📄');
      expect(folder.icon).toBe('📄');
      expect(folder.updatedAt).toBeInstanceOf(Date);
    });
  });

  // ── moveTo() ──────────────────────────────────────────────────────────────

  describe('moveTo()', () => {
    it('should move folder to a new parent', () => {
      const folder = new Folder({ id: 'f-1', userId: 'user-1', name: 'Bills' });
      folder.moveTo('parent-99');
      expect(folder.parentId).toBe('parent-99');
      expect(folder.updatedAt).toBeInstanceOf(Date);
    });

    it('should unset parent when called with undefined', () => {
      const folder = new Folder({ id: 'f-1', userId: 'user-1', name: 'Bills', parentId: 'p-1' });
      folder.moveTo(undefined);
      expect(folder.parentId).toBeUndefined();
    });

    it('should throw when trying to set itself as parent', () => {
      const folder = new Folder({ id: 'f-1', userId: 'user-1', name: 'Bills' });
      expect(() => folder.moveTo('f-1')).toThrow('A folder cannot be its own parent');
    });

    it('should not throw when id is undefined and parentId matches some string', () => {
      // No id set → the guard (parentId && this._id && …) never fires
      const folder = new Folder({ userId: 'user-1', name: 'Bills' });
      expect(() => folder.moveTo('anything')).not.toThrow();
    });
  });

  // ── softDelete() / restore() / isDeleted() ─────────────────────────────

  describe('softDelete() / restore() / isDeleted()', () => {
    it('should soft-delete a non-default folder', () => {
      const folder = new Folder({ userId: 'user-1', name: 'Bills', isDefault: false });
      expect(folder.isDeleted()).toBe(false);
      folder.softDelete();
      expect(folder.isDeleted()).toBe(true);
      expect(folder.deletedAt).toBeInstanceOf(Date);
    });

    it('should throw when trying to soft-delete a default folder', () => {
      const folder = new Folder({ userId: 'user-1', name: 'Bills', isDefault: true });
      expect(() => folder.softDelete()).toThrow('Cannot delete a default folder');
    });

    it('should restore a deleted folder', () => {
      const folder = new Folder({ userId: 'user-1', name: 'Bills' });
      folder.softDelete();
      folder.restore();
      expect(folder.isDeleted()).toBe(false);
      expect(folder.deletedAt).toBeUndefined();
    });
  });

  // ── isRoot() / isSubfolder() ──────────────────────────────────────────────

  describe('isRoot() / isSubfolder()', () => {
    it('should return true for isRoot when no parentId', () => {
      const folder = new Folder({ userId: 'user-1', name: 'Root' });
      expect(folder.isRoot()).toBe(true);
      expect(folder.isSubfolder()).toBe(false);
    });

    it('should return false for isRoot when parentId is set', () => {
      const folder = new Folder({ userId: 'user-1', name: 'Child', parentId: 'parent-1' });
      expect(folder.isRoot()).toBe(false);
      expect(folder.isSubfolder()).toBe(true);
    });
  });

  // ── Factory methods ───────────────────────────────────────────────────────

  describe('Folder.createDefault()', () => {
    it('should create a default folder', () => {
      const folder = Folder.createDefault('user-1', 'Factures', '📄', '#3B82F6');
      expect(folder.isDefault).toBe(true);
      expect(folder.userId).toBe('user-1');
      expect(folder.name).toBe('Factures');
      expect(folder.icon).toBe('📄');
      expect(folder.color).toBe('#3B82F6');
    });

    it('should create a default folder without optional props', () => {
      const folder = Folder.createDefault('user-1', 'Factures');
      expect(folder.isDefault).toBe(true);
      expect(folder.icon).toBeUndefined();
      expect(folder.color).toBeUndefined();
    });
  });

  describe('Folder.create()', () => {
    it('should create a standard user folder', () => {
      const folder = Folder.create('user-1', 'My Folder');
      expect(folder.isDefault).toBe(false);
      expect(folder.parentId).toBeUndefined();
    });

    it('should create a standard folder with parentId', () => {
      const folder = Folder.create('user-1', 'My Folder', 'parent-1');
      expect(folder.parentId).toBe('parent-1');
    });
  });

  describe('Folder.createSubfolder()', () => {
    it('should create a subfolder', () => {
      const folder = Folder.createSubfolder('user-1', 'Sub', 'parent-1');
      expect(folder.parentId).toBe('parent-1');
      expect(folder.isDefault).toBe(false);
    });

    it('should throw when parentId is empty string', () => {
      expect(() => Folder.createSubfolder('user-1', 'Sub', '')).toThrow(
        'Parent ID is required for subfolder',
      );
    });
  });
});
