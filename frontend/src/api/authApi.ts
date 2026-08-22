import { apiClient } from './client';
import { User, ApiResponse } from '../types';

export interface RegisterPayload {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  phone?: string | null;
  city?: string | null;
  country?: string | null;
  additionalInfo?: string | null;
  profilePhoto?: string | null;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface AuthResult {
  user: User;
  token: string;
}

export const authApi = {
  login: async (payload: LoginPayload): Promise<ApiResponse<AuthResult>> => {
    return apiClient<AuthResult>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(payload),
      skipAuth: true
    });
  },

  register: async (payload: RegisterPayload): Promise<ApiResponse<AuthResult>> => {
    return apiClient<AuthResult>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload),
      skipAuth: true
    });
  },

  getMe: async (): Promise<ApiResponse<{ user: User }>> => {
    return apiClient<{ user: User }>('/auth/me', {
      method: 'GET'
    });
  },

  logout: async (): Promise<ApiResponse<any>> => {
    return apiClient('/auth/logout', {
      method: 'POST'
    });
  }
};
