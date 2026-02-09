import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { InjectDataSource } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import {
  InventoryMovement,
  MovementStatus,
  MovementType,
} from '@core/entities/inventory-movement.entity';
import { InventoryMovementItem } from '@core/entities/inventory-movement-item.entity';
import { Product } from '@core/entities/product.entity';
import { CreateMovementDto } from './dto/create-movement.dto';
import { UpdateMovementDto } from './dto/update-movement.dto';
import { MovementQueryDto } from './dto/movement-query.dto';
import { CreateMovementItemDto } from './dto/create-movement-item.dto';
import {
  StockUnderflowException,
  InvalidStateTransitionException,
} from '@common/exceptions';

@Injectable()
export class MovementsService {
  constructor(
    @InjectRepository(InventoryMovement)
    private readonly movementRepository: Repository<InventoryMovement>,
    @InjectRepository(InventoryMovementItem)
    private readonly movementItemRepository: Repository<InventoryMovementItem>,
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    @InjectDataSource()
    private readonly dataSource: DataSource,
  ) {}

  async findAll(query: MovementQueryDto): Promise<any> {
    const page = query.page || 1;
    const limit = query.limit || 10;
    const skip = (page - 1) * limit;

    const queryBuilder = this.movementRepository
      .createQueryBuilder('movement')
      .leftJoinAndSelect('movement.creator', 'creator')
      .leftJoinAndSelect('movement.items', 'items')
      .leftJoinAndSelect('items.product', 'product');

    if (query.status) {
      queryBuilder.andWhere('movement.status = :status', { status: query.status });
    }

    if (query.movementType) {
      queryBuilder.andWhere('movement.movement_type = :movementType', {
        movementType: query.movementType,
      });
    }

    queryBuilder.orderBy('movement.created_at', 'DESC').skip(skip).take(limit);

    const [data, total] = await queryBuilder.getManyAndCount();

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findById(id: string): Promise<InventoryMovement> {
    const movement = await this.movementRepository.findOne({
      where: { id },
      relations: ['creator', 'items', 'items.product'],
    });

    if (!movement) {
      throw new NotFoundException(`Movement with id ${id} not found`);
    }

    return movement;
  }

  async create(createMovementDto: CreateMovementDto, userId: string): Promise<InventoryMovement> {
    // Validate that all products exist
    const productIds = createMovementDto.items.map((item) => item.productId);
    const products = await this.productRepository.findByIds(productIds);

    if (products.length !== productIds.length) {
      throw new NotFoundException('One or more products not found');
    }

    // Validate that unit of measure matches for each product
    const productMap = new Map(products.map((p) => [p.id, p]));
    for (const item of createMovementDto.items) {
      const product = productMap.get(item.productId);
      if (product == null) {
        throw new NotFoundException(
          `Product id ${item.productId} does not exist`,
        );
      }
      if (product != null && product.unitOfMeasure !== item.unitOfMeasure) {
        throw new ConflictException(
          `Unit of measure mismatch for product ${product.sku}. Expected ${product.unitOfMeasure}, got ${item.unitOfMeasure}`,
        );
      }
    }

    // Create movement with items
    const movement = this.movementRepository.create({
      movementType: createMovementDto.movementType,
      reference: createMovementDto.reference,
      notes: createMovementDto.notes,
      status: MovementStatus.DRAFT,
      createdBy: userId,
      items: createMovementDto.items.map((item) =>
        this.movementItemRepository.create({
          productId: item.productId,
          quantity: item.quantity,
          unitOfMeasure: item.unitOfMeasure,
        }),
      ),
    });

    return this.movementRepository.save(movement);
  }

  async update(id: string, updateMovementDto: UpdateMovementDto): Promise<InventoryMovement> {
    const movement = await this.findById(id);

    if (movement.status !== MovementStatus.DRAFT) {
      throw new InvalidStateTransitionException(
        'Cannot update movement that is not in DRAFT status',
      );
    }

    Object.assign(movement, updateMovementDto);
    return this.movementRepository.save(movement);
  }

  async delete(id: string): Promise<void> {
    const movement = await this.findById(id);

    if (movement.status !== MovementStatus.DRAFT) {
      throw new InvalidStateTransitionException(
        'Cannot delete movement that is not in DRAFT status',
      );
    }

    await this.movementRepository.remove(movement);
  }

  async addItem(movementId: string, itemDto: CreateMovementItemDto): Promise<InventoryMovement> {
    const movement = await this.findById(movementId);

    if (movement.status !== MovementStatus.DRAFT) {
      throw new InvalidStateTransitionException(
        'Cannot add item to movement that is not in DRAFT status',
      );
    }

    const product = await this.productRepository.findOne({ where: { id: itemDto.productId } });
    if (!product) {
      throw new NotFoundException(`Product with id ${itemDto.productId} not found`);
    }

    if (product.unitOfMeasure !== itemDto.unitOfMeasure) {
      throw new ConflictException(
        `Unit of measure mismatch for product ${product.sku}. Expected ${product.unitOfMeasure}, got ${itemDto.unitOfMeasure}`,
      );
    }

    const item = this.movementItemRepository.create({
      movementId: movement.id,
      productId: itemDto.productId,
      quantity: itemDto.quantity,
      unitOfMeasure: itemDto.unitOfMeasure,
    });

    await this.movementItemRepository.save(item);

    return this.findById(movementId);
  }

  async removeItem(itemId: string): Promise<void> {
    const item = await this.movementItemRepository.findOne({
      where: { id: itemId },
      relations: ['movement'],
    });

    if (!item) {
      throw new NotFoundException(`Item with id ${itemId} not found`);
    }

    if (item.movement.status !== MovementStatus.DRAFT) {
      throw new InvalidStateTransitionException(
        'Cannot remove item from movement that is not in DRAFT status',
      );
    }

    await this.movementItemRepository.remove(item);
  }

  /**
   * CRITICAL METHOD: Transactional posting with FOR UPDATE locks
   * This method posts a movement and updates stock levels atomically
   */
  async post(movementId: string): Promise<InventoryMovement> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // 1. Load movement with items
      const movement = await queryRunner.manager.findOne(InventoryMovement, {
        where: { id: movementId },
        relations: ['items', 'items.product'],
      });

      if (!movement) {
        throw new NotFoundException(`Movement with id ${movementId} not found`);
      }

      if (movement.status !== MovementStatus.DRAFT) {
        throw new InvalidStateTransitionException(
          `Cannot post movement with status ${movement.status}. Only DRAFT movements can be posted.`,
        );
      }

      if (!movement.items || movement.items.length === 0) {
        throw new ConflictException('Cannot post movement without items');
      }

      // 2. Lock all affected products FOR UPDATE (pessimistic write lock)
      const productIds = [...new Set(movement.items.map((item) => item.productId))];
      const products = await queryRunner.manager
        .createQueryBuilder(Product, 'product')
        .where('product.id IN (:...ids)', { ids: productIds })
        .setLock('pessimistic_write') // FOR UPDATE
        .getMany();

      const productMap = new Map(products.map((p) => [p.id, p]));

      // 3. Calculate and apply stock changes
      for (const item of movement.items) {
        const product = productMap.get(item.productId);
        if (!product) {
          throw new NotFoundException(`Product with id ${item.productId} not found`);
        }

        let delta = 0;
        switch (movement.movementType) {
          case MovementType.IN:
            delta = item.quantity;
            break;
          case MovementType.OUT:
            delta = -item.quantity;
            break;
          case MovementType.ADJUST:
            // For ADJUST, quantity can be positive or negative
            // If positive, it's added; if negative, it's subtracted
            delta = item.quantity;
            break;
          case MovementType.TRANSFER:
            // TRANSFER doesn't change stock (handled separately)
            delta = 0;
            break;
        }

        const newStock = product.stock + delta;

        if (newStock < 0) {
          throw new StockUnderflowException(
            `Cannot post movement: Product ${product.sku} would have negative stock (current: ${product.stock}, change: ${delta}, result: ${newStock})`,
            {
              productId: product.id,
              sku: product.sku,
              currentStock: product.stock,
              requestedChange: delta,
              resultingStock: newStock,
            },
          );
        }

        product.stock = newStock;
      }

      // 4. Save updated products
      await queryRunner.manager.save(products);

      // 5. Update movement status
      movement.status = MovementStatus.POSTED;
      movement.postedAt = new Date();
      await queryRunner.manager.save(movement);

      // Commit transaction
      await queryRunner.commitTransaction();

      // Return the updated movement
      return this.findById(movementId);
    } catch (error) {
      // Rollback on any error
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      // Release the query runner
      await queryRunner.release();
    }
  }

  async cancel(id: string): Promise<InventoryMovement> {
    const movement = await this.findById(id);

    if (movement.status !== MovementStatus.DRAFT) {
      throw new InvalidStateTransitionException(
        'Only DRAFT movements can be cancelled',
      );
    }

    movement.status = MovementStatus.CANCELLED;
    return this.movementRepository.save(movement);
  }
}
