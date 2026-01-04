# 🚀 AWS Deployment Strategy for MDReader

**Complete CI/CD pipeline, infrastructure deployment, and operational procedures for production-ready MDReader.**

---

## 📋 Deployment Overview

**MDReader** deployment strategy focuses on:
- **Infrastructure as Code** (CloudFormation/SAM)
- **GitOps workflow** (GitHub Actions + AWS)
- **Blue-Green deployments** (zero-downtime)
- **Automated testing** (multi-environment)
- **Security-first** (least privilege, encrypted secrets)
- **Observability** (monitoring, logging, alerting)

---

## 🏗️ Infrastructure Deployment

### CloudFormation Stack Architecture

```mermaid
graph TD
    subgraph "Foundation Layer"
        VPC[VPC + Networking<br/>Subnets, Security Groups, NACLs]
        DNS[Route 53<br/>DNS Configuration]
    end

    subgraph "Data Layer"
        RDS[RDS PostgreSQL<br/>Database + Read Replica]
        Redis[ElastiCache Redis<br/>Caching + Sessions]
        S3[S3 Buckets<br/>File Storage + Backups]
    end

    subgraph "Application Layer"
        Cognito[Cognito<br/>Authentication]
        Lambda[Lambda + API Gateway<br/>Backend API]
        ECS[ECS Fargate<br/>WebSocket Server]
        Amplify[Amplify<br/>Frontend Hosting]
    end

    subgraph "Edge Layer"
        CloudFront[CloudFront<br/>CDN + WAF]
        GlobalAccelerator[Global Accelerator<br/>Optional Performance]
    end

    subgraph "Supporting Services"
        Monitoring[CloudWatch<br/>Logs + Metrics + Alarms]
        Backup[AWS Backup<br/>Automated Backups]
        Secrets[AWS Secrets Manager<br/>Secure Credentials]
    end

    VPC --> RDS
    VPC --> Redis
    VPC --> Lambda
    VPC --> ECS
    DNS --> CloudFront
    DNS --> Amplify
    Cognito --> Lambda
    S3 --> CloudFront
    Monitoring --> Lambda
    Monitoring --> ECS
    Monitoring --> RDS
    Backup --> RDS
    Backup --> S3
    Secrets --> Lambda
    Secrets --> ECS
```

### Stack Organization

**Stack Naming Convention:**
```
mdreader-{environment}-{component}-{region}
```

**Stack Dependencies:**
1. `mdreader-prod-foundation-us-east-1` (VPC, DNS)
2. `mdreader-prod-data-us-east-1` (RDS, Redis, S3)
3. `mdreader-prod-security-us-east-1` (Cognito, Secrets, WAF)
4. `mdreader-prod-application-us-east-1` (Lambda, ECS, API Gateway)
5. `mdreader-prod-edge-us-east-1` (CloudFront, Amplify)

---

## 🔄 CI/CD Pipeline

### GitHub Actions Workflow

