const express = require('express');
const adminController = require('../controllers/adminController');
const authMiddleware = require('../middleware/authMiddleware');
const adminMiddleware = require('../middleware/adminMiddleware');

const router = express.Router();

// All admin routes require authentication + admin role
router.use(authMiddleware, adminMiddleware);

router.get('/users', adminController.getUsers);
router.patch('/users/:id/block', adminController.blockUser);
router.patch('/users/:id/unblock', adminController.unblockUser);
router.get('/analytics', adminController.getAnalytics);

module.exports = router;
