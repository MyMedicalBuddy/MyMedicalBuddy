# 🚀 Simple Amplify Frontend Deployment

## Deploy Backend First (5 minutes)

Use the existing working backend:
```bash
# Your backend is already deployed at:
# https://4kzlrotlw5.execute-api.eu-north-1.amazonaws.com/dev
```

Or deploy a new one:
```bash
chmod +x simple-deploy.sh
./simple-deploy.sh
```

## Deploy Frontend with Amplify (2 minutes)

### 1. Go to AWS Amplify Console
- https://console.aws.amazon.com/amplify/

### 2. Connect Repository
- Click "New app" → "Host web app"
- Connect GitHub: `https://github.com/MyMedicalBuddy/MyMedicalBuddy`
- Select branch: `main`

### 3. Build Settings
Amplify will auto-detect the `amplify.yml` file which:
- Builds React app from `client/` directory
- Uses existing backend API
- Deploys to CloudFront CDN

### 4. Deploy
- Click "Save and deploy"
- Wait 3-5 minutes for build completion

## Result

✅ **Frontend URL**: `https://main.d1234567890.amplifyapp.com`  
✅ **Backend API**: `https://4kzlrotlw5.execute-api.eu-north-1.amazonaws.com/dev`  
✅ **Working registration/login**  
✅ **Auto-deploy on Git push**  

## Test Registration

1. Go to your Amplify URL
2. Click "Register" 
3. Fill form and submit
4. Should see success message with JWT token

Or test via API:
```bash
curl -X POST https://4kzlrotlw5.execute-api.eu-north-1.amazonaws.com/dev/api/register \
  -H 'Content-Type: application/json' \
  -d '{"name":"Test User","email":"test@example.com","password":"password123"}'
```

## Benefits

- ✅ Simple frontend-only deployment
- ✅ Uses existing working backend
- ✅ Auto HTTPS and CDN
- ✅ Auto-deploy on Git push
- ✅ No complex IAM setup needed