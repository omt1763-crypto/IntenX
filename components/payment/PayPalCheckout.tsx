'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { AlertCircle, CheckCircle, Loader } from 'lucide-react';

declare global {
  interface Window {
    paypal?: any;
  }
}

interface PayPalCheckoutProps {
  planId: string;
  planName: string;
  amount: number;
  description?: string;
  onSuccess?: (details: any) => void;
  onError?: (error: string) => void;
}

export default function PayPalCheckout({
  planId,
  planName,
  amount,
  description = '',
  onSuccess,
  onError,
}: PayPalCheckoutProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleCreatePayPalOrder = async () => {
    setIsLoading(true);
    setError('');

    try {
      // Create PayPal order
      const response = await fetch('/api/payment/paypal', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          planId,
          amount,
          planName,
          userId: 'user-id', // Replace with actual user ID
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create order');
      }

      if (data.approvalUrl) {
        // Redirect to PayPal approval page
        window.location.href = data.approvalUrl;
      } else {
        throw new Error('No approval URL returned');
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'An error occurred';
      setError(errorMsg);
      onError?.(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-green-50 border-2 border-green-200 rounded-lg p-6 text-center"
      >
        <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-3" />
        <h3 className="text-lg font-bold text-green-900 mb-2">Payment Successful!</h3>
        <p className="text-green-700">Your subscription is now active.</p>
      </motion.div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-bold text-gray-900 mb-2">{planName}</h3>
        <p className="text-gray-600 text-sm mb-3">{description}</p>
        <div className="text-2xl font-bold text-blue-600 mb-1">${amount.toFixed(2)}</div>
        <p className="text-xs text-gray-500">One-time payment</p>
      </div>

      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-red-50 border border-red-200 rounded-lg p-4 flex gap-3"
        >
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="font-bold text-red-900">Payment Error</h4>
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        </motion.div>
      )}

      <button
        onClick={handleCreatePayPalOrder}
        disabled={isLoading}
        className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 disabled:from-gray-400 disabled:to-gray-400 text-white font-bold py-3 px-6 rounded-lg transition-all duration-300 flex items-center justify-center gap-2"
      >
        {isLoading ? (
          <>
            <Loader className="w-5 h-5 animate-spin" />
            Processing...
          </>
        ) : (
          <>
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M20.067 8.478c.492.88.556 2.014.3 3.327-.74 3.806-3.276 5.12-6.514 5.12h-.5a.805.805 0 00-.794.68l-.04.22-.63 4.012-.022.12a.806.806 0 01-.794.68h-2.19a.557.557 0 01-.55-.625l.168-1.066.34-2.164.017-.1a.557.557 0 01.55-.464h.625c1.37 0 2.433-.482 2.743-1.88.285-1.308.07-2.1-.492-2.787-.506-.607-1.47-1.08-2.434-1.08h-.9l.59-3.744a1.094 1.094 0 011.078-.915h3.168c2.16 0 3.744.466 4.252 2.517z" />
            </svg>
            Pay with PayPal
          </>
        )}
      </button>

      <p className="text-xs text-gray-500 text-center">
        You will be redirected to PayPal to complete your payment securely.
      </p>
    </div>
  );
}
