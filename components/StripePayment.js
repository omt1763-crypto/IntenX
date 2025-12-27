'use client'

import { useState } from 'react'
import { loadStripe } from '@stripe/js'
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js'
import { CreditCard, Loader } from 'lucide-react'

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY)

/**
 * Stripe Payment Component
 * Secure payment processing
 */

function StripeCheckoutForm({ userId, email, onSuccess }) {
  const stripe = useStripe()
  const elements = useElements()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)

    if (!stripe || !elements) {
      setError('Stripe not loaded')
      return
    }

    setLoading(true)

    try {
      // Step 1: Create subscription on server
      const subscriptionResponse = await fetch('/api/payment/create-subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userId,
          email: email,
          name: ''
        })
      })

      const subscriptionData = await subscriptionResponse.json()

      if (!subscriptionData.success) {
        setError(subscriptionData.message || 'Failed to create subscription')
        setLoading(false)
        return
      }

      // Step 2: Confirm payment with Stripe
      const result = await stripe.confirmCardPayment(
        subscriptionData.client_secret,
        {
          payment_method: {
            card: elements.getElement(CardElement),
            billing_details: {
              email: email
            }
          }
        }
      )

      if (result.error) {
        setError(result.error.message)
        setLoading(false)
      } else if (result.paymentIntent.status === 'succeeded') {
        setSuccess(true)
        setLoading(false)
        
        // Callback
        if (onSuccess) {
          onSuccess(subscriptionData.subscription_id)
        }
      }
    } catch (err) {
      setError(err.message || 'Payment failed')
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="p-6 bg-emerald-50 rounded-lg border border-emerald-300">
        <p className="text-emerald-900 font-semibold text-center mb-2">✅ Payment Successful!</p>
        <p className="text-emerald-700 text-sm text-center">
          Your subscription is now active. You have unlimited interviews!
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="p-4 border border-slate-200 rounded-lg bg-white">
        <CardElement
          options={{
            style: {
              base: {
                fontSize: '16px',
                color: '#424770',
                '::placeholder': {
                  color: '#aab7c4',
                },
              },
              invalid: {
                color: '#9e2146',
              },
            },
          }}
        />
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded text-red-800 text-sm">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={!stripe || loading}
        className="w-full py-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-semibold rounded-lg hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {loading ? (
          <>
            <Loader className="w-4 h-4 animate-spin" />
            Processing...
          </>
        ) : (
          <>
            <CreditCard className="w-4 h-4" />
            Pay $25/month
          </>
        )}
      </button>

      <p className="text-xs text-slate-600 text-center">
        Your payment is secure and encrypted with Stripe
      </p>
    </form>
  )
}

export function StripePaymentModal({ userId, email, onClose, onSuccess }) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4">
        <h2 className="text-2xl font-bold text-slate-900 mb-2">Subscribe Now</h2>
        <p className="text-slate-600 mb-6">
          Unlimited interviews + AI feedback for just $25/month
        </p>

        <Elements stripe={stripePromise}>
          <StripeCheckoutForm
            userId={userId}
            email={email}
            onSuccess={(subId) => {
              onSuccess?.(subId)
              onClose()
            }}
          />
        </Elements>

        <button
          onClick={onClose}
          className="mt-4 w-full py-2 text-slate-600 font-medium hover:text-slate-900 transition"
        >
          Cancel
        </button>
      </div>
    </div>
  )
}

export default function StripePaymentComponent({ userId, email }) {
  const [showPayment, setShowPayment] = useState(false)

  return (
    <>
      <button
        onClick={() => setShowPayment(true)}
        className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-semibold rounded-lg hover:shadow-lg transition-all flex items-center gap-2"
      >
        <CreditCard className="w-4 h-4" />
        Subscribe Now
      </button>

      {showPayment && (
        <StripePaymentModal
          userId={userId}
          email={email}
          onClose={() => setShowPayment(false)}
          onSuccess={() => {
            setShowPayment(false)
            window.location.reload()
          }}
        />
      )}
    </>
  )
}
