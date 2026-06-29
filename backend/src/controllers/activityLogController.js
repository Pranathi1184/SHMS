const db = require('../models');
const logger = require('../utils/logger');

const getActivityLogs = async (req, res) => {
  try {
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
        pagination: {
          page,
          limit,
          totalItems: count,
          totalPages: Math.ceil(count / limit),
        },
      },
    });
  } catch (error) {
    logger.error('Get activity logs error:', error);
    res.status(500).json({ status: 'error', message: 'Failed to fetch activity logs' });
  }
};

module.exports = {
  getActivityLogs,
};
