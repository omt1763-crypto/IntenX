"""
MySQL Database Module for Interview AI
Uses MySQL instead of SQLite for production-ready system
"""

import mysql.connector
from mysql.connector import Error
import json
import logging
from datetime import datetime
from typing import List, Optional, Dict, Any
import os

logger = logging.getLogger(__name__)

# MySQL Connection Configuration
DB_CONFIG = {
    "host": os.getenv("DB_HOST", "localhost"),
    "user": os.getenv("DB_USER", "interview_user"),
    "password": os.getenv("DB_PASSWORD", "interview_password_123"),
    "database": os.getenv("DB_NAME", "interviewverse_db"),
    "port": int(os.getenv("DB_PORT", "3306")),
    "autocommit": True,
    "use_pure": True,
}


class InterviewDatabase:
    """Handle all database operations using MySQL"""

    def __init__(self):
        self.config = DB_CONFIG
        self.init_db()

    def get_connection(self):
        """Get database connection"""
        try:
            conn = mysql.connector.connect(**self.config)
            return conn
        except Error as e:
            logger.error(f"❌ Database connection failed: {e}")
            raise

    def init_db(self):
        """Initialize database with required tables"""
        try:
            conn = self.get_connection()
            cursor = conn.cursor()

            # Create users table
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS users (
                    id VARCHAR(255) PRIMARY KEY,
                    email VARCHAR(255) UNIQUE NOT NULL,
                    name VARCHAR(255) NOT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
            """)

            # Create interviews table
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS interviews (
                    id VARCHAR(255) PRIMARY KEY,
                    user_id VARCHAR(255) NOT NULL,
                    title VARCHAR(255) NOT NULL,
                    client VARCHAR(255),
                    duration INT,
                    status VARCHAR(50) DEFAULT 'completed',
                    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    skills LONGTEXT,
                    conversation LONGTEXT,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (user_id) REFERENCES users(id),
                    KEY idx_interviews_user_id (user_id)
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
            """)

            conn.commit()
            logger.info(f"✅ MySQL Database initialized: {self.config['database']}")
        except Error as e:
            logger.error(f"❌ Database initialization failed: {e}")
            raise
        finally:
            cursor.close()
            conn.close()

    def save_user(self, user_id: str, email: str, name: str) -> bool:
        """Save or update user"""
        try:
            conn = self.get_connection()
            cursor = conn.cursor()

            # Use INSERT ... ON DUPLICATE KEY UPDATE for MySQL
            cursor.execute("""
                INSERT INTO users (id, email, name)
                VALUES (%s, %s, %s)
                ON DUPLICATE KEY UPDATE
                email = VALUES(email),
                name = VALUES(name)
            """, (user_id, email, name))

            conn.commit()
            logger.info(f"✅ User saved: {user_id}")
            return True
        except Error as e:
            logger.error(f"❌ Failed to save user: {e}")
            return False
        finally:
            cursor.close()
            conn.close()

    def get_user(self, user_id: str) -> Optional[Dict]:
        """Get user by ID"""
        try:
            conn = self.get_connection()
            cursor = conn.cursor(dictionary=True)
            cursor.execute("SELECT * FROM users WHERE id = %s", (user_id,))
            user = cursor.fetchone()
            return user
        except Error as e:
            logger.error(f"❌ Failed to get user: {e}")
            return None
        finally:
            cursor.close()
            conn.close()

    def save_interview(self, interview_data: Dict) -> bool:
        """Save interview with full conversation"""
        try:
            conn = self.get_connection()
            cursor = conn.cursor()

            cursor.execute("""
                INSERT INTO interviews 
                (id, user_id, title, client, duration, status, timestamp, skills, conversation)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
            """, (
                interview_data.get("id"),
                interview_data.get("user_id"),
                interview_data.get("title"),
                interview_data.get("client"),
                interview_data.get("duration"),
                interview_data.get("status", "completed"),
                interview_data.get("timestamp"),
                json.dumps(interview_data.get("skills", [])),
                json.dumps(interview_data.get("conversation", []))
            ))

            conn.commit()
            logger.info(f"✅ Interview saved: {interview_data.get('id')}")
            return True
        except Error as e:
            logger.error(f"❌ Failed to save interview: {e}")
            return False
        finally:
            cursor.close()
            conn.close()

    def get_user_interviews(self, user_id: str) -> tuple:
        """Get all interviews for user with count"""
        try:
            conn = self.get_connection()
            cursor = conn.cursor(dictionary=True)

            cursor.execute("""
                SELECT * FROM interviews 
                WHERE user_id = %s 
                ORDER BY created_at DESC
            """, (user_id,))

            interviews = cursor.fetchall()

            # Parse JSON fields
            for interview in interviews:
                if interview.get("skills"):
                    interview["skills"] = json.loads(interview["skills"])
                else:
                    interview["skills"] = []

                if interview.get("conversation"):
                    interview["conversation"] = json.loads(interview["conversation"])
                else:
                    interview["conversation"] = []

            return interviews, len(interviews)
        except Error as e:
            logger.error(f"❌ Failed to get user interviews: {e}")
            return [], 0
        finally:
            cursor.close()
            conn.close()

    def get_interview(self, interview_id: str) -> Optional[Dict]:
        """Get specific interview by ID"""
        try:
            conn = self.get_connection()
            cursor = conn.cursor(dictionary=True)

            cursor.execute("""
                SELECT * FROM interviews WHERE id = %s
            """, (interview_id,))

            interview = cursor.fetchone()

            if interview:
                if interview.get("skills"):
                    interview["skills"] = json.loads(interview["skills"])
                if interview.get("conversation"):
                    interview["conversation"] = json.loads(interview["conversation"])

            return interview
        except Error as e:
            logger.error(f"❌ Failed to get interview: {e}")
            return None
        finally:
            cursor.close()
            conn.close()

    def delete_interview(self, interview_id: str) -> bool:
        """Delete interview by ID"""
        try:
            conn = self.get_connection()
            cursor = conn.cursor()

            cursor.execute("DELETE FROM interviews WHERE id = %s", (interview_id,))
            conn.commit()

            logger.info(f"✅ Interview deleted: {interview_id}")
            return True
        except Error as e:
            logger.error(f"❌ Failed to delete interview: {e}")
            return False
        finally:
            cursor.close()
            conn.close()

    def get_user_stats(self, user_id: str) -> Dict:
        """Get user statistics"""
        try:
            conn = self.get_connection()
            cursor = conn.cursor(dictionary=True)

            cursor.execute("""
                SELECT 
                    COUNT(*) as total_interviews,
                    SUM(duration) as total_duration,
                    AVG(duration) as avg_duration
                FROM interviews 
                WHERE user_id = %s
            """, (user_id,))

            stats = cursor.fetchone()

            return {
                "total_interviews": stats.get("total_interviews", 0),
                "total_duration": stats.get("total_duration", 0) or 0,
                "avg_duration": int(stats.get("avg_duration", 0) or 0),
            }
        except Error as e:
            logger.error(f"❌ Failed to get user stats: {e}")
            return {"total_interviews": 0, "total_duration": 0, "avg_duration": 0}
        finally:
            cursor.close()
            conn.close()


# Initialize database instance
db = InterviewDatabase()
