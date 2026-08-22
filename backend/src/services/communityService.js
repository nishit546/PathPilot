const communityRepository = require('../repositories/communityRepository');
const userRepository = require('../repositories/userRepository');
const tripRepository = require('../repositories/tripRepository');
const ApiError = require('../utils/ApiError');

class CommunityService {
  async getPosts(filters) {
    const { posts, total, page, limit } = await communityRepository.findAll(filters);

    const populated = await Promise.all(
      posts.map(async (post) => {
        const author = await userRepository.findById(post.userId);
        let tripInfo = null;
        if (post.tripId) {
          const trip = await tripRepository.findById(post.tripId);
          if (trip) {
            tripInfo = {
              id: trip.id,
              name: trip.name,
              coverPhoto: trip.coverPhoto,
              startDate: trip.startDate,
              endDate: trip.endDate
            };
          }
        }

        return {
          ...post,
          author: author ? {
            id: author.id,
            firstName: author.firstName,
            lastName: author.lastName,
            profilePhoto: author.profilePhoto,
            city: author.city,
            country: author.country
          } : null,
          trip: tripInfo
        };
      })
    );

    return {
      posts: populated,
      total,
      page,
      limit
    };
  }

  async getPostById(id) {
    const post = await communityRepository.findById(id);
    if (!post) {
      throw ApiError.notFound('Community post not found.');
    }

    const author = await userRepository.findById(post.userId);
    let tripInfo = null;
    if (post.tripId) {
      const trip = await tripRepository.findById(post.tripId);
      if (trip) {
        tripInfo = {
          id: trip.id,
          name: trip.name,
          coverPhoto: trip.coverPhoto,
          startDate: trip.startDate,
          endDate: trip.endDate
        };
      }
    }

    return {
      ...post,
      author: author ? {
        id: author.id,
        firstName: author.firstName,
        lastName: author.lastName,
        profilePhoto: author.profilePhoto,
        city: author.city,
        country: author.country
      } : null,
      trip: tripInfo
    };
  }

  async createPost(userId, data) {
    if (data.tripId) {
      const trip = await tripRepository.findById(data.tripId);
      if (!trip) {
        throw ApiError.notFound('Linked trip not found.');
      }
      if (trip.visibility === 'PRIVATE' && trip.userId !== Number(userId)) {
        throw ApiError.forbidden('You cannot link another user\'s private trip to a community post.');
      }
    }

    const post = await communityRepository.create({
      ...data,
      userId
    });

    const author = await userRepository.findById(userId);

    return {
      ...post,
      author: author ? {
        id: author.id,
        firstName: author.firstName,
        lastName: author.lastName,
        profilePhoto: author.profilePhoto,
        city: author.city,
        country: author.country
      } : null
    };
  }

  async updatePost(id, userId, data) {
    const post = await communityRepository.findById(id);
    if (!post) {
      throw ApiError.notFound('Community post not found.');
    }

    if (post.userId !== Number(userId)) {
      throw ApiError.forbidden('You do not have permission to edit this community post.');
    }

    if (data.tripId) {
      const trip = await tripRepository.findById(data.tripId);
      if (!trip) {
        throw ApiError.notFound('Linked trip not found.');
      }
      if (trip.visibility === 'PRIVATE' && trip.userId !== Number(userId)) {
        throw ApiError.forbidden('You cannot link another user\'s private trip.');
      }
    }

    const updated = await communityRepository.update(id, data);
    return updated;
  }

  async deletePost(id, userId, userRole) {
    const post = await communityRepository.findById(id);
    if (!post) {
      throw ApiError.notFound('Community post not found.');
    }

    if (post.userId !== Number(userId) && userRole !== 'ADMIN') {
      throw ApiError.forbidden('You do not have permission to delete this post.');
    }

    await communityRepository.delete(id);
    return { message: 'Community post deleted successfully.' };
  }
}

module.exports = new CommunityService();
