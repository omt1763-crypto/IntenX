# Interview Data Storage - Backend Setup Guide

## Overview
The interview system now supports persistent data storage using SQLite and FastAPI. This enables users to see their interview history on a personalized dashboard.

## What's Implemented

### Backend (FastAPI + SQLite)

#### Database Module (`backend/database.py`)
- **SQLite database** for local/Hostinger deployment
- **Tables:**
  - `users` - User account information
  - `interviews` - Interview results with full conversation logs
  - `indexes` - Optimized queries by user_id

#### API Endpoints (`backend/main.py`)

**User Management:**
- `POST /api/users` - Create or update user
- `GET /api/users/{user_id}` - Get user info
- `GET /api/users/{user_id}/stats` - Get user statistics

**Interview Storage:**
- `POST /api/interviews` - Save interview result
- `GET /api/interviews/user/{user_id}` - Get all interviews for user
- `GET /api/interviews/{interview_id}` - Get specific interview
- `DELETE /api/interviews/{interview_id}` - Delete interview

### Frontend Changes

**Interview Page (`app/interview/realtime/page.tsx`):**
- Saves interview to backend API when user clicks "End Interview"
- Falls back to localStorage if backend is unavailable
- Redirects to dashboard after saving

**Dashboard (`app/dashboard/page.js`):**
- Fetches interview data from backend API
- Falls back to localStorage if backend unavailable
- Shows statistics: total interviews, completed, average duration
- Displays recent 3 interviews

**Interviews History (`app/dashboard/interviews/page.tsx`):**
- Shows all interviews with filtering and delete capability
- Modal view with full conversation transcript

## Installation & Setup

### 1. Add SQLite Support to Backend

```bash
# No additional packages needed - sqlite3 is built into Python
```

### 2. Initialize Database

The database initializes automatically on backend startup:

```bash
python backend/main.py
```

This creates `interview_data.db` with all required tables.

### 3. Environment Variables

Add to `.env` in backend folder (optional):

```env
# Database location (default: interview_data.db in backend folder)
DB_PATH=interview_data.db
```

## Deployment to Hostinger

### Option 1: Using Hostinger's Python Hosting (Recommended)

1. **Upload files to Hostinger:**
   - Upload backend folder to public directory or private folder
   - Database file will be auto-created

2. **Configure Python App:**
   - Python version: 3.9+
   - Entry point: `backend/main.py`
   - Port: 8001

3. **Install dependencies:**
   - Hostinger will auto-install from `requirements.txt`

4. **Update CORS in backend:**

```python
# In backend/main.py, update CORS origins:
app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://yourdomain.com", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

5. **Update Frontend API URL:**

In frontend code, replace:
```javascript
const response = await fetch('http://localhost:8001/api/interviews', {
```

With:
```javascript
const response = await fetch('https://yourdomain-api.hostinger.com/api/interviews', {
```

### Option 2: Using MySQL with Hostinger (For Production)

If you want to use Hostinger's MySQL database instead of SQLite:

1. **Create new database module (`backend/database_mysql.py`):**

```python
import mysql.connector
import json

class InterviewDatabase:
    def __init__(self):
        self.conn = mysql.connector.connect(
            host=os.getenv("DB_HOST"),
            user=os.getenv("DB_USER"),
            password=os.getenv("DB_PASSWORD"),
            database=os.getenv("DB_NAME")
        )
        self.init_db()
    
    # ... implement same methods but for MySQL
```

2. **Update `.env`:**

```env
DB_HOST=your-hostinger-db-host
DB_USER=your-db-user
DB_PASSWORD=your-db-password
DB_NAME=interview_database
```

3. **Install MySQL driver:**

```bash
pip install mysql-connector-python
```

### Option 3: Cloud Storage (Firebase/AWS)

For serverless deployment:

```python
# Use Firebase Realtime Database or AWS DynamoDB
import firebase_admin
from firebase_admin import db

# Update database.py to use Firebase instead of SQLite
```

## Database Schema

```sql
-- Users Table
CREATE TABLE users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Interviews Table
CREATE TABLE interviews (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    title TEXT NOT NULL,
    client TEXT,
    duration INTEGER,
    status TEXT DEFAULT 'completed',
    timestamp TIMESTAMP,
    skills TEXT,  -- JSON array
    conversation TEXT,  -- JSON array
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);
```

## Data Format

### Saved Interview Object

```json
{
  "id": "interview_1702000000000",
  "user_id": "user_123",
  "title": "Python Developer Interview",
  "client": "Tech Company",
  "duration": 1235,
  "status": "completed",
  "timestamp": "2024-12-07T10:00:00",
  "skills": [
    {"name": "Python", "reason": "Required for backend"},
    {"name": "FastAPI", "reason": "For async APIs"}
  ],
  "conversation": [
    {
      "role": "ai",
      "content": "Hello, thank you for joining me...",
      "timestamp": "2024-12-07T10:00:05"
    },
    {
      "role": "user",
      "content": "Hi, thanks for having me...",
      "timestamp": "2024-12-07T10:00:10"
    }
  ]
}
```

## Features

✅ **Automatic Fallback** - Uses localStorage if backend unavailable
✅ **User-Specific Data** - Each user only sees their own interviews
✅ **Full Conversation Logs** - Every interview stores complete transcript
✅ **Statistics** - Dashboard shows usage metrics
✅ **Easy Migration** - Can switch between SQLite, MySQL, Firebase
✅ **Production Ready** - Optimized queries with indexes

## Troubleshooting

**"Cannot connect to backend":**
- Ensure backend is running: `python backend/main.py`
- Check CORS settings match frontend domain
- Verify firewall allows port 8001

**"Database locked":**
- SQLite has concurrent write limits
- For production, use MySQL or PostgreSQL
- Consider upgrading to Hostinger's premium plan

**"Conversation not saving":**
- Check user_id is being passed correctly
- Verify interview data structure matches schema
- Check backend logs for error details

## Next Steps

1. Deploy backend to Hostinger
2. Update frontend with backend URL
3. Test by completing an interview
4. Verify data appears in dashboard
5. Consider upgrading to MySQL for production use

