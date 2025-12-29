/**
 * Sync Test Page
 * 
 * Test page for the new sync system.
 * Navigate to /sync-test to use this.
 */

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { SyncToggle, SyncStatusBadge } from '@/components/sync';
import { syncModeService } from '@/services/sync/SyncModeService';
import { autoSyncManager } from '@/services/sync/AutoSyncManager';
import { networkStatusService } from '@/services/sync/NetworkStatusService';
import { guestWorkspaceService } from '@/services/workspace/GuestWorkspaceService';
import { authService } from '@/services/api';
import type { DocumentMeta, SyncMode } from '@/services/workspace/types';
import { RefreshCw, Wifi, WifiOff, Cloud, HardDrive } from 'lucide-react';

export default function SyncTest() {
  const [documents, setDocuments] = useState<DocumentMeta[]>([]);
  const [isOnline, setIsOnline] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [syncStats, setSyncStats] = useState({ totalSynced: 0, totalFailed: 0, pendingCount: 0 });
  const [loading, setLoading] = useState(true);

  // Load documents and status
  useEffect(() => {
    loadData();
    
    // Subscribe to network status
    const unsubNetwork = networkStatusService.onStatusChange(setIsOnline);
    
    // Check auth
    setIsAuthenticated(authService.isAuthenticated());
    
    // Poll for updates
    const interval = setInterval(() => {
      setSyncStats(autoSyncManager.getStats());
    }, 1000);

    return () => {
      unsubNetwork();
      clearInterval(interval);
    };
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const workspaces = await guestWorkspaceService.getAllWorkspaces();
      const allDocs: DocumentMeta[] = [];
      
      for (const ws of workspaces) {
        const docs = await guestWorkspaceService.getDocumentsForWorkspace(ws.id);
        allDocs.push(...docs);
      }
      
      setDocuments(allDocs);
      setIsOnline(networkStatusService.isOnline());
      setSyncStats(autoSyncManager.getStats());
    } catch (error) {
      console.error('Failed to load documents:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSyncModeChange = async (docId: string, newMode: SyncMode) => {
    // Refresh the document list
    await loadData();
  };

  const handleSyncAll = async () => {
    const result = await autoSyncManager.syncAll();
    console.log('Sync all result:', result);
    await loadData();
  };

  const getSyncMode = (doc: DocumentMeta): SyncMode => {
    return syncModeService.getSyncMode(doc);
  };

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Sync Test Page</h1>
            <p className="text-muted-foreground">Test the new auto-sync system</p>
          </div>
          <Button onClick={loadData} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>

        {/* Status Cards */}
        <div className="grid grid-cols-3 gap-4">
          {/* Network Status */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Network</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                {isOnline ? (
                  <>
                    <Wifi className="h-5 w-5 text-green-500" />
                    <span className="text-green-500 font-medium">Online</span>
                  </>
                ) : (
                  <>
                    <WifiOff className="h-5 w-5 text-red-500" />
                    <span className="text-red-500 font-medium">Offline</span>
                  </>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Auth Status */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Authentication</CardTitle>
            </CardHeader>
            <CardContent>
              <Badge variant={isAuthenticated ? 'default' : 'secondary'}>
                {isAuthenticated ? 'Logged In' : 'Guest Mode'}
              </Badge>
            </CardContent>
          </Card>

          {/* Sync Stats */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Sync Stats</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-sm space-y-1">
                <div>✅ Synced: {syncStats.totalSynced}</div>
                <div>❌ Failed: {syncStats.totalFailed}</div>
                <div>⏳ Pending: {syncStats.pendingCount}</div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Actions</CardTitle>
            <CardDescription>Test sync operations</CardDescription>
          </CardHeader>
          <CardContent className="flex gap-2">
            <Button onClick={handleSyncAll} disabled={!isAuthenticated}>
              <Cloud className="h-4 w-4 mr-2" />
              Sync All Cloud-Enabled Docs
            </Button>
            <Button variant="outline" onClick={() => networkStatusService.checkConnectivity()}>
              Check Connectivity
            </Button>
          </CardContent>
        </Card>

        {/* Documents List */}
        <Card>
          <CardHeader>
            <CardTitle>Documents ({documents.length})</CardTitle>
            <CardDescription>
              Click the cloud icon to enable/disable cloud sync for each document
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8 text-muted-foreground">Loading...</div>
            ) : documents.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No documents found. Create one in /workspace first.
              </div>
            ) : (
              <div className="space-y-2">
                {documents.map((doc) => {
                  const syncMode = getSyncMode(doc);
                  return (
                    <div
                      key={doc.id}
                      className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        {/* Sync Status Badge */}
                        <SyncStatusBadge
                          syncMode={syncMode}
                          syncStatus={doc.syncStatus}
                          lastSyncedAt={doc.lastSyncedAt}
                          size="md"
                        />
                        
                        {/* Document Info */}
                        <div>
                          <div className="font-medium">{doc.title}</div>
                          <div className="text-xs text-muted-foreground">
                            {doc.id.slice(0, 8)}... • {doc.syncStatus}
                            {doc.cloudId && ` • Cloud: ${doc.cloudId.slice(0, 8)}...`}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {/* Sync Mode Badge */}
                        <Badge variant={syncMode === 'cloud-enabled' ? 'default' : 'outline'}>
                          {syncMode === 'cloud-enabled' ? (
                            <><Cloud className="h-3 w-3 mr-1" /> Cloud</>
                          ) : (
                            <><HardDrive className="h-3 w-3 mr-1" /> Local</>
                          )}
                        </Badge>

                        {/* Sync Toggle */}
                        <SyncToggle
                          documentId={doc.id}
                          documentTitle={doc.title}
                          syncMode={syncMode}
                          syncStatus={doc.syncStatus}
                          onSyncModeChange={(newMode) => handleSyncModeChange(doc.id, newMode)}
                          variant="icon"
                          size="md"
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Instructions */}
        <Card>
          <CardHeader>
            <CardTitle>How to Test</CardTitle>
          </CardHeader>
          <CardContent className="prose prose-sm dark:prose-invert">
            <ol className="space-y-2">
              <li><strong>Log in</strong> at <code>/login</code> (required for cloud sync)</li>
              <li><strong>Create a document</strong> at <code>/workspace</code></li>
              <li><strong>Come back here</strong> and click refresh</li>
              <li><strong>Click the cloud icon</strong> next to a document to enable sync</li>
              <li><strong>Edit the document</strong> - it should auto-sync after 2 seconds</li>
              <li><strong>Go offline</strong> (DevTools → Network → Offline)</li>
              <li><strong>Edit while offline</strong> - changes queue locally</li>
              <li><strong>Go back online</strong> - changes should sync automatically</li>
            </ol>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

