import { Product } from '../entities/product.entity';

export interface IProductRepository {
  findAll(filters?: {
    q?: string;
    isActive?: boolean;
    unitOfMeasure?: string;
    page?: number;
    limit?: number;
  }): Promise<{ data: Product[]; total: number }>;
  findById(id: string): Promise<Product | null>;
  findBySku(sku: string): Promise<Product | null>;
  findByIds(ids: string[]): Promise<Product[]>;
  findLowStock(threshold: number): Promise<Product[]>;
  create(product: Partial<Product>): Promise<Product>;
  update(id: string, product: Partial<Product>): Promise<Product | null>;
  delete(id: string): Promise<void>;
}
