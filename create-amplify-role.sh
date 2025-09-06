#!/bin/bash

echo "Creating Amplify service role..."

AWS_ACCOUNT_ID=313549094027

# Create trust policy
cat > trust-policy.json << EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Service": ["amplify.amazonaws.com", "lambda.amazonaws.com"]
      },
      "Action": "sts:AssumeRole"
    }
  ]
}
EOF

# Create the role
aws iam create-role \
    --role-name amplifyconsole-backend-role \
    --assume-role-policy-document file://trust-policy.json

# Attach required policies
aws iam attach-role-policy \
    --role-name amplifyconsole-backend-role \
    --policy-arn arn:aws:iam::aws:policy/AWSLambda_FullAccess

aws iam attach-role-policy \
    --role-name amplifyconsole-backend-role \
    --policy-arn arn:aws:iam::aws:policy/AmazonAPIGatewayAdministrator

aws iam attach-role-policy \
    --role-name amplifyconsole-backend-role \
    --policy-arn arn:aws:iam::aws:policy/AmazonDynamoDBFullAccess

aws iam attach-role-policy \
    --role-name amplifyconsole-backend-role \
    --policy-arn arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole

aws iam attach-role-policy \
    --role-name amplifyconsole-backend-role \
    --policy-arn arn:aws:iam::aws:policy/IAMFullAccess

echo "✅ Role created: arn:aws:iam::$AWS_ACCOUNT_ID:role/amplifyconsole-backend-role"

rm trust-policy.json