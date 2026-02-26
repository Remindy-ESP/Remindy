import { Test, TestingModule } from '@nestjs/testing';
import { CreateCategoryUseCase } from './create-category.use-case';
import { ICategoryRepository, CATEGORY_REPOSITORY } from '../ports/category.repository.interface';
import { CreateCategoryAppDto } from '../dto/create-category-app.dto';
import { Category } from '../../domain/category.entity';

describe('CreateCategoryUseCase', () => {
  let useCase: CreateCategoryUseCase;
  let repository: jest.Mocked<ICategoryRepository>;

  beforeEach(async () => {
    const mockRepository: Partial<jest.Mocked<ICategoryRepository>> = {
      create: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CreateCategoryUseCase,
        {
          provide: CATEGORY_REPOSITORY,
          useValue: mockRepository,
        },
      ],
    }).compile();

    useCase = module.get<CreateCategoryUseCase>(CreateCategoryUseCase);
    repository = module.get(CATEGORY_REPOSITORY);
  });

  it('should be defined', () => {
    expect(useCase).toBeDefined();
  });

  describe('execute', () => {
    const createDto: CreateCategoryAppDto = {
      name: 'Work',
      icon: 'briefcase',
      color: '#FF5733',
      userId: 'user-123',
      isSystem: false,
    };

    it('should successfully create a new category', async () => {
      const createdCategory = new Category({
        id: 'category-123',
        name: createDto.name,
        icon: createDto.icon,
        color: createDto.color,
        userId: createDto.userId,
        isSystem: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      repository.create.mockResolvedValue(createdCategory);

      const result = await useCase.execute(createDto);

      expect(result).toBe(createdCategory);
      expect(repository.create).toHaveBeenCalledWith(expect.any(Category));
      expect(repository.create).toHaveBeenCalledTimes(1);
    });

    it('should create a category with all provided fields', async () => {
      const createdCategory = new Category({
        id: 'category-456',
        name: createDto.name,
        icon: createDto.icon,
        color: createDto.color,
        userId: createDto.userId,
        isSystem: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      repository.create.mockResolvedValue(createdCategory);

      const result = await useCase.execute(createDto);

      expect(result.name).toBe(createDto.name);
      expect(result.icon).toBe(createDto.icon);
      expect(result.color).toBe(createDto.color);
      expect(result.userId).toBe(createDto.userId);
      expect(result.isSystem).toBe(false);
    });

    it('should create a system category when isSystem is true', async () => {
      const systemDto: CreateCategoryAppDto = {
        ...createDto,
        isSystem: true,
      };

      const createdCategory = new Category({
        id: 'category-system',
        name: systemDto.name,
        icon: systemDto.icon,
        color: systemDto.color,
        userId: systemDto.userId,
        isSystem: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      repository.create.mockResolvedValue(createdCategory);

      const result = await useCase.execute(systemDto);

      expect(result.isSystem).toBe(true);
    });

    it('should default isSystem to false when not provided', async () => {
      const dtoWithoutIsSystem: CreateCategoryAppDto = {
        name: 'Personal',
        icon: 'user',
        color: '#3366FF',
        userId: 'user-789',
      };

      const createdCategory = new Category({
        id: 'category-789',
        name: dtoWithoutIsSystem.name,
        icon: dtoWithoutIsSystem.icon,
        color: dtoWithoutIsSystem.color,
        userId: dtoWithoutIsSystem.userId,
        isSystem: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      repository.create.mockResolvedValue(createdCategory);

      const result = await useCase.execute(dtoWithoutIsSystem);

      expect(result.isSystem).toBe(false);
    });

    it('should create a category without userId', async () => {
      const dtoWithoutUser: CreateCategoryAppDto = {
        name: 'Default',
        icon: 'star',
        color: '#FFD700',
        isSystem: true,
      };

      const createdCategory = new Category({
        id: 'category-default',
        name: dtoWithoutUser.name,
        icon: dtoWithoutUser.icon,
        color: dtoWithoutUser.color,
        userId: undefined,
        isSystem: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      repository.create.mockResolvedValue(createdCategory);

      const result = await useCase.execute(dtoWithoutUser);

      expect(result.userId).toBeUndefined();
    });

    it('should throw error when name is empty', async () => {
      const invalidDto: CreateCategoryAppDto = {
        name: '',
        icon: 'icon',
        color: '#FF5733',
        userId: 'user-123',
      };

      await expect(useCase.execute(invalidDto)).rejects.toThrow('Category name cannot be empty');
      expect(repository.create).not.toHaveBeenCalled();
    });

    it('should throw error when name exceeds 100 characters', async () => {
      const invalidDto: CreateCategoryAppDto = {
        name: 'a'.repeat(101),
        icon: 'icon',
        color: '#FF5733',
        userId: 'user-123',
      };

      await expect(useCase.execute(invalidDto)).rejects.toThrow(
        'Category name cannot exceed 100 characters',
      );
      expect(repository.create).not.toHaveBeenCalled();
    });

    it('should throw error when icon is empty', async () => {
      const invalidDto: CreateCategoryAppDto = {
        name: 'Work',
        icon: '',
        color: '#FF5733',
        userId: 'user-123',
      };

      await expect(useCase.execute(invalidDto)).rejects.toThrow('Category icon cannot be empty');
      expect(repository.create).not.toHaveBeenCalled();
    });

    it('should throw error when icon exceeds 50 characters', async () => {
      const invalidDto: CreateCategoryAppDto = {
        name: 'Work',
        icon: 'a'.repeat(51),
        color: '#FF5733',
        userId: 'user-123',
      };

      await expect(useCase.execute(invalidDto)).rejects.toThrow(
        'Category icon cannot exceed 50 characters',
      );
      expect(repository.create).not.toHaveBeenCalled();
    });

    it('should throw error when color is not a valid HEX code', async () => {
      const invalidDto: CreateCategoryAppDto = {
        name: 'Work',
        icon: 'briefcase',
        color: 'red',
        userId: 'user-123',
      };

      await expect(useCase.execute(invalidDto)).rejects.toThrow(
        'Color must be a valid HEX color code',
      );
      expect(repository.create).not.toHaveBeenCalled();
    });

    it('should throw error when color has invalid format', async () => {
      const invalidDto: CreateCategoryAppDto = {
        name: 'Work',
        icon: 'briefcase',
        color: '#FFF',
        userId: 'user-123',
      };

      await expect(useCase.execute(invalidDto)).rejects.toThrow(
        'Color must be a valid HEX color code',
      );
      expect(repository.create).not.toHaveBeenCalled();
    });

    it('should accept valid HEX color with lowercase letters', async () => {
      const validDto: CreateCategoryAppDto = {
        name: 'Work',
        icon: 'briefcase',
        color: '#ff5733',
        userId: 'user-123',
      };

      const createdCategory = new Category({
        id: 'category-lower',
        ...validDto,
        isSystem: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      repository.create.mockResolvedValue(createdCategory);

      const result = await useCase.execute(validDto);

      expect(result.color).toBe('#ff5733');
    });
  });
});
