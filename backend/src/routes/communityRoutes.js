const express = require('express');
const communityController = require('../controllers/communityController');
const authMiddleware = require('../middleware/authMiddleware');
const { validate } = require('../middleware/validationMiddleware');
const { createPostSchema, updatePostSchema } = require('../validators/communityValidator');

const router = express.Router();

// Public routes
router.get('/posts', communityController.getPosts);
router.get('/posts/:id', communityController.getPostById);

// Protected routes
router.post('/posts', authMiddleware, validate(createPostSchema), communityController.createPost);
router.put('/posts/:id', authMiddleware, validate(updatePostSchema), communityController.updatePost);
router.delete('/posts/:id', authMiddleware, communityController.deletePost);

module.exports = router;
