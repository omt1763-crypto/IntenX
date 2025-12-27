"""
Interview Limits API - Secure limit enforcement
Prevents users from exceeding interview limits
"""

import logging
from datetime import datetime
from typing import Dict, Optional
from supabase import Client
from functools import wraps

logger = logging.getLogger(__name__)

class InterviewLimitManager:
    """Manage interview limits securely"""
    
    def __init__(self, supabase_client: Client):
        self.db = supabase_client
    
    async def initialize_user_limits(self, user_id: str) -> Dict:
        """
        Initialize interview limits when user signs up
        NEW USERS: 2 free interviews, no subscription
        """
        try:
            # Check if user already has limits
            existing = self.db.table('interview_limits').select('id').eq('user_id', user_id).execute()
            
            if existing.data:
                logger.info(f"[InterviewLimits] User {user_id} already has limits initialized")
                return existing.data[0]
            
            # Create new limit record for this user
            new_limit = {
                'user_id': user_id,
                'interviews_used': 0,
                'interviews_limit': 2,  # Free tier: 2 interviews
                'has_active_subscription': False,
                'subscription_id': None,
                'subscription_expires_at': None,
                'last_interview_at': None,
            }
            
            result = self.db.table('interview_limits').insert(new_limit).execute()
            logger.info(f"[InterviewLimits] Initialized limits for user {user_id}: 2 free interviews")
            return result.data[0] if result.data else new_limit
            
        except Exception as e:
            logger.error(f"[InterviewLimits] Error initializing limits for user {user_id}: {e}")
            raise
    
    async def can_start_interview(self, user_id: str) -> Dict:
        """
        Check if user can start an interview
        
        Returns:
            {
                'allowed': bool,
                'interviews_used': int,
                'interviews_left': int,
                'has_subscription': bool,
                'message': str
            }
        """
        try:
            # Get user's interview limits
            limit_data = self.db.table('interview_limits').select('*').eq('user_id', user_id).execute()
            
            if not limit_data.data:
                # User has no limit record - initialize
                await self.initialize_user_limits(user_id)
                limit_data = self.db.table('interview_limits').select('*').eq('user_id', user_id).execute()
            
            limits = limit_data.data[0]
            
            # Check if user has active subscription
            if limits['has_active_subscription']:
                # Check if subscription is still valid
                if limits['subscription_expires_at']:
                    expires = datetime.fromisoformat(limits['subscription_expires_at'].replace('Z', '+00:00'))
                    if expires < datetime.now(expires.tzinfo):
                        # Subscription expired, update database
                        self.db.table('interview_limits').update({
                            'has_active_subscription': False,
                            'subscription_id': None,
                        }).eq('user_id', user_id).execute()
                        
                        return {
                            'allowed': False,
                            'reason': 'subscription_expired',
                            'interviews_used': limits['interviews_used'],
                            'interviews_left': 0,
                            'has_subscription': False,
                            'message': 'Your subscription has expired. Please renew to continue.'
                        }
                
                # Subscription is active - unlimited interviews
                return {
                    'allowed': True,
                    'reason': 'has_subscription',
                    'interviews_used': limits['interviews_used'],
                    'interviews_left': 999,
                    'has_subscription': True,
                    'message': 'Subscription active - unlimited interviews'
                }
            
            # No subscription - check free tier limit
            interviews_left = limits['interviews_limit'] - limits['interviews_used']
            
            if interviews_left > 0:
                return {
                    'allowed': True,
                    'reason': 'free_tier',
                    'interviews_used': limits['interviews_used'],
                    'interviews_left': interviews_left,
                    'has_subscription': False,
                    'message': f'Free tier: {interviews_left} interview(s) remaining'
                }
            else:
                return {
                    'allowed': False,
                    'reason': 'limit_exceeded',
                    'interviews_used': limits['interviews_used'],
                    'interviews_left': 0,
                    'has_subscription': False,
                    'message': 'You have used all free interviews. Subscribe to continue.'
                }
        
        except Exception as e:
            logger.error(f"[InterviewLimits] Error checking interview permission for user {user_id}: {e}")
            return {
                'allowed': False,
                'reason': 'error',
                'interviews_used': 0,
                'interviews_left': 0,
                'has_subscription': False,
                'message': 'Error checking interview limit. Please try again.'
            }
    
    async def record_interview_completed(self, user_id: str, interview_id: str, 
                                        interview_type: str, duration_minutes: int = 0,
                                        score: int = 0, feedback: str = None) -> bool:
        """
        Record that user completed an interview
        IMMUTABLE - cannot be undone or tampered with
        """
        try:
            # Get current limits
            limit_data = self.db.table('interview_limits').select('*').eq('user_id', user_id).execute()
            
            if not limit_data.data:
                logger.error(f"[InterviewLimits] No limit record for user {user_id}")
                return False
            
            limits = limit_data.data[0]
            
            # Check subscription status at time of interview
            had_subscription = limits['has_active_subscription']
            
            # Record in interview history (immutable log)
            history_entry = {
                'user_id': user_id,
                'interview_id': interview_id,
                'interview_type': interview_type,
                'started_at': datetime.now().isoformat(),
                'ended_at': datetime.now().isoformat(),
                'duration_minutes': duration_minutes,
                'score': score,
                'feedback': feedback,
                'had_active_subscription': had_subscription,
            }
            
            self.db.table('interview_history').insert(history_entry).execute()
            
            # Only increment counter if user doesn't have subscription
            if not had_subscription:
                new_count = limits['interviews_used'] + 1
                self.db.table('interview_limits').update({
                    'interviews_used': new_count,
                    'last_interview_at': datetime.now().isoformat(),
                }).eq('user_id', user_id).execute()
                
                logger.info(f"[InterviewLimits] User {user_id} interview recorded. Used: {new_count}/2")
            else:
                logger.info(f"[InterviewLimits] User {user_id} interview recorded (subscribed, unlimited)")
            
            return True
        
        except Exception as e:
            logger.error(f"[InterviewLimits] Error recording interview for user {user_id}: {e}")
            return False
    
    async def get_user_stats(self, user_id: str) -> Dict:
        """Get user's interview stats"""
        try:
            limit_data = self.db.table('interview_limits').select('*').eq('user_id', user_id).execute()
            
            if not limit_data.data:
                return None
            
            limits = limit_data.data[0]
            
            # Get interview history count
            history = self.db.table('interview_history').select('count', count='exact').eq('user_id', user_id).execute()
            total_interviews = history.count or 0
            
            return {
                'interviews_used': limits['interviews_used'],
                'interviews_limit': limits['interviews_limit'],
                'interviews_left': max(0, limits['interviews_limit'] - limits['interviews_used']),
                'has_subscription': limits['has_active_subscription'],
                'subscription_expires_at': limits['subscription_expires_at'],
                'total_interviews_completed': total_interviews,
                'last_interview_at': limits['last_interview_at'],
            }
        
        except Exception as e:
            logger.error(f"[InterviewLimits] Error getting stats for user {user_id}: {e}")
            return None
