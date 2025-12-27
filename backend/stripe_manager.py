"""
Stripe Payment Integration API
Handles subscription creation and management securely
"""

import os
import logging
from datetime import datetime, timedelta
import stripe
from typing import Dict, Optional
from supabase import Client

logger = logging.getLogger(__name__)

# Initialize Stripe
STRIPE_SECRET_KEY = os.getenv("STRIPE_SECRET_KEY")
STRIPE_WEBHOOK_SECRET = os.getenv("STRIPE_WEBHOOK_SECRET")

if not STRIPE_SECRET_KEY:
    logger.warning("⚠️ STRIPE_SECRET_KEY not set - payments disabled")
else:
    stripe.api_key = STRIPE_SECRET_KEY
    logger.info("✅ Stripe initialized")

class StripePaymentManager:
    """Manage Stripe subscriptions and payments"""
    
    def __init__(self, supabase_client: Client):
        self.db = supabase_client
        self.stripe_client = stripe
    
    async def create_customer(self, user_id: str, email: str, name: str = "") -> Optional[str]:
        """
        Create a Stripe customer for user
        Returns customer ID
        """
        try:
            customer = self.stripe_client.Customer.create(
                email=email,
                name=name,
                metadata={
                    'user_id': user_id,
                }
            )
            
            logger.info(f"[Stripe] Created customer {customer.id} for user {user_id}")
            return customer.id
        
        except Exception as e:
            logger.error(f"[Stripe] Error creating customer: {e}")
            raise
    
    async def create_subscription(self, user_id: str, email: str, stripe_customer_id: str) -> Dict:
        """
        Create subscription for user
        Plan: Candidate Professional - $25/month, unlimited interviews
        """
        try:
            # Use test/live price ID from your Stripe dashboard
            # For development: use STRIPE_TEST_PRICE_ID
            price_id = os.getenv("STRIPE_PRICE_ID_CANDIDATE_PROFESSIONAL")
            
            if not price_id:
                raise ValueError("STRIPE_PRICE_ID_CANDIDATE_PROFESSIONAL not configured")
            
            # Create subscription
            subscription = self.stripe_client.Subscription.create(
                customer=stripe_customer_id,
                items=[{
                    'price': price_id,
                }],
                payment_behavior='default_incomplete',
                expand=['latest_invoice.payment_intent'],
                metadata={
                    'user_id': user_id,
                }
            )
            
            # Extract subscription details
            sub_data = {
                'user_id': user_id,
                'stripe_subscription_id': subscription.id,
                'stripe_customer_id': stripe_customer_id,
                'status': subscription.status,
                'current_period_start': datetime.fromtimestamp(subscription.current_period_start),
                'current_period_end': datetime.fromtimestamp(subscription.current_period_end),
                'plan_name': 'Candidate Professional',
                'plan_amount': 2500,  # $25.00 in cents
                'plan_currency': 'usd',
                'interview_limit': 999,  # Unlimited with subscription
                'auto_renew': subscription.metadata.get('auto_renew', True),
                'cancel_at_period_end': subscription.cancel_at_period_end or False,
            }
            
            # Save to database
            self.db.table('stripe_subscriptions').insert(sub_data).execute()
            
            # Update interview limits
            self.db.table('interview_limits').update({
                'has_active_subscription': True,
                'subscription_id': subscription.id,
                'subscription_expires_at': datetime.fromtimestamp(subscription.current_period_end).isoformat(),
            }).eq('user_id', user_id).execute()
            
            logger.info(f"[Stripe] Created subscription {subscription.id} for user {user_id}")
            
            return {
                'success': True,
                'subscription_id': subscription.id,
                'client_secret': subscription.latest_invoice.payment_intent.client_secret,
                'status': subscription.status,
                'message': 'Subscription created. Complete payment to activate.'
            }
        
        except Exception as e:
            logger.error(f"[Stripe] Error creating subscription: {e}")
            return {
                'success': False,
                'error': str(e),
                'message': 'Failed to create subscription'
            }
    
    async def handle_webhook(self, event: Dict) -> bool:
        """
        Handle Stripe webhook events
        Keeps subscription status in sync
        """
        try:
            event_type = event['type']
            
            if event_type == 'customer.subscription.updated':
                subscription = event['data']['object']
                user_id = subscription.get('metadata', {}).get('user_id')
                
                if user_id:
                    self.db.table('stripe_subscriptions').update({
                        'status': subscription['status'],
                        'current_period_start': datetime.fromtimestamp(subscription['current_period_start']),
                        'current_period_end': datetime.fromtimestamp(subscription['current_period_end']),
                        'cancel_at_period_end': subscription.get('cancel_at_period_end', False),
                    }).eq('stripe_subscription_id', subscription['id']).execute()
                    
                    # Update interview limits
                    is_active = subscription['status'] == 'active'
                    self.db.table('interview_limits').update({
                        'has_active_subscription': is_active,
                        'subscription_expires_at': datetime.fromtimestamp(
                            subscription['current_period_end']
                        ).isoformat() if is_active else None,
                    }).eq('user_id', user_id).execute()
                    
                    logger.info(f"[Stripe] Updated subscription {subscription['id']} status: {subscription['status']}")
            
            elif event_type == 'customer.subscription.deleted':
                subscription = event['data']['object']
                user_id = subscription.get('metadata', {}).get('user_id')
                
                if user_id:
                    # Subscription cancelled
                    self.db.table('stripe_subscriptions').update({
                        'status': 'canceled',
                    }).eq('stripe_subscription_id', subscription['id']).execute()
                    
                    # Remove active subscription from interview limits
                    self.db.table('interview_limits').update({
                        'has_active_subscription': False,
                        'subscription_id': None,
                        'subscription_expires_at': None,
                    }).eq('user_id', user_id).execute()
                    
                    logger.info(f"[Stripe] Subscription {subscription['id']} cancelled for user {user_id}")
            
            elif event_type == 'invoice.payment_succeeded':
                subscription_id = event['data']['object'].get('subscription')
                user_id = event['data']['object'].get('metadata', {}).get('user_id')
                
                if subscription_id and user_id:
                    self.db.table('stripe_subscriptions').update({
                        'status': 'active',
                    }).eq('stripe_subscription_id', subscription_id).execute()
                    
                    self.db.table('interview_limits').update({
                        'has_active_subscription': True,
                    }).eq('user_id', user_id).execute()
                    
                    logger.info(f"[Stripe] Payment succeeded for subscription {subscription_id}")
            
            elif event_type == 'invoice.payment_failed':
                subscription_id = event['data']['object'].get('subscription')
                user_id = event['data']['object'].get('metadata', {}).get('user_id')
                
                if subscription_id:
                    self.db.table('stripe_subscriptions').update({
                        'status': 'past_due',
                    }).eq('stripe_subscription_id', subscription_id).execute()
                    
                    logger.warning(f"[Stripe] Payment failed for subscription {subscription_id}")
            
            return True
        
        except Exception as e:
            logger.error(f"[Stripe] Error handling webhook: {e}")
            return False
    
    async def get_subscription(self, user_id: str) -> Optional[Dict]:
        """Get user's active subscription"""
        try:
            result = self.db.table('stripe_subscriptions').select('*').eq('user_id', user_id).eq('status', 'active').execute()
            return result.data[0] if result.data else None
        except Exception as e:
            logger.error(f"[Stripe] Error getting subscription: {e}")
            return None
    
    async def cancel_subscription(self, user_id: str, at_period_end: bool = True) -> bool:
        """Cancel user's subscription"""
        try:
            sub = await self.get_subscription(user_id)
            
            if not sub:
                logger.warning(f"[Stripe] No active subscription for user {user_id}")
                return False
            
            self.stripe_client.Subscription.modify(
                sub['stripe_subscription_id'],
                cancel_at_period_end=at_period_end
            )
            
            logger.info(f"[Stripe] Cancelled subscription for user {user_id}")
            return True
        
        except Exception as e:
            logger.error(f"[Stripe] Error cancelling subscription: {e}")
            return False
