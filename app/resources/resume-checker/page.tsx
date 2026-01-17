'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FileUp, Zap, X, CheckCircle2, ArrowRight, BarChart3, Sparkles, TrendingUp, Upload, ChevronDown } from 'lucide-react'
import ResumeAnalysis from '@/components/ResumeAnalysis'

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
  const [analysisResults, setAnalysisResults] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [resumeText, setResumeText] = useState('')
  const [jobDescription, setJobDescription] = useState('')
  const [error, setError] = useState('')
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [expandedFAQ, setExpandedFAQ] = useState<number | null>(null)

  useEffect(() => {
    setMounted(true)
  }, [])

  const validateFile = (file: File): boolean => {
    const allowedFormats = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain']
    const maxSize = 5 * 1024 * 1024

    if (!allowedFormats.includes(file.type)) {
      setError('Only PDF, DOCX, and TXT files are allowed')
      return false
    }

    if (file.size > maxSize) {
      setError('File size must be less than 5MB')
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
        void extractResumeText(file)
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
        void extractResumeText(file)
      }
    }
  }

  const extractResumeText = async (file: File) => {
    try {
      setError('')
      const fileName = file.name.toLowerCase()

      if (fileName.endsWith('.pdf')) {
        // Extract PDF on client-side using pdfjs
        const { getDocument } = await import('pdfjs-dist')
        getDocument.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js'

        const arrayBuffer = await file.arrayBuffer()
        const pdf = await getDocument({ data: arrayBuffer }).promise
        let extractedText = ''

        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i)
          const textContent = await page.getTextContent()
          const pageText = textContent.items
            .map((item: any) => (item as any).str || '')
            .join(' ')
          extractedText += pageText + '\n'
        }

        if (extractedText.trim()) {
          setResumeText(extractedText)
          setSelectedFile(file)
        } else {
          setError('Could not extract text from PDF. Please paste your resume text directly.')
        }
      } else if (fileName.endsWith('.docx')) {
        // For DOCX, just send the file to backend
        setSelectedFile(file)
      } else if (fileName.endsWith('.txt')) {
        // Extract TXT on client
        const text = await file.text()
        setResumeText(text)
        setSelectedFile(file)
      }
    } catch (err) {
      console.error('File extraction error:', err)
      setError('Could not extract file. Please paste your resume text directly.')
    }
  }

  const handleAnalyze = async () => {
    if (!resumeText.trim() && !selectedFile) {
      setError('Please paste or upload your resume')
      return
    }

    setCurrentStep('analyzing')
    setLoading(true)

    try {
      const formData = new FormData()
      
      // Add resume - either from text or file
      if (selectedFile) {
        formData.append('file', selectedFile)
      } else {
        formData.append('resumeText', resumeText.trim())
      }
      
      if (jobDescription.trim()) {
        formData.append('jobDescription', jobDescription.trim())
      }

      const response = await fetch('/api/resume-tracker/analyze', {
        method: 'POST',
        body: formData,
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to analyze resume')
      }

      setAnalysisResults(data)
      setCurrentStep('results')
    } catch (error) {
      console.error('Analysis error:', error)
      setCurrentStep('upload')
      setError(error instanceof Error ? error.message : 'Failed to analyze resume. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleReset = () => {
    setCurrentStep('upload')
    setAnalysisResults(null)
    setSelectedFile(null)
    setResumeText('')
    setJobDescription('')
    setError('')
    setShowUploadModal(false)
  }

  if (!mounted) return null

  if (currentStep === 'results' && analysisResults) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 dark:from-slate-950">
        <ResumeAnalysis results={analysisResults} onReset={handleReset} />
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
            Our AI is carefully reviewing your resume using advanced analysis...
          </p>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header Bar */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="sticky top-0 z-40 bg-card/95 backdrop-blur-md border-b border-border/50"
      >
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-full bg-gradient-to-br from-flow-purple via-flow-blue to-green-500 flex items-center justify-center shadow-lg">
              <FileUp className="w-6 h-6 text-white font-bold" />
            </div>
            <h3 className="font-display text-xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">IntenX Scanner</h3>
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            style={{ backgroundColor: '#8241FF' }}
            className="px-6 py-2 text-white hover:opacity-90 font-semibold rounded-lg transition shadow-md"
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
          <div className="absolute top-10 left-20 w-72 h-72 bg-flow-purple/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-10 right-20 w-72 h-72 bg-flow-blue/10 rounded-full blur-3xl"></div>
        </div>

        <div className="max-w-5xl mx-auto relative z-10">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
          >
            <div className="inline-block mb-4 px-6 py-2 rounded-full bg-purple-300/25 border border-purple-300/40">
              <p className="font-display text-lg md:text-xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                AI-POWERED RESUME ANALYSIS
              </p>
            </div>
            <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-6 leading-tight">
              Make Your Resume <br />
              <span className="text-gradient">ATS-Ready in seconds!</span>
            </h1>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto mb-10">
              Get instant, AI-powered feedback to optimize your resume for ATS systems and impress recruiters.
            </p>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowUploadModal(true)}
              style={{ backgroundColor: '#8241FF' }}
              className="inline-flex items-center gap-3 px-10 py-4 text-white font-semibold text-lg rounded-full hover:opacity-90 transition duration-300 shadow-lg"
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
        className="py-20 px-4 bg-card"
      >
        <div className="max-w-5xl mx-auto">
          <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-6">
            75% of Resumes Never Reach a Human Recruiter
          </h2>
          <p className="text-muted-foreground text-lg mb-10 leading-relaxed max-w-3xl">
            In today's competitive job market, companies rely on powerful Applicant Tracking Systems (ATS) to filter resumes automatically. If your resume isn't properly formatted or doesn't contain the right keywords, it's silently rejected.
          </p>
          <motion.button
            whileHover={{ scale: 1.05 }}
            onClick={() => setShowUploadModal(true)}
            className="inline-flex items-center gap-3 px-8 py-4 bg-red-600 hover:bg-red-700 text-white font-bold text-lg rounded-lg transition shadow-lg"
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
        className="py-20 px-4 bg-card"
      >
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16 animate-fade-up">
            <div className="inline-block mb-4 px-6 py-2 rounded-full bg-purple-300/25 border border-purple-300/40">
              <h2 className="font-display text-lg md:text-xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                How It Works
              </h2>
            </div>
            <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
              Simple steps to optimize your resume. Get started in minutes.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                number: '01',
                icon: Upload,
                title: 'Upload Your Resume',
                desc: 'Drag & drop or browse to select your PDF or DOCX file'
              },
              {
                number: '02',
                icon: Zap,
                title: 'Scan and Analyze',
                desc: 'AI evaluates your resume against ATS standards'
              },
              {
                number: '03',
                icon: BarChart3,
                title: 'Get Detailed Report',
                desc: 'Receive actionable insights and recommendations'
              },
            ].map((step, i) => {
              const gradients = [
                "from-purple-500/10 via-purple-400/5 to-blue-500/10",
                "from-blue-500/10 via-cyan-400/5 to-teal-500/10",
                "from-yellow-500/10 via-amber-400/5 to-orange-500/10"
              ];
              return (
                <div
                  key={i}
                  className="group animate-fade-up"
                  style={{ animationDelay: `${0.1 + i * 0.05}s` }}
                >
                  <div className={`bg-gradient-to-br ${gradients[i % 3]} rounded-2xl p-6 border border-border/50 hover:shadow-card hover:border-border/80 transition-all duration-300 h-full flex flex-col overflow-hidden relative`}>
                    <div className="mb-6 relative z-10">
                      <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-purple-500/20 to-blue-500/10 flex items-center justify-center mb-3">
                        <p className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                          {step.number}
                        </p>
                      </div>
                    </div>

                    <h4 className="font-semibold text-foreground mb-3 text-sm group-hover:text-purple-600 transition-colors relative z-10">
                      {step.title}
                    </h4>

                    <p className="text-xs text-muted-foreground leading-relaxed flex-grow relative z-10">
                      {step.desc}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </motion.section>

      {/* Features - Enhanced Cards */}
      <motion.section
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
        viewport={{ once: true }}
        className="py-20 px-4 bg-card"
      >
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16 animate-fade-up">
            <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-4">
              What We Analyze
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Comprehensive resume evaluation across 7 different metrics for ATS optimization.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                icon: CheckCircle2,
                title: "ATS Compatibility",
                desc: "Ensures your resume passes ATS systems with proper formatting and structure",
                gradient: "from-teal-500/10 via-card to-card",
                borderColor: "hover:border-teal-500/30"
              },
              {
                icon: Sparkles,
                title: "Keyword Optimization",
                desc: "Matches your resume to job descriptions for better ATS rankings",
                gradient: "from-blue-500/10 via-card to-card",
                borderColor: "hover:border-blue-500/30"
              },
              {
                icon: TrendingUp,
                title: "Impact Score",
                desc: "Analyzes clarity, action verbs, and result-driven statements",
                gradient: "from-green-500/10 via-card to-card",
                borderColor: "hover:border-green-500/30"
              },
            ].map((feature, i) => (
              <div
                key={i}
                className={`group bg-gradient-to-br ${feature.gradient} rounded-3xl p-6 border border-border/50 ${feature.borderColor} transition-all duration-300 animate-fade-up hover:shadow-card`}
                style={{ animationDelay: `${0.1 + i * 0.1}s` }}
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500/10 to-blue-500/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <feature.icon className="w-5 h-5 text-flow-purple" />
                  </div>
                  <h3 className="font-semibold text-foreground">{feature.title}</h3>
                </div>
                <p className="text-sm text-muted-foreground">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </motion.section>

      {/* Before/After Transformation */}
      <motion.section
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
        viewport={{ once: true }}
        className="py-20 px-4 bg-card"
      >
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16 animate-fade-up">
            <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-4">
              Real Resume Transformations
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              See how IntenX Scanner transforms ordinary resumes into ATS powerhouses.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Before */}
            <div className="group animate-fade-up" style={{ animationDelay: "0.1s" }}>
              <div className="bg-gradient-to-br from-red-500/10 via-card to-card rounded-3xl p-8 border border-border/50 hover:shadow-card hover:border-red-500/30 transition-all duration-300 h-full flex flex-col">
                <div className="inline-block mb-6 w-fit">
                  <div className="px-4 py-2 rounded-full bg-red-500/20 border border-red-500/40">
                    <p className="text-sm font-bold text-red-600">BEFORE</p>
                  </div>
                </div>
                <div className="mb-8">
                  <p className="text-4xl font-black text-foreground mb-2">28/100</p>
                  <p className="text-sm text-muted-foreground font-medium">ATS Compatibility Score</p>
                </div>
                <div className="w-full bg-red-500/30 rounded-full h-3 mb-8"></div>
                <ul className="text-muted-foreground space-y-3 text-sm flex-grow">
                  <li className="flex items-center gap-2">
                    <span className="text-red-600 font-bold">✗</span> Missing 15+ keywords
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-red-600 font-bold">✗</span> Poor formatting
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-red-600 font-bold">✗</span> Weak action verbs
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-red-600 font-bold">✗</span> Generic content
                  </li>
                </ul>
              </div>
            </div>

            {/* After */}
            <div className="group animate-fade-up" style={{ animationDelay: "0.2s" }}>
              <div className="bg-gradient-to-br from-green-500/10 via-card to-card rounded-3xl p-8 border border-border/50 hover:shadow-card hover:border-green-500/30 transition-all duration-300 h-full flex flex-col">
                <div className="inline-block mb-6 w-fit">
                  <div className="px-4 py-2 rounded-full bg-green-500/20 border border-green-500/40">
                    <p className="text-sm font-bold text-green-600">AFTER</p>
                  </div>
                </div>
                <div className="mb-8">
                  <p className="text-4xl font-black text-foreground mb-2">94/100</p>
                  <p className="text-sm text-muted-foreground font-medium">ATS Compatibility Score</p>
                </div>
                <div className="w-full bg-green-500/40 rounded-full h-3 mb-8"></div>
                <ul className="text-muted-foreground space-y-3 text-sm flex-grow">
                  <li className="flex items-center gap-2">
                    <span className="text-green-600 font-bold">✓</span> Perfect keywords
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-green-600 font-bold">✓</span> ATS-friendly format
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-green-600 font-bold">✓</span> Strong action verbs
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-green-600 font-bold">✓</span> Tailored content
                  </li>
                </ul>
              </div>
            </div>
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
            className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm overflow-y-auto"
            onClick={() => setShowUploadModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-lg my-8"
            >
              <button
                onClick={() => setShowUploadModal(false)}
                className="absolute -top-10 right-0 text-white hover:text-slate-200 transition z-10"
              >
                <X className="w-8 h-8" />
              </button>

              <div className="bg-gradient-to-br from-white to-slate-50 dark:from-slate-900 dark:to-slate-800 rounded-2xl p-6 shadow-2xl border border-slate-200/50 dark:border-slate-700/50 max-h-[90vh] overflow-y-auto">
                <h2 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent mb-1">Upload Your Resume</h2>
                <p className="text-slate-600 dark:text-slate-400 text-sm mb-6">
                  Let's analyze and optimize your resume for ATS success
                </p>

                {/* Upload Area */}
                <input
                  type="file"
                  accept=".pdf,.docx,.txt"
                  onChange={handleFileSelect}
                  className="hidden"
                  id="file-input"
                />
                <label
                  htmlFor="file-input"
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  className={`relative border-2 border-dashed rounded-xl p-6 transition-all cursor-pointer block ${
                    isDragging
                      ? 'border-purple-600 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950/50 dark:to-purple-900/50 shadow-lg shadow-purple-500/30'
                      : selectedFile
                      ? 'border-green-500 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950/50 dark:to-green-900/50 shadow-lg shadow-green-500/20'
                      : 'border-slate-300 dark:border-slate-600 hover:border-purple-600 hover:bg-gradient-to-br hover:from-purple-50 hover:to-purple-100 dark:hover:from-purple-950/50 dark:hover:to-purple-900/50 hover:shadow-lg hover:shadow-purple-500/20'
                  }`}
                >

                  <div className="text-center">
                    {selectedFile ? (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: 'spring' }}
                      >
                        <CheckCircle2 className="w-12 h-12 text-green-600 dark:text-green-400 mx-auto mb-2" />
                        <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1">Ready to Scan</h3>
                        <p className="text-slate-600 dark:text-slate-300 mb-1 text-xs">{selectedFile.name}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          {(selectedFile.size / 1024).toFixed(2)} KB
                        </p>
                      </motion.div>
                    ) : (
                      <>
                        <div className="w-12 h-12 mx-auto mb-2 rounded-full bg-gradient-to-br from-purple-100 to-blue-100 dark:from-purple-900/50 dark:to-blue-900/50 flex items-center justify-center">
                          <FileUp className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                        </div>
                        <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1">
                          Drag & drop your resume
                        </h3>
                        <p className="text-slate-600 dark:text-slate-400 mb-3 text-xs">
                          or click to browse (PDF, DOCX, TXT - max 5MB)
                        </p>
                        <span style={{ backgroundColor: '#8241FF' }} className="inline-flex items-center gap-2 text-white font-bold py-2 px-6 rounded-lg shadow-md text-xs pointer-events-none hover:opacity-90 hover:shadow-lg transition">
                          <FileUp className="w-3 h-3" />
                          Browse File
                        </span>
                      </>
                    )}
                  </div>
                </label>

                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-4 p-3 bg-amber-100 dark:bg-amber-950/40 border-2 border-amber-400 dark:border-amber-700/60 rounded-lg"
                  >
                    <p className="text-amber-700 dark:text-amber-300 font-semibold text-xs">{error}</p>
                  </motion.div>
                )}

                {/* Resume Text Area */}
                <div className="mt-4">
                  <label className="block text-xs font-semibold text-slate-900 dark:text-white mb-2">
                    Or paste your resume text:
                  </label>
                  <textarea
                    value={resumeText}
                    onChange={(e) => {
                      setResumeText(e.target.value)
                      setError('')
                    }}
                    placeholder="Paste your resume text here..."
                    className="w-full h-24 p-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition text-sm"
                  />
                </div>

                {/* Job Description (Optional) */}
                <div className="mt-3">
                  <label className="block text-xs font-semibold text-slate-900 dark:text-white mb-2">
                    Job Description (Optional):
                  </label>
                  <textarea
                    value={jobDescription}
                    onChange={(e) => setJobDescription(e.target.value)}
                    placeholder="Paste the job description..."
                    className="w-full h-20 p-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition text-sm"
                  />
                </div>

                {(resumeText.trim() || selectedFile) && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-4 space-y-2"
                  >
                    <button
                      onClick={handleAnalyze}
                      disabled={loading}
                      style={{ backgroundColor: '#8241FF' }}
                      className="w-full hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-2.5 text-sm rounded-lg transition flex items-center justify-center gap-2 shadow-md"
                    >
                      {loading ? (
                        <>
                          <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1, repeat: Infinity }}
                          >
                            <Zap className="w-4 h-4" />
                          </motion.div>
                          Analyzing...
                        </>
                      ) : (
                        <>
                          <Zap className="w-4 h-4" />
                          Analyze My Resume Now
                        </>
                      )}
                    </button>

                    <button
                      onClick={() => {
                        setSelectedFile(null)
                        setResumeText('')
                      }}
                      className="w-full text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 font-semibold text-xs transition py-1.5"
                    >
                      Clear
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
    </div>
  )
}
