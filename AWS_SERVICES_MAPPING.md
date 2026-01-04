# 🔄 AWS Services Mapping for MDReader

**Detailed mapping of MDReader components to AWS services with configuration examples.**

---

## 📊 Services Mapping Overview

| MDReader Component | Current Tech | AWS Service | Configuration | Cost/Month |
|-------------------|--------------|-------------|---------------|------------|
| **Authentication** | FastAPI JWT | Amazon Cognito | User Pool + Identity Pool | $5 |
| **API Backend** | FastAPI (Python) | AWS Lambda + API Gateway | Serverless API | $5-15 |
| **Database** | PostgreSQL | Amazon RDS | Multi-AZ PostgreSQL | $15-25 |
| **Caching** | Redis | Amazon ElastiCache | Redis Cluster | $20-30 |
| **Real-time Sync** | Hocuspocus (Node.js) | Amazon ECS Fargate | Containerized WebSocket | $30-50 |
| **File Storage** | Local filesystem | Amazon S3 | Object storage + CDN | $5-10 |
| **Frontend Hosting** | Vite dev server | AWS Amplify/S3+CloudFront | Static hosting | $1-5 |
| **Email Service** | SMTP | Amazon SES | Transactional email | $1 |
| **CDN** | - | Amazon CloudFront | Global distribution | $80-100 |
| **DNS** | - | Amazon Route 53 | Domain management | $0.50 |
| **Monitoring** | - | Amazon CloudWatch | Logs + Metrics | $5-10 |
| **Security** | - | AWS WAF + Shield | DDoS protection | $10-20 |
| **Secrets** | .env files | AWS Secrets Manager | Secure credentials | $0.50 |
| **Backup** | - | AWS Backup | Automated backups | $5 |

---

## 🔐 1. Authentication & Authorization

### Current Implementation
- FastAPI with JWT tokens (python-jose)
- Password hashing with bcrypt
- User registration, login, password reset
- Session management

### AWS Migration: Amazon Cognito

**Why Cognito:**
- Managed user authentication service
- JWT token generation and validation
- Built-in password policies and MFA
- Social login integration (Google, GitHub)
- User migration tools
- Cost-effective (pay per user)

**Configuration:**

```yaml
# Cognito User Pool
MDReaderUserPool:
  Type: AWS::Cognito::UserPool
  Properties:
    UserPoolName: MDReaderUsers
    Policies:
      PasswordPolicy:
        MinimumLength: 8
        RequireUppercase: true
        RequireLowercase: true
        RequireNumbers: true
        RequireSymbols: true
    AutoVerifiedAttributes:
      - email
    UsernameAttributes:
      - email
    MfaConfiguration: OPTIONAL
    DeviceConfiguration:
      ChallengeRequiredOnNewDevice: false
      DeviceOnlyRememberedOnUserPrompt: true

# App Client for web/desktop app
MDReaderWebClient:
  Type: AWS::Cognito::UserPoolClient
  Properties:
    UserPoolId: !Ref MDReaderUserPool
    ClientName: MDReaderWebClient
    GenerateSecret: false
    ExplicitAuthFlows:
      - ADMIN_NO_SRP_AUTH
      - USER_SRP_AUTH
    SupportedIdentityProviders:
      - COGNITO
    CallbackURLs:
      - https://app.mdreader.com/auth/callback
    LogoutURLs:
      - https://app.mdreader.com/
    AccessTokenValidity: 1  # 1 hour
    IdTokenValidity: 1      # 1 hour
    RefreshTokenValidity: 168  # 7 days

# Identity Pool for AWS service access
MDReaderIdentityPool:
  Type: AWS::Cognito::IdentityPool
  Properties:
    IdentityPoolName: MDReaderIdentityPool
    CognitoIdentityProviders:
      - ClientId: !Ref MDReaderWebClient
        ProviderName: !GetAtt MDReaderUserPool.ProviderName
    AllowUnauthenticatedIdentities: false
```

**Migration Steps:**
1. Export users from current PostgreSQL
2. Create Cognito User Pool with matching policies
3. Migrate users using Cognito User Migration Lambda
4. Update frontend to use Cognito SDK
5. Update backend to validate Cognito JWT tokens

---

## 🚪 2. Backend API

### Current Implementation
- FastAPI with async endpoints
- PostgreSQL with SQLAlchemy
- Redis for caching
- JWT authentication
- File upload handling
- Rate limiting

