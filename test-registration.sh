#!/bin/bash

echo "Testing registration endpoint..."

# Test the API endpoint
API_URL="https://YOUR_API_ID.execute-api.eu-north-1.amazonaws.com/prod"

echo "Testing health endpoint..."
curl -X GET "$API_URL/api/health"

echo -e "\n\nTesting registration..."
curl -X POST "$API_URL/api/register" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@example.com",
    "password": "password123",
    "role": "user",
    "country": "USA"
  }'

echo -e "\n\nChecking Lambda logs..."
aws logs tail /aws/lambda/medical-app-amplify --follow --region eu-north-1