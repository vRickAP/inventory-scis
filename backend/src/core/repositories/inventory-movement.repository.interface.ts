import { InventoryMovement, MovementStatus, MovementType } from '../entities/inventory-movement.entity';

export interface IInventoryMovementRepository {
  findAll(filters?: {
    status?: MovementStatus;
    movementType?: MovementType;
    page?: number;
    limit?: number;
  }): Promise<{ data: InventoryMovement[]; total: number }>;
  findById(id: string, relations?: string[]): Promise<InventoryMovement | null>;
  findRecent(limit: number): Promise<InventoryMovement[]>;
  create(movement: Partial<InventoryMovement>): Promise<InventoryMovement>;
  update(id: string, movement: Partial<InventoryMovement>): Promise<InventoryMovement | null>;
  delete(id: string): Promise<void>;
}
