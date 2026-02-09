import { IsOptional, IsEnum, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { MovementType, MovementStatus } from '@core/entities/inventory-movement.entity';

export class MovementQueryDto {
  @IsOptional()
  @IsEnum(MovementStatus)
  status?: MovementStatus;

  @IsOptional()
  @IsEnum(MovementType)
  movementType?: MovementType;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 10;
}
