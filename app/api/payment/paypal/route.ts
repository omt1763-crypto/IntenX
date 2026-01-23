import { NextResponse } from 'next/server';
import axios from 'axios';

const PAYPAL_API_BASE = 'https://api.sandbox.paypal.com'; // Use sandbox for testing
const PAYPAL_CLIENT_ID = process.env.PAYPAL_CLIENT_ID;
const PAYPAL_CLIENT_SECRET = process.env.PAYPAL_CLIENT_SECRET;

// Generate PayPal Access Token
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

// Create PayPal Order
export async function POST(req) {
  try {
    const body = await req.json();
    const { planId, amount, planName, userId } = body;

    if (!amount || !planName) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const accessToken = await getPayPalAccessToken();

    // Create order
    const orderResponse = await axios.post(
      `${PAYPAL_API_BASE}/v2/checkout/orders`,
      {
        intent: 'CAPTURE',
        purchase_units: [
          {
            amount: {
              currency_code: 'USD',
              value: amount.toString(),
              breakdown: {
                item_total: {
                  currency_code: 'USD',
                  value: amount.toString(),
                },
              },
            },
            items: [
              {
                name: planName,
                quantity: '1',
                unit_amount: {
                  currency_code: 'USD',
                  value: amount.toString(),
                },
              },
            ],
            custom_id: userId || 'guest',
          },
        ],
        application_context: {
          brand_name: 'IntenX',
          locale: 'en-US',
          landing_page: 'BILLING',
          shipping_preference: 'NO_SHIPPING',
          user_action: 'PAY_NOW',
          return_url: `${process.env.NEXT_PUBLIC_APP_URL}/payment/success`,
          cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/payment/cancel`,
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
      orderId: orderResponse.data.id,
      approvalUrl: orderResponse.data.links.find((link) => link.rel === 'approve')?.href,
    });
  } catch (error) {
    console.error('PayPal order creation error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create PayPal order' },
      { status: 500 }
    );
  }
}

// Capture PayPal Order
export async function PUT(req) {
  try {
    const body = await req.json();
    const { orderId } = body;

    if (!orderId) {
      return NextResponse.json(
        { error: 'Order ID is required' },
        { status: 400 }
      );
    }

    const accessToken = await getPayPalAccessToken();

    // Capture the order
    const captureResponse = await axios.post(
      `${PAYPAL_API_BASE}/v2/checkout/orders/${orderId}/capture`,
      {},
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (captureResponse.data.status === 'COMPLETED') {
      return NextResponse.json({
        success: true,
        transactionId: captureResponse.data.id,
        status: 'COMPLETED',
        payer: captureResponse.data.payer,
        amount: captureResponse.data.purchase_units[0].amount.value,
      });
    } else {
      return NextResponse.json(
        { error: 'Payment was not completed' },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('PayPal capture error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to capture PayPal order' },
      { status: 500 }
    );
  }
}

// Verify PayPal Payment
export async function PATCH(req) {
  try {
    const body = await req.json();
    const { orderId } = body;

    if (!orderId) {
      return NextResponse.json(
        { error: 'Order ID is required' },
        { status: 400 }
      );
    }

    const accessToken = await getPayPalAccessToken();

    // Get order details
    const orderResponse = await axios.get(
      `${PAYPAL_API_BASE}/v2/checkout/orders/${orderId}`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      }
    );

    return NextResponse.json({
      success: true,
      status: orderResponse.data.status,
      details: orderResponse.data,
    });
  } catch (error) {
    console.error('PayPal verification error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to verify PayPal payment' },
      { status: 500 }
    );
  }
}
