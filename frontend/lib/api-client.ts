/**
 * API Client with automatic authentication
 * 
 * This utility automatically includes authentication tokens in API requests
 * and provides a centralized way to make API calls to the backend.
 */

import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import { supabase } from './supabase';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

// Create axios instance with default config
const apiClient: AxiosInstance = axios.create({
  baseURL: API_URL,
  timeout: 30000, // 30 second timeout
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * Get authentication headers with current session token
 */
export const getAuthHeaders = async (): Promise<Record<string, string>> => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (session?.access_token) {
      if (typeof window !== 'undefined') {
        console.log('[API Client] Auth token found, length:', session.access_token.length);
      }
      return {
        'Authorization': `Bearer ${session.access_token}`,
      };
    }
    
    if (typeof window !== 'undefined') {
      console.warn('[API Client] No auth token available');
    }
    return {};
  } catch (error) {
    console.error('Error getting auth headers:', error);
    return {};
  }
};

/**
 * Make an authenticated API request
 * Automatically includes the Authorization header if user is authenticated
 */
export const apiRequest = async <T = any>(
  config: AxiosRequestConfig
): Promise<T> => {
  try {
    // Get auth headers
    const authHeaders = await getAuthHeaders();
    
    // Merge auth headers with existing headers
    const headers = {
      ...config.headers,
      ...authHeaders,
    };
    
    // Make the request
    const response = await axios({
      ...config,
      url: `${API_URL}${config.url}`,
      headers,
    });
    
    return response.data;
  } catch (error: any) {
    // Handle authentication errors
    if (error.response?.status === 401) {
      // Token might be expired, try to refresh
      try {
        const { data: { session } } = await supabase.auth.refreshSession();
        if (session?.access_token) {
          // Retry with new token
          const authHeaders = {
            'Authorization': `Bearer ${session.access_token}`,
          };
          const headers = {
            ...config.headers,
            ...authHeaders,
          };
          const response = await axios({
            ...config,
            url: `${API_URL}${config.url}`,
            headers,
          });
          return response.data;
        }
      } catch (refreshError) {
        console.error('Error refreshing session:', refreshError);
      }
      
      // If refresh fails, redirect to login
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
    }
    
    throw error;
  }
};

/**
 * Convenience methods for common HTTP verbs
 */
export const api = {
  get: <T = any>(url: string, config?: AxiosRequestConfig) =>
    apiRequest<T>({ ...config, method: 'GET', url }),
  
  post: <T = any>(url: string, data?: any, config?: AxiosRequestConfig) =>
    apiRequest<T>({ ...config, method: 'POST', url, data }),
  
  patch: <T = any>(url: string, data?: any, config?: AxiosRequestConfig) =>
    apiRequest<T>({ ...config, method: 'PATCH', url, data }),
  
  put: <T = any>(url: string, data?: any, config?: AxiosRequestConfig) =>
    apiRequest<T>({ ...config, method: 'PUT', url, data }),
  
  delete: <T = any>(url: string, config?: AxiosRequestConfig) =>
    apiRequest<T>({ ...config, method: 'DELETE', url }),
};

/**
 * Legacy axios instance for public endpoints that don't need auth
 * Use this for endpoints like GET /api/users/search, GET /api/payment-requests, etc.
 */
export const publicApi = axios.create({
  baseURL: API_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

export default api;