### AWS Migration: AWS Lambda + API Gateway

**Why Serverless:**
- No server management
- Auto-scaling to zero
- Pay-per-request pricing
- FastAPI runs well on Lambda
- Built-in monitoring and logging

**Configuration:**

```yaml
# API Gateway
MDReaderAPI:
  Type: AWS::Serverless::Api
  Properties:
    Name: MDReaderAPI
    StageName: prod
    Cors:
      AllowMethods: "'GET,POST,PUT,DELETE,OPTIONS'"
      AllowHeaders: "'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token'"
      AllowOrigin: "'*'"

# Lambda Function
MDReaderBackend:
  Type: AWS::Serverless::Function
  Properties:
    FunctionName: MDReaderBackend
    Runtime: python3.11
    Handler: app.main.handler
    CodeUri: backendv2/
    MemorySize: 1024
    Timeout: 30
    Environment:
      Variables:
        ENVIRONMENT: prod
        DATABASE_URL: !Ref DatabaseURL
        REDIS_URL: !Ref RedisURL
        COGNITO_USER_POOL_ID: !Ref MDReaderUserPool
        S3_BUCKET: !Ref MDReaderUploadsBucket
    Events:
      ApiEvent:
        Type: Api
        Properties:
          RestApiId: !Ref MDReaderAPI
          Path: /{proxy+}
          Method: ANY
    VpcConfig:
      SecurityGroupIds:
        - !Ref LambdaSecurityGroup
      SubnetIds:
        - !Ref PrivateSubnetA
        - !Ref PrivateSubnetB

# Custom authorizer for Cognito JWT
MDReaderAuthorizer:
  Type: AWS::ApiGateway::Authorizer
  Properties:
    Name: MDReaderCognitoAuthorizer
    Type: COGNITO_USER_POOLS
    ProviderARNs:
      - !GetAtt MDReaderUserPool.Arn
    IdentitySource: method.request.header.Authorization
```

**FastAPI Lambda Handler:**

```python
# app/main.py
from fastapi import FastAPI
from mangum import Mangum
from app.database import create_db_and_tables
from app.routers import auth, workspaces, documents

app = FastAPI(title="MDReader API", version="2.0.0")

# Include routers
app.include_router(auth.router)
app.include_router(workspaces.router)
app.include_router(documents.router)

# Health check
@app.get("/health")
async def health_check():
    return {"status": "healthy", "version": "2.0.0"}

# Create tables on startup
@app.on_event("startup")
async def startup_event():
    await create_db_and_tables()

# Lambda handler
handler = Mangum(app)
```

---

## 🗄️ 3. Database Layer

### Current Implementation
- PostgreSQL with asyncpg driver
- SQLAlchemy ORM with async support
- Alembic migrations
- Connection pooling

### AWS Migration: Amazon RDS PostgreSQL

**Why RDS:**
- Managed PostgreSQL service
- Automated backups and patching
- Multi-AZ for high availability
- Read replicas for scaling
- Performance insights

**Configuration:**

```yaml
MDReaderDB:
  Type: AWS::RDS::DBInstance
  Properties:
    DBInstanceClass: db.t3.micro
    Engine: postgres
    EngineVersion: "15.4"
    DBInstanceIdentifier: mdreader-prod
    MasterUsername: !Ref DBUsername
    MasterUserPassword: !Ref DBPassword
    DBName: mdreader
    AllocatedStorage: 20
    MaxAllocatedStorage: 1000  # Auto-scaling to 1TB
    StorageType: gp3
    StorageEncrypted: true
    KmsKeyId: !Ref DatabaseKey
    MultiAZ: true
    BackupRetentionPeriod: 30
    EnableCloudwatchLogsExports:
      - postgresql
    DBSubnetGroupName: !Ref DBSubnetGroup
    VPCSecurityGroups:
      - !Ref RDSSecurityGroup
    Tags:
      - Key: Environment
        Value: prod
      - Key: Application
        Value: MDReader

# Read Replica for scaling reads
MDReaderDBReplica:
  Type: AWS::RDS::DBInstance
  Properties:
    DBInstanceClass: db.t3.micro
    Engine: postgres
    SourceDBInstanceIdentifier: !Ref MDReaderDB
    DBInstanceIdentifier: mdreader-prod-replica
    DBSubnetGroupName: !Ref DBSubnetGroup
    VPCSecurityGroups:
      - !Ref RDSSecurityGroup
```

