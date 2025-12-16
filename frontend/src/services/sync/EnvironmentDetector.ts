/**
 * Environment Detector
 * 
 * Detects current environment: platform, network, auth state
 */

import { Platform, NetworkMode, AuthMode, Environment } from './types';

export class EnvironmentDetector {
  private static instance: EnvironmentDetector;
  private environment: Environment | null = null;
  private listeners: Set<(env: Environment) => void> = new Set();

  private constructor() {}

  static getInstance(): EnvironmentDetector {
    if (!EnvironmentDetector.instance) {
      EnvironmentDetector.instance = new EnvironmentDetector();
    }
    return EnvironmentDetector.instance;
  }

  /**
   * Initialize environment detection
   */
  async init(): Promise<Environment> {
    this.environment = {
      platform: this.detectPlatform(),
      network: this.detectNetwork(),
      auth: this.detectAuth(),
      userId: this.getUserId(),
      deviceId: this.getDeviceId(),
    };

    // Setup listeners for changes
    this.setupNetworkListener();
    this.setupAuthListener();

    return this.environment;
  }

  /**
   * Get current environment
   */
  getEnvironment(): Environment {
    if (!this.environment) {
      throw new Error('Environment not initialized');
    }
    return { ...this.environment };
  }

  /**
   * Subscribe to environment changes
   */
  subscribe(listener: (env: Environment) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /**
   * Update environment and notify listeners
   */
  private updateEnvironment(changes: Partial<Environment>): void {
    if (!this.environment) return;

    this.environment = {
      ...this.environment,
      ...changes,
    };

    this.notifyListeners();
  }

  /**
   * Notify all listeners
   */
  private notifyListeners(): void {
    if (!this.environment) return;
    this.listeners.forEach(listener => listener(this.environment!));
  }

  // ============================================================================
  // PLATFORM DETECTION
  // ============================================================================

  private detectPlatform(): Platform {
    // Check if running in Tauri
    if (window.__TAURI__) {
      return Platform.DESKTOP;
    }

    // Check if mobile
    if (/Android|iPhone|iPad|iPod/i.test(navigator.userAgent)) {
      return Platform.MOBILE;
    }

    return Platform.WEB;
  }

  // ============================================================================
  // NETWORK DETECTION
  // ============================================================================

  private detectNetwork(): NetworkMode {
    return navigator.onLine ? NetworkMode.ONLINE : NetworkMode.OFFLINE;
  }

  private setupNetworkListener(): void {
    window.addEventListener('online', () => {
      this.updateEnvironment({ network: NetworkMode.ONLINE });
    });

    window.addEventListener('offline', () => {
      this.updateEnvironment({ network: NetworkMode.OFFLINE });
    });
  }

  // ============================================================================
  // AUTH DETECTION
  // ============================================================================

  private detectAuth(): AuthMode {
    const token = localStorage.getItem('auth_token');
    return token ? AuthMode.AUTHENTICATED : AuthMode.GUEST;
  }

  private getUserId(): string | undefined {
    try {
      const userStr = localStorage.getItem('user');
      if (!userStr) return undefined;
      const user = JSON.parse(userStr);
      return user.id;
    } catch {
      return undefined;
    }
  }

  private setupAuthListener(): void {
    // Listen for storage changes (login/logout from other tabs)
    window.addEventListener('storage', (e) => {
      if (e.key === 'auth_token') {
        const auth = e.newValue ? AuthMode.AUTHENTICATED : AuthMode.GUEST;
        const userId = this.getUserId();
        this.updateEnvironment({ auth, userId });
      }
    });
  }

  // ============================================================================
  // DEVICE ID
  // ============================================================================

  private getDeviceId(): string {
    let deviceId = localStorage.getItem('device_id');
    
    if (!deviceId) {
      deviceId = this.generateDeviceId();
      localStorage.setItem('device_id', deviceId);
    }

    return deviceId;
  }

  private generateDeviceId(): string {
    return `device_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // ============================================================================
  // UTILITY METHODS
  // ============================================================================

  /**
   * Check if should use cloud sync
   */
  shouldUseCloudSync(): boolean {
    if (!this.environment) return false;
    return (
      this.environment.network === NetworkMode.ONLINE &&
      this.environment.auth === AuthMode.AUTHENTICATED
    );
  }

  /**
   * Check if should use local storage only
   */
  shouldUseLocalOnly(): boolean {
    if (!this.environment) return true;
    return (
      this.environment.network === NetworkMode.OFFLINE ||
      this.environment.auth === AuthMode.GUEST
    );
  }

  /**
   * Get storage key for current environment
   */
  getStorageKey(documentId: string): string {
    if (!this.environment) {
      return `yjs_${documentId}`;
    }

    const { platform, auth, userId, deviceId } = this.environment;

    // Guest mode: per-device storage
    if (auth === AuthMode.GUEST) {
      return `yjs_guest_${deviceId}_${documentId}`;
    }

    // Auth mode: per-user storage
    return `yjs_user_${userId}_${documentId}`;
  }
}

