#!/bin/bash

# Backend startup script

echo "🚀 Starting InterviewVerse Backend..."

# Check if .env exists
if [ ! -f backend/.env ]; then
    echo "❌ .env file not found!"
    echo "Creating from template..."
    cp backend/.env.example backend/.env
    echo "⚠️  Please edit backend/.env and add your OPENAI_API_KEY"
    exit 1
fi

# Check if venv exists
if [ ! -d "backend/venv" ]; then
    echo "📦 Creating virtual environment..."
    cd backend
    python -m venv venv
    cd ..
fi

# Activate venv
echo "✅ Activating virtual environment..."
source backend/venv/bin/activate

# Install dependencies
echo "📚 Installing dependencies..."
pip install -q -r backend/requirements.txt

# Start server
echo "🌐 Starting server on http://localhost:8000"
cd backend
python main.py
