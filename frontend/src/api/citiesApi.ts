import { apiClient } from './client';
import { City, ApiResponse } from '../types';

export interface GetCitiesParams {
  search?: string;
  country?: string;
  region?: string;
  minPopularity?: number;
  maxCostIndex?: number;
  sortBy?: string;
  order?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export const citiesApi = {
  getCities: async (params?: GetCitiesParams): Promise<ApiResponse<City[]>> => {
    return apiClient<City[]>('/cities', {
      method: 'GET',
      params
    });
  },

  getCityById: async (id: number | string): Promise<ApiResponse<{ city: City }>> => {
    return apiClient<{ city: City }>(`/cities/${id}`, {
      method: 'GET'
    });
  },

  searchCities: async (query: string): Promise<ApiResponse<City[]>> => {
    return apiClient<City[]>('/cities/search', {
      method: 'GET',
      params: { q: query }
    });
  }
};
