# 🏥 Medical Opinion Platform - Complete Deployment Guide

## 📋 Prerequisites

1. **AWS CLI configured**:
   ```bash
   aws configure
   ```

2. **Node.js and npm installed**

3. **Git repository cloned**:
   ```bash
   git clone https://github.com/MyMedicalBuddy/MyMedicalBuddy.git
   cd MyMedicalBuddy
   ```

## 🚀 One-Click Deployment

### Option 1: Automated Script (Recommended)

**Linux/Mac:**
```bash
chmod +x deploy-complete.sh
./deploy-complete.sh
```

**Windows:**
```cmd
deploy-complete.bat
```

### Option 2: Manual Steps

#### Step 1: Deploy Backend
```bash
# Create DynamoDB tables
aws dynamodb create-table \
    --table-name Users \
    --attribute-definitions AttributeName=id,AttributeType=S AttributeName=email,AttributeType=S \
    --key-schema AttributeName=id,KeyType=HASH \
    --global-secondary-indexes 'IndexName=EmailIndex,KeySchema=[{AttributeName=email,KeyType=HASH}],Projection={ProjectionType=ALL},BillingMode=PAY_PER_REQUEST' \
    --billing-mode PAY_PER_REQUEST \
    --region eu-north-1

# Package and deploy Lambda
cd server && npm install --production && cd ..
zip -r medical-backend.zip server/
aws lambda create-function \
    --function-name medical-opinion-platform-api \
    --runtime nodejs18.x \
    --role arn:aws:iam::YOUR_ACCOUNT_ID:role/medical-opinion-lambda-role \
    --handler aws-index.handler \
    --zip-file fileb://medical-backend.zip \
    --region eu-north-1
```

#### Step 2: Configure Frontend
```bash
# Update API URL
echo "REACT_APP_API_URL=https://YOUR_API_ID.execute-api.eu-north-1.amazonaws.com/dev" > client/.env.production

# Build frontend
cd client
npm install
npm run build
cd ..
```

## 🌐 Frontend Deployment Options

### Option A: AWS Amplify (Recommended)

1. **Connect Repository**:
   - Go to [AWS Amplify Console](https://console.aws.amazon.com/amplify/)
   - Click "New app" → "Host web app"
   - Connect GitHub: `https://github.com/MyMedicalBuddy/MyMedicalBuddy`

2. **Build Settings**:
   ```yaml
   version: 1
   frontend:
     phases:
       preBuild:
         commands:
           - cd client
           - npm ci
       build:
         commands:
           - npm run build
     artifacts:
       baseDirectory: client/build
       files:
         - '**/*'
   ```

3. **Environment Variables**:
   - Add `REACT_APP_API_URL` with your API Gateway URL

### Option B: Netlify

1. **Connect Repository**: Link GitHub repo to Netlify
2. **Build Settings**:
   - Build command: `cd client && npm run build`
   - Publish directory: `client/build`
3. **Environment Variables**: Add `REACT_APP_API_URL`

### Option C: Vercel

1. **Deploy**: `npx vercel --prod`
2. **Configure**: Set build settings for `client` directory

## 🧪 Testing Deployment

### Backend API Test
```bash
# Health check
curl https://YOUR_API_ID.execute-api.eu-north-1.amazonaws.com/dev/api/health

# Register test user
curl -X POST https://YOUR_API_ID.execute-api.eu-north-1.amazonaws.com/dev/api/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test User","email":"test@example.com","password":"password123"}'
```

### Frontend Test
1. Open deployed URL
2. Register new account
3. Submit test case
4. Login as admin to test admin features

## 📊 Monitoring & Logs

### Lambda Logs
```bash
aws logs tail /aws/lambda/medical-opinion-platform-api --follow
```

### DynamoDB Tables
```bash
aws dynamodb list-tables
aws dynamodb scan --table-name Users --limit 5
```

## 🔧 Configuration

### Environment Variables

**Backend (Lambda)**:
- `JWT_SECRET`: Authentication secret
- `NODE_ENV`: production

**Frontend**:
- `REACT_APP_API_URL`: Backend API endpoint

### Database Tables

- **Users**: User accounts and profiles
- **Cases**: Medical cases and submissions
- **Doctors**: Doctor profiles and verification
- **Messages**: Communication between users and doctors

## 🛠️ Troubleshooting

### Common Issues

1. **Lambda timeout**: Increase timeout in AWS Console
2. **CORS errors**: Check API Gateway CORS settings
3. **DynamoDB access**: Verify IAM permissions
4. **Build failures**: Check Node.js version compatibility

### Update Deployment

**Backend updates**:
```bash
cd server && npm install --production && cd ..
zip -r medical-backend.zip server/
aws lambda update-function-code \
  --function-name medical-opinion-platform-api \
  --zip-file fileb://medical-backend.zip
```

**Frontend updates**:
```bash
cd client && npm run build && cd ..
# Redeploy to your hosting platform
```

## 💰 Cost Estimation

### AWS Resources (Monthly)
- **Lambda**: ~$0.20 (1M requests)
- **DynamoDB**: ~$1.25 (25 GB storage)
- **API Gateway**: ~$3.50 (1M requests)
- **Amplify**: ~$0.15 (5 GB bandwidth)

**Total**: ~$5.10/month for moderate usage

## 🧹 Cleanup Resources

```bash
# Delete Lambda function
aws lambda delete-function --function-name medical-opinion-platform-api

# Delete DynamoDB tables
aws dynamodb delete-table --table-name Users
aws dynamodb delete-table --table-name Cases
aws dynamodb delete-table --table-name Doctors
aws dynamodb delete-table --table-name Messages

# Delete IAM role and policies
aws iam detach-role-policy --role-name medical-opinion-lambda-role --policy-arn arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole
aws iam delete-role --role-name medical-opinion-lambda-role
```

## 📚 Additional Resources

- **GitHub Repository**: https://github.com/MyMedicalBuddy/MyMedicalBuddy
- **AWS Documentation**: https://docs.aws.amazon.com/
- **React Documentation**: https://reactjs.org/docs/
- **Node.js Documentation**: https://nodejs.org/docs/

## 🎯 Production Checklist

- [ ] Backend deployed and tested
- [ ] Frontend built and deployed
- [ ] Database tables created
- [ ] API endpoints working
- [ ] Authentication functional
- [ ] Admin features accessible
- [ ] HTTPS enabled
- [ ] Domain configured (optional)
- [ ] Monitoring setup
- [ ] Backup strategy implemented