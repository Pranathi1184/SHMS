const db = require('../models');
const asyncHandler = require('../utils/asyncHandler');
const { buildPaginationResponse } = require('../utils/pagination');

const getActivityLogs = asyncHandler(async (req, res) => {
  const page = Number(req.query.page || 1);
  const limit = Math.min(Number(req.query.limit || 25), 100);
  const offset = (page - 1) * limit;

  const where = {};
  if (req.query.entityType) where.entityType = req.query.entityType;
  if (req.query.action) where.action = req.query.action;

  const { count, rows } = await db.AuditLog.findAndCountAll({
    where,
    include: [{ model: db.User, as: 'actor', attributes: ['id', 'firstName', 'lastName', 'email', 'role'] }],
    order: [['createdAt', 'DESC']],
    limit,
    offset,
  });

  res.status(200).json({
    status: 'success',
    data: {
      logs: rows,
      pagination: buildPaginationResponse(count, page, limit),
    },
  });
});

module.exports = {
  getActivityLogs,
};
