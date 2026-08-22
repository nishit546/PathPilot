import { apiClient } from './client';
import { User, AdminAnalytics, ApiResponse } from '../types';

export const adminApi = {
  getUsers: async (params?: { search?: string; role?: string; isBlocked?: boolean; page?: number; limit?: number }): Promise<ApiResponse<User[]>> => {
    return apiClient<User[]>('/admin/users', {
      method: 'GET',
      params
    });
  },

  blockUser: async (id: number | string): Promise<ApiResponse<{ user: User }>> => {
    return apiClient<{ user: User }>(`/admin/users/${id}/block`, {
      method: 'PATCH'
    });
  },

  unblockUser: async (id: number | string): Promise<ApiResponse<{ user: User }>> => {
    return apiClient<{ user: User }>(`/admin/users/${id}/unblock`, {
      method: 'PATCH'
    });
  },

  getAnalytics: async (): Promise<ApiResponse<AdminAnalytics>> => {
    return apiClient<AdminAnalytics>('/admin/analytics', {
      method: 'GET'
    });
  }
};