**Connection Configuration:**

```python
# Database URL for Lambda environment
DATABASE_URL = f"postgresql+asyncpg://{username}:{password}@{host}:{port}/{database}"

# For read operations, use replica
READ_DATABASE_URL = f"postgresql+asyncpg://{username}:{password}@{replica_host}:{port}/{database}"
```

---

## ⚡ 4. Caching Layer

### Current Implementation
- Redis for session storage
- Basic caching with TTL
- Connection pooling

### AWS Migration: Amazon ElastiCache Redis

**Why ElastiCache:**
- Managed Redis service
- Multi-AZ for high availability
- Automatic failover
- Performance monitoring
- Cost-effective at scale

**Configuration:**

```yaml
MDReaderRedis:
  Type: AWS::ElastiCache::ReplicationGroup
  Properties:
    ReplicationGroupId: mdreader-redis
    ReplicationGroupDescription: MDReader Redis Cache
    Engine: redis
    EngineVersion: "7.0"
    CacheNodeType: cache.t3.micro
    NumCacheClusters: 2
    AutomaticFailoverEnabled: true
    MultiAZEnabled: true
    SnapshotRetentionLimit: 7
    SnapshotWindow: "03:00-05:00"
    CacheSubnetGroupName: !Ref RedisSubnetGroup
    SecurityGroupIds:
      - !Ref RedisSecurityGroup
    Tags:
      - Key: Environment
        Value: prod
      - Key: Application
        Value: MDReader
```

---

## 🔄 5. Real-Time Collaboration

### Current Implementation
- Hocuspocus WebSocket server (Node.js)
- Yjs CRDT for operational transforms
- In-memory document storage
- Connection monitoring

### AWS Migration: Amazon ECS Fargate + API Gateway WebSocket

**Why ECS Fargate:**
- Containerized deployment
- Auto-scaling based on connections
- Cost-effective (pay per usage)
- Easy to manage and update

**Configuration:**

```yaml
# ECS Cluster
MDReaderECSCluster:
  Type: AWS::ECS::Cluster
  Properties:
    ClusterName: mdreader-cluster

# Task Definition
HocuspocusTaskDefinition:
  Type: AWS::ECS::TaskDefinition
  Properties:
    Family: mdreader-hocuspocus
    Cpu: 512
    Memory: 1024
    NetworkMode: awsvpc
    RequiresCompatibilities:
      - FARGATE
    ExecutionRoleArn: !Ref ECSExecutionRole
    TaskRoleArn: !Ref ECSTaskRole
    ContainerDefinitions:
      - Name: hocuspocus
        Image: node:18-alpine
        Essential: true
        Environment:
          - Name: PORT
            Value: "80"
          - Name: DATABASE_URL
            Value: !Ref DatabaseURL
          - Name: REDIS_URL
            Value: !Ref RedisURL
        PortMappings:
          - ContainerPort: 80
            Protocol: tcp
        LogConfiguration:
          LogDriver: awslogs
          Options:
            awslogs-group: !Ref HocuspocusLogGroup
            awslogs-region: !Ref AWS::Region
            awslogs-stream-prefix: ecs

# ECS Service
HocuspocusService:
  Type: AWS::ECS::Service
  Properties:
    ServiceName: mdreader-hocuspocus
    Cluster: !Ref MDReaderECSCluster
    TaskDefinition: !Ref HocuspocusTaskDefinition
    DesiredCount: 2
    DeploymentConfiguration:
      MaximumPercent: 200
      MinimumHealthyPercent: 50
    NetworkConfiguration:
      AwsvpcConfiguration:
        Subnets:
          - !Ref PrivateSubnetA
          - !Ref PrivateSubnetB
        SecurityGroups:
          - !Ref HocuspocusSecurityGroup
    LoadBalancers:
      - TargetGroupArn: !Ref HocuspocusTargetGroup
        ContainerName: hocuspocus
        ContainerPort: 80

# WebSocket API Gateway
MDReaderWebSocketAPI:
  Type: AWS::ApiGatewayV2::Api
  Properties:
    Name: MDReaderWebSocket
    ProtocolType: WEBSOCKET
    RouteSelectionExpression: $request.body.action

# WebSocket Routes
ConnectRoute:
  Type: AWS::ApiGatewayV2::Route
  Properties:
    ApiId: !Ref MDReaderWebSocketAPI
    RouteKey: $connect
    Target: integrations/${MDReaderWebSocketIntegration}

DefaultRoute:
  Type: AWS::ApiGatewayV2::Route
  Properties:
    ApiId: !Ref MDReaderWebSocketAPI
    RouteKey: $default
    Target: integrations/${MDReaderWebSocketIntegration}
```

