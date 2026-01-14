'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Lock, ArrowRight, CheckCircle, AlertCircle } from 'lucide-react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'

export default function ResetPassword() {
  const [mounted, setMounted] = useState(false)
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [status, setStatus] = useState('checking') // checking, ready, expired, success, error
  const [verificationTimeout, setVerificationTimeout] = useState(false)
  const router = useRouter()

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!mounted) return

    let isMounted = true

    const checkResetLink = async () => {
      try {
        // Get the hash from the URL (Supabase sends tokens in fragment)
        const hash = typeof window !== 'undefined' ? window.location.hash : ''
        
        console.log('[ResetPassword] Full URL:', window.location.href)
        console.log('[ResetPassword] Hash:', hash)
        
        if (!hash) {
          console.warn('[ResetPassword] No hash found in URL')
          if (isMounted) {
            setStatus('expired')
            setError('Invalid reset link. Please request a new one.')
          }
          return
        }

        // Parse the hash
        const params = new URLSearchParams(hash.substring(1))
        const accessToken = params.get('access_token')
        const refreshToken = params.get('refresh_token')
        const type = params.get('type')
        const expiresIn = params.get('expires_in')

        console.log('[ResetPassword] Parsed params - type:', type, 'expiresIn:', expiresIn, 'hasAccessToken:', !!accessToken, 'hasRefreshToken:', !!refreshToken)

        if (!accessToken || type !== 'recovery') {
          console.warn('[ResetPassword] Invalid token or type. accessToken:', !!accessToken, 'type:', type)
          if (isMounted) {
            setStatus('expired')
            setError('Invalid reset link. Please request a new one.')
          }
          return
        }

        // Try to set the session with the recovery token
        console.log('[ResetPassword] Attempting to set session with recovery token...')
        const { error: sessionError, data } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken || '',
        })

        console.log('[ResetPassword] setSession response - error:', sessionError, 'data:', !!data)

        if (!isMounted) return

        if (sessionError) {
          console.error('[ResetPassword] Session error:', sessionError)
          if (isMounted) {
            setStatus('expired')
            setError('Reset link has expired. Please request a new one.')
          }
          return
        }

        // Verify the session was set
        const { data: { session }, error: getSessionError } = await supabase.auth.getSession()
        console.log('[ResetPassword] Verified session:', !!session, 'session user:', session?.user?.email)

        if (!isMounted) return

        if (!session || getSessionError) {
          console.error('[ResetPassword] Session not established:', getSessionError)
          if (isMounted) {
            setStatus('expired')
            setError('Could not establish session. Please request a new link.')
          }
          return
        }

        console.log('[ResetPassword] Session set successfully, ready for reset')
        if (isMounted) {
          setStatus('ready')
        }
      } catch (err) {
        // Only update state if component is still mounted
        if (!isMounted) return
        
        // Ignore abort errors - they happen when component unmounts
        if (err?.name === 'AbortError') {
          console.log('[ResetPassword] Request aborted (component unmounted)')
          return
        }
        
        console.error('[ResetPassword] Error checking link:', err)
        if (isMounted) {
          setStatus('expired')
          setError(err?.message || 'Invalid reset link. Please request a new one.')
        }
      }
    }

    // Add a small delay to ensure component is fully mounted
    const timer = setTimeout(() => {
      if (isMounted) {
        checkResetLink()
      }
    }, 100)

    // Add a timeout for verification - if it takes longer than 5 seconds, show skip button
    const timeoutTimer = setTimeout(() => {
      if (isMounted && status === 'checking') {
        console.warn('[ResetPassword] Verification taking too long, showing skip option')
        setVerificationTimeout(true)
      }
    }, 5000)

    // Cleanup function to prevent state updates after unmount
    return () => {
      isMounted = false
      clearTimeout(timer)
      clearTimeout(timeoutTimer)
    }
  }, [mounted])

  const handleResetPassword = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    if (!password || !confirmPassword) {
      setError('Please fill in all fields')
      setLoading(false)
      return
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters')
      setLoading(false)
      return
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      setLoading(false)
      return
    }

    try {
      console.log('[ResetPassword] Updating password...')
      
      const { error: updateError } = await supabase.auth.updateUser({
        password: password,
      })

      if (updateError) {
        console.error('[ResetPassword] Update error:', updateError)
        setError(updateError.message || 'Failed to reset password')
        setLoading(false)
        return
      }

      console.log('[ResetPassword] Password updated successfully')
      setStatus('success')
      setSuccess(true)
      setPassword('')
      setConfirmPassword('')

      // Redirect to login after 3 seconds
      setTimeout(() => {
        router.push('/auth/login?message=Password%20reset%20successfully.%20You%20can%20now%20log%20in.')
      }, 3000)
    } catch (err) {
      console.error('[ResetPassword] Error:', err)
      setError(err.message || 'Failed to reset password')
    }

    setLoading(false)
  }

  if (!mounted) return null

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      {/* Grid background */}
      <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md relative z-10"
      >
        {status === 'checking' ? (
          // Loading state
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-slate-400">Verifying reset link...</p>
            
            {verificationTimeout && (
              <div className="mt-6 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                <p className="text-yellow-400 text-sm mb-3">Verification is taking longer than expected.</p>
                <button
                  onClick={() => {
                    // Skip verification and assume link is valid
                    setStatus('ready')
                  }}
                  className="text-yellow-400 hover:text-yellow-300 font-semibold underline"
                >
                  Click here to continue anyway
                </button>
              </div>
            )}
          </div>
        ) : status === 'expired' ? (
          // Expired link
          <div className="text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2 }}
              className="w-16 h-16 bg-red-500/20 border border-red-500/30 rounded-full flex items-center justify-center mx-auto mb-6"
            >
              <AlertCircle size={32} className="text-red-400" />
            </motion.div>

            <h2 className="text-2xl font-bold text-white mb-2">Link Expired</h2>
            <p className="text-slate-400 mb-6">{error || 'This password reset link has expired.'}</p>

            <Link
              href="/auth/forgot-password"
              className="inline-flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 px-6 rounded-lg transition"
            >
              Request New Link
              <ArrowRight size={18} />
            </Link>
          </div>
        ) : success ? (
          // Success state
          <div className="text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2 }}
              className="w-16 h-16 bg-green-500/20 border border-green-500/30 rounded-full flex items-center justify-center mx-auto mb-6"
            >
              <CheckCircle size={32} className="text-green-400" />
            </motion.div>

            <h2 className="text-2xl font-bold text-white mb-2">Password Reset</h2>
            <p className="text-slate-400 mb-6">Your password has been reset successfully. You'll be redirected to login shortly.</p>

            <Link
              href="/auth/login"
              className="inline-flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 px-6 rounded-lg transition"
            >
              Go to Login
              <ArrowRight size={18} />
            </Link>
          </div>
        ) : (
          // Form state
          <>
            {/* Header */}
            <div className="text-center mb-8">
              <h1 className="text-4xl font-bold text-white mb-2">Set New Password</h1>
              <p className="text-slate-400">
                Enter a new password to secure your account.
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleResetPassword} className="space-y-6">
              {/* Password Input */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  New Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={20} />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="At least 6 characters"
                    className="w-full pl-10 pr-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 transition"
                    disabled={loading}
                  />
                </div>
              </div>

              {/* Confirm Password Input */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Confirm Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={20} />
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm your password"
                    className="w-full pl-10 pr-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 transition"
                    disabled={loading}
                  />
                </div>
              </div>

              {/* Error Message */}
              {error && (
                <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
                  <p className="text-red-400 text-sm">{error}</p>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-lg transition flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    Resetting...
                  </>
                ) : (
                  <>
                    Reset Password
                    <ArrowRight size={18} />
                  </>
                )}
              </button>
            </form>

            {/* Back to login */}
            <p className="text-center text-slate-400 mt-6">
              Remember your password?{' '}
              <Link href="/auth/login" className="text-purple-400 hover:text-purple-300 font-semibold transition">
                Log in here
              </Link>
            </p>
          </>
        )}
      </motion.div>
    </div>
  )
}
