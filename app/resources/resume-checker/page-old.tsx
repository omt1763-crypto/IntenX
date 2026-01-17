'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FileUp, Zap, X, CheckCircle2, BarChart3, Sparkles, ArrowRight } from 'lucide-react'
import { ResumeUpload, ResumeAnalysis } from '@/components/resume-checker'

type Step = 'upload' | 'analyzing' | 'results'

export default function ResumeChecker() {
  const [currentStep, setCurrentStep] = useState<Step>('upload')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [isVerified, setIsVerified] = useState(false)
  const [showPhoneModal, setShowPhoneModal] = useState(false)
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [analysisResults, setAnalysisResults] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const handleUploadClick = () => {
    if (!isVerified) {
      setShowPhoneModal(true)
    }
  }

  const handlePhoneVerified = (phone: string) => {
    setPhoneNumber(phone)
    setIsVerified(true)
    setShowPhoneModal(false)
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
    <div className="relative min-h-screen bg-gradient-to-br from-background to-background pt-20 pb-20 px-4">
      {/* Animated background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-flow-purple/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-flow-blue/10 rounded-full blur-3xl"></div>
        <div className="absolute top-1/3 right-0 w-96 h-96 bg-flow-pink/5 rounded-full blur-3xl"></div>
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
            <Zap className="w-8 h-8 text-flow-purple" />
            <h1 className="text-4xl md:text-5xl font-bold text-foreground">Resume Checker</h1>
          </div>
          <p className="text-xl text-muted-foreground mb-4">
            Is your resume good enough?
          </p>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            AI-powered resume analysis with 16 crucial checks to ensure your resume is ready to land you interview callbacks
          </p>
        </motion.div>

        {/* Main Content */}
        <div className="grid md:grid-cols-3 gap-8">
          {/* Sidebar Info - Only show on desktop */}
          <div className="hidden md:flex flex-col gap-4">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="glass-effect border border-border/50 rounded-2xl p-6 hover:bg-card hover:border-flow-purple/20 transition"
            >
              <div className="flex gap-3 mb-3">
                <FileUp className="w-6 h-6 text-green-500 flex-shrink-0" />
                <h3 className="font-semibold text-foreground">Upload Resume</h3>
              </div>
              <p className="text-sm text-muted-foreground">
                Drag and drop or select your resume in PDF or DOCX format
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
              className="glass-effect border border-border/50 rounded-2xl p-6 hover:bg-card hover:border-flow-blue/20 transition"
            >
              <div className="flex gap-3 mb-3">
                <Zap className="w-6 h-6 text-flow-blue flex-shrink-0" />
                <h3 className="font-semibold text-foreground">Instant Analysis</h3>
              </div>
              <p className="text-sm text-muted-foreground">
                Get AI-powered insights in seconds with detailed recommendations
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 }}
              className="bg-gradient-to-br from-flow-purple/15 via-card to-flow-blue/10 border border-border/50 rounded-2xl p-6 hover:border-flow-purple/20 transition"
            >
              <h3 className="font-semibold text-foreground mb-3">16 Crucial Checks</h3>
              <ul className="text-sm text-muted-foreground space-y-2">
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
              {currentStep === 'upload' && !loading && (
                <ResumeUpload 
                  onResumeSelected={handleResumeSelected} 
                  phoneNumber={phoneNumber}
                  isVerified={isVerified}
                  onUploadClick={handleUploadClick}
                />
              )}

              {currentStep === 'analyzing' && (
                <div className="glass-effect border border-border/50 rounded-2xl p-12 text-center">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                    className="w-16 h-16 border-4 border-flow-purple/30 border-t-flow-purple rounded-full mx-auto mb-6"
                  ></motion.div>
                  <h3 className="text-2xl font-bold text-foreground mb-2">Analyzing Your Resume</h3>
                  <p className="text-muted-foreground">
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
          <div className="glass-effect border border-border/50 rounded-xl p-6">
            <h4 className="font-semibold text-foreground mb-2">What We Check</h4>
            <p className="text-sm text-muted-foreground">
              Content quality, ATS compatibility, formatting, and keyword optimization
            </p>
          </div>
          <div className="glass-effect border border-border/50 rounded-xl p-6">
            <h4 className="font-semibold text-foreground mb-2">AI Powered</h4>
            <p className="text-sm text-muted-foreground">
              Advanced AI analysis to provide actionable insights for improvement
            </p>
          </div>
          <div className="glass-effect border border-border/50 rounded-xl p-6">
            <h4 className="font-semibold text-foreground mb-2">Instant Results</h4>
            <p className="text-sm text-muted-foreground">
              Get your score and detailed analysis in seconds
            </p>
          </div>
        </motion.div>
      </div>

      {/* Phone Verification Modal */}
      <AnimatePresence>
        {showPhoneModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            onClick={() => setShowPhoneModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-md"
            >
              <button
                onClick={() => setShowPhoneModal(false)}
                className="absolute -top-10 right-0 text-foreground hover:text-flow-purple transition"
              >
                <X className="w-6 h-6" />
              </button>
              <div className="p-6 bg-white rounded-lg text-gray-600">Phone verification removed.</div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
