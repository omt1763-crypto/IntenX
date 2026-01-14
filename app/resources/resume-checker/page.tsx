'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FileUp, Zap, X, CheckCircle2, ArrowRight, BarChart3, Sparkles, TrendingUp } from 'lucide-react'
import { PhoneVerification, ResumeAnalysis } from '@/components/resume-checker'

type Step = 'upload' | 'analyzing' | 'results'

export default function ResumeChecker() {
  const [currentStep, setCurrentStep] = useState<Step>('upload')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [isVerified, setIsVerified] = useState(false)
  const [showPhoneModal, setShowPhoneModal] = useState(false)
  const [analysisResults, setAnalysisResults] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    setMounted(true)
  }, [])

  const validateFile = (file: File): boolean => {
    const allowedFormats = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
    const maxSize = 2 * 1024 * 1024

    if (!allowedFormats.includes(file.type)) {
      setError('Only PDF and DOCX files are allowed')
      return false
    }

    if (file.size > maxSize) {
      setError('File size must be less than 2MB')
      return false
    }

    return true
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = () => {
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    setError('')

    const files = e.dataTransfer.files
    if (files.length > 0) {
      const file = files[0]
      if (validateFile(file)) {
        setSelectedFile(file)
      }
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError('')
    const files = e.target.files
    if (files && files.length > 0) {
      const file = files[0]
      if (validateFile(file)) {
        setSelectedFile(file)
      }
    }
  }

  const handleAnalyze = async () => {
    if (!selectedFile) return
    if (!isVerified) {
      setShowPhoneModal(true)
      return
    }

    setCurrentStep('analyzing')
    setLoading(true)

    try {
      const formData = new FormData()
      formData.append('file', selectedFile)
      formData.append('phoneNumber', phoneNumber)
      formData.append('resumeData', JSON.stringify({
        fileName: selectedFile.name,
        fileSize: selectedFile.size,
        fileType: selectedFile.type,
        uploadedAt: new Date().toISOString(),
      }))

      const response = await fetch('/api/resume-checker/analyze-resume', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) throw new Error('Failed to analyze resume')

      const results = await response.json()
      setAnalysisResults(results)
      setCurrentStep('results')
    } catch (error) {
      console.error('Error analyzing resume:', error)
      setCurrentStep('upload')
      setError('Failed to analyze resume. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handlePhoneVerified = (phone: string) => {
    setPhoneNumber(phone)
    setIsVerified(true)
    setShowPhoneModal(false)
  }

  const handleReset = () => {
    setCurrentStep('upload')
    setAnalysisResults(null)
    setSelectedFile(null)
    setError('')
  }

  if (!mounted) return null

  if (currentStep === 'results' && analysisResults) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 dark:from-slate-950">
        <ResumeAnalysis results={analysisResults} phoneNumber={phoneNumber} onReset={handleReset} />
      </div>
    )
  }

  if (currentStep === 'analyzing') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 dark:from-slate-950 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white dark:bg-slate-900 rounded-2xl p-12 text-center max-w-md shadow-lg"
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
            className="w-16 h-16 border-4 border-flow-purple/30 border-t-flow-purple rounded-full mx-auto mb-6"
          ></motion.div>
          <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Analyzing Your Resume</h3>
          <p className="text-slate-600 dark:text-slate-300">
            Our AI is carefully reviewing your resume using 16 different criteria...
          </p>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 dark:from-slate-950 via-blue-50/50 dark:via-slate-900/50 to-slate-50 dark:to-slate-950">
      {/* Header Bar */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="sticky top-0 z-40 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200/50 dark:border-slate-700/50"
      >
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-flow-purple to-flow-blue flex items-center justify-center">
              <FileUp className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Resume Scanner +</h3>
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            className="px-6 py-2 bg-green-500 hover:bg-green-600 text-white font-semibold rounded-lg transition"
          >
            Looking for a Job?
          </motion.button>
        </div>
      </motion.div>

      {/* Hero Section */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="pt-20 pb-16 px-4 text-center"
      >
        <div className="max-w-4xl mx-auto">
          <h1 className="text-5xl md:text-6xl font-black text-slate-900 dark:text-white mb-6">
            Make Your Resume <br />
            <span className="bg-gradient-to-r from-flow-purple via-flow-blue to-green-500 bg-clip-text text-transparent">ATS-Ready in seconds!</span>
          </h1>
          <p className="text-xl text-slate-600 dark:text-slate-300 mb-8 max-w-2xl mx-auto">
            Get instant, AI-powered feedback to optimize your resume for ATS systems and impress recruiters.
          </p>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => window.scrollTo({ top: document.getElementById('upload-section')?.offsetTop || 0, behavior: 'smooth' })}
            className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-green-500 to-teal-500 text-white font-bold rounded-xl hover:shadow-2xl transition duration-300"
          >
            <FileUp className="w-5 h-5" />
            + UPLOAD RESUME <ArrowRight className="w-5 h-5" />
          </motion.button>
        </div>
      </motion.section>

      {/* Problem Section */}
      <motion.section
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
        viewport={{ once: true }}
        className="py-20 px-4 bg-gradient-to-r from-red-500/10 via-orange-500/5 to-transparent"
      >
        <div className="max-w-4xl mx-auto">
          <h2 className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white mb-6">
            75% of Resumes Never Reach a Human Recruiter
          </h2>
          <p className="text-lg text-slate-700 dark:text-slate-300 mb-8 leading-relaxed max-w-3xl">
            In today's competitive job market, most recruiters don't even lay eyes on the majority of resumes they receive. Instead, companies rely on powerful Applicant Tracking Systems (ATS) to automatically filter through thousands of applications in seconds. If your resume isn't properly formatted or doesn't contain the right keywords, it's silently rejected.
          </p>
          <motion.button
            whileHover={{ scale: 1.05 }}
            className="inline-flex items-center gap-2 px-8 py-4 bg-red-500 hover:bg-red-600 text-white font-bold rounded-lg transition"
          >
            Fix Now <ArrowRight className="w-5 h-5" />
          </motion.button>
        </div>
      </motion.section>

      {/* Features Section */}
      <motion.section
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
        viewport={{ once: true }}
        className="py-20 px-4"
      >
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl font-black text-center text-slate-900 dark:text-white mb-16">
            Let Resume Scanner+ optimize your resume for ATS success!
          </h2>

          {/* Features Grid */}
          <div className="grid md:grid-cols-3 gap-6 mb-16">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              viewport={{ once: true }}
              whileHover={{ y: -10 }}
              className="bg-gradient-to-br from-teal-400 via-teal-500 to-teal-600 rounded-2xl p-8 text-white cursor-pointer transition shadow-lg hover:shadow-2xl"
            >
              <div className="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center mb-4">
                <CheckCircle2 className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold mb-3">ATS Compatibility Check</h3>
              <p className="text-white/90 text-lg">
                Detects formatting issues and ensures your resume is machine-readable
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              viewport={{ once: true }}
              whileHover={{ y: -10 }}
              className="bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-600 rounded-2xl p-8 text-white cursor-pointer transition shadow-lg hover:shadow-2xl"
            >
              <div className="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center mb-4">
                <Sparkles className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold mb-3">Compare with Top Performers!</h3>
              <p className="text-white/90 text-lg">
                Matches your resume to job description for better ATS rankings
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              viewport={{ once: true }}
              whileHover={{ y: -10 }}
              className="bg-gradient-to-br from-green-500 via-emerald-500 to-emerald-600 rounded-2xl p-8 text-white cursor-pointer transition shadow-lg hover:shadow-2xl"
            >
              <div className="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center mb-4">
                <TrendingUp className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold mb-3">Customize in a click</h3>
              <p className="text-white/90 text-lg">
                AI-powered suggestions for personalized content and formatting
              </p>
            </motion.div>
          </div>

          {/* Transformation */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h3 className="text-3xl font-black text-center text-slate-900 dark:text-white mb-12">
              From Rejected to Shortlisted – Real Transformations
            </h3>
            <div className="grid md:grid-cols-2 gap-8">
              <div className="bg-gradient-to-br from-red-100 to-pink-50 dark:from-red-950/40 dark:to-red-900/30 border-2 border-red-300 dark:border-red-700/60 rounded-2xl p-8 shadow-lg">
                <div className="inline-block px-4 py-1 bg-red-500 text-white rounded-full text-sm font-bold mb-4">
                  REJECTED
                </div>
                <p className="text-red-900 dark:text-red-200 font-bold text-xl mb-2">Before Optimization</p>
                <p className="text-red-800 dark:text-red-300 font-bold mb-1">ATS Compatibility Score</p>
                <p className="text-5xl font-black text-red-600 dark:text-red-400 mb-8">28/100</p>
                <div className="w-full bg-red-300/50 rounded-full h-3 mb-8"></div>
                <ul className="text-red-800 dark:text-red-300 space-y-3 text-lg">
                  <li className="font-semibold">✗ Missing keywords</li>
                  <li className="font-semibold">✗ Poor formatting</li>
                  <li className="font-semibold">✗ Weak action verbs</li>
                  <li className="font-semibold">✗ Generic content</li>
                </ul>
              </div>

              <div className="bg-gradient-to-br from-green-100 to-emerald-50 dark:from-green-950/40 dark:to-emerald-900/30 border-2 border-green-400 dark:border-green-700/60 rounded-2xl p-8 shadow-lg">
                <div className="inline-block px-4 py-1 bg-green-500 text-white rounded-full text-sm font-bold mb-4">
                  INTERVIEW READY
                </div>
                <p className="text-green-900 dark:text-green-200 font-bold text-xl mb-2">After AI Optimization</p>
                <p className="text-green-800 dark:text-green-300 font-bold mb-1">ATS Compatibility Score</p>
                <p className="text-5xl font-black text-green-600 dark:text-green-400 mb-8">94/100</p>
                <div className="w-full bg-green-400/60 rounded-full h-3 mb-8"></div>
                <ul className="text-green-800 dark:text-green-300 space-y-3 text-lg">
                  <li className="font-semibold">✓ Perfect keywords</li>
                  <li className="font-semibold">✓ ATS-friendly</li>
                  <li className="font-semibold">✓ Quantified achievements</li>
                  <li className="font-semibold">✓ Role-specific</li>
                </ul>
              </div>
            </div>
          </motion.div>
        </div>
      </motion.section>

      {/* How It Works */}
      <motion.section
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
        viewport={{ once: true }}
        className="py-20 px-4 bg-gradient-to-b from-transparent to-teal-500/5"
      >
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl font-black text-center text-slate-900 dark:text-white mb-16">Get started in 3 steps</h2>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              { num: '1', title: 'Upload Your Resume', desc: 'Drag & drop or browse to select PDF or DOCX' },
              { num: '2', title: 'Scan and Analyse', desc: 'AI evaluates against ATS standards' },
              { num: '3', title: 'Get Detailed Report', desc: 'Receive actionable insights' },
            ].map((step, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                viewport={{ once: true }}
                className="text-center"
              >
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-flow-purple to-flow-blue text-white flex items-center justify-center text-3xl font-black mx-auto mb-4 shadow-lg">
                  {step.num}
                </div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">{step.title}</h3>
                <p className="text-slate-600 dark:text-slate-300">{step.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.section>

      {/* Upload Section */}
      <section id="upload-section" className="py-20 px-4">
        <div className="max-w-3xl mx-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="space-y-6"
          >
            {/* Upload Area */}
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`relative border-2 border-dashed rounded-3xl p-12 transition-all ${
                isDragging
                  ? 'border-flow-purple/50 bg-purple-50 dark:bg-purple-950/20'
                  : selectedFile
                  ? 'border-green-600/50 bg-green-50 dark:bg-green-950/20'
                  : 'border-slate-300 dark:border-slate-600 hover:border-flow-purple/50 hover:bg-purple-50 dark:hover:bg-purple-950/10'
              } bg-white dark:bg-slate-900`}
            >
              <input
                type="file"
                accept=".pdf,.docx"
                onChange={handleFileSelect}
                className="hidden"
                id="file-input"
              />

              <div className="text-center">
                {selectedFile ? (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring' }}
                  >
                    <CheckCircle2 className="w-16 h-16 text-green-600 dark:text-green-400 mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Resume Selected</h3>
                    <p className="text-slate-600 dark:text-slate-300 mb-2">{selectedFile.name}</p>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      {(selectedFile.size / 1024).toFixed(2)} KB
                    </p>
                  </motion.div>
                ) : (
                  <>
                    <motion.div
                      animate={{ y: [0, -10, 0] }}
                      transition={{ duration: 2, repeat: Infinity }}
                      className="mb-4"
                    >
                      <FileUp className="w-16 h-16 text-flow-purple mx-auto" />
                    </motion.div>
                    <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Browse file to upload your resume</h3>
                    <p className="text-slate-600 dark:text-slate-300 mb-6">PDF & DOCX only. Max 10MB</p>
                    <label htmlFor="file-input" className="inline-flex items-center gap-2 bg-gradient-to-r from-flow-purple to-flow-blue hover:shadow-lg text-white font-semibold py-3 px-8 rounded-lg transition cursor-pointer">
                      <FileUp className="w-5 h-5" />
                      Browse File
                    </label>
                  </>
                )}
              </div>
            </div>

            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 bg-red-100 dark:bg-red-950/40 border border-red-300 dark:border-red-700/60 rounded-lg"
              >
                <p className="text-red-700 dark:text-red-300 text-sm font-semibold">{error}</p>
              </motion.div>
            )}

            {selectedFile && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-4"
              >
                <button
                  onClick={handleAnalyze}
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-flow-purple to-flow-blue hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-4 rounded-lg transition flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity }}
                      >
                        <Zap className="w-5 h-5" />
                      </motion.div>
                      Scanning...
                    </>
                  ) : (
                    <>
                      <Zap className="w-5 h-5" />
                      Scan My Resume
                    </>
                  )}
                </button>

                <button
                  onClick={() => setSelectedFile(null)}
                  className="w-full text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white text-sm font-medium transition py-2"
                >
                  Change File
                </button>
              </motion.div>
            )}
          </motion.div>
        </div>
      </section>

      {/* Phone Modal */}
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
                className="absolute -top-10 right-0 text-white hover:text-slate-200 transition"
              >
                <X className="w-6 h-6" />
              </button>
              <PhoneVerification onPhoneVerified={handlePhoneVerified} />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
