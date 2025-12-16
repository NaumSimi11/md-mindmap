const { Server } = require('@hocuspocus/server');
const { Database } = require('@hocuspocus/extension-database');
const { Logger } = require('@hocuspocus/extension-logger');
const { Pool } = require('pg');

// PostgreSQL connection
const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'mdreader_db',
  user: 'mdreader_user',
  password: 'mdreader_password',
});

// Create Hocuspocus server
const server = new Server({
  port: 1234,
  name: 'mdreader-hocuspocus',
  
  extensions: [
    new Logger({
      log: (message) => console.log(`[Hocuspocus] ${message}`),
    }),
    
    new Database({
      fetch: async ({ documentName }) => {
        const result = await pool.query(
          'SELECT yjs_state FROM yjs_documents WHERE document_id = $1',
          [documentName]
        );
        
        if (result.rows.length > 0) {
          return result.rows[0].yjs_state;
        }
        
        return null;
      },
      
      store: async ({ documentName, state }) => {
        await pool.query(`
          INSERT INTO yjs_documents (document_id, yjs_state, updated_at)
          VALUES ($1, $2, NOW())
          ON CONFLICT (document_id)
          DO UPDATE SET yjs_state = $2, updated_at = NOW()
        `, [documentName, state]);
      },
    }),
  ],
  
  async onAuthenticate({ token, documentName }) {
    if (!token) {
      throw new Error('No token provided');
    }
    
    try {
      const response = await fetch('http://localhost:7001/api/v1/auth/me', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (!response.ok) {
        throw new Error('Invalid token');
      }
      
      const user = await response.json();
      
      return {
        user: {
          id: user.id,
          name: user.full_name || user.username,
          email: user.email,
        }
      };
    } catch (error) {
      throw new Error('Authentication failed');
    }
  },
});

server.listen().then(() => {
  console.log('🚀 Hocuspocus server running on ws://localhost:1234');
});