```yaml
# .github/workflows/deploy.yml
name: Deploy MDReader to AWS

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]
  workflow_dispatch:
    inputs:
      environment:
        description: 'Target environment'
        required: true
        default: 'dev'
        type: choice
        options:
          - dev
          - staging
          - prod

env:
  AWS_REGION: us-east-1
  NODE_VERSION: '18'
  PYTHON_VERSION: '3.11'

jobs:
  # =========================================
  # Frontend Testing and Build
  # =========================================
  test-frontend:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'
          cache-dependency-path: frontend/package-lock.json

      - name: Install dependencies
        run: |
          cd frontend
          npm ci

      - name: Type checking
        run: |
          cd frontend
          npm run type-check

      - name: Run tests
        run: |
          cd frontend
          npm run test:ci

      - name: Build frontend
        run: |
          cd frontend
          npm run build
        env:
          VITE_API_URL: ${{ secrets.VITE_API_URL }}
          VITE_WS_URL: ${{ secrets.VITE_WS_URL }}
          VITE_COGNITO_USER_POOL_ID: ${{ secrets.VITE_COGNITO_USER_POOL_ID }}
          VITE_COGNITO_CLIENT_ID: ${{ secrets.VITE_COGNITO_CLIENT_ID }}

      - name: Upload frontend build
        uses: actions/upload-artifact@v4
        with:
          name: frontend-build
          path: frontend/dist/
          retention-days: 1

  # =========================================
  # Backend Testing and Build
  # =========================================
  test-backend:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_USER: test
          POSTGRES_PASSWORD: test
          POSTGRES_DB: test
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 5432:5432

      redis:
        image: redis:7
        ports:
          - 6379:6379

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Python
        uses: actions/setup-python@v4
        with:
          python-version: ${{ env.PYTHON_VERSION }}

      - name: Cache pip dependencies
        uses: actions/cache@v3
        with:
          path: ~/.cache/pip
          key: ${{ runner.os }}-pip-${{ hashFiles('backendv2/requirements.txt') }}
          restore-keys: |
            ${{ runner.os }}-pip-

      - name: Install dependencies
        run: |
          cd backendv2
          pip install -r requirements.txt

      - name: Run backend tests
        run: |
          cd backendv2
          pytest --cov=app --cov-report=xml --cov-report=html
        env:
          DATABASE_URL: postgresql+asyncpg://test:test@localhost:5432/test
          REDIS_URL: redis://localhost:6379/0
          SECRET_KEY: test-secret-key-for-testing-only

      - name: Upload coverage reports
        uses: codecov/codecov-action@v3
        with:
          file: ./backendv2/coverage.xml
          flags: backend

      - name: Build Lambda package
        run: |
          cd backendv2
          sam build --template template.yml

      - name: Upload backend build
        uses: actions/upload-artifact@v4
        with:
          name: backend-build
          path: backendv2/.aws-sam/build/
          retention-days: 1

  # =========================================
  # Infrastructure Testing
  # =========================================
  test-infrastructure:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Terraform (if using Terraform)
        uses: hashicorp/setup-terraform@v3
        if: contains(matrix.tool, 'terraform')

      - name: Validate CloudFormation templates
        run: |
          find infrastructure/templates -name "*.yml" -o -name "*.yaml" | xargs -I {} aws cloudformation validate-template --template-body file://{}

      - name: Checkov security scan
        uses: bridgecrewio/checkov-action@v12
        with:
          file: infrastructure/
          framework: cloudformation
          output_format: cli
          output_file_path: console,checkov_results.txt

      - name: Upload security scan results
        uses: actions/upload-artifact@v4
        with:
          name: security-scan-results
          path: checkov_results.txt
          retention-days: 30

  # =========================================
  # Deploy to Development
  # =========================================
  deploy-dev:
    needs: [test-frontend, test-backend, test-infrastructure]
    if: github.ref == 'refs/heads/develop' || github.event_name == 'workflow_dispatch'
    runs-on: ubuntu-latest
    environment: development
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Download build artifacts
        uses: actions/download-artifact@v4
        with:
          name: frontend-build
          path: frontend/dist/

      - name: Download backend build
        uses: actions/download-artifact@v4
        with:
          name: backend-build
          path: backendv2/.aws-sam/build/

      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v4
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID_DEV }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY_DEV }}
          aws-region: ${{ env.AWS_REGION }}

      - name: Deploy infrastructure
        run: |
          make deploy-infrastructure ENVIRONMENT=dev

      - name: Deploy backend
        run: |
          make deploy-backend ENVIRONMENT=dev

      - name: Deploy frontend
        run: |
          make deploy-frontend ENVIRONMENT=dev

      - name: Run integration tests
        run: |
          make test-integration ENVIRONMENT=dev

      - name: Notify deployment
        uses: 8398a7/action-slack@v3
        if: always()
        with:
          status: ${{ job.status }}
          text: "MDReader Dev deployment ${{ job.status }}"
        env:
          SLACK_WEBHOOK_URL: ${{ secrets.SLACK_WEBHOOK_URL }}

  # =========================================
  # Deploy to Staging
  # =========================================
  deploy-staging:
    needs: [test-frontend, test-backend, test-infrastructure]
    if: github.ref == 'refs/heads/main' && github.event_name != 'pull_request'
    runs-on: ubuntu-latest
    environment: staging
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Download build artifacts
        uses: actions/download-artifact@v4
        with:
          name: frontend-build
          path: frontend/dist/

      - name: Download backend build
        uses: actions/download-artifact@v4
        with:
          name: backend-build
          path: backendv2/.aws-sam/build/

      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v4
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID_STAGING }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY_STAGING }}
          aws-region: ${{ env.AWS_REGION }}

      - name: Deploy infrastructure
        run: |
          make deploy-infrastructure ENVIRONMENT=staging

      - name: Deploy backend
        run: |
          make deploy-backend ENVIRONMENT=staging

      - name: Deploy frontend
        run: |
          make deploy-frontend ENVIRONMENT=staging

      - name: Run E2E tests
        run: |
          make test-e2e ENVIRONMENT=staging

      - name: Performance tests
        run: |
          make test-performance ENVIRONMENT=staging

      - name: Security scan
        run: |
          make security-scan ENVIRONMENT=staging

      - name: Notify deployment
        uses: 8398a7/action-slack@v3
        if: always()
        with:
          status: ${{ job.status }}
          text: "MDReader Staging deployment ${{ job.status }}"
        env:
          SLACK_WEBHOOK_URL: ${{ secrets.SLACK_WEBHOOK_URL }}

  # =========================================
  # Deploy to Production (Manual Approval)
  # =========================================
  deploy-prod:
    needs: [deploy-staging]
    if: github.ref == 'refs/heads/main' && github.event_name == 'push'
    runs-on: ubuntu-latest
    environment: production
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Download build artifacts
        uses: actions/download-artifact@v4
        with:
          name: frontend-build
          path: frontend/dist/

      - name: Download backend build
        uses: actions/download-artifact@v4
        with:
          name: backend-build
          path: backendv2/.aws-sam/build/

      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v4
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID_PROD }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY_PROD }}
          aws-region: ${{ env.AWS_REGION }}

      - name: Manual approval
        uses: trstringer/manual-approval@v1
        with:
          secret: ${{ secrets.MANUAL_APPROVAL_TOKEN }}
          approvers: user1,user2,user3
          minimum-approvals: 2
          issue-title: "Deploy MDReader to Production"
          issue-body: "Please review and approve production deployment"
          exclude-workflow-initiator-as-approver: true

      - name: Blue-Green deployment
        run: |
          # Create new production environment
          make deploy-blue ENVIRONMENT=prod

          # Run smoke tests on blue environment
          make test-smoke ENVIRONMENT=prod-blue

          # Switch traffic to blue environment
          make switch-to-blue ENVIRONMENT=prod

          # Keep green environment as rollback option
          # Terminate green environment after successful monitoring period

      - name: Notify deployment
        uses: 8398a7/action-slack@v3
        if: always()
        with:
          status: ${{ job.status }}
          text: "MDReader Production deployment ${{ job.status }}"
        env:
          SLACK_WEBHOOK_URL: ${{ secrets.SLACK_WEBHOOK_URL }}
          SLACK_CHANNEL: "#production-deployments"
```

