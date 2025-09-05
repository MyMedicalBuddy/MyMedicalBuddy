#!/bin/bash

echo "🚀 Simple Medical Platform Deployment"
echo "===================================="

REGION="eu-north-1"
FUNCTION_NAME="medical-app"

# Step 1: Create DynamoDB table
echo "Creating database..."
aws dynamodb create-table \
    --table-name Users \
    --attribute-definitions AttributeName=id,AttributeType=S AttributeName=email,AttributeType=S \
    --key-schema AttributeName=id,KeyType=HASH \
    --global-secondary-indexes 'IndexName=EmailIndex,KeySchema=[{AttributeName=email,KeyType=HASH}],Projection={ProjectionType=ALL},BillingMode=PAY_PER_REQUEST' \
    --billing-mode PAY_PER_REQUEST \
    --region $REGION > /dev/null 2>&1

# Step 2: Create Lambda function
echo "Creating backend..."
cat > index.js << 'EOF'
const AWS = require('aws-sdk');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');

const dynamodb = new AWS.DynamoDB.DocumentClient();
const JWT_SECRET = 'medical-secret-2024';

exports.handler = async (event) => {
    const path = event.rawPath || event.path || '';
    const method = event.requestContext?.http?.method || event.httpMethod || 'GET';
    const body = event.body ? JSON.parse(event.body) : {};
    
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': '*',
        'Access-Control-Allow-Methods': '*',
        'Content-Type': 'application/json'
    };

    try {
        // Health check
        if (path === '/api/health') {
            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({ status: 'OK', timestamp: new Date().toISOString() })
            };
        }

        // Register
        if (path === '/api/register' && method === 'POST') {
            const { name, email, password, role = 'user' } = body;
            
            // Check if user exists
            const existing = await dynamodb.query({
                TableName: 'Users',
                IndexName: 'EmailIndex',
                KeyConditionExpression: 'email = :email',
                ExpressionAttributeValues: { ':email': email }
            }).promise();
            
            if (existing.Items.length > 0) {
                return {
                    statusCode: 400,
                    headers,
                    body: JSON.stringify({ error: 'User already exists' })
                };
            }

            // Create user
            const hashedPassword = await bcrypt.hash(password, 10);
            const user = {
                id: uuidv4(),
                name,
                email,
                password: hashedPassword,
                role,
                createdAt: new Date().toISOString()
            };

            await dynamodb.put({
                TableName: 'Users',
                Item: user
            }).promise();

            const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET);
            
            return {
                statusCode: 201,
                headers,
                body: JSON.stringify({
                    message: 'User registered successfully',
                    token,
                    user: { id: user.id, name: user.name, email: user.email, role: user.role }
                })
            };
        }

        // Login
        if (path === '/api/login' && method === 'POST') {
            const { email, password } = body;
            
            const result = await dynamodb.query({
                TableName: 'Users',
                IndexName: 'EmailIndex',
                KeyConditionExpression: 'email = :email',
                ExpressionAttributeValues: { ':email': email }
            }).promise();
            
            const user = result.Items[0];
            if (!user || !await bcrypt.compare(password, user.password)) {
                return {
                    statusCode: 400,
                    headers,
                    body: JSON.stringify({ error: 'Invalid credentials' })
                };
            }

            const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET);
            
            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({
                    message: 'Login successful',
                    token,
                    user: { id: user.id, name: user.name, email: user.email, role: user.role }
                })
            };
        }

        return {
            statusCode: 404,
            headers,
            body: JSON.stringify({ error: 'Not found' })
        };

    } catch (error) {
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ error: error.message })
        };
    }
};
EOF

# Create package.json
cat > package.json << 'EOF'
{
  "name": "medical-backend",
  "dependencies": {
    "aws-sdk": "^2.1490.0",
    "bcryptjs": "^2.4.3",
    "jsonwebtoken": "^9.0.2",
    "uuid": "^9.0.1"
  }
}
EOF

npm install --production --silent
zip -r function.zip . > /dev/null

# Create IAM role
aws iam create-role \
    --role-name medical-lambda-role \
    --assume-role-policy-document '{
        "Version": "2012-10-17",
        "Statement": [{
            "Effect": "Allow",
            "Principal": {"Service": "lambda.amazonaws.com"},
            "Action": "sts:AssumeRole"
        }]
    }' > /dev/null 2>&1

aws iam attach-role-policy \
    --role-name medical-lambda-role \
    --policy-arn arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole > /dev/null 2>&1

AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)

aws iam create-policy \
    --policy-name medical-dynamodb-policy \
    --policy-document '{
        "Version": "2012-10-17",
        "Statement": [{
            "Effect": "Allow",
            "Action": ["dynamodb:*"],
            "Resource": ["arn:aws:dynamodb:'$REGION':*:table/Users*"]
        }]
    }' > /dev/null 2>&1

aws iam attach-role-policy \
    --role-name medical-lambda-role \
    --policy-arn arn:aws:iam::$AWS_ACCOUNT_ID:policy/medical-dynamodb-policy > /dev/null 2>&1

sleep 10

# Create Lambda function
aws lambda create-function \
    --function-name $FUNCTION_NAME \
    --runtime nodejs18.x \
    --role arn:aws:iam::$AWS_ACCOUNT_ID:role/medical-lambda-role \
    --handler index.handler \
    --zip-file fileb://function.zip \
    --region $REGION > /dev/null 2>&1

# Step 3: Create API Gateway
echo "Creating API..."
API_ID=$(aws apigatewayv2 create-api \
    --name medical-api \
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
    --region $REGION > /dev/null

aws apigatewayv2 create-stage \
    --api-id $API_ID \
    --stage-name prod \
    --auto-deploy \
    --region $REGION > /dev/null

aws lambda add-permission \
    --function-name $FUNCTION_NAME \
    --statement-id api-gateway \
    --action lambda:InvokeFunction \
    --principal apigateway.amazonaws.com \
    --source-arn "arn:aws:execute-api:$REGION:$AWS_ACCOUNT_ID:$API_ID/*/*" \
    --region $REGION > /dev/null 2>&1

API_URL="https://$API_ID.execute-api.$REGION.amazonaws.com/prod"

echo "✅ Backend deployed!"
echo "API URL: $API_URL"

# Step 4: Configure frontend
echo "Configuring frontend..."
echo "REACT_APP_API_URL=$API_URL" > client/.env.production

echo ""
echo "🎉 DEPLOYMENT COMPLETE!"
echo "======================"
echo ""
echo "Backend API: $API_URL"
echo ""
echo "Test registration:"
echo "curl -X POST $API_URL/api/register \\"
echo "  -H 'Content-Type: application/json' \\"
echo "  -d '{\"name\":\"Test User\",\"email\":\"test@example.com\",\"password\":\"password123\"}'"
echo ""
echo "Deploy frontend to Netlify:"
echo "1. cd client && npm run build"
echo "2. Upload client/build folder to Netlify"

rm -f index.js package.json package-lock.json function.zip
rm -rf node_modules