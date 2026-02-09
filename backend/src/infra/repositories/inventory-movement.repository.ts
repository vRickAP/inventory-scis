import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  InventoryMovement,
  MovementStatus,
  MovementType,
} from '@core/entities/inventory-movement.entity';
import { IInventoryMovementRepository } from '@core/repositories/inventory-movement.repository.interface';

@Injectable()
export class InventoryMovementRepository implements IInventoryMovementRepository {
  constructor(
    @InjectRepository(InventoryMovement)
    private readonly repository: Repository<InventoryMovement>,
  ) {}

  async findAll(filters?: {
    status?: MovementStatus;
    movementType?: MovementType;
    page?: number;
    limit?: number;
  }): Promise<{ data: InventoryMovement[]; total: number }> {
    const page = filters?.page || 1;
    const limit = filters?.limit || 10;
    const skip = (page - 1) * limit;

    const queryBuilder = this.repository
      .createQueryBuilder('movement')
      .leftJoinAndSelect('movement.creator', 'creator')
      .leftJoinAndSelect('movement.items', 'items')
      .leftJoinAndSelect('items.product', 'product');

    if (filters?.status) {
      queryBuilder.andWhere('movement.status = :status', { status: filters.status });
    }

    if (filters?.movementType) {
      queryBuilder.andWhere('movement.movement_type = :movementType', {
        movementType: filters.movementType,
      });
    }

    queryBuilder.orderBy('movement.created_at', 'DESC').skip(skip).take(limit);

    const [data, total] = await queryBuilder.getManyAndCount();
    return { data, total };
  }

  async findById(id: string, relations?: string[]): Promise<InventoryMovement | null> {
    return this.repository.findOne({
      where: { id },
      relations: relations || ['creator', 'items', 'items.product'],
    });
  }

  async findRecent(limit: number): Promise<InventoryMovement[]> {
    return this.repository
      .createQueryBuilder('movement')
      .leftJoinAndSelect('movement.creator', 'creator')
      .leftJoinAndSelect('movement.items', 'items')
      .orderBy('movement.created_at', 'DESC')
      .take(limit)
      .getMany();
  }

  async create(movement: Partial<InventoryMovement>): Promise<InventoryMovement> {
    const newMovement = this.repository.create(movement);
    return this.repository.save(newMovement);
  }

  async update(id: string, movement: Partial<InventoryMovement>): Promise<InventoryMovement | null> {
    await this.repository.update(id, movement);
    return this.findById(id);
  }

  async delete(id: string): Promise<void> {
    await this.repository.delete(id);
  }
}
