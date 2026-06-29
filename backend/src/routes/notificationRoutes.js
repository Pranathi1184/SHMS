const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');
const { authenticateToken } = require('../middlewares/auth');

router.get('/', authenticateToken, notificationController.getMyNotifications);
router.patch('/read-all', authenticateToken, notificationController.markAllNotificationsRead);
router.patch('/:id/read', authenticateToken, notificationController.markNotificationRead);

module.exports = router;
