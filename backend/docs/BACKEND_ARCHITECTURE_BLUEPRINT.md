# 🏗️ MD Creator Backend Architecture Blueprint
**Enterprise-Grade Technical Specification & Implementation Guide**

**Document Version**: 1.0.0  
**Date**: December 5, 2025  
**Author**: Senior Software Architect  
**Status**: Development-Ready

---

## 📋 Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Backend Architecture Options & Recommendation](#2-backend-architecture-options--recommendation)
3. [Complete Data Model & Database Schema](#3-complete-data-model--database-schema)
4. [Authentication & Authorization System](#4-authentication--authorization-system)
5. [Context File Strategy & Sync Model](#5-context-file-strategy--sync-model)
6. [API Specification (Full Documentation)](#6-api-specification-full-documentation)
7. [AI Integration Architecture](#7-ai-integration-architecture)
8. [Multi-Device Sync Engine](#8-multi-device-sync-engine)
9. [Real-Time Collaboration System](#9-real-time-collaboration-system)
10. [Backend Deployment Architecture](#10-backend-deployment-architecture)
11. [Development-Ready Handover](#11-development-ready-handover)

---

---

## 📋 Documentation Navigation

**This is Part 1 of a 5-part comprehensive backend architecture blueprint.**

**Complete Documentation:**
1. **Part 1** - Executive Summary & Architecture Options (this document)
2. **Part 2** - [Complete Database Schema](./BACKEND_ARCHITECTURE_PART2_DATABASE.md) (2000+ lines SQL)
3. **Part 3** - [Authentication, Context Files & Sync](./BACKEND_ARCHITECTURE_PART3_AUTH_AND_SYNC.md)
4. **Part 4** - [Complete API Specification](./BACKEND_ARCHITECTURE_PART4_API_COMPLETE.md) (50+ endpoints)
5. **Part 5** - [Deployment & Development Handover](./BACKEND_ARCHITECTURE_PART5_DEPLOYMENT_HANDOVER.md)

**Master Index**: [`BACKEND_COMPLETE_INDEX.md`](./BACKEND_COMPLETE_INDEX.md) - Start here for navigation

**Total Documentation**: 500+ pages | 5,000+ lines of code | 50+ API endpoints | 15 database tables

---

## 1. Executive Summary

### 1.1 What Exists (Frontend Analysis)

**Current Implementation:**
- ✅ React + TypeScript frontend with TipTap WYSIWYG editor
- ✅ Tauri desktop application + web support
- ✅ AI integration (OpenAI/Anthropic) for content generation
- ✅ Markdown editing with Mermaid diagram support
- ✅ Mindmap studio with visual editing
- ✅ Presentation generation from markdown
- ✅ Local storage (localStorage for web, file system for desktop)
- ✅ Client-side AI services with configurable API keys
- ✅ Document templates and workspace management (frontend-only)
- ✅ Comment system UI (no backend persistence)

**Key Frontend Components:**
- **Stores**: Document, Mindmap, Editor, AI Staging, Comments
- **Services**: AI (OpenAI/Anthropic), Storage (Local), Workspace, Presentation
- **Domain Layer**: Document entities, repositories (interface-only)
- **Infrastructure**: Local storage implementation only

### 1.2 What Is Missing (Backend Requirements)

**Critical Missing Components:**
1. **No backend server** - All logic runs client-side
2. **No user accounts** - No persistent user identity
3. **No cloud storage** - Documents stored only locally
4. **No multi-device sync** - Cannot access documents across devices
5. **No real-time collaboration** - Single-user editing only
6. **No document versioning** - No history beyond local edits
7. **No team workspaces** - No collaboration features
8. **No permissions system** - No access control
9. **No AI proxy** - API keys exposed in client code
10. **No persistent comments** - Comment system is UI-only

### 1.3 What Backend Must Provide

**Core Requirements:**
1. ✅ **User Management**: Registration, authentication, profile management
2. ✅ **Document Storage**: Cloud-based document persistence
3. ✅ **Versioning Engine**: Full document history with conflict resolution
4. ✅ **Sync System**: Real-time bidirectional sync (web ↔ desktop)
5. ✅ **Collaboration**: Real-time co-editing with presence indicators
6. ✅ **AI Proxy**: Secure API key management and rate limiting
7. ✅ **File Storage**: Attachments, images, backups (S3/CloudFront)
8. ✅ **Permissions**: RBAC for workspaces and documents
9. ✅ **Team Features**: Shared workspaces, invitations, comments
10. ✅ **Offline Support**: Queue sync when offline, merge on reconnect

### 1.4 Key Architectural Decisions Needed

**Decision Matrix:**

| Decision Point | Options | Recommendation |
|----------------|---------|----------------|
| **Backend Stack** | Node.js, Python, Go | **Python 3.12 + FastAPI** |
| **Database** | PostgreSQL, MongoDB, DynamoDB | **PostgreSQL 16 (AWS RDS)** |
| **File Storage** | S3, GCS, Azure Blob | **AWS S3 + CloudFront** |
| **Auth System** | Custom JWT, Auth0, Cognito | **AWS Cognito** |
| **Real-Time** | WebSocket, SSE, Polling | **WebSocket (API Gateway)** |
| **CRDT Library** | Yjs, Automerge, ShareDB | **Yjs (battle-tested)** |
| **Compute** | Lambda, ECS Fargate, EC2 | **ECS Fargate** |
| **AI Proxy** | Required or Optional | **Optional (BYO key default)** |

---

## 2. Backend Architecture Options & Recommendation

### 2.1 Architecture Option A: Serverless-First (AWS Lambda)

**Stack:**
- API: AWS API Gateway + Lambda
- Database: DynamoDB (NoSQL)
- Auth: AWS Cognito
- Storage: S3
- Real-time: API Gateway WebSocket + Lambda

**Pros:**
- ✅ Pay-per-request pricing (very cheap for low traffic)
- ✅ Infinite scalability
- ✅ No server management
- ✅ Built-in AWS integrations

**Cons:**
- ❌ Cold start latency (200-500ms first request)
- ❌ 15-minute Lambda timeout (problematic for long AI operations)
- ❌ Complex state management for WebSocket
- ❌ DynamoDB learning curve for complex queries
- ❌ Harder to debug locally

**Cost Estimate:** $20-40/month (first year), $30-60/month (after free tier)

---

### 2.2 Architecture Option B: Containerized API (ECS Fargate) ⭐ RECOMMENDED

**Stack:**
- API: FastAPI (Python 3.12) on ECS Fargate
- Database: PostgreSQL 16 (AWS RDS)
- Auth: AWS Cognito
- Storage: S3 + CloudFront
- Real-time: API Gateway WebSocket → ALB → ECS
- Cache: ElastiCache Redis (for presence, rate limiting)

**Pros:**
- ✅ No cold starts (always-on containers)
- ✅ Full control over runtime and dependencies
- ✅ Easy local development (Docker Compose)
- ✅ Familiar SQL database (PostgreSQL)
- ✅ Perfect for FastAPI and long-running WebSocket connections
- ✅ Simple deployment (GitHub Actions → ECR → ECS)
- ✅ Better debugging and logging

**Cons:**
- ❌ Slightly higher baseline cost (~$15-25/month minimum)
- ❌ More configuration than serverless
- ❌ Need to manage container lifecycle

**Cost Estimate:** $30-60/month (first year), $50-100/month (after free tier)

**✅ RECOMMENDATION: Use ECS Fargate**

**Rationale:**
1. **No cold starts** - Critical for real-time collaboration
2. **WebSocket support** - Native, no Lambda adapter needed
3. **FastAPI perfect fit** - Modern async Python framework
4. **PostgreSQL advantages** - Mature, relational, ACID-compliant
5. **Local development** - Easy Docker setup
6. **Future-proof** - Can add background workers, scheduled tasks

---

### 2.3 Architecture Option C: Traditional VPS (Hetzner/DigitalOcean)

**Stack:**
- Server: Ubuntu 24.04 LTS on VPS
- API: FastAPI + Nginx + Gunicorn
- Database: PostgreSQL (self-managed)
- Storage: S3-compatible (Wasabi, Backblaze)
- Auth: Custom JWT implementation

**Pros:**
- ✅ Lowest cost ($6-12/month)
- ✅ Full control over everything
- ✅ Predictable pricing

**Cons:**
- ❌ Manual server management (security patches, backups)
- ❌ No managed services (must implement monitoring, logging)
- ❌ Scaling requires manual intervention
- ❌ Higher operational burden

**Cost Estimate:** $12-30/month

**❌ NOT RECOMMENDED for MVP** - Too much operational overhead.

---

### 2.4 Final Recommendation: Hybrid AWS Architecture

**Chosen Stack:**

```yaml
Backend Framework: FastAPI (Python 3.12)
API Gateway: AWS API Gateway (REST + WebSocket)
Compute: AWS ECS Fargate (containerized)
Load Balancer: Application Load Balancer (ALB)
Database: AWS RDS PostgreSQL 16
ORM: SQLAlchemy 2.x + Alembic
Cache: ElastiCache Redis (for presence, sessions)
Storage: AWS S3 (documents, attachments)
CDN: AWS CloudFront
Auth: AWS Cognito (user pools)
Secrets: AWS Secrets Manager
Monitoring: AWS CloudWatch
CI/CD: GitHub Actions + AWS ECR
Real-Time: Yjs (CRDT) + WebSocket
```

**Why This Stack Wins:**
- ✅ **Proven at scale** - All components battle-tested by thousands of companies
- ✅ **Developer experience** - FastAPI is modern, async-first, with automatic OpenAPI docs
- ✅ **No vendor lock-in** - Can migrate to GCP/Azure with minimal changes (except Cognito)
- ✅ **Cost-effective** - Free tier covers MVP, scales predictably
- ✅ **Future-proof** - Easy to add microservices, background workers, scheduled jobs

---