'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'

export default function SubscriptionPaywall({ userId, onClose, remainingInterviews, currentPlan }) {
  const [plans, setPlans] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadPlans()
  }, [])

  const loadPlans = async () => {
    try {
      const res = await fetch(`/api/subscription-plans?userId=${userId}`)
      const data = await res.json()
      setPlans(data.plans || [])
    } catch (err) {
      console.error('Error loading plans:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleUpgrade = (planId: string) => {
    // In production, this would integrate with Stripe/payment gateway
    console.log('Upgrade to plan:', planId)
    alert('Payment integration coming soon! Contact support for manual upgrade.')
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-white rounded-lg max-w-4xl w-full max-h-96 overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-3xl font-bold text-slate-900">Interview Limit Reached</h2>
              <p className="text-slate-600 mt-2">
                You've used all {remainingInterviews === 0 ? 2 : remainingInterviews} free interviews on your {currentPlan} plan
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600 text-2xl"
            >
              ✕
            </button>
          </div>

          {loading ? (
            <div className="text-center py-8">
              <p className="text-slate-600">Loading subscription plans...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {plans.map((plan) => (
                <div
                  key={plan.id}
                  className={`rounded-lg border-2 p-6 transition-all ${
                    plan.name === 'Pro'
                      ? 'border-blue-500 bg-blue-50 scale-105'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <h3 className="text-xl font-bold text-slate-900">{plan.name}</h3>
                  <p className="text-slate-600 text-sm mt-2 h-10">{plan.description}</p>

                  <div className="mt-4">
                    <span className="text-3xl font-bold text-slate-900">
                      ${parseFloat(plan.price).toFixed(2)}
                    </span>
                    <span className="text-slate-600 ml-2">/month</span>
                  </div>

                  <p className="text-sm font-semibold text-slate-900 mt-4">
                    {plan.interview_limit === 999999 ? '∞ Unlimited' : plan.interview_limit} interviews
                  </p>

                  <div className="mt-6 space-y-2">
                    {plan.features && JSON.parse(plan.features).map((feature: string, idx: number) => (
                      <div key={idx} className="flex items-center gap-2">
                        <span className="text-green-600">✓</span>
                        <span className="text-sm text-slate-700">{feature}</span>
                      </div>
                    ))}
                  </div>

                  <button
                    onClick={() => handleUpgrade(plan.id)}
                    className={`w-full mt-6 py-2 rounded-lg font-semibold transition-colors ${
                      plan.name === 'Pro'
                        ? 'bg-blue-600 text-white hover:bg-blue-700'
                        : 'bg-slate-100 text-slate-900 hover:bg-slate-200'
                    }`}
                  >
                    {plan.price === 0 ? 'Current Plan' : 'Upgrade Now'}
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="mt-8 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <p className="text-sm text-slate-700">
              <strong>Tip:</strong> The Pro plan includes unlimited interviews, advanced AI analysis, detailed feedback, and performance tracking!
            </p>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}
