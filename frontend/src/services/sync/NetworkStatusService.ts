/**
 * NetworkStatusService
 * 
 * Monitors network connectivity and provides events for online/offline transitions.
 * Used by AutoSyncManager to trigger syncs when coming back online.
 */

type NetworkCallback = (online: boolean) => void;

class NetworkStatusService {
  private static instance: NetworkStatusService | null = null;
  private listeners: Set<NetworkCallback> = new Set();
  private _isOnline: boolean = true;
  private initialized: boolean = false;

  private constructor() {
    // Private constructor for singleton
  }

  static getInstance(): NetworkStatusService {
    if (!NetworkStatusService.instance) {
      NetworkStatusService.instance = new NetworkStatusService();
    }
    return NetworkStatusService.instance;
  }

  /**
   * Initialize network listeners
   * Safe to call multiple times
   */
  init(): void {
    if (this.initialized) return;
    
    if (typeof window === 'undefined') {
      // SSR environment
      this._isOnline = true;
      this.initialized = true;
      return;
    }

    // Initial state
    this._isOnline = navigator.onLine;

    // Listen for online/offline events
    window.addEventListener('online', this.handleOnline);
    window.addEventListener('offline', this.handleOffline);

    // Also poll periodically (some browsers have unreliable events)
    this.startPolling();

    this.initialized = true;
    console.log(`🌐 [NetworkStatus] Initialized. Online: ${this._isOnline}`);
  }

  /**
   * Cleanup listeners
   */
  destroy(): void {
    if (typeof window !== 'undefined') {
      window.removeEventListener('online', this.handleOnline);
      window.removeEventListener('offline', this.handleOffline);
    }
    this.stopPolling();
    this.listeners.clear();
    this.initialized = false;
  }

  /**
   * Current network status
   */
  isOnline(): boolean {
    return this._isOnline;
  }

  /**
   * Subscribe to network status changes
   * @returns Unsubscribe function
   */
  onStatusChange(callback: NetworkCallback): () => void {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  /**
   * Force a status check (useful for testing)
   */
  async checkConnectivity(): Promise<boolean> {
    if (typeof navigator === 'undefined') return true;
    
    // navigator.onLine can be unreliable, so we also try a fetch
    if (!navigator.onLine) {
      this.setOnline(false);
      return false;
    }

    try {
      // Try to reach our backend
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 3000);
      
      const response = await fetch('/api/v1/health', {
        method: 'HEAD',
        signal: controller.signal,
      });
      
      clearTimeout(timeout);
      this.setOnline(response.ok);
      return response.ok;
    } catch {
      // Network error - but navigator.onLine is true
      // This could be backend down vs network down
      // We'll trust navigator.onLine in this case
      this.setOnline(navigator.onLine);
      return navigator.onLine;
    }
  }

  // ==========================================================================
  // Private Methods
  // ==========================================================================

  private handleOnline = (): void => {
    console.log('🌐 [NetworkStatus] Browser reports ONLINE');
    this.setOnline(true);
  };

  private handleOffline = (): void => {
    console.log('🌐 [NetworkStatus] Browser reports OFFLINE');
    this.setOnline(false);
  };

  private setOnline(online: boolean): void {
    const wasOnline = this._isOnline;
    this._isOnline = online;

    if (wasOnline !== online) {
      console.log(`🌐 [NetworkStatus] Status changed: ${wasOnline} → ${online}`);
      this.notifyListeners(online);
    }
  }

  private notifyListeners(online: boolean): void {
    this.listeners.forEach(callback => {
      try {
        callback(online);
      } catch (error) {
        console.error('🌐 [NetworkStatus] Listener error:', error);
      }
    });
  }

  private pollInterval: ReturnType<typeof setInterval> | null = null;

  private startPolling(): void {
    // Poll every 30 seconds as a fallback
    this.pollInterval = setInterval(() => {
      const currentStatus = navigator.onLine;
      if (currentStatus !== this._isOnline) {
        this.setOnline(currentStatus);
      }
    }, 30000);
  }

  private stopPolling(): void {
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
      this.pollInterval = null;
    }
  }
}

export const networkStatusService = NetworkStatusService.getInstance();

