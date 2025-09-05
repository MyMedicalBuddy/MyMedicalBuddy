# Backend Deployment Guide

## Prerequisites

1. **AWS CLI installed and configured**:
   ```bash
   aws configure
   ```
   Enter your AWS Access Key ID, Secret Access Key, and preferred region.

2. **Node.js and npm installed** (for packaging dependencies)

## Deployment Options

### Option 1: Using Deployment Scripts (Recommended)

#### For Windows:
```cmd
deploy-backend-aws-cli.bat
```

#### For Linux/Mac:
```bash
chmod +x deploy-backend-aws-cli.sh
./deploy-backend-aws-cli.sh
```

### Option 2: Manual AWS CLI Commands

#### Step 1: Create DynamoDB Tables

```bash
# Set your region
REGION="eu-north-1"

# Create Users table
aws dynamodb create-table \
    --table-name Users \
    --attribute-definitions \
        AttributeName=id,AttributeType=S \
        AttributeName=email,AttributeType=S \
    --key-schema \
        AttributeName=id,KeyType=HASH \
    --global-secondary-indexes \
        'IndexName=EmailIndex,KeySchema=[{AttributeName=email,KeyType=HASH}],Projection={ProjectionType=ALL},BillingMode=PAY_PER_REQUEST' \
    --billing-mode PAY_PER_REQUEST \
    --region $REGION

# Create Cases table
aws dynamodb create-table \
    --table-name Cases \
    --attribute-definitions \
        AttributeName=id,AttributeType=S \
    --key-schema \
        AttributeName=id,KeyType=HASH \
    --billing-mode PAY_PER_REQUEST \
    --region $REGION

# Create Doctors table
aws dynamodb create-table \
    --table-name Doctors \
    --attribute-definitions \
        AttributeName=id,AttributeType=S \
    --key-schema \
        AttributeName=id,KeyType=HASH \
    --billing-mode PAY_PER_REQUEST \
    --region $REGION

# Create Messages table
aws dynamodb create-table \
    --table-name Messages \
    --attribute-definitions \
        AttributeName=id,AttributeType=S \
    --key-schema \
        AttributeName=id,KeyType=HASH \
    --billing-mode PAY_PER_REQUEST \
    --region $REGION
```

#### Step 2: Create IAM Role

```bash
# Create trust policy
cat > trust-policy.json << EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Service": "lambda.amazonaws.com"
      },
      "Action": "sts:AssumeRole"
    }
  ]
}
EOF

# Create IAM role
aws iam create-role \
    --role-name medical-opinion-lambda-role \
    --assume-role-policy-document file://trust-policy.json

# Attach basic Lambda execution policy
aws iam attach-role-policy \
    --role-name medical-opinion-lambda-role \
    --policy-arn arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole

# Get your AWS Account ID
AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)

# Create DynamoDB policy
cat > dynamodb-policy.json << EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "dynamodb:Query",
        "dynamodb:Scan",
        "dynamodb:GetItem",
        "dynamodb:PutItem",
        "dynamodb:UpdateItem",
        "dynamodb:DeleteItem"
      ],
      "Resource": [
        "arn:aws:dynamodb:$REGION:*:table/Users",
        "arn:aws:dynamodb:$REGION:*:table/Users/index/*",
        "arn:aws:dynamodb:$REGION:*:table/Cases",
        "arn:aws:dynamodb:$REGION:*:table/Doctors",
        "arn:aws:dynamodb:$REGION:*:table/Messages"
      ]
    }
  ]
}
EOF

# Create and attach DynamoDB policy
aws iam create-policy \
    --policy-name medical-opinion-dynamodb-policy \
    --policy-document file://dynamodb-policy.json

aws iam attach-role-policy \
    --role-name medical-opinion-lambda-role \
    --policy-arn arn:aws:iam::$AWS_ACCOUNT_ID:policy/medical-opinion-dynamodb-policy
```

#### Step 3: Package and Deploy Lambda Function

```bash
# Install production dependencies
cd server
npm install --production
cd ..

# Create deployment package
zip -r medical-backend.zip server/

# Create Lambda function
aws lambda create-function \
    --function-name medical-opinion-platform-api \
    --runtime nodejs18.x \
    --role arn:aws:iam::$AWS_ACCOUNT_ID:role/medical-opinion-lambda-role \
    --handler aws-index.handler \
    --zip-file fileb://medical-backend.zip \
    --environment Variables="{JWT_SECRET=medical-buddy-secret-key-2024,NODE_ENV=production}" \
    --region $REGION
```

#### Step 4: Create API Gateway

```bash
# Create API Gateway
API_ID=$(aws apigatewayv2 create-api \
    --name medical-opinion-api \
    --protocol-type HTTP \
    --cors-configuration AllowOrigins="*",AllowMethods="*",AllowHeaders="*" \
    --region $REGION \
    --query ApiId --output text)

# Create integration
INTEGRATION_ID=$(aws apigatewayv2 create-integration \
    --api-id $API_ID \
    --integration-type AWS_PROXY \
    --integration-uri arn:aws:lambda:$REGION:$AWS_ACCOUNT_ID:function:medical-opinion-platform-api \
    --payload-format-version 2.0 \
    --region $REGION \
    --query IntegrationId --output text)

# Create routes
aws apigatewayv2 create-route \
    --api-id $API_ID \
    --route-key 'ANY /{proxy+}' \
    --target integrations/$INTEGRATION_ID \
    --region $REGION

aws apigatewayv2 create-route \
    --api-id $API_ID \
    --route-key '$default' \
    --target integrations/$INTEGRATION_ID \
    --region $REGION

# Create stage
aws apigatewayv2 create-stage \
    --api-id $API_ID \
    --stage-name dev \
    --auto-deploy \
    --region $REGION

# Add Lambda permission for API Gateway
aws lambda add-permission \
    --function-name medical-opinion-platform-api \
    --statement-id api-gateway-invoke \
    --action lambda:InvokeFunction \
    --principal apigateway.amazonaws.com \
    --source-arn "arn:aws:execute-api:$REGION:$AWS_ACCOUNT_ID:$API_ID/*/*" \
    --region $REGION

echo "API Gateway URL: https://$API_ID.execute-api.$REGION.amazonaws.com/dev"
```

## Update Frontend Configuration

After deployment, update the frontend API URL:

1. **Update client/.env.production**:
   ```
   REACT_APP_API_URL=https://YOUR_API_ID.execute-api.eu-north-1.amazonaws.com/dev
   ```

2. **Redeploy frontend** on AWS Amplify or your hosting platform.

## Testing the Deployment

```bash
# Test health endpoint
curl https://YOUR_API_ID.execute-api.eu-north-1.amazonaws.com/dev/api/health

# Test registration
curl -X POST https://YOUR_API_ID.execute-api.eu-north-1.amazonaws.com/dev/api/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test User","email":"test@example.com","password":"password123"}'
```

## Troubleshooting

1. **Check Lambda logs**:
   ```bash
   aws logs describe-log-groups --log-group-name-prefix /aws/lambda/medical-opinion-platform-api
   aws logs tail /aws/lambda/medical-opinion-platform-api --follow
   ```

2. **Update Lambda function**:
   ```bash
   # After making changes to server code
   cd server && npm install --production && cd ..
   zip -r medical-backend.zip server/
   aws lambda update-function-code \
     --function-name medical-opinion-platform-api \
     --zip-file fileb://medical-backend.zip
   ```

3. **Check DynamoDB tables**:
   ```bash
   aws dynamodb list-tables
   aws dynamodb describe-table --table-name Users
   ```

## Clean Up Resources

To delete all resources:

```bash
# Delete Lambda function
aws lambda delete-function --function-name medical-opinion-platform-api

# Delete API Gateway
aws apigatewayv2 delete-api --api-id $API_ID

# Delete DynamoDB tables
aws dynamodb delete-table --table-name Users
aws dynamodb delete-table --table-name Cases
aws dynamodb delete-table --table-name Doctors
aws dynamodb delete-table --table-name Messages

# Delete IAM role and policies
aws iam detach-role-policy --role-name medical-opinion-lambda-role --policy-arn arn:aws:iam::$AWS_ACCOUNT_ID:policy/medical-opinion-dynamodb-policy
aws iam detach-role-policy --role-name medical-opinion-lambda-role --policy-arn arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole
aws iam delete-policy --policy-arn arn:aws:iam::$AWS_ACCOUNT_ID:policy/medical-opinion-dynamodb-policy
aws iam delete-role --role-name medical-opinion-lambda-role
```