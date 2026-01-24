'use client';

export const dynamic = 'force-dynamic';

import { useSearchParams } from 'next/navigation';
import { CheckCircle } from 'lucide-react';
import Link from 'next/link';
import { Suspense } from 'react';

function PaymentSuccessContent() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get('orderId');
  const transactionId = searchParams.get('transactionId');

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-lg max-w-md w-full p-8 text-center">
        <div className="space-y-4">
          <CheckCircle className="w-16 h-16 text-green-600 mx-auto" />
          <h2 className="text-2xl font-bold text-green-600">Payment Successful!</h2>
          <p className="text-gray-600">Your payment has been processed successfully through Razorpay.</p>
          
          {orderId && (
            <div className="bg-gray-50 rounded-lg p-3 text-left">
              <p className="text-xs text-gray-600 mb-1">Order ID:</p>
              <p className="text-xs font-mono text-gray-900 break-all">{orderId}</p>
            </div>
          )}
          
          {transactionId && (
            <div className="bg-gray-50 rounded-lg p-3 text-left">
              <p className="text-xs text-gray-600 mb-1">Transaction ID:</p>
              <p className="text-xs font-mono text-gray-900 break-all">{transactionId}</p>
            </div>
          )}
          
          <Link
            href="/dashboard"
            className="inline-block w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-bold py-3 px-8 rounded-lg transition-all duration-300 mt-4"
          >
            Go to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function PaymentSuccess() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-50 flex items-center justify-center">Loading...</div>}>
      <PaymentSuccessContent />
    </Suspense>
  );
}
}
