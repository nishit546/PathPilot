const communityService = require('../services/communityService');
const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess, sendPaginated } = require('../utils/response');
const { buildPaginationMetadata } = require('../utils/pagination');

const getPosts = asyncHandler(async (req, res) => {
  const result = await communityService.getPosts(req.query);
  const paginationMeta = buildPaginationMetadata(result.total, result.page, result.limit);
  return sendPaginated(res, 'Community posts retrieved successfully', result.posts, paginationMeta, 200);
});

const getPostById = asyncHandler(async (req, res) => {
  const post = await communityService.getPostById(req.params.id);
  return sendSuccess(res, 'Community post retrieved successfully', { post }, 200);
});

const createPost = asyncHandler(async (req, res) => {
  const post = await communityService.createPost(req.user.id, req.body);
  return sendSuccess(res, 'Community post created successfully', { post }, 201);
});

const updatePost = asyncHandler(async (req, res) => {
  const post = await communityService.updatePost(req.params.id, req.user.id, req.body);
  return sendSuccess(res, 'Community post updated successfully', { post }, 200);
});

const deletePost = asyncHandler(async (req, res) => {
  const result = await communityService.deletePost(req.params.id, req.user.id, req.user.role);
  return sendSuccess(res, result.message, {}, 200);
});

module.exports = {
  getPosts,
  getPostById,
  createPost,
  updatePost,
  deletePost
};
