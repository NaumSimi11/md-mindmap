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
      setIsLoading(true);
      setError(null);
      
      const response = await authService.login(credentials);
      
    
      
      if (!response.user) {
        console.error('❌ No user in response!', response);
        throw new Error('Login response missing user data');
      }
      
      setUser(response.user);
      
      // Dispatch login event for WorkspaceContext to react
      window.dispatchEvent(new CustomEvent('auth:login', { detail: { user: response.user } }));
      
    } catch (err: any) {
      console.error('❌ useAuth.login() failed:', err);
      // Extract error message from ApiError or generic Error
      const message = err.message || err.detail || 'Invalid email or password. Please try again.';
      setError(message);
      // Throw the error so Login.tsx can catch it and show the toast
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const signup = useCallback(async (data: SignupRequest) => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await authService.signup(data);
      setUser(response.user);
    } catch (err: any) {
      console.error('❌ useAuth.signup() failed:', err);
      // Extract error message from ApiError or generic Error
      const message = err.message || err.detail || 'Signup failed. Please try again.';
      setError(message);
      // Throw the error so Signup.tsx can catch it and show the toast
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      setIsLoading(true);
      
      // Check for pending changes before logout
      const { offlineDB } = await import('@/services/offline/OfflineDatabase');
      const pendingCount = await offlineDB.pending_changes.count();
      
      if (pendingCount > 0) {
        const confirmed = window.confirm(
          `You have ${pendingCount} unsaved change(s) that haven't been synced yet.\n\nLogging out will discard them. Continue?`
        );
        if (!confirmed) {
          setIsLoading(false);
          return;
        }
      }
      
      // Dispatch logout event for cleanup (e.g., SyncManager)
      window.dispatchEvent(new CustomEvent('auth:logout'));
      
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

