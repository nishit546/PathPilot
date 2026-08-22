import { apiClient } from './client';
import { User, Trip, ApiResponse } from '../types';

export const userApi = {
  getProfile: async (): Promise<ApiResponse<{ user: User }>> => {
    return apiClient<{ user: User }>('/users/profile', {
      method: 'GET'
    });
  },

  updateProfile: async (payload: {
    firstName?: string;
    lastName?: string;
    phone?: string | null;
    city?: string | null;
    country?: string | null;
    additionalInfo?: string | null;
    profilePhoto?: string | null;
  }): Promise<ApiResponse<{ user: User }>> => {
    return apiClient<{ user: User }>('/users/profile', {
      method: 'PUT',
      body: JSON.stringify(payload)
    });
  },

  deleteProfile: async (): Promise<ApiResponse<any>> => {
    return apiClient('/users/profile', {
      method: 'DELETE'
    });
  },

  getProfileTrips: async (): Promise<ApiResponse<{ trips: Trip[] }>> => {
    return apiClient<{ trips: Trip[] }>('/users/profile/trips', {
      method: 'GET'
    });
  }
};
