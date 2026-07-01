const parsePagination = (query, defaults = {}) => {
  const rawPage = parseInt(query.page, 10);
  const rawLimit = parseInt(query.limit, 10);
  const page = Number.isFinite(rawPage) && rawPage > 0 ? rawPage : (defaults.page || 1);
  const limit = Number.isFinite(rawLimit) && rawLimit > 0 ? rawLimit : (defaults.limit || 10);
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
