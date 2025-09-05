@echo off
echo Updating existing Lambda function with fixed code...

cd server
call npm install --production --silent
cd ..
powershell Compress-Archive -Path server\* -DestinationPath lambda-update.zip -Force

echo Testing registration with existing API...
curl -X POST https://4kzlrotlw5.execute-api.eu-north-1.amazonaws.com/dev/api/register -H "Content-Type: application/json" -d "{\"name\":\"Test User\",\"email\":\"test@example.com\",\"password\":\"password123\",\"role\":\"user\",\"country\":\"USA\"}"

pause