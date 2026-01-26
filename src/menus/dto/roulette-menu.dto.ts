import { IsEnum, IsNumber, IsOptional, Min } from 'class-validator';
import { Type } from 'class-transformer';

import { MenuCategory } from '../enum/menu-category.enum';
import { MenuContext } from '../enum/menu-context.enum';

// 룰렛 메뉴 응답 DTO
export class RouletteMenuResponseDto {
  id: string;
  name: string;
  category: MenuCategory;
  contexts: MenuContext[];
  isBest: boolean;
  calorie?: number;
  createdAt: Date;
  updatedAt: Date;
}

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
  limit?: number;

  @IsOptional()
  roomId?: string;
}