---

## 📦 6. File Storage

### Current Implementation
- Local file system storage
- Basic file upload handling
- No CDN or global distribution

### AWS Migration: Amazon S3 + CloudFront

**Why S3 + CloudFront:**
- Scalable object storage
- Global CDN for fast delivery
- Versioning for document snapshots
- Cost-effective storage classes
- Security features (encryption, access control)

**Configuration:**

```yaml
# S3 Bucket for uploads
MDReaderUploadsBucket:
  Type: AWS::S3::Bucket
  Properties:
    BucketName: mdreader-uploads-prod
    VersioningConfiguration:
      Status: Enabled
    PublicAccessBlockConfiguration:
      BlockPublicAcls: true
      BlockPublicPolicy: true
      IgnorePublicAcls: true
      RestrictPublicBuckets: true
    CorsConfiguration:
      CorsRules:
        - AllowedOrigins: ['https://app.mdreader.com']
          AllowedMethods: [GET, PUT, POST, DELETE]
          AllowedHeaders: ['*']
          MaxAge: 3000
    EncryptionConfiguration:
      ServerSideEncryptionConfiguration:
        - ServerSideEncryptionByDefault:
            SSEAlgorithm: AES256
    LifecycleConfiguration:
      Rules:
        - Id: MoveToGlacier
          Status: Enabled
          Transitions:
            - Days: 90
              StorageClass: GLACIER
        - Id: DeleteOldVersions
          Status: Enabled
          NoncurrentVersionExpiration:
            NoncurrentDays: 30

# CloudFront Distribution
MDReaderCDN:
  Type: AWS::CloudFront::Distribution
  Properties:
    DistributionConfig:
      Origins:
        - DomainName: !GetAtt MDReaderUploadsBucket.RegionalDomainName
          Id: S3Origin
          OriginAccessControlId: !Ref OriginAccessControl
          OriginShield:
            Enabled: true
            OriginShieldRegion: us-east-1
      Enabled: true
      DefaultCacheBehavior:
        TargetOriginId: S3Origin
        ViewerProtocolPolicy: redirect-to-https
        CachePolicyId: !Ref CachePolicy
        AllowedMethods: [GET, HEAD, OPTIONS, PUT, POST, PATCH, DELETE]
        Compress: true
      PriceClass: PriceClass_100
      HttpVersion: http2and3
      WebACLId: !Ref MDReaderWAF
```

---

## 🌐 7. Frontend Hosting

### Current Implementation
- Vite development server
- Static file serving
- No CDN or global distribution

### AWS Migration: AWS Amplify

**Why Amplify:**
- Managed hosting for React apps
- Automatic deployments from Git
- Built-in CDN and SSL
- Environment management
- Cost monitoring
- CI/CD integration

**Configuration:**

```yaml
MDReaderWebApp:
  Type: AWS::Amplify::App
  Properties:
    Name: MDReaderWeb
    Repository: https://github.com/yourorg/mdreader
    AccessToken: !Ref GitHubAccessToken
    BuildSpec: |
      version: 1
      frontend:
        phases:
          preBuild:
            commands:
              - npm ci
              - npm run type-check
          build:
            commands:
              - npm run build
        artifacts:
          baseDirectory: dist
          files:
            - '**/*'
        cache:
          paths:
            - node_modules/**/*
    CustomRules:
      - Source: /api/{proxy+}
        Target: https://api.mdreader.com/api/{proxy+}
        Status: 200
      - Source: /ws/{proxy+}
        Target: wss://websocket.mdreader.com/ws/{proxy+}
        Status: 200
      - Source: </^[^.]+$|.*\.(?!(css|gif|ico|jpg|js|png|txt|svg|woff|woff2|ttf|eot)$)([^.]+$)/>
        Target: /index.html
        Status: 200
    EnvironmentVariables:
      - Name: VITE_API_URL
        Value: https://api.mdreader.com
      - Name: VITE_WS_URL
        Value: wss://websocket.mdreader.com
      - Name: VITE_COGNITO_USER_POOL_ID
        Value: !Ref MDReaderUserPool
      - Name: VITE_COGNITO_CLIENT_ID
        Value: !Ref MDReaderWebClient

# Production branch
ProductionBranch:
  Type: AWS::Amplify::Branch
  Properties:
    AppId: !Ref MDReaderWebApp
    BranchName: main
    EnableAutoBuild: true
    EnvironmentVariables:
      - Name: ENVIRONMENT
        Value: production
```

