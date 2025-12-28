#!/bin/bash
# Production startup script for Render
# Runs both backend (Python) and frontend (Next.js) in one service

set -e

echo "🚀 Starting InterviewVerse Backend..."

# Start Python backend on dynamic port in the background
cd backend
python main.py &
BACKEND_PID=$!
echo "✅ Backend started (PID: $BACKEND_PID)"

# Wait for backend to initialize
sleep 3

# Start Next.js frontend
cd ..
echo "🚀 Starting InterviewVerse Frontend..."
npm run start

# Cleanup: kill backend if frontend exits
kill $BACKEND_PID 2>/dev/null || true
