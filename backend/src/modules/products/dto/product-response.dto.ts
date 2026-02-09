export class ProductResponseDto {
  id: string;
  sku: string;
  name: string;
  unitOfMeasure: string;
  isActive: boolean;
  stock: number;
  version: number;
  createdAt: Date;
  updatedAt: Date;
}

export class ProductListResponseDto {
  data: ProductResponseDto[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
