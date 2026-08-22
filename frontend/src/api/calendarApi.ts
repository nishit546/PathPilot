import { apiClient } from './client';
import { Trip, ApiResponse } from '../types';

export interface GetCalendarParams {
  month?: number;
  year?: number;
  startDate?: string;
  endDate?: string;
}

export const calendarApi = {
  getCalendar: async (params?: GetCalendarParams): Promise<ApiResponse<{ trips?: Trip[]; events?: any[]; totalTrips?: number }>> => {
    return apiClient<{ trips?: Trip[]; events?: any[]; totalTrips?: number }>('/calendar', {
      method: 'GET',
      params
    });
  }
};
