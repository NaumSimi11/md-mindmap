/**
 * Connection State Machine
 * 
 * Manages connection state transitions with explicit rules
 */

import { ConnectionState, ConnectionStateInfo, SyncError, SyncErrorCode } from './types';

export class ConnectionStateMachine {
  private currentState: ConnectionState = ConnectionState.INITIALIZING;
  private stateHistory: ConnectionStateInfo[] = [];
  private listeners: Set<(info: ConnectionStateInfo) => void> = new Set();
  private retryCount = 0;
  private maxRetries = 5;

  constructor(maxRetries: number = 5) {
    this.maxRetries = maxRetries;
    this.recordState(ConnectionState.INITIALIZING);
  }

  /**
   * Get current state
   */
  getState(): ConnectionState {
    return this.currentState;
  }

  /**
   * Get current state info
   */
  getStateInfo(): ConnectionStateInfo {
    return this.stateHistory[this.stateHistory.length - 1];
  }

  /**
   * Get state history
   */
  getHistory(): ConnectionStateInfo[] {
    return [...this.stateHistory];
  }

  /**
   * Subscribe to state changes
   */
  subscribe(listener: (info: ConnectionStateInfo) => void): () => void {
    this.listeners.add(listener);
    // Immediately notify with current state
    listener(this.getStateInfo());
    return () => this.listeners.delete(listener);
  }

  // ============================================================================
  // STATE TRANSITIONS
  // ============================================================================

  /**
   * Transition to DISCONNECTED
   */
  disconnect(): void {
    this.validateTransition(ConnectionState.DISCONNECTED);
    this.transitionTo(ConnectionState.DISCONNECTED);
  }

  /**
   * Transition to CONNECTING
   */
  connect(): void {
    this.validateTransition(ConnectionState.CONNECTING);
    this.transitionTo(ConnectionState.CONNECTING);
  }

  /**
   * Transition to CONNECTED
   */
  connected(): void {
    this.validateTransition(ConnectionState.CONNECTED);
    this.retryCount = 0; // Reset retry count on success
    this.transitionTo(ConnectionState.CONNECTED);
  }

  /**
   * Transition to SYNCING
   */
  startSync(): void {
    this.validateTransition(ConnectionState.SYNCING);
    this.transitionTo(ConnectionState.SYNCING);
  }

  /**
   * Transition to SYNCED
   */
  synced(): void {
    this.validateTransition(ConnectionState.SYNCED);
    this.transitionTo(ConnectionState.SYNCED);
  }

  /**
   * Transition to ERROR (recoverable)
   */
  error(error: Error): void {
    this.retryCount++;
    
    if (this.retryCount >= this.maxRetries) {
      this.fatal(error);
      return;
    }

    const nextRetry = Date.now() + this.calculateBackoff();
    this.transitionTo(ConnectionState.ERROR, error, nextRetry);
  }

  /**
   * Transition to FATAL (unrecoverable)
   */
  fatal(error: Error): void {
    this.transitionTo(ConnectionState.FATAL, error);
  }

  /**
   * Reset state machine (for retry)
   */
  reset(): void {
    this.retryCount = 0;
    this.transitionTo(ConnectionState.INITIALIZING);
  }

  // ============================================================================
  // INTERNAL METHODS
  // ============================================================================

  /**
   * Validate transition is allowed
   */
  private validateTransition(newState: ConnectionState): void {
    const allowed = this.isTransitionAllowed(this.currentState, newState);
    
    if (!allowed) {
      throw new SyncError(
        SyncErrorCode.FATAL_ERROR,
        `Invalid state transition: ${this.currentState} -> ${newState}`,
        false
      );
    }
  }

  /**
   * Check if transition is allowed
   */
  private isTransitionAllowed(from: ConnectionState, to: ConnectionState): boolean {
    // Define allowed transitions
    const transitions: Record<ConnectionState, ConnectionState[]> = {
      [ConnectionState.INITIALIZING]: [
        ConnectionState.DISCONNECTED,
        ConnectionState.CONNECTING,
        ConnectionState.ERROR,
        ConnectionState.FATAL,
      ],
      [ConnectionState.DISCONNECTED]: [
        ConnectionState.CONNECTING,
        ConnectionState.FATAL,
      ],
      [ConnectionState.CONNECTING]: [
        ConnectionState.CONNECTED,
        ConnectionState.DISCONNECTED,
        ConnectionState.ERROR,
        ConnectionState.FATAL,
      ],
      [ConnectionState.CONNECTED]: [
        ConnectionState.SYNCING,
        ConnectionState.DISCONNECTED,
        ConnectionState.ERROR,
        ConnectionState.FATAL,
      ],
      [ConnectionState.SYNCING]: [
        ConnectionState.SYNCED,
        ConnectionState.ERROR,
        ConnectionState.DISCONNECTED,
        ConnectionState.FATAL,
      ],
      [ConnectionState.SYNCED]: [
        ConnectionState.SYNCING,
        ConnectionState.DISCONNECTED,
        ConnectionState.ERROR,
        ConnectionState.FATAL,
      ],
      [ConnectionState.ERROR]: [
        ConnectionState.CONNECTING,
        ConnectionState.DISCONNECTED,
        ConnectionState.FATAL,
      ],
      [ConnectionState.FATAL]: [], // No transitions from FATAL
    };

    return transitions[from]?.includes(to) ?? false;
  }

  /**
   * Perform state transition
   */
  private transitionTo(
    newState: ConnectionState,
    error?: Error,
    nextRetry?: number
  ): void {
    this.currentState = newState;
    this.recordState(newState, error, nextRetry);
    this.notifyListeners();
  }

  /**
   * Record state in history
   */
  private recordState(
    state: ConnectionState,
    error?: Error,
    nextRetry?: number
  ): void {
    const info: ConnectionStateInfo = {
      state,
      timestamp: Date.now(),
      error,
      retryCount: this.retryCount,
      nextRetry,
    };

    this.stateHistory.push(info);

    // Keep only last 100 states
    if (this.stateHistory.length > 100) {
      this.stateHistory.shift();
    }
  }

  /**
   * Notify all listeners
   */
  private notifyListeners(): void {
    const info = this.getStateInfo();
    this.listeners.forEach(listener => listener(info));
  }

  /**
   * Calculate exponential backoff
   */
  private calculateBackoff(): number {
    const baseDelay = 1000; // 1 second
    const maxDelay = 30000; // 30 seconds
    const delay = Math.min(
      baseDelay * Math.pow(2, this.retryCount),
      maxDelay
    );
    // Add jitter (±20%)
    const jitter = delay * 0.2 * (Math.random() - 0.5);
    return Math.floor(delay + jitter);
  }

  // ============================================================================
  // UTILITY METHODS
  // ============================================================================

  /**
   * Check if in error state
   */
  isError(): boolean {
    return this.currentState === ConnectionState.ERROR;
  }

  /**
   * Check if in fatal state
   */
  isFatal(): boolean {
    return this.currentState === ConnectionState.FATAL;
  }

  /**
   * Check if connected
   */
  isConnected(): boolean {
    return [
      ConnectionState.CONNECTED,
      ConnectionState.SYNCING,
      ConnectionState.SYNCED,
    ].includes(this.currentState);
  }

  /**
   * Check if can retry
   */
  canRetry(): boolean {
    return (
      this.currentState === ConnectionState.ERROR &&
      this.retryCount < this.maxRetries
    );
  }

  /**
   * Get time until next retry
   */
  getTimeUntilRetry(): number | null {
    const info = this.getStateInfo();
    if (!info.nextRetry) return null;
    return Math.max(0, info.nextRetry - Date.now());
  }
}

