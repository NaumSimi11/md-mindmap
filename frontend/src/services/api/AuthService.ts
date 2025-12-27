/**
 * Authentication Service
 * Handles user authentication and session management
 * 
 * Uses safeStorage to handle SSR and private browsing mode gracefully
 */

import { apiClient } from './ApiClient';
import { API_ENDPOINTS } from '@/config/api.config';
import { safeStorage, jsonStorage, StorageKeys } from '@/utils/storage';
import type { User, LoginRequest, SignupRequest, AuthResponse } from '@/types/api.types';

export class AuthService {
  /**
   * Sign up a new user
   */
  async signup(data: SignupRequest): Promise<AuthResponse> {
    console.log('🔐 AuthService.signup() called');
    
    const response = await apiClient.post<any>(API_ENDPOINTS.auth.signup, data);
    
    console.log('✅ Signup response received:', {
      hasUser: !!response.user,
      hasToken: !!response.access_token
    });
    
    // Store tokens
    apiClient.setToken(response.access_token);
    safeStorage.setItem(StorageKeys.REFRESH_TOKEN, response.refresh_token);
    
    // Backend might not return user in signup response, fetch it if missing
    if (!response.user) {
      console.log('📞 Fetching user via /me...');
      const user = await this.getCurrentUser();
      console.log('✅ User fetched:', { username: user.username, email: user.email });
      
      return {
        ...response,
        user
      };
    }
    
    jsonStorage.set(StorageKeys.USER, response.user);
    return response;
  }

  /**
   * Login user
   */
  async login(data: LoginRequest): Promise<AuthResponse> {
    console.log('🔐 AuthService.login() called');
    
    const response = await apiClient.post<any>(API_ENDPOINTS.auth.login, data);
    
    console.log('✅ Login response received:', {
      hasUser: !!response.user,
      hasToken: !!response.access_token
    });
    
    // Store tokens
    apiClient.setToken(response.access_token);
    safeStorage.setItem(StorageKeys.REFRESH_TOKEN, response.refresh_token);
    
    // Backend doesn't return user in login response, fetch it
    if (!response.user) {
      console.log('📞 Fetching user via /me...');
      const user = await this.getCurrentUser();
      console.log('✅ User fetched:', { username: user.username, email: user.email });
      
      return {
        ...response,
        user
      };
    }
    
    jsonStorage.set(StorageKeys.USER, response.user);
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
    jsonStorage.set(StorageKeys.USER, user);
    return user;
  }

  /**
   * Refresh access token
   */
  async refreshToken(): Promise<string> {
    const refreshToken = safeStorage.getItem(StorageKeys.REFRESH_TOKEN);
    
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    const response = await apiClient.post<any>(
      API_ENDPOINTS.auth.refresh,
      { refresh_token: refreshToken }
    );

    // Persist rotated tokens (server rotates refresh tokens)
    if (response.access_token) {
      apiClient.setToken(response.access_token);
    }
    if (response.refresh_token) {
      safeStorage.setItem(StorageKeys.REFRESH_TOKEN, response.refresh_token);
    }

    return response;
  }

  /**
   * Check if user is authenticated
   * Uses safeStorage for SSR/private browsing compatibility
   */
  isAuthenticated(): boolean {
    return !!safeStorage.getItem(StorageKeys.AUTH_TOKEN);
  }

  /**
   * Get stored user
   * Uses jsonStorage for type-safe parsing with SSR/private browsing fallback
   */
  getStoredUser(): User | null {
    return jsonStorage.get<User>(StorageKeys.USER);
  }

  /**
   * Clear session
   */
  clearSession(): void {
    apiClient.clearToken();
    safeStorage.removeItem(StorageKeys.REFRESH_TOKEN);
    safeStorage.removeItem(StorageKeys.USER);
  }
}

// Export singleton instance
export const authService = new AuthService();
export default authService;

