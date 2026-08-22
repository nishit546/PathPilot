const express = require('express');
const notificationController = require('../controllers/notificationController');
const authMiddleware = require('../middleware/authMiddleware');
const { validate } = require('../middleware/validationMiddleware');
const { notificationQuerySchema } = require('../validators/notificationValidator');

const router = express.Router();

// Apply auth to all notification endpoints
router.use(authMiddleware);

// Base notification management
router.get('/', validate(notificationQuerySchema, 'query'), notificationController.getNotifications);
router.get('/unread-count', notificationController.getUnreadCount);
router.patch('/read-all', notificationController.markAllAsRead);
router.patch('/:id/read', notificationController.markAsRead);
router.delete('/', notificationController.clearAllNotifications);
router.delete('/:id', notificationController.deleteNotification);

module.exports = router;
