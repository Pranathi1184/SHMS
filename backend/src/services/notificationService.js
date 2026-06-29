const db = require('../models');
const logger = require('../utils/logger');

const createNotification = async ({ userId, title, message, type = 'Other', relatedId = null, actionUrl = null, metadata = null }) => {
  try {
    if (!userId) return null;

    return db.Notification.create({
      userId,
      title,
      message,
      type,
      relatedId,
      actionUrl,
      metadata,
      read: false,
    });
  } catch (error) {
    logger.warn('Notification create skipped', { message: error.message, userId, title });
    return null;
  }
};

const createNotificationsForUsers = async (userIds, payload) => {
  try {
    const uniqueIds = [...new Set((userIds || []).filter(Boolean))];
    if (uniqueIds.length === 0) return;

    await db.Notification.bulkCreate(
      uniqueIds.map((userId) => ({
        userId,
        title: payload.title,
        message: payload.message,
        type: payload.type || 'Other',
        relatedId: payload.relatedId || null,
        actionUrl: payload.actionUrl || null,
        metadata: payload.metadata || null,
        read: false,
      }))
    );
  } catch (error) {
    logger.warn('Bulk notification create skipped', { message: error.message, title: payload?.title });
  }
};

module.exports = {
  createNotification,
  createNotificationsForUsers,
};
