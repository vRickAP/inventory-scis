import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from '@core/entities/product.entity';
import { IProductRepository } from '@core/repositories/product.repository.interface';

@Injectable()
export class ProductRepository implements IProductRepository {
  constructor(
    @InjectRepository(Product)
    private readonly repository: Repository<Product>,
  ) {}

  async findAll(filters?: {
    q?: string;
    isActive?: boolean;
    unitOfMeasure?: string;
    page?: number;
    limit?: number;
  }): Promise<{ data: Product[]; total: number }> {
    const page = filters?.page || 1;
    const limit = filters?.limit || 10;
    const skip = (page - 1) * limit;

    const queryBuilder = this.repository.createQueryBuilder('product');

    if (filters?.q) {
      queryBuilder.where(
        '(product.sku ILIKE :q OR product.name ILIKE :q)',
        { q: `%${filters.q}%` }
      );
    }

    if (filters?.isActive !== undefined) {
      queryBuilder.andWhere('product.is_active = :isActive', { isActive: filters.isActive });
    }

    if (filters?.unitOfMeasure) {
      queryBuilder.andWhere('product.unit_of_measure = :unitOfMeasure', {
        unitOfMeasure: filters.unitOfMeasure,
      });
    }

    queryBuilder.orderBy('product.created_at', 'DESC').skip(skip).take(limit);

    const [data, total] = await queryBuilder.getManyAndCount();
    return { data, total };
  }

  async findById(id: string): Promise<Product | null> {
    return this.repository.findOne({ where: { id } });
  }

  async findBySku(sku: string): Promise<Product | null> {
    return this.repository.findOne({ where: { sku } });
  }

  async findByIds(ids: string[]): Promise<Product[]> {
    return this.repository.findByIds(ids);
  }

  async findLowStock(threshold: number): Promise<Product[]> {
    return this.repository
      .createQueryBuilder('product')
      .where('product.stock < :threshold', { threshold })
      .andWhere('product.is_active = :isActive', { isActive: true })
      .getMany();
  }

  async create(product: Partial<Product>): Promise<Product> {
    const newProduct = this.repository.create(product);
    return this.repository.save(newProduct);
  }

  async update(id: string, product: Partial<Product>): Promise<Product | null> {
    await this.repository.update(id, product);
    return this.findById(id);
  }

  async delete(id: string): Promise<void> {
    await this.repository.delete(id);
  }
}
