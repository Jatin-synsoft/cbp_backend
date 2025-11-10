import { Op, Sequelize } from 'sequelize';

export interface PaginationOptions {
  page?: number;
  limit?: number;
  search?: string;
  filters?: Record<string, any>;
  sortBy?: string;
  sortOrder?: string;
}

export interface PaginationResult<T> {
  list: T[];
  totalItems: number;
  currentPage: number;
  totalPages: number;

}

export async function paginate<T>(
  model: any,
  options: PaginationOptions,
  include: any[] = [],
  where: any = {},
  attributes?: string[],
): Promise<PaginationResult<T>> {
  const page = Number(options.page) > 0 ? Number(options.page) : 1;
  const limit = Number(options.limit) > 0 ? Number(options.limit) : 10;
  const offset = (page - 1) * limit;

  const sortBy = options.sortBy || 'createdAt';
  const sortOrder = options.sortOrder?.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

  const primaryKey = model.primaryKeyAttribute || 'id';

  // ✅ Include the sort field in attributes if missing
  const modelAttrs = Object.keys(model.rawAttributes);
  let finalAttributes = attributes;
  if (modelAttrs.includes(sortBy) && attributes && !attributes.includes(sortBy)) {
    finalAttributes = [...attributes, sortBy];
  }

  const total = await model.count({
    where,
    include: include.length ? include : undefined,
    distinct: true,
    col: primaryKey,
  });

  const orderClause = modelAttrs.includes(sortBy)
    ? [[sortBy, sortOrder]]
    : [[Sequelize.literal(sortBy), sortOrder]];

  const rows = await model.findAll({
    where,
    include,
    attributes: finalAttributes,
    limit,
    offset,
    subQuery: true,
    distinct: true,
    order: orderClause,
  });

  return {
    list: rows,
    totalItems: total,
    currentPage: page,
    totalPages: Math.ceil(total / limit),
  };
}

