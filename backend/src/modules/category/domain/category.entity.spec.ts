import { Category } from './category.entity';

describe('Category Entity', () => {
  describe('constructor and validation', () => {
    it('should create a valid category', () => {
      const category = new Category({
        name: 'Work',
        icon: 'briefcase',
        color: '#FF5733',
        userId: 'user-123',
        isSystem: false,
      });

      expect(category.name).toBe('Work');
      expect(category.icon).toBe('briefcase');
      expect(category.color).toBe('#FF5733');
      expect(category.userId).toBe('user-123');
      expect(category.isSystem).toBe(false);
    });

    it('should create a system category', () => {
      const category = new Category({
        name: 'System',
        icon: 'system',
        color: '#FF5733',
        isSystem: true,
      });

      expect(category.isSystem).toBe(true);
      expect(category.userId).toBeUndefined();
    });
  });

  describe('updateName', () => {
    it('should update the name successfully', () => {
      const category = new Category({
        name: 'Work',
        icon: 'briefcase',
        color: '#FF5733',
      });

      category.updateName('Updated Work');

      expect(category.name).toBe('Updated Work');
    });

    it('should trim whitespace from name', () => {
      const category = new Category({
        name: 'Work',
        icon: 'briefcase',
        color: '#FF5733',
      });

      category.updateName('  Updated Work  ');

      expect(category.name).toBe('Updated Work');
    });

    it('should throw error when name exceeds 100 characters', () => {
      const category = new Category({
        name: 'Work',
        icon: 'briefcase',
        color: '#FF5733',
      });

      expect(() => category.updateName('a'.repeat(101))).toThrow('Category name cannot exceed 100 characters');
    });
  });

  describe('updateIcon', () => {
    it('should update the icon successfully', () => {
      const category = new Category({
        name: 'Work',
        icon: 'briefcase',
        color: '#FF5733',
      });

      category.updateIcon('new-icon');

      expect(category.icon).toBe('new-icon');
    });

    it('should trim whitespace from icon', () => {
      const category = new Category({
        name: 'Work',
        icon: 'briefcase',
        color: '#FF5733',
      });

      category.updateIcon('  new-icon  ');

      expect(category.icon).toBe('new-icon');
    });

    it('should throw error when icon exceeds 50 characters', () => {
      const category = new Category({
        name: 'Work',
        icon: 'briefcase',
        color: '#FF5733',
      });

      expect(() => category.updateIcon('a'.repeat(51))).toThrow('Category icon cannot exceed 50 characters');
    });
  });

  describe('updateColor', () => {
    it('should update the color successfully', () => {
      const category = new Category({
        name: 'Work',
        icon: 'briefcase',
        color: '#FF5733',
      });

      category.updateColor('#3366FF');

      expect(category.color).toBe('#3366FF');
    });
  });

  describe('isSystemCategory', () => {
    it('should return true for system categories', () => {
      const category = new Category({
        name: 'System',
        icon: 'system',
        color: '#FF5733',
        isSystem: true,
      });

      expect(category.isSystemCategory()).toBe(true);
    });

    it('should return false for user categories', () => {
      const category = new Category({
        name: 'Work',
        icon: 'briefcase',
        color: '#FF5733',
        isSystem: false,
      });

      expect(category.isSystemCategory()).toBe(false);
    });
  });

  describe('canBeDeleted', () => {
    it('should return false for system categories', () => {
      const category = new Category({
        name: 'System',
        icon: 'system',
        color: '#FF5733',
        isSystem: true,
      });

      expect(category.canBeDeleted()).toBe(false);
    });

    it('should return true for user categories', () => {
      const category = new Category({
        name: 'Work',
        icon: 'briefcase',
        color: '#FF5733',
        isSystem: false,
      });

      expect(category.canBeDeleted()).toBe(true);
    });
  });

  describe('canBeModifiedBy', () => {
    it('should return false for system categories', () => {
      const category = new Category({
        name: 'System',
        icon: 'system',
        color: '#FF5733',
        isSystem: true,
      });

      expect(category.canBeModifiedBy('user-123')).toBe(false);
    });

    it('should return true for the owning user', () => {
      const category = new Category({
        name: 'Work',
        icon: 'briefcase',
        color: '#FF5733',
        userId: 'user-123',
        isSystem: false,
      });

      expect(category.canBeModifiedBy('user-123')).toBe(true);
    });

    it('should return false for a different user', () => {
      const category = new Category({
        name: 'Work',
        icon: 'briefcase',
        color: '#FF5733',
        userId: 'user-123',
        isSystem: false,
      });

      expect(category.canBeModifiedBy('user-456')).toBe(false);
    });
  });

  describe('belongsToUser', () => {
    it('should return true when category belongs to user', () => {
      const category = new Category({
        name: 'Work',
        icon: 'briefcase',
        color: '#FF5733',
        userId: 'user-123',
      });

      expect(category.belongsToUser('user-123')).toBe(true);
    });

    it('should return false when category does not belong to user', () => {
      const category = new Category({
        name: 'Work',
        icon: 'briefcase',
        color: '#FF5733',
        userId: 'user-123',
      });

      expect(category.belongsToUser('user-456')).toBe(false);
    });
  });

  describe('toJSON', () => {
    it('should return all properties as JSON', () => {
      const createdAt = new Date('2024-01-01');
      const updatedAt = new Date('2024-01-02');

      const category = new Category({
        id: 'cat-123',
        name: 'Work',
        icon: 'briefcase',
        color: '#FF5733',
        userId: 'user-123',
        isSystem: false,
        createdAt,
        updatedAt,
      });

      const json = category.toJSON();

      expect(json).toEqual({
        id: 'cat-123',
        name: 'Work',
        icon: 'briefcase',
        color: '#FF5733',
        userId: 'user-123',
        isSystem: false,
        createdAt,
        updatedAt,
        deletedAt: undefined,
      });
    });
  });
});
