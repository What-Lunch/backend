import { IsEnum, IsNumber, IsOptional, Min } from 'class-validator';
import { Type } from 'class-transformer';

import { MenuCategory } from '../enum/menu-category.enum';
import { MenuContext } from '../enum/menu-context.enum';

export class RouletteMenuDto {
  @IsOptional()
  @IsEnum(MenuCategory)
  category?: MenuCategory;

  @IsOptional()
  @IsEnum(MenuContext)
  context?: MenuContext;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  limit?: number = 1;
}
