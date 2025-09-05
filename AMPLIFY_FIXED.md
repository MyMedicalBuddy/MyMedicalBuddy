# 🚀 Fixed AWS Amplify Full-Stack Deployment

## 1. Create Amplify Service Role

```bash
# Create the service role
aws iam create-role --role-name amplifyconsole-backend-role --assume-role-policy-document '{
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

# Attach required policies
aws iam attach-role-policy --role-name amplifyconsole-backend-role --policy-arn arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole

# Create custom policy for full permissions
aws iam create-policy --policy-name AmplifyBackendPolicy --policy-document '{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "dynamodb:*",
        "lambda:*",
        "apigateway:*",
        "iam:PassRole",
        "logs:*"
      ],
      "Resource": "*"
    }
  ]
}'

# Get your account ID and attach the policy
AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
aws iam attach-role-policy --role-name amplifyconsole-backend-role --policy-arn arn:aws:iam::$AWS_ACCOUNT_ID:policy/AmplifyBackendPolicy
```

## 2. Deploy with AWS Amplify Console

### Step 1: Go to Amplify Console
- https://console.aws.amazon.com/amplify/

### Step 2: Connect Repository
- Click "New app" → "Host web app"
- Connect GitHub: `https://github.com/MyMedicalBuddy/MyMedicalBuddy`
- Select branch: `main`

### Step 3: Configure Build Settings
- Amplify will detect the `amplify.yml` file
- Or manually paste the build configuration

### Step 4: Add Environment Variables
- `AWS_ACCOUNT_ID`: Your AWS account ID (get with `aws sts get-caller-identity --query Account --output text`)
- `AWS_DEFAULT_REGION`: `eu-north-1`

### Step 5: Set Service Role
- In "Advanced settings"
- Select service role: `amplifyconsole-backend-role`

### Step 6: Deploy
- Click "Save and deploy"
- Wait for build to complete (5-10 minutes)

## What This Deploys

✅ **DynamoDB Table**: Users table with EmailIndex  
✅ **Lambda Function**: `medical-app-amplify` with authentication  
✅ **API Gateway**: HTTP API with CORS enabled  
✅ **Frontend**: React app with correct API URL  
✅ **Auto-Deploy**: Updates on every Git push  

## Key Fixes Made

1. **Proper IAM Role**: Uses `amplifyconsole-backend-role` instead of missing role
2. **Error Handling**: Commands continue even if resources exist
3. **Unique Names**: Uses `-amplify` suffix to avoid conflicts
4. **Environment Variables**: Properly configured for Lambda
5. **Permissions**: Lambda permission for API Gateway access

## Testing After Deployment

1. **Get your Amplify URL** (e.g., `https://main.d1234567890.amplifyapp.com`)

2. **Test backend API**:
```bash
# Get API URL from Amplify build logs or check Lambda function
curl https://YOUR_API_ID.execute-api.eu-north-1.amazonaws.com/prod/api/health
```

3. **Test registration**:
```bash
curl -X POST https://YOUR_API_ID.execute-api.eu-north-1.amazonaws.com/prod/api/register \
  -H 'Content-Type: application/json' \
  -d '{"name":"Test User","email":"test@example.com","password":"password123"}'
```

4. **Use the web app** at your Amplify URL

## Troubleshooting

**If build fails:**
1. Check Amplify build logs for specific errors
2. Verify service role has all required permissions
3. Ensure environment variables are set correctly

**If API doesn't work:**
1. Check Lambda function logs in CloudWatch
2. Verify API Gateway integration
3. Test Lambda function directly in AWS Console

## Benefits

- ✅ Complete full-stack deployment
- ✅ Infrastructure as Code
- ✅ Auto-deploy on Git push
- ✅ Scalable serverless architecture
- ✅ Built-in HTTPS and CDN