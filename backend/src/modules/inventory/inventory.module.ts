import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InventoryMovement } from '@core/entities/inventory-movement.entity';
import { InventoryMovementItem } from '@core/entities/inventory-movement-item.entity';
import { Product } from '@core/entities/product.entity';
import { MovementsService } from './movements.service';
import { MovementsController } from './movements.controller';
import { ProductsModule } from '../products/products.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([InventoryMovement, InventoryMovementItem, Product]),
    ProductsModule,
  ],
  providers: [MovementsService],
  controllers: [MovementsController],
  exports: [MovementsService],
})
export class InventoryModule {}
