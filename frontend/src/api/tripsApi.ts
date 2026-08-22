import { apiClient } from './client';
import { Trip, TripSection, TripExpense, BudgetBreakdown, ApiResponse } from '../types';

export interface GetTripsParams {
  status?: string;
  visibility?: string;
  search?: string;
  startDate?: string;
  endDate?: string;
  minBudget?: number;
  maxBudget?: number;
  sortBy?: string;
  order?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export interface CreateTripPayload {
  name: string;
  description?: string;
  startDate: string;
  endDate: string;
  totalBudget: number;
  visibility?: 'PRIVATE' | 'PUBLIC';
  coverImage?: string;
  initialCityId?: number | string;
}

export interface UpdateTripPayload extends Partial<CreateTripPayload> {
  status?: 'PLANNING' | 'UPCOMING' | 'ONGOING' | 'COMPLETED';
}

export const tripsApi = {
  getTrips: async (params?: GetTripsParams): Promise<ApiResponse<Trip[]>> => {
    return apiClient<Trip[]>('/trips', {
      method: 'GET',
      params
    });
  },

  getTripById: async (id: number | string): Promise<ApiResponse<{ trip: Trip }>> => {
    return apiClient<{ trip: Trip }>(`/trips/${id}`, {
      method: 'GET'
    });
  },

  createTrip: async (payload: CreateTripPayload): Promise<ApiResponse<{ trip: Trip }>> => {
    return apiClient<{ trip: Trip }>('/trips', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  },

  updateTrip: async (id: number | string, payload: UpdateTripPayload): Promise<ApiResponse<{ trip: Trip }>> => {
    return apiClient<{ trip: Trip }>(`/trips/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload)
    });
  },

  deleteTrip: async (id: number | string): Promise<ApiResponse<any>> => {
    return apiClient(`/trips/${id}`, {
      method: 'DELETE'
    });
  },

  // Sections under Trip
  getTripSections: async (tripId: number | string): Promise<ApiResponse<{ sections: TripSection[] }>> => {
    return apiClient<{ sections: TripSection[] }>(`/trips/${tripId}/sections`, {
      method: 'GET'
    });
  },

  createSection: async (
    tripId: number | string,
    payload: { cityId: number | string; startDate: string; endDate: string; budget?: number; notes?: string }
  ): Promise<ApiResponse<{ section: TripSection }>> => {
    return apiClient<{ section: TripSection }>(`/trips/${tripId}/sections`, {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  },

  reorderSections: async (
    tripId: number | string,
    sectionIds: (number | string)[]
  ): Promise<ApiResponse<{ sections: TripSection[] }>> => {
    return apiClient<{ sections: TripSection[] }>(`/trips/${tripId}/sections/reorder`, {
      method: 'PUT',
      body: JSON.stringify({ sectionIds })
    });
  },

  // Expenses under Trip
  getTripExpenses: async (tripId: number | string): Promise<ApiResponse<{ expenses: TripExpense[] }>> => {
    return apiClient<{ expenses: TripExpense[] }>(`/trips/${tripId}/expenses`, {
      method: 'GET'
    });
  },

  createExpense: async (
    tripId: number | string,
    payload: { category: string; amount: number; description: string; date?: string; sectionId?: number; dayId?: number }
  ): Promise<ApiResponse<{ expense: TripExpense }>> => {
    return apiClient<{ expense: TripExpense }>(`/trips/${tripId}/expenses`, {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  },

  // Budget Analytics
  getTripBudget: async (tripId: number | string): Promise<ApiResponse<BudgetBreakdown>> => {
    return apiClient<BudgetBreakdown>(`/trips/${tripId}/budget`, {
      method: 'GET'
    });
  },

  // Sharing
  shareTrip: async (tripId: number | string): Promise<ApiResponse<{ shareToken: string; shareUrl: string }>> => {
    return apiClient<{ shareToken: string; shareUrl: string }>(`/trips/${tripId}/share`, {
      method: 'POST'
    });
  },

  revokeShare: async (tripId: number | string): Promise<ApiResponse<any>> => {
    return apiClient(`/trips/${tripId}/share`, {
      method: 'DELETE'
    });
  }
};
