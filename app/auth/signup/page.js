'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Mail, Lock, User, Building2, Briefcase, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { useAuth } from '@/context/AuthContext'

export default function Signup() {
  // Craftify style animation CSS
  const animationStyle = `
    @keyframes pulse-glow {
      0%, 100% { opacity: 0.4; }
      50% { opacity: 0.8; }
    }
    @keyframes float-wave {
      0%, 100% { transform: translateY(0px); }
      50% { transform: translateY(-4px); }
    }
    @keyframes shimmer {
      0%, 100% { opacity: 0.4; }
      50% { opacity: 1; }
    }
    @keyframes spin-slow {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }
    .animate-pulse-glow { animation: pulse-glow 3s ease-in-out infinite; }
    .animate-float-wave { animation: float-wave 2.5s ease-in-out infinite; }
    .animate-shimmer { animation: shimmer 2s ease-in-out infinite; }
    .animate-spin-slow { animation: spin-slow 8s linear infinite; }
    @keyframes card-glow {
      0%, 100% {
        border-color: rgba(107, 114, 128, 0.5);
        box-shadow: 0 0 0 0 rgba(59, 130, 246, 0);
      }
      50% {
        border-color: rgba(59, 130, 246, 0.8);
        box-shadow: 0 0 30px 5px rgba(59, 130, 246, 0.4);
      }
    }
    .card-glow-hover:hover { animation: card-glow 2s ease-in-out forwards; }
  `;
  const [mounted, setMounted] = useState(false)
  const [selectedRole, setSelectedRole] = useState('candidate')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [emailError, setEmailError] = useState('')
  const router = useRouter()
  const { signup } = useAuth()

  useEffect(() => {
    setMounted(true)
  }, [])

  const handleSignup = async (e) => {
    e.preventDefault()
    setError('')
    setEmailError('')
    setLoading(true)

    if (!firstName || !lastName || !email || !password) {
      setError('Please fill in all fields')
      setLoading(false)
      return
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters')
      setLoading(false)
      return
    }

    try {
      const result = await signup({
        firstName,
        lastName,
        email,
        password,
      }, selectedRole)

      // Signup successful - redirect to email verification page
      console.log('[Signup Form] Account created successfully, redirecting to verify email...')
      router.push('/auth/verify-email-pending?email=' + encodeURIComponent(email))
    } catch (err) {
      setError(err.message || 'Failed to create account')
      setLoading(false)
    }
  }

  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6, ease: 'easeOut' },
    },
  }

  const roleOptions = [
    { value: 'candidate', label: 'Candidate', icon: User },
    { value: 'recruiter', label: 'Recruiter', icon: Briefcase },
    { value: 'company', label: 'Company', icon: Building2 },
  ]

  if (!mounted) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-slate-400">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-100 via-sky-50 to-blue-100 text-black flex items-center justify-center px-3 sm:px-6 py-8 sm:py-12 relative overflow-x-hidden">
      <style>{animationStyle}</style>

      {/* Back Button */}
      <Link href="/" className="absolute top-6 sm:top-8 left-4 sm:left-8 z-50">
        <motion.button
          whileHover={{ scale: 1.05 }}
          className="p-2 rounded-full bg-white/70 border border-sky-200 hover:border-purple-400 transition-all"
        >
          <ArrowLeft className="w-4 sm:w-5 h-4 sm:h-5 text-purple-600" />
        </motion.button>
      </Link>

      <motion.div
        className="w-full max-w-sm relative z-10"
        variants={cardVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Card */}
        <div className="rounded-2xl sm:rounded-3xl border border-sky-200 p-4 sm:p-6 md:p-7 bg-white/95 shadow-lg">
          {/* Header */}
          <div className="text-center mb-6 sm:mb-7">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-1 sm:mb-2">
              Create Account
            </h1>
            <p className="text-xs sm:text-sm text-gray-700 font-light">
              Join InterviewX and get started today
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSignup} className="space-y-3 sm:space-y-4">
            {/* First Name */}
            <div>
              <label className="block text-xs sm:text-sm font-semibold text-gray-800 mb-1 sm:mb-1.5">
                First Name
              </label>
              <div className="relative">
                <User className="absolute left-3 top-2.5 sm:top-3 w-4 sm:w-5 h-4 sm:h-5 text-gray-600 opacity-60" />
                <input
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && firstName && lastName && email && password && !loading) {
                      handleSignup(e)
                    }
                  }}
                  placeholder="John"
                  className="w-full pl-9 sm:pl-10 pr-3 sm:pr-4 py-2 sm:py-2.5 rounded-lg bg-white border border-sky-200 text-gray-900 placeholder-gray-400 focus:outline-none focus:border-purple-400 focus:ring-1 focus:ring-purple-400 transition-all text-xs sm:text-sm"
                />
              </div>
            </div>

            {/* Last Name */}
            <div>
              <label className="block text-xs sm:text-sm font-semibold text-gray-800 mb-1 sm:mb-1.5">
                Last Name
              </label>
              <div className="relative">
                <User className="absolute left-3 top-2.5 sm:top-3 w-4 sm:w-5 h-4 sm:h-5 text-gray-600 opacity-60" />
                <input
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && firstName && lastName && email && password && !loading) {
                      handleSignup(e)
                    }
                  }}
                  placeholder="Doe"
                  className="w-full pl-9 sm:pl-10 pr-3 sm:pr-4 py-2 sm:py-2.5 rounded-lg bg-white border border-sky-200 text-gray-900 placeholder-gray-400 focus:outline-none focus:border-purple-400 focus:ring-1 focus:ring-purple-400 transition-all text-xs sm:text-sm"
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-xs sm:text-sm font-semibold text-gray-800 mb-1 sm:mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-2.5 sm:top-3 w-4 sm:w-5 h-4 sm:h-5 text-gray-600 opacity-60" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value)
                    setEmailError('')
                  }}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && firstName && lastName && email && password && !loading) {
                      handleSignup(e)
                    }
                  }}
                  placeholder="your@email.com"
                  className={`w-full pl-9 sm:pl-10 pr-3 sm:pr-4 py-2 sm:py-2.5 rounded-lg bg-white border text-gray-900 placeholder-gray-400 focus:outline-none transition-all text-xs sm:text-sm ${
                    emailError
                      ? 'border-red-400 focus:border-red-500 focus:ring-1 focus:ring-red-400'
                      : 'border-sky-200 focus:border-purple-400 focus:ring-1 focus:ring-purple-400'
                  }`}
                />
              </div>
              {emailError && (
                <p className="text-xs text-red-600 mt-1">{emailError}</p>
              )}
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs sm:text-sm font-semibold text-gray-800 mb-1 sm:mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-2.5 sm:top-3 w-4 sm:w-5 h-4 sm:h-5 text-gray-600 opacity-60" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && firstName && lastName && email && password && !loading) {
                      handleSignup(e)
                    }
                  }}
                  placeholder="••••••••"
                  className="w-full pl-9 sm:pl-10 pr-3 sm:pr-4 py-2 sm:py-2.5 rounded-lg bg-white border border-sky-200 text-gray-900 placeholder-gray-400 focus:outline-none focus:border-purple-400 focus:ring-1 focus:ring-purple-400 transition-all text-xs sm:text-sm"
                />
              </div>
              {password && (
                <p className={`text-xs mt-1 ${
                  password.length >= 6 ? 'text-green-600' : 'text-orange-600'
                }`}>
                  {password.length >= 6 ? '✓ Password is valid (6+ characters)' : `${6 - password.length} more character${6 - password.length !== 1 ? 's' : ''} needed`}
                </p>
              )}
            </div>

            {/* Role Selection */}
            <div>
              <label className="block text-xs sm:text-sm font-semibold text-gray-800 mb-2 sm:mb-2.5">
                I am a
              </label>
              <div className="grid grid-cols-3 gap-2 sm:gap-3">
                {roleOptions.map((option) => {
                  const IconComponent = option.icon
                  const isSelected = selectedRole === option.value
                  return (
                    <motion.button
                      key={option.value}
                      type="button"
                      onClick={() => setSelectedRole(option.value)}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className={`relative py-2.5 sm:py-3 px-2 sm:px-3 rounded-lg sm:rounded-xl transition-all duration-200 flex flex-col items-center gap-1 sm:gap-1.5 font-semibold text-xs sm:text-sm ${
                        isSelected
                          ? 'bg-purple-600 border-2 border-purple-600 text-white shadow-lg shadow-purple-500/30'
                          : 'bg-gray-50 border-2 border-sky-200 text-gray-700 hover:border-purple-300'
                      }`}
                    >
                      <IconComponent className="w-4 sm:w-5 h-4 sm:h-5" />
                      <span className="text-xs">{option.label}</span>
                    </motion.button>
                  )
                })}
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="p-2.5 sm:p-3 rounded-lg bg-red-100 border border-red-300 text-red-700 text-xs sm:text-sm">
                {error}
              </div>
            )}

            {/* Divider */}
            <div className="h-px bg-gradient-to-r from-transparent via-sky-200 to-transparent" />

            {/* Create Account Button */}
            <motion.button
              onClick={handleSignup}
              disabled={!firstName || !lastName || !email || !password || loading}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full py-2.5 sm:py-3 rounded-lg bg-purple-600 text-white font-semibold transition-all duration-200 hover:bg-purple-700 hover:shadow-lg hover:shadow-purple-500/30 disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="inline-block animate-spin">⚙️</span>
                  Creating Account...
                </span>
              ) : (
                'Create Account'
              )}
            </motion.button>

            {/* Sign In Link */}
            <div className="text-center">
              <p className="text-xs sm:text-sm text-gray-700">
                Already have an account?{' '}
                <Link
                  href="/auth/login"
                  className="font-semibold text-purple-600 hover:text-purple-700 transition"
                >
                  Sign in
                </Link>
              </p>
            </div>
          </form>
        </div>

        {/* Footer Text */}
        <p className="text-xs text-gray-600 text-center mt-4 sm:mt-6 font-light">
          By signing up, you agree to our{' '}
          <Link href="#" className="hover:text-purple-600 transition">
            Terms of Service
          </Link>{' '}
          and{' '}
          <Link href="#" className="hover:text-purple-600 transition">
            Privacy Policy
          </Link>
        </p>
      </motion.div>
    </div>
  )
}
