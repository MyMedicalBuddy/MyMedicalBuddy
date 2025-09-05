@echo off
echo Updating Lambda function...

cd server
call npm install --production --silent
cd ..
powershell Compress-Archive -Path server\* -DestinationPath medical-backend.zip -Force

aws lambda update-function-code --function-name medical-opinion-platform-api --zip-file fileb://medical-backend.zip --region eu-north-1

del medical-backend.zip

echo Lambda function updated successfully!
pause