@echo off
REM Backend startup script for Windows

echo 🚀 Starting InterviewVerse Backend...

REM Check if .env exists
if not exist "backend\.env" (
    echo ❌ .env file not found!
    echo Creating from template...
    copy backend\.env.example backend\.env
    echo ⚠️  Please edit backend\.env and add your OPENAI_API_KEY
    pause
    exit /b 1
)

REM Check if venv exists
if not exist "backend\venv" (
    echo 📦 Creating virtual environment...
    cd backend
    python -m venv venv
    cd ..
)

REM Activate venv
echo ✅ Activating virtual environment...
call backend\venv\Scripts\activate.bat

REM Install dependencies
echo 📚 Installing dependencies...
pip install -q -r backend\requirements.txt

REM Start server
echo 🌐 Starting server on http://localhost:8000
cd backend
python main.py

pause
