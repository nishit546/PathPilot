import { apiClient } from './client';
import { TripExpense, ApiResponse } from '../types';

export const expensesApi = {
  updateExpense: async (
    id: number | string,
    payload: { category?: string; amount?: number; description?: string; date?: string; sectionId?: number; dayId?: number }
  ): Promise<ApiResponse<{ expense: TripExpense }>> => {
    return apiClient<{ expense: TripExpense }>(`/expenses/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload)
    });
  },

  deleteExpense: async (id: number | string): Promise<ApiResponse<any>> => {
    return apiClient(`/expenses/${id}`, {
      method: 'DELETE'
    });
  }
};
