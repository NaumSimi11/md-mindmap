/**
 * API Client
 * Handles all HTTP requests to the backend
 * 
 * IMPORTANT: Token is now loaded dynamically on each request, not at construction.
 * This ensures tokens are fresh and handles SSR/private browsing mode.
 */

import { API_CONFIG, API_ENDPOINTS } from '@/config/api.config';
import { safeStorage, StorageKeys } from '@/utils/storage';

export interface ApiError {
  message: string;
  status: number;
  details?: unknown;
}

export class ApiClient {
  private baseUrl: string;
  // Token is cached but refreshed on every request
  private token: string | null = null;
  // Prevent concurrent refreshes; shared promise for ongoing refresh
  private refreshPromise: Promise<any> | null = null;

  constructor() {
    this.baseUrl = API_CONFIG.baseUrl;
    // 🔥 FIX: Don't load token at construction - load dynamically on each request
    // This prevents stale tokens and handles SSR/private browsing mode
  }

  /**
   * Set authentication token
   * Updates both in-memory cache and storage
   */
  setToken(token: string) {
    this.token = token;
    safeStorage.setItem(StorageKeys.AUTH_TOKEN, token);
  }

  /**
   * Clear authentication token
   * Clears both in-memory cache and storage
   */
  clearToken() {
    this.token = null;
    safeStorage.removeItem(StorageKeys.AUTH_TOKEN);
  }

  /**
   * Get the current token, loading from storage if needed
   * Always reads fresh from storage to handle external changes (login in another tab)
   */
  private getToken(): string | null {
    // Always read fresh from storage to catch external changes
    const storedToken = safeStorage.getItem(StorageKeys.AUTH_TOKEN);
    this.token = storedToken;
    return this.token;
  }

  /**
   * Get authorization headers
   * Token is loaded fresh on each call
   */
  private getHeaders(): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    const token = this.getToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
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

    if (process.env.NODE_ENV === 'development' && !this.token) {
      // Dev-only: warn if we're calling obviously-authenticated endpoints without a token
      if (endpoint.startsWith('/api/v1/workspaces') ||
          endpoint.startsWith('/api/v1/documents') ||
          endpoint.startsWith('/api/v1/users/me') ||
          endpoint.includes('/snapshot') ||
          endpoint.startsWith('/api/v1/shares')) {
        // eslint-disable-next-line no-console
        console.warn('[ApiClient] GET without auth token for endpoint that usually requires auth:', { endpoint });
      }
    }

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

    // Get fresh token for file upload (no Content-Type header for multipart)
    const token = this.getToken();
    const headers: HeadersInit = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
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

