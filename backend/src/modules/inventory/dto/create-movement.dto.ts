import {
  IsEnum,
  IsString,
  IsOptional,
  MaxLength,
  IsArray,
  ValidateNested,
  ArrayMinSize,
} from 'class-validator';
import { Type } from 'class-transformer';
import { MovementType } from '@core/entities/inventory-movement.entity';
import { CreateMovementItemDto } from './create-movement-item.dto';

export class CreateMovementDto {
  @IsEnum(MovementType)
  movementType: MovementType;

  @IsString()
  @IsOptional()
  @MaxLength(120)
  reference?: string;

  @IsString()
  @IsOptional()
  notes?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @ArrayMinSize(1)
  @Type(() => CreateMovementItemDto)
  items: CreateMovementItemDto[];
}
