'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { FileUp, CheckCircle, AlertCircle, Zap, Shield } from 'lucide-react'
import PhoneVerification from '@/components/resume-checker/PhoneVerification'
import ResumeUpload from '@/components/resume-checker/ResumeUpload'
import ResumeAnalysis from '@/components/resume-checker/ResumeAnalysis'

type Step = 'phone' | 'upload' | 'analyzing' | 'results'

export default function ResumeChecker() {
  const [currentStep, setCurrentStep] = useState<Step>('phone')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [isVerified, setIsVerified] = useState(false)
  const [analysisResults, setAnalysisResults] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const handlePhoneVerified = (phone: string) => {
    setPhoneNumber(phone)
    setIsVerified(true)
    setCurrentStep('upload')
  }

  const handleResumeSelected = async (file: File, resumeData: any) => {
    setCurrentStep('analyzing')
    setLoading(true)

    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('phoneNumber', phoneNumber)
      formData.append('resumeData', JSON.stringify(resumeData))

      const response = await fetch('/api/resume-checker/analyze-resume', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        throw new Error('Failed to analyze resume')
      }

      const results = await response.json()
      setAnalysisResults(results)
      setCurrentStep('results')
    } catch (error) {
      console.error('Error analyzing resume:', error)
      setCurrentStep('upload')
    } finally {
      setLoading(false)
    }
  }

  const handleReset = () => {
    setCurrentStep('upload')
    setAnalysisResults(null)
  }

  if (!mounted) return null

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 pt-20 pb-20 px-4">
      {/* Animated background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl"></div>
      </div>

      <div className="max-w-6xl mx-auto relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <div className="flex items-center justify-center gap-2 mb-4">
            <Zap className="w-8 h-8 text-purple-400" />
            <h1 className="text-4xl md:text-5xl font-bold text-white">Resume Checker</h1>
          </div>
          <p className="text-xl text-slate-300 mb-4">
            Is your resume good enough?
          </p>
          <p className="text-slate-400 max-w-2xl mx-auto">
            AI-powered resume analysis with 16 crucial checks to ensure your resume is ready to land you interview callbacks
          </p>
        </motion.div>

        {/* Progress Indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="flex justify-center gap-2 mb-12"
        >
          {(['phone', 'upload', 'results'] as const).map((step, idx) => (
            <div key={step} className="flex items-center">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-all ${
                  currentStep === step || (currentStep === 'analyzing' && step === 'upload')
                    ? 'bg-purple-600 text-white ring-2 ring-purple-400'
                    : isVerified && step === 'upload'
                    ? 'bg-green-600 text-white'
                    : currentStep === 'results' && (step === 'phone' || step === 'upload')
                    ? 'bg-green-600 text-white'
                    : 'bg-slate-700 text-slate-400'
                }`}
              >
                {step === 'phone' && '1'}
                {step === 'upload' && '2'}
                {step === 'results' && '3'}
              </div>
              {idx < 2 && (
                <div
                  className={`w-8 h-1 mx-2 rounded-full transition-all ${
                    isVerified || (currentStep === 'results' && step === 'phone')
                      ? 'bg-green-600'
                      : 'bg-slate-700'
                  }`}
                ></div>
              )}
            </div>
          ))}
        </motion.div>

        {/* Main Content */}
        <div className="grid md:grid-cols-3 gap-8">
          {/* Sidebar Info - Only show on desktop */}
          <div className="hidden md:flex flex-col gap-4">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-6 hover:bg-white/15 transition"
            >
              <div className="flex gap-3 mb-3">
                <CheckCircle className="w-6 h-6 text-green-400 flex-shrink-0" />
                <h3 className="font-semibold text-white">ATS Compatible</h3>
              </div>
              <p className="text-sm text-slate-300">
                Optimized for applicant tracking systems to ensure your resume passes through automated screening
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-6 hover:bg-white/15 transition"
            >
              <div className="flex gap-3 mb-3">
                <Shield className="w-6 h-6 text-blue-400 flex-shrink-0" />
                <h3 className="font-semibold text-white">Privacy Guaranteed</h3>
              </div>
              <p className="text-sm text-slate-300">
                Your resume data is encrypted and never shared with third parties
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 }}
              className="bg-gradient-to-br from-purple-600/30 to-blue-600/30 border border-purple-400/50 rounded-2xl p-6"
            >
              <h3 className="font-semibold text-white mb-3">16 Crucial Checks</h3>
              <ul className="text-sm text-slate-300 space-y-2">
                <li>✓ ATS parse rate</li>
                <li>✓ Grammar & spelling</li>
                <li>✓ Quantified achievements</li>
                <li>✓ Hard & soft skills</li>
                <li>✓ Resume formatting</li>
                <li>✓ And 11 more...</li>
              </ul>
            </motion.div>
          </div>

          {/* Main Content Area */}
          <div className="md:col-span-2">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              {currentStep === 'phone' && !isVerified && (
                <PhoneVerification onPhoneVerified={handlePhoneVerified} />
              )}

              {currentStep === 'upload' && isVerified && !loading && (
                <ResumeUpload onResumeSelected={handleResumeSelected} phoneNumber={phoneNumber} />
              )}

              {currentStep === 'analyzing' && (
                <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-12 text-center">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                    className="w-16 h-16 border-4 border-purple-500/30 border-t-purple-500 rounded-full mx-auto mb-6"
                  ></motion.div>
                  <h3 className="text-2xl font-bold text-white mb-2">Analyzing Your Resume</h3>
                  <p className="text-slate-300">
                    Our AI is carefully reviewing your resume using 16 different criteria...
                  </p>
                </div>
              )}

              {currentStep === 'results' && analysisResults && (
                <ResumeAnalysis
                  results={analysisResults}
                  phoneNumber={phoneNumber}
                  onReset={handleReset}
                />
              )}
            </motion.div>
          </div>
        </div>

        {/* Footer Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="mt-16 grid md:grid-cols-3 gap-6"
        >
          <div className="bg-white/5 border border-white/10 rounded-xl p-6">
            <h4 className="font-semibold text-white mb-2">What We Check</h4>
            <p className="text-sm text-slate-400">
              Content quality, ATS compatibility, formatting, and keyword optimization
            </p>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-xl p-6">
            <h4 className="font-semibold text-white mb-2">AI Powered</h4>
            <p className="text-sm text-slate-400">
              Advanced AI analysis to provide actionable insights for improvement
            </p>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-xl p-6">
            <h4 className="font-semibold text-white mb-2">Instant Results</h4>
            <p className="text-sm text-slate-400">
              Get your score and detailed analysis in seconds
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
