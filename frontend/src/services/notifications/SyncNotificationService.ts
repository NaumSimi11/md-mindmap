/**
 * Sync Notification Service - User notifications for sync failures
 * 
 * Task 4: Notify users when cloud backup fails persistently
 * 
 * Rules:
 * - Show toast after circuit breaker triggers (5 failures)
 * - Auto-dismiss after successful sync
 * - Non-intrusive (dismissible)
 * - Clear messaging: "Changes saved locally. Cloud backup paused."
 */

import { toast } from '@/components/ui/use-toast';

/**
 * Notification state tracking (singleton)
 */
class SyncNotificationService {
  private static instance: SyncNotificationService | null = null;
  private circuitBreakerNotificationShown: boolean = false;
  private recoveryNotificationShown: boolean = false;
  
  private constructor() {
    console.log('📢 [SyncNotificationService] Initialized');
  }
  
  static getInstance(): SyncNotificationService {
    if (!this.instance) {
      this.instance = new SyncNotificationService();
    }
    return this.instance;
  }
  
  /**
   * Notify user that circuit breaker has triggered
   * (Called after 5 consecutive failures)
   */
  notifyCircuitBreakerTriggered(documentId: string): void {
    // Only show once per session (avoid spam)
    if (this.circuitBreakerNotificationShown) {
      return;
    }
    
    this.circuitBreakerNotificationShown = true;
    this.recoveryNotificationShown = false;
    
    toast({
      title: '⚠️ Cloud Backup Paused',
      description: 'Your changes are saved locally. Cloud backup will retry automatically when connection improves.',
      variant: 'destructive',
      duration: 10000, // 10 seconds (longer than default)
    });
    
    console.warn(`📢 [SyncNotification] Circuit breaker notification shown for: ${documentId}`);
  }
  
  /**
   * Notify user that sync has recovered after circuit breaker
   * (Called after successful retry following circuit breaker)
   */
  notifyRecovery(): void {
    // Only show if circuit breaker was triggered
    if (!this.circuitBreakerNotificationShown || this.recoveryNotificationShown) {
      return;
    }
    
    this.recoveryNotificationShown = true;
    this.circuitBreakerNotificationShown = false;
    
    toast({
      title: '✅ Cloud Backup Restored',
      description: 'Your documents are now being backed up to the cloud.',
      variant: 'default',
      duration: 5000,
    });
    
    console.log('📢 [SyncNotification] Recovery notification shown');
  }
  
  /**
   * Notify user that multiple snapshots are pending (soft warning)
   * (Called when pending count > 3 but not yet circuit breaker)
   */
  notifyPendingSnapshots(count: number): void {
    // Only show if not already in circuit breaker state
    if (this.circuitBreakerNotificationShown) {
      return;
    }
    
    toast({
      title: '⏳ Cloud Backup Delayed',
      description: `${count} backup${count > 1 ? 's' : ''} pending. Your changes are safe locally.`,
      variant: 'default',
      duration: 5000,
    });
    
    console.warn(`📢 [SyncNotification] Pending snapshots notification shown: ${count}`);
  }
  
  /**
   * Reset notification state (for testing or logout)
   */
  reset(): void {
    this.circuitBreakerNotificationShown = false;
    this.recoveryNotificationShown = false;
    console.log('📢 [SyncNotification] State reset');
  }
}

export const syncNotificationService = SyncNotificationService.getInstance();

