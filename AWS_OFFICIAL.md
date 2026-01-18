# 🏗️ MDReader AWS Architecture - Official Plan

> **Single Source of Truth** for AWS deployment. All other AWS documentation files are deprecated.

**Last Updated**: January 17, 2026  
**Version**: 2.0.0

---

## 📋 Table of Contents

1. [Executive Summary](#-executive-summary)
2. [Current Features Analysis](#-current-features-analysis)
3. [AWS Services Decision Matrix](#-aws-services-decision-matrix)
4. [Architecture Design](#-architecture-design)
5. [Service Configuration](#-service-configuration)
6. [Implementation Phases](#-implementation-phases)
7. [Cost Analysis](#-cost-analysis)
8. [Security Model](#-security-model)
9. [FAQ & Decisions](#-faq--decisions)

---

## 📊 Executive Summary

### What MDReader Is
A **local-first collaborative markdown editor** with:
- Rich WYSIWYG editing (TipTap)
- Real-time collaboration (Yjs CRDT)
- AI-powered features (client-side)
- Desktop app (Tauri) + Web app
- Mindmaps & Presentations

### What AWS Provides
| Need | AWS Service | Why |
|------|-------------|-----|
| **User Auth** | Cognito | Replaces FastAPI JWT, adds social login |
| **Real-Time Sync** | ECS Fargate | Hocuspocus WebSocket server |
| **Document Metadata** | RDS PostgreSQL | Existing schema, managed service |
| **File Storage** | S3 | Images, attachments, exports |
| **Static Hosting** | CloudFront + S3 | Web app distribution |
| **Protection** | WAF | DDoS, SQL injection protection |

### What AWS Does NOT Provide
| Feature | Reason |
|---------|--------|
| ❌ Lambda for API | Overkill - direct integrations are simpler |
| ❌ Lambda for AI | AI runs client-side (OpenAI/Anthropic APIs) |
| ❌ Complex orchestration | Most logic is in the Tauri/Web client |

---

## 🔍 Current Features Analysis

### MDReader Feature Map

```
┌─────────────────────────────────────────────────────────────────────┐
│                     MDReader Application                             │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌──────────────────────┐  ┌──────────────────────┐                │
│  │   EDITOR FEATURES    │  │   AI FEATURES        │                │
│  │   ─────────────────  │  │   ─────────────────  │                │
│  │   • TipTap WYSIWYG   │  │   • Content Gen      │                │
│  │   • Markdown parsing │  │   • Diagram Gen      │                │
│  │   • Tables, Links    │  │   • Summarization    │                │
│  │   • Images, Embeds   │  │   • Brainstorming    │                │
│  │   • Code blocks      │  │                      │                │
│  │   • Mermaid diagrams │  │   🔑 Runs CLIENT-    │                │
│  │                      │  │      SIDE via        │                │
│  │   🔑 Runs in         │  │      OpenAI API      │                │
│  │      browser/Tauri   │  │                      │                │
│  └──────────────────────┘  └──────────────────────┘                │
│                                                                     │
│  ┌──────────────────────┐  ┌──────────────────────┐                │
│  │   COLLABORATION      │  │   DATA MANAGEMENT    │                │
│  │   ─────────────────  │  │   ─────────────────  │                │
│  │   • Real-time edit   │  │   • Workspaces       │                │
│  │   • Presence/cursors │  │   • Folders          │                │
│  │   • Conflict resolve │  │   • Documents        │                │
│  │   • WebSocket sync   │  │   • Snapshots        │                │
│  │                      │  │   • Sharing          │                │
│  │   🔑 Hocuspocus +    │  │                      │                │
│  │      Yjs CRDT        │  │   🔑 PostgreSQL      │                │
│  └──────────────────────┘  └──────────────────────┘                │
│                                                                     │
│  ┌──────────────────────┐  ┌──────────────────────┐                │
│  │   OFFLINE SUPPORT    │  │   PLATFORMS          │                │
│  │   ─────────────────  │  │   ─────────────────  │                │
│  │   • IndexedDB        │  │   • Web (React)      │                │
│  │   • Local file ops   │  │   • Desktop (Tauri)  │                │
│  │   • Sync on connect  │  │   • PWA (future)     │                │
│  │                      │  │                      │                │
│  │   🔑 Client-side     │  │   🔑 Same codebase   │                │
│  │      Yjs storage     │  │      different env   │                │
│  └──────────────────────┘  └──────────────────────┘                │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### Backend API Endpoints (Current)

| Endpoint Category | Operations | AWS Handling |
|-------------------|------------|--------------|
| `/auth/*` | Register, Login, Logout, Refresh | **Cognito** (replaces) |
| `/workspaces/*` | CRUD, Members | **API Gateway + RDS** |
| `/documents/*` | CRUD, Versions | **API Gateway + RDS** |
| `/folders/*` | CRUD | **API Gateway + RDS** |
| `/shares/*` | Create, Manage | **API Gateway + RDS** |
| `/snapshots/*` | Create, Restore | **API Gateway + RDS** |
| `/files/*` | Upload, Download | **S3 Presigned URLs** |

---

## ✅ AWS Services Decision Matrix

### Required Services

| Service | Purpose | Why This Service | Alternative Considered |
|---------|---------|------------------|----------------------|
| **Cognito** | Authentication | Managed JWT, social login, MFA | Auth0 (more expensive) |
| **ECS Fargate** | Hocuspocus server | Containerized, auto-scaling, WebSocket support | Lambda (no WebSocket) |
| **RDS PostgreSQL** | Database | Existing schema, managed backups | DynamoDB (schema migration) |
| **S3** | File storage | Scalable, cheap, integrated | EFS (overkill) |
| **CloudFront** | CDN | Global distribution, caching | None needed |
| **WAF** | Security | DDoS protection, SQL injection | None (required) |
| **Route 53** | DNS | AWS integrated | Existing DNS |
| **Secrets Manager** | Credentials | Secure, rotatable | Parameter Store |
| **CloudWatch** | Monitoring | Logs, metrics, alarms | DataDog (expensive) |

### NOT Using (With Reasoning)

| Service | Why NOT Using |
|---------|---------------|
| **Lambda** | MDReader is local-first. No complex server-side processing needed. Direct integrations are simpler and cheaper. |
| **API Gateway (REST)** | Only needed if using Lambda. Direct RDS access via Cognito auth is simpler. |
| **AppSync** | GraphQL not needed. REST is sufficient. |
| **SQS/SNS** | No async processing requirements. Real-time handled by Hocuspocus. |
| **Step Functions** | No workflow orchestration needed. |
| **ElastiCache** | Hocuspocus handles in-memory state. Optional future addition. |
| **Global Accelerator** | Not needed until 10k+ concurrent users. |

---

## 🏛️ Architecture Design

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           MDReader Cloud Architecture                        │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────┐                                                        │
│  │  Users          │                                                        │
│  │  ───────────    │                                                        │
│  │  • Web Browser  │                                                        │
│  │  • Tauri Desktop│                                                        │
│  └────────┬────────┘                                                        │
│           │                                                                 │
│           ▼                                                                 │
│  ┌─────────────────────────────────────────────────────────────┐           │
│  │                    CloudFront (CDN + WAF)                    │           │
│  │  • Static assets (React app)                                 │           │
│  │  • API routing                                               │           │
│  │  • DDoS protection                                           │           │
│  └──────────────────────────┬──────────────────────────────────┘           │
│                             │                                               │
│           ┌─────────────────┼─────────────────┐                            │
│           │                 │                 │                            │
│           ▼                 ▼                 ▼                            │
│  ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐              │
│  │    Cognito      │ │  ECS Fargate    │ │      S3         │              │
│  │    ────────     │ │  ───────────    │ │      ──         │              │
│  │    Auth         │ │  Hocuspocus     │ │  Static Files   │              │
│  │    • Login      │ │  • WebSocket    │ │  • Web App      │              │
│  │    • Register   │ │  • Yjs Sync     │ │  • Attachments  │              │
│  │    • JWT        │ │  • Presence     │ │  • Exports      │              │
│  │    • Social     │ │                 │ │                 │              │
│  └────────┬────────┘ └────────┬────────┘ └─────────────────┘              │
│           │                   │                                            │
│           │                   │                                            │
│           ▼                   ▼                                            │
│  ┌─────────────────────────────────────────────────────────────┐           │
│  │                    RDS PostgreSQL                            │           │
│  │  • Users table (synced from Cognito)                        │           │
│  │  • Workspaces, Documents, Folders                           │           │
│  │  • Shares, Snapshots, Audit logs                            │           │
│  │  • Yjs document state (via Hocuspocus)                      │           │
│  └─────────────────────────────────────────────────────────────┘           │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Data Flow Diagrams

#### 1. User Authentication Flow

```
┌──────────┐     ┌───────────┐     ┌──────────┐     ┌─────────┐
│  Client  │────▶│ CloudFront│────▶│ Cognito  │────▶│   RDS   │
│(Web/Tauri)│    │           │     │          │     │         │
└──────────┘     └───────────┘     └──────────┘     └─────────┘
     │                                   │               │
     │ 1. Login request                  │               │
     │─────────────────────────────────▶│               │
     │                                   │               │
     │ 2. Cognito validates             │               │
     │    returns JWT                   │               │
     │◀─────────────────────────────────│               │
     │                                   │               │
     │ 3. Client stores JWT             │               │
     │    in localStorage               │               │
     │                                   │               │
     │ 4. Subsequent requests           │               │
     │    include JWT header            │               │
     │────────────────────────────────────────────────▶│
     │                                                  │
     │ 5. RDS returns data                             │
     │◀────────────────────────────────────────────────│
```

#### 2. Real-Time Collaboration Flow

```
┌──────────┐     ┌───────────┐     ┌──────────────┐     ┌─────────┐
│  Client  │────▶│ CloudFront│────▶│ ECS Fargate  │────▶│   RDS   │
│(Web/Tauri)│    │           │     │ (Hocuspocus) │     │         │
└──────────┘     └───────────┘     └──────────────┘     └─────────┘
     │                                     │                 │
     │ 1. WebSocket connect               │                 │
     │    (wss://ws.mdreader.app)        │                 │
     │───────────────────────────────────▶│                │
     │                                     │                │
     │ 2. Send JWT for auth               │                │
     │───────────────────────────────────▶│                │
     │                                     │                │
     │                                     │ 3. Load Yjs    │
     │                                     │    state       │
     │                                     │───────────────▶│
     │                                     │                │
     │ 4. Yjs sync protocol               │                │
     │◀──────────────────────────────────▶│                │
     │                                     │                │
     │ 5. Real-time updates               │ 6. Persist     │
     │◀──────────────────────────────────▶│    changes     │
     │                                     │───────────────▶│
```

#### 3. File Upload Flow

```
┌──────────┐     ┌───────────┐     ┌─────────┐
│  Client  │────▶│ CloudFront│────▶│   S3    │
│(Web/Tauri)│    │           │     │         │
└──────────┘     └───────────┘     └─────────┘
     │                                  │
     │ 1. Request presigned URL        │
     │    (via Cognito auth)           │
     │─────────────────────────────────▶│
     │                                  │
     │ 2. Receive presigned URL        │
     │◀─────────────────────────────────│
     │                                  │
     │ 3. Direct upload to S3          │
     │─────────────────────────────────▶│
     │                                  │
     │ 4. Confirm upload               │
     │◀─────────────────────────────────│
```

---

## ⚙️ Service Configuration

### 1. Amazon Cognito

**Purpose**: User authentication, JWT tokens, social login

```yaml
# Cognito User Pool Configuration
MDReaderUserPool:
  Type: AWS::Cognito::UserPool
  Properties:
    UserPoolName: mdreader-users
    
    # Email-based login
    UsernameAttributes:
      - email
    AutoVerifiedAttributes:
      - email
    
    # Password policy
    Policies:
      PasswordPolicy:
        MinimumLength: 8
        RequireUppercase: true
        RequireLowercase: true
        RequireNumbers: true
        RequireSymbols: false  # User-friendly
    
    # MFA (optional)
    MfaConfiguration: OPTIONAL
    
    # Schema matches existing User table
    Schema:
      - Name: email
        AttributeDataType: String
        Required: true
        Mutable: true
      - Name: name
        AttributeDataType: String
        Required: false
        Mutable: true
      - Name: preferred_username
        AttributeDataType: String
        Required: false
        Mutable: true

# App Client (for web/desktop)
MDReaderClient:
  Type: AWS::Cognito::UserPoolClient
  Properties:
    ClientName: mdreader-app
    UserPoolId: !Ref MDReaderUserPool
    GenerateSecret: false  # Public client (SPA/Tauri)
    
    # Token validity
    AccessTokenValidity: 1  # 1 hour
    IdTokenValidity: 1      # 1 hour
    RefreshTokenValidity: 30 # 30 days
    
    # Auth flows
    ExplicitAuthFlows:
      - ALLOW_USER_SRP_AUTH
      - ALLOW_REFRESH_TOKEN_AUTH
    
    # Callback URLs
    CallbackURLs:
      - https://app.mdreader.com/auth/callback
      - http://localhost:5173/auth/callback  # Development
      - tauri://localhost/auth/callback      # Tauri desktop
    LogoutURLs:
      - https://app.mdreader.com
      - http://localhost:5173
```

### 2. Amazon ECS Fargate (Hocuspocus)

**Purpose**: Real-time collaboration WebSocket server

```yaml
# ECS Cluster
MDReaderCluster:
  Type: AWS::ECS::Cluster
  Properties:
    ClusterName: mdreader-cluster
    CapacityProviders:
      - FARGATE
      - FARGATE_SPOT  # Cost savings
    DefaultCapacityProviderStrategy:
      - CapacityProvider: FARGATE_SPOT
        Weight: 80
      - CapacityProvider: FARGATE
        Weight: 20

# Task Definition
HocuspocusTask:
  Type: AWS::ECS::TaskDefinition
  Properties:
    Family: mdreader-hocuspocus
    Cpu: 512      # 0.5 vCPU
    Memory: 1024  # 1GB RAM
    NetworkMode: awsvpc
    RequiresCompatibilities:
      - FARGATE
    
    ContainerDefinitions:
      - Name: hocuspocus
        Image: !Sub ${AWS::AccountId}.dkr.ecr.${AWS::Region}.amazonaws.com/mdreader-hocuspocus:latest
        Essential: true
        
        PortMappings:
          - ContainerPort: 1234
            Protocol: tcp
        
        Environment:
          - Name: PORT
            Value: "1234"
          - Name: DATABASE_URL
            Value: !Sub "postgresql://${DBUsername}:${DBPassword}@${RDSEndpoint}:5432/mdreader"
          - Name: JWT_SECRET
            Value: !Ref JWTSecret
        
        LogConfiguration:
          LogDriver: awslogs
          Options:
            awslogs-group: /ecs/mdreader-hocuspocus
            awslogs-region: !Ref AWS::Region
            awslogs-stream-prefix: ecs

# Service with Auto-Scaling
HocuspocusService:
  Type: AWS::ECS::Service
  Properties:
    ServiceName: mdreader-hocuspocus
    Cluster: !Ref MDReaderCluster
    TaskDefinition: !Ref HocuspocusTask
    DesiredCount: 2  # Minimum for HA
    
    NetworkConfiguration:
      AwsvpcConfiguration:
        Subnets:
          - !Ref PrivateSubnetA
          - !Ref PrivateSubnetB
        SecurityGroups:
          - !Ref HocuspocusSG
    
    LoadBalancers:
      - TargetGroupArn: !Ref HocuspocusTargetGroup
        ContainerName: hocuspocus
        ContainerPort: 1234
```

### 3. Amazon RDS PostgreSQL

**Purpose**: Document metadata, user data, workspace management

```yaml
# RDS Instance
MDReaderDB:
  Type: AWS::RDS::DBInstance
  Properties:
    DBInstanceIdentifier: mdreader-db
    DBName: mdreader
    
    # Engine
    Engine: postgres
    EngineVersion: "15.4"
    
    # Instance size (start small)
    DBInstanceClass: db.t3.micro  # $15/month
    AllocatedStorage: 20
    MaxAllocatedStorage: 100  # Auto-scaling
    StorageType: gp3
    
    # High availability
    MultiAZ: true  # Production only
    
    # Security
    StorageEncrypted: true
    PubliclyAccessible: false
    VPCSecurityGroups:
      - !Ref RDSSG
    DBSubnetGroupName: !Ref DBSubnetGroup
    
    # Backups
    BackupRetentionPeriod: 7
    PreferredBackupWindow: "03:00-04:00"
    
    # Maintenance
    AutoMinorVersionUpgrade: true
    PreferredMaintenanceWindow: "sun:04:00-sun:05:00"
```

### 4. Amazon S3

**Purpose**: Static hosting, file attachments, exports

```yaml
# Web App Bucket
WebAppBucket:
  Type: AWS::S3::Bucket
  Properties:
    BucketName: mdreader-webapp
    WebsiteConfiguration:
      IndexDocument: index.html
      ErrorDocument: index.html
    
    # Block public access (CloudFront only)
    PublicAccessBlockConfiguration:
      BlockPublicAcls: true
      BlockPublicPolicy: true
      IgnorePublicAcls: true
      RestrictPublicBuckets: true

# File Attachments Bucket
AttachmentsBucket:
  Type: AWS::S3::Bucket
  Properties:
    BucketName: mdreader-attachments
    
    # Versioning for recovery
    VersioningConfiguration:
      Status: Enabled
    
    # Lifecycle rules
    LifecycleConfiguration:
      Rules:
        - Id: MoveToInfrequentAccess
          Status: Enabled
          Transitions:
            - Days: 90
              StorageClass: STANDARD_IA
        - Id: DeleteOldVersions
          Status: Enabled
          NoncurrentVersionExpiration:
            NoncurrentDays: 30
    
    # CORS for direct uploads
    CorsConfiguration:
      CorsRules:
        - AllowedOrigins:
            - https://app.mdreader.com
            - http://localhost:5173
          AllowedMethods:
            - GET
            - PUT
            - POST
          AllowedHeaders:
            - "*"
          MaxAge: 3000
```

### 5. Amazon CloudFront

**Purpose**: CDN, WAF integration, routing

```yaml
# CloudFront Distribution
MDReaderDistribution:
  Type: AWS::CloudFront::Distribution
  Properties:
    DistributionConfig:
      Enabled: true
      
      # Origins
      Origins:
        # Web app (S3)
        - Id: S3WebApp
          DomainName: !GetAtt WebAppBucket.RegionalDomainName
          S3OriginConfig:
            OriginAccessIdentity: !Sub origin-access-identity/cloudfront/${OriginAccessIdentity}
        
        # Hocuspocus (ECS)
        - Id: HocuspocusOrigin
          DomainName: !GetAtt ALB.DNSName
          CustomOriginConfig:
            HTTPPort: 80
            HTTPSPort: 443
            OriginProtocolPolicy: https-only
      
      # Default behavior (web app)
      DefaultCacheBehavior:
        TargetOriginId: S3WebApp
        ViewerProtocolPolicy: redirect-to-https
        CachePolicyId: !Ref WebAppCachePolicy
        AllowedMethods:
          - GET
          - HEAD
          - OPTIONS
        CachedMethods:
          - GET
          - HEAD
        Compress: true
      
      # WebSocket behavior
      CacheBehaviors:
        - PathPattern: /ws/*
          TargetOriginId: HocuspocusOrigin
          ViewerProtocolPolicy: https-only
          AllowedMethods:
            - GET
            - HEAD
            - OPTIONS
            - PUT
            - POST
            - PATCH
            - DELETE
          CachedMethods:
            - GET
            - HEAD
          CachePolicyId: !Ref DisableCachePolicy
      
      # Custom domain
      Aliases:
        - app.mdreader.com
      ViewerCertificate:
        AcmCertificateArn: !Ref Certificate
        SslSupportMethod: sni-only
        MinimumProtocolVersion: TLSv1.2_2021
      
      # WAF
      WebACLId: !Ref WAFWebACL
```

---

## 🚀 Implementation Phases

### Phase 1: Foundation (Week 1-2)

**Goal**: Basic AWS infrastructure

| Task | Description | Effort |
|------|-------------|--------|
| 1.1 | Create AWS account, set up billing alerts | 1 day |
| 1.2 | Configure VPC, subnets, security groups | 1 day |
| 1.3 | Deploy RDS PostgreSQL | 1 day |
| 1.4 | Create S3 buckets | 0.5 day |
| 1.5 | Set up Route 53, SSL certificate | 0.5 day |

**Deliverables**:
- VPC with public/private subnets
- RDS PostgreSQL running
- S3 buckets created
- DNS and SSL configured

### Phase 2: Authentication (Week 3)

**Goal**: Cognito replaces FastAPI auth

| Task | Description | Effort |
|------|-------------|--------|
| 2.1 | Create Cognito User Pool | 0.5 day |
| 2.2 | Update frontend AuthService | 1 day |
| 2.3 | Migrate existing users | 1 day |
| 2.4 | Test login/logout/refresh | 1 day |
| 2.5 | Add social login (Google) | 1 day |

**Deliverables**:
- Cognito User Pool configured
- Frontend uses Cognito SDK
- Existing users migrated
- Social login working

### Phase 3: Real-Time Collaboration (Week 4-5)

**Goal**: Hocuspocus on ECS Fargate

| Task | Description | Effort |
|------|-------------|--------|
| 3.1 | Create ECS cluster | 0.5 day |
| 3.2 | Dockerize Hocuspocus | 1 day |
| 3.3 | Configure task definition | 1 day |
| 3.4 | Set up ALB + WebSocket routing | 1 day |
| 3.5 | Update frontend WebSocket URL | 0.5 day |
| 3.6 | Test collaboration features | 2 days |
| 3.7 | Configure auto-scaling | 1 day |

**Deliverables**:
- Hocuspocus running on ECS
- WebSocket connections working
- Real-time collaboration functional
- Auto-scaling configured

### Phase 4: Production Deployment (Week 6-7)

**Goal**: Full production setup

| Task | Description | Effort |
|------|-------------|--------|
| 4.1 | Deploy CloudFront distribution | 1 day |
| 4.2 | Configure WAF rules | 1 day |
| 4.3 | Set up CloudWatch monitoring | 1 day |
| 4.4 | Configure backup policies | 0.5 day |
| 4.5 | Implement CI/CD (GitHub Actions) | 2 days |
| 4.6 | Performance testing | 2 days |
| 4.7 | Security audit | 1 day |

**Deliverables**:
- CloudFront + WAF active
- Monitoring and alerting
- Automated deployments
- Performance benchmarks

### Phase 5: Optimization (Month 2+)

**Goal**: Cost and performance optimization

| Task | Description | Timing |
|------|-------------|--------|
| 5.1 | Reserved Instances (RDS) | After 1 month |
| 5.2 | Spot Instances optimization | After 2 weeks |
| 5.3 | S3 lifecycle tuning | After 1 month |
| 5.4 | CloudFront cache optimization | Ongoing |

---

## 💰 Cost Analysis

### Monthly Cost Breakdown

| Service | Configuration | Monthly Cost |
|---------|---------------|--------------|
| **Cognito** | 1,000 MAU | $0 (free tier) |
| **ECS Fargate** | 2 tasks × 0.5vCPU × 1GB | $25-35 |
| **RDS PostgreSQL** | db.t3.micro, Multi-AZ | $25-30 |
| **S3** | 50GB storage + transfers | $5-10 |
| **CloudFront** | 100GB/month transfer | $10-15 |
| **WAF** | Basic rules | $5-10 |
| **Route 53** | 1 hosted zone | $0.50 |
| **CloudWatch** | Logs + metrics | $5-10 |
| **Secrets Manager** | 3 secrets | $1.20 |
| **TOTAL** | | **$75-115/month** |

### Cost Comparison

| Approach | Monthly Cost | Notes |
|----------|--------------|-------|
| **This Plan** | $75-115 | Optimized for MDReader |
| **Previous Lambda Plan** | $170-260 | Over-engineered |
| **Self-hosted VPS** | $40-60 | No scaling, manual maintenance |
| **Vercel + Supabase** | $50-100 | Limited WebSocket support |

### Cost Optimization Opportunities

| Optimization | Savings | When |
|--------------|---------|------|
| RDS Reserved Instance (1 year) | 30% ($8/month) | After 1 month stable |
| Fargate Spot (80% traffic) | 70% ($15/month) | Immediate |
| S3 Intelligent Tiering | 10% ($1/month) | After 3 months |
| CloudFront Price Class 100 | 20% ($3/month) | US/EU only |

**Optimized Total**: ~$50-75/month

---

## 🔒 Security Model

### Authentication Flow

```
┌─────────────────────────────────────────────────────────────┐
│                    Security Architecture                     │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│   Client                 AWS                                │
│   ──────                 ───                                │
│                                                             │
│   1. User enters credentials                                │
│      ↓                                                      │
│   2. Cognito validates → Returns JWT (1 hour)              │
│      ↓                                                      │
│   3. Client stores JWT locally                              │
│      ↓                                                      │
│   4. All API requests include:                              │
│      Authorization: Bearer <jwt>                            │
│      ↓                                                      │
│   5. Services validate JWT signature                        │
│      (No database lookup needed)                            │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Security Layers

| Layer | Protection | Implementation |
|-------|------------|----------------|
| **Edge** | DDoS, Rate limiting | WAF + CloudFront |
| **Transport** | Encryption | TLS 1.3 everywhere |
| **Authentication** | Identity verification | Cognito JWT |
| **Authorization** | Access control | RDS row-level security |
| **Data** | Encryption at rest | RDS, S3 encryption |
| **Network** | Isolation | VPC, private subnets |

### Security Group Rules

```yaml
# ALB (Public)
ALBSecurityGroup:
  Ingress:
    - Port: 443, Source: 0.0.0.0/0  # HTTPS from internet

# ECS (Private)
ECSSecurityGroup:
  Ingress:
    - Port: 1234, Source: ALBSecurityGroup  # Only from ALB

# RDS (Private)
RDSSecurityGroup:
  Ingress:
    - Port: 5432, Source: ECSSecurityGroup  # Only from ECS
```

---

## ❓ FAQ & Decisions

### Why No Lambda?

**Question**: Why not use Lambda for the API like the previous documentation?

**Answer**: MDReader is a **local-first** application where:
1. Most document operations happen client-side (Tauri/browser)
2. Real-time sync uses Hocuspocus (WebSocket, not REST)
3. AI features call OpenAI/Anthropic directly from client
4. Database operations are simple CRUD (Cognito + RDS direct)

Lambda adds:
- Cold start latency (200-500ms)
- Complexity (packaging, VPC, layers)
- Cost ($5-15/month for simple operations)

For MDReader, **direct integrations are simpler and cheaper**.

### Why ECS Fargate Instead of Lambda for Hocuspocus?

**Question**: Can Hocuspocus run on Lambda?

**Answer**: **No**. Hocuspocus requires:
- Persistent WebSocket connections (Lambda has 15min timeout)
- In-memory state management (Lambda is stateless)
- Continuous process (Lambda is request/response)

ECS Fargate is the only practical AWS option for WebSocket servers.

### Why Not DynamoDB?

**Question**: DynamoDB would be cheaper and simpler. Why RDS?

**Answer**: MDReader has an existing PostgreSQL schema with:
- Foreign key relationships
- Complex queries (JOINs)
- Transactions
- JSON columns for flexible data

Migrating to DynamoDB would require significant schema redesign. RDS is the pragmatic choice.

### What About Mobile Apps?

**Question**: Will this architecture support iOS/Android?

**Answer**: **Yes**. The same architecture works for mobile:
- Cognito provides mobile SDKs
- WebSocket (Hocuspocus) works on mobile
- S3 presigned URLs work on mobile
- CloudFront serves mobile app bundles

Add React Native or Flutter frontend when needed.

### What If We Need More Scale?

**Question**: What if we grow to 100k+ users?

**Answer**: This architecture scales to ~50k concurrent users without changes. Beyond that:
1. Add ElastiCache Redis for session caching
2. Add RDS read replicas
3. Increase ECS task count (auto-scaling handles this)
4. Add Aurora Serverless v2 for database

The architecture is designed to scale incrementally.

---

## 📁 Deprecated Files

The following AWS documentation files are **deprecated** and should be removed:

| File | Reason |
|------|--------|
| `AWS_ARCHITECTURE.md` | Superseded by this document |
| `AWS_SERVICES_MAPPING.md` | Over-engineered, Lambda-focused |
| `AWS_DEPLOYMENT_STRATEGY.md` | Merged into this document |
| `AWS_NETWORKING.md` | Simplified in this document |
| `AWS_ARCHITECTURE_SUMMARY.md` | Redundant |
| `AWS_COST_OPTIMIZATION.md` | Merged into this document |

---

## 🎯 Next Steps

1. **Review this document** and confirm alignment
2. **Create AWS account** with billing alerts
3. **Start Phase 1** (Foundation)
4. **Delete deprecated files** after confirmation

---

**Questions?** This document is the single source of truth for MDReader AWS architecture. Update this document for any architectural changes.
