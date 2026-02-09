import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Product } from '@core/entities/product.entity';
import { InventoryMovement } from '@core/entities/inventory-movement.entity';
import { DashboardService } from './dashboard.service';
import { DashboardController } from './dashboard.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Product, InventoryMovement])],
  providers: [DashboardService],
  controllers: [DashboardController],
})
export class DashboardModule {}
