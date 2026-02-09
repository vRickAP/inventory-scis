import { IsString, IsBoolean, MinLength, MaxLength, Matches, IsOptional } from 'class-validator';

export class CreateProductDto {
  @IsString()
  @MinLength(1)
  @MaxLength(64)
  sku: string;

  @IsString()
  @MinLength(1)
  @MaxLength(120)
  name: string;

  @IsString()
  @MaxLength(16)
  @Matches(/^[A-Za-z0-9._-]+$/, {
    message: 'Unit of measure must contain only letters, numbers, dots, underscores, and hyphens',
  })
  unitOfMeasure: string;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean = true;
}