### Makefile for Deployment Tasks

```makefile
# Makefile for MDReader deployment
.PHONY: help deploy-infrastructure deploy-backend deploy-frontend test-integration test-e2e test-performance security-scan deploy-blue switch-to-blue

# Environment variables
ENVIRONMENT ?= dev
AWS_REGION ?= us-east-1
STACK_PREFIX ?= mdreader-$(ENVIRONMENT)

help:
	@echo "Available commands:"
	@echo "  deploy-infrastructure  Deploy infrastructure with CloudFormation"
	@echo "  deploy-backend         Deploy backend with SAM"
	@echo "  deploy-frontend        Deploy frontend with Amplify"
	@echo "  test-integration       Run integration tests"
	@echo "  test-e2e              Run end-to-end tests"
	@echo "  test-performance      Run performance tests"
	@echo "  security-scan         Run security scanning"
	@echo "  deploy-blue          Deploy to blue environment"
	@echo "  switch-to-blue       Switch traffic to blue environment"

deploy-infrastructure:
	@echo "Deploying infrastructure for $(ENVIRONMENT)..."
	@aws cloudformation deploy \
		--template-file infrastructure/templates/foundation.yml \
		--stack-name $(STACK_PREFIX)-foundation \
		--parameter-overrides Environment=$(ENVIRONMENT) \
		--capabilities CAPABILITY_IAM CAPABILITY_NAMED_IAM \
		--no-fail-on-empty-changeset

	@aws cloudformation deploy \
		--template-file infrastructure/templates/data.yml \
		--stack-name $(STACK_PREFIX)-data \
		--parameter-overrides Environment=$(ENVIRONMENT) \
		--capabilities CAPABILITY_IAM CAPABILITY_NAMED_IAM \
		--no-fail-on-empty-changeset

	@aws cloudformation deploy \
		--template-file infrastructure/templates/security.yml \
		--stack-name $(STACK_PREFIX)-security \
		--parameter-overrides Environment=$(ENVIRONMENT) \
		--capabilities CAPABILITY_IAM CAPABILITY_NAMED_IAM \
		--no-fail-on-empty-changeset

deploy-backend:
	@echo "Deploying backend for $(ENVIRONMENT)..."
	@cd backendv2 && \
	sam deploy \
		--template-file .aws-sam/build/template.yaml \
		--stack-name $(STACK_PREFIX)-backend \
		--parameter-overrides Environment=$(ENVIRONMENT) \
		--capabilities CAPABILITY_IAM CAPABILITY_NAMED_IAM \
		--no-confirm-changeset

deploy-frontend:
	@echo "Deploying frontend for $(ENVIRONMENT)..."
	@aws amplify create-deployment \
		--app-id $(shell aws amplify list-apps --query "apps[?name=='MDReaderWeb'].appId" --output text) \
		--branch-name $(ENVIRONMENT) \
		--source-dir frontend/dist

test-integration:
	@echo "Running integration tests for $(ENVIRONMENT)..."
	@npm run test:integration -- --env=$(ENVIRONMENT)

test-e2e:
	@echo "Running E2E tests for $(ENVIRONMENT)..."
	@npx playwright test --config=e2e/playwright.config.ts

test-performance:
	@echo "Running performance tests for $(ENVIRONMENT)..."
	@npx artillery run performance-tests.yml --environment=$(ENVIRONMENT)

security-scan:
	@echo "Running security scan for $(ENVIRONMENT)..."
	@docker run --rm \
		-v $(PWD):/app \
		owasp/zap2docker-stable zap-baseline.py \
		-t https://api-$(ENVIRONMENT).mdreader.com \
		-r security-report.html

deploy-blue:
	@echo "Deploying to blue environment for $(ENVIRONMENT)..."
	@aws cloudformation deploy \
		--template-file infrastructure/templates/application-blue.yml \
		--stack-name $(STACK_PREFIX)-application-blue \
		--parameter-overrides Environment=$(ENVIRONMENT) \
		--capabilities CAPABILITY_IAM CAPABILITY_NAMED_IAM \
		--no-fail-on-empty-changeset

switch-to-blue:
	@echo "Switching traffic to blue environment for $(ENVIRONMENT)..."
	@aws cloudformation deploy \
		--template-file infrastructure/templates/routing.yml \
		--stack-name $(STACK_PREFIX)-routing \
		--parameter-overrides Environment=$(ENVIRONMENT) ActiveEnvironment=blue \
		--capabilities CAPABILITY_IAM CAPABILITY_NAMED_IAM \
		--no-fail-on-empty-changeset
```

