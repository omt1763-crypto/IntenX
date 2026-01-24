import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

let razorpay: any = null;

function getRazorpayInstance() {
  if (!razorpay) {
    try {
      const Razorpay = require('razorpay');
      razorpay = new Razorpay({
        key_id: process.env.RAZORPAY_KEY_ID || '',
        key_secret: process.env.RAZORPAY_KEY_SECRET || '',
      });
    } catch (error) {
      console.warn('Razorpay module not available');
      return null;
    }
  }
  return razorpay;
}

// POST: Create a new order
export async function POST(request: NextRequest) {
  try {
    const { amount, planId, planName, description, userId } = await request.json();

    if (!amount || !planId) {
      return NextResponse.json(
        { error: 'Amount and planId are required' },
        { status: 400 }
      );
    }

    const razorpayInstance = getRazorpayInstance();
    if (!razorpayInstance) {
      return NextResponse.json(
        { error: 'Payment service unavailable' },
        { status: 503 }
      );
    }

    // Amount in paise
    const orderAmount = Math.round(amount * 100);

    const order = await razorpayInstance.orders.create({
      amount: orderAmount,
      currency: 'INR',
      receipt: `${planId}-${userId}-${Date.now()}`,
      notes: {
        planId,
        planName,
        description,
        userId,
      },
    });

    return NextResponse.json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
    });
  } catch (error) {
    console.error('Razorpay order creation error:', error);
    return NextResponse.json(
      { error: 'Failed to create order' },
      { status: 500 }
    );
  }
}

// PATCH: Verify payment signature
export async function PATCH(request: NextRequest) {
  try {
    const { razorpay_payment_id, razorpay_order_id, razorpay_signature } = await request.json();

    if (!razorpay_payment_id || !razorpay_order_id || !razorpay_signature) {
      return NextResponse.json(
        { error: 'Missing payment verification details' },
        { status: 400 }
      );
    }

    // Verify signature
    const body = `${razorpay_order_id}|${razorpay_payment_id}`;
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET || '')
      .update(body)
      .digest('hex');

    if (expectedSignature !== razorpay_signature) {
      return NextResponse.json(
        { error: 'Invalid payment signature' },
        { status: 400 }
      );
    }

    // Fetch payment details for verification
    const razorpayInstance = getRazorpayInstance();
    if (!razorpayInstance) {
      return NextResponse.json(
        { error: 'Payment service unavailable' },
        { status: 503 }
      );
    }

    const payment = await razorpayInstance.payments.fetch(razorpay_payment_id);

    return NextResponse.json({
      success: true,
      transactionId: razorpay_payment_id,
      status: payment.status,
      amount: payment.amount,
      orderId: razorpay_order_id,
      notes: payment.notes,
    });
  } catch (error) {
    console.error('Razorpay payment verification error:', error);
    return NextResponse.json(
      { error: 'Payment verification failed' },
      { status: 500 }
    );
  }
}
