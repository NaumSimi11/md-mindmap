# 🚀 AWS-Heavy Backend Implementation Plan

**Date**: October 30, 2025  
**Decision**: Go AWS-Heavy  
**Tech Stack**: FastAPI + AWS Services

---

## 🎯 **AWS SERVICES WE'LL USE**

### **Core Infrastructure:**
- ✅ **Compute**: AWS ECS Fargate (containerized FastAPI)
- ✅ **API**: API Gateway (REST + WebSocket) + ECS Fargate
- ✅ **Database**: AWS RDS PostgreSQL (managed)
- ✅ **Storage**: AWS S3 (documents, attachments)
- ✅ **Auth**: AWS Cognito (instead of custom JWT)
- ✅ **CDN**: CloudFront (for S3 assets)

### **Collaboration Services (CORE FEATURE):**
- ✅ **WebSocket**: API Gateway WebSocket API (real-time connections)
- ✅ **Presence**: ElastiCache Redis (live cursors, online users)
- ✅ **CRDT**: Yjs (operational transforms, conflict-free editing)
- ✅ **Notifications**: SNS (comment notifications, @mentions)
- ✅ **Real-time State**: DynamoDB Streams or RDS triggers (document changes)

### **Supporting Services:**
- ✅ **Secrets**: AWS Secrets Manager (API keys, DB credentials)
- ✅ **Monitoring**: CloudWatch (logs, metrics, alarms)
- ✅ **CI/CD**: GitHub Actions + AWS CodeDeploy or ECS Deploy
- ✅ **Messaging**: SQS/SNS (async tasks, notifications)
- ✅ **Cache**: ElastiCache Redis (presence, rate limiting)

---

## 🏗️ **AWS ARCHITECTURE (WITH COLLABORATION)**

```
┌─────────────────────────────────────────────────┐
│              CLIENT (Web/Tauri)                  │
│  Guest mode: localStorage / local files         │
│  Signed-in: HTTPS (REST) + WSS (WebSocket)      │
└─────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────┐
│           AWS CloudFront (CDN)                  │
│  - S3 assets caching                            │
│  - Global edge locations                        │
└─────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────┐
│      AWS API Gateway (REST + WebSocket)         │
│  ┌───────────────────────────────────────────┐  │
│  │  REST API:                                │  │
│  │  - Auth, Workspaces, Documents           │  │
│  │  - Rate limiting, CORS                   │  │
│  │                                           │  │
│  │  WebSocket API:                           │  │
│  │  - Real-time document editing             │  │
│  │  - Live cursors & presence               │  │
│  │  - Comments & @mentions                   │  │
│  └───────────────────────────────────────────┘  │
└─────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────┐
│  Application Load Balancer (ALB)                │
│  - Routes REST → ECS Fargate                    │
│  - Routes WebSocket → ECS Fargate               │
│  - No Lambda in between! ✅                     │
└─────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────┐
│         AWS ECS Fargate (FastAPI)               │
│  ┌───────────────────────────────────────────┐  │
│  │  FastAPI Application                      │  │
│  │  - Auth (Cognito integration)            │  │
│  │  - Workspaces                             │  │
│  │  - Documents + Versions                   │  │
│  │  - Sync (cursor-based)                    │  │
│  │  - AI Proxy                               │  │
│  │                                           │  │
│  │  Collaboration Services:                  │  │
│  │  - WebSocket handlers (Yjs CRDT)         │  │
│  │  - Presence tracking (Redis)              │  │
│  │  - Comment threads                        │  │
│  │  - Real-time broadcasting                 │  │
│  └───────────────────────────────────────────┘  │
└─────────────────────────────────────────────────┘
         ↓                    ↓                ↓
┌─────────────────┐  ┌──────────────┐  ┌──────────────┐
│  AWS RDS        │  │  AWS S3      │  │  AWS Cognito │
│  PostgreSQL     │  │  Documents   │  │  User Auth  │
│  - Metadata     │  │  Attachments │  │  JWT Tokens │
│  - Workspaces   │  │  Backups     │  │  OAuth      │
│  - Documents    │  │              │  │              │
│  - Comments     │  │              │  │              │
│  - Permissions  │  │              │  │              │
└─────────────────┘  └──────────────┘  └──────────────┘
         ↓                    ↓
┌─────────────────┐  ┌──────────────────────────────┐
│ ElastiCache     │  │  DynamoDB Streams            │
│ Redis           │  │  (Real-time document state)  │
│ - Presence      │  │  - Document change events     │
│ - Live cursors  │  │  - Trigger broadcasts         │
│ - Rate limiting │  │                              │
└─────────────────┘  └──────────────────────────────┘
         ↓
┌─────────────────────────────────────────────────┐
│      AWS SNS (Notifications)                   │
│  - Comment notifications                         │
│  - @mention alerts                              │
│  - Document share invites                       │
└─────────────────────────────────────────────────┘
         ↓
┌─────────────────────────────────────────────────┐
│      AWS Secrets Manager                        │
│  - Database credentials                         │
│  - OpenAI API keys (for AI proxy)              │
│  - Third-party API keys                        │
└─────────────────────────────────────────────────┘
         ↓
┌─────────────────────────────────────────────────┐
│      AWS CloudWatch                            │
│  - Application logs                            │
│  - Metrics (requests, errors, latency)        │
│  - Alarms (error rate, CPU, memory)            │
│  - WebSocket connection metrics                 │
└─────────────────────────────────────────────────┘
```

