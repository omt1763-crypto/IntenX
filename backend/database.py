"""
Database module for Interview AI Backend
Supports SQLite for local development and can be extended for production databases
"""

import sqlite3
import json
import logging
from datetime import datetime
from typing import List, Optional, Dict, Any
import os

logger = logging.getLogger(__name__)

# Database file location
DB_PATH = os.getenv("DB_PATH", "interview_data.db")


class InterviewDatabase:
    """Handle all database operations for interviews"""

    def __init__(self):
        self.db_path = DB_PATH
        self.init_db()

    def init_db(self):
        """Initialize database with required tables"""
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()

            # Create users table
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS users (
                    id TEXT PRIMARY KEY,
                    email TEXT UNIQUE NOT NULL,
                    name TEXT NOT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            """)

            # Create interviews table
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS interviews (
                    id TEXT PRIMARY KEY,
                    user_id TEXT NOT NULL,
                    title TEXT NOT NULL,
                    client TEXT,
                    duration INTEGER,
                    status TEXT DEFAULT 'completed',
                    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    skills TEXT,
                    conversation TEXT,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (user_id) REFERENCES users(id)
                )
            """)

            # Create index for faster queries
            cursor.execute("""
                CREATE INDEX IF NOT EXISTS idx_interviews_user_id 
                ON interviews(user_id)
            """)

            conn.commit()
            logger.info(f"✅ Database initialized at {self.db_path}")
        except Exception as e:
            logger.error(f"❌ Database initialization failed: {e}")
            raise

    def save_user(self, user_id: str, email: str, name: str) -> bool:
        """Save or update user"""
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            cursor.execute("""
                INSERT OR REPLACE INTO users (id, email, name)
                VALUES (?, ?, ?)
            """, (user_id, email, name))
            conn.commit()
            conn.close()
            logger.info(f"✅ User saved: {user_id}")
            return True
        except Exception as e:
            logger.error(f"❌ Failed to save user: {e}")
            return False

    def get_user(self, user_id: str) -> Optional[Dict]:
        """Get user by ID"""
        try:
            conn = sqlite3.connect(self.db_path)
            conn.row_factory = sqlite3.Row
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM users WHERE id = ?", (user_id,))
            user = cursor.fetchone()
            conn.close()
            if user:
                return dict(user)
            return None
        except Exception as e:
            logger.error(f"❌ Failed to get user: {e}")
            return None

    def save_interview(
        self,
        interview_id: str,
        user_id: str,
        title: str,
        client: str,
        duration: int,
        skills: List[Dict],
        conversation: List[Dict],
    ) -> bool:
        """Save interview result"""
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            cursor.execute("""
                INSERT INTO interviews 
                (id, user_id, title, client, duration, status, timestamp, skills, conversation)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                interview_id,
                user_id,
                title,
                client,
                duration,
                'completed',
                datetime.now().isoformat(),
                json.dumps(skills),
                json.dumps(conversation),
            ))
            conn.commit()
            conn.close()
            logger.info(f"✅ Interview saved: {interview_id} for user {user_id}")
            return True
        except Exception as e:
            logger.error(f"❌ Failed to save interview: {e}")
            return False

    def get_user_interviews(self, user_id: str) -> List[Dict]:
        """Get all interviews for a user"""
        try:
            conn = sqlite3.connect(self.db_path)
            conn.row_factory = sqlite3.Row
            cursor = conn.cursor()
            cursor.execute("""
                SELECT * FROM interviews 
                WHERE user_id = ? 
                ORDER BY timestamp DESC
            """, (user_id,))
            interviews = cursor.fetchall()
            conn.close()

            result = []
            for interview in interviews:
                row = dict(interview)
                # Parse JSON fields
                if row['skills']:
                    row['skills'] = json.loads(row['skills'])
                if row['conversation']:
                    row['conversation'] = json.loads(row['conversation'])
                result.append(row)
            return result
        except Exception as e:
            logger.error(f"❌ Failed to get user interviews: {e}")
            return []

    def get_interview(self, interview_id: str) -> Optional[Dict]:
        """Get specific interview by ID"""
        try:
            conn = sqlite3.connect(self.db_path)
            conn.row_factory = sqlite3.Row
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM interviews WHERE id = ?", (interview_id,))
            interview = cursor.fetchone()
            conn.close()

            if interview:
                row = dict(interview)
                if row['skills']:
                    row['skills'] = json.loads(row['skills'])
                if row['conversation']:
                    row['conversation'] = json.loads(row['conversation'])
                return row
            return None
        except Exception as e:
            logger.error(f"❌ Failed to get interview: {e}")
            return None

    def delete_interview(self, interview_id: str) -> bool:
        """Delete interview"""
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            cursor.execute("DELETE FROM interviews WHERE id = ?", (interview_id,))
            conn.commit()
            conn.close()
            logger.info(f"✅ Interview deleted: {interview_id}")
            return True
        except Exception as e:
            logger.error(f"❌ Failed to delete interview: {e}")
            return False

    def get_user_stats(self, user_id: str) -> Dict:
        """Get statistics for a user"""
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()

            # Total interviews
            cursor.execute("SELECT COUNT(*) FROM interviews WHERE user_id = ?", (user_id,))
            total = cursor.fetchone()[0]

            # Total duration
            cursor.execute(
                "SELECT SUM(duration) FROM interviews WHERE user_id = ?",
                (user_id,),
            )
            total_duration = cursor.fetchone()[0] or 0

            conn.close()

            return {
                "total_interviews": total,
                "total_duration_seconds": total_duration,
                "average_duration_seconds": (
                    total_duration // total if total > 0 else 0
                ),
            }
        except Exception as e:
            logger.error(f"❌ Failed to get user stats: {e}")
            return {
                "total_interviews": 0,
                "total_duration_seconds": 0,
                "average_duration_seconds": 0,
            }


# Initialize database
db = InterviewDatabase()
