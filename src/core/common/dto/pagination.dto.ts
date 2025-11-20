import { IsInt, Min, Max, IsOptional, IsIn } from 'class-validator';
import { Type } from 'class-transformer';

/**
 * 分页查询 DTO
 */
export class PaginationDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: '页码必须是整数' })
  @Min(1, { message: '页码最小为 1' })
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: '每页数量必须是整数' })
  @Min(1, { message: '每页数量最小为 1' })
  @Max(100, { message: '每页数量最大为 100' })
  limit?: number = 20;
}

/**
 * 排序查询 DTO
 */
export class SortDto {
  @IsOptional()
  @IsIn(['asc', 'desc'], { message: '排序方向只能是 asc 或 desc' })
  order?: 'asc' | 'desc' = 'desc';
}

/**
 * 分页 + 排序 DTO
 */
export class PaginationSortDto extends PaginationDto {
  @IsOptional()
  @IsIn(['asc', 'desc'], { message: '排序方向只能是 asc 或 desc' })
  order?: 'asc' | 'desc' = 'desc';
}

