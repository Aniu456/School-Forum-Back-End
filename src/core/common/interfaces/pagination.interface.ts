/**
 * 分页元数据接口
 */
export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages?: number;
}

/**
 * 分页响应接口
 */
export interface PaginatedResponse<T> {
  data: T[];
  meta: PaginationMeta;
}

/**
 * 计算分页参数
 */
export function calculatePagination(page: number, limit: number) {
  const skip = (page - 1) * limit;
  return { skip, take: limit };
}

/**
 * 构建分页响应
 */
export function buildPaginatedResponse<T>(
  data: T[],
  page: number,
  limit: number,
  total: number,
): PaginatedResponse<T> {
  return {
    data,
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

