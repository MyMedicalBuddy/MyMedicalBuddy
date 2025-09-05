# AWS Deployment Guide - Medical Opinion Platform POC

## Quick Start Options

### Option 1: AWS Amplify (Recommended for POC)
**Fastest deployment - 5 minutes setup**

1. **Push to GitHub**:
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin https://github.com/yourusername/medical-opinion-platform.git
   git push -u origin main
   ```

2. **Deploy via Amplify Console**:
   - Go to AWS Amplify Console
   - Connect GitHub repository
   - Use `amplify.yml` configuration
   - Deploy automatically

**Cost**: ~$5-15/month for POC

### Option 2: Serverless Framework (API + S3)
**Best for scalable POC**

1. **Install Serverless**:
   ```bash
   npm install -g serverless
   npm install serverless-offline --save-dev
   ```

2. **Configure AWS CLI**:
   ```bash
   aws configure
   ```

3. **Deploy**:
   ```bash
   ./deploy-aws.bat
   ```

**Cost**: ~$0-10/month (pay per use)

### Option 3: AWS CDK (Full Infrastructure)
**Most comprehensive setup**

1. **Install CDK**:
   ```bash
   npm install -g aws-cdk
   cd aws-cdk
   npm init
   npm install aws-cdk-lib constructs
   ```

2. **Deploy**:
   ```bash
   cdk bootstrap
   cdk deploy
   ```

**Cost**: ~$10-30/month

## Environment Setup

### Required AWS Services:
- **S3**: File storage ($0.023/GB)
- **Lambda**: API backend ($0.20/1M requests)
- **API Gateway**: REST API ($3.50/1M requests)
- **CloudFront**: CDN ($0.085/GB)

### Environment Variables:
```bash
# Set in AWS Lambda/Amplify
JWT_SECRET=your_secure_secret_here
NODE_ENV=production
CORS_ORIGIN=https://your-domain.com
```

## Database Migration

### Current: Excel Files → AWS Options:

1. **Keep Excel (Quick POC)**:
   - Store in S3
   - Lambda reads/writes Excel files

2. **Upgrade to DynamoDB**:
   - NoSQL, serverless
   - $1.25/million reads

3. **Use RDS (MySQL/PostgreSQL)**:
   - Traditional database
   - ~$15-30/month

## Security Considerations

### Immediate POC Setup:
- Enable HTTPS (automatic with CloudFront)
- Set CORS origins
- Use IAM roles for Lambda
- Enable S3 bucket encryption

### Production Readiness:
- WAF for API protection
- VPC for database isolation
- Secrets Manager for credentials
- CloudTrail for audit logs

## Monitoring & Costs

### CloudWatch Monitoring:
- Lambda execution logs
- API Gateway metrics
- S3 access logs

### Cost Optimization:
- Use S3 Intelligent Tiering
- Set Lambda memory appropriately
- Enable CloudFront caching

## Deployment Commands

```bash
# Quick Amplify deployment
git push origin main

# Serverless deployment
serverless deploy --stage prod

# CDK deployment
cdk deploy --all

# Update environment variables
aws lambda update-function-configuration --function-name medical-opinion-api --environment Variables="{JWT_SECRET=newsecret}"
```

## Rollback Strategy

```bash
# Serverless rollback
serverless rollback --timestamp timestamp

# Amplify rollback
# Use Amplify Console to revert to previous deployment
```

## Expected POC Costs

| Service | Monthly Cost |
|---------|-------------|
| Lambda (10K requests) | $0.20 |
| API Gateway | $0.35 |
| S3 (1GB storage) | $0.02 |
| CloudFront (1GB transfer) | $0.09 |
| **Total POC Cost** | **~$5-15/month** |

## Next Steps After POC

1. **Custom Domain**: Route 53 + SSL certificate
2. **Database Migration**: Excel → DynamoDB/RDS
3. **Authentication**: Cognito integration
4. **File Processing**: Lambda for image/document processing
5. **Notifications**: SES for email, SNS for SMS
6. **Compliance**: HIPAA-eligible services configuration