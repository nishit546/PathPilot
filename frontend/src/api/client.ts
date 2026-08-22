import { ApiResponse } from '../types';

const BASE_URL = import.meta.env.VITE_API_URL || '/api';
const TOKEN_KEY = 'pathpilot_token';

export class ApiError extends Error {
  status: number;
  data: any;
  errors?: Record<string, string[]>;

  constructor(message: string, status: number, data?: any, errors?: Record<string, string[]>) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
    this.errors = errors;
  }
}

export const getStoredToken = (): string | null => {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
};

export const setStoredToken = (token: string | null): void => {
  try {
    if (token) {
      localStorage.setItem(TOKEN_KEY, token);
    } else {
      localStorage.removeItem(TOKEN_KEY);
    }
  } catch (err) {
    console.error('Failed to update stored token:', err);
  }
};

interface RequestOptions extends RequestInit {
  params?: Record<string, any>;
  skipAuth?: boolean;
}

export async function apiClient<T = any>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<ApiResponse<T>> {
  const { params, skipAuth = false, headers = {}, ...restOptions } = options;

  let url = endpoint.startsWith('http')
    ? endpoint
    : `${BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

  if (params) {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, val]) => {
      if (val !== undefined && val !== null && val !== '') {
        searchParams.append(key, String(val));
      }
    });
    const queryString = searchParams.toString();
    if (queryString) {
      url += (url.includes('?') ? '&' : '?') + queryString;
    }
  }

  const reqHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(headers as Record<string, string>)
  };

  if (!skipAuth) {
    const token = getStoredToken();
    if (token) {
      reqHeaders['Authorization'] = `Bearer ${token}`;
    }
  }

  let response: Response;
  try {
    response = await fetch(url, {
      ...restOptions,
      headers: reqHeaders
    });
  } catch (networkErr: any) {
    // If relative fetch fails, try direct fallback to localhost:5000
    if (!endpoint.startsWith('http') && !BASE_URL.startsWith('http')) {
      try {
        const fallbackUrl = `http://localhost:5000/api${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
        response = await fetch(fallbackUrl, {
          ...restOptions,
          headers: reqHeaders
        });
      } catch {
        throw new ApiError(
          'Unable to connect to the PathPilot server. Please ensure the backend is running.',
          0
        );
      }
    } else {
      throw new ApiError(
        'Unable to connect to the PathPilot server. Please ensure the backend is running.',
        0
      );
    }
  }

  let resData: any = {};
  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    try {
      resData = await response.json();
    } catch {
      resData = {};
    }
  } else {
    const text = await response.text();
    resData = { message: text };
  }

  if (!response.ok) {
    if (response.status === 401 && !skipAuth) {
      setStoredToken(null);
      window.dispatchEvent(new CustomEvent('pathpilot:unauthorized'));
    }

    const message =
      resData?.message ||
      (resData?.errors ? Object.values(resData.errors).flat().join(', ') : 'An unexpected error occurred.');

    throw new ApiError(message, response.status, resData?.data, resData?.errors);
  }

  return resData as ApiResponse<T>;
}
