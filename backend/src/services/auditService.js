const db = require('../models');
const logger = require('../utils/logger');

const logAudit = async ({
  req,
  action,
  entityType,
  entityId,
  before = null,
  after = null,
  metadata = null,
}) => {
  try {
    await db.AuditLog.create({
      actorUserId: req?.user?.id || null,
      action,
      entityType,
      entityId: String(entityId),
      before,
      after,
      metadata,
      ipAddress: req?.ip,
      userAgent: req?.headers?.['user-agent'] || null,
    });
  } catch (error) {
    logger.warn('Audit log capture skipped', { message: error.message, action, entityType, entityId });
  }
};

module.exports = {
  logAudit,
};
