import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from '@core/entities/product.entity';
import { InventoryMovement } from '@core/entities/inventory-movement.entity';
import { DashboardSummaryDto, ChartDataPointDto, RecentMovementDto } from './dto/dashboard-summary.dto';

@Injectable()
export class DashboardService {
  constructor(
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    @InjectRepository(InventoryMovement)
    private readonly movementRepository: Repository<InventoryMovement>,
  ) {}

  async getSummary(): Promise<DashboardSummaryDto> {
    // Get total products count
    const totalProducts = await this.productRepository.count();

    // Get active products count
    const activeProducts = await this.productRepository.count({
      where: { isActive: true },
    });

    // Get total stock
    const stockResult = await this.productRepository
      .createQueryBuilder('product')
      .select('SUM(product.stock)', 'totalStock')
      .getRawOne();
    const totalStock = parseInt(stockResult?.totalStock || '0', 10);

    // Get low stock count (stock < 10)
    const lowStockCount = await this.productRepository
      .createQueryBuilder('product')
      .where('product.stock < :threshold', { threshold: 10 })
      .andWhere('product.is_active = :isActive', { isActive: true })
      .getCount();

    // Get recent movements (last 10)
    const movements = await this.movementRepository
      .createQueryBuilder('movement')
      .leftJoinAndSelect('movement.creator', 'creator')
      .leftJoinAndSelect('movement.items', 'items')
      .orderBy('movement.created_at', 'DESC')
      .take(10)
      .getMany();

    const recentMovements: RecentMovementDto[] = movements.map((m) => ({
      id: m.id,
      movementType: m.movementType,
      status: m.status,
      reference: m.reference,
      createdBy: m.createdBy,
      creatorName: m.creator?.fullName || 'Unknown',
      itemCount: m.items?.length || 0,
      createdAt: m.createdAt,
    }));

    // Get chart data (movements grouped by date and type for last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const chartDataRaw = await this.movementRepository
      .createQueryBuilder('movement')
      .select('DATE(movement.created_at)', 'date')
      .addSelect('movement.movement_type', 'movementType')
      .addSelect('COUNT(*)', 'count')
      .where('movement.created_at >= :startDate', { startDate: thirtyDaysAgo })
      .groupBy('DATE(movement.created_at)')
      .addGroupBy('movement.movement_type')
      .orderBy('DATE(movement.created_at)', 'ASC')
      .getRawMany();

    const chartData: ChartDataPointDto[] = chartDataRaw.map((row) => ({
      date: row.date,
      movementType: row.movementType,
      count: parseInt(row.count, 10),
    }));

    return {
      totalProducts,
      activeProducts,
      totalStock,
      lowStockCount,
      recentMovements,
      chartData,
    };
  }
}
