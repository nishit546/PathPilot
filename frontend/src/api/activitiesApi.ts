import { apiClient } from './client';
import { Activity, DayActivity, ApiResponse } from '../types';

export interface GetActivitiesParams {
  cityId?: number | string;
  category?: string;
  search?: string;
  minCost?: number;
  maxCost?: number;
  minRating?: number;
  sortBy?: string;
  order?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export interface AssignDayActivityPayload {
  activityId: number | string;
  startTime: string;
  endTime: string;
  customCost?: number;
  notes?: string;
}

export const activitiesApi = {
  getActivities: async (params?: GetActivitiesParams): Promise<ApiResponse<Activity[]>> => {
    return apiClient<Activity[]>('/activities', {
      method: 'GET',
      params
    });
  },

  getActivityById: async (id: number | string): Promise<ApiResponse<{ activity: Activity }>> => {
    return apiClient<{ activity: Activity }>(`/activities/${id}`, {
      method: 'GET'
    });
  },

  getDayActivities: async (dayId: number | string): Promise<ApiResponse<{ activities: DayActivity[] }>> => {
    return apiClient<{ activities: DayActivity[] }>(`/days/${dayId}/activities`, {
      method: 'GET'
    });
  },

  assignDayActivity: async (
    dayId: number | string,
    payload: AssignDayActivityPayload
  ): Promise<ApiResponse<{ dayActivity: DayActivity }>> => {
    return apiClient<{ dayActivity: DayActivity }>(`/days/${dayId}/activities`, {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  },

  reorderDayActivities: async (
    dayId: number | string,
    dayActivityIds: number[]
  ): Promise<ApiResponse<{ activities: DayActivity[] }>> => {
    return apiClient<{ activities: DayActivity[] }>(`/days/${dayId}/activities/reorder`, {
      method: 'PUT',
      body: JSON.stringify({ dayActivityIds })
    });
  },

  updateDayActivity: async (
    id: number | string,
    payload: Partial<AssignDayActivityPayload>
  ): Promise<ApiResponse<{ dayActivity: DayActivity }>> => {
    return apiClient<{ dayActivity: DayActivity }>(`/day-activities/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload)
    });
  },

  deleteDayActivity: async (id: number | string): Promise<ApiResponse<any>> => {
    return apiClient(`/day-activities/${id}`, {
      method: 'DELETE'
    });
  }
};
