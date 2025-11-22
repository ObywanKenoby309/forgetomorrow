@echo off
echo Pulling latest main...
git pull origin main

set /p task="What are you working on? (no spaces, use -) "
git checkout -b %USERNAME%/%task%

echo.
echo Boom! You're now on branch: %USERNAME%/%task%
echo Opening VS Code...
code .

pause