const db = require('../models');
const logger = require('../utils/logger');

const getMyNotifications = async (req, res) => {
  try {
    const limit = Math.min(Number(req.query.limit || 20), 100);
    const type = req.query.type;

    const where = { userId: req.user.id };
    if (type && type !== 'All') {
      where.type = type;
    }

    const notifications = await db.Notification.findAll({
      where,
      order: [['createdAt', 'DESC']],
      limit,
    });

    const unreadCount = await db.Notification.count({
      where: { userId: req.user.id, read: false },
    });

    res.status(200).json({
      status: 'success',
      data: {
        unreadCount,
        notifications,
      },
    });
  } catch (error) {
    logger.error('Failed to fetch notifications', { message: error.message, stack: error.stack });
    res.status(500).json({ status: 'error', message: 'Failed to fetch notifications' });
  }
};

const markNotificationRead = async (req, res) => {
  try {
    const { id } = req.params;

    const notification = await db.Notification.findOne({
      where: { id, userId: req.user.id },
    });

    if (!notification) {
      return res.status(404).json({ status: 'error', message: 'Notification not found' });
    }

    await notification.update({ read: true });

    res.status(200).json({
      status: 'success',
      message: 'Notification marked as read',
      data: notification,
    });
  } catch (error) {
    logger.error('Failed to mark notification as read', { message: error.message, stack: error.stack });
    res.status(500).json({ status: 'error', message: 'Failed to mark notification as read' });
  }
};

const markAllNotificationsRead = async (req, res) => {
  try {
    await db.Notification.update(
      { read: true },
      {
        where: {
          userId: req.user.id,
          read: false,
        },
      }
    );

    res.status(200).json({
      status: 'success',
      message: 'All notifications marked as read',
    });
  } catch (error) {
    logger.error('Failed to mark all notifications as read', { message: error.message, stack: error.stack });
    res.status(500).json({ status: 'error', message: 'Failed to mark all notifications as read' });
  }
};

module.exports = {
  getMyNotifications,
  markNotificationRead,
  markAllNotificationsRead,
};
