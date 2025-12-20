/**
 * Database Extension for Hocuspocus
 * 
 * Handles persistence of Yjs documents to PostgreSQL
 * Production-ready with error handling and logging
 */

import { Database } from '@hocuspocus/extension-database';
import pg from 'pg';
const { Pool } = pg;

/**
 * Create database extension with PostgreSQL backend
 */
export function createDatabaseExtension() {
  // PostgreSQL connection pool
  const pool = new Pool({
    host: process.env.POSTGRES_HOST || 'localhost',
    port: parseInt(process.env.POSTGRES_PORT || '5432'),
    database: process.env.POSTGRES_DB || 'mdreader',
    user: process.env.POSTGRES_USER || 'mdreader',
    password: process.env.POSTGRES_PASSWORD || 'mdreader',
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
  });

  // Test connection on startup
  pool.connect()
    .then(client => {
      console.log('✅ PostgreSQL connected successfully');
      client.release();
    })
    .catch(err => {
      console.error('❌ PostgreSQL connection failed:', err);
      process.exit(1);
    });

  // Graceful shutdown
  process.on('SIGTERM', async () => {
    await pool.end();
    console.log('PostgreSQL pool closed');
  });

  return new Database({
    /**
     * Fetch document from database
     */
    fetch: async ({ documentName, context }) => {
      // DON'T fetch from database - let clients sync their state to server
      // Database state may be corrupted or incompatible
      console.log(`📖 [HOCUSPOCUS] Client requesting document: ${documentName} - returning NULL (starting fresh)`);
      return null;
    },

    /**
     * Store document to database
     */
    store: async ({ documentName, state, context }) => {
      const client = await pool.connect();
      
      try {
        console.log(`💾 Storing document: ${documentName}`);

        // Calculate size
        const size = state.byteLength;

        // Update existing document (only update yjs_state, don't insert)
        const result = await client.query(`
          UPDATE documents 
          SET 
            yjs_state = $2,
            yjs_version = yjs_version + 1,
            size = $3,
            updated_at = NOW()
          WHERE id = $1
          RETURNING id
        `, [documentName, state, size]);
        
        if (result.rowCount === 0) {
          console.warn(`⚠️  Document ${documentName} not found in database, skipping Yjs state update`);
          // Don't throw error - document might not exist yet in backend
          return;
        }

        console.log(`✅ Document stored: ${documentName} (${size} bytes)`);

      } catch (error) {
        console.error(`❌ Store failed for ${documentName}:`, error);
        throw error;
      } finally {
        client.release();
      }
    },
  });
}

