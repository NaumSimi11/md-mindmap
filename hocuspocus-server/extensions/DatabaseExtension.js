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
      const client = await pool.connect();
      
      try {
        console.log(`📖 Fetching document: ${documentName}`);

        const result = await client.query(
          'SELECT yjs_state, version FROM documents WHERE id = $1',
          [documentName]
        );

        if (result.rows.length === 0) {
          console.log(`📝 Document not found (will create): ${documentName}`);
          return null;
        }

        const { yjs_state, version } = result.rows[0];
        
        if (!yjs_state) {
          console.log(`📝 Document has no state: ${documentName}`);
          return null;
        }

        console.log(`✅ Document fetched: ${documentName} (version: ${version})`);
        return yjs_state;

      } catch (error) {
        console.error(`❌ Fetch failed for ${documentName}:`, error);
        throw error;
      } finally {
        client.release();
      }
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

        // Upsert document
        await client.query(`
          INSERT INTO documents (id, yjs_state, yjs_version, size, updated_at)
          VALUES ($1, $2, 1, $3, NOW())
          ON CONFLICT (id) 
          DO UPDATE SET 
            yjs_state = $2,
            yjs_version = documents.yjs_version + 1,
            size = $3,
            updated_at = NOW()
        `, [documentName, state, size]);

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

