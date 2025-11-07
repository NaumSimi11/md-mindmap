# ✅ AWS Setup Checklist

**Quick checklist to track your AWS setup progress.**

---

## 📋 **PHASE 1: ACCOUNT SETUP**

- [ ] AWS account created
- [ ] Root user MFA enabled
- [ ] IAM user created (`mdreader-admin`)
- [ ] AWS CLI installed and configured
- [ ] Tested CLI: `aws sts get-caller-identity`

**Time**: 15 minutes

---

## 📋 **PHASE 2: NETWORK (VPC)**

- [ ] VPC created (`mdreader-vpc`, CIDR: `10.0.0.0/16`)
- [ ] Public subnet 1 (`mdreader-public-1`, `10.0.1.0/24`, us-east-1a)
- [ ] Public subnet 2 (`mdreader-public-2`, `10.0.2.0/24`, us-east-1b)
- [ ] Private subnet 1 (`mdreader-private-1`, `10.0.10.0/24`, us-east-1a)
- [ ] Private subnet 2 (`mdreader-private-2`, `10.0.11.0/24`, us-east-1b)
- [ ] Internet Gateway created and attached
- [ ] Public route table (routes to Internet Gateway)
- [ ] Private route table (no internet)
- [ ] ALB security group (`mdreader-alb-sg`)
- [ ] ECS security group (`mdreader-ecs-sg`)
- [ ] RDS security group (`mdreader-rds-sg`)

**Time**: 20 minutes

---

## 📋 **PHASE 3: STORAGE (S3)**

- [ ] S3 bucket created (`mdreader-production`)
- [ ] CORS configured
- [ ] Versioning enabled
- [ ] Encryption enabled
- [ ] Public access blocked

**Time**: 5 minutes

---

## 📋 **PHASE 4: DATABASE (RDS)**

- [ ] RDS PostgreSQL created (`mdreader-db`)
- [ ] Instance: `db.t3.micro` (free tier)
- [ ] Database name: `mdreader`
- [ ] Master password saved securely
- [ ] Subnet group created (private subnets)
- [ ] Security group attached
- [ ] Backups enabled (7 days)
- [ ] Encryption enabled

**Time**: 10 minutes (creation takes 5-10 min)

---

## 📋 **PHASE 5: AUTH (COGNITO)**

- [ ] User Pool created (`mdreader-users`)
- [ ] App client created (`mdreader-web-client`)
- [ ] User Pool ID saved
- [ ] App Client ID saved
- [ ] Email verification enabled

**Time**: 5 minutes

---

## 📋 **PHASE 6: SECRETS**

- [ ] Secrets Manager: `mdreader/database` (RDS credentials)
- [ ] Secrets Manager: `mdreader/openai` (API key)
- [ ] Secrets Manager: `mdreader/cognito` (User Pool + Client IDs)

**Time**: 5 minutes

---

## 📋 **PHASE 7: CONTAINER REGISTRY (ECR)**

- [ ] ECR repository created (`mdreader-api`)
- [ ] Repository URI saved

**Time**: 2 minutes

---

## 📋 **PHASE 8: COMPUTE (ECS)**

- [ ] ECS cluster created (`mdreader-cluster`, Fargate)
- [ ] Task definition created (`mdreader-api`)
- [ ] Task role created (`mdreader-ecs-task-role`)
- [ ] Execution role created (`mdreader-ecs-execution-role`)

**Time**: 5 minutes

---

## 📋 **PHASE 9: LOAD BALANCER (ALB)**

- [ ] Application Load Balancer created (`mdreader-alb`)
- [ ] Target group created (`mdreader-api-tg`)
- [ ] ALB DNS name saved

**Time**: 5 minutes (creation takes 2-3 min)

---

## 📋 **PHASE 10: API GATEWAY**

- [ ] REST API created (`mdreader-api`)
- [ ] WebSocket API created (`mdreader-websocket`)

**Time**: 3 minutes

---

## 📋 **PHASE 11: MONITORING (CLOUDWATCH)**

- [ ] Log group created (`/ecs/mdreader-api`)

**Time**: 1 minute

---

## 📋 **PHASE 12: CDN (CLOUDFRONT)**

- [ ] CloudFront distribution created
- [ ] S3 origin configured
- [ ] Origin Access Control created
- [ ] HTTPS redirect enabled

**Time**: 5 minutes (deployment takes 10-15 min)

---

## 📋 **PHASE 13: EMAIL (SES)**

- [ ] SES domain verified (`mdreader.app`)
- [ ] DNS records added

**Time**: 5 minutes (verification can take time)

---

## ✅ **TOTAL TIME**: ~90 minutes

---

## 📝 **CREDENTIALS TO SAVE**

Create a secure file (`aws-credentials.md` - **DON'T COMMIT TO GIT!**):

```markdown
# AWS Credentials (KEEP SECRET!)

## IAM User
- Access Key ID: AKIA...
- Secret Access Key: ...
- Region: us-east-1

## RDS
- Endpoint: mdreader-db.xxxxx.us-east-1.rds.amazonaws.com
- Port: 5432
- Database: mdreader
- Username: admin
- Password: ...

## Cognito
- User Pool ID: us-east-1_xxxxx
- App Client ID: xxxxx

## S3
- Bucket: mdreader-production
- Region: us-east-1

## ECR
- Repository URI: 123456789012.dkr.ecr.us-east-1.amazonaws.com/mdreader-api

## ALB
- DNS: mdreader-alb-1234567890.us-east-1.elb.amazonaws.com

## CloudFront
- Distribution ID: E1234567890
- Domain: d1234567890.cloudfront.net
```

---

## 🎯 **WHAT'S NEXT?**

After completing this checklist:

1. ✅ **All AWS services are ready**
2. ⏭️ **Build FastAPI backend** (Week 1)
3. ⏭️ **Push Docker image** to ECR
4. ⏭️ **Deploy ECS service**
5. ⏭️ **Configure API Gateway routes**
6. ⏭️ **Test everything!**

---

**See**: `docs/AWS_SETUP_STEP_BY_STEP.md` for detailed instructions! 🚀


