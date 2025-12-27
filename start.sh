#!/bin/bash
# 🚀 Interview Platform Quick Start Script
# Starts both backend and frontend

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Functions
print_header() {
    echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Check dependencies
print_header "Checking Dependencies"

# Check Python
if ! command -v python3 &> /dev/null; then
    print_error "Python 3 not found. Please install Python 3.8 or higher."
    exit 1
fi
PYTHON_VERSION=$(python3 --version 2>&1 | awk '{print $2}')
print_success "Python $PYTHON_VERSION found"

# Check Node.js
if ! command -v node &> /dev/null; then
    print_error "Node.js not found. Please install Node.js 16 or higher."
    exit 1
fi
NODE_VERSION=$(node --version)
print_success "Node.js $NODE_VERSION found"

# Check if running in correct directory
if [ ! -f "package.json" ]; then
    print_error "package.json not found. Please run this script from the project root."
    exit 1
fi

# Check backend exists
if [ ! -f "backend/main.py" ]; then
    print_error "backend/main.py not found."
    exit 1
fi
print_success "Project structure verified"

# Install backend dependencies
print_header "Setting Up Backend"

if [ ! -d "backend/venv" ]; then
    print_warning "Creating Python virtual environment..."
    python3 -m venv backend/venv
fi

# Activate virtual environment
source backend/venv/bin/activate || . backend/venv/Scripts/activate

# Install dependencies
print_warning "Installing Python dependencies..."
if [ -f "backend/requirements.txt" ]; then
    pip install -q -r backend/requirements.txt
    print_success "Python dependencies installed"
else
    print_warning "requirements.txt not found, skipping pip install"
fi

# Check OpenAI API key
print_header "Checking Environment"

if [ -z "$OPENAI_API_KEY" ]; then
    if [ -f "backend/.env" ]; then
        export $(cat backend/.env | xargs)
        print_success "Loaded .env file"
    elif [ -f "backend/.env.local" ]; then
        export $(cat backend/.env.local | xargs)
        print_success "Loaded .env.local file"
    else
        print_warning "OPENAI_API_KEY not set"
        print_warning "Please set: export OPENAI_API_KEY=sk-..."
        read -p "Enter your OpenAI API key (or press Enter to skip): " API_KEY
        if [ ! -z "$API_KEY" ]; then
            export OPENAI_API_KEY=$API_KEY
            print_success "OpenAI API key set"
        fi
    fi
fi

# Install frontend dependencies
print_header "Setting Up Frontend"

if [ ! -d "node_modules" ]; then
    print_warning "Installing npm dependencies..."
    npm install --silent
    print_success "npm dependencies installed"
else
    print_success "npm dependencies already installed"
fi

# Check if .env.local exists for frontend
if [ ! -f ".env.local" ]; then
    print_warning "Creating .env.local for frontend..."
    echo "NEXT_PUBLIC_WEBSOCKET_URL=ws://localhost:8000/audio" > .env.local
    print_success ".env.local created"
fi

# Summary and startup instructions
print_header "Ready to Start"

echo -e "${BLUE}To start the platform:${NC}"
echo ""
echo -e "${GREEN}Option 1: Start in separate terminals${NC}"
echo "  Terminal 1 (Backend):"
echo "    cd backend"
echo "    source venv/bin/activate  # or . venv/Scripts/activate on Windows"
echo "    python main.py"
echo ""
echo "  Terminal 2 (Frontend):"
echo "    npm run dev"
echo ""
echo -e "${GREEN}Option 2: Start with npm scripts${NC}"
echo "  npm run dev:backend &"
echo "  npm run dev:frontend"
echo ""
echo -e "${BLUE}Then open: ${GREEN}http://localhost:3000/interview/demo${NC}"
echo ""
echo -e "${YELLOW}💡 Tips:${NC}"
echo "  • Backend must start before frontend connects"
echo "  • Check logs for 'Application startup complete' message"
echo "  • If port 8000 is in use, check: lsof -i :8000"
echo "  • Enable camera/mic permissions in browser"
echo ""
