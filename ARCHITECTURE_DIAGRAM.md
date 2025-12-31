# MDReader Architecture Diagrams

## 🏗️ System Overview

```mermaid
graph TB
    subgraph "Client Layer"
        subgraph "React Application"
            UI[React UI<br/>Components]
            ROUTER[React Router<br/>Navigation]
            CONTEXT[Context Providers<br/>State Management]
        end

        subgraph "Editor Layer"
            TIPTAP[TipTap Editor<br/>Rich Text]
            YJS[Yjs CRDT Engine<br/>Real-time Sync]
            HYDRATION[Yjs Hydration<br/>Load/Save]
        end

        subgraph "Storage Layer"
            IDB[(IndexedDB<br/>Local Storage)]
            CACHE[(Cache<br/>Metadata)]
        end

        UI --> CONTEXT
        CONTEXT --> ROUTER
        ROUTER --> TIPTAP
        TIPTAP --> YJS
        YJS --> HYDRATION
        HYDRATION --> IDB
        CONTEXT --> CACHE
    end

    subgraph "Network Layer"
        WS[WebSocket<br/>Hocuspocus]
        HTTP[HTTP/REST<br/>FastAPI]
    end

    subgraph "Server Layer"
        subgraph "Hocuspocus Server"
            HOCUS[Hocuspocus<br/>Yjs Server]
            PRESENCE[Presence<br/>Tracking]
        end

        subgraph "FastAPI Backend"
            AUTH[Authentication<br/>JWT]
            WORKSPACE[Workspace<br/>Management]
            DOCS[Document<br/>Management]
            SYNC[Sync<br/>Services]
        end

        subgraph "Database Layer"
            PG[(PostgreSQL<br/>Metadata)]
            YJS_DB[(PostgreSQL<br/>Yjs State)]
        end
    end

    YJS --> WS
    WS --> HOCUS
    HOCUS --> PRESENCE

    CONTEXT --> HTTP
    HTTP --> AUTH
    HTTP --> WORKSPACE
    HTTP --> DOCS
    HTTP --> SYNC

    AUTH --> PG
    WORKSPACE --> PG
    DOCS --> PG
    SYNC --> PG
    HOCUS --> YJS_DB

    style UI fill:#e1f5fe
    style TIPTAP fill:#f3e5f5
    style YJS fill:#fff3e0
    style IDB fill:#e8f5e8
    style WS fill:#fce4ec
    style HTTP fill:#e1f5fe
    style HOCUS fill:#fff3e0
    style PG fill:#e8f5e8
```

## 🔄 Data Flow: Document Creation

```mermaid
sequenceDiagram
    participant U as User
    participant UI as React UI
    participant CTX as Context Layer
    participant YJS as Yjs Engine
    participant IDB as IndexedDB
    participant WS as WebSocket
    participant H as Hocuspocus
    participant API as FastAPI
    participant DB as PostgreSQL

    U->>UI: Click "New Document"
    UI->>CTX: createDocument(type, title)
    CTX->>YJS: Initialize Y.Doc
    YJS->>IDB: Create document entry
    YJS->>YJS: Generate document ID
    YJS-->>CTX: Return document metadata

    CTX->>UI: Show editor
    UI->>TIPTAP: Load editor

    U->>TIPTAP: Start typing
    TIPTAP->>YJS: Apply changes
    YJS->>IDB: Persist locally

    alt Cloud Sync Enabled
        YJS->>WS: Send changes
        WS->>H: Relay to server
        H->>WS: Broadcast to peers
        WS->>YJS: Receive updates
    end

    CTX->>API: Save metadata
    API->>DB: Store document info
```

## 🔐 Authentication Flow

```mermaid
flowchart TD
    A[User Visits App] --> B{Token in Storage?}

    B -->|No| C{Guest Mode?}
    B -->|Yes| D{Token Valid?}

    C -->|Yes| E[Initialize Guest Workspace]
    C -->|No| F[Show Login Prompt]

    D -->|Yes| G[Load User Session]
    D -->|No| H[Clear Storage]

    H --> F
    G --> I[Initialize Sync Context]
    E --> I

    I --> J{Backend Available?}
    J -->|Yes| K[Load Cloud Workspaces]
    J -->|No| L[Offline Mode]

    K --> M[Merge with Local Data]
    L --> N[Use Local Data Only]

    M --> O[Show Unified Workspace]
    N --> O
```