---

## 🔵 Blue-Green Deployment

### Architecture

```mermaid
graph TD
    subgraph "Load Balancer"
        ALB[Application Load Balancer]
    end

    subgraph "Blue Environment (Active)"
        BlueLambda[λ Blue Backend]
        BlueECS[🐳 Blue Hocuspocus]
        BlueRDS[(📊 Blue RDS<br/>Read Replica)]
    end

    subgraph "Green Environment (Standby)"
        GreenLambda[λ Green Backend]
        GreenECS[🐳 Green Hocuspocus]
        GreenRDS[(📊 Green RDS<br/>Read Replica)]
    end

    subgraph "Shared Resources"
        PrimaryRDS[(🗄️ Primary RDS)]
        Redis[(⚡ Redis)]
        S3[(📦 S3)]
    end

    ALB --> BlueLambda
    ALB --> BlueECS
    ALB -. standby .-> GreenLambda
    ALB -. standby .-> GreenECS

    BlueLambda --> PrimaryRDS
    BlueECS --> PrimaryRDS
    GreenLambda --> PrimaryRDS
    GreenECS --> PrimaryRDS

    BlueLambda --> Redis
    BlueECS --> Redis
    GreenLambda --> Redis
    GreenECS --> Redis

    BlueLambda --> S3
    GreenLambda --> S3
```

### Blue-Green Process

**Phase 1: Deploy Green Environment**
```bash
# Deploy green environment alongside blue
make deploy-blue ENVIRONMENT=prod

# Run tests on green environment
make test-smoke ENVIRONMENT=prod-blue
```

