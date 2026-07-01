const parsePagination = (query, defaults = {}) => {
  const page = parseInt(query.page, 10) || defaults.page || 1;
  const limit = parseInt(query.limit, 10) || defaults.limit || 10;
  const offset = (page - 1) * limit;
  return { page, limit, offset };
};

const buildPaginationResponse = (count, page, limit) => ({
  page,
  limit,
  totalItems: count,
  totalPages: Math.ceil(count / limit),
});

module.exports = { parsePagination, buildPaginationResponse };
