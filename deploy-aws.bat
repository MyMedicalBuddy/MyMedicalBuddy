@echo off
echo 🚀 Deploying Medical Opinion Platform to AWS...

echo 📦 Building application...
call npm run build

echo 🔧 Deploying API to AWS Lambda...
call npx serverless deploy --stage prod

echo ✅ Deployment complete!
echo 🔗 Check AWS Console for URLs