**Phase 2: Traffic Switching**
```bash
# Update Route 53 weighted routing
aws route53 change-resource-record-sets \
  --hosted-zone-id Z123456789 \
  --change-batch '{
    "Changes": [{
      "Action": "UPSERT",
      "ResourceRecordSet": {
        "Name": "api.mdreader.com",
        "Type": "CNAME",
        "SetIdentifier": "blue",
        "Weight": 0,
        "AliasTarget": {
          "DNSName": "blue-alb-123456789.us-east-1.elb.amazonaws.com",
          "EvaluateTargetHealth": true
        }
      }
    }, {
      "Action": "UPSERT",
      "ResourceRecordSet": {
        "Name": "api.mdreader.com",
        "Type": "CNAME",
        "SetIdentifier": "green",
        "Weight": 100,
        "AliasTarget": {
          "DNSName": "green-alb-123456789.us-east-1.elb.amazonaws.com",
          "EvaluateTargetHealth": true
        }
      }
    }]
  }'
```

**Phase 3: Monitoring & Validation**
```bash
# Monitor traffic shift
watch -n 30 aws cloudwatch get-metric-statistics \
  --namespace AWS/ELB \
  --metric-name RequestCount \
  --dimensions Name=LoadBalancer,Value=green-alb \
  --start-time $(date -u +%Y-%m-%dT%H:%M:%S -d '5 minutes ago') \
  --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
  --period 60 \
  --statistics Sum
```

**Phase 4: Cleanup**
```bash
# Terminate blue environment after successful monitoring
aws cloudformation delete-stack --stack-name mdreader-prod-application-blue
```

---

## 🧪 Testing Strategy

### Test Types and Environments

| Test Type | Environment | Trigger | Duration | Success Criteria |
|-----------|-------------|---------|----------|------------------|
| **Unit Tests** | Local/CI | Every commit | < 5 min | 80% coverage |
| **Integration** | Dev | Every PR | < 15 min | All APIs functional |
| **E2E** | Staging | Every merge to main | < 30 min | Critical user flows |
| **Performance** | Staging | Every merge to main | < 10 min | < 500ms response |
| **Security** | Staging | Every merge to main | < 20 min | No high/crit issues |
| **Smoke** | Prod Blue | Every deployment | < 5 min | Basic functionality |

### Integration Test Suite

```python
# tests/integration/test_api_flows.py
import pytest
import httpx
from typing import Dict, Any

class TestAPIFlows:
    """Test complete API flows end-to-end"""

    @pytest.mark.asyncio
    async def test_user_registration_flow(self, client: httpx.AsyncClient):
        """Test complete user registration and login flow"""
        # Register user
        register_data = {
            "email": "test@example.com",
            "username": "testuser",
            "password": "SecurePass123!",
            "full_name": "Test User"
        }

        response = await client.post("/api/v1/auth/register", json=register_data)
        assert response.status_code == 201

        user_data = response.json()
        assert "user" in user_data
        assert "access_token" in user_data

        # Login with registered user
        login_data = {
            "email": "test@example.com",
            "password": "SecurePass123!"
        }

        response = await client.post("/api/v1/auth/login", json=login_data)
        assert response.status_code == 200

        login_data = response.json()
        assert "access_token" in login_data

        # Access protected endpoint
        headers = {"Authorization": f"Bearer {login_data['access_token']}"}
        response = await client.get("/api/v1/auth/me", headers=headers)
        assert response.status_code == 200

    @pytest.mark.asyncio
    async def test_document_workflow(self, authenticated_client: httpx.AsyncClient, auth_headers: Dict[str, str]):
        """Test complete document creation and editing workflow"""
        # Create workspace
        workspace_data = {
            "name": "Test Workspace",
            "description": "Integration test workspace"
        }

        response = await authenticated_client.post(
            "/api/v1/workspaces",
            json=workspace_data,
            headers=auth_headers
        )
        assert response.status_code == 201

        workspace = response.json()
        workspace_id = workspace["id"]

        # Create document
        document_data = {
            "title": "Test Document",
            "content": "# Hello World\n\nThis is a test document.",
            "workspace_id": workspace_id
        }

        response = await authenticated_client.post(
            "/api/v1/documents",
            json=document_data,
            headers=auth_headers
        )
        assert response.status_code == 201

        document = response.json()
        document_id = document["id"]

        # Update document
        update_data = {
            "content": "# Hello World\n\nThis is an updated test document."
        }

        response = await authenticated_client.put(
            f"/api/v1/documents/{document_id}",
            json=update_data,
            headers=auth_headers
        )
        assert response.status_code == 200

        # Get document
        response = await authenticated_client.get(
            f"/api/v1/documents/{document_id}",
            headers=auth_headers
        )
        assert response.status_code == 200

        retrieved_doc = response.json()
        assert retrieved_doc["content"] == update_data["content"]

        # Delete document
        response = await authenticated_client.delete(
            f"/api/v1/documents/{document_id}",
            headers=auth_headers
        )
        assert response.status_code == 204
```

