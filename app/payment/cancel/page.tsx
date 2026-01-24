'use client';

export const dynamic = 'force-dynamic';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { XCircle } from 'lucide-react';
import { Suspense } from 'react';

function PaymentCancelContent() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get('orderId');

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-lg max-w-md w-full p-8 text-center">
        <XCircle className="w-16 h-16 text-red-600 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-red-600 mb-2">Payment Cancelled</h2>
        <p className="text-gray-600 mb-4">You have cancelled the payment process with Razorpay.</p>
        <p className="text-gray-500 text-sm mb-6">No charges have been made to your account.</p>
        
        {orderId && (
          <div className="bg-gray-50 rounded-lg p-3 text-left mb-4">
            <p className="text-xs text-gray-600 mb-1">Order ID:</p>
            <p className="text-xs font-mono text-gray-900 break-all">{orderId}</p>
          </div>
        )}
        
        <div className="flex gap-3">
          <Link
            href="/pricing"
            className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-3 px-4 rounded-lg transition-colors"
          >
            Go Back
          </Link>
          <Link
            href="/dashboard"
            className="flex-1 bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-4 rounded-lg transition-colors"
          >
            Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function PaymentCancel() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-50 flex items-center justify-center">Loading...</div>}>
      <PaymentCancelContent />
    </Suspense>
  );
}
