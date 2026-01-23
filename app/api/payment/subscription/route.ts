import { NextResponse } from 'next/server';
import axios from 'axios';

const PAYPAL_API_BASE = 'https://api.sandbox.paypal.com';
const PAYPAL_CLIENT_ID = process.env.PAYPAL_CLIENT_ID;
const PAYPAL_CLIENT_SECRET = process.env.PAYPAL_CLIENT_SECRET;

async function getPayPalAccessToken() {
  try {
    const auth = Buffer.from(`${PAYPAL_CLIENT_ID}:${PAYPAL_CLIENT_SECRET}`).toString('base64');
    
    const response = await axios.post(
      `${PAYPAL_API_BASE}/v1/oauth2/token`,
      'grant_type=client_credentials',
      {
        headers: {
          'Authorization': `Basic ${auth}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      }
    );

    return response.data.access_token;
  } catch (error) {
    console.error('PayPal token error:', error);
    throw new Error('Failed to get PayPal access token');
  }
}

// Create subscription plan
export async function POST(req) {
  try {
    const body = await req.json();
    const { planName, planPrice, billingCycle } = body;

    if (!planName || !planPrice || !billingCycle) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const accessToken = await getPayPalAccessToken();

    // Create billing plan
    const planResponse = await axios.post(
      `${PAYPAL_API_BASE}/v1/billing/plans`,
      {
        product_id: 'INTENTX_PRODUCT_ID', // Replace with your product ID
        name: planName,
        status: 'ACTIVE',
        description: `${planName} Plan`,
        billing_cycles: [
          {
            frequency: {
              interval_unit: billingCycle === 'monthly' ? 'MONTH' : 'YEAR',
              interval_count: 1,
            },
            tenure_type: 'REGULAR',
            sequence: 1,
            total_cycles: 12,
            pricing_scheme: {
              fixed_price: {
                value: planPrice.toString(),
                currency_code: 'USD',
              },
            },
          },
        ],
        payment_preferences: {
          auto_bill_amount: 'YES',
          setup_fee: {
            value: '0',
            currency_code: 'USD',
          },
          setup_fee_failure_action: 'CANCEL',
          payment_failure_threshold: 2,
        },
      },
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    return NextResponse.json({
      success: true,
      planId: planResponse.data.id,
      status: planResponse.data.status,
    });
  } catch (error) {
    console.error('PayPal plan creation error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create subscription plan' },
      { status: 500 }
    );
  }
}

// Create subscription
export async function PUT(req) {
  try {
    const body = await req.json();
    const { planId, subscriberEmail, subscriberName } = body;

    if (!planId || !subscriberEmail) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const accessToken = await getPayPalAccessToken();

    // Create subscription
    const subscriptionResponse = await axios.post(
      `${PAYPAL_API_BASE}/v1/billing/subscriptions`,
      {
        plan_id: planId,
        subscriber: {
          name: {
            given_name: subscriberName || 'User',
          },
          email_address: subscriberEmail,
        },
        application_context: {
          brand_name: 'IntenX',
          locale: 'en-US',
          user_action: 'SUBSCRIBE_NOW',
          return_url: `${process.env.NEXT_PUBLIC_APP_URL}/subscription/success`,
          cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/subscription/cancel`,
        },
      },
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    return NextResponse.json({
      success: true,
      subscriptionId: subscriptionResponse.data.id,
      approvalUrl: subscriptionResponse.data.links.find((link) => link.rel === 'approve')?.href,
    });
  } catch (error) {
    console.error('PayPal subscription error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create subscription' },
      { status: 500 }
    );
  }
}

// Get subscription details
export async function PATCH(req) {
  try {
    const body = await req.json();
    const { subscriptionId } = body;

    if (!subscriptionId) {
      return NextResponse.json(
        { error: 'Subscription ID is required' },
        { status: 400 }
      );
    }

    const accessToken = await getPayPalAccessToken();

    // Get subscription details
    const response = await axios.get(
      `${PAYPAL_API_BASE}/v1/billing/subscriptions/${subscriptionId}`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      }
    );

    return NextResponse.json({
      success: true,
      subscription: response.data,
      status: response.data.status,
    });
  } catch (error) {
    console.error('PayPal subscription details error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to get subscription details' },
      { status: 500 }
    );
  }
}
