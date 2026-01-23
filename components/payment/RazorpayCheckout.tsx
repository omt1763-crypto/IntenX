'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface RazorpayCheckoutProps {
  planId: string;
  planName: string;
  amount: number; // Amount in rupees
  description: string;
  userEmail: string;
  userName: string;
  userId?: string;
  onSuccess?: (response: any) => void;
  onError?: (error: any) => void;
}

declare global {
  interface Window {
    Razorpay: any;
  }
}

export default function RazorpayCheckout({
  planId,
  planName,
  amount,
  description,
  userEmail,
  userName,
  userId = 'guest',
  onSuccess,
  onError,
}: RazorpayCheckoutProps) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  // Load Razorpay script
  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handlePayment = async () => {
    setLoading(true);

    try {
      // Load Razorpay script
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        throw new Error('Failed to load Razorpay');
      }

      // Create order
      const orderResponse = await fetch('/api/payment/razorpay', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount,
          planId,
          planName,
          description,
          userId,
        }),
      });

      if (!orderResponse.ok) {
        throw new Error('Failed to create order');
      }

      const { orderId, currency, key } = await orderResponse.json();

      // Open Razorpay checkout
      const options = {
        key, // Your Key ID
        amount: amount * 100, // Amount in paise
        currency,
        name: 'Your App',
        description,
        order_id: orderId,
        prefill: {
          name: userName,
          email: userEmail,
        },
        theme: {
          color: '#3399cc',
        },
        handler: async (response: any) => {
          try {
            // Verify payment
            const verifyResponse = await fetch('/api/payment/razorpay', {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_order_id: response.razorpay_order_id,
                razorpay_signature: response.razorpay_signature,
              }),
            });

            if (!verifyResponse.ok) {
              throw new Error('Payment verification failed');
            }

            const verifyData = await verifyResponse.json();

            if (onSuccess) {
              onSuccess(verifyData);
            }

            // Redirect to success page
            router.push(`/payment/success?orderId=${orderId}&transactionId=${response.razorpay_payment_id}`);
          } catch (error) {
            console.error('Payment verification error:', error);
            if (onError) {
              onError(error);
            }
            router.push(`/payment/cancel?orderId=${orderId}`);
          }
        },
        modal: {
          ondismiss: () => {
            setLoading(false);
            if (onError) {
              onError(new Error('Payment cancelled by user'));
            }
          },
        },
      };

      const razorpay = new window.Razorpay(options);
      razorpay.open();
    } catch (error) {
      console.error('Payment error:', error);
      if (onError) {
        onError(error);
      }
      alert('Payment failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handlePayment}
      disabled={loading}
      className="w-full px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
    >
      {loading ? 'Processing...' : `Pay ₹${(amount / 100).toFixed(2)} for ${planName}`}
    </button>
  );
}