## 🤝 Real-Time Collaboration Flow

```mermaid
sequenceDiagram
    participant U1 as User 1
    participant U2 as User 2
    participant Y1 as Yjs Client 1
    participant Y2 as Yjs Client 2
    participant WS1 as WebSocket 1
    participant WS2 as WebSocket 2
    participant H as Hocuspocus Server

    U1->>Y1: Edit document
    Y1->>WS1: Send Yjs update
    WS1->>H: Relay update
    H->>WS2: Broadcast to User 2
    WS2->>Y2: Apply update
    Y2->>U2: Show changes

    Note over U1,U2: Changes appear instantly<br/>for all users

    U2->>Y2: Edit same area
    Y2->>WS2: Send conflicting update
    WS2->>H: Relay update
    H->>H: CRDT Conflict Resolution
    H->>WS1: Broadcast resolved state
    WS1->>Y1: Apply resolution
    Y1->>U1: Show merged result
```

## 💾 Storage Architecture

```mermaid
graph TD
    subgraph "Local Storage (IndexedDB)"
        subgraph "MDReaderGuest"
            GW[Guest Workspaces]
            GD[Guest Documents]
            GF[Guest Folders]
        end

        subgraph "MDReaderBackendCache"
            CW[Cloud Workspaces Cache]
            CD[Cloud Documents Cache]
            CF[Cloud Folders Cache]
        end

        subgraph "mdreader-yjs-{docId}"
            YS[Yjs Binary State]
            YH[Yjs History]
        end
    end

    subgraph "Cloud Storage (PostgreSQL)"
        subgraph "Metadata"
            UW[user_workspaces]
            UD[user_documents]
            UF[user_folders]
            UM[user_members]
        end

        subgraph "Collaboration"
            DS[document_snapshots]
            YS_DB[yjs_states]
            CL[collaborators]
        end

        subgraph "Sharing"
            SL[share_links]
            SP[share_permissions]
        end
    end

    GW -.-> UW
    GD -.-> UD
    GD -.-> YS_DB
    YS --> YS_DB

    style GW fill:#ffebee
    style CW fill:#e8f5e8
    style YS fill:#fff3e0
    style UW fill:#e8f5e8
    style YS_DB fill:#fff3e0
```

## 🔄 Sync State Machine

```mermaid
stateDiagram-v2
    [*] --> GuestMode

    GuestMode --> Authenticated: Login
    Authenticated --> GuestMode: Logout

    GuestMode --> DocumentCreated: Create Doc
    DocumentCreated --> GuestMode: Save Locally

    Authenticated --> CloudWorkspace: Select Cloud WS
    CloudWorkspace --> DocumentCreated: Create Doc

    DocumentCreated --> SyncPending: Enable Sync
    SyncPending --> Syncing: Online
    Syncing --> Synced: Success
    Syncing --> SyncError: Network Error

    Synced --> Modified: Local Edit
    Modified --> Syncing: Online
    Modified --> Modified: Offline

    SyncError --> Syncing: Retry/Online
    SyncError --> SyncPending: Reset

    Synced --> Disabled: Disable Sync
    Disabled --> GuestMode: Delete Local

    note right of SyncPending
        Document created but
        not yet pushed to cloud
    end note

    note right of Modified
        Local changes pending
        cloud sync
    end note
```

## 🚀 Deployment Architecture

