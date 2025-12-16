/**
 * Logger Extension for Hocuspocus
 * 
 * Comprehensive logging for monitoring and debugging
 * Production-ready with log levels and formatting
 */

import { Logger } from '@hocuspocus/extension-logger';

/**
 * Create logger extension
 */
export function createLoggerExtension() {
  return new Logger({
    /**
     * Log level filter
     */
    log: (message) => {
      // Filter out noisy messages in production
      if (process.env.NODE_ENV === 'production') {
        if (message.includes('awareness') || message.includes('ping')) {
          return;
        }
      }
      console.log(`[Hocuspocus] ${message}`);
    },

    /**
     * Custom log formatter
     */
    onLoadDocument: ({ documentName }) => {
      console.log(`📄 Document loaded: ${documentName}`);
    },

    onChange: ({ documentName, context }) => {
      const user = context?.user?.name || 'Unknown';
      console.log(`✏️  Document changed: ${documentName} by ${user}`);
    },

    onConnect: ({ documentName, context }) => {
      const user = context?.user?.name || 'Guest';
      console.log(`🔌 User connected: ${user} → ${documentName}`);
    },

    onDisconnect: ({ documentName, context }) => {
      const user = context?.user?.name || 'Guest';
      console.log(`🔌 User disconnected: ${user} → ${documentName}`);
    },

    onDestroy: () => {
      console.log(`💥 Hocuspocus server destroyed`);
    },
  });
}

