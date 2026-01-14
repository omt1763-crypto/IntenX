'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FileUp, Zap, X, CheckCircle2, ArrowRight, BarChart3, Sparkles, TrendingUp, Upload, ChevronDown } from 'lucide-react'
import { PhoneVerification, ResumeAnalysis } from '@/components/resume-checker'

type Step = 'upload' | 'analyzing' | 'results'

const resumeFAQs = [
  {
    question: "What formats does IntenX Scanner support?",
    answer: "We support PDF and DOCX resume formats. Simply upload your file and our AI will analyze it against ATS standards and industry best practices."
  },
  {
    question: "How does the ATS score calculation work?",
    answer: "Our AI evaluates formatting, keyword density, structure, readability, and compatibility with Applicant Tracking Systems. The score reflects how likely your resume will pass ATS filters."
  },
  {
    question: "Can I get recommendations to improve my resume?",
    answer: "Yes! IntenX Scanner provides detailed recommendations for each category—including specific keywords to add, formatting improvements, and action verbs to strengthen your impact."
  },
  {
    question: "Is my resume data secure?",
    answer: "Absolutely. Your resume is analyzed securely and encrypted. We never share your data with third parties. Your privacy is our priority."
  },
  {
    question: "How long does the analysis take?",
    answer: "Most resume analyses complete in 10-20 seconds. You'll get instant feedback and actionable insights right away."
  },
  {
    question: "Can I use this for multiple resume versions?",
    answer: "Yes! You can upload multiple versions of your resume to test different formats, content variations, and tailoring strategies."
  }
];

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
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [expandedFAQ, setExpandedFAQ] = useState<number | null>(null)

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
    setShowUploadModal(false)
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 dark:from-slate-950 via-blue-50/30 dark:via-slate-900/50 to-slate-50 dark:to-slate-950">
      {/* Header Bar */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="sticky top-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200/50 dark:border-slate-700/50"
      >
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-full bg-gradient-to-br from-flow-purple via-flow-blue to-green-500 flex items-center justify-center shadow-lg">
              <FileUp className="w-6 h-6 text-white font-bold" />
            </div>
            <h3 className="text-xl font-black bg-gradient-to-r from-flow-purple to-flow-blue bg-clip-text text-transparent">IntenX Scanner</h3>
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            className="px-6 py-2 bg-green-500 hover:bg-green-600 text-white font-bold rounded-lg transition shadow-md"
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
        className="py-20 px-4 text-center relative overflow-hidden"
      >
        {/* Background Gradient Orbs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-10 left-20 w-72 h-72 bg-flow-purple/15 rounded-full blur-3xl"></div>
          <div className="absolute bottom-10 right-20 w-72 h-72 bg-flow-blue/15 rounded-full blur-3xl"></div>
        </div>

        <div className="max-w-5xl mx-auto relative z-10">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
          >
            <p className="text-flow-purple font-bold text-lg mb-4">AI-POWERED RESUME ANALYSIS</p>
            <h1 className="text-6xl md:text-7xl font-black text-slate-900 dark:text-white mb-6 leading-tight">
              Make Your Resume <br />
              <span className="bg-gradient-to-r from-flow-purple via-flow-blue to-green-500 bg-clip-text text-transparent">ATS-Ready in seconds!</span>
            </h1>
            <p className="text-2xl text-slate-700 dark:text-slate-300 mb-10 max-w-3xl mx-auto font-semibold">
              Get instant, AI-powered feedback to optimize your resume for ATS systems and impress recruiters.
            </p>

            <motion.button
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowUploadModal(true)}
              className="inline-flex items-center gap-3 px-10 py-5 bg-gradient-to-r from-green-500 via-teal-500 to-cyan-500 text-white font-black text-lg rounded-2xl hover:shadow-2xl transition duration-300 shadow-lg"
            >
              <Upload className="w-6 h-6" />
              UPLOAD RESUME <ArrowRight className="w-6 h-6" />
            </motion.button>
          </motion.div>
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
        <div className="max-w-5xl mx-auto">
          <h2 className="text-5xl md:text-6xl font-black text-slate-900 dark:text-white mb-6">
            75% of Resumes Never Reach a Human Recruiter
          </h2>
          <p className="text-xl text-slate-700 dark:text-slate-300 mb-10 leading-relaxed max-w-3xl">
            In today's competitive job market, companies rely on powerful Applicant Tracking Systems (ATS) to filter resumes automatically. If your resume isn't properly formatted or doesn't contain the right keywords, it's silently rejected.
          </p>
          <motion.button
            whileHover={{ scale: 1.05 }}
            onClick={() => setShowUploadModal(true)}
            className="inline-flex items-center gap-3 px-8 py-4 bg-red-500 hover:bg-red-600 text-white font-bold text-lg rounded-lg transition shadow-lg"
          >
            Fix Now <ArrowRight className="w-5 h-5" />
          </motion.button>
        </div>
      </motion.section>

      {/* How It Works - Like Landing Page */}
      <motion.section
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
        viewport={{ once: true }}
        className="py-20 px-4"
      >
        <div className="max-w-6xl mx-auto">
          <p className="text-center text-flow-purple font-bold text-lg mb-4">SIMPLE PROCESS</p>
          <h2 className="text-5xl font-black text-center text-slate-900 dark:text-white mb-16">
            How It Works - Get started in 3 steps
          </h2>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                num: '1',
                icon: Upload,
                title: 'Upload Your Resume',
                desc: 'Drag & drop or browse to select your PDF or DOCX file'
              },
              {
                num: '2',
                icon: Zap,
                title: 'Scan and Analyze',
                desc: 'AI evaluates your resume against ATS standards'
              },
              {
                num: '3',
                icon: BarChart3,
                title: 'Get Detailed Report',
                desc: 'Receive actionable insights and recommendations'
              },
            ].map((step, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.15 }}
                viewport={{ once: true }}
                whileHover={{ y: -10 }}
                className="bg-white dark:bg-slate-900 rounded-2xl p-8 border-2 border-slate-200 dark:border-slate-700 shadow-lg hover:shadow-xl transition"
              >
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-flow-purple to-flow-blue flex items-center justify-center shadow-lg">
                    <span className="text-white font-black text-3xl">{step.num}</span>
                  </div>
                  <step.icon className="w-8 h-8 text-flow-purple" />
                </div>
                <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-3">{step.title}</h3>
                <p className="text-slate-600 dark:text-slate-300 text-lg">{step.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.section>

      {/* Features - Enhanced Cards */}
      <motion.section
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
        viewport={{ once: true }}
        className="py-20 px-4 bg-gradient-to-b from-transparent to-flow-purple/5"
      >
        <div className="max-w-6xl mx-auto">
          <h2 className="text-5xl font-black text-center text-slate-900 dark:text-white mb-16">
            What We Analyze
          </h2>

          <div className="grid md:grid-cols-3 gap-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              viewport={{ once: true }}
              whileHover={{ y: -12 }}
              className="bg-gradient-to-br from-teal-400 to-teal-600 rounded-2xl p-8 text-white shadow-xl hover:shadow-2xl transition cursor-pointer"
            >
              <div className="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center mb-5">
                <CheckCircle2 className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold mb-3">ATS Compatibility</h3>
              <p className="text-white/90 text-lg leading-relaxed">
                Ensures your resume passes ATS systems with proper formatting and structure
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              viewport={{ once: true }}
              whileHover={{ y: -12 }}
              className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl p-8 text-white shadow-xl hover:shadow-2xl transition cursor-pointer"
            >
              <div className="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center mb-5">
                <Sparkles className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold mb-3">Keyword Optimization</h3>
              <p className="text-white/90 text-lg leading-relaxed">
                Matches your resume to job descriptions for better ATS rankings
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              viewport={{ once: true }}
              whileHover={{ y: -12 }}
              className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl p-8 text-white shadow-xl hover:shadow-2xl transition cursor-pointer"
            >
              <div className="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center mb-5">
                <TrendingUp className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold mb-3">Impact Score</h3>
              <p className="text-white/90 text-lg leading-relaxed">
                Analyzes clarity, action verbs, and result-driven statements
              </p>
            </motion.div>
          </div>
        </div>
      </motion.section>

      {/* Before/After Transformation */}
      <motion.section
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
        viewport={{ once: true }}
        className="py-20 px-4"
      >
        <div className="max-w-6xl mx-auto">
          <h2 className="text-5xl font-black text-center text-slate-900 dark:text-white mb-16">
            Real Resume Transformations
          </h2>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Before */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="bg-gradient-to-br from-red-100 to-pink-50 dark:from-red-950/50 dark:to-red-900/30 border-3 border-red-400 dark:border-red-700 rounded-3xl p-10 shadow-xl"
            >
              <div className="inline-block px-5 py-2 bg-red-500 text-white rounded-full text-sm font-bold mb-6">
                BEFORE
              </div>
              <p className="text-red-900 dark:text-red-200 font-black text-3xl mb-2">28/100</p>
              <p className="text-red-800 dark:text-red-300 font-bold text-xl mb-8">ATS Compatibility Score</p>
              <div className="w-full bg-red-300/50 rounded-full h-4 mb-10"></div>
              <ul className="text-red-800 dark:text-red-300 space-y-4 text-lg font-semibold">
                <li>✗ Missing 15+ keywords</li>
                <li>✗ Poor formatting</li>
                <li>✗ Weak action verbs</li>
                <li>✗ Generic content</li>
              </ul>
            </motion.div>

            {/* After */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="bg-gradient-to-br from-green-100 to-emerald-50 dark:from-green-950/50 dark:to-emerald-900/30 border-3 border-green-500 dark:border-green-700 rounded-3xl p-10 shadow-xl"
            >
              <div className="inline-block px-5 py-2 bg-green-500 text-white rounded-full text-sm font-bold mb-6">
                AFTER
              </div>
              <p className="text-green-900 dark:text-green-200 font-black text-3xl mb-2">94/100</p>
              <p className="text-green-800 dark:text-green-300 font-bold text-xl mb-8">ATS Compatibility Score</p>
              <div className="w-full bg-green-400/70 rounded-full h-4 mb-10"></div>
              <ul className="text-green-800 dark:text-green-300 space-y-4 text-lg font-semibold">
                <li>✓ Perfect keywords</li>
                <li>✓ ATS-friendly format</li>
                <li>✓ Strong action verbs</li>
                <li>✓ Tailored content</li>
              </ul>
            </motion.div>
          </div>
        </div>
      </motion.section>

      {/* Upload Modal */}
      <AnimatePresence>
        {showUploadModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm"
            onClick={() => setShowUploadModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto"
            >
              <button
                onClick={() => setShowUploadModal(false)}
                className="sticky top-0 float-right -mt-4 -mr-4 text-white hover:text-slate-200 transition z-10"
              >
                <X className="w-8 h-8 bg-black/50 rounded-full p-1" />
              </button>

              <div className="bg-white dark:bg-slate-900 rounded-3xl p-10 shadow-2xl">
                <h2 className="text-4xl font-black text-slate-900 dark:text-white mb-2">Upload Your Resume</h2>
                <p className="text-slate-600 dark:text-slate-300 text-lg mb-10">
                  Let's analyze and optimize your resume for ATS success
                </p>

                {/* Upload Area */}
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  className={`relative border-3 border-dashed rounded-2xl p-12 transition-all ${
                    isDragging
                      ? 'border-flow-purple/70 bg-purple-50 dark:bg-purple-950/30'
                      : selectedFile
                      ? 'border-green-500/70 bg-green-50 dark:bg-green-950/30'
                      : 'border-slate-300 dark:border-slate-600 hover:border-flow-purple/70 hover:bg-purple-50 dark:hover:bg-purple-950/20'
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
                        <CheckCircle2 className="w-20 h-20 text-green-600 dark:text-green-400 mx-auto mb-4" />
                        <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Ready to Scan</h3>
                        <p className="text-slate-600 dark:text-slate-300 mb-2 text-lg">{selectedFile.name}</p>
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                          {(selectedFile.size / 1024).toFixed(2)} KB
                        </p>
                      </motion.div>
                    ) : (
                      <>
                        <FileUp className="w-20 h-20 text-flow-purple mx-auto mb-4" />
                        <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
                          Drag & drop your resume here
                        </h3>
                        <p className="text-slate-600 dark:text-slate-300 mb-8 text-lg">
                          or click to browse (PDF & DOCX only, max 10MB)
                        </p>
                        <label
                          htmlFor="file-input"
                          className="inline-flex items-center gap-2 bg-gradient-to-r from-flow-purple to-flow-blue text-white font-bold py-4 px-10 rounded-xl hover:shadow-lg transition cursor-pointer text-lg"
                        >
                          <FileUp className="w-6 h-6" />
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
                    className="mt-6 p-4 bg-red-100 dark:bg-red-950/40 border-2 border-red-400 dark:border-red-700/60 rounded-lg"
                  >
                    <p className="text-red-700 dark:text-red-300 font-semibold">{error}</p>
                  </motion.div>
                )}

                {selectedFile && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-8 space-y-4"
                  >
                    <button
                      onClick={handleAnalyze}
                      disabled={loading}
                      className="w-full bg-gradient-to-r from-flow-purple to-flow-blue hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-5 text-lg rounded-xl transition flex items-center justify-center gap-2"
                    >
                      {loading ? (
                        <>
                          <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1, repeat: Infinity }}
                          >
                            <Zap className="w-6 h-6" />
                          </motion.div>
                          Scanning Resume...
                        </>
                      ) : (
                        <>
                          <Zap className="w-6 h-6" />
                          Scan My Resume Now
                        </>
                      )}
                    </button>

                    <button
                      onClick={() => setSelectedFile(null)}
                      className="w-full text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white font-bold text-lg transition py-3"
                    >
                      Change File
                    </button>
                  </motion.div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* FAQ Section */}
      <motion.section
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
        viewport={{ once: true }}
        className="py-20 px-4 bg-gradient-to-b from-transparent to-blue-50/30 dark:to-slate-900/30"
      >
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-5xl font-black text-slate-900 dark:text-white mb-4">Frequently Asked Questions</h2>
            <p className="text-xl text-slate-700 dark:text-slate-300">Everything you need to know about IntenX Scanner</p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {resumeFAQs.map((faq, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                viewport={{ once: true }}
                className="faq-card bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden transition-all duration-300 hover:border-flow-purple/30 hover:shadow-lg"
              >
                <button
                  onClick={() => setExpandedFAQ(expandedFAQ === idx ? null : idx)}
                  className="w-full px-6 py-5 flex items-start justify-between gap-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                >
                  <h3 className="text-left text-lg font-semibold text-slate-900 dark:text-white leading-tight">
                    {faq.question}
                  </h3>
                  <motion.div
                    animate={{ rotate: expandedFAQ === idx ? 180 : 0 }}
                    transition={{ duration: 0.3 }}
                    className="flex-shrink-0 mt-1"
                  >
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-900/30 text-flow-purple font-bold text-lg">
                      +
                    </div>
                  </motion.div>
                </button>

                {/* Answer - Expandable */}
                <AnimatePresence>
                  {expandedFAQ === idx && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.3 }}
                      className="border-t border-slate-200 dark:border-slate-700"
                    >
                      <div className="px-6 py-5">
                        <p className="text-slate-700 dark:text-slate-300 leading-relaxed">{faq.answer}</p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.section>

      {/* Phone Verification Modal */}
      <AnimatePresence>
        {showPhoneModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm"
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
