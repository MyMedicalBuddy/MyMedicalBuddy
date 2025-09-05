#!/bin/bash

echo "🚀 Deploying Medical Opinion Platform to AWS..."

# Build the application
echo "📦 Building application..."
npm run build

# Deploy using Serverless Framework
echo "🔧 Deploying API to AWS Lambda..."
npx serverless deploy --stage prod

# Deploy frontend to S3/CloudFront (if using CDK)
echo "🌐 Deploying frontend..."
aws s3 sync client/build/ s3://medical-opinion-website-$(aws sts get-caller-identity --query Account --output text)/ --delete

echo "✅ Deployment complete!"
echo "🔗 Check AWS Console for URLs"