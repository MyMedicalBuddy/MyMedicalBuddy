# AWS Amplify Auto-Deploy Setup

## What's Updated

✅ **amplify.yml** - Added backend deployment phase
✅ **serverless-aws.yml** - DynamoDB backend configuration  
✅ **aws-index.js** - Lambda-compatible server
✅ **aws-db.js** - DynamoDB database adapter

## Deployment Process

1. **Push to GitHub**:
   ```bash
   git add .
   git commit -m "Add AWS serverless backend with DynamoDB"
   git push origin main
   ```

2. **AWS Amplify will automatically**:
   - Deploy DynamoDB tables
   - Deploy Lambda API functions
   - Build and deploy React frontend
   - Connect frontend to backend API

## Environment Variables Needed in Amplify

Set these in AWS Amplify Console → Environment Variables:

```
JWT_SECRET=your-super-secure-secret-key
AWS_REGION=us-east-1
NODE_ENV=production
```

## After Deployment

1. **Get API Gateway URL** from Amplify build logs
2. **Update client/.env.production** with actual API URL
3. **Test login/registration** - should work with DynamoDB

## Cost Estimate

- **Lambda**: ~$0.20/month (100K requests)
- **DynamoDB**: ~$1.25/month (1M operations)  
- **API Gateway**: ~$0.35/month (100K requests)
- **Amplify Hosting**: Free tier available

**Total**: ~$2-5/month

## Troubleshooting

If deployment fails:
1. Check Amplify build logs
2. Verify AWS permissions for DynamoDB
3. Ensure serverless version compatibility
4. Check environment variables are set