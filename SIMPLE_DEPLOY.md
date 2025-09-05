# 🚀 Simple Deployment Guide

## Prerequisites
- AWS CLI configured: `aws configure`
- Node.js installed

## 1. Deploy Backend (5 minutes)

```bash
chmod +x simple-deploy.sh
./simple-deploy.sh
```

This creates:
- DynamoDB Users table
- Lambda function with registration/login
- API Gateway with CORS

## 2. Deploy Frontend (2 minutes)

### Option A: Netlify (Recommended)
```bash
cd client
npm install
npm run build
```
- Go to [Netlify](https://netlify.com)
- Drag & drop `client/build` folder
- Done!

### Option B: AWS Amplify
- Go to [AWS Amplify Console](https://console.aws.amazon.com/amplify/)
- Connect GitHub repo: `https://github.com/MyMedicalBuddy/MyMedicalBuddy`
- Build settings:
  ```yaml
  version: 1
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

## 3. Test Registration

After deployment, test with:

```bash
curl -X POST YOUR_API_URL/api/register \
  -H 'Content-Type: application/json' \
  -d '{"name":"Test User","email":"test@example.com","password":"password123"}'
```

Expected response:
```json
{
  "message": "User registered successfully",
  "token": "jwt_token_here",
  "user": {
    "id": "user_id",
    "name": "Test User",
    "email": "test@example.com",
    "role": "user"
  }
}
```

## 4. Access Application

- Frontend: Your Netlify/Amplify URL
- Backend API: Provided after deployment
- Register new users and login

## Troubleshooting

**Backend issues:**
```bash
aws logs tail /aws/lambda/medical-app --follow
```

**Frontend issues:**
- Check browser console
- Verify API URL in `.env.production`

## Clean Up

```bash
aws lambda delete-function --function-name medical-app
aws dynamodb delete-table --table-name Users
aws iam detach-role-policy --role-name medical-lambda-role --policy-arn arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole
aws iam delete-role --role-name medical-lambda-role
```