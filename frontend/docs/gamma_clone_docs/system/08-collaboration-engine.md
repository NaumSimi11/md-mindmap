# Collaboration Engine — Real-time Editing & Presence

## Purpose
Multi-user editing with low-latency presence, CRDT/OT consistency, comments and permissions.

## Core components
- Presence & cursors (Redis + WebSocket)
- CRDT sync (YJS recommended) for block document
- Comments service (threaded)
- Permissions & workspace roles

## Data flow
User edits -> local op -> CRDT sync -> server persistence (debounced) -> broadcast

## Conflict resolution
- Use CRDT to avoid central locking.
- For slot-level conflicts (images vs text), apply last-writer-wins with merge suggestions.

## Security
- TLS + JWT auth
- Per-workspace role checks on mutations
