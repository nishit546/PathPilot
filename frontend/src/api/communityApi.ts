import { apiClient } from './client';
import { CommunityPost, Trip, ApiResponse } from '../types';

export const communityApi = {
  getPosts: async (params?: { page?: number; limit?: number; search?: string; sortBy?: string; order?: 'asc' | 'desc' }): Promise<ApiResponse<CommunityPost[]>> => {
    return apiClient<CommunityPost[]>('/community/posts', {
      method: 'GET',
      params
    });
  },

  getPostById: async (id: number | string): Promise<ApiResponse<{ post: CommunityPost }>> => {
    return apiClient<{ post: CommunityPost }>(`/community/posts/${id}`, {
      method: 'GET'
    });
  },

  createPost: async (payload: { title: string; content: string; tripId?: number; activityId?: number }): Promise<ApiResponse<{ post: CommunityPost }>> => {
    return apiClient<{ post: CommunityPost }>('/community/posts', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  },

  getSharedTrip: async (shareToken: string): Promise<ApiResponse<{ trip: Trip }>> => {
    return apiClient<{ trip: Trip }>(`/shared/${shareToken}`, {
      method: 'GET',
      skipAuth: true
    });
  }
};
