const express = require('express');
const userController = require('../controllers/userController');
const authMiddleware = require('../middleware/authMiddleware');
const { validate } = require('../middleware/validationMiddleware');
const { updateProfileSchema } = require('../validators/userValidator');

const router = express.Router();

// All user profile routes require authentication
router.use(authMiddleware);

router.get('/profile', userController.getProfile);
router.put('/profile', validate(updateProfileSchema), userController.updateProfile);
router.delete('/profile', userController.deleteProfile);
router.get('/profile/trips', userController.getProfileTrips);

module.exports = router;
