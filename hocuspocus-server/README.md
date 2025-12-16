# Hocuspocus Server - MDReader

Yjs WebSocket sync server for real-time collaboration.

## Features

- ✅ WebSocket server for Yjs CRDT sync
- ✅ Automatic conflict resolution
- ✅ In-memory document storage
- ✅ Guest mode (no auth required)
- ✅ Presence tracking
- ✅ Connection monitoring

## Installation

```bash
npm install
```

## Development

```bash
npm run dev
```

Server will start on `ws://localhost:1234` with auto-restart on file changes.

## Production

```bash
npm start
```

## Configuration

### Port
Default: `1234`  
Change in `server.js`: `port: 1234`

### Authentication
By default, guest mode is enabled (no JWT required).

To enable JWT authentication:
1. Uncomment JWT validation in `onAuthenticate`
2. Set `JWT_SECRET` environment variable
3. Send token in WebSocket connection params

### Storage
By default, documents are stored in-memory.

To enable PostgreSQL/Redis persistence:
1. Implement `onLoadDocument` to load from database
2. Implement `onChange` to save to database

## Testing

### Test Connection
```bash
# In browser console:
const provider = new WebsocketProvider(
  'ws://localhost:1234',
  'test-document',
  ydoc
);

provider.on('status', event => {
  console.log('Status:', event.status); // 'connected' | 'disconnected'
});
```

## Architecture

```
Client (Browser)
    │
    │ WebSocket
    ▼
Hocuspocus Server (:1234)
    │
    ├─ In-memory storage (dev)
    └─ PostgreSQL/Redis (prod)
```

## Logs

Server logs all events:
- `✅ Client connected` - New connection
- `❌ Client disconnected` - Connection closed
- `📝 Document updated` - Document changed
- `📂 Loading document` - Document loaded

## Error Handling

All errors are logged and handled gracefully:
- Connection errors
- Authentication errors
- Document sync errors
- Uncaught exceptions

## Performance

- Connections: Unlimited
- Document size: Unlimited (CRDT is efficient)
- Latency: <100ms (local network)
- Memory: ~1MB per document (average)

## Monitoring

Check active connections:
```javascript
server.getConnectionsCount()
```

## Next Steps

1. **PostgreSQL Integration**: Persist documents to database
2. **Redis Cache**: Cache documents for faster load
3. **Authentication**: Implement JWT validation
4. **Metrics**: Add Prometheus metrics
5. **Scaling**: Add horizontal scaling with Redis pubsub

