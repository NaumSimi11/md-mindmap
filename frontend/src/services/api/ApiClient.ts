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
  // Prevent concurrent refreshes; shared promise for ongoing refresh
  private refreshPromise: Promise<any> | null = null;

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
        
        console.error('❌ API Error Response:', {
          status: response.status,
          statusText: response.statusText,
          data,
        });
        
        // Handle Pydantic validation errors (FastAPI 422)
        if (response.status === 422 && data.detail && Array.isArray(data.detail)) {
          // Extract validation error messages
          const validationErrors = data.detail.map((err: any) => {
            const field = err.loc ? err.loc[err.loc.length - 1] : 'field';
            const message = err.msg || 'Validation error';
            return `${field}: ${message}`;
          });
          error.message = validationErrors.join(', ');
          error.details = data;
        } else if (typeof data.detail === 'string') {
          error.message = data.detail;
          error.details = data;
        } else if (data.message) {
          error.message = data.message;
          error.details = data;
        } else {
          error.message = response.statusText || 'Request failed';
          error.details = data;
        }
      } catch (parseError) {
        // Response is not JSON or couldn't be parsed
        console.error('❌ Failed to parse error response:', parseError);
        error.message = response.statusText || `Request failed with status ${response.status}`;
      }

      console.error('❌ Throwing API Error:', error);

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
    const url = `${this.baseUrl}${endpoint}`;
    const response = await fetch(url, {
      method: 'GET',
      headers: this.getHeaders(),
    });

    if (response.status === 401 && this.shouldAttemptRefresh(endpoint)) {
      try {
        await this.attemptRefreshOnce();
        // Retry once
        const retryResp = await fetch(url, { method: 'GET', headers: this.getHeaders() });
        return this.handleResponse<T>(retryResp);
      } catch (err) {
        // Refresh failed — clear session and notify
        this.clearToken();
        window.dispatchEvent(new CustomEvent('auth:unauthorized'));
        throw err;
      }
    }

    return this.handleResponse<T>(response);
  }

  /**
   * POST request
   */
  async post<T>(endpoint: string, data?: unknown): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    console.log('🌐 POST request starting:', { url, hasData: !!data });
    
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: this.getHeaders(),
        body: data ? JSON.stringify(data) : undefined,
      });
      
      console.log('✅ POST response received:', { status: response.status, statusText: response.statusText });
      if (response.status === 401 && this.shouldAttemptRefresh(endpoint)) {
        try {
          await this.attemptRefreshOnce();
          const retryResp = await fetch(url, {
            method: 'POST',
            headers: this.getHeaders(),
            body: data ? JSON.stringify(data) : undefined,
          });
          return this.handleResponse<T>(retryResp);
        } catch (err) {
          this.clearToken();
          window.dispatchEvent(new CustomEvent('auth:unauthorized'));
          throw err;
        }
      }

      return this.handleResponse<T>(response);
    } catch (error) {
      console.error('❌ POST request failed (network error):', error);
      throw error;
    }
  }

  /**
   * PUT request
   */
  async put<T>(endpoint: string, data: unknown): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const response = await fetch(url, {
      method: 'PUT',
      headers: this.getHeaders(),
      body: JSON.stringify(data),
    });

    if (response.status === 401 && this.shouldAttemptRefresh(endpoint)) {
      try {
        await this.attemptRefreshOnce();
        const retryResp = await fetch(url, {
          method: 'PUT',
          headers: this.getHeaders(),
          body: JSON.stringify(data),
        });
        return this.handleResponse<T>(retryResp);
      } catch (err) {
        this.clearToken();
        window.dispatchEvent(new CustomEvent('auth:unauthorized'));
        throw err;
      }
    }

    return this.handleResponse<T>(response);
  }

  /**
   * PATCH request
   */
  async patch<T>(endpoint: string, data: unknown): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const response = await fetch(url, {
      method: 'PATCH',
      headers: this.getHeaders(),
      body: JSON.stringify(data),
    });

    if (response.status === 401 && this.shouldAttemptRefresh(endpoint)) {
      try {
        await this.attemptRefreshOnce();
        const retryResp = await fetch(url, {
          method: 'PATCH',
          headers: this.getHeaders(),
          body: JSON.stringify(data),
        });
        return this.handleResponse<T>(retryResp);
      } catch (err) {
        this.clearToken();
        window.dispatchEvent(new CustomEvent('auth:unauthorized'));
        throw err;
      }
    }

    return this.handleResponse<T>(response);
  }

  /**
   * DELETE request
   */
  async delete<T>(endpoint: string): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const response = await fetch(url, {
      method: 'DELETE',
      headers: this.getHeaders(),
    });

    if (response.status === 401 && this.shouldAttemptRefresh(endpoint)) {
      try {
        await this.attemptRefreshOnce();
        const retryResp = await fetch(url, { method: 'DELETE', headers: this.getHeaders() });
        return this.handleResponse<T>(retryResp);
      } catch (err) {
        this.clearToken();
        window.dispatchEvent(new CustomEvent('auth:unauthorized'));
        throw err;
      }
    }

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

    const url = `${this.baseUrl}${endpoint}`;
    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: formData,
    });

    if (response.status === 401 && this.shouldAttemptRefresh(endpoint)) {
      try {
        await this.attemptRefreshOnce();
        const retryResp = await fetch(url, { method: 'POST', headers: this.getHeaders(), body: formData });
        return this.handleResponse<T>(retryResp);
      } catch (err) {
        this.clearToken();
        window.dispatchEvent(new CustomEvent('auth:unauthorized'));
        throw err;
      }
    }

    return this.handleResponse<T>(response);
  }

  /**
   * Determine whether we should attempt a refresh for this endpoint.
   * Never attempt refresh for auth endpoints themselves.
   */
  private shouldAttemptRefresh(endpoint: string): boolean {
    const skipPaths = [
      API_ENDPOINTS.auth.refresh,
      API_ENDPOINTS.auth.login,
      API_ENDPOINTS.auth.signup,
    ];
    return !skipPaths.includes(endpoint);
  }

  /**
   * Attempt to refresh tokens once. Uses a shared promise to prevent concurrent refreshes.
   */
  private async attemptRefreshOnce(): Promise<void> {
    if (this.refreshPromise) {
      return this.refreshPromise;
    }

    // Dynamic import to avoid circular dependency
    const authModule = await import('./AuthService');
    const authService = authModule.authService;

    this.refreshPromise = (async () => {
      try {
        await authService.refreshToken();
      } finally {
        this.refreshPromise = null;
      }
    })();

    return this.refreshPromise;
  }
}

// Export singleton instance
export const apiClient = new ApiClient();
export default apiClient;

