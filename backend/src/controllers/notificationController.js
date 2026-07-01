const db = require('../models');
const asyncHandler = require('../utils/asyncHandler');

const getMyNotifications = asyncHandler(async (req, res) => {
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
});

const markNotificationRead = asyncHandler(async (req, res) => {
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
});

const markAllNotificationsRead = asyncHandler(async (req, res) => {
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
});

module.exports = {
  getMyNotifications,
  markNotificationRead,
  markAllNotificationsRead,
};