```mermaid
graph TB
    subgraph "Client"
        BROWSER[Browser/Tauri App]
        CDN[CDN<br/>Static Assets]
    end

    subgraph "Load Balancer"
        LB[NGINX<br/>Load Balancer]
    end

    subgraph "Application Tier"
        API1[FastAPI App 1]
        API2[FastAPI App 2]
        API3[FastAPI App 3]
    end

    subgraph "Collaboration Tier"
        WS1[Hocuspocus 1]
        WS2[Hocuspocus 2]
        WS3[Hocuspocus 3]
    end

    subgraph "Cache Tier"
        REDIS[Redis Cluster<br/>Session Cache]
    end

    subgraph "Database Tier"
        PG_MASTER[PostgreSQL<br/>Primary]
        PG_REPLICA1[PostgreSQL<br/>Replica 1]
        PG_REPLICA2[PostgreSQL<br/>Replica 2]
    end

    subgraph "Storage"
        S3[Object Storage<br/>Files/Images]
    end

    BROWSER --> LB
    BROWSER --> WS1
    BROWSER --> WS2
    BROWSER --> WS3

    LB --> API1
    LB --> API2
    LB --> API3

    API1 --> REDIS
    API2 --> REDIS
    API3 --> REDIS

    API1 --> PG_MASTER
    API2 --> PG_MASTER
    API3 --> PG_MASTER

    WS1 --> PG_MASTER
    WS2 --> PG_MASTER
    WS3 --> PG_MASTER

    PG_MASTER --> PG_REPLICA1
    PG_MASTER --> PG_REPLICA2

    API1 --> S3
    WS1 --> S3

    CDN -.-> BROWSER
```

## 📊 Performance Monitoring

```mermaid
graph LR
    subgraph "Application Metrics"
        RT[Response Time<br/>< 200ms]
        TP[Throughput<br/>req/sec]
        ERR[Error Rate<br/>< 1%]
    end

    subgraph "Database Metrics"
        CONN[Connections<br/>Pool Usage]
        QUERY[Query Time<br/>< 50ms]
        LOCK[Lock Waits<br/>< 5%]
    end

    subgraph "Collaboration Metrics"
        WS_CONN[WebSocket<br/>Connections]
        SYNC_LAT[Sync Latency<br/>< 100ms]
        MSG_RATE[Message Rate<br/>msg/sec]
    end

    subgraph "Client Metrics"
        LOAD_TIME[Load Time<br/>< 3s]
        MEM_USAGE[Memory Usage<br/>< 100MB]
        OFFLINE_RATE[Offline Rate<br/>< 5%]
    end

    MONITOR[Monitoring<br/>System] --> RT
    MONITOR --> TP
    MONITOR --> ERR
    MONITOR --> CONN
    MONITOR --> QUERY
    MONITOR --> LOCK
    MONITOR --> WS_CONN
    MONITOR --> SYNC_LAT
    MONITOR --> MSG_RATE
    MONITOR --> LOAD_TIME
    MONITOR --> MEM_USAGE
    MONITOR --> OFFLINE_RATE

    style RT fill:#e8f5e8
    style WS_CONN fill:#fff3e0
    style LOAD_TIME fill:#e1f5fe
```

## 🔧 Development Workflow

```mermaid
flowchart TD
    A[Feature Request] --> B[Create Issue]
    B --> C[Design Review]
    C --> D[Create Branch]

    D --> E{Type?}
    E -->|Frontend| F[React Development]
    E -->|Backend| G[FastAPI Development]
    E -->|Collaboration| H[Yjs/WebSocket Dev]

    F --> I[Unit Tests]
    G --> J[Integration Tests]
    H --> K[E2E Tests]

    I --> L[Code Review]
    J --> L
    K --> L

    L --> M[Merge to Develop]
    M --> N[Staging Deploy]
    N --> O[QA Testing]
    O --> P[Production Deploy]

    P --> Q[Monitor Metrics]
    Q --> R{Performance OK?}
    R -->|Yes| S[Feature Complete]
    R -->|No| T[Performance Tuning]
    T --> P
```

---

## 📋 Legend

| Symbol | Meaning |
|--------|---------|
| 🔵 | Client-side component |
| 🟡 | Server-side component |
| 🟢 | Storage/database |
| 🔴 | Network communication |
| 📦 | External service |
| 💾 | File/data storage |
| 🔄 | Data flow/sync |
| 👥 | User interaction |
| ⚙️ | Configuration/processing |

---

*Architecture diagrams generated: December 30, 2025*
*MDReader Version: 1.0.0*
