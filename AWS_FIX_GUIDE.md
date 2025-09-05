# AWS Deployment Fix Guide

## Issues Found & Solutions

### 1. **Excel Database Problem** ❌
**Issue**: Excel files don't work on AWS Lambda (serverless)
**Solution**: ✅ Created DynamoDB adapter (`aws-db.js`)

### 2. **File System Issues** ❌  
**Issue**: Local file storage fails on Lambda
**Solution**: ✅ Use S3 for file uploads (implement later)

### 3. **Security Vulnerabilities** ❌
**Issue**: Multiple security issues found
**Solution**: ✅ Fixed in `aws-index.js`:
- Proper CORS configuration
- Rate limiting
- Input validation
- Secure authentication

## Quick AWS Deployment

### Option 1: Serverless Framework (Recommended)

1. **Install dependencies**:
   ```bash
   npm install
   cd server && npm install
   ```

2. **Deploy to AWS**:
   ```bash
   npx serverless deploy --config serverless-aws.yml
   ```

3. **Set environment variables**:
   ```bash
   export JWT_SECRET="your-secure-secret"
   export CORS_ORIGIN="https://your-domain.com"
   ```

### Option 2: AWS Amplify (Frontend + API)

1. **Update amplify.yml** to use new backend:
   ```yaml
   version: 1
   backend:
     phases:
       build:
         commands:
           - npm install
           - npx serverless deploy --config serverless-aws.yml
   frontend:
     phases:
       preBuild:
         commands:
           - cd client && npm ci
       build:
         commands:
           - npm run build
     artifacts:
       baseDirectory: client/build
       files:
         - '**/*'
   ```

## Database Migration

### From Excel to DynamoDB:

**Tables Created**:
- `medical-users` - User accounts
- `medical-cases` - Medical cases  
- `medical-doctors` - Doctor profiles
- `medical-messages` - Case messages

**Automatic Setup**: Tables created via `serverless-aws.yml`

## Environment Variables Needed

```bash
# Required
JWT_SECRET=your-super-secure-secret-key-here
AWS_REGION=us-east-1

# Optional  
CORS_ORIGIN=https://your-domain.com
NODE_ENV=production
```

## Cost Estimate

| Service | Usage | Monthly Cost |
|---------|-------|-------------|
| Lambda | 100K requests | $0.20 |
| DynamoDB | 1M reads/writes | $1.25 |
| API Gateway | 100K requests | $0.35 |
| **Total** | | **~$2-5/month** |

## Testing Locally

```bash
# Start local DynamoDB simulation
npx serverless offline --config serverless-aws.yml

# Test endpoints
curl http://localhost:5000/api/health
```

## Production Checklist

- [ ] Set strong JWT_SECRET
- [ ] Configure specific CORS origins
- [ ] Enable CloudWatch logging
- [ ] Set up monitoring alerts
- [ ] Configure backup for DynamoDB
- [ ] Implement file upload to S3

## Next Steps

1. **Deploy serverless backend**
2. **Update frontend API URL**
3. **Test login/registration**
4. **Add file upload to S3**
5. **Configure custom domain**