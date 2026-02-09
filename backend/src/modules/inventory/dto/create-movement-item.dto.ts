import { IsString, IsInt, Min, IsUUID } from 'class-validator';

export class CreateMovementItemDto {
  @IsUUID()
  productId: string;

  @IsInt()
  @Min(1)
  quantity: number;

  @IsString()
  unitOfMeasure: string;
}
