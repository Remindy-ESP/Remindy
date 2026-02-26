import { Test, TestingModule } from '@nestjs/testing';
import { ThrottlerGuard } from '@nestjs/throttler';
import { CategoryController } from './category.controller';
import { CreateCategoryUseCase } from '../../application/use-cases/create-category.use-case';
import { UpdateCategoryUseCase } from '../../application/use-cases/update-category.use-case';
import { DeleteCategoryUseCase } from '../../application/use-cases/delete-category.use-case';
import { FindCategoryByIdUseCase } from '../../application/use-cases/find-category-by-id.use-case';
import { FindAllCategoriesUseCase } from '../../application/use-cases/find-all-categories.use-case';
import { CreateCategoryDto } from '../dto/create-category.dto';
import { UpdateCategoryDto } from '../dto/update-category.dto';
import { CategoryFilterDto } from '../dto/category-filter.dto';
import { Category } from '../../domain/category.entity';

describe('CategoryController', () => {
  let controller: CategoryController;
  let createUseCase: jest.Mocked<CreateCategoryUseCase>;
  let updateUseCase: jest.Mocked<UpdateCategoryUseCase>;
  let deleteUseCase: jest.Mocked<DeleteCategoryUseCase>;
  let findByIdUseCase: jest.Mocked<FindCategoryByIdUseCase>;
  let findAllUseCase: jest.Mocked<FindAllCategoriesUseCase>;

  beforeEach(async () => {
    const mockCreateUseCase = {
      execute: jest.fn(),
    };

    const mockUpdateUseCase = {
      execute: jest.fn(),
    };

    const mockDeleteUseCase = {
      execute: jest.fn(),
    };

    const mockFindByIdUseCase = {
      execute: jest.fn(),
    };

    const mockFindAllUseCase = {
      execute: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [CategoryController],
      providers: [
        {
          provide: CreateCategoryUseCase,
          useValue: mockCreateUseCase,
        },
        {
          provide: UpdateCategoryUseCase,
          useValue: mockUpdateUseCase,
        },
        {
          provide: DeleteCategoryUseCase,
          useValue: mockDeleteUseCase,
        },
        {
          provide: FindCategoryByIdUseCase,
          useValue: mockFindByIdUseCase,
        },
        {
          provide: FindAllCategoriesUseCase,
          useValue: mockFindAllUseCase,
        },
      ],
    })
      .overrideGuard(ThrottlerGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<CategoryController>(CategoryController);
    createUseCase = module.get(CreateCategoryUseCase);
    updateUseCase = module.get(UpdateCategoryUseCase);
    deleteUseCase = module.get(DeleteCategoryUseCase);
    findByIdUseCase = module.get(FindCategoryByIdUseCase);
    findAllUseCase = module.get(FindAllCategoriesUseCase);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create a new category', async () => {
      const createDto: CreateCategoryDto = {
        name: 'Work',
        icon: 'briefcase',
        color: '#FF5733',
      };

      const userId = 'user-123';
      const req = {
        user: { userId, role: 'USER_FREEMIUM' },
      } as any;

      const createdCategory = new Category({
        id: 'cat-123',
        name: createDto.name,
        icon: createDto.icon,
        color: createDto.color,
        userId: userId,
        isSystem: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      createUseCase.execute.mockResolvedValue(createdCategory);

      const result = await controller.create(req, createDto);

      expect(result.id).toBe('cat-123');
      expect(result.name).toBe(createDto.name);
      expect(result.userId).toBe(userId);
      expect(createUseCase.execute).toHaveBeenCalledWith(
        expect.objectContaining({
          name: createDto.name,
          icon: createDto.icon,
          color: createDto.color,
          userId: userId,
          isSystem: false,
        }),
      );
    });

    it('should override userId from DTO with userId from token', async () => {
      const createDto: CreateCategoryDto = {
        name: 'Work',
        icon: 'briefcase',
        color: '#FF5733',
      };

      const actualUserId = 'actual-user-123';
      const req = {
        user: { userId: actualUserId, role: 'USER_FREEMIUM' },
      } as any;

      const createdCategory = new Category({
        id: 'cat-123',
        name: createDto.name,
        icon: createDto.icon,
        color: createDto.color,
        userId: actualUserId,
        isSystem: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      createUseCase.execute.mockResolvedValue(createdCategory);

      await controller.create(req, createDto);

      expect(createUseCase.execute).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: actualUserId,
        }),
      );
    });
  });

  describe('findAll', () => {
    it('should return all categories without filters', async () => {
      const categories = [
        new Category({
          id: 'cat-1',
          name: 'Work',
          icon: 'briefcase',
          color: '#FF5733',
          userId: 'user-123',
          isSystem: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        }),
        new Category({
          id: 'cat-2',
          name: 'Personal',
          icon: 'user',
          color: '#3366FF',
          userId: 'user-123',
          isSystem: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        }),
      ];

      findAllUseCase.execute.mockResolvedValue(categories);

      const result = await controller.findAll({});

      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('cat-1');
      expect(result[1].id).toBe('cat-2');
      expect(findAllUseCase.execute).toHaveBeenCalled();
    });

    it('should return categories filtered by userId', async () => {
      const filters: CategoryFilterDto = { userId: 'user-123' };
      const categories = [
        new Category({
          id: 'cat-1',
          name: 'Work',
          icon: 'briefcase',
          color: '#FF5733',
          userId: 'user-123',
          isSystem: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        }),
      ];

      findAllUseCase.execute.mockResolvedValue(categories);

      const result = await controller.findAll(filters);

      expect(result).toHaveLength(1);
      expect(findAllUseCase.execute).toHaveBeenCalledWith(
        expect.objectContaining({ userId: 'user-123' }),
      );
    });

    it('should return categories filtered by name', async () => {
      const filters: CategoryFilterDto = { name: 'Work' };
      const categories = [
        new Category({
          id: 'cat-1',
          name: 'Work',
          icon: 'briefcase',
          color: '#FF5733',
          userId: 'user-123',
          isSystem: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        }),
      ];

      findAllUseCase.execute.mockResolvedValue(categories);

      const result = await controller.findAll(filters);

      expect(result).toHaveLength(1);
      expect(findAllUseCase.execute).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'Work' }),
      );
    });

    it('should return categories filtered by isSystem', async () => {
      const filters: CategoryFilterDto = { isSystem: true };
      const categories = [
        new Category({
          id: 'cat-sys',
          name: 'System',
          icon: 'system',
          color: '#FF5733',
          userId: null,
          isSystem: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        }),
      ];

      findAllUseCase.execute.mockResolvedValue(categories);

      const result = await controller.findAll(filters);

      expect(result).toHaveLength(1);
      expect(result[0].isSystem).toBe(true);
    });
  });

  describe('findById', () => {
    it('should return a category by id', async () => {
      const categoryId = 'cat-123';
      const category = new Category({
        id: categoryId,
        name: 'Work',
        icon: 'briefcase',
        color: '#FF5733',
        userId: 'user-123',
        isSystem: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      findByIdUseCase.execute.mockResolvedValue(category);

      const result = await controller.findById(categoryId);

      expect(result.id).toBe(categoryId);
      expect(result.name).toBe('Work');
      expect(findByIdUseCase.execute).toHaveBeenCalledWith(categoryId);
    });
  });

  describe('update', () => {
    it('should update a category', async () => {
      const categoryId = 'cat-123';
      const userId = 'user-123';
      const updateDto: UpdateCategoryDto = {
        name: 'Updated Work',
        icon: 'briefcase-new',
        color: '#3366FF',
      };

      const req = {
        user: { userId, role: 'USER_FREEMIUM' },
      } as any;

      const updatedCategory = new Category({
        id: categoryId,
        name: updateDto.name!,
        icon: updateDto.icon!,
        color: updateDto.color!,
        userId: userId,
        isSystem: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      updateUseCase.execute.mockResolvedValue(updatedCategory);

      const result = await controller.update(req, categoryId, updateDto);

      expect(result.id).toBe(categoryId);
      expect(result.name).toBe(updateDto.name);
      expect(updateUseCase.execute).toHaveBeenCalledWith(
        categoryId,
        expect.objectContaining({
          name: updateDto.name,
          icon: updateDto.icon,
          color: updateDto.color,
        }),
        userId,
      );
    });

    it('should update with partial data', async () => {
      const categoryId = 'cat-123';
      const userId = 'user-123';
      const updateDto: UpdateCategoryDto = {
        name: 'Updated Name',
      };

      const req = {
        user: { userId, role: 'USER_FREEMIUM' },
      } as any;

      const updatedCategory = new Category({
        id: categoryId,
        name: updateDto.name!,
        icon: 'briefcase',
        color: '#FF5733',
        userId: userId,
        isSystem: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      updateUseCase.execute.mockResolvedValue(updatedCategory);

      const result = await controller.update(req, categoryId, updateDto);

      expect(result.name).toBe(updateDto.name);
    });
  });

  describe('delete', () => {
    it('should delete a category', async () => {
      const categoryId = 'cat-123';
      const userId = 'user-123';
      const req = {
        user: { userId, role: 'USER_FREEMIUM' },
      } as any;

      deleteUseCase.execute.mockResolvedValue(undefined);

      await controller.delete(req, categoryId);

      expect(deleteUseCase.execute).toHaveBeenCalledWith(categoryId, userId);
    });

    it('should extract userId from request', async () => {
      const categoryId = 'cat-456';
      const userId = 'user-456';
      const req = {
        user: { userId, role: 'USER_PREMIUM' },
      } as any;

      deleteUseCase.execute.mockResolvedValue(undefined);

      await controller.delete(req, categoryId);

      expect(deleteUseCase.execute).toHaveBeenCalledWith(categoryId, userId);
    });
  });
});