### Performance Test Configuration

```yaml
# performance-tests.yml (Artillery)
config:
  target: "https://api-staging.mdreader.com"
  phases:
    - duration: 60
      arrivalRate: 5
      name: "Warm up"
    - duration: 300
      arrivalRate: 20
      name: "Load testing"
    - duration: 60
      arrivalRate: 50
      name: "Stress testing"
  defaults:
    headers:
      Content-Type: "application/json"

scenarios:
  - name: "User registration and login"
    weight: 10
    flow:
      - post:
          url: "/api/v1/auth/register"
          json:
            email: "user_{{ $randomInt }}@example.com"
            username: "user_{{ $randomInt }}"
            password: "SecurePass123!"
            full_name: "Test User"
      - post:
          url: "/api/v1/auth/login"
          json:
            email: "{{ email }}"
            password: "SecurePass123!"
          capture:
            json: "$.access_token"
            as: "token"
      - get:
          url: "/api/v1/auth/me"
          headers:
            Authorization: "Bearer {{ token }}"

  - name: "Document operations"
    weight: 30
    flow:
      - post:
          url: "/api/v1/auth/login"
          json:
            email: "perf-test@example.com"
            password: "SecurePass123!"
          capture:
            json: "$.access_token"
            as: "token"
      - post:
          url: "/api/v1/documents"
          headers:
            Authorization: "Bearer {{ token }}"
          json:
            title: "Performance Test Doc"
            content: "# Performance Test\n\n{{ $randomString }}"
            workspace_id: "550e8400-e29b-41d4-a716-446655440000"
          capture:
            json: "$.id"
            as: "doc_id"
      - put:
          url: "/api/v1/documents/{{ doc_id }}"
          headers:
            Authorization: "Bearer {{ token }}"
          json:
            content: "# Updated Performance Test\n\n{{ $randomString }}"
      - get:
          url: "/api/v1/documents/{{ doc_id }}"
          headers:
            Authorization: "Bearer {{ token }}"
```

---

## 📊 Monitoring and Observability

### CloudWatch Dashboards

```yaml
# Infrastructure monitoring dashboard
MDReaderDashboard:
  Type: AWS::CloudWatch::Dashboard
  Properties:
    DashboardName: MDReader-Production
    DashboardBody: !Sub |
      {
        "widgets": [
          {
            "type": "metric",
            "properties": {
              "metrics": [
                ["AWS/Lambda", "Duration", "FunctionName", "MDReaderBackend", { "stat": "Average" }],
                ["AWS/Lambda", "Errors", "FunctionName", "MDReaderBackend", { "stat": "Sum" }],
                ["AWS/Lambda", "Throttles", "FunctionName", "MDReaderBackend", { "stat": "Sum" }]
              ],
              "title": "API Performance",
              "region": "${AWS::Region}"
            }
          },
          {
            "type": "metric",
            "properties": {
              "metrics": [
                ["AWS/RDS", "DatabaseConnections", "DBInstanceIdentifier", "mdreader-prod", { "stat": "Maximum" }],
                ["AWS/RDS", "CPUUtilization", "DBInstanceIdentifier", "mdreader-prod", { "stat": "Average" }],
                ["AWS/RDS", "ReadLatency", "DBInstanceIdentifier", "mdreader-prod", { "stat": "Average" }]
              ],
              "title": "Database Performance",
              "region": "${AWS::Region}"
            }
          },
          {
            "type": "metric",
            "properties": {
              "metrics": [
                ["AWS/ApiGateway", "Count", "ApiName", "MDReaderWebSocket", { "stat": "Sum" }],
                ["AWS/ApiGateway", "IntegrationLatency", "ApiName", "MDReaderWebSocket", { "stat": "Average" }],
                ["AWS/ApiGateway", "ConnectCount", "ApiName", "MDReaderWebSocket", { "stat": "Maximum" }]
              ],
              "title": "WebSocket Performance",
              "region": "${AWS::Region}"
            }
          },
          {
            "type": "log",
            "properties": {
              "logGroupNames": ["/aws/lambda/mdreader-backend", "/aws/ecs/mdreader-hocuspocus"],
              "title": "Application Logs",
              "region": "${AWS::Region}",
              "query": "fields @timestamp, @message | sort @timestamp desc | limit 100"
            }
          }
        ]
      }
```

