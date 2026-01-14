'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { CheckCircle, AlertCircle, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'

export default function VerifyEmail() {
  const router = useRouter()
  const [status, setStatus] = useState('verifying') // verifying, success, error
  const [message, setMessage] = useState('Verifying your email...')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!mounted) return

    let isMounted = true
    let timeoutId: any = null

    const verifyEmail = async () => {
      try {
        setStatus('verifying')
        setMessage('Verifying your email address...')

        // Get the hash from the URL (Supabase sends tokens in fragment)
        const hash = typeof window !== 'undefined' ? window.location.hash : ''
        console.log('[VerifyEmail] URL hash:', hash)

        if (hash) {
          // Parse the hash to extract tokens
          const params = new URLSearchParams(hash.substring(1))
          const accessToken = params.get('access_token')
          const type = params.get('type')

          console.log('[VerifyEmail] Extracted from hash - type:', type, 'has token:', !!accessToken)

          if (accessToken && type === 'signup') {
            console.log('[VerifyEmail] Processing Supabase signup verification')
            
            // Supabase automatically creates a session with the access token in the fragment
            // The session is already active from the hash redirect
            const { data: { session }, error: sessionError } = await supabase.auth.getSession()

            if (!isMounted) return

            if (sessionError || !session) {
              console.error('[VerifyEmail] Session error:', sessionError)
              // Try to set session from the URL tokens
              if (accessToken) {
                const { data, error } = await supabase.auth.setSession({
                  access_token: accessToken,
                  refresh_token: params.get('refresh_token') || '',
                })
                
                if (!isMounted) return

                if (error) {
                  throw error
                }
              }
            }

            // Get current user to confirm email is verified
            const { data: { user }, error } = await supabase.auth.getUser()

            if (!isMounted) return

            if (error || !user) {
              console.error('[VerifyEmail] User fetch error:', error)
              setStatus('error')
              setMessage('Error retrieving user information. Please try signing up again.')
              return
            }

            console.log('[VerifyEmail] User verified:', user.id, 'email verified:', user.user_metadata?.email_verified)
            
            setStatus('success')
            setMessage('Email verified successfully! 🎉')
            
            // Redirect to login after 2 seconds
            if (isMounted) {
              timeoutId = setTimeout(() => {
                if (isMounted) {
                  router.push('/auth/login?message=Email%20verified.%20You%20can%20now%20log%20in.')
                }
              }, 2000)
            }
          } else if (!accessToken) {
            if (isMounted) {
              setStatus('error')
              setMessage('Invalid verification link. Please check your email for the correct link.')
            }
          } else {
            if (isMounted) {
              setStatus('error')
              setMessage('This link is for a different type of request. Please check your email.')
            }
          }
        } else {
          if (isMounted) {
            setStatus('error')
            setMessage('Invalid verification link. Please check your email for the correct link.')
          }
        }
      } catch (error) {
        if (!isMounted) return

        // Ignore abort errors
        if (error?.name === 'AbortError') {
          console.log('[VerifyEmail] Request aborted (component unmounted)')
          return
        }

        console.error('[VerifyEmail] Error during verification:', error)
        setStatus('error')
        setMessage('Error verifying email: ' + error.message)
      }
    }

    verifyEmail()

    // Cleanup function
    return () => {
      isMounted = false
      if (timeoutId) {
        clearTimeout(timeoutId)
      }
    }
  }, [mounted, router])

  if (!mounted) {
    return null
  }

  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6, ease: 'easeOut' },
    },
  }

  return (
    <div className="min-h-screen bg-white text-black flex items-center justify-center px-6 py-12 relative overflow-x-hidden" style={{background: 'linear-gradient(180deg, #F6F1FC 0%, #FADCEC 50%, #E0C3FC 100%)'}}>
      {/* Back Button */}
      <Link href="/" className="absolute top-8 left-8 z-50">
        <motion.button
          whileHover={{ scale: 1.05 }}
          className="p-2 rounded-full bg-white/70 border border-purple-300/40 hover:border-purple-500 transition-all"
        >
          <ArrowLeft className="w-5 h-5 text-[#007a78]" />
        </motion.button>
      </Link>

      <motion.div
        className="w-full max-w-md relative z-10"
        variants={cardVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Craftify glass card */}
        <div className="rounded-3xl border border-purple-200/40 p-8 backdrop-blur-2xl bg-white/80 shadow-2xl">
          {/* Header */}
          <div className="text-center mb-8">
            {status === 'verifying' && (
              <>
                <motion.div
                  className="inline-block p-4 rounded-full bg-blue-100 mb-4"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                >
                  <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full" />
                </motion.div>
                <h1 className="text-3xl font-bold text-slate-900 mb-2">
                  Verifying Email
                </h1>
              </>
            )}

            {status === 'success' && (
              <>
                <motion.div
                  className="inline-block p-4 rounded-full bg-green-100 mb-4"
                  animate={{ scale: [0.8, 1, 1] }}
                  transition={{ duration: 0.5 }}
                >
                  <CheckCircle className="w-8 h-8 text-green-600" />
                </motion.div>
                <h1 className="text-3xl font-bold text-slate-900 mb-2">
                  Email Verified!
                </h1>
              </>
            )}

            {status === 'error' && (
              <>
                <motion.div
                  className="inline-block p-4 rounded-full bg-red-100 mb-4"
                  animate={{ scale: [0.8, 1, 1] }}
                  transition={{ duration: 0.5 }}
                >
                  <AlertCircle className="w-8 h-8 text-red-600" />
                </motion.div>
                <h1 className="text-3xl font-bold text-slate-900 mb-2">
                  Verification Failed
                </h1>
              </>
            )}
          </div>

          {/* Message */}
          <div className="text-center mb-8">
            <p className="text-base text-slate-600">
              {message}
            </p>
          </div>

          {/* Status Indicator */}
          {status === 'verifying' && (
            <div className="p-4 rounded-lg bg-blue-50 border border-blue-200 mb-6">
              <p className="text-sm text-center text-slate-700">
                Please wait while we verify your email...
              </p>
            </div>
          )}

          {status === 'success' && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 rounded-lg bg-green-50 border border-green-200 mb-6"
            >
              <p className="text-sm text-center text-green-700">
                ✅ Your email has been verified successfully!
              </p>
              <p className="text-xs text-center text-green-600 mt-2">
                Redirecting to login page...
              </p>
            </motion.div>
          )}

          {status === 'error' && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 rounded-lg bg-red-50 border border-red-200 mb-6"
            >
              <p className="text-sm text-red-700">
                ❌ {message}
              </p>
              <div className="mt-4 space-y-2">
                <Link
                  href="/auth/signup"
                  className="block px-4 py-2 bg-red-600 text-white rounded-lg text-center font-semibold hover:bg-red-700 transition"
                >
                  Try Again with New Email
                </Link>
                <Link
                  href="/auth/login"
                  className="block px-4 py-2 bg-slate-200 text-slate-700 rounded-lg text-center font-semibold hover:bg-slate-300 transition"
                >
                  Back to Login
                </Link>
              </div>
            </motion.div>
          )}

          {status === 'success' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="space-y-3"
            >
              <Link
                href="/auth/login"
                className="block px-4 py-3 bg-gradient-to-r from-purple-600 to-cyan-600 text-white rounded-full text-center font-semibold hover:shadow-lg transition"
              >
                Go to Login →
              </Link>
            </motion.div>
          )}

          {/* Footer */}
          <p className="text-xs text-slate-500 text-center mt-6">
            By completing email verification, you agree to our{' '}
            <Link href="#" className="hover:text-[#11cd68] transition">
              Terms of Service
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  )
}