"""
Supabase Database Module
Stores all interview data in Supabase PostgreSQL
"""

import logging
from datetime import datetime
from typing import List, Optional, Dict, Any
import os
import json
from supabase import create_client, Client
import uuid

logger = logging.getLogger(__name__)

# Initialize Supabase client
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_KEY") or os.getenv("SUPABASE_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    raise ValueError("Missing SUPABASE_URL or SUPABASE_KEY")

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)


class InterviewDatabase:
    """Handle all database operations using Supabase"""

    def __init__(self):
        self.client = supabase
        logger.info(f"✅ Supabase Database initialized")
        self.init_db()

    def init_db(self):
        """Initialize database tables if they don't exist"""
        try:
            # Check if tables exist by trying to select from them
            self.client.table('users').select('id').limit(1).execute()
            self.client.table('interviews').select('id').limit(1).execute()
            logger.info("✅ Supabase tables ready")
        except Exception as e:
            logger.warning(f"⚠️ Tables may need to be created: {e}")

    def save_user(self, user_id: str, email: str, name: str) -> bool:
        """Save or update user profile"""
        try:
            # Split name into first and last
            name_parts = name.split(' ', 1)
            first_name = name_parts[0]
            last_name = name_parts[1] if len(name_parts) > 1 else ''

            # Try to upsert (insert or update)
            response = self.client.table('users').upsert({
                'id': user_id,
                'email': email,
                'first_name': first_name,
                'last_name': last_name,
                'full_name': name,
                'role': 'candidate',
                'updated_at': datetime.utcnow().isoformat()
            }).execute()

            logger.info(f"✅ User saved: {user_id}")
            return True
        except Exception as e:
            logger.error(f"❌ Failed to save user: {e}")
            return False

    def get_user(self, user_id: str) -> Optional[Dict]:
        """Get user profile by ID"""
        try:
            response = self.client.table('users').select('*').eq('id', user_id).execute()
            return response.data[0] if response.data else None
        except Exception as e:
            logger.error(f"❌ Failed to get user: {e}")
            return None

    def save_interview(self, interview_data: Dict) -> bool:
        """Save interview with full conversation"""
        try:
            # Ensure ID is UUID format
            if 'id' not in interview_data or not interview_data['id']:
                interview_data['id'] = str(uuid.uuid4())

            response = self.client.table('interviews').insert({
                'id': interview_data.get('id'),
                'user_id': interview_data.get('user_id'),
                'title': interview_data.get('title', 'Interview'),
                'position': interview_data.get('position', interview_data.get('title', '')),
                'company': interview_data.get('company', interview_data.get('client', '')),
                'client': interview_data.get('client', ''),
                'duration': interview_data.get('duration', 0),
                'status': interview_data.get('status', 'completed'),
                'timestamp': interview_data.get('timestamp', datetime.utcnow().isoformat()),
                'skills': interview_data.get('skills', []),
                'conversation': interview_data.get('conversation', []),
                'ai_feedback': interview_data.get('ai_feedback'),
                'score': interview_data.get('score'),
                'notes': interview_data.get('notes'),
            }).execute()

            logger.info(f"✅ Interview saved: {interview_data.get('id')}")
            return True
        except Exception as e:
            logger.error(f"❌ Failed to save interview: {e}")
            return False

    def get_user_interviews(self, user_id: str) -> tuple:
        """Get all interviews for user"""
        try:
            response = self.client.table('interviews').select('*').eq(
                'user_id', user_id
            ).order('created_at', desc=True).execute()

            interviews = response.data if response.data else []
            return interviews, len(interviews)
        except Exception as e:
            logger.error(f"❌ Failed to get user interviews: {e}")
            return [], 0

    def get_interview(self, interview_id: str) -> Optional[Dict]:
        """Get specific interview by ID"""
        try:
            response = self.client.table('interviews').select('*').eq(
                'id', interview_id
            ).execute()

            return response.data[0] if response.data else None
        except Exception as e:
            logger.error(f"❌ Failed to get interview: {e}")
            return None

    def delete_interview(self, interview_id: str) -> bool:
        """Delete interview by ID"""
        try:
            self.client.table('interviews').delete().eq('id', interview_id).execute()
            logger.info(f"✅ Interview deleted: {interview_id}")
            return True
        except Exception as e:
            logger.error(f"❌ Failed to delete interview: {e}")
            return False

    def get_user_stats(self, user_id: str) -> Dict:
        """Get user statistics"""
        try:
            response = self.client.table('interviews').select('duration').eq(
                'user_id', user_id
            ).execute()

            interviews = response.data if response.data else []
            durations = [i.get('duration', 0) for i in interviews if i.get('duration')]

            return {
                'total_interviews': len(interviews),
                'total_duration': sum(durations),
                'avg_duration': int(sum(durations) / len(durations)) if durations else 0,
            }
        except Exception as e:
            logger.error(f"❌ Failed to get user stats: {e}")
            return {'total_interviews': 0, 'total_duration': 0, 'avg_duration': 0}


# Initialize database instance
db = InterviewDatabase()
