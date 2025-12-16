/**
 * Hocuspocus Server - Production Configuration
 * 
 * Complete production-ready setup with:
 * - PostgreSQL persistence
 * - JWT authentication
 * - Comprehensive logging
 * - Error handling
 * - Graceful shutdown
 */

import { Server } from '@hocuspocus/server';
import { createDatabaseExtension } from './extensions/DatabaseExtension.js';
import { createAuthExtension } from './extensions/AuthExtension.js';
import { createLoggerExtension } from './extensions/LoggerExtension.js';

// Configuration
const PORT = process.env.HOCUSPOCUS_PORT || 1234;
const HOST = process.env.HOCUSPOCUS_HOST || '0.0.0.0';

console.log(`
═══════════════════════════════════════════════════════════
🚀 Starting Hocuspocus Server (Production Mode)
═══════════════════════════════════════════════════════════
`);

// Create server with extensions
const server = Server.configure({
  port: PORT,
  address: HOST,

  // Extensions (order matters)
  extensions: [
    createLoggerExtension(),
    createAuthExtension(),
    createDatabaseExtension(),
  ],

  /**
   * Global error handler
   */
  async onError({ error, documentName, context }) {
    const user = context?.user?.name || 'Unknown';
    console.error(`
❌ Error in document: ${documentName}
👤 User: ${user}
🐛 Error: ${error.message}
📚 Stack: ${error.stack}
    `);
  },

  /**
   * Connection handler
   */
  async onConnect({ documentName, requestHeaders, connection, context }) {
    const user = context?.user?.name || 'Guest';
    console.log(`
🔌 Connection established
👤 User: ${user}
📄 Document: ${documentName}
🌐 IP: ${requestHeaders['x-forwarded-for'] || connection.readyState}
    `);
  },

  /**
   * Disconnect handler
   */
  async onDisconnect({ documentName, context }) {
    const user = context?.user?.name || 'Guest';
    console.log(`🔌 Connection closed: ${user} → ${documentName}`);
  },

  /**
   * Document change handler
   */
  async onChange({ documentName, context, document }) {
    const user = context?.user?.name || 'Guest';
    console.log(`✏️  Document updated: ${documentName} by ${user}`);
  },

  /**
   * Statistics handler (every 5 seconds)
   */
  async onStateless({ payload, documentName }) {
    // Log statistics periodically
    if (payload.type === 'stats') {
      console.log(`📊 Stats: ${documentName} - ${JSON.stringify(payload.data)}`);
    }
  },
});

// Start server
server.listen()
  .then(() => {
    console.log(`
═══════════════════════════════════════════════════════════
✅ Hocuspocus Server Running
═══════════════════════════════════════════════════════════

🌐 WebSocket URL: ws://${HOST}:${PORT}
🗄️  Database: PostgreSQL (connected)
🔐 Auth: JWT (enabled)
📝 Logging: Comprehensive
🚀 Status: READY

Waiting for connections...
═══════════════════════════════════════════════════════════
    `);
  })
  .catch((error) => {
    console.error('❌ Failed to start Hocuspocus server:', error);
    process.exit(1);
  });

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('\n🛑 SIGTERM received, shutting down gracefully...');
  await server.destroy();
  console.log('✅ Server closed');
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('\n🛑 SIGINT received, shutting down gracefully...');
  await server.destroy();
  console.log('✅ Server closed');
  process.exit(0);
});

// Uncaught exception handler
process.on('uncaughtException', (error) => {
  console.error('💥 Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('💥 Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

