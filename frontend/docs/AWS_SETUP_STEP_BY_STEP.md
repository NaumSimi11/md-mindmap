# 🚀 AWS Setup - Step-by-Step Guide

**Complete guide to set up AWS account and all services needed for the backend.**

---

## 📋 **PHASE 1: CREATE AWS ACCOUNT**

### **Step 1: Sign Up for AWS**

1. **Go to**: https://aws.amazon.com/
2. **Click**: "Create an AWS Account" (top right)
3. **Enter**:
   - Email address
   - Password
   - Account name (e.g., "mdreader-production")
4. **Verify** email
5. **Enter payment** info (credit card required, but free tier won't charge)
6. **Verify phone** number (SMS or call)
7. **Choose support plan**: Basic (Free) ✅

**⚠️ Important**: AWS Free Tier gives you:
- 750 hours/month of EC2, RDS (free for 12 months)
- 5 GB S3 storage (free forever)
- 50,000 Cognito MAU (free forever)
- And more!

**Time**: 10-15 minutes

---

## 📋 **PHASE 2: CONFIGURE AWS CONSOLE**

### **Step 2: Set Up Root User Security**

1. **Login** to AWS Console: https://console.aws.amazon.com/
2. **Go to**: IAM (Identity and Access Management)
3. **Enable MFA** for root user:
   - Click your account name (top right)
   - Security credentials
   - Enable MFA → Choose "Virtual MFA device"
   - Scan QR code with authenticator app (Google Authenticator, Authy)
   - Enter 2 codes → Done ✅

**Why**: Security best practice (protects your account)

---

### **Step 3: Create IAM User (Don't Use Root!)**

1. **Go to**: IAM → Users
2. **Click**: "Create user"
3. **Username**: `mdreader-admin`
4. **Access type**: 
   - ✅ Programmatic access (for CLI/API) ← **IMPORTANT!**
   - ✅ AWS Management Console access
5. **Set permissions**: 
   - Attach policies: `AdministratorAccess` (for now, we'll restrict later)
6. **Review** → Create user

**⚠️ CRITICAL**: After creating the user, you'll see a screen with:
- **Console sign-in URL** (for web login)
- **Console password** (for web login)
- **BUT NO ACCESS KEYS YET!**

**The Access Keys are shown on the NEXT screen!** Click "Next" or look for "Access keys" section.

7. **Save Access Keys** (should appear automatically):
   - Access Key ID: `AKIA...`
   - Secret Access Key: `...` (show once only!)
   - **DOWNLOAD CSV** or copy to password manager ✅

**If you don't see Access Keys:**
- Go to IAM → Users → `mdreader-admin`
- Click "Security credentials" tab
- Scroll to "Access keys" section
- Click "Create access key"
   - Use case: "Command Line Interface (CLI)"
   - Click "Next" → "Create access key"
   - **COPY BOTH** Access Key ID and Secret Access Key
   - **DOWNLOAD CSV** (this is your only chance!)

**⚠️ Important**: Save these credentials securely! You'll need them for CLI/API access.

---

### **Step 4: Install AWS CLI**

**macOS (Homebrew):**
```bash
brew install awscli
```

**Linux:**
```bash
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
unzip awscliv2.zip
sudo ./aws/install
```

**Windows:**
Download: https://awscli.amazonaws.com/AWSCLIV2.msi

**Configure:**
```bash
aws configure
```
Enter:
- AWS Access Key ID: (from Step 3)
- AWS Secret Access Key: (from Step 3)
- Default region: `us-east-1` (or your choice)
- Default output format: `json`

**Test:**
```bash
aws sts get-caller-identity
```
Should return your user info ✅

---

## 📋 **PHASE 3: SET UP NETWORK (VPC)**

### **Step 5: Create VPC**

1. **Go to**: VPC (Virtual Private Cloud) → Your VPCs
2. **Click**: "Create VPC"
3. **Settings**:
   - Name: `mdreader-vpc`
   - IPv4 CIDR: `10.0.0.0/16`
   - IPv6: No IPv6 CIDR block
   - Tenancy: Default
4. **Click**: "Create VPC" ✅

**Result**: You'll have a VPC with:
- 1 VPC
- 1 Internet Gateway
- 1 Route Table
- 1 Network ACL
- 1 Security Group

---

### **Step 6: Create Subnets**

**⚠️ IMPORTANT**: You might see existing subnets (e.g., `172.31.x.x`). These are from AWS's **default VPC**. 

**You need NEW subnets in your `mdreader-vpc` (10.0.0.0/16)!**

**🔍 FIRST: Check Existing Subnets**
1. **Go to**: VPC → Subnets
2. **Filter by VPC**: Select `mdreader-vpc` from the filter dropdown
3. **Check**: What subnets already exist in `mdreader-vpc`?
   - If you see subnets with `10.0.x.x`, note their CIDR ranges
   - We need to avoid conflicts!

**Public Subnet 1 (for ALB):**
1. **Go to**: VPC → Subnets
2. **Click**: "Create subnet"
3. **Settings**:
   - **VPC**: Select `mdreader-vpc` ⚠️ **NOT the default VPC!**
   - Subnet name: `mdreader-public-1`
   - Availability Zone: `eu-north-1a` (or your region's first AZ)
   - IPv4 CIDR: `10.0.1.0/24`
4. **Click**: "Create subnet"

**⚠️ If you get "CIDR conflicts" error:**
- Check what subnets already exist in `mdreader-vpc`
- Use alternative CIDR ranges (see below)

**Public Subnet 2 (for high availability):**
- Repeat "Create subnet":
  - VPC: `mdreader-vpc`
  - Name: `mdreader-public-2`
  - AZ: `eu-north-1b` (or your region's second AZ)
  - CIDR: `10.0.2.0/24`

**Private Subnet 1 (for RDS):**
- Repeat "Create subnet":
  - VPC: `mdreader-vpc`
  - Name: `mdreader-private-1`
  - AZ: `eu-north-1a`
  - CIDR: `10.0.10.0/24`

**Private Subnet 2:**
- Repeat "Create subnet":
  - VPC: `mdreader-vpc`
  - Name: `mdreader-private-2`
  - AZ: `eu-north-1b`
  - CIDR: `10.0.11.0/24`

**✅ Result**: You should now have **4 new subnets** in `mdreader-vpc`:
- `mdreader-public-1` (10.0.1.0/24)
- `mdreader-public-2` (10.0.2.0/24)
- `mdreader-private-1` (10.0.10.0/24)
- `mdreader-private-2` (10.0.11.0/24)

---

### **🔧 Troubleshooting: CIDR Conflicts**

**If you get "CIDR conflicts" error:**

1. **Check existing subnets in `mdreader-vpc`:**
   - Go to VPC → Subnets
   - Filter by VPC: `mdreader-vpc`
   - Note all existing CIDR ranges

2. **Use alternative CIDR ranges** (if conflicts exist):
   - Public Subnet 1: `10.0.3.0/24` (instead of 10.0.1.0/24)
   - Public Subnet 2: `10.0.4.0/24` (instead of 10.0.2.0/24)
   - Private Subnet 1: `10.0.20.0/24` (instead of 10.0.10.0/24)
   - Private Subnet 2: `10.0.21.0/24` (instead of 10.0.11.0/24)

   **Or try:**
   - Public: `10.0.100.0/24`, `10.0.101.0/24`
   - Private: `10.0.200.0/24`, `10.0.201.0/24`

3. **Make sure CIDR fits in VPC:**
   - Your VPC: `10.0.0.0/16` (covers 10.0.0.0 - 10.0.255.255)
   - Any `10.0.x.x/24` should work as long as it doesn't overlap

**⚠️ Don't use the default VPC subnets (172.31.x.x) - they're in a different VPC!**

---

### **Step 7: Create Internet Gateway & Route Tables**

**Internet Gateway** (should be auto-created):
1. **Go to**: VPC → Internet Gateways
2. If not exists, create one: `mdreader-igw`
3. **Attach** to VPC: `mdreader-vpc`

**Route Table (Public):**
1. **Go to**: VPC → Route Tables
2. **Click**: "Create route table"
3. **Settings**:
   - Name: `mdreader-public-rt`
   - VPC: `mdreader-vpc`
4. **Add route**:
   - Destination: `0.0.0.0/0`
   - Target: Internet Gateway (`mdreader-igw`)
5. **Associate** with public subnets (`mdreader-public-1`, `mdreader-public-2`)

**Route Table (Private):**
- Name: `mdreader-private-rt`
- VPC: `mdreader-vpc`
- **No internet route** (RDS stays private)
- Associate with private subnets

---

### **Step 8: Create Security Groups**

**⚠️ IMPORTANT**: Create security groups in THIS ORDER (each depends on the previous one):
1. ALB Security Group (no dependencies)
2. ECS Security Group (references ALB)
3. RDS Security Group (references ECS)

---

**Step 8.1: Delete Existing Security Groups (if any)**

If you have existing security groups with these names, delete them first:

1. **Go to**: VPC → Security Groups
2. **Filter**: Type `mdreader` in the search box to find yours
3. **Select** each security group (`mdreader-alb-sg`, `mdreader-ecs-sg`, `mdreader-rds-sg`)
4. **Click**: "Delete security groups" button
5. **Confirm** deletion

**⚠️ Note**: You can only delete security groups that aren't attached to any resources. If deletion fails, make sure nothing is using them.

---

**Step 8.2: Create ALB Security Group (FIRST)**

1. **Go to**: VPC → Security Groups
2. **Click**: "Create security group"
3. **Settings**:
   - **Name**: `mdreader-alb-sg`
   - **Description**: "Allow HTTP/HTTPS from internet"
   - **VPC**: Select `mdreader-vpc` from dropdown
4. **Inbound rules**:
   - Click "Add rule"
   - Type: `HTTP`
   - Port: `80` (auto-filled)
   - Source: `Anywhere-IPv4` (or `0.0.0.0/0`)
   - Click "Add rule" again
   - Type: `HTTPS`
   - Port: `443` (auto-filled)
   - Source: `Anywhere-IPv4` (or `0.0.0.0/0`)
5. **Outbound rules**: 
   - Leave default "All traffic" ✅
6. **Click**: "Create security group" ✅

**✅ Save**: Note the Security Group ID (starts with `sg-`), you'll need it next!

---

**Step 8.3: Create ECS Security Group (SECOND)**

1. **Go to**: VPC → Security Groups
2. **Click**: "Create security group"
3. **Settings**:
   - **Name**: `mdreader-ecs-sg`
   - **Description**: "Allow traffic from ALB"
   - **VPC**: Select `mdreader-vpc` from dropdown
4. **Inbound rules**:
   - Click "Add rule"
   - Type: `Custom TCP`
   - Port range: `8000`
   - **Source**: This is the tricky part!
     - Click the dropdown next to "Source"
     - Select `Custom`
     - **Click in the search/input field** (not the dropdown!)
     - **Start typing**: `mdreader-alb-sg` or `sg-` (the ID from Step 8.2)
     - AWS should show a dropdown with matching security groups
     - **Select**: `sg-xxxxx (mdreader-alb-sg)` from the dropdown
     - ✅ You should see the security group name/ID, NOT a CIDR block!
5. **Outbound rules**: 
   - Leave default "All traffic" ✅
6. **Click**: "Create security group" ✅

**✅ Verify**: The Source should show something like `sg-0abc123 (mdreader-alb-sg)`, NOT `0.0.0.0/0`!

---

**Step 8.4: Create RDS Security Group (THIRD)**

1. **Go to**: VPC → Security Groups
2. **Click**: "Create security group"
3. **Settings**:
   - **Name**: `mdreader-rds-sg`
   - **Description**: "Allow PostgreSQL from ECS"
   - **VPC**: Select `mdreader-vpc` from dropdown
4. **Inbound rules**:
   - Click "Add rule"
   - Type: `PostgreSQL` (or `Custom TCP`)
   - Port range: `5432` (auto-filled if PostgreSQL selected)
   - **Source**: 
     - Click the dropdown → Select `Custom`
     - **Click in the search/input field**
     - **Start typing**: `mdreader-ecs-sg` or `sg-` (the ID from Step 8.3)
     - AWS should show a dropdown with matching security groups
     - **Select**: `sg-xxxxx (mdreader-ecs-sg)` from the dropdown
     - ✅ You should see the security group name/ID, NOT a CIDR block!
5. **Outbound rules**: 
   - **Delete the default rule** (click X next to "All traffic")
   - Leave empty (RDS doesn't need outbound access) ✅
6. **Click**: "Create security group" ✅

**✅ Verify**: The Source should show something like `sg-0abc123 (mdreader-ecs-sg)`, NOT `0.0.0.0/0`!

---

**🎯 Troubleshooting: Selecting Security Groups**

If you can't find the security group in the Source dropdown:

1. **Make sure** the previous security group is created and saved first
2. **Click in the search/input field** (not just the dropdown)
3. **Type** the security group name (`mdreader-alb-sg`) or ID (`sg-xxxxx`)
4. **Wait** for AWS to show matching results in dropdown
5. **Select** from the dropdown (should show name + ID)
6. **Verify** it shows `sg-xxxxx (mdreader-alb-sg)` format, NOT a CIDR like `0.0.0.0/0`

**❌ Wrong**: Source shows `0.0.0.0/0` (CIDR block)
**✅ Correct**: Source shows `sg-0abc123 (mdreader-alb-sg)` (security group)

---

## 📋 **PHASE 4: SET UP STORAGE (S3)**

### **Step 9: Create S3 Bucket**

1. **Go to**: S3 → Buckets
2. **Click**: "Create bucket"
3. **General configuration**:
   - **AWS Region**: Select `eu-north-1` (or your preferred region)
   - **Bucket type**: General purpose ✅ (default)
   - **Bucket name**: `mdreader-production` (must be globally unique!)
     - If taken, try: `mdreader-production-[your-name]` or `mdreader-[your-name]`
4. **Object Ownership**:
   - Select: **ACLs disabled (recommended)** ✅
5. **Block Public Access settings**:
   - ✅ **Block all public access** (should be checked by default - keep it checked!)
   - All 4 sub-checkboxes should be checked ✅
6. **Bucket Versioning**:
   - Select: **Enable** ✅
7. **Default encryption**:
   - Encryption type: **Server-side encryption with Amazon S3 managed keys (SSE-S3)** ✅
   - Bucket Key: Enable ✅ (optional, reduces costs)
8. **Advanced settings**:
   - **Object Lock**: **Disable** ✅ (leave as default)
9. **Click**: "Create bucket" ✅

**⚠️ Important**: 
- Bucket name must be globally unique across ALL AWS accounts
- Keep "Block all public access" enabled for security
- Bucket Versioning and Encryption are recommended

---

### **Step 10: Configure S3 CORS**

1. **Go to**: Your bucket → Permissions → CORS
2. **Add CORS configuration**:
```json
[
  {
    "AllowedHeaders": ["*"],
    "AllowedMethods": ["GET", "PUT", "POST", "DELETE", "HEAD"],
    "AllowedOrigins": [
      "http://localhost:8080",
      "https://mdreader.vercel.app",
      "https://*.mdreader.app"
    ],
    "ExposeHeaders": ["ETag"],
    "MaxAgeSeconds": 3000
  }
]
```
3. **Save** ✅

---

## 📋 **PHASE 5: SET UP DATABASE (RDS)**

### **Step 11: Create RDS PostgreSQL**

1. **Go to**: RDS → Databases
2. **Click**: "Create database"
3. **Settings**:
   - **Engine**: PostgreSQL ✅
   - **Version**: PostgreSQL 16.x (latest) ✅
   - **Template**: **Free tier** ✅ (THIS IS CRITICAL!)
   - **DB instance identifier**: `mdreader-db`
   - **Master username**: `poostgre` (or your choice) p94A3....
   - **Master password**: Generate strong password (save it!)
   - **DB instance class**: `db.t3.micro` ✅ (should auto-select if Free tier template chosen)
   - **Availability & Durability**:
     - **Multi-AZ deployment**: **Don't create an Aurora Replica** ✅ (CRITICAL - Multi-AZ costs $$$!)
   - **Storage**: 
     - Type: General Purpose SSD (gp3)
     - Allocated storage: 20 GB ✅
     - **Enable storage autoscaling**: ❌ **DISABLE** (for free tier, 20GB is enough)
   - **VPC**: `mdreader-vpc`
   - **Subnet group**: Create new: `mdreader-db-subnet-group`
     - Add subnets: `mdreader-private-1`, `mdreader-private-2`
   - **Public access**: **No** ✅ (keep private)
   - **VPC security group**: `mdreader-rds-sg` (NOT "default"!)
   - **Database name**: `mdreader`
   - **Backup**: ✅ Enable automated backups (7 days retention)
   - **Encryption**: ❌ **DISABLE** (for free tier, encryption costs extra)
4. **Click**: "Create database" ✅

**⏱️ Wait**: Takes 5-10 minutes to create

**⚠️ IMPORTANT**: 
- **Free tier template** should show ~$0.00/month cost
- If cost shows >$50/month, you selected wrong options!
- **Save the master password!** You'll need it for connections.

**💡 Cost Check**: Before creating, check "Estimated monthly costs" section. Should be ~$0.00 for free tier!

---

## 📋 **PHASE 6: SET UP AUTHENTICATION (COGNITO)**

### **Step 12: Create Cognito User Pool**

1. **Go to**: Cognito → User Pools
2. **Click**: "Create user pool"
3. **Sign-in options**:
   - ✅ Email
   - ✅ Username (optional)
4. **Password policy**:
   - Minimum length: 8
   - ✅ Require uppercase
   - ✅ Require lowercase
   - ✅ Require numbers
   - ✅ Require symbols
5. **MFA**: Optional (disable for now)
6. **User pool name**: `mdreader-users`
7. **Attributes**:
   - ✅ Email (required, verified)
   - ✅ Name (optional)
   - ✅ Picture (optional)
8. **App integration**:
   - App type: Public client
   - App client name: `mdreader-web-client`
   - ✅ Generate client secret: No (for public clients)
   - ✅ Enable username-password auth
9. **Review** → Create user pool ✅

**Save**:
- User Pool ID: `us-east-1_xxxxx`
- App Client ID: `xxxxx`
From the Overview page, save:
User Pool ID: eu-north-1_MTxoOvinR
User Pool ARN: arn:aws:cognito-idp:eu-north-1:916851444018:userpool/eu-north-1_MTxoOvinR


App client name
mdreader-web-client
Client ID
7jqc3431a1pbui6t780rct63na
Client secret
1b2n1vhfprluaj64v45gpmcdplokdo5ht3j8pln0tksivdklo335


---

## 📋 **PHASE 7: SET UP SECRETS MANAGER**

### **Step 13: Store Database Credentials**

1. **Go to**: Secrets Manager → Secrets
2. **Click**: "Store a new secret"
3. **Secret type**: Credentials for Amazon RDS database
4. **Database**: Select `mdreader-db`
5. **Credentials**: Use the master username/password from Step 11
6. **Secret name**: `mdreader/database`
7. **Rotation**: Disable (for now)
8. **Click**: "Store" ✅

---

### **Step 13.1: Store OpenAI API Key**

1. **Go to**: Secrets Manager → Secrets
2. **Click**: "Store a new secret"
3. **Secret type**: Select **"Other type of secret"** → **"Plaintext"**
4. **Plaintext**: Paste your OpenAI API key:
   ```json
   {
     "api_key": "sk-proj-xxxxxxxxxxxxxxxxxxxxx"
   }
   ```
   **OR** use "Key/value" format:
   - Key: `api_key`
   - Value: `sk-proj-xxxxxxxxxxxxxxxxxxxxx` (your actual key)
5. **Secret name**: `mdreader/openai`
6. **Rotation**: Disable (for now)
7. **Click**: "Store" ✅

**⚠️ Important**: Replace `sk-proj-xxxxxxxxxxxxxxxxxxxxx` with your actual OpenAI API key!

---

### **Step 13.2: Store Cognito Credentials**

1. **Go to**: Secrets Manager → Secrets
2. **Click**: "Store a new secret"
3. **Secret type**: Select **"Other type of secret"** → **"Key/value"**
4. **Add key/value pairs**:
   - Key: `user_pool_id`, Value: `eu-north-1_MTxoOvinR` (your User Pool ID)
   - Click "Add row"
   - Key: `app_client_id`, Value: `xxxxxxxxxxxxx` (your App Client ID from Cognito)
5. **Secret name**: `mdreader/cognito`
6. **Rotation**: Disable (for now)
7. **Click**: "Store" ✅

**To find App Client ID**:
- Go to Cognito → User Pools → Your pool → Applications → App clients
- Copy the "Client ID" (looks like: `1a2b3c4d5e6f7g8h9i0j`)

---

**✅ Result**: You should have 3 secrets:
- `mdreader/database` (RDS credentials)
- `mdreader/openai` (OpenAI API key)
- `mdreader/cognito` (User Pool ID + App Client ID)

---

## 📋 **PHASE 8: SET UP CONTAINER REGISTRY (ECR)**

### **Step 14: Create ECR Repository**

1. **Go to**: ECR (Elastic Container Registry) → Repositories
2. **Click**: "Create repository"
3. **Settings**:
   - Visibility: Private
   - Repository name: `mdreader-api`
   - Tag immutability: Disable
   - Scan on push: Enable (for security)
4. **Click**: "Create repository" ✅

**Save**: Repository URI: `123456789012.dkr.ecr.us-east-1.amazonaws.com/mdreader-api`
arn:aws:ecr:eu-north-1:916851444018:repository/mdreader-api

---

## 📋 **PHASE 9: SET UP ECS CLUSTER**
mdreader-cluster1
### **Step 15.0: Create ECS Service-Linked Role (IF NEEDED)**

**⚠️ If you get error "Unable to assume the service linked role"**, create it first:

1. **Go to**: IAM → Roles
2. **Click**: "Create role"
3. **Select trusted entity**: AWS service
4. **Use case**: Find and select **"Elastic Container Service"** → **"Elastic Container Service"**
5. **Click**: "Next"
6. **Permissions**: Leave default (AWS automatically adds required permissions)
7. **Role name**: Leave default (`AWSServiceRoleForECS`) ✅
8. **Click**: "Create role" ✅

**OR use AWS CLI** (faster):
```bash
aws iam create-service-linked-role --aws-service-name ecs.amazonaws.com
```

**Then retry** creating the cluster below.

---

### **Step 15: Create ECS Cluster**

1. **Go to**: ECS → Clusters
2. **Click**: "Create cluster"
3. **Settings**:
   - **Cluster name**: `mdreader-cluster`
   - **Infrastructure**: **Fargate only** ✅ (Serverless - you don't manage servers)
   - **VPC**: ❌ **LEAVE EMPTY/DON'T SELECT** (for Fargate, VPC is specified later when creating services)
   - **Default namespace**: Leave as default (optional)
4. **Click**: "Create cluster" ✅

**⚠️ IMPORTANT**: 
- For Fargate clusters, you **don't** select a VPC during cluster creation
- The VPC (`mdreader-vpc`) will be specified when you create the **ECS Service** later
- This is normal - the cluster is just a logical grouping

**⏱️ Wait**: Takes 1-2 minutes to create

---

### **Step 16: Create Task Definition**

1. **Go to**: ECS → Task Definitions
2. **Click**: "Create new task definition"
3. **Settings**:
   - Launch type: Fargate
   - Task definition family: `mdreader-api`
   - Task role: Create new IAM role: `mdreader-ecs-task-role`
   - Execution role: Create new IAM role: `mdreader-ecs-execution-role`
   - Task size:
     - CPU: 0.25 vCPU (256)
     - Memory: 512 MB
4. **Container definition**:
   - Container name: `fastapi`
   - Image URI: `123456789012.dkr.ecr.us-east-1.amazonaws.com/mdreader-api:latest`
   - Port mappings: 8000 (container port)
   - Environment variables: (we'll add these later)
5. **Click**: "Create" ✅

---

## 📋 **PHASE 10: SET UP LOAD BALANCER (ALB)**

### **Step 17: Create Application Load Balancer**

1. **Go to**: EC2 → Load Balancers
2. **Click**: "Create Load Balancer"
3. **Type**: Application Load Balancer ✅
4. **Settings**:
   - Name: `mdreader-alb`
   - Scheme: Internet-facing
   - IP address type: IPv4
   - VPC: `mdreader-vpc`
   - Subnets: Select `mdreader-public-1`, `mdreader-public-2`
   - Security groups: `mdreader-alb-sg`
5. **Listeners**:
   - Protocol: HTTP, Port: 80
   - Default action: Create target group (we'll create next)
6. **Click**: "Create load balancer" ✅

**⏱️ Wait**: Takes 2-3 minutes to create

**Save**: DNS name: `mdreader-alb-1234567890.us-east-1.elb.amazonaws.com`

---

### **Step 18: Create Target Group**

1. **Go to**: EC2 → Target Groups
2. **Click**: "Create target group"
3. **Settings**:
   - Target type: IP addresses ✅
   - Target group name: `mdreader-api-tg`
   - Protocol: HTTP
   - Port: 8000
   - VPC: `mdreader-vpc`
   - Health check:
     - Path: `/healthz`
     - Protocol: HTTP
     - Port: 8000
4. **Click**: "Create target group" ✅

**Note**: We'll register ECS tasks to this target group later.

---

## 📋 **PHASE 11: SET UP API GATEWAY**

### **Step 19: Create REST API**

1. **Go to**: API Gateway → APIs
2. **Click**: "Create API"
3. **Choose**: REST API → Build
4. **Settings**:
   - Protocol: REST
   - Create new API: New API
   - API name: `mdreader-api`
   - Endpoint type: Regional
5. **Click**: "Create API" ✅

**We'll configure routes later** (after backend is deployed)

---

### **Step 20: Create WebSocket API**

1. **Go to**: API Gateway → APIs
2. **Click**: "Create API"
3. **Choose**: WebSocket API → Build
4. **Settings**:
   - API name: `mdreader-websocket`
   - Route selection expression: `$request.body.action`
5. **Click**: "Create API" ✅

**We'll configure routes later** (for collaboration)

---

## 📋 **PHASE 12: SET UP MONITORING (CLOUDWATCH)**

### **Step 21: Create Log Group**

1. **Go to**: CloudWatch → Logs → Log groups
2. **Click**: "Create log group"
3. **Settings**:
   - Log group name: `/ecs/mdreader-api`
   - Retention: 30 days
4. **Click**: "Create log group" ✅

---

## 📋 **PHASE 13: SET UP CDN (CLOUDFRONT)**

### **Step 22: Create CloudFront Distribution**

1. **Go to**: CloudFront → Distributions
2. **Click**: "Create distribution"
3. **Settings**:
   - Origin domain: Select your S3 bucket (`mdreader-production.s3.amazonaws.com`)
   - Origin access: Origin access control (recommended)
   - Create OAC: New OAC → Create
   - Viewer protocol policy: Redirect HTTP to HTTPS
   - Allowed HTTP methods: GET, HEAD, OPTIONS, PUT, POST, PATCH, DELETE
   - Cache policy: CachingOptimized
   - Price class: Use only North America and Europe (cheaper)
4. **Click**: "Create distribution" ✅

**⏱️ Wait**: Takes 10-15 minutes to deploy

---

## 📋 **PHASE 14: SET UP EMAIL (SES)**

### **Step 23: Verify Email Domain (SES)**

1. **Go to**: SES → Verified identities
2. **Click**: "Create identity"
3. **Identity type**: Domain ✅
4. **Domain**: `mdreader.app` (or your domain)
5. **Verification method**: DNS (recommended)
6. **Click**: "Create identity"
7. **Add DNS records** to your domain registrar (as shown)
8. **Wait** for verification ✅

**Note**: SES starts in "Sandbox mode" (can only send to verified emails). Request production access later.

---

## ✅ **CHECKLIST - WHAT YOU'VE CREATED**

### **Account & Security:**
- [x] AWS Account created
- [x] Root MFA enabled
- [x] IAM user created (`mdreader-admin`)
- [x] AWS CLI configured

### **Network:**
- [x] VPC created (`mdreader-vpc`)
- [x] Public subnets (2)
- [x] Private subnets (2)
- [x] Internet Gateway
- [x] Route tables
- [x] Security groups (ALB, ECS, RDS)

### **Storage:**
- [x] S3 bucket (`mdreader-production`)
- [x] S3 CORS configured

### **Database:**
- [x] RDS PostgreSQL (`mdreader-db`)
- [x] Private subnet placement
- [x] Security group configured

### **Auth:**
- [x] Cognito User Pool (`mdreader-users`)
- [x] App client created

### **Secrets:**
- [x] Secrets Manager configured
- [x] Database credentials stored
- [x] API keys stored

### **Compute:**
- [x] ECR repository (`mdreader-api`)
- [x] ECS cluster (`mdreader-cluster`)
- [x] Task definition created

### **Networking:**
- [x] Application Load Balancer (`mdreader-alb`)
- [x] Target group (`mdreader-api-tg`)

### **API:**
- [x] API Gateway REST API (`mdreader-api`)
- [x] API Gateway WebSocket API (`mdreader-websocket`)

### **Monitoring:**
- [x] CloudWatch log group (`/ecs/mdreader-api`)

### **CDN:**
- [x] CloudFront distribution (for S3)

### **Email:**
- [x] SES domain verified

---

## 🎯 **NEXT STEPS**

**After AWS setup is complete:**

1. **Build FastAPI backend** (Week 1-4)
2. **Push Docker image** to ECR
3. **Create ECS service** (connects to ALB)
4. **Configure API Gateway** routes
5. **Deploy** and test!

---

## 📚 **USEFUL AWS CONSOLE LINKS**

**Quick Access:**
- VPC: https://console.aws.amazon.com/vpc/
- S3: https://console.aws.amazon.com/s3/
- RDS: https://console.aws.amazon.com/rds/
- Cognito: https://console.aws.amazon.com/cognito/
- ECS: https://console.aws.amazon.com/ecs/
- API Gateway: https://console.aws.amazon.com/apigateway/
- CloudWatch: https://console.aws.amazon.com/cloudwatch/
- Secrets Manager: https://console.aws.amazon.com/secretsmanager/

---

## ⚠️ **IMPORTANT NOTES**

1. **Free Tier**: Most services are free for 12 months (with limits)
2. **Cost Monitoring**: Set up billing alerts in AWS Billing & Cost Management
3. **Region**: Use `us-east-1` (cheapest) or your preferred region
4. **Security**: Never commit AWS credentials to git!
5. **Backup**: RDS automated backups are enabled (7 days retention)

---

## 💰 **COST BREAKDOWN & BILLING PROTECTION**

### **✅ What's FREE (If you stop here):**

- **VPC, Subnets, Route Tables, Security Groups**: Always FREE
- **S3 Bucket**: FREE (20GB storage free for 12 months)
- **RDS PostgreSQL**: FREE (db.t3.micro, 750 hours/month free for 12 months)
- **Cognito User Pool**: FREE (up to 50K monthly active users free for 12 months)
- **Secrets Manager**: FREE (first 10K API calls/month free for 12 months)
- **ECR Repository**: FREE (only pay for image storage if you push images)
- **ECS Cluster**: FREE (only pay for running tasks)

### **💰 What COSTS MONEY:**

- **Application Load Balancer (ALB)**: ~$16/month + $0.008/GB data transfer
  - ⚠️ **This will charge you even if nothing is running!**
  - If you create ALB now, delete it if you're not using it!

- **RDS** (after free tier expires): ~$12/month for db.t3.micro running 24/7

- **ECS Fargate** (when you deploy): ~$10-30/month depending on usage

---

### **🛡️ SET UP BILLING PROTECTION (DO THIS NOW!)**

**AWS doesn't have hard spending limits, but you can set up alerts:**

1. **Go to**: AWS Billing & Cost Management → Billing preferences
2. **Enable**: "Receive Billing Alerts"
3. **Go to**: CloudWatch → Alarms → Billing
4. **Create alarm**:
   - Select metric: "EstimatedCharges"
   - Threshold: `100` USD
   - Actions: Send email notification to yourself
5. **Create multiple alarms**:
   - $10 (warning)
   - $50 (warning)
   - $100 (urgent!)
   - $200 (critical!)

**⚠️ IMPORTANT**: Alerts don't STOP spending, they just notify you!

---

### **🗑️ TO AVOID CHARGES (If you stop here):**

**Delete these resources** (they cost money even if idle):
1. **Application Load Balancer** (if created) - ~$16/month
2. **Any ECS services running** (if any)

**Keep these** (they're free):
- VPC, Security Groups, Subnets ✅
- S3 bucket ✅ (as long as you stay under 20GB)
- RDS ✅ (free tier)
- Cognito ✅ (free tier)
- ECR ✅ (empty is free)
- ECS Cluster ✅ (free, just the container)

---

### **📊 Estimated Monthly Cost (If you stop now):**

- **Best case**: $0/month (if you delete ALB)
- **If ALB exists**: ~$16/month
- **With everything running**: ~$30-50/month (after free tier expires)

**Recommendation**: Set up billing alerts NOW, then continue. You can always delete resources later!

---

## 🆘 **TROUBLESHOOTING**

**Issue**: Can't create S3 bucket (name taken)
- **Solution**: Add your name/random suffix: `mdreader-production-[yourname]`

**Issue**: RDS creation fails
- **Solution**: Check security groups, subnets, and VPC configuration

**Issue**: Can't connect to RDS
- **Solution**: Ensure RDS security group allows inbound from ECS security group

**Issue**: API Gateway doesn't connect to ALB
- **Solution**: Use VPC Link or configure integration correctly

---

**Ready to start building the backend!** 🚀