### Alerting Strategy

```yaml
# Critical alerts (immediate response)
APILatencyCritical:
  Type: AWS::CloudWatch::Alarm
  Properties:
    AlarmName: MDReader-API-Latency-Critical
    ComparisonOperator: GreaterThanThreshold
    EvaluationPeriods: 2
    MetricName: Duration
    Namespace: AWS/Lambda
    Period: 300
    Statistic: Average
    Threshold: 10000  # 10 seconds
    AlarmActions:
      - !Ref CriticalAlertTopic

DatabaseConnectionCritical:
  Type: AWS::CloudWatch::Alarm
  Properties:
    AlarmName: MDReader-DB-Connections-Critical
    ComparisonOperator: GreaterThanThreshold
    EvaluationPeriods: 1
    MetricName: DatabaseConnections
    Namespace: AWS/RDS
    Period: 300
    Statistic: Maximum
    Threshold: 90  # 90% of max connections
    AlarmActions:
      - !Ref CriticalAlertTopic

# Warning alerts (investigate within 1 hour)
APILatencyWarning:
  Type: AWS::CloudWatch::Alarm
  Properties:
    AlarmName: MDReader-API-Latency-Warning
    ComparisonOperator: GreaterThanThreshold
    EvaluationPeriods: 3
    MetricName: Duration
    Namespace: AWS/Lambda
    Period: 300
    Statistic: Average
    Threshold: 2000  # 2 seconds
    AlarmActions:
      - !Ref WarningAlertTopic

ErrorRateWarning:
  Type: AWS::CloudWatch::Alarm
  Properties:
    AlarmName: MDReader-API-Error-Rate
    ComparisonOperator: GreaterThanThreshold
    EvaluationPeriods: 5
    Metrics:
      - Expression: "SEARCH('{AWS/Lambda,FunctionName} MetricName=\"Errors\"', 'Sum', 300)"
      - Expression: "SEARCH('{AWS/Lambda,FunctionName} MetricName=\"Invocations\"', 'Sum', 300)"
      - Expression: "(m1 / m2) * 100"
    Threshold: 5  # 5% error rate
    AlarmActions:
      - !Ref WarningAlertTopic
```

---

## 🔒 Security in Deployment

### Secrets Management

```yaml
# AWS Secrets Manager configuration
DatabaseSecrets:
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
    KmsKeyId: !Ref DatabaseEncryptionKey

CognitoSecrets:
  Type: AWS::SecretsManager::Secret
  Properties:
    Name: mdreader/cognito
    Description: Cognito configuration
    SecretString: !Sub |
      {
        "user_pool_id": "${MDReaderUserPool}",
        "client_id": "${MDReaderWebClient}",
        "client_secret": "${MDReaderWebClientSecret}"
      }

# IAM roles with least privilege
LambdaExecutionRole:
  Type: AWS::IAM::Role
  Properties:
    RoleName: MDReaderLambdaExecutionRole
    AssumeRolePolicyDocument:
      Version: '2012-10-17'
      Statement:
        - Effect: Allow
          Principal:
            Service: lambda.amazonaws.com
          Action: sts:AssumeRole
    ManagedPolicyArns:
      - arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole
      - arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole
    Policies:
      - PolicyName: MDReaderLambdaPolicy
        PolicyDocument:
          Version: '2012-10-17'
          Statement:
            - Effect: Allow
              Action:
                - rds-db:connect
                - secretsmanager:GetSecretValue
                - s3:GetObject
                - s3:PutObject
                - s3:DeleteObject
                - logs:CreateLogGroup
                - logs:CreateLogStream
                - logs:PutLogEvents
              Resource: '*'
            - Effect: Allow
              Action:
                - cognito-idp:AdminGetUser
                - cognito-idp:AdminCreateUser
                - cognito-idp:AdminUpdateUserAttributes
              Resource: !GetAtt MDReaderUserPool.Arn
```

### Security Scanning

