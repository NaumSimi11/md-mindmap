/**
 * Hocuspocus Server - Yjs Sync Server for MDReader
 * 
 * Purpose: Handle real-time collaborative editing via WebSocket
 * 
 * Features:
 * - WebSocket server for Yjs CRDT sync
 * - Automatic conflict resolution
 * - In-memory document storage (upgradeable to PostgreSQL/Redis)
 * - Authentication support (JWT validation)
 * - Presence tracking
 * 
 * Architecture:
 * - Port: 1234 (WebSocket)
 * - Protocol: Yjs sync protocol
 * - Storage: In-memory (for development)
 * - Auth: Optional JWT validation
 * 
 * Usage:
 * - Development: npm run dev
 * - Production: npm start
 */

import { Server } from '@hocuspocus/server';
import { Logger } from '@hocuspocus/extension-logger';

console.log('🚀 Starting Hocuspocus Server...');
console.log('');

// Create Hocuspocus server
const server = Server.configure({
  port: 1234,
  
  extensions: [
    // Logger extension for debugging
    new Logger({
      // Log levels: debug, info, warn, error
      log: (message) => {
        const timestamp = new Date().toISOString();
        console.log(`[${timestamp}] ${message}`);
      },
      // onChange: (data) => {
      //   console.log('📝 Document changed:', data.documentName);
      // },
      // onConnect: (data) => {
      //   console.log('🔌 Client connected:', data.documentName);
      // },
      // onDisconnect: (data) => {
      //   console.log('🔌 Client disconnected:', data.documentName);
      // },
    }),
  ],

  /**
   * Authentication (Optional)
   * Uncomment to enable JWT authentication
   */
  async onAuthenticate(data) {
    const { token } = data;
    
    // For development: Allow all connections
    // For production: Validate JWT token here
    
    // Example JWT validation:
    // try {
    //   const decoded = jwt.verify(token, process.env.JWT_SECRET);
    //   return {
    //     user: {
    //       id: decoded.user_id,
    //       name: decoded.full_name,
    //     },
    //   };
    // } catch (error) {
    //   throw new Error('Authentication failed');
    // }
    
    // For now, allow guest users
    return {
      user: {
        id: token || 'guest',
        name: token ? 'Authenticated User' : 'Guest',
      },
    };
  },

  /**
   * Document loaded
   * Called when a document is loaded from storage
   */
  async onLoadDocument(data) {
    const { documentName } = data;
    console.log(`📂 Loading document: ${documentName}`);
    
    // For development: Documents are stored in-memory
    // For production: Load from PostgreSQL/Redis here
    
    // Return null to use in-memory storage
    return null;
  },

  /**
   * Document changed
   * Called when a document is modified
   */
  async onChange(data) {
    const { documentName, context } = data;
    
    // For production: Save to PostgreSQL/Redis here
    // Example:
    // await saveDocumentToDatabase(documentName, data.document);
    
    // For development: Just log
    // console.log(`📝 Document updated: ${documentName}`);
  },

  /**
   * Connection established
   */
  async onConnect(data) {
    const { documentName, requestParameters } = data;
    console.log(`✅ Client connected to: ${documentName}`);
    console.log(`   Connections: ${server.getConnectionsCount()}`);
  },

  /**
   * Connection closed
   */
  async onDisconnect(data) {
    const { documentName } = data;
    console.log(`❌ Client disconnected from: ${documentName}`);
    console.log(`   Connections: ${server.getConnectionsCount()}`);
  },

  /**
   * Error handling
   */
  async onError(data) {
    console.error('❌ Hocuspocus error:', data.error);
  },
});

// Start server
server.listen(() => {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('✅ Hocuspocus Server Ready');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('');
  console.log('   WebSocket: ws://localhost:1234');
  console.log('   Protocol:  Yjs sync protocol');
  console.log('   Storage:   In-memory (development mode)');
  console.log('   Auth:      Guest mode (no JWT required)');
  console.log('');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('');
  console.log('🔍 Waiting for connections...');
  console.log('');
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('');
  console.log('⚠️  Shutting down Hocuspocus server...');
  server.destroy().then(() => {
    console.log('✅ Server stopped');
    process.exit(0);
  });
});

process.on('SIGTERM', () => {
  console.log('');
  console.log('⚠️  Shutting down Hocuspocus server...');
  server.destroy().then(() => {
    console.log('✅ Server stopped');
    process.exit(0);
  });
});

// Handle uncaught errors
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (error) => {
  console.error('❌ Unhandled rejection:', error);
  process.exit(1);
});

