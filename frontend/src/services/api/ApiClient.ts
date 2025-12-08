/**
 * API Client
 * Handles all HTTP requests to the backend
 */

import { API_CONFIG, API_ENDPOINTS } from '@/config/api.config';

export interface ApiError {
  message: string;
  status: number;
  details?: unknown;
}

export class ApiClient {
  private baseUrl: string;
  private token: string | null = null;

  constructor() {
    this.baseUrl = API_CONFIG.baseUrl;
    this.loadToken();
  }

  /**
   * Set authentication token
   */
  setToken(token: string) {
    this.token = token;
    localStorage.setItem('auth_token', token);
  }

  /**
   * Clear authentication token
   */
  clearToken() {
    this.token = null;
    localStorage.removeItem('auth_token');
  }

  /**
   * Load token from localStorage
   */
  private loadToken() {
    this.token = localStorage.getItem('auth_token');
  }

  /**
   * Get authorization headers
   */
  private getHeaders(): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    return headers;
  }

  /**
   * Handle API response
   */
  private async handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
      const error: ApiError = {
        message: response.statusText,
        status: response.status,
      };

      try {
        const data = await response.json();
        error.message = data.detail || data.message || response.statusText;
        error.details = data;
      } catch {
        // Response is not JSON
      }

      // Handle unauthorized
      if (response.status === 401) {
        this.clearToken();
        window.dispatchEvent(new CustomEvent('auth:unauthorized'));
      }

      throw error;
    }

    // Handle empty responses
    if (response.status === 204) {
      return {} as T;
    }

    return response.json();
  }

  /**
   * GET request
   */
  async get<T>(endpoint: string): Promise<T> {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: 'GET',
      headers: this.getHeaders(),
    });

    return this.handleResponse<T>(response);
  }

  /**
   * POST request
   */
  async post<T>(endpoint: string, data?: unknown): Promise<T> {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: data ? JSON.stringify(data) : undefined,
    });

    return this.handleResponse<T>(response);
  }

  /**
   * PUT request
   */
  async put<T>(endpoint: string, data: unknown): Promise<T> {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: 'PUT',
      headers: this.getHeaders(),
      body: JSON.stringify(data),
    });

    return this.handleResponse<T>(response);
  }

  /**
   * PATCH request
   */
  async patch<T>(endpoint: string, data: unknown): Promise<T> {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: 'PATCH',
      headers: this.getHeaders(),
      body: JSON.stringify(data),
    });

    return this.handleResponse<T>(response);
  }

  /**
   * DELETE request
   */
  async delete<T>(endpoint: string): Promise<T> {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: 'DELETE',
      headers: this.getHeaders(),
    });

    return this.handleResponse<T>(response);
  }

  /**
   * Upload file
   */
  async uploadFile<T>(endpoint: string, file: File, metadata?: Record<string, string>): Promise<T> {
    const formData = new FormData();
    formData.append('file', file);

    if (metadata) {
      Object.entries(metadata).forEach(([key, value]) => {
        formData.append(key, value);
      });
    }

    const headers: HeadersInit = {};
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: 'POST',
      headers,
      body: formData,
    });

    return this.handleResponse<T>(response);
  }
}

// Export singleton instance
export const apiClient = new ApiClient();
export default apiClient;