---

## 📧 8. Email Service

### Current Implementation
- SMTP server integration
- Email templates for notifications
- Password reset emails

### AWS Migration: Amazon SES

**Why SES:**
- Cost-effective transactional email
- High deliverability
- Built-in spam filtering
- DKIM and SPF support
- Detailed analytics

**Configuration:**

```yaml
# SES Configuration
MDReaderSESConfig:
  Type: AWS::SES::ConfigurationSet
  Properties:
    Name: MDReaderEmails

# Verified domain
MDReaderDomain:
  Type: AWS::SES::EmailIdentity
  Properties:
    EmailIdentity: mdreader.com
    DkimAttributes:
      SigningEnabled: true

# SMTP credentials for backend
SESSMTPUser:
  Type: AWS::IAM::User
  Properties:
    UserName: mdreader-ses-smtp
    Policies:
      - PolicyName: SESAccess
        PolicyDocument:
          Version: '2012-10-17'
          Statement:
            - Effect: Allow
              Action: ses:SendRawEmail
              Resource: '*'
```

---

## 📊 9. Monitoring & Observability

### AWS Migration: Amazon CloudWatch

**Configuration:**

```yaml
# Log Groups
MDReaderAPILogs:
  Type: AWS::Logs::LogGroup
  Properties:
    LogGroupName: /aws/lambda/mdreader-backend
    RetentionInDays: 30

MDReaderWebSocketLogs:
  Type: AWS::Logs::LogGroup
  Properties:
    LogGroupName: /aws/ecs/mdreader-hocuspocus
    RetentionInDays: 30

# Alarms
APILatencyAlarm:
  Type: AWS::CloudWatch::Alarm
  Properties:
    AlarmName: MDReader-API-Latency
    ComparisonOperator: GreaterThanThreshold
    EvaluationPeriods: 2
    MetricName: Duration
    Namespace: AWS/Lambda
    Period: 300
    Statistic: Average
    Threshold: 5000
    AlarmActions:
      - !Ref AlertTopic

DBConnectionAlarm:
  Type: AWS::CloudWatch::Alarm
  Properties:
    AlarmName: MDReader-DB-Connections-High
    ComparisonOperator: GreaterThanThreshold
    EvaluationPeriods: 2
    MetricName: DatabaseConnections
    Namespace: AWS/RDS
    Period: 300
    Statistic: Maximum
    Threshold: 80
    AlarmActions:
      - !Ref AlertTopic

WebSocketConnectionAlarm:
  Type: AWS::CloudWatch::Alarm
  Properties:
    AlarmName: MDReader-WebSocket-Connections
    ComparisonOperator: LessThanThreshold
    EvaluationPeriods: 1
    MetricName: ConnectedSocketCount
    Namespace: AWS/ApiGateway
    Period: 300
    Statistic: Maximum
    Threshold: 1
    AlarmActions:
      - !Ref AlertTopic
```

---

## 🔒 10. Security Services

### AWS Migration: AWS WAF + AWS Shield

**Configuration:**

```yaml
MDReaderWAF:
  Type: AWS::WAFv2::WebACL
  Properties:
    Name: MDReaderWAF
    Scope: CLOUDFRONT
    DefaultAction:
      Allow: {}
    Rules:
      # Rate limiting
      - Name: RateLimit
        Priority: 1
        Action:
          Block: {}
        Statement:
          RateBasedStatement:
            Limit: 1000
            AggregateKeyType: IP
            ScopeDownStatement:
              ByteMatchStatement:
                FieldToMatch:
                  UriPath: {}
                PositionalConstraint: STARTS_WITH
                SearchString: /api/
      # SQL Injection protection
      - Name: SQLInjection
        Priority: 2
        Action:
          Block: {}
        Statement:
          SQLiMatchStatement:
            FieldToMatch:
              Body: {}
            TextTransformations:
              - Priority: 1
                Type: NONE
      # XSS protection
      - Name: XSSProtection
        Priority: 3
        Action:
          Block: {}
        Statement:
          XSSMatchStatement:
            FieldToMatch:
              Body: {}
            TextTransformations:
              - Priority: 1
                Type: NONE
```

