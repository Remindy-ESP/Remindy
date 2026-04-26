import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ICategoryRepository } from '../../application/ports/category.repository.interface';
import { Category } from '../../domain/category.entity';
import { CategoryEntity } from '../persistence/category.entity';
import { CategoryMapper } from '../mappers/category.mapper';
import { CategoryFilterAppDto } from '../../application/dto/category-filter-app.dto';

@Injectable()
export class CategoryRepository implements ICategoryRepository {
  constructor(
    @InjectRepository(CategoryEntity)
    private readonly repository: Repository<CategoryEntity>,
  ) {}

  async create(category: Category): Promise<Category> {
    const entity = CategoryMapper.toPersistence(category);
    const saved = await this.repository.save(entity);
    return CategoryMapper.toDomain(saved);
  }

  async findById(id: string): Promise<Category | null> {
    const entity = await this.repository.findOne({
      where: { id },
    });

    if (!entity) {
      return null;
    }

    return CategoryMapper.toDomain(entity);
  }

  async findAll(filters?: CategoryFilterAppDto): Promise<Category[]> {
    const queryBuilder = this.repository.createQueryBuilder('category');

    if (filters) {
      if (filters.userId !== undefined) {
        if (filters.userId === null) {
          queryBuilder.andWhere('category.userId IS NULL');
        } else {
          queryBuilder.andWhere('(category.userId = :userId OR category.isSystem = true)', {
            userId: filters.userId,
          });
        }
      }

      if (filters.name) {
        queryBuilder.andWhere('category.name ILIKE :name', { name: `%${filters.name}%` });
      }

      if (filters.isSystem !== undefined) {
        queryBuilder.andWhere('category.isSystem = :isSystem', { isSystem: filters.isSystem });
      }
    }

    queryBuilder.orderBy('category.isSystem', 'DESC').addOrderBy('category.name', 'ASC');

    const entities = await queryBuilder.getMany();
    return CategoryMapper.toDomainArray(entities);
  }

  async update(id: string, category: Category): Promise<Category | null> {
    const existing = await this.repository.findOne({ where: { id } });

    if (!existing) {
      return null;
    }

    const entity = CategoryMapper.toPersistence(category);
    entity.id = id;

    const updated = await this.repository.save(entity);
    return CategoryMapper.toDomain(updated);
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.repository.delete(id);
    return (result.affected ?? 0) > 0;
  }

  async softDelete(id: string): Promise<boolean> {
    const result = await this.repository.softDelete(id);
    return (result.affected ?? 0) > 0;
  }
}
