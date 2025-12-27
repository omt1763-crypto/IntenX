'use client'

import { useState, useEffect } from 'react'
import { AlertCircle, Lock, CreditCard } from 'lucide-react'
import Link from 'next/link'

/**
 * Interview Limit Check Component
 * Shows user their interview count and subscription status
 * Prevents access to interviews if limit exceeded
 */

export default function InterviewLimitCheck({ userId, onCanStart }) {
  const [limitStatus, setLimitStatus] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    checkInterviewLimit()
  }, [userId])

  const checkInterviewLimit = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/interview-limits/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId })
      })

      const data = await response.json()
      setLimitStatus(data)

      // Pass status to parent
      if (onCanStart) {
        onCanStart(data.allowed)
      }
    } catch (err) {
      console.error('Error checking interview limit:', err)
      setError('Failed to check interview limit')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
        <p className="text-slate-600 text-sm font-medium">Checking interview availability...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 rounded-lg border border-red-200">
        <p className="text-red-800 text-sm font-medium flex items-center gap-2">
          <AlertCircle className="w-4 h-4" />
          {error}
        </p>
      </div>
    )
  }

  if (!limitStatus) {
    return null
  }

  // User has subscription - unlimited interviews
  if (limitStatus.has_subscription) {
    return (
      <div className="p-4 bg-emerald-50 rounded-lg border border-emerald-300">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-emerald-900 font-semibold flex items-center gap-2">
              ✅ Subscription Active
            </p>
            <p className="text-emerald-700 text-sm mt-1">
              You have unlimited interviews
            </p>
          </div>
          <span className="px-3 py-1 bg-emerald-200 text-emerald-900 text-xs font-bold rounded-full">
            Premium
          </span>
        </div>
      </div>
    )
  }

  // User can still start interview (free tier)
  if (limitStatus.allowed && !limitStatus.has_subscription) {
    return (
      <div className="p-4 bg-blue-50 rounded-lg border border-blue-300">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-blue-900 font-semibold">
              {limitStatus.interviews_left > 0 ? '🎯 Free Interviews Remaining' : 'Limit Reached'}
            </p>
            <p className="text-blue-700 text-sm mt-2">
              <strong>{limitStatus.interviews_left}</strong> interview(s) left in your free trial
            </p>
            {limitStatus.interviews_left === 1 && (
              <p className="text-blue-700 text-xs mt-2 font-semibold">
                ⚠️ After this interview, you'll need a subscription to continue
              </p>
            )}
          </div>
          <span className="px-3 py-1 bg-blue-200 text-blue-900 text-xs font-bold rounded-full">
            Free
          </span>
        </div>
      </div>
    )
  }

  // User exceeded limit and has no subscription
  return (
    <div className="p-4 bg-red-50 rounded-lg border border-red-300">
      <div className="flex items-start gap-3">
        <Lock className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <p className="text-red-900 font-semibold">🔒 Interview Limit Reached</p>
          <p className="text-red-700 text-sm mt-2">
            You've used all {limitStatus.interviews_used} free interviews
          </p>
          <p className="text-red-600 text-xs mt-2">
            Upgrade to our Professional plan to continue practicing
          </p>
          <Link href="/pricing">
            <button className="mt-3 px-4 py-2 bg-red-600 text-white text-sm font-semibold rounded-lg hover:bg-red-700 transition-all flex items-center gap-2">
              <CreditCard className="w-4 h-4" />
              Subscribe Now - $25/month
            </button>
          </Link>
        </div>
      </div>
    </div>
  )
}

/**
 * Hook to check interview limits
 * Use in interview pages
 */
export function useInterviewLimit(userId) {
  const [canStart, setCanStart] = useState(false)
  const [limitData, setLimitData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    checkLimit()
  }, [userId])

  const checkLimit = async () => {
    try {
      const response = await fetch('/api/interview-limits/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId })
      })

      const data = await response.json()
      setLimitData(data)
      setCanStart(data.allowed)
    } catch (err) {
      console.error('Error checking interview limit:', err)
      setCanStart(false)
    } finally {
      setLoading(false)
    }
  }

  const recordInterviewComplete = async (interviewId, interviewType, duration, score, feedback) => {
    try {
      const response = await fetch('/api/interview-limits/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userId,
          interview_id: interviewId,
          interview_type: interviewType,
          duration_minutes: duration,
          score: score,
          feedback: feedback
        })
      })

      const data = await response.json()
      if (data.success) {
        setLimitData(data.stats)
      }
      return data.success
    } catch (err) {
      console.error('Error recording interview:', err)
      return false
    }
  }

  return {
    canStart,
    limitData,
    loading,
    recordInterviewComplete,
    refreshLimit: checkLimit
  }
}
