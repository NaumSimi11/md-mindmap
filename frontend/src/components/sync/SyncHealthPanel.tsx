/**
 * Sync Health Panel - Diagnostics for durability snapshot system
 * 
 * Task 5: Expose sync internals for power users and support
 * 
 * Features:
 * - Real-time sync statistics
 * - Last N snapshot attempts
 * - Network status
 * - Force Sync Now button
 * - Copy diagnostics JSON
 * - Failed snapshot details
 */

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  RefreshCw, 
  Copy, 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  Cloud, 
  HardDrive,
  Wifi,
  WifiOff,
  Database,
  Clock,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { FailedSnapshotStore } from '@/services/snapshots/FailedSnapshotStore';
import { forceRetryAll, getPendingSnapshotCount } from '@/services/snapshots/SnapshotManager';
import { useToast } from '@/components/ui/use-toast';
import type { FailedSnapshot } from '@/services/offline/OfflineDatabase';

interface SyncStats {
  total: number;
  dueForRetry: number;
  circuitBreaker: number;
  oldestFailure: Date | null;
}

export const SyncHealthPanel: React.FC = () => {
  const [stats, setStats] = useState<SyncStats>({
    total: 0,
    dueForRetry: 0,
    circuitBreaker: 0,
    oldestFailure: null,
  });
  const [failedSnapshots, setFailedSnapshots] = useState<FailedSnapshot[]>([]);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isRetrying, setIsRetrying] = useState(false);
  const { toast } = useToast();
  
  // Load stats
  const loadStats = async () => {
    try {
      const statsData = await FailedSnapshotStore.getStats();
      setStats(statsData);
      
      // Load all failed snapshots for details
      const allSnapshots = await (window as any).offlineDB?.failed_snapshots?.toArray() || [];
      setFailedSnapshots(allSnapshots);
    } catch (error) {
      console.error('[SyncHealthPanel] Failed to load stats:', error);
    }
  };
  
  // Initial load and periodic refresh
  useEffect(() => {
    loadStats();
    const interval = setInterval(loadStats, 3000); // Refresh every 3s
    
    return () => clearInterval(interval);
  }, []);
  
  // Online/offline listener
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);
  
  // Force sync now
  const handleForceSync = async () => {
    setIsRetrying(true);
    try {
      await forceRetryAll();
      await loadStats();
      
      toast({
        title: '🔄 Sync Triggered',
        description: 'Attempting to retry all failed snapshots...',
        duration: 3000,
      });
      
      // Refresh stats after 2 seconds to show results
      setTimeout(loadStats, 2000);
    } catch (error) {
      console.error('[SyncHealthPanel] Force sync error:', error);
      toast({
        title: '❌ Sync Failed',
        description: 'Failed to trigger sync retry.',
        variant: 'destructive',
      });
    } finally {
      setIsRetrying(false);
    }
  };
  
  // Copy diagnostics JSON
  const handleCopyDiagnostics = () => {
    const diagnostics = {
      timestamp: new Date().toISOString(),
      stats,
      failedSnapshots: failedSnapshots.map(s => ({
        documentId: s.documentId,
        failedAt: new Date(s.failedAt).toISOString(),
        retryCount: s.retryCount,
        lastError: s.lastError,
        nextRetryAt: new Date(s.nextRetryAt).toISOString(),
      })),
      network: {
        online: isOnline,
        userAgent: navigator.userAgent,
      },
    };
    
    navigator.clipboard.writeText(JSON.stringify(diagnostics, null, 2));
    
    toast({
      title: '📋 Diagnostics Copied',
      description: 'Diagnostics JSON copied to clipboard',
      duration: 2000,
    });
  };
  
  // Format relative time
  const formatRelativeTime = (date: Date | null): string => {
    if (!date) return 'Never';
    
    const diff = Date.now() - date.getTime();
    const seconds = Math.floor(diff / 1000);
    
    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  };
  
  return (
    <div className="w-full max-w-4xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Sync Health</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Durability snapshot diagnostics and controls
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleCopyDiagnostics}
          >
            <Copy className="h-4 w-4 mr-2" />
            Copy Diagnostics
          </Button>
          
          <Button
            variant="default"
            size="sm"
            onClick={handleForceSync}
            disabled={isRetrying || stats.total === 0}
          >
            <RefreshCw className={cn('h-4 w-4 mr-2', isRetrying && 'animate-spin')} />
            Force Sync Now
          </Button>
        </div>
      </div>
      
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Network Status */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Network</p>
                <p className="text-2xl font-bold mt-1">
                  {isOnline ? 'Online' : 'Offline'}
                </p>
              </div>
              {isOnline ? (
                <Wifi className="h-8 w-8 text-green-500" />
              ) : (
                <WifiOff className="h-8 w-8 text-red-500" />
              )}
            </div>
          </CardContent>
        </Card>
        
        {/* Pending Snapshots */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pending</p>
                <p className="text-2xl font-bold mt-1">{stats.total}</p>
              </div>
              <Cloud className={cn(
                'h-8 w-8',
                stats.total === 0 ? 'text-green-500' : 'text-yellow-500'
              )} />
            </div>
          </CardContent>
        </Card>
        
        {/* Due for Retry */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Due Now</p>
                <p className="text-2xl font-bold mt-1">{stats.dueForRetry}</p>
              </div>
              <Clock className={cn(
                'h-8 w-8',
                stats.dueForRetry === 0 ? 'text-gray-400' : 'text-orange-500'
              )} />
            </div>
          </CardContent>
        </Card>
        
        {/* Circuit Breaker */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Paused</p>
                <p className="text-2xl font-bold mt-1">{stats.circuitBreaker}</p>
              </div>
              <AlertCircle className={cn(
                'h-8 w-8',
                stats.circuitBreaker === 0 ? 'text-gray-400' : 'text-red-500'
              )} />
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Failed Snapshots List */}
      <Card>
        <CardHeader>
          <CardTitle>Failed Snapshots</CardTitle>
        </CardHeader>
        <CardContent>
          {failedSnapshots.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <CheckCircle className="h-12 w-12 mx-auto mb-2 text-green-500" />
              <p>No failed snapshots. All changes backed up!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {failedSnapshots.map((snapshot) => (
                <div
                  key={snapshot.id}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent/50 transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <code className="text-sm font-mono bg-muted px-2 py-0.5 rounded">
                        {snapshot.documentId.slice(0, 8)}...
                      </code>
                      
                      {snapshot.retryCount >= 5 ? (
                        <Badge variant="destructive">Circuit Breaker</Badge>
                      ) : (
                        <Badge variant="secondary">Retry {snapshot.retryCount}/5</Badge>
                      )}
                    </div>
                    
                    <p className="text-xs text-muted-foreground mt-1">
                      Failed: {formatRelativeTime(new Date(snapshot.failedAt))}
                      {' • '}
                      Next retry: {formatRelativeTime(new Date(snapshot.nextRetryAt))}
                    </p>
                    
                    {snapshot.lastError && (
                      <p className="text-xs text-red-500 mt-1">
                        Error: {snapshot.lastError}
                      </p>
                    )}
                  </div>
                  
                  <div>
                    {snapshot.retryCount >= 5 ? (
                      <XCircle className="h-5 w-5 text-red-500" />
                    ) : (
                      <AlertCircle className="h-5 w-5 text-yellow-500" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* System Info */}
      <Card>
        <CardHeader>
          <CardTitle>System Info</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Oldest Failure:</span>
            <span className="font-mono">
              {stats.oldestFailure ? formatRelativeTime(stats.oldestFailure) : 'None'}
            </span>
          </div>
          
          <Separator />
          
          <div className="flex justify-between">
            <span className="text-muted-foreground">Browser:</span>
            <span className="font-mono text-xs">
              {navigator.userAgent.split(' ').slice(-2).join(' ')}
            </span>
          </div>
          
          <div className="flex justify-between">
            <span className="text-muted-foreground">Connection:</span>
            <span className="font-mono">
              {isOnline ? 'Connected' : 'Disconnected'}
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

