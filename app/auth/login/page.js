'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Mail, Lock, ArrowRight, User, Building2, Briefcase } from 'lucide-react'
import Link from 'next/link'
import { useAuth } from '@/context/AuthContext'

export default function Login() {
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
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const { login } = useAuth()

  useEffect(() => {
    setMounted(true)
  }, [])

  const handleLogin = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    if (!email || !password) {
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
      await login(email, password, selectedRole)

      // Redirect based on role
      if (selectedRole === 'candidate') {
        router.push('/candidate/dashboard')
      } else if (selectedRole === 'recruiter') {
        router.push('/recruiter/dashboard')
      } else if (selectedRole === 'company') {
        router.push('/business/dashboard')
      }
    } catch (err) {
      setError(err.message || 'Failed to login')
      setLoading(false)
    }
  }

  const roleOptions = [
    { value: 'candidate', label: 'Candidate', icon: User },
    { value: 'recruiter', label: 'Recruiter', icon: Briefcase },
    { value: 'company', label: 'Company', icon: Building2 },
  ]

  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6, ease: 'easeOut' },
    },
  }

  if (!mounted) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-slate-400">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen w-full bg-gradient-to-b from-sky-100 via-sky-50 to-blue-100 flex items-center justify-center p-3 sm:p-4 md:p-6 relative overflow-hidden">
      <style>{animationStyle}</style>
      
      {/* Subtle background accent */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-purple-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20"></div>
      </div>

      <motion.div
        className="w-full max-w-sm relative z-10"
        variants={cardVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Glass card matching landing page */}
        <div className="rounded-2xl sm:rounded-3xl border border-sky-200 p-4 sm:p-6 md:p-7 backdrop-blur-xl bg-white/95 shadow-xl">
          {/* Header */}
          <div className="text-center mb-5 sm:mb-6">
            <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent mb-1 sm:mb-2">
              Welcome Back
            </h1>
            <p className="text-xs sm:text-sm text-gray-600">
              Sign in to your IntenX account
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-3 sm:space-y-3.5">
            {/* Role Selection */}
            <div>
              <label className="block text-xs sm:text-sm font-semibold text-gray-800 mb-2">
                I am a
              </label>
              <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
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
                      className={`relative py-2 sm:py-2.5 px-1 sm:px-1.5 rounded-lg transition-all duration-200 flex flex-col items-center gap-1 sm:gap-1.5 font-semibold text-xs ${
                        isSelected
                          ? 'bg-purple-600 border-2 border-purple-600 text-white shadow-lg shadow-purple-400/30'
                          : 'bg-gray-50 border-2 border-gray-200 text-gray-700 hover:border-purple-300'
                      }`}
                    >
                      <IconComponent className="w-3.5 sm:w-4 h-3.5 sm:h-4" />
                      <span className="text-xs">{option.label}</span>
                    </motion.button>
                  )
                })}
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-xs sm:text-sm font-semibold text-gray-800 mb-1">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-2.5 sm:left-3 top-2.5 sm:top-2.5 w-3.5 sm:w-4 h-3.5 sm:h-4 text-purple-600 opacity-60" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && email && password && !loading) {
                      handleLogin(e)
                    }
                  }}
                  placeholder="you@example.com"
                  className="w-full pl-8 sm:pl-9 pr-3 sm:pr-4 py-2 sm:py-2.5 rounded-lg bg-gray-50 border border-gray-200 text-gray-900 placeholder-gray-400 focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-200 transition-all text-xs sm:text-sm"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs sm:text-sm font-semibold text-gray-800 mb-1">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-2.5 sm:left-3 top-2.5 sm:top-2.5 w-3.5 sm:w-4 h-3.5 sm:h-4 text-purple-600 opacity-60" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && email && password && !loading) {
                      handleLogin(e)
                    }
                  }}
                  placeholder="••••••••"
                  className="w-full pl-8 sm:pl-9 pr-3 sm:pr-4 py-2 sm:py-2.5 rounded-lg bg-gray-50 border border-gray-200 text-gray-900 placeholder-gray-400 focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-200 transition-all text-xs sm:text-sm"
                />
              </div>
              {password && (
                <p className={`text-xs mt-0.5 sm:mt-1 ${
                  password.length >= 6 ? 'text-green-600' : 'text-orange-600'
                }`}>
                  {password.length >= 6 ? '✓ Password is valid' : `${6 - password.length} more characters needed`}
                </p>
              )}
            </div>

            {/* Remember Me */}
            <div className="flex items-center justify-between text-xs sm:text-sm pt-1">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  className="w-3.5 sm:w-4 h-3.5 sm:h-4 rounded border-gray-300 text-purple-600"
                  defaultChecked
                />
                <span className="text-gray-700">Remember me</span>
              </label>
              <Link href="#" className="text-purple-600 hover:text-purple-700 font-medium transition">
                Forgot?
              </Link>
            </div>

            {/* Error Message */}
            {error && (
              <div className="p-2.5 sm:p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs sm:text-sm">
                {error}
              </div>
            )}

            {/* Login Button */}
            <motion.button
              type="submit"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              disabled={!email || !password || loading}
              className="w-full mt-4 sm:mt-5 py-2 sm:py-2.5 rounded-full bg-purple-600 text-white font-semibold flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg hover:shadow-purple-500/30 transition-all text-xs sm:text-sm hover:bg-purple-700"
            >
              {loading ? (
                <>
                  <span className="inline-block animate-spin">⚙️</span>
                  Signing in...
                </>
              ) : (
                <>
                  Sign In
                  <ArrowRight className="w-3.5 sm:w-4 h-3.5 sm:h-4" />
                </>
              )}
            </motion.button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-3 sm:gap-4 my-3.5 sm:my-4">
            <div className="flex-1 h-px bg-gray-200" />
            <span className="text-xs text-gray-500">or</span>
            <div className="flex-1 h-px bg-gray-200" />
          </div>

          {/* Sign Up Link */}
          <p className="text-center text-xs sm:text-sm text-gray-700">
            Don't have an account?{' '}
            <Link href="/auth/signup" className="text-purple-600 font-semibold hover:text-purple-700 transition">
              Sign up
            </Link>
          </p>

          {/* Terms */}
          <p className="text-center text-xs text-gray-600 mt-3 sm:mt-4">
            By signing in, you agree to our{' '}
            <Link href="#" className="text-purple-600 hover:text-purple-700 transition">
              Terms
            </Link>{' '}
            and{' '}
            <Link href="#" className="text-purple-600 hover:text-purple-700 transition">
              Privacy
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  )
}
