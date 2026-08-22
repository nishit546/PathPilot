const express = require('express');
const tripTemplateController = require('../controllers/tripTemplateController');
const authMiddleware = require('../middleware/authMiddleware');
const optionalAuthMiddleware = require('../middleware/optionalAuthMiddleware');
const { validate } = require('../middleware/validationMiddleware');
const {
  updateTemplateSchema,
  useTemplateSchema
} = require('../validators/templateValidator');

const searchController = require('../controllers/searchController');
const { templateSearchSchema } = require('../validators/searchValidator');

const router = express.Router();

// User Templates, Search & Favorites (Must be mounted before /:id)
router.get('/search', optionalAuthMiddleware, validate(templateSearchSchema, 'query'), searchController.searchTemplates);
router.get('/my', authMiddleware, tripTemplateController.getMyTemplates);
router.get('/favorites', authMiddleware, tripTemplateController.getMyFavorites);

// Public Template Discovery & Details
router.get('/', tripTemplateController.getPublicTemplates);
router.get('/:id', optionalAuthMiddleware, tripTemplateController.getTemplateById);

// Template Mutations
router.patch('/:id', authMiddleware, validate(updateTemplateSchema), tripTemplateController.updateTemplate);
router.delete('/:id', authMiddleware, tripTemplateController.deleteTemplate);

// Instantiation & Cloning
router.post('/:id/use', authMiddleware, validate(useTemplateSchema), tripTemplateController.useTemplate);

// Favorites Management
router.post('/:id/favorite', authMiddleware, tripTemplateController.favoriteTemplate);
router.delete('/:id/favorite', authMiddleware, tripTemplateController.unfavoriteTemplate);

module.exports = router;
