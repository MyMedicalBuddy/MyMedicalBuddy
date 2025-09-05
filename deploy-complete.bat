@echo off
echo 🏥 Medical Opinion Platform - Complete Deployment
echo ================================================

REM Configuration
set REGION=eu-north-1
set FUNCTION_NAME=medical-opinion-platform-api
set ROLE_NAME=medical-opinion-lambda-role
set POLICY_NAME=medical-opinion-dynamodb-policy

REM Get AWS Account ID
for /f "tokens=*" %%i in ('aws sts get-caller-identity --query Account --output text') do set AWS_ACCOUNT_ID=%%i
echo AWS Account ID: %AWS_ACCOUNT_ID%
echo Region: %REGION%
echo.

REM Step 1: Backend Deployment
echo 🚀 Step 1: Deploying Backend...

REM Create DynamoDB Tables
echo Creating DynamoDB tables...
aws dynamodb create-table --table-name Users --attribute-definitions AttributeName=id,AttributeType=S AttributeName=email,AttributeType=S --key-schema AttributeName=id,KeyType=HASH --global-secondary-indexes "IndexName=EmailIndex,KeySchema=[{AttributeName=email,KeyType=HASH}],Projection={ProjectionType=ALL},BillingMode=PAY_PER_REQUEST" --billing-mode PAY_PER_REQUEST --region %REGION% >nul 2>&1

aws dynamodb create-table --table-name Cases --attribute-definitions AttributeName=id,AttributeType=S --key-schema AttributeName=id,KeyType=HASH --billing-mode PAY_PER_REQUEST --region %REGION% >nul 2>&1

aws dynamodb create-table --table-name Doctors --attribute-definitions AttributeName=id,AttributeType=S --key-schema AttributeName=id,KeyType=HASH --billing-mode PAY_PER_REQUEST --region %REGION% >nul 2>&1

aws dynamodb create-table --table-name Messages --attribute-definitions AttributeName=id,AttributeType=S --key-schema AttributeName=id,KeyType=HASH --billing-mode PAY_PER_REQUEST --region %REGION% >nul 2>&1

REM Create IAM Role
echo Creating IAM role...
echo { > trust-policy.json
echo   "Version": "2012-10-17", >> trust-policy.json
echo   "Statement": [ >> trust-policy.json
echo     { >> trust-policy.json
echo       "Effect": "Allow", >> trust-policy.json
echo       "Principal": { >> trust-policy.json
echo         "Service": "lambda.amazonaws.com" >> trust-policy.json
echo       }, >> trust-policy.json
echo       "Action": "sts:AssumeRole" >> trust-policy.json
echo     } >> trust-policy.json
echo   ] >> trust-policy.json
echo } >> trust-policy.json

aws iam create-role --role-name %ROLE_NAME% --assume-role-policy-document file://trust-policy.json >nul 2>&1
aws iam attach-role-policy --role-name %ROLE_NAME% --policy-arn arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole >nul 2>&1

echo { > dynamodb-policy.json
echo   "Version": "2012-10-17", >> dynamodb-policy.json
echo   "Statement": [ >> dynamodb-policy.json
echo     { >> dynamodb-policy.json
echo       "Effect": "Allow", >> dynamodb-policy.json
echo       "Action": [ >> dynamodb-policy.json
echo         "dynamodb:Query", >> dynamodb-policy.json
echo         "dynamodb:Scan", >> dynamodb-policy.json
echo         "dynamodb:GetItem", >> dynamodb-policy.json
echo         "dynamodb:PutItem", >> dynamodb-policy.json
echo         "dynamodb:UpdateItem", >> dynamodb-policy.json
echo         "dynamodb:DeleteItem" >> dynamodb-policy.json
echo       ], >> dynamodb-policy.json
echo       "Resource": [ >> dynamodb-policy.json
echo         "arn:aws:dynamodb:%REGION%:*:table/Users", >> dynamodb-policy.json
echo         "arn:aws:dynamodb:%REGION%:*:table/Users/index/*", >> dynamodb-policy.json
echo         "arn:aws:dynamodb:%REGION%:*:table/Cases", >> dynamodb-policy.json
echo         "arn:aws:dynamodb:%REGION%:*:table/Doctors", >> dynamodb-policy.json
echo         "arn:aws:dynamodb:%REGION%:*:table/Messages" >> dynamodb-policy.json
echo       ] >> dynamodb-policy.json
echo     } >> dynamodb-policy.json
echo   ] >> dynamodb-policy.json
echo } >> dynamodb-policy.json

