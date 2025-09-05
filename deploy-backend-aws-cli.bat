@echo off
echo Deploying Medical Opinion Platform Backend using AWS CLI...

REM Set variables
set REGION=eu-north-1
set FUNCTION_NAME=medical-opinion-platform-api
set ROLE_NAME=medical-opinion-lambda-role
set ZIP_FILE=medical-backend.zip

echo.
echo Step 1: Creating DynamoDB Tables...

REM Create Users table
aws dynamodb create-table ^
    --table-name Users ^
    --attribute-definitions ^
        AttributeName=id,AttributeType=S ^
        AttributeName=email,AttributeType=S ^
    --key-schema ^
        AttributeName=id,KeyType=HASH ^
    --global-secondary-indexes ^
        IndexName=EmailIndex,KeySchema=[{AttributeName=email,KeyType=HASH}],Projection={ProjectionType=ALL},BillingMode=PAY_PER_REQUEST ^
    --billing-mode PAY_PER_REQUEST ^
    --region %REGION%

REM Create Cases table
aws dynamodb create-table ^
    --table-name Cases ^
    --attribute-definitions ^
        AttributeName=id,AttributeType=S ^
    --key-schema ^
        AttributeName=id,KeyType=HASH ^
    --billing-mode PAY_PER_REQUEST ^
    --region %REGION%

REM Create Doctors table
aws dynamodb create-table ^
    --table-name Doctors ^
    --attribute-definitions ^
        AttributeName=id,AttributeType=S ^
    --key-schema ^
        AttributeName=id,KeyType=HASH ^
    --billing-mode PAY_PER_REQUEST ^
    --region %REGION%

REM Create Messages table
aws dynamodb create-table ^
    --table-name Messages ^
    --attribute-definitions ^
        AttributeName=id,AttributeType=S ^
    --key-schema ^
        AttributeName=id,KeyType=HASH ^
    --billing-mode PAY_PER_REQUEST ^
    --region %REGION%

echo.
echo Step 2: Creating IAM Role for Lambda...

REM Create trust policy file
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

REM Create IAM role
aws iam create-role ^
    --role-name %ROLE_NAME% ^
    --assume-role-policy-document file://trust-policy.json ^
    --region %REGION%

REM Attach basic Lambda execution policy
aws iam attach-role-policy ^
    --role-name %ROLE_NAME% ^
    --policy-arn arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole ^
    --region %REGION%

REM Create DynamoDB policy
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

REM Create and attach DynamoDB policy
aws iam create-policy ^
    --policy-name medical-opinion-dynamodb-policy ^
    --policy-document file://dynamodb-policy.json ^
    --region %REGION%

aws iam attach-role-policy ^
    --role-name %ROLE_NAME% ^
    --policy-arn arn:aws:iam::%AWS_ACCOUNT_ID%:policy/medical-opinion-dynamodb-policy ^
    --region %REGION%

echo.
echo Step 3: Creating deployment package...

REM Create deployment package
cd server
npm install --production
cd ..
powershell Compress-Archive -Path server\* -DestinationPath %ZIP_FILE% -Force

echo.
echo Step 4: Creating Lambda function...

REM Wait for role to be ready
timeout /t 10

REM Create Lambda function
aws lambda create-function ^
    --function-name %FUNCTION_NAME% ^
    --runtime nodejs18.x ^
    --role arn:aws:iam::%AWS_ACCOUNT_ID%:role/%ROLE_NAME% ^
    --handler aws-index.handler ^
    --zip-file fileb://%ZIP_FILE% ^
    --environment Variables="{JWT_SECRET=medical-buddy-secret-key-2024,NODE_ENV=production}" ^
    --region %REGION%

echo.
echo Step 5: Creating API Gateway...

REM Create API Gateway
aws apigatewayv2 create-api ^
    --name medical-opinion-api ^
    --protocol-type HTTP ^
    --cors-configuration AllowOrigins="*",AllowMethods="*",AllowHeaders="*" ^
    --region %REGION%

echo.
echo Deployment complete!
echo.
echo Next steps:
echo 1. Get your AWS Account ID: aws sts get-caller-identity
echo 2. Replace %%AWS_ACCOUNT_ID%% in the script with your actual account ID
echo 3. Run the script again
echo.
echo Clean up temporary files...
del trust-policy.json
del dynamodb-policy.json
del %ZIP_FILE%

pause