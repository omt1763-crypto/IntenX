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

  // Results View
  if (currentStep === 'results' && analysisResults) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-background pt-20 pb-20">
        <ResumeAnalysis
          results={analysisResults}
          phoneNumber={phoneNumber}
          onReset={handleReset}
        />
      </div>
    )
  }

  // Analyzing View
  if (currentStep === 'analyzing') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-background flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="glass-effect border border-border/50 rounded-2xl p-12 text-center max-w-md"
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
            className="w-16 h-16 border-4 border-flow-purple/30 border-t-flow-purple rounded-full mx-auto mb-6"
          ></motion.div>
          <h3 className="text-2xl font-bold text-foreground mb-2">Analyzing Your Resume</h3>
          <p className="text-muted-foreground">
            Our AI is carefully reviewing your resume using 16 different criteria...
          </p>
        </motion.div>
      </div>
    )
  }

  // Main Upload View
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 dark:from-slate-950 via-blue-50/50 dark:via-slate-900/50 to-slate-50 dark:to-slate-950">
      {/* Header Bar */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="sticky top-0 z-40 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200/50 dark:border-slate-700/50"
      >
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-flow-purple to-flow-blue flex items-center justify-center">
              <FileUp className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-lg font-bold text-foreground">Resume Scanner +</h3>
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

          {/* Upload Modal Button */}
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
        className="py-16 px-4 bg-gradient-to-r from-red-500/10 via-transparent to-transparent border-t border-border/50"
      >
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-bold text-foreground mb-4">
            Why your Resume isn't getting seen?
          </h2>
          <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
            75% of resumes never reach a human recruiter. Instead, companies rely on powerful Applicant Tracking Systems (ATS) to automatically filter through thousands of applications in seconds.
          </p>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="inline-flex items-center gap-2 px-8 py-3 bg-red-500/20 text-red-600 dark:text-red-400 font-semibold rounded-lg border border-red-500/30 hover:bg-red-500/30 transition"
          >
            Fix Now <ArrowRight className="w-5 h-5" />
          </motion.button>
        </div>
      </motion.section>

      {/* Trust Section */}
      <motion.section
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
        viewport={{ once: true }}
        className="py-16 px-4"
      >
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-lg text-muted-foreground mb-4">Relax! We've got your back.....</p>
          <h2 className="text-4xl font-bold text-foreground mb-8">
            Let Resume Scanner+ optimize your resume for ATS success!
          </h2>

          {/* Features Grid */}
          <div className="grid md:grid-cols-3 gap-6 mb-12">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              viewport={{ once: true }}
              className="glass-effect border border-border/50 rounded-2xl p-8 hover:bg-card/50 transition"
            >
              <div className="w-12 h-12 rounded-full bg-flow-purple/20 flex items-center justify-center mb-4 mx-auto">
                <CheckCircle2 className="w-6 h-6 text-flow-purple" />
              </div>
              <h3 className="text-xl font-bold text-foreground mb-2">ATS Compatibility Check</h3>
              <p className="text-muted-foreground">
                Detects formatting issues and ensures your resume is machine-readable
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              viewport={{ once: true }}
              className="glass-effect border border-border/50 rounded-2xl p-8 hover:bg-card/50 transition"
            >
              <div className="w-12 h-12 rounded-full bg-flow-blue/20 flex items-center justify-center mb-4 mx-auto">
                <Sparkles className="w-6 h-6 text-flow-blue" />
              </div>
              <h3 className="text-xl font-bold text-foreground mb-2">Keyword Optimization</h3>
              <p className="text-muted-foreground">
                Matches your resume to the job description for better rankings
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              viewport={{ once: true }}
              className="glass-effect border border-border/50 rounded-2xl p-8 hover:bg-card/50 transition"
            >
              <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center mb-4 mx-auto">
                <TrendingUp className="w-6 h-6 text-green-500" />
              </div>
              <h3 className="text-xl font-bold text-foreground mb-2">Impact Score</h3>
              <p className="text-muted-foreground">
                Measures clarity, action verbs, and result-driven statements
              </p>
            </motion.div>
          </div>

          {/* Comparison */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            viewport={{ once: true }}
            className="bg-gradient-to-r from-red-500/10 to-green-500/10 border border-border/50 rounded-2xl p-12"
          >
            <h3 className="text-2xl font-bold text-foreground mb-8">Resume Transformation</h3>
            <div className="grid md:grid-cols-2 gap-8">
              <div className="p-6 bg-red-500/20 border border-red-500/30 rounded-xl">
                <p className="text-red-600 dark:text-red-400 font-bold mb-4">BEFORE</p>
                <p className="text-foreground font-semibold mb-4">ATS Compatibility Score: 28/100</p>
                <ul className="text-sm text-muted-foreground space-y-2">
                  <li>✗ Missing 15+ relevant keywords</li>
                  <li>✗ Poor formatting & structure</li>
                  <li>✗ Weak action verbs & metrics</li>
                  <li>✗ Generic, unfocused content</li>
                </ul>
              </div>

              <div className="p-6 bg-green-500/20 border border-green-500/30 rounded-xl">
                <p className="text-green-600 dark:text-green-400 font-bold mb-4">AFTER AI OPTIMIZATION</p>
                <p className="text-foreground font-semibold mb-4">ATS Compatibility Score: 94/100</p>
                <ul className="text-sm text-muted-foreground space-y-2">
                  <li>✓ Perfect keyword optimization</li>
                  <li>✓ ATS-friendly formatting</li>
                  <li>✓ Quantified achievements</li>
                  <li>✓ Role-specific tailoring</li>
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
        className="py-16 px-4 bg-gradient-to-b from-transparent to-flow-purple/5 border-t border-border/50"
      >
        <div className="max-w-4xl mx-auto">
          <h2 className="text-4xl font-bold text-foreground mb-12 text-center">How It Works - Get started in 3 steps</h2>

          <div className="grid md:grid-cols-3 gap-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              viewport={{ once: true }}
              className="text-center"
            >
              <div className="w-16 h-16 rounded-full bg-flow-purple text-white flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                1
              </div>
              <h3 className="text-xl font-bold text-foreground mb-2">Upload Your Resume</h3>
              <p className="text-muted-foreground">
                Simply drag & drop or browse to select your resume in PDF or DOCX format
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              viewport={{ once: true }}
              className="text-center"
            >
              <div className="w-16 h-16 rounded-full bg-flow-blue text-white flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                2
              </div>
              <h3 className="text-xl font-bold text-foreground mb-2">Scan and Analyse</h3>
              <p className="text-muted-foreground">
                AI engine evaluates your resume against ATS standards and best practices
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              viewport={{ once: true }}
              className="text-center"
            >
              <div className="w-16 h-16 rounded-full bg-green-500 text-white flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                3
              </div>
              <h3 className="text-xl font-bold text-foreground mb-2">Get Detailed Report</h3>
              <p className="text-muted-foreground">
                Receive actionable insights and recommendations to improve your resume
              </p>
            </motion.div>
          </div>
        </div>
      </motion.section>

      {/* Upload Section */}
      <section id="upload-section" className="py-20 px-4 bg-gradient-to-b from-flow-purple/5 to-transparent">
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
                  ? 'border-flow-purple/50 bg-flow-purple/10'
                  : selectedFile
                  ? 'border-green-600/50 bg-green-500/10'
                  : 'border-border hover:border-flow-purple/50 hover:bg-flow-purple/5'
              }`}
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
                    <h3 className="text-xl font-bold text-foreground mb-2">Resume Selected</h3>
                    <p className="text-muted-foreground mb-2">{selectedFile.name}</p>
                    <p className="text-sm text-muted-foreground">
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
                    <h3 className="text-2xl font-bold text-foreground mb-2">Browse file to upload your resume</h3>
                    <p className="text-muted-foreground mb-6">Only pdf, doc and docx format available. Max file size: 10 MB</p>
                    <label htmlFor="file-input" className="inline-flex items-center gap-2 bg-gradient-to-r from-flow-purple to-flow-blue hover:shadow-lg text-white font-semibold py-3 px-8 rounded-lg transition cursor-pointer">
                      <FileUp className="w-5 h-5" />
                      Browse File
                    </label>
                  </>
                )}
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg flex gap-3"
              >
                <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>
              </motion.div>
            )}

            {/* Scan Button */}
            {selectedFile && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-4"
              >
                <button
                  onClick={handleAnalyze}
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-flow-purple to-flow-blue hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-4 rounded-lg transition flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity }}
                      >
                        <FileUp className="w-5 h-5" />
                      </motion.div>
                      Scanning My Resume...
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
                  className="w-full text-muted-foreground hover:text-foreground text-sm font-medium transition py-2"
                >
                  Change File
                </button>
              </motion.div>
            )}
          </motion.div>
        </div>
      </section>

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
              <PhoneVerification onPhoneVerified={handlePhoneVerified} />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
