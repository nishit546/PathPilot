import { apiClient } from './client';
import { TripSection, TripDay, ApiResponse } from '../types';

export const itineraryApi = {
  getSectionById: async (id: number | string): Promise<ApiResponse<{ section: TripSection }>> => {
    return apiClient<{ section: TripSection }>(`/sections/${id}`, {
      method: 'GET'
    });
  },

  updateSection: async (
    id: number | string,
    payload: { cityId?: number; startDate?: string; endDate?: string; budget?: number; notes?: string }
  ): Promise<ApiResponse<{ section: TripSection }>> => {
    return apiClient<{ section: TripSection }>(`/sections/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload)
    });
  },

  deleteSection: async (id: number | string): Promise<ApiResponse<any>> => {
    return apiClient(`/sections/${id}`, {
      method: 'DELETE'
    });
  },

  getSectionDays: async (sectionId: number | string): Promise<ApiResponse<{ days: TripDay[] }>> => {
    return apiClient<{ days: TripDay[] }>(`/sections/${sectionId}/days`, {
      method: 'GET'
    });
  },

  getDayById: async (id: number | string): Promise<ApiResponse<{ day: TripDay }>> => {
    return apiClient<{ day: TripDay }>(`/days/${id}`, {
      method: 'GET'
    });
  }
};
