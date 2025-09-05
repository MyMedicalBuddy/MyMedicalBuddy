#!/bin/bash

echo "🏥 Medical Opinion Platform - Complete Deployment"
echo "================================================"

# Configuration
REGION="eu-north-1"
FUNCTION_NAME="medical-opinion-platform-api"
ROLE_NAME="medical-opinion-lambda-role"
POLICY_NAME="medical-opinion-dynamodb-policy"

# Get AWS Account ID
AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
echo "AWS Account ID: $AWS_ACCOUNT_ID"
echo "Region: $REGION"
echo ""

# Step 1: Backend Deployment
echo "🚀 Step 1: Deploying Backend..."

# Create DynamoDB Tables
echo "Creating DynamoDB tables..."
aws dynamodb create-table \
    --table-name Users \
    --attribute-definitions AttributeName=id,AttributeType=S AttributeName=email,AttributeType=S \
    --key-schema AttributeName=id,KeyType=HASH \
    --global-secondary-indexes 'IndexName=EmailIndex,KeySchema=[{AttributeName=email,KeyType=HASH}],Projection={ProjectionType=ALL},BillingMode=PAY_PER_REQUEST' \
    --billing-mode PAY_PER_REQUEST \
    --region $REGION > /dev/null 2>&1

aws dynamodb create-table \
    --table-name Cases \
    --attribute-definitions AttributeName=id,AttributeType=S \
    --key-schema AttributeName=id,KeyType=HASH \
    --billing-mode PAY_PER_REQUEST \
    --region $REGION > /dev/null 2>&1

aws dynamodb create-table \
    --table-name Doctors \
    --attribute-definitions AttributeName=id,AttributeType=S \
    --key-schema AttributeName=id,KeyType=HASH \
    --billing-mode PAY_PER_REQUEST \
    --region $REGION > /dev/null 2>&1

aws dynamodb create-table \
    --table-name Messages \
    --attribute-definitions AttributeName=id,AttributeType=S \
    --key-schema AttributeName=id,KeyType=HASH \
    --billing-mode PAY_PER_REQUEST \
    --region $REGION > /dev/null 2>&1

# Create IAM Role
echo "Creating IAM role..."
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

aws iam create-role \
    --role-name $ROLE_NAME \
    --assume-role-policy-document file://trust-policy.json > /dev/null 2>&1

aws iam attach-role-policy \
    --role-name $ROLE_NAME \
    --policy-arn arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole > /dev/null 2>&1

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

aws iam create-policy \
    --policy-name $POLICY_NAME \
    --policy-document file://dynamodb-policy.json > /dev/null 2>&1

aws iam attach-role-policy \
    --role-name $ROLE_NAME \
    --policy-arn arn:aws:iam::$AWS_ACCOUNT_ID:policy/$POLICY_NAME > /dev/null 2>&1

# Package Lambda
echo "Packaging Lambda function..."
cd server
npm install --production --silent
cd ..
zip -r medical-backend.zip server/ > /dev/null 2>&1

# Wait for role propagation
echo "Waiting for IAM role propagation..."
sleep 15

# Create Lambda function
echo "Creating Lambda function..."
aws lambda create-function \
    --function-name $FUNCTION_NAME \
    --runtime nodejs18.x \
    --role arn:aws:iam::$AWS_ACCOUNT_ID:role/$ROLE_NAME \
    --handler aws-index.handler \
    --zip-file fileb://medical-backend.zip \
    --environment Variables="{JWT_SECRET=medical-buddy-secret-key-2024,NODE_ENV=production}" \
    --region $REGION > /dev/null 2>&1

# Create API Gateway
echo "Creating API Gateway..."
API_ID=$(aws apigatewayv2 create-api \
    --name medical-opinion-api \
    --protocol-type HTTP \
    --cors-configuration AllowOrigins="*",AllowMethods="*",AllowHeaders="*" \
    --region $REGION \
    --query ApiId --output text)

INTEGRATION_ID=$(aws apigatewayv2 create-integration \
    --api-id $API_ID \
    --integration-type AWS_PROXY \
    --integration-uri arn:aws:lambda:$REGION:$AWS_ACCOUNT_ID:function:$FUNCTION_NAME \
    --payload-format-version 2.0 \
    --region $REGION \
    --query IntegrationId --output text)

aws apigatewayv2 create-route \
    --api-id $API_ID \
    --route-key 'ANY /{proxy+}' \
    --target integrations/$INTEGRATION_ID \
    --region $REGION > /dev/null 2>&1

aws apigatewayv2 create-route \
    --api-id $API_ID \
    --route-key '$default' \
    --target integrations/$INTEGRATION_ID \
    --region $REGION > /dev/null 2>&1

aws apigatewayv2 create-stage \
    --api-id $API_ID \
    --stage-name dev \
    --auto-deploy \
    --region $REGION > /dev/null 2>&1

aws lambda add-permission \
    --function-name $FUNCTION_NAME \
    --statement-id api-gateway-invoke \
    --action lambda:InvokeFunction \
    --principal apigateway.amazonaws.com \
    --source-arn "arn:aws:execute-api:$REGION:$AWS_ACCOUNT_ID:$API_ID/*/*" \
    --region $REGION > /dev/null 2>&1

API_URL="https://$API_ID.execute-api.$REGION.amazonaws.com/dev"
echo "✅ Backend deployed successfully!"
echo "API URL: $API_URL"

# Step 2: Frontend Configuration
echo ""
echo "🎨 Step 2: Configuring Frontend..."

# Update frontend environment
cat > client/.env.production << EOF
REACT_APP_API_URL=$API_URL
EOF

echo "✅ Frontend configured!"

# Step 3: Build Frontend
echo ""
echo "📦 Step 3: Building Frontend..."
cd client
npm install --silent
npm run build --silent
cd ..
echo "✅ Frontend built successfully!"

# Step 4: Deploy to AWS Amplify (optional)
echo ""
echo "🌐 Step 4: AWS Amplify Deployment (Optional)"
echo "To deploy frontend to AWS Amplify:"
echo "1. Go to AWS Amplify Console"
echo "2. Connect your GitHub repository: https://github.com/MyMedicalBuddy/MyMedicalBuddy"
echo "3. Use these build settings:"
echo ""
cat > amplify.yml << EOF
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
  cache:
    paths:
      - client/node_modules/**/*
EOF

# Cleanup
echo ""
echo "🧹 Cleaning up temporary files..."
rm -f trust-policy.json dynamodb-policy.json medical-backend.zip

echo ""
echo "🎉 DEPLOYMENT COMPLETE!"
echo "========================"
echo ""
echo "📋 Deployment Summary:"
echo "• Backend API: $API_URL"
echo "• DynamoDB Tables: Users, Cases, Doctors, Messages"
echo "• Lambda Function: $FUNCTION_NAME"
echo "• Frontend Build: client/build/"
echo ""
echo "🔗 Next Steps:"
echo "1. Test API: curl $API_URL/api/health"
echo "2. Deploy frontend to AWS Amplify or your preferred hosting"
echo "3. Update DNS settings if using custom domain"
echo ""
echo "📚 Documentation:"
echo "• README.md - Application overview"
echo "• BACKEND_DEPLOYMENT.md - Detailed backend deployment"
echo "• GitHub: https://github.com/MyMedicalBuddy/MyMedicalBuddy"