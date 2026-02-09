import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { InventoryMovement } from './inventory-movement.entity';
import { Product } from './product.entity';

@Entity('inventory_movement_items')
export class InventoryMovementItem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'movement_id' })
  movementId: string;

  @ManyToOne(() => InventoryMovement, (movement) => movement.items, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'movement_id' })
  movement: InventoryMovement;

  @Column({ name: 'product_id' })
  productId: string;

  @ManyToOne(() => Product)
  @JoinColumn({ name: 'product_id' })
  product: Product;

  @Column({ type: 'integer' })
  quantity: number;

  @Column({ name: 'unit_of_measure', type: 'varchar', length: 16 })
  unitOfMeasure: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