```yaml
# Security scanning in CI/CD
security-scan:
  runs-on: ubuntu-latest
  steps:
    - name: Checkout code
      uses: actions/checkout@v4

    - name: Run Trivy vulnerability scanner
      uses: aquasecurity/trivy-action@master
      with:
        scan-type: 'fs'
        scan-ref: '.'
        format: 'sarif'
        output: 'trivy-results.sarif'

    - name: Upload Trivy scan results
      uses: github/codeql-action/upload-sarif@v2
      if: always()
      with:
        sarif_file: 'trivy-results.sarif'

    - name: Run Snyk for dependency scanning
      uses: snyk/actions/python@master
      env:
        SNYK_TOKEN: ${{ secrets.SNYK_TOKEN }}
      with:
        args: --file=backendv2/requirements.txt

    - name: Run Snyk for JavaScript
      uses: snyk/actions/node@master
      env:
        SNYK_TOKEN: ${{ secrets.SNYK_TOKEN }}
      with:
        args: --file=frontend/package.json
```

---

## 🚨 Incident Response

### Runbooks

**API Latency Incident:**
1. Check CloudWatch metrics for Lambda duration
2. Review recent deployments
3. Check RDS performance metrics
4. Scale Lambda provisioned concurrency if needed
5. Rollback deployment if caused by code changes

**Database Connection Issues:**
1. Check RDS connection count vs limits
2. Review application connection pooling
3. Check for connection leaks
4. Scale RDS instance if needed
5. Restart application if necessary

**WebSocket Connection Problems:**
1. Check ECS service health
2. Review ECS task logs
3. Monitor WebSocket connection count
4. Check API Gateway WebSocket metrics
5. Scale ECS service if needed

### Rollback Procedures

```bash
# Quick rollback script
#!/bin/bash

ENVIRONMENT=$1
STACK_PREFIX="mdreader-${ENVIRONMENT}"

echo "Rolling back ${ENVIRONMENT} environment..."

# Get previous successful deployment
PREVIOUS_VERSION=$(aws cloudformation list-stack-sets \
  --stack-set-name "${STACK_PREFIX}-application" \
  --query 'Summaries[?Status==`ACTIVE`].StackSetId' \
  --output text | head -n 1)

# Deploy previous version
aws cloudformation deploy \
  --template-file infrastructure/templates/application.yml \
  --stack-name "${STACK_PREFIX}-application-rollback" \
  --parameter-overrides "Version=${PREVIOUS_VERSION}" \
  --capabilities CAPABILITY_IAM CAPABILITY_NAMED_IAM

# Switch traffic to rollback deployment
make switch-to-blue ENVIRONMENT="${ENVIRONMENT}-rollback"

# Monitor health
echo "Monitoring rollback health..."
sleep 300

# Check if rollback successful
HEALTH_CHECK=$(curl -s https://api-${ENVIRONMENT}.mdreader.com/health)
if [[ $HEALTH_CHECK == *"healthy"* ]]; then
  echo "Rollback successful"
  # Clean up old deployment
  aws cloudformation delete-stack --stack-name "${STACK_PREFIX}-application"
else
  echo "Rollback failed, manual intervention required"
  exit 1
fi
```

---

## 📋 Deployment Checklist

### Pre-Deployment
- [ ] Code review completed
- [ ] Tests passing (unit, integration, e2e)
- [ ] Security scan passed
- [ ] Performance benchmarks met
- [ ] Infrastructure changes reviewed
- [ ] Rollback plan documented
- [ ] Communication plan ready

### Deployment
- [ ] Environment variables configured
- [ ] Secrets updated in AWS Secrets Manager
- [ ] Database migrations applied
- [ ] CDN cache invalidated (if needed)
- [ ] DNS TTL considered for traffic switching
- [ ] Monitoring dashboards updated
- [ ] Alert thresholds adjusted

### Post-Deployment
- [ ] Smoke tests passed
- [ ] Performance metrics normal
- [ ] Error rates within acceptable limits
- [ ] User feedback monitored
- [ ] Runbooks updated
- [ ] Incident response tested

### Maintenance
- [ ] Log rotation configured
- [ ] Backup verification scheduled
- [ ] Cost optimization reviewed monthly
- [ ] Security patches applied promptly
- [ ] Performance monitoring active

---

**Last Updated**: December 31, 2025
**Version**: 1.0.0
**Author**: AI Assistant
