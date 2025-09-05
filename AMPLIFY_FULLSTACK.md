# 🚀 AWS Amplify Full-Stack Deployment

## Setup (One-time)

### 1. Create IAM Role for Amplify

```bash
aws iam create-role --role-name amplify-lambda-role --assume-role-policy-document '{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Service": ["lambda.amazonaws.com", "amplify.amazonaws.com"]
      },
      "Action": "sts:AssumeRole"
    }
  ]
}'

aws iam attach-role-policy --role-name amplify-lambda-role --policy-arn arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole

aws iam create-policy --policy-name AmplifyFullStackPolicy --policy-document '{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "dynamodb:*",
        "lambda:*",
        "apigateway:*",
        "iam:PassRole"
      ],
      "Resource": "*"
    }
  ]
}'

AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
aws iam attach-role-policy --role-name amplify-lambda-role --policy-arn arn:aws:iam::$AWS_ACCOUNT_ID:policy/AmplifyFullStackPolicy
```

### 2. Deploy with AWS Amplify

1. **Go to AWS Amplify Console**
   - https://console.aws.amazon.com/amplify/

2. **Connect Repository**
   - Click "New app" → "Host web app"
   - Connect GitHub: `https://github.com/MyMedicalBuddy/MyMedicalBuddy`
   - Select branch: `main`

3. **Build Settings**
   - Amplify will auto-detect the `amplify.yml` file
   - Or paste this configuration:

```yaml
version: 1
backend:
  phases:
    build:
      commands:
        - echo "Deploying backend..."
        - aws dynamodb create-table --table-name Users --attribute-definitions AttributeName=id,AttributeType=S AttributeName=email,AttributeType=S --key-schema AttributeName=id,KeyType=HASH --global-secondary-indexes 'IndexName=EmailIndex,KeySchema=[{AttributeName=email,KeyType=HASH}],Projection={ProjectionType=ALL},BillingMode=PAY_PER_REQUEST' --billing-mode PAY_PER_REQUEST --region $AWS_DEFAULT_REGION || true
        - cd server && npm install --production && zip -r ../backend.zip . && cd ..
        - aws lambda create-function --function-name medical-app-$AWS_BRANCH --runtime nodejs18.x --role arn:aws:iam::$AWS_ACCOUNT_ID:role/amplify-lambda-role --handler aws-index.handler --zip-file fileb://backend.zip --region $AWS_DEFAULT_REGION || aws lambda update-function-code --function-name medical-app-$AWS_BRANCH --zip-file fileb://backend.zip --region $AWS_DEFAULT_REGION
        - API_ID=$(aws apigatewayv2 create-api --name medical-api-$AWS_BRANCH --protocol-type HTTP --cors-configuration AllowOrigins="*",AllowMethods="*",AllowHeaders="*" --region $AWS_DEFAULT_REGION --query ApiId --output text)
        - echo "REACT_APP_API_URL=https://$API_ID.execute-api.$AWS_DEFAULT_REGION.amazonaws.com/prod" > client/.env.production
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

4. **Environment Variables**
   - Add `AWS_ACCOUNT_ID` with your account ID
   - Add `AWS_DEFAULT_REGION` = `eu-north-1`

5. **Service Role**
   - Attach the `amplify-lambda-role` created above

6. **Deploy**
   - Click "Save and deploy"
   - Amplify will build both backend and frontend

## What This Does

✅ **Backend Deployment:**
- Creates DynamoDB Users table
- Deploys Lambda function from `/server` directory
- Creates API Gateway with CORS
- Sets up all permissions

✅ **Frontend Deployment:**
- Builds React app from `/client` directory
- Automatically configures API URL
- Serves static files via CloudFront CDN

✅ **Auto-Deploy:**
- Every Git push triggers new deployment
- Backend and frontend stay in sync

## Testing

After deployment:

1. **Get your Amplify URL** (e.g., `https://main.d1234567890.amplifyapp.com`)

2. **Test registration:**
```bash
curl -X POST https://YOUR_API_URL/api/register \
  -H 'Content-Type: application/json' \
  -d '{"name":"Test User","email":"test@example.com","password":"password123"}'
```

3. **Access the app** at your Amplify URL

## Benefits

- ✅ Single deployment for full-stack app
- ✅ Auto-deploy on Git push
- ✅ Built-in CI/CD pipeline
- ✅ CloudFront CDN for frontend
- ✅ Automatic HTTPS
- ✅ Branch-based deployments

## Cost

- **Amplify**: ~$0.01 per build minute + $0.15/GB bandwidth
- **Lambda**: ~$0.20 per 1M requests
- **DynamoDB**: ~$1.25 per 25GB storage
- **API Gateway**: ~$3.50 per 1M requests

**Total**: ~$5-10/month for moderate usage