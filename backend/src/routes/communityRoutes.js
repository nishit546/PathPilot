const express = require('express');
const communityController = require('../controllers/communityController');
const authMiddleware = require('../middleware/authMiddleware');
const { validate } = require('../middleware/validationMiddleware');
const { createPostSchema, updatePostSchema } = require('../validators/communityValidator');

const searchController = require('../controllers/searchController');
const { communitySearchSchema } = require('../validators/searchValidator');

const router = express.Router();

// Public routes & Search
router.get('/', communityController.getPosts);
router.post('/', authMiddleware, validate(createPostSchema), communityController.createPost);
router.get('/search', validate(communitySearchSchema, 'query'), searchController.searchCommunity);
router.get('/posts/search', validate(communitySearchSchema, 'query'), searchController.searchCommunity);
router.get('/posts', communityController.getPosts);
router.get('/posts/:id', communityController.getPostById);

// Protected routes
router.post('/posts', authMiddleware, validate(createPostSchema), communityController.createPost);
router.put('/posts/:id', authMiddleware, validate(updatePostSchema), communityController.updatePost);
router.patch('/posts/:id', authMiddleware, validate(updatePostSchema), communityController.updatePost);
router.delete('/posts/:id', authMiddleware, communityController.deletePost);

module.exports = router;
