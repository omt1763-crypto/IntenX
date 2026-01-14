'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Phone, Shield, AlertCircle, CheckCircle, Loader } from 'lucide-react'

interface PhoneVerificationProps {
  onPhoneVerified: (phoneNumber: string) => void
}

export default function PhoneVerification({ onPhoneVerified }: PhoneVerificationProps) {
  const [step, setStep] = useState<'phone' | 'otp'>('phone')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [otp, setOtp] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [resendCountdown, setResendCountdown] = useState(0)

  const handlePhoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setLoading(true)

    // Validate phone number
    const cleanPhone = phoneNumber.replace(/\D/g, '')
    if (cleanPhone.length < 10) {
      setError('Please enter a valid phone number')
      setLoading(false)
      return
    }

    try {
      const response = await fetch('/api/resume-checker/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phoneNumber: cleanPhone }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Failed to send OTP')
        setLoading(false)
        return
      }

      setSuccess('OTP sent successfully! Check your SMS.')
      setStep('otp')
      setResendCountdown(60)

      // Countdown for resend
      const interval = setInterval(() => {
        setResendCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(interval)
            return 0
          }
          return prev - 1
        })
      }, 1000)
    } catch (err) {
      console.error('Error sending OTP:', err)
      setError('Failed to send OTP. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setLoading(true)

    if (otp.length !== 6) {
      setError('OTP must be 6 digits')
      setLoading(false)
      return
    }

    try {
      const response = await fetch('/api/resume-checker/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phoneNumber: phoneNumber.replace(/\D/g, ''),
          otp,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Invalid OTP')
        setLoading(false)
        return
      }

      setSuccess('Phone number verified! ✓')
      setTimeout(() => {
        onPhoneVerified(phoneNumber)
      }, 500)
    } catch (err) {
      console.error('Error verifying OTP:', err)
      setError('Failed to verify OTP. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleResendOtp = async () => {
    if (resendCountdown > 0) return
    await handlePhoneSubmit(new Event('submit') as any)
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
      className="bg-gradient-to-br from-white to-slate-50 dark:from-slate-900 dark:to-slate-800 border border-slate-200/50 dark:border-slate-700/50 rounded-3xl p-8 md:p-10 shadow-lg"
    >
      {step === 'phone' ? (
        <>
          <div className="text-center mb-8">
            <motion.div
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
              style={{
                background: 'linear-gradient(135deg, rgba(130, 65, 255, 0.1), rgba(59, 130, 246, 0.1))'
              }}
            >
              <Phone className="w-8 h-8" style={{ color: '#8241FF' }} />
            </motion.div>
            <h2 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent mb-2">Verify Your Phone</h2>
            <p className="text-slate-600 dark:text-slate-400">
              Enter your phone number to get started. We'll send you an OTP for verification.
            </p>
          </div>

          <form onSubmit={handlePhoneSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-foreground mb-3">
                Phone Number
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">
                  +
                </span>
                <input
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, '')
                    setPhoneNumber(value)
                  }}
                  placeholder="1 (555) 123-4567"
                  disabled={loading}
                  className="w-full pl-12 pr-4 py-3 bg-card border border-border rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:border-flow-purple focus:ring-2 focus:ring-flow-purple/20 transition disabled:opacity-50"
                />
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Include country code if outside US (e.g., 91 for India)
              </p>
            </div>

            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg flex gap-3"
              >
                <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>
              </motion.div>
            )}

            {success && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 bg-green-500/10 border border-green-500/30 rounded-lg flex gap-3"
              >
                <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                <p className="text-green-600 dark:text-green-400 text-sm">{success}</p>
              </motion.div>
            )}

            <button
              type="submit"
              disabled={loading || phoneNumber.length < 10}
              style={{ backgroundColor: '#8241FF' }}
              className="w-full hover:opacity-90 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3 rounded-xl transition flex items-center justify-center gap-2 text-base"
            >
              {loading ? (
                <>
                  <Loader className="w-5 h-5 animate-spin" />
                  Sending OTP...
                </>
              ) : (
                <>
                  <Shield className="w-5 h-5" />
                  Send OTP via SMS
                </>
              )}
            </button>
          </form>

          <p className="text-center text-xs text-muted-foreground mt-6">
            We respect your privacy. Your phone number will only be used for verification.
          </p>
        </>
      ) : (
        <>
          <div className="text-center mb-8">
            <motion.div
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
              style={{
                background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.1), rgba(59, 130, 246, 0.1))'
              }}
            >
              <Shield className="w-8 h-8" style={{ color: '#8241FF' }} />
            </motion.div>
            <h2 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent mb-2">Enter OTP</h2>
            <p className="text-slate-600 dark:text-slate-400">
              We've sent a 6-digit code to <span className="font-semibold text-slate-900 dark:text-white">{phoneNumber}</span>
            </p>
          </div>

          <form onSubmit={handleOtpSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-foreground mb-3">
                One-Time Password
              </label>
              <input
                type="text"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="000000"
                disabled={loading}
                maxLength={6}
                className="w-full px-4 py-3 bg-card border border-border rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:border-flow-purple focus:ring-2 focus:ring-flow-purple/20 transition disabled:opacity-50 text-center text-2xl tracking-widest font-mono"
              />
            </div>

            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg flex gap-3"
              >
                <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>
              </motion.div>
            )}

            <button
              type="submit"
              disabled={loading || otp.length !== 6}
              style={{ backgroundColor: '#8241FF' }}
              className="w-full hover:opacity-90 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3 rounded-xl transition flex items-center justify-center gap-2 text-base"
            >
              {loading ? (
                <>
                  <Loader className="w-5 h-5 animate-spin" />
                  Verifying...
                </>
              ) : (
                <>
                  <CheckCircle className="w-5 h-5" />
                  Verify OTP
                </>
              )}
            </button>
          </form>

          <div className="text-center mt-6">
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">Didn't receive the code?</p>
            <button
              onClick={handleResendOtp}
              disabled={resendCountdown > 0}
              style={{ color: '#8241FF' }}
              className="hover:opacity-80 font-semibold text-sm disabled:text-slate-400 disabled:cursor-not-allowed transition"
            >
              {resendCountdown > 0
                ? `Resend in ${resendCountdown}s`
                : 'Resend OTP'}
            </button>
          </div>

          <p className="text-center text-xs text-muted-foreground mt-6">
            <button
              onClick={() => {
                setStep('phone')
                setError('')
                setSuccess('')
              }}
              className="text-foreground hover:text-flow-purple underline"
            >
              Change phone number
            </button>
          </p>
        </>
      )}
    </motion.div>
  )
}