---

## 🔌 **API ARCHITECTURE WITH AWS**

### **ECS Fargate (Our Choice - No Lambda Needed!)**

**Why ECS Fargate (NOT Lambda):**
- ✅ **No Lambda needed** - Direct FastAPI deployment
- ✅ Serverless containers (no EC2 management)
- ✅ Auto-scaling built-in
- ✅ Pay per use
- ✅ Perfect for FastAPI (no adapter needed)
- ✅ Easy deployment
- ✅ **WebSocket support** (API Gateway → ALB → ECS Fargate)
- ✅ No cold starts (containers stay warm)
- ✅ No timeout limits (unlike Lambda's 15-min max)
- ✅ Full control over runtime

**Architecture:**
```
API Gateway (REST + WebSocket)
    ↓
Application Load Balancer (ALB)
    ↓
ECS Fargate (FastAPI containers)
```

**Setup:**
```yaml
ECS Service:
  Task Definition: FastAPI (Python 3.12)
  Container: FastAPI app
  CPU: 0.25 vCPU (256 CPU units)
  Memory: 512 MB
  Desired Count: 1 (auto-scales to 10)
  Auto Scaling: CPU > 70% → add tasks
  Load Balancer: Application Load Balancer (ALB)
  
WebSocket:
  API Gateway WebSocket API → ALB → ECS Fargate
  (No Lambda in between - direct connection!)
```

**Cost:**
- $0.04/vCPU-hour × 0.25 vCPU = $0.01/hour
- $0.004/GB-hour × 0.5 GB = $0.002/hour
- **Total: ~$7-15/month** (depending on traffic)

**Why NOT Lambda:**
- ❌ Cold starts (first request slow - bad for collaboration)
- ❌ 15-minute timeout max (too short for WebSocket connections)
- ❌ More complex for FastAPI (needs adapter/Mangum)
- ❌ Harder to debug WebSocket connections
- ❌ Not ideal for long-lived connections (collaboration)

**✅ We bypass Lambda completely - ECS Fargate handles everything!**

---

## 🗄️ **DATABASE: AWS RDS PostgreSQL**

### **RDS Configuration:**

```yaml
Engine: PostgreSQL 16
Instance Class: db.t3.micro (free tier eligible)
              → db.t3.small (production)

Storage:
  Type: General Purpose SSD (gp3)
  Size: 20 GB (auto-scales to 100 GB)
  IOPS: 3000 (baseline)

Backup:
  Automated Backups: Yes (7 days retention)
  Snapshot: Daily at 03:00 UTC
  Multi-AZ: No (v1), Yes (v2 for HA)

Security:
  VPC: Private subnet
  Security Group: Only ECS can access
  Encryption: At rest (AES-256)
  SSL: Required for connections
```

**Cost:**
- **db.t3.micro**: $0/month (Free Tier - 750 hours/month)
- **db.t3.small**: $15/month (after free tier)
- **Storage**: $0.115/GB/month
- **Backups**: $0.095/GB/month (first 20 GB free)
- **Total: $0-20/month** (first year free)

---

## 📦 **STORAGE: AWS S3**

### **S3 Bucket Structure:**

```
mdreader-production/
├── documents/
│   ├── {workspace_id}/
│   │   ├── {document_id}.md
│   │   └── versions/
│   │       └── {version_id}.md
├── attachments/
│   ├── {workspace_id}/
│   │   └── {document_id}/
│   │       └── {file_name}
└── backups/
    └── {date}/
        └── {workspace_id}.json
```

### **S3 Configuration:**

```yaml
Bucket: mdreader-production
Region: us-east-1 (or your choice)
Versioning: Enabled (for document versions)
Lifecycle:
  - Delete old versions after 90 days
  - Move to Glacier after 30 days (optional)
  
Storage Classes:
  - Standard: Hot data (documents, attachments)
  - Intelligent-Tiering: Auto-optimize costs
  - Glacier: Archives (old backups)

Security:
  - Block Public Access: Enabled
  - Encryption: AES-256 (SSE-S3)
  - CORS: Configured for frontend domain
  - Presigned URLs: 15-minute TTL
```

**Cost:**
- **Storage**: $0.023/GB/month (first 50 GB)
- **Requests**: $0.005 per 1,000 PUT requests
- **Requests**: $0.0004 per 1,000 GET requests
- **Data Transfer Out**: $0.09/GB (first 100 GB free/month)
- **Total: ~$5-15/month** (depending on usage)

---

## 🔐 **AUTH: AWS Cognito**

### **Why Cognito Instead of Custom JWT:**

**Benefits:**
- ✅ Managed service (no auth server to maintain)
- ✅ Built-in user pool management
- ✅ Social logins (Google, GitHub) out of the box
- ✅ MFA support
- ✅ Password reset flows
- ✅ User verification emails
- ✅ Admin APIs for user management

**Setup:**

```yaml
User Pool: mdreader-users
Sign-in Options:
  - Email/Password ✅
  - Google OAuth ✅ (future)
  - GitHub OAuth ✅ (future)

Attributes:
  - email (required, verified)
  - name (optional)
  - picture (optional)

Password Policy:
  - Min length: 8
  - Require uppercase: Yes
  - Require lowercase: Yes
  - Require numbers: Yes
  - Require symbols: Yes

MFA: Optional (future)

Email:
  - From: noreply@mdreader.app
  - Provider: SES (Simple Email Service)
```

**Cost:**
- **MAU (Monthly Active Users)**: $0.0055 per user/month
- **SMS MFA**: $0.00645 per SMS (if enabled)
- **First 50,000 MAU**: SUPPORTED (free tier)
- **Total: $0-5/month** (for first 10k users)

---

## 🌐 **CDN: CloudFront**

### **CloudFront Distribution:**

```yaml
Origin: S3 bucket (mdreader-production)
Behaviors:
  - /documents/* → Cache 1 hour
  - /attachments/* → Cache 24 hours
  - /backups/* → No cache

SSL Certificate: ACM (AWS Certificate Manager)
Domain: api.mdreader.app (or your domain)

Edge Locations: Global (all regions)
Price Class: Use only North America and Europe (cheaper)
```

**Cost:**
- **Data Transfer Out**: $0.085/GB (first 10 TB)
- **Requests**: $0.0075 per 10,000 HTTPS requests
- **Total: ~$5-20/month** (depending on traffic)

---

## 🔑 **SECRETS: AWS Secrets Manager**

### **Secrets Stored:**

```yaml
secrets/mdreader/database:
  - host: rds-endpoint.amazonaws.com
  - port: 5432
  - dbname: mdreader
  - username: admin
  - password: <auto-rotated>

secrets/mdreader/openai:
  - api_key: sk-...
  - organization: org-...

secrets/mdreader/cognito:
  - user_pool_id: us-east-1_xxxxx
  - client_id: xxxxx
  - client_secret: xxxxx
```

**Cost:**
- **$0.40 per secret/month**
- **3 secrets = $1.20/month**

---

## 📊 **MONITORING: CloudWatch**

### **CloudWatch Configuration:**

```yaml
Logs:
  - Log Group: /ecs/mdreader-api
  - Retention: 30 days
  - Format: JSON structured logs

Metrics:
  - API Gateway: Request count, latency, errors
  - ECS: CPU, memory, task count
  - RDS: CPU, connections, storage
  - S3: Request count, storage size

Alarms:
  - Error rate > 5% → SNS notification
  - CPU > 80% → Scale up ECS
  - RDS CPU > 80% → Alert
  - Disk space > 80% → Alert
```

**Cost:**
- **Logs**: $0.50/GB ingested
- **Metrics**: $0.30/metric/month (custom metrics)
- **Alarms**: $0.10/alarm/month
- **Total: ~$5-15/month**

---

## 🚀 **DEPLOYMENT: CI/CD**

### **GitHub Actions + AWS:**

```yaml
Workflow:
  1. Push to main → Trigger workflow
  2. Build Docker image → Push to ECR
  3. Update ECS task definition
  4. Deploy to ECS Fargate
  5. Run database migrations (Alembic)
  6. Health check → Rollback if failed

Services:
  - AWS ECR (Elastic Container Registry): $0.10/GB/month
  - GitHub Actions: Free (for public repos)
  - Total: ~$1-2/month
```

---

## 💰 **COST BREAKDOWN**

### **Monthly Costs (First Year - Free Tier):**

```
Compute (ECS Fargate):
  - db.t3.micro: $0 (free tier)
  - ECS: $7-15/month
  Total: $7-15/month

Database (RDS):
  - Instance: $0 (free tier - 750 hours)
  - Storage: $2.30 (20 GB)
  - Backups: $0 (first 20 GB free)
  Total: $0-3/month (first year)

Storage (S3):
  - Storage: $0.46 (20 GB)
  - Requests: $1-3
  - Transfer: $0 (first 100 GB free)
  Total: $2-5/month

Auth (Cognito):
  - MAU: $0 (first 50k free)
  Total: $0/month

CDN (CloudFront):
  - Transfer: $5-15
  - Requests: $1-2
  Total: $6-17/month

Secrets Manager:
  - 3 secrets: $1.20
  Total: $1.20/month

Monitoring (CloudWatch):
  - Logs: $2-5
  - Metrics: $1-3
  - Alarms: $0.50
  Total: $4-9/month

Base Backend (First Year): $21-50/month
Base Backend (After Free Tier): $35-70/month
```

### **With Collaboration (Additional Costs):**

```
WebSocket API Gateway: $5-15/month
ElastiCache Redis:     $0-15/month (free tier eligible)
SNS Notifications:     $2-5/month
DynamoDB Streams:      $1-3/month (optional)

Collaboration Total: $8-38/month
```

### **Complete Cost Breakdown:**

```
First Year (with collaboration):     $29-88/month
After Free Tier (with collaboration): $43-108/month
At Scale 1000 users (with collaboration): ~$154/month
```

---

## 🤝 **COLLABORATION FEATURES (CORE - NOT OPTIONAL)**

**Collaboration is our MAIN POINT!** It's not a future feature - it's **CORE** to the product.

### **Collaboration Features Included:**
- ✅ **Real-time document editing** (WebSocket + Yjs CRDT)
- ✅ **Live cursors** (see who's editing where)
- ✅ **Presence indicators** (who's online, avatars)
- ✅ **Comments & @mentions** (inline, threaded discussions)
- ✅ **Permissions system** (Owner, Editor, Commenter, Viewer)
- ✅ **Document sharing** (invite links, email invites)
- ✅ **Team workspaces** (multi-user collaboration)
- ✅ **Notifications** (comments, @mentions, shares)

### **AWS Services for Collaboration:**
- ✅ **API Gateway WebSocket API** - Real-time connections
- ✅ **ElastiCache Redis** - Presence tracking, live cursors
- ✅ **Yjs (CRDT)** - Conflict-free editing
- ✅ **SNS** - Comment notifications, @mentions
- ✅ **DynamoDB Streams** (optional) - Real-time document state

**See**: `docs/AWS_COLLABORATION_FEATURES.md` for complete collaboration implementation guide.

**Additional Cost**: $8-38/month for collaboration services

---

## 📋 **IMPLEMENTATION PLAN**

### **Week 0: AWS Setup**

**Day 1-2: AWS Account & Services**
- [ ] Create AWS account
- [ ] Set up IAM users/roles
- [ ] Create VPC (Virtual Private Cloud)
- [ ] Set up security groups
- [ ] Create S3 bucket
- [ ] Set up Cognito User Pool
- [ ] Create RDS PostgreSQL instance
- [ ] Set up Secrets Manager

**Day 3-4: ECS Setup**
- [ ] Create ECR repository
- [ ] Build Docker image for FastAPI
- [ ] Push to ECR
- [ ] Create ECS cluster
- [ ] Create task definition
- [ ] Create ECS service
- [ ] Set up Application Load Balancer (ALB)
- [ ] Configure API Gateway → ALB integration

**Day 5: CI/CD**
- [ ] Set up GitHub Actions
- [ ] Configure AWS credentials (GitHub Secrets)
- [ ] Create deployment workflow
- [ ] Test deployment

---

### **Week 1: Auth Integration**

**Day 1-2: Cognito Integration**
- [ ] Install `boto3` (AWS SDK)
- [ ] Create Cognito service layer
- [ ] Implement signup endpoint
- [ ] Implement login endpoint
- [ ] Implement token refresh
- [ ] Test auth flow

**Day 3-4: Frontend Integration**
- [ ] Install AWS Amplify or Cognito JS SDK
- [ ] Update frontend auth service
- [ ] Add login/signup UI
- [ ] Handle token storage
- [ ] Test end-to-end

**Day 5: Testing**
- [ ] Unit tests for auth
- [ ] Integration tests
- [ ] E2E tests

---

### **Week 2: Database & Documents**

**Day 1-2: RDS Connection**
- [ ] Set up SQLAlchemy with RDS
- [ ] Configure connection pooling
- [ ] Test database connection
- [ ] Run Alembic migrations

**Day 3-4: Document CRUD**
- [ ] Implement document endpoints
- [ ] Add ETag support (If-Match headers)
- [ ] Implement versioning
- [ ] Test CRUD operations

**Day 5: Sync Endpoint**
- [ ] Implement cursor-based sync
- [ ] Add tombstone support
- [ ] Test sync flow

---

### **Week 3: S3 & Attachments**

**Day 1-2: S3 Integration**
- [ ] Set up boto3 S3 client
- [ ] Implement presigned URL generation
- [ ] Configure CORS
- [ ] Test S3 uploads

**Day 3-4: Attachments API**
- [ ] Create attachment endpoints
- [ ] Link attachments to documents
- [ ] Implement file metadata storage
- [ ] Test attachment flow

**Day 5: CloudFront Setup**
- [ ] Create CloudFront distribution
- [ ] Configure S3 as origin
- [ ] Set up custom domain
- [ ] Test CDN delivery

---

### **Week 4: AI Proxy & Basic Features**

**Day 1-2: AI Proxy**
- [ ] Store OpenAI keys in Secrets Manager
- [ ] Implement AI proxy endpoint
- [ ] Add rate limiting (Redis or in-memory)
- [ ] Test AI calls

**Day 3: Monitoring**
- [ ] Set up CloudWatch dashboards
- [ ] Configure alarms
- [ ] Add structured logging
- [ ] Test monitoring

**Day 4-5: Basic Testing**
- [ ] Security review
- [ ] Performance testing
- [ ] Basic load testing
- [ ] Fix critical issues

---

### **Week 5-6: WebSocket & Real-Time Infrastructure**

**Week 5: WebSocket Setup**
- [ ] Set up API Gateway WebSocket API
- [ ] Implement WebSocket handlers in FastAPI
- [ ] Set up ElastiCache Redis
- [ ] Implement connection management
- [ ] Test WebSocket connections

**Week 6: Yjs Integration**
- [ ] Integrate Yjs CRDT library
- [ ] Implement document sync via WebSocket
- [ ] Set up update broadcasting
- [ ] Handle conflicts (CRDT)
- [ ] Test multi-user editing

---

### **Week 7-8: Presence & Cursors**

**Week 7: Presence Tracking**
- [ ] Implement presence tracking (Redis)
- [ ] Add live cursor broadcasting
- [ ] Show user avatars
- [ ] Online/offline status

**Week 8: Cursor UI**
- [ ] Selection highlighting
- [ ] Cursor animations
- [ ] User name tooltips
- [ ] Test with multiple users

---

### **Week 9-10: Comments & Permissions**

**Week 9: Comments System**
- [ ] Create comments table (RDS)
- [ ] Implement comment endpoints
- [ ] Add inline comment UI
- [ ] Threaded discussions
- [ ] @mention system

**Week 10: Permissions & Sharing**
- [ ] Permissions table (RDS)
- [ ] Role-based access (Owner, Editor, Commenter, Viewer)
- [ ] Document sharing
- [ ] Invite links
- [ ] Email invites

---

### **Week 11-12: Notifications & Polish**

**Week 11: Notifications**
- [ ] Set up SNS topics
- [ ] Comment notifications
- [ ] @mention alerts
- [ ] Share invites
- [ ] Email integration (SES)

**Week 12: Production Deploy & Testing**
- [ ] Final testing (multi-user scenarios)
- [ ] Performance optimization
- [ ] Load testing (collaboration)
- [ ] Deploy to production
- [ ] Monitor for issues
- [ ] Document setup

---

## 🛠️ **TECHNICAL STACK**

### **Backend:**
```yaml
Language: Python 3.12
Framework: FastAPI
Database: PostgreSQL 16 (AWS RDS)
ORM: SQLAlchemy 2.x
Migrations: Alembic
Storage: AWS S3 (boto3)
Auth: AWS Cognito (boto3)
Secrets: AWS Secrets Manager (boto3)
Monitoring: CloudWatch (boto3)
```

### **Infrastructure:**
```yaml
Compute: AWS ECS Fargate
API: AWS API Gateway + ALB
Database: AWS RDS PostgreSQL
Storage: AWS S3
CDN: AWS CloudFront
Auth: AWS Cognito
Secrets: AWS Secrets Manager
Monitoring: AWS CloudWatch
CI/CD: GitHub Actions + AWS CodeDeploy
```

---

## 📝 **PROJECT STRUCTURE**

```
backend/
├── app/
│   ├── __init__.py
│   ├── main.py                    # FastAPI app
│   ├── config.py                  # AWS config (boto3 clients)
│   ├── deps.py                    # Dependencies (db, cognito)
│   ├── models/                    # SQLAlchemy models
│   ├── schemas/                   # Pydantic models
│   ├── routers/
│   │   ├── auth.py                # Cognito integration
│   │   ├── workspaces.py
│   │   ├── documents.py
│   │   ├── uploads.py             # S3 presigned URLs
│   │   ├── sync.py
│   │   └── ai.py                   # AI proxy
│   ├── services/
│   │   ├── cognito_service.py     # AWS Cognito wrapper
│   │   ├── s3_service.py          # AWS S3 wrapper
│   │   ├── secrets_service.py     # AWS Secrets Manager
│   │   ├── doc_service.py
│   │   └── ai_proxy_service.py
│   └── utils/
│       ├── etag.py
│       └── logging.py              # CloudWatch logging
├── alembic/                        # Migrations
├── tests/
├── Dockerfile                      # ECS container
├── docker-compose.yml              # Local dev
├── pyproject.toml
└── .env.example
```

---

## 🔒 **SECURITY BEST PRACTICES**

### **IAM Roles:**
- ✅ ECS task role: Read-only access to S3, Secrets Manager
- ✅ ECS execution role: Pull from ECR, write to CloudWatch
- ✅ RDS: Only accessible from ECS security group
- ✅ S3: Private bucket, presigned URLs only

### **Secrets:**
- ✅ Database credentials in Secrets Manager
- ✅ API keys in Secrets Manager
- ✅ Auto-rotation enabled (where possible)
- ✅ Never commit secrets to git

### **Network:**
- ✅ VPC with private subnets for RDS
- ✅ Public subnets only for ALB
- ✅ Security groups: Least privilege
- ✅ SSL/TLS everywhere

---

## ✅ **DECISION: AWS-HEAVY STACK**

**Final Stack:**
- ✅ **Compute**: AWS ECS Fargate
- ✅ **API**: AWS API Gateway + ALB
- ✅ **Database**: AWS RDS PostgreSQL
- ✅ **Storage**: AWS S3
- ✅ **CDN**: AWS CloudFront
- ✅ **Auth**: AWS Cognito
- ✅ **Secrets**: AWS Secrets Manager
- ✅ **Monitoring**: AWS CloudWatch

**Cost: $29-88/month** (first year with free tier, including collaboration)  
**Cost: $43-108/month** (after free tier)  
**Cost: ~$154/month** (at 1000 users scale)

**Timeline: 12 weeks** (includes collaboration features)

---

## 🚀 **NEXT STEPS**

1. ✅ Create AWS account
2. ✅ Set up AWS services (Week 0)
3. ✅ Implement backend (Week 1-4)
4. ✅ Deploy to production
5. ✅ Monitor and optimize

---

**Ready to start AWS setup?** 🚀

