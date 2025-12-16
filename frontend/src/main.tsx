import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { PlatformProvider } from "./contexts/PlatformContext.tsx";
import { GlobalErrorBoundary } from "./components/errors/GlobalErrorBoundary.tsx";
import { initializeApp } from "./infrastructure/config/AppInitialization.ts";
import './scripts/migrateToYjs'; // Auto-runs migration
import './scripts/verifyImplementation'; // Exposes verification function
import { yjsDocumentManager } from './services/yjs/YjsDocumentManager';
import { UnifiedSyncManager } from './services/sync';
import { DocumentLifecycleManager } from './services/document';

// ═══════════════════════════════════════════════════════════
// PRODUCTION INITIALIZATION
// ═══════════════════════════════════════════════════════════

console.log(`
╔═══════════════════════════════════════════════════════════╗
║                 MDREADER STARTING                         ║
╚═══════════════════════════════════════════════════════════╝
`);

// Initialize managers
async function initializeManagers() {
  console.log('🚀 Initializing production managers...');
  
  try {
    // 1. Initialize Unified Sync Manager
    console.log('📦 [1/2] Initializing UnifiedSyncManager...');
    const syncManager = UnifiedSyncManager.getInstance();
    await syncManager.init(); // Note: method is 'init' not 'initialize'
    console.log('✅ UnifiedSyncManager ready');
    
    // 2. Initialize Document Lifecycle Manager
    console.log('📦 [2/2] Initializing DocumentLifecycleManager...');
    const docManager = DocumentLifecycleManager.getInstance();
    await docManager.init(); // Note: method is 'init' not 'initialize'
    console.log('✅ DocumentLifecycleManager ready');
    
    // Expose for debugging
    (window as any).syncManager = syncManager;
    (window as any).docManager = docManager;
    (window as any).yjsDocumentManager = yjsDocumentManager; // Legacy, will remove
    
    console.log(`
╔═══════════════════════════════════════════════════════════╗
║              MANAGERS INITIALIZED                         ║
║  ✅ UnifiedSyncManager                                    ║
║  ✅ DocumentLifecycleManager                              ║
║  ✅ YjsDocumentManager (legacy)                           ║
╚═══════════════════════════════════════════════════════════╝
`);
    
    return { syncManager, docManager };
  } catch (error) {
    console.error('❌ Failed to initialize managers:', error);
    throw error;
  }
}

// Main initialization sequence
(async () => {
  try {
    // 1. Initialize app infrastructure
    console.log('🔧 [Step 1] Initializing app infrastructure...');
    await initializeApp();
    
    // 2. Initialize managers
    console.log('🔧 [Step 2] Initializing managers...');
    await initializeManagers();
    
    // 3. Render app
    console.log('🔧 [Step 3] Rendering app...');
    createRoot(document.getElementById("root")!).render(
      <GlobalErrorBoundary>
        <PlatformProvider>
          <App />
        </PlatformProvider>
      </GlobalErrorBoundary>
    );
    
    console.log(`
╔═══════════════════════════════════════════════════════════╗
║              MDREADER READY                               ║
╚═══════════════════════════════════════════════════════════╝
`);
    
  } catch (error) {
    console.error(`
╔═══════════════════════════════════════════════════════════╗
║              INITIALIZATION FAILED                        ║
╚═══════════════════════════════════════════════════════════╝
`, error);
    
    // Still render the app even if initialization fails
    createRoot(document.getElementById("root")!).render(
      <GlobalErrorBoundary>
        <PlatformProvider>
          <App />
        </PlatformProvider>
      </GlobalErrorBoundary>
    );
  }
})();
