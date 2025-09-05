#!/bin/bash

echo "Updating existing Lambda function with fixed code..."

# Package the fixed Lambda function
cd server
npm install --production --silent
zip -r ../lambda-update.zip .
cd ..

# Update the existing Lambda function that the frontend is using
aws lambda update-function-code \
  --function-name medical-opinion-platform-api \
  --zip-file fileb://lambda-update.zip \
  --region eu-north-1

echo "Lambda function updated successfully!"

# Test the API
echo "Testing the API..."
curl https://4kzlrotlw5.execute-api.eu-north-1.amazonaws.com/dev/api/health

echo -e "\n\nTesting registration..."
curl -X POST https://4kzlrotlw5.execute-api.eu-north-1.amazonaws.com/dev/api/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@example.com", 
    "password": "password123",
    "role": "user",
    "country": "USA"
  }'

rm lambda-update.zip