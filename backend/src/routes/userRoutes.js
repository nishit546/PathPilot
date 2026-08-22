const express = require('express');
const userController = require('../controllers/userController');
const authMiddleware = require('../middleware/authMiddleware');
const { validate } = require('../middleware/validationMiddleware');
const { updateProfileSchema, userPreferencesSchema } = require('../validators/userValidator');

const router = express.Router();

// All user profile and preferences routes require authentication
router.use(authMiddleware);

// User Profile
router.get('/', userController.getProfile);
router.put('/', validate(updateProfileSchema), userController.updateProfile);
router.patch('/', validate(updateProfileSchema), userController.updateProfile);
router.get('/profile', userController.getProfile);
router.put('/profile', validate(updateProfileSchema), userController.updateProfile);
router.patch('/profile', validate(updateProfileSchema), userController.updateProfile);
router.delete('/profile', userController.deleteProfile);
router.get('/profile/trips', userController.getProfileTrips);

// User Travel Preferences
router.get('/preferences', userController.getPreferences);
router.put('/preferences', validate(userPreferencesSchema), userController.updatePreferences);
router.patch('/preferences', validate(userPreferencesSchema), userController.updatePreferences);

module.exports = router;
