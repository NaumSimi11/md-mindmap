/**
 * useAuth Hook
 * Manages authentication state and operations
 */

import { useState, useEffect, useCallback } from 'react';
import { authService } from '@/services/api';
import type { User, LoginRequest, SignupRequest } from '@/types/api.types';

interface UseAuthReturn {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (credentials: LoginRequest) => Promise<void>;
  signup: (data: SignupRequest) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

export function useAuth(): UseAuthReturn {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load user on mount
  useEffect(() => {
    const loadUser = async () => {
      try {
        if (authService.isAuthenticated()) {
          const currentUser = await authService.getCurrentUser();
          setUser(currentUser);
        }
      } catch (err) {
        console.error('Failed to load user:', err);
        authService.clearSession();
      } finally {
        setIsLoading(false);
      }
    };

    loadUser();

    // Listen for unauthorized events
    const handleUnauthorized = () => {
      setUser(null);
      authService.clearSession();
    };

    window.addEventListener('auth:unauthorized', handleUnauthorized);
    return () => window.removeEventListener('auth:unauthorized', handleUnauthorized);
  }, []);

  const login = useCallback(async (credentials: LoginRequest) => {
    try {
      console.log('🔐 useAuth.login() called');
      setIsLoading(true);
      setError(null);
      
      console.log('📞 Calling authService.login()...');
      const response = await authService.login(credentials);
      
      console.log('✅ authService.login() completed, response:', {
        hasUser: !!response.user,
        hasToken: !!response.access_token
      });
      
      if (!response.user) {
        console.error('❌ No user in response!', response);
        throw new Error('Login response missing user data');
      }
      
      console.log('📝 Setting user state...');
      setUser(response.user);
      console.log('✅ User state set');
      
      // Dispatch login event for WorkspaceContext to react
      window.dispatchEvent(new CustomEvent('auth:login', { detail: { user: response.user } }));
      console.log('✅ Login successful, user set:', response.user.username || response.user.email);
      
      console.log('✅ useAuth.login() completed successfully');
    } catch (err: any) {
      console.error('❌ useAuth.login() failed:', err);
      const message = err.message || 'Login failed';
      setError(message);
      throw new Error(message);
    } finally {
      setIsLoading(false);
      console.log('✅ useAuth.login() finally block - isLoading set to false');
    }
  }, []);

  const signup = useCallback(async (data: SignupRequest) => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await authService.signup(data);
      setUser(response.user);
    } catch (err: any) {
      const message = err.message || 'Signup failed';
      setError(message);
      throw new Error(message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      setIsLoading(true);
      await authService.logout();
      setUser(null);
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const refreshUser = useCallback(async () => {
    try {
      const currentUser = await authService.getCurrentUser();
      setUser(currentUser);
    } catch (err) {
      console.error('Failed to refresh user:', err);
      setUser(null);
      authService.clearSession();
    }
  }, []);

  return {
    user,
    isAuthenticated: !!user,
    isLoading,
    error,
    login,
    signup,
    logout,
    refreshUser,
  };
}

export default useAuth;

