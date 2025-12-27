@echo off
REM 🚀 Interview Platform Quick Start Script (Windows)
REM Starts backend and frontend

setlocal enabledelayedexpansion

REM Colors (using special characters for Windows)
set BLUE=[94m
set GREEN=[92m
set YELLOW=[93m
set RED=[91m
set NC=[0m

echo ===============================================================
echo 🚀 Interview Platform Setup
echo ===============================================================
echo.

REM Check Python
python --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Python not found. Please install Python 3.8 or higher.
    pause
    exit /b 1
)
python --version
echo ✅ Python found

REM Check Node.js
node --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Node.js not found. Please install Node.js 16 or higher.
    pause
    exit /b 1
)
node --version
echo ✅ Node.js found

REM Check project structure
if not exist package.json (
    echo ❌ package.json not found. Run from project root.
    pause
    exit /b 1
)

if not exist backend\main.py (
    echo ❌ backend\main.py not found.
    pause
    exit /b 1
)

echo ✅ Project structure verified
echo.

REM Setup backend
echo ===============================================================
echo Setting Up Backend
echo ===============================================================
echo.

if not exist backend\venv (
    echo Creating Python virtual environment...
    python -m venv backend\venv
    echo ✅ Virtual environment created
) else (
    echo ✅ Virtual environment already exists
)

REM Activate virtual environment
call backend\venv\Scripts\activate.bat

REM Install dependencies
if exist backend\requirements.txt (
    echo Installing Python dependencies...
    pip install -q -r backend\requirements.txt
    echo ✅ Python dependencies installed
)

REM Check OpenAI API Key
echo.
echo ===============================================================
echo Checking Environment
echo ===============================================================
echo.

if not defined OPENAI_API_KEY (
    if exist backend\.env (
        echo Loading .env file...
        for /f "delims=" %%i in ('type backend\.env ^| findstr /c:"OPENAI_API_KEY"') do (
            for /f "tokens=1,2 delims==" %%a in ("%%i") do (
                set %%a=%%b
            )
        )
        echo ✅ .env file loaded
    ) else if exist backend\.env.local (
        echo Loading .env.local file...
        for /f "delims=" %%i in ('type backend\.env.local ^| findstr /c:"OPENAI_API_KEY"') do (
            for /f "tokens=1,2 delims==" %%a in ("%%i") do (
                set %%a=%%b
            )
        )
        echo ✅ .env.local file loaded
    ) else (
        echo ⚠️  OPENAI_API_KEY not found in environment
        set /p OPENAI_API_KEY="Enter your OpenAI API key (or press Enter to skip): "
        if not "!OPENAI_API_KEY!"=="" (
            echo ✅ OpenAI API key set
        )
    )
)

REM Setup frontend
echo.
echo ===============================================================
echo Setting Up Frontend
echo ===============================================================
echo.

if not exist node_modules (
    echo Installing npm dependencies...
    call npm install
    echo ✅ npm dependencies installed
) else (
    echo ✅ npm dependencies already installed
)

REM Create .env.local for frontend
if not exist .env.local (
    echo Creating .env.local...
    (
        echo NEXT_PUBLIC_WEBSOCKET_URL=ws://localhost:8000/audio
    ) > .env.local
    echo ✅ .env.local created
) else (
    echo ✅ .env.local already exists
)

echo.
echo ===============================================================
echo ✅ Setup Complete!
echo ===============================================================
echo.

echo To start the platform:
echo.
echo Option 1: Start in separate terminals
echo   Terminal 1 (Backend):
echo     cd backend
echo     venv\Scripts\activate
echo     python main.py
echo.
echo   Terminal 2 (Frontend):
echo     npm run dev
echo.
echo Option 2: Start both (requires separate terminals to be open)
echo   backend\start-backend.bat
echo   npm run dev
echo.
echo Then open: http://localhost:3000/interview/demo
echo.
echo 💡 Tips:
echo   - Backend must start before frontend connects
echo   - Check for "Application startup complete" in backend logs
echo   - Check camera/mic permissions in browser
echo.
pause
