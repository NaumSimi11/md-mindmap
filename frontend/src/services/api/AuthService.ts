/**
 * Authentication Service
 * Handles user authentication and session management
 */

import { apiClient } from './ApiClient';
import { API_ENDPOINTS } from '@/config/api.config';
import type { User, LoginRequest, SignupRequest, AuthResponse } from '@/types/api.types';

export class AuthService {
  /**
   * Sign up a new user
   */
  async signup(data: SignupRequest): Promise<AuthResponse> {
    const response = await apiClient.post<AuthResponse>(API_ENDPOINTS.auth.signup, data);
    
    // Store tokens
    apiClient.setToken(response.access_token);
    localStorage.setItem('refresh_token', response.refresh_token);
    localStorage.setItem('user', JSON.stringify(response.user));

    return response;
  }

  /**
   * Login user
   */
  async login(data: LoginRequest): Promise<AuthResponse> {
    const response = await apiClient.post<AuthResponse>(API_ENDPOINTS.auth.login, data);
    
    // Store tokens
    apiClient.setToken(response.access_token);
    localStorage.setItem('refresh_token', response.refresh_token);
    localStorage.setItem('user', JSON.stringify(response.user));

    return response;
  }

  /**
   * Logout user
   */
  async logout(): Promise<void> {
    try {
      await apiClient.post(API_ENDPOINTS.auth.logout);
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      this.clearSession();
    }
  }

  /**
   * Get current user
   */
  async getCurrentUser(): Promise<User> {
    const user = await apiClient.get<User>(API_ENDPOINTS.auth.me);
    localStorage.setItem('user', JSON.stringify(user));
    return user;
  }

  /**
   * Refresh access token
   */
  async refreshToken(): Promise<string> {
    const refreshToken = localStorage.getItem('refresh_token');
    
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    const response = await apiClient.post<{ access_token: string }>(
      API_ENDPOINTS.auth.refresh,
      { refresh_token: refreshToken }
    );

    apiClient.setToken(response.access_token);
    return response.access_token;
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    return !!localStorage.getItem('auth_token');
  }

  /**
   * Get stored user
   */
  getStoredUser(): User | null {
    const userStr = localStorage.getItem('user');
    if (!userStr) return null;
    
    try {
      return JSON.parse(userStr);
    } catch {
      return null;
    }
  }

  /**
   * Clear session
   */
  clearSession(): void {
    apiClient.clearToken();
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
  }
}

// Export singleton instance
export const authService = new AuthService();
export default authService;

