/**
 * Application Initialization
 * 
 * Setup services on app start.
 * 
 * Architecture:
 * - GuestWorkspaceService: Guest mode workspace/folders/documents (IndexedDB)
 * - BackendWorkspaceService: Auth mode workspace/folders (FastAPI + IndexedDB cache)
 * - Migration: Automatic localStorage → IndexedDB migration on first run
 */

import { setupServices } from '@/infrastructure/di/ServiceRegistration';
import { guestWorkspaceService } from '@/services/workspace/GuestWorkspaceService';
import { migrateLocalStorageToIndexedDB } from '@/services/workspace/migrateToIndexedDB';
import { workspaceInitializer } from '@/services/workspace-legacy/WorkspaceInitializer';
import { isDesktop } from '@/utils/platform';

/**
 * Initialize the application
 * Call this once at app startup (in main.tsx or App.tsx)
 */
export async function initializeApp(): Promise<void> {
    console.log('🚀 Initializing application...');
    
    // 1. Initialize Tauri workspace (Desktop only)
    if (isDesktop()) {
        console.log('🖥️ Desktop mode detected');
        try {
            const workspacePath = await workspaceInitializer.initialize();
            if (workspacePath) {
                console.log('📁 Workspace initialized:', workspacePath);
                // Store workspace path globally for easy access
                (window as any).WORKSPACE_PATH = workspacePath;
            }
        } catch (error) {
            console.error('❌ Failed to initialize Tauri workspace:', error);
            // Don't block app initialization, fall back to web mode
        }
    } else {
        console.log('🌐 Web mode detected');
    }

    // 2. Setup dependency injection
    setupServices();

    // 3. Migrate legacy data from localStorage → IndexedDB (one-time, automatic)
    await migrateLocalStorageToIndexedDB();

    // 4. Initialize guest workspace (will create default structure if needed)
    await guestWorkspaceService.init();

    console.log('✅ Application initialized');
    console.log('   - Platform:', isDesktop() ? 'Desktop (Tauri)' : 'Web (Browser)');
    console.log('   - Storage: IndexedDB (migrated from localStorage)');
    console.log('   - Guest Workspace: Ready');
    console.log('   - Backend Services: Ready');
}
