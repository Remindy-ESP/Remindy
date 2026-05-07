import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { CategoryController } from './presentation/controllers/category.controller';
import { CategoryEntity } from './infrastructure/persistence/category.entity';
import { CategoryRepository } from './infrastructure/repositories/category.repository';
import { CATEGORY_REPOSITORY } from './application/ports/category.repository.interface';
import { CreateCategoryUseCase } from './application/use-cases/create-category.use-case';
import { UpdateCategoryUseCase } from './application/use-cases/update-category.use-case';
import { DeleteCategoryUseCase } from './application/use-cases/delete-category.use-case';
import { FindCategoryByIdUseCase } from './application/use-cases/find-category-by-id.use-case';
import { FindAllCategoriesUseCase } from './application/use-cases/find-all-categories.use-case';

@Module({
  imports: [TypeOrmModule.forFeature([CategoryEntity]), AuthModule],
  controllers: [CategoryController],
  providers: [
    {
      provide: CATEGORY_REPOSITORY,
      useClass: CategoryRepository,
    },
    CreateCategoryUseCase,
    UpdateCategoryUseCase,
    DeleteCategoryUseCase,
    FindCategoryByIdUseCase,
    FindAllCategoriesUseCase,
  ],
  exports: [
    CATEGORY_REPOSITORY,
    CreateCategoryUseCase,
    UpdateCategoryUseCase,
    DeleteCategoryUseCase,
    FindCategoryByIdUseCase,
    FindAllCategoriesUseCase,
  ],
})
export class CategoryModule {}
