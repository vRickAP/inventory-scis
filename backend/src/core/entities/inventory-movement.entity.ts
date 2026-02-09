import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { User } from './user.entity';
import { InventoryMovementItem } from './inventory-movement-item.entity';

export enum MovementType {
  IN = 'IN',
  OUT = 'OUT',
  ADJUST = 'ADJUST',
  TRANSFER = 'TRANSFER',
}

export enum MovementStatus {
  DRAFT = 'DRAFT',
  POSTED = 'POSTED',
  CANCELLED = 'CANCELLED',
}

@Entity('inventory_movements')
export class InventoryMovement {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    name: 'movement_type',
    type: 'enum',
    enum: MovementType,
  })
  movementType: MovementType;

  @Column({
    type: 'enum',
    enum: MovementStatus,
    default: MovementStatus.DRAFT,
  })
  status: MovementStatus;

  @Column({ type: 'varchar', length: 120, nullable: true })
  reference?: string;

  @Column({ type: 'text', nullable: true })
  notes?: string;

  @Column({ name: 'created_by' })
  createdBy: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'created_by' })
  creator: User;

  @OneToMany(() => InventoryMovementItem, (item) => item.movement, {
    cascade: true,
    eager: false,
  })
  items: InventoryMovementItem[];

  @Column({ name: 'posted_at', type: 'timestamp', nullable: true })
  postedAt?: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
