#!/bin/bash

echo "🔧 Setting up Amplify IAM Role for Full-Stack Deployment"
echo "======================================================"

# Set AWS Account ID
AWS_ACCOUNT_ID=313549094027
echo "AWS Account ID: $AWS_ACCOUNT_ID"

# Create trust policy for Amplify
cat > amplify-trust-policy.json << EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Service": [
          "amplify.amazonaws.com",
          "lambda.amazonaws.com"
        ]
      },
      "Action": "sts:AssumeRole"
    }
  ]
}
EOF

# Create the Amplify service role
echo "Creating Amplify service role..."
aws iam create-role \
    --role-name amplifyconsole-backend-role \
    --assume-role-policy-document file://amplify-trust-policy.json \
    --description "Service role for Amplify Console backend operations"

# Create comprehensive policy for Amplify backend operations
cat > amplify-backend-policy.json << EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "lambda:*",
        "apigateway:*",
        "dynamodb:*",
        "iam:PassRole",
        "iam:GetRole",
        "logs:*",
        "cloudformation:*",
        "s3:*"
      ],
      "Resource": "*"
    }
  ]
}
EOF

# Create and attach the policy
echo "Creating and attaching backend policy..."
aws iam create-policy \
    --policy-name AmplifyBackendFullAccess \
    --policy-document file://amplify-backend-policy.json \
    --description "Full access policy for Amplify backend operations"

# Attach policies to the role
aws iam attach-role-policy \
    --role-name amplifyconsole-backend-role \
    --policy-arn arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole

aws iam attach-role-policy \
    --role-name amplifyconsole-backend-role \
    --policy-arn arn:aws:iam::$AWS_ACCOUNT_ID:policy/AmplifyBackendFullAccess

echo "✅ IAM Role setup complete!"
echo ""
echo "Role ARN: arn:aws:iam::$AWS_ACCOUNT_ID:role/amplifyconsole-backend-role"
echo ""
echo "Next steps:"
echo "1. Go to AWS Amplify Console"
echo "2. Connect your GitHub repository"
echo "3. Set environment variables:"
echo "   - AWS_ACCOUNT_ID: $AWS_ACCOUNT_ID"
echo "   - AWS_DEFAULT_REGION: eu-north-1"
echo "4. Select service role: amplifyconsole-backend-role"
echo "5. Deploy!"

# Cleanup
rm -f amplify-trust-policy.json amplify-backend-policy.json