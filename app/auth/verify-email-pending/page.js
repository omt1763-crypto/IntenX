'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Mail, CheckCircle2, ArrowLeft } from 'lucide-react'

export default function VerifyEmailPendingPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')

  useEffect(() => {
    // Get email from query or localStorage
    const urlParams = new URLSearchParams(window.location.search)
    const emailParam = urlParams.get('email')
    if (emailParam) {
      setEmail(emailParam)
      localStorage.setItem('pendingVerificationEmail', emailParam)
    } else {
      const stored = localStorage.getItem('pendingVerificationEmail')
      if (stored) setEmail(stored)
    }
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="flex justify-center mb-6">
            <div className="relative">
              <div className="absolute inset-0 bg-blue-100 rounded-full animate-pulse" />
              <div className="relative p-4 bg-blue-600 rounded-full">
                <Mail className="w-8 h-8 text-white" />
              </div>
            </div>
          </div>

          <h1 className="text-2xl font-bold text-slate-900 mb-2">Check Your Email</h1>
          <p className="text-slate-600 mb-6">
            We've sent a verification link to <span className="font-semibold text-blue-600">{email || 'your email'}</span>
          </p>

          <div className="bg-blue-50 rounded-lg p-4 mb-6 text-left">
            <h3 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-green-600" />
              What to do next:
            </h3>
            <ol className="space-y-2 text-sm text-slate-600">
              <li className="flex gap-3">
                <span className="font-semibold text-blue-600">1.</span>
                <span>Check your inbox for an email from us</span>
              </li>
              <li className="flex gap-3">
                <span className="font-semibold text-blue-600">2.</span>
                <span>Click the verification link in the email</span>
              </li>
              <li className="flex gap-3">
                <span className="font-semibold text-blue-600">3.</span>
                <span>You'll be redirected to your dashboard</span>
              </li>
            </ol>
          </div>

          <div className="space-y-3 mb-6">
            <p className="text-xs text-slate-500">
              Didn't receive an email? Check your spam folder or try signing up again.
            </p>
          </div>

          <button
            onClick={() => router.push('/auth/login')}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold mb-3"
          >
            Back to Login
          </button>

          <button
            onClick={() => router.push('/auth/signup')}
            className="w-full px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors font-semibold flex items-center justify-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Sign Up Again
          </button>
        </div>

        <p className="text-center text-xs text-slate-500 mt-6">
          Having trouble? Contact our support team
        </p>
      </div>
    </div>
  )
}