aws iam create-policy --policy-name %POLICY_NAME% --policy-document file://dynamodb-policy.json >nul 2>&1
aws iam attach-role-policy --role-name %ROLE_NAME% --policy-arn arn:aws:iam::%AWS_ACCOUNT_ID%:policy/%POLICY_NAME% >nul 2>&1

REM Package Lambda
echo Packaging Lambda function...
cd server
call npm install --production --silent
cd ..
powershell Compress-Archive -Path server\* -DestinationPath medical-backend.zip -Force

REM Wait for role propagation
echo Waiting for IAM role propagation...
timeout /t 15 >nul

REM Create Lambda function
echo Creating Lambda function...
aws lambda create-function --function-name %FUNCTION_NAME% --runtime nodejs18.x --role arn:aws:iam::%AWS_ACCOUNT_ID%:role/%ROLE_NAME% --handler aws-index.handler --zip-file fileb://medical-backend.zip --environment Variables="{JWT_SECRET=medical-buddy-secret-key-2024,NODE_ENV=production}" --region %REGION% >nul 2>&1

REM Create API Gateway
echo Creating API Gateway...
for /f "tokens=*" %%i in ('aws apigatewayv2 create-api --name medical-opinion-api --protocol-type HTTP --cors-configuration AllowOrigins="*",AllowMethods="*",AllowHeaders="*" --region %REGION% --query ApiId --output text') do set API_ID=%%i

for /f "tokens=*" %%i in ('aws apigatewayv2 create-integration --api-id %API_ID% --integration-type AWS_PROXY --integration-uri arn:aws:lambda:%REGION%:%AWS_ACCOUNT_ID%:function:%FUNCTION_NAME% --payload-format-version 2.0 --region %REGION% --query IntegrationId --output text') do set INTEGRATION_ID=%%i

aws apigatewayv2 create-route --api-id %API_ID% --route-key "ANY /{proxy+}" --target integrations/%INTEGRATION_ID% --region %REGION% >nul 2>&1
aws apigatewayv2 create-route --api-id %API_ID% --route-key "$default" --target integrations/%INTEGRATION_ID% --region %REGION% >nul 2>&1
aws apigatewayv2 create-stage --api-id %API_ID% --stage-name dev --auto-deploy --region %REGION% >nul 2>&1
aws lambda add-permission --function-name %FUNCTION_NAME% --statement-id api-gateway-invoke --action lambda:InvokeFunction --principal apigateway.amazonaws.com --source-arn "arn:aws:execute-api:%REGION%:%AWS_ACCOUNT_ID%:%API_ID%/*/*" --region %REGION% >nul 2>&1

set API_URL=https://%API_ID%.execute-api.%REGION%.amazonaws.com/dev
echo ✅ Backend deployed successfully!
echo API URL: %API_URL%

REM Step 2: Frontend Configuration
echo.
echo 🎨 Step 2: Configuring Frontend...
echo REACT_APP_API_URL=%API_URL% > client\.env.production
echo ✅ Frontend configured!

REM Step 3: Build Frontend
echo.
echo 📦 Step 3: Building Frontend...
cd client
call npm install --silent
call npm run build --silent
cd ..
echo ✅ Frontend built successfully!

REM Cleanup
echo.
echo 🧹 Cleaning up temporary files...
del trust-policy.json dynamodb-policy.json medical-backend.zip

echo.
echo 🎉 DEPLOYMENT COMPLETE!
echo ========================
echo.
echo 📋 Deployment Summary:
echo • Backend API: %API_URL%
echo • DynamoDB Tables: Users, Cases, Doctors, Messages
echo • Lambda Function: %FUNCTION_NAME%
echo • Frontend Build: client\build\
echo.
echo 🔗 Next Steps:
echo 1. Test API: curl %API_URL%/api/health
echo 2. Deploy frontend to AWS Amplify or your preferred hosting
echo 3. Update DNS settings if using custom domain
echo.
echo 📚 Documentation:
echo • README.md - Application overview
echo • BACKEND_DEPLOYMENT.md - Detailed backend deployment
echo • GitHub: https://github.com/MyMedicalBuddy/MyMedicalBuddy

pause