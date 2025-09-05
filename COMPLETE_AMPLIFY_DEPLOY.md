# 🚀 Complete Amplify Full-Stack Deployment (Fixed)

## Step 1: Setup IAM Roles (One-time)

Run the setup script to create proper IAM roles:

```bash
chmod +x setup-amplify-role.sh
./setup-amplify-role.sh
```

This creates:
- `amplifyconsole-backend-role` with full permissions
- Proper trust relationships for Amplify and Lambda
- All required policies for backend operations

## Step 2: Deploy with AWS Amplify

### 1. Go to AWS Amplify Console
- https://console.aws.amazon.com/amplify/

### 2. Connect Repository
- Click "New app" → "Host web app"
- Connect GitHub: `https://github.com/MyMedicalBuddy/MyMedicalBuddy`
- Select branch: `main`

### 3. Configure Build Settings
- Amplify will auto-detect the `amplify.yml` file
- The configuration now handles:
  - Proper error handling
  - Resource existence checks
  - Robust deployment process

### 4. Set Environment Variables
**CRITICAL**: Add these environment variables in Amplify:
- `AWS_ACCOUNT_ID`: Your AWS account ID (from setup script output)
- `AWS_DEFAULT_REGION`: `eu-north-1`

### 5. Set Service Role
- In "Advanced settings"
- Select: `amplifyconsole-backend-role`

### 6. Deploy
- Click "Save and deploy"
- Monitor build logs for progress

## What This Deployment Creates

✅ **DynamoDB Table**: Users with EmailIndex GSI  
✅ **Lambda Function**: `medical-app-amplify` with authentication  
✅ **API Gateway**: HTTP API with CORS enabled  
✅ **Frontend**: React app with automatic API URL configuration  
✅ **Auto-Deploy**: Updates on every Git push  

## Key Fixes Applied

1. **Proper IAM Role**: Created with correct trust policy and permissions
2. **Error Handling**: Commands continue even if resources exist
3. **Resource Checks**: Verifies existing resources before creating new ones
4. **Robust Configuration**: Handles edge cases and failures gracefully
5. **Environment Variables**: Properly configured for Lambda function

## Testing After Deployment

1. **Get your Amplify URL** (e.g., `https://main.d1234567890.amplifyapp.com`)

2. **Test backend health**:
```bash
# API URL will be shown in build logs
curl https://YOUR_API_ID.execute-api.eu-north-1.amazonaws.com/prod/api/health
```

3. **Test registration**:
```bash
curl -X POST https://YOUR_API_ID.execute-api.eu-north-1.amazonaws.com/prod/api/register \
  -H 'Content-Type: application/json' \
  -d '{"name":"Test User","email":"test@example.com","password":"password123"}'
```

4. **Use the web application** at your Amplify URL

## Troubleshooting

**If build still fails:**
1. Check that environment variables are set correctly
2. Verify the service role is attached
3. Check build logs for specific error messages
4. Ensure your AWS account has sufficient permissions

**Common Issues:**
- Missing environment variables → Add AWS_ACCOUNT_ID and AWS_DEFAULT_REGION
- Wrong service role → Select amplifyconsole-backend-role
- Permission errors → Run the setup script again

## Benefits

- ✅ Complete infrastructure as code
- ✅ Automatic backend and frontend deployment
- ✅ Proper error handling and recovery
- ✅ Scalable serverless architecture
- ✅ Built-in monitoring and logging

The fixed configuration is now ready for successful deployment!