---

## 🔑 11. Secrets Management

### AWS Migration: AWS Secrets Manager

**Configuration:**

```yaml
DatabaseSecret:
  Type: AWS::SecretsManager::Secret
  Properties:
    Name: mdreader/database
    Description: Database credentials for MDReader
    SecretString: !Sub |
      {
        "username": "${DBUsername}",
        "password": "${DBPassword}",
        "host": "${MDReaderDB.Endpoint.Address}",
        "port": "${MDReaderDB.Endpoint.Port}",
        "database": "mdreader"
      }

RedisSecret:
  Type: AWS::SecretsManager::Secret
  Properties:
    Name: mdreader/redis
    Description: Redis connection details
    SecretString: !Sub |
      {
        "url": "redis://${MDReaderRedis.PrimaryEndPoint.Address}:${MDReaderRedis.PrimaryEndPoint.Port}"
      }
```

---

## 💾 12. Backup & Recovery

### AWS Migration: AWS Backup

**Configuration:**

```yaml
MDReaderBackupPlan:
  Type: AWS::Backup::BackupPlan
  Properties:
    BackupPlan:
      BackupPlanName: MDReaderBackupPlan
      Rules:
        - RuleName: DailyBackup
          TargetBackupVault: !Ref MDReaderBackupVault
          ScheduleExpression: cron(0 5 ? * * *)  # Daily at 5 AM
          Lifecycle:
            DeleteAfterDays: 30
          CopyActions:
            - DestinationBackupVaultArn: !Ref MDReaderDRBackupVault
              Lifecycle:
                DeleteAfterDays: 365
        - RuleName: WeeklySnapshot
          TargetBackupVault: !Ref MDReaderBackupVault
          ScheduleExpression: cron(0 5 ? * SUN *)  # Sunday at 5 AM
          Lifecycle:
            DeleteAfterDays: 90

MDReaderBackupSelection:
  Type: AWS::Backup::BackupSelection
  Properties:
    BackupSelection:
      SelectionName: MDReaderResources
      IamRoleArn: !GetAtt MDReaderBackupRole.Arn
      Resources:
        - !GetAtt MDReaderDB.Arn
        - !GetAtt MDReaderRedis.Arn
        - !GetAtt MDReaderUploadsBucket.Arn
```

---

## 🚀 Deployment Configuration

### Infrastructure as Code

**Directory Structure:**
```
infrastructure/
├── templates/
│   ├── vpc.yml              # Networking
│   ├── security.yml         # Security groups, WAF
│   ├── database.yml         # RDS, ElastiCache
│   ├── backend.yml          # Lambda, API Gateway
│   ├── websocket.yml        # ECS, WebSocket API
│   ├── frontend.yml         # Amplify, CloudFront
│   ├── monitoring.yml       # CloudWatch, alarms
│   └── backup.yml           # AWS Backup
├── scripts/
│   ├── deploy.sh           # Deployment script
│   └── rollback.sh         # Rollback script
└── parameters/
    ├── dev.json            # Development parameters
    └── prod.json           # Production parameters
```

**Deployment Script:**
```bash
#!/bin/bash
# deploy.sh

set -e

ENVIRONMENT=${1:-dev}
STACK_NAME="mdreader-${ENVIRONMENT}"

echo "Deploying MDReader to ${ENVIRONMENT}..."

# Deploy VPC first
aws cloudformation deploy \
  --template-file infrastructure/templates/vpc.yml \
  --stack-name "${STACK_NAME}-vpc" \
  --parameter-overrides file://infrastructure/parameters/${ENVIRONMENT}.json

# Deploy security
aws cloudformation deploy \
  --template-file infrastructure/templates/security.yml \
  --stack-name "${STACK_NAME}-security" \
  --parameter-overrides file://infrastructure/parameters/${ENVIRONMENT}.json

# Deploy database
aws cloudformation deploy \
  --template-file infrastructure/templates/database.yml \
  --stack-name "${STACK_NAME}-database" \
  --parameter-overrides file://infrastructure/parameters/${ENVIRONMENT}.json

# Deploy backend
aws cloudformation deploy \
  --template-file infrastructure/templates/backend.yml \
  --stack-name "${STACK_NAME}-backend" \
  --parameter-overrides file://infrastructure/parameters/${ENVIRONMENT}.json

# Deploy WebSocket
aws cloudformation deploy \
  --template-file infrastructure/templates/websocket.yml \
  --stack-name "${STACK_NAME}-websocket" \
  --parameter-overrides file://infrastructure/parameters/${ENVIRONMENT}.json

# Deploy frontend
aws cloudformation deploy \
  --template-file infrastructure/templates/frontend.yml \
  --stack-name "${STACK_NAME}-frontend" \
  --parameter-overrides file://infrastructure/parameters/${ENVIRONMENT}.json

# Deploy monitoring
aws cloudformation deploy \
  --template-file infrastructure/templates/monitoring.yml \
  --stack-name "${STACK_NAME}-monitoring" \
  --parameter-overrides file://infrastructure/parameters/${ENVIRONMENT}.json

echo "Deployment complete!"
```

---

## 📈 Cost Optimization

### Reserved Instances
```yaml
# RDS Reserved Instance (1 year, partial upfront)
MDReaderRDSReservation:
  Type: AWS::EC2::CapacityReservation
  Properties:
    InstanceType: db.t3.micro
    InstancePlatform: Linux/UNIX
    AvailabilityZone: us-east-1a
    InstanceCount: 1
    EndDateType: limited
    EndDate: '2026-12-31'
```

### Auto Scaling
```yaml
# Lambda Provisioned Concurrency
MDReaderBackendConcurrency:
  Type: AWS::Lambda::Version
  Properties:
    FunctionName: !Ref MDReaderBackend
    ProvisionedConcurrencyConfig:
      ProvisionedConcurrentExecutions: 5

# ECS Auto Scaling
HocuspocusAutoScaling:
  Type: AWS::ApplicationAutoScaling::ScalableTarget
  Properties:
    ServiceNamespace: ecs
    ResourceId: service/mdreader-cluster/mdreader-hocuspocus
    ScalableDimension: ecs:service:DesiredCount
    MinCapacity: 1
    MaxCapacity: 10
    RoleARN: !GetAtt ECSAutoScalingRole.Arn

HocuspocusScalingPolicy:
  Type: AWS::ApplicationAutoScaling::ScalingPolicy
  Properties:
    PolicyName: HocuspocusTargetTracking
    PolicyType: TargetTrackingScaling
    ScalingTargetId: !Ref HocuspocusAutoScaling
    TargetTrackingScalingPolicyConfiguration:
      TargetValue: 70.0
      PredefinedMetricSpecification:
        PredefinedMetricType: ECSServiceAverageCPUUtilization
```

---

## 🔍 Monitoring Dashboard

### CloudWatch Dashboard Configuration

```json
{
  "widgets": [
    {
      "type": "metric",
      "properties": {
        "metrics": [
          ["AWS/Lambda", "Duration", "FunctionName", "MDReaderBackend", { "stat": "Average" }],
          ["AWS/Lambda", "Errors", "FunctionName", "MDReaderBackend", { "stat": "Sum" }]
        ],
        "title": "API Performance",
        "region": "us-east-1"
      }
    },
    {
      "type": "metric",
      "properties": {
        "metrics": [
          ["AWS/RDS", "DatabaseConnections", "DBInstanceIdentifier", "mdreader-prod", { "stat": "Maximum" }],
          ["AWS/RDS", "CPUUtilization", "DBInstanceIdentifier", "mdreader-prod", { "stat": "Average" }]
        ],
        "title": "Database Metrics",
        "region": "us-east-1"
      }
    },
    {
      "type": "metric",
      "properties": {
        "metrics": [
          ["AWS/ApiGateway", "Count", "ApiName", "MDReaderWebSocket", { "stat": "Sum" }],
          ["AWS/ApiGateway", "IntegrationLatency", "ApiName", "MDReaderWebSocket", { "stat": "Average" }]
        ],
        "title": "WebSocket Metrics",
        "region": "us-east-1"
      }
    }
  ]
}
```

---

**Last Updated**: December 31, 2025
**Version**: 1.0.0
**Author**: AI Assistant
