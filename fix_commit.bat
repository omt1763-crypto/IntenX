@echo off
cd /d c:\Users\omt91\Downloads\main\interviewverse_frontend

echo Setting git config...
git config user.email "omt1763@gmail.com"
git config user.name "omt1763"

echo Pulling latest changes...
git pull origin main --no-edit

echo Checking status...
git status

echo Recommitting with correct author...
git add -A
git commit -m "Fix: Correct author email for Vercel deployment" --author="omt1763 <omt1763@gmail.com>"

echo Pushing to GitHub...
git push origin main

echo Done!
pause
