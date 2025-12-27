@echo off
cd /d "C:\Users\omt91\Downloads\interviewverse_frontend\backend"
python -m uvicorn main:app --port 8001
pause
