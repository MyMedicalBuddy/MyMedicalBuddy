#!/bin/bash

echo "Deploying Medical Opinion Platform Backend using AWS CLI..."

# Set variables
REGION="eu-north-1"
FUNCTION_NAME="medical-opinion-platform-api"
ROLE_NAME="medical-opinion-lambda-role"
ZIP_FILE="medical-backend.zip"

echo ""
echo "Step 1: Creating DynamoDB Tables..."

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

echo ""
echo "Step 2: Creating IAM Role for Lambda..."

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
    --role-name $ROLE_NAME \
    --assume-role-policy-document file://trust-policy.json \
    --region $REGION

# Attach basic Lambda execution policy
aws iam attach-role-policy \
    --role-name $ROLE_NAME \
    --policy-arn arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole \
    --region $REGION

# Get AWS Account ID
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
    --policy-document file://dynamodb-policy.json \
    --region $REGION

aws iam attach-role-policy \
    --role-name $ROLE_NAME \
    --policy-arn arn:aws:iam::$AWS_ACCOUNT_ID:policy/medical-opinion-dynamodb-policy \
    --region $REGION

echo ""
echo "Step 3: Creating deployment package..."

# Create deployment package
cd server
npm install --production
cd ..
zip -r $ZIP_FILE server/

echo ""
echo "Step 4: Creating Lambda function..."

# Wait for role to be ready
sleep 10

# Create Lambda function
aws lambda create-function \
    --function-name $FUNCTION_NAME \
    --runtime nodejs18.x \
    --role arn:aws:iam::$AWS_ACCOUNT_ID:role/$ROLE_NAME \
    --handler aws-index.handler \
    --zip-file fileb://$ZIP_FILE \
    --environment Variables="{JWT_SECRET=medical-buddy-secret-key-2024,NODE_ENV=production}" \
    --region $REGION

echo ""
echo "Step 5: Creating API Gateway..."

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
    --integration-uri arn:aws:lambda:$REGION:$AWS_ACCOUNT_ID:function:$FUNCTION_NAME \
    --payload-format-version 2.0 \
    --region $REGION \
    --query IntegrationId --output text)

# Create route
aws apigatewayv2 create-route \
    --api-id $API_ID \
    --route-key 'ANY /{proxy+}' \
    --target integrations/$INTEGRATION_ID \
    --region $REGION

# Create default route
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
    --function-name $FUNCTION_NAME \
    --statement-id api-gateway-invoke \
    --action lambda:InvokeFunction \
    --principal apigateway.amazonaws.com \
    --source-arn "arn:aws:execute-api:$REGION:$AWS_ACCOUNT_ID:$API_ID/*/*" \
    --region $REGION

echo ""
echo "Deployment complete!"
echo ""
echo "API Gateway URL: https://$API_ID.execute-api.$REGION.amazonaws.com/dev"
echo ""
echo "Clean up temporary files..."
rm -f trust-policy.json dynamodb-policy.json $ZIP_FILE

echo ""
echo "Backend deployed successfully!"