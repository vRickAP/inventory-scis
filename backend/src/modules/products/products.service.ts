import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from '@core/entities/product.entity';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ProductQueryDto } from './dto/product-query.dto';
import { ProductListResponseDto } from './dto/product-response.dto';

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
  ) {}

  async findAll(query: ProductQueryDto): Promise<ProductListResponseDto> {
    const page = query.page || 1;
    const limit = query.limit || 10;
    const skip = (page - 1) * limit;

    const queryBuilder = this.productRepository.createQueryBuilder('product');

    if (query.q) {
      queryBuilder.where('(product.sku ILIKE :q OR product.name ILIKE :q)', {
        q: `%${query.q}%`,
      });
    }

    if (query.isActive !== undefined) {
      queryBuilder.andWhere('product.is_active = :isActive', { isActive: query.isActive });
    }

    if (query.unitOfMeasure) {
      queryBuilder.andWhere('product.unit_of_measure = :unitOfMeasure', {
        unitOfMeasure: query.unitOfMeasure,
      });
    }

    queryBuilder.orderBy('product.created_at', 'DESC').skip(skip).take(limit);

    const [data, total] = await queryBuilder.getManyAndCount();

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findById(id: string): Promise<Product> {
    const product = await this.productRepository.findOne({ where: { id } });

    if (!product) {
      throw new NotFoundException(`Product with id ${id} not found`);
    }

    return product;
  }

  async create(createProductDto: CreateProductDto): Promise<Product> {
    // Check if SKU already exists
    const existingProduct = await this.productRepository.findOne({
      where: { sku: createProductDto.sku },
    });

    if (existingProduct) {
      throw new ConflictException(`Product with SKU ${createProductDto.sku} already exists`);
    }

    const product = this.productRepository.create({
      ...createProductDto,
      stock: 0,
    });

    return this.productRepository.save(product);
  }

  async update(id: string, updateProductDto: UpdateProductDto): Promise<Product> {
    const product = await this.findById(id);

    // If updating SKU, check for conflicts
    if (updateProductDto.sku && updateProductDto.sku !== product.sku) {
      const existingProduct = await this.productRepository.findOne({
        where: { sku: updateProductDto.sku },
      });

      if (existingProduct) {
        throw new ConflictException(`Product with SKU ${updateProductDto.sku} already exists`);
      }
    }

    Object.assign(product, updateProductDto);
    return this.productRepository.save(product);
  }

  async delete(id: string): Promise<void> {
    const product = await this.findById(id);

    // Check if product has any references in inventory movements
    // For now, we'll just delete it, but in production you might want to check references
    await this.productRepository.remove(product);
  }
}
