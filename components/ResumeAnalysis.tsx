'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { Download, ArrowLeft, TrendingUp, CheckCircle2, AlertTriangle, Lightbulb, Zap, Target, FileText, Code2, MessageSquare, BookOpen, Menu, X } from 'lucide-react'
import jsPDF from 'jspdf'
import { useState } from 'react'

interface ResumeAnalysisProps {
  results: any
  phoneNumber?: string
  onReset: () => void
}

export default function ResumeAnalysis({ results, phoneNumber, onReset }: ResumeAnalysisProps) {
  const analysis = results?.analysis || {}
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [activeSection, setActiveSection] = useState<'overview' | 'skills' | 'improvements' | 'interview'>('overview')

  const getScoreGrade = (score: number): { label: string; color: string; bgColor: string; textColor: string } => {
    if (score >= 90) return { label: 'Excellent', color: '#22c55e', bgColor: 'bg-green-50 dark:bg-green-950/30', textColor: 'text-green-700 dark:text-green-300' }
    if (score >= 80) return { label: 'Very Good', color: '#3b82f6', bgColor: 'bg-blue-50 dark:bg-blue-950/30', textColor: 'text-blue-700 dark:text-blue-300' }
    if (score >= 70) return { label: 'Good', color: '#06b6d4', bgColor: 'bg-cyan-50 dark:bg-cyan-950/30', textColor: 'text-cyan-700 dark:text-cyan-300' }
    if (score >= 60) return { label: 'Fair', color: '#f59e0b', bgColor: 'bg-amber-50 dark:bg-amber-950/30', textColor: 'text-amber-700 dark:text-amber-300' }
    return { label: 'Needs Work', color: '#ef4444', bgColor: 'bg-red-50 dark:bg-red-950/30', textColor: 'text-red-700 dark:text-red-300' }
  }

  const getRecommendationColor = (recommendation: string) => {
    switch(recommendation?.toLowerCase()) {
      case 'strong hire': return { bg: 'bg-green-50 dark:bg-green-950/20', border: 'border-green-200 dark:border-green-900/40', text: 'text-green-700 dark:text-green-300' }
      case 'interview': return { bg: 'bg-blue-50 dark:bg-blue-950/20', border: 'border-blue-200 dark:border-blue-900/40', text: 'text-blue-700 dark:text-blue-300' }
      case 'review': return { bg: 'bg-amber-50 dark:bg-amber-950/20', border: 'border-amber-200 dark:border-amber-900/40', text: 'text-amber-700 dark:text-amber-300' }
      case 'reject': return { bg: 'bg-red-50 dark:bg-red-950/20', border: 'border-red-200 dark:border-red-900/40', text: 'text-red-700 dark:text-red-300' }
      default: return { bg: 'bg-slate-50 dark:bg-slate-900/20', border: 'border-slate-200 dark:border-slate-900/40', text: 'text-slate-700 dark:text-slate-300' }
    }
  }

  const MetricCard = ({ label, value, icon: Icon }: { label: string; value: number; icon: any }) => {
    const grade = getScoreGrade(value)
    const circumference = 2 * Math.PI * 45
    const offset = circumference - (value / 100) * circumference

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center p-4 rounded-2xl bg-card border border-border/50 hover:shadow-lg hover:border-border/80 transition-all"
      >
        <div className="relative w-24 h-24 mb-3">
          <svg className="w-24 h-24" style={{ transform: 'rotate(-90deg)' }}>
            <circle
              cx="48"
              cy="48"
              r="45"
              fill="none"
              stroke="currentColor"
              strokeWidth="4"
              className="text-slate-200 dark:text-slate-700"
            />
            <motion.circle
              cx="48"
              cy="48"
              r="45"
              fill="none"
              stroke={grade.color}
              strokeWidth="4"
              strokeDasharray={circumference}
              initial={{ strokeDashoffset: circumference }}
              animate={{ strokeDashoffset: offset }}
              transition={{ duration: 1.5, ease: 'easeInOut' }}
              strokeLinecap="round"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <Icon className="w-5 h-5 text-muted-foreground" />
          </div>
        </div>
        <p className="text-sm font-semibold text-foreground text-center mb-1">{label}</p>
        <div className="flex items-baseline gap-1">
          <span className="text-2xl font-bold" style={{ color: grade.color }}>{value}</span>
          <span className="text-xs text-muted-foreground">/100</span>
        </div>
        <p className={`text-xs font-semibold mt-1 ${grade.textColor}`}>{grade.label}</p>
      </motion.div>
    )
  }

  const CircularProgress = ({ value, size = 120 }: { value: number; size?: number }) => {
    const radius = (size - 8) / 2
    const circumference = radius * 2 * Math.PI
    const offset = circumference - (value / 100) * circumference
    const grade = getScoreGrade(value)

    return (
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth="8"
          className="text-slate-200 dark:text-slate-700"
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={grade.color}
          strokeWidth="8"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.5, ease: 'easeInOut' }}
          strokeLinecap="round"
        />
      </svg>
    )
  }

  const downloadPDF = () => {
    const pdf = new jsPDF()
    const pageWidth = pdf.internal.pageSize.getWidth()
    const pageHeight = pdf.internal.pageSize.getHeight()
    let y = 20

    // Header
    pdf.setFillColor(99, 102, 241)
    pdf.rect(0, 0, pageWidth, 40, 'F')
    pdf.setFontSize(24)
    pdf.setTextColor(255, 255, 255)
    pdf.text('RESUME ANALYSIS REPORT', pageWidth / 2, 18, { align: 'center' })
    pdf.setFontSize(10)
    pdf.text(`Generated on ${new Date().toLocaleDateString()}`, pageWidth / 2, 28, { align: 'center' })

    y = 50

    // Overall Score & Recommendation
    pdf.setFontSize(16)
    pdf.setTextColor(0, 0, 0)
    pdf.setFont(undefined, 'bold')
    pdf.text('OVERALL ASSESSMENT', 15, y)
    y += 8
    pdf.setFontSize(32)
    pdf.setTextColor(99, 102, 241)
    pdf.text(`${analysis.overallScore || 0}/100`, 15, y)
    y += 10
    pdf.setFontSize(11)
    pdf.setTextColor(0, 0, 0)
    pdf.setFont(undefined, 'normal')
    pdf.text(`Experience Level: ${analysis.experienceLevel || 'N/A'}`, 15, y)
    y += 6
    pdf.text(`Hiring Recommendation: ${analysis.hiringRecommendation || 'N/A'}`, 15, y)
    y += 6
    pdf.text(`ATS Score: ${analysis.atsScore || 0}/100`, 15, y)
    y += 12

    // Metrics
    if (analysis.metrics) {
      pdf.setFont(undefined, 'bold')
      pdf.setFontSize(12)
      pdf.text('DETAILED METRICS', 15, y)
      y += 8
      pdf.setFont(undefined, 'normal')
      pdf.setFontSize(10)
      
      const metrics = [
        [`Impact: ${analysis.metrics.impact || 0}/100`, `Brevity: ${analysis.metrics.brevity || 0}/100`],
        [`Style: ${analysis.metrics.style || 0}/100`, `Skills: ${analysis.metrics.skills || 0}/100`],
      ]
      
      metrics.forEach(row => {
        row.forEach((metric, idx) => {
          pdf.text(metric, 15 + idx * 85, y)
        })
        y += 6
      })
      y += 5
    }

    // Summary
    if (analysis.summary) {
      if (y > pageHeight - 40) {
        pdf.addPage()
        y = 20
      }
      pdf.setFont(undefined, 'bold')
      pdf.setFontSize(12)
      pdf.text('SUMMARY', 15, y)
      y += 8
      pdf.setFont(undefined, 'normal')
      pdf.setFontSize(10)
      const summaryLines = pdf.splitTextToSize(analysis.summary, pageWidth - 30)
      summaryLines.forEach((line: string) => {
        if (y > pageHeight - 20) {
          pdf.addPage()
          y = 20
        }
        pdf.text(line, 20, y)
        y += 6
      })
      y += 5
    }

    // Skills
    if (y > pageHeight - 40) {
      pdf.addPage()
      y = 20
    }
    pdf.setFont(undefined, 'bold')
    pdf.setFontSize(12)
    pdf.setTextColor(34, 197, 94)
    pdf.text('TECHNICAL SKILLS', 15, y)
    y += 8
    pdf.setFont(undefined, 'normal')
    pdf.setTextColor(0, 0, 0)
    pdf.setFontSize(10)
    if (analysis.technicalSkills && Array.isArray(analysis.technicalSkills)) {
      analysis.technicalSkills.forEach((skill: string) => {
        pdf.text(`• ${skill}`, 20, y)
        y += 5
      })
    }
    y += 5

    // Missing Skills
    if (y > pageHeight - 40) {
      pdf.addPage()
      y = 20
    }
    pdf.setFont(undefined, 'bold')
    pdf.setFontSize(12)
    pdf.setTextColor(239, 68, 68)
    pdf.text('MISSING SKILLS', 15, y)
    y += 8
    pdf.setFont(undefined, 'normal')
    pdf.setTextColor(0, 0, 0)
    pdf.setFontSize(10)
    if (analysis.missingSkills && Array.isArray(analysis.missingSkills)) {
      analysis.missingSkills.forEach((skill: string) => {
        pdf.text(`• ${skill}`, 20, y)
        y += 5
      })
    }
    y += 5

    // Strengths
    if (y > pageHeight - 40) {
      pdf.addPage()
      y = 20
    }
    pdf.setFont(undefined, 'bold')
    pdf.setFontSize(12)
    pdf.setTextColor(34, 197, 94)
    pdf.text('STRENGTHS', 15, y)
    y += 8
    pdf.setFont(undefined, 'normal')
    pdf.setTextColor(0, 0, 0)
    pdf.setFontSize(10)
    if (analysis.strengths && Array.isArray(analysis.strengths)) {
      analysis.strengths.forEach((strength: string) => {
        const lines = pdf.splitTextToSize(`• ${strength}`, pageWidth - 30)
        lines.forEach((line: string) => {
          if (y > pageHeight - 20) {
            pdf.addPage()
            y = 20
          }
          pdf.text(line, 20, y)
          y += 5
        })
      })
    }
    y += 5

    // Weaknesses
    if (y > pageHeight - 40) {
      pdf.addPage()
      y = 20
    }
    pdf.setFont(undefined, 'bold')
    pdf.setFontSize(12)
    pdf.setTextColor(239, 68, 68)
    pdf.text('WEAKNESSES', 15, y)
    y += 8
    pdf.setFont(undefined, 'normal')
    pdf.setTextColor(0, 0, 0)
    pdf.setFontSize(10)
    if (analysis.weaknesses && Array.isArray(analysis.weaknesses)) {
      analysis.weaknesses.forEach((weakness: string) => {
        const lines = pdf.splitTextToSize(`• ${weakness}`, pageWidth - 30)
        lines.forEach((line: string) => {
          if (y > pageHeight - 20) {
            pdf.addPage()
            y = 20
          }
          pdf.text(line, 20, y)
          y += 5
        })
      })
    }
    y += 5

    // Improvements
    if (y > pageHeight - 40) {
      pdf.addPage()
      y = 20
    }
    pdf.setFont(undefined, 'bold')
    pdf.setFontSize(12)
    pdf.setTextColor(59, 130, 246)
    pdf.text('IMPROVEMENTS', 15, y)
    y += 8
    pdf.setFont(undefined, 'normal')
    pdf.setTextColor(0, 0, 0)
    pdf.setFontSize(10)
    if (analysis.improvements && Array.isArray(analysis.improvements)) {
      analysis.improvements.forEach((improvement: string) => {
        const lines = pdf.splitTextToSize(`• ${improvement}`, pageWidth - 30)
        lines.forEach((line: string) => {
          if (y > pageHeight - 20) {
            pdf.addPage()
            y = 20
          }
          pdf.text(line, 20, y)
          y += 5
        })
      })
    }

    // Interview Topics
    if (analysis.interviewFocusTopics && Array.isArray(analysis.interviewFocusTopics) && analysis.interviewFocusTopics.length > 0) {
      if (y > pageHeight - 40) {
        pdf.addPage()
        y = 20
      }
      pdf.setFont(undefined, 'bold')
      pdf.setFontSize(12)
      pdf.setTextColor(99, 102, 241)
      pdf.text('INTERVIEW FOCUS TOPICS', 15, y)
      y += 8
      pdf.setFont(undefined, 'normal')
      pdf.setTextColor(0, 0, 0)
      pdf.setFontSize(10)
      analysis.interviewFocusTopics.forEach((topic: string) => {
        const lines = pdf.splitTextToSize(`• ${topic}`, pageWidth - 30)
        lines.forEach((line: string) => {
          if (y > pageHeight - 20) {
            pdf.addPage()
            y = 20
          }
          pdf.text(line, 20, y)
          y += 5
        })
      })
    }

    pdf.save(`resume-analysis-${new Date().getTime()}.pdf`)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-900">
      <div className="max-w-7xl mx-auto">
        {/* Header with Navigation */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="sticky top-0 z-40 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200/50 dark:border-slate-700/50 px-6 py-4"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition lg:hidden"
              >
                {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
              <div>
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Resume Analysis</h1>
                <p className="text-xs text-slate-500 dark:text-slate-400">AI-Powered Evaluation</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={downloadPDF}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:shadow-lg transition font-semibold text-sm"
              >
                <Download className="w-4 h-4" />
                Download
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={onReset}
                className="flex items-center gap-2 px-4 py-2 bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-white rounded-lg hover:shadow-md transition font-semibold text-sm"
              >
                <ArrowLeft className="w-4 h-4" />
                New
              </motion.button>
            </div>
          </div>
        </motion.div>

        <div className="flex gap-6 p-6">
          {/* Sidebar Navigation */}
          <AnimatePresence>
            {sidebarOpen && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="hidden lg:block w-48 flex-shrink-0"
              >
                <div className="sticky top-24 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 space-y-2">
                  <button
                    onClick={() => setActiveSection('overview')}
                    className={`w-full text-left px-4 py-3 rounded-lg transition font-semibold text-sm ${
                      activeSection === 'overview'
                        ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 border border-purple-300 dark:border-purple-700'
                        : 'hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    📊 Overview
                  </button>
                  <button
                    onClick={() => setActiveSection('skills')}
                    className={`w-full text-left px-4 py-3 rounded-lg transition font-semibold text-sm ${
                      activeSection === 'skills'
                        ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 border border-purple-300 dark:border-purple-700'
                        : 'hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    🛠️ Skills
                  </button>
                  <button
                    onClick={() => setActiveSection('improvements')}
                    className={`w-full text-left px-4 py-3 rounded-lg transition font-semibold text-sm ${
                      activeSection === 'improvements'
                        ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 border border-purple-300 dark:border-purple-700'
                        : 'hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    💡 Improvements
                  </button>
                  <button
                    onClick={() => setActiveSection('interview')}
                    className={`w-full text-left px-4 py-3 rounded-lg transition font-semibold text-sm ${
                      activeSection === 'interview'
                        ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 border border-purple-300 dark:border-purple-700'
                        : 'hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    🎯 Interview
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Main Content */}
          <div className="flex-1 py-2">
            {/* OVERVIEW SECTION */}
            {(activeSection === 'overview' || typeof window === 'undefined') && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                {/* Detailed Metrics Grid */}
                <div className="mb-8">
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">Detailed Metrics</h2>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {analysis.metrics && (
                      <>
                        <MetricCard label="Impact" value={analysis.metrics.impact || 0} icon={TrendingUp} />
                        <MetricCard label="Brevity" value={analysis.metrics.brevity || 0} icon={Target} />
                        <MetricCard label="Style" value={analysis.metrics.style || 0} icon={Zap} />
                        <MetricCard label="Skills" value={analysis.metrics.skills || 0} icon={Code2} />
                      </>
                    )}
                  </div>
                </div>

                {/* Overall Assessment Card */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-8 bg-gradient-to-br from-white to-blue-50/30 dark:from-slate-800 dark:to-slate-800/50 rounded-2xl p-8 border border-slate-200 dark:border-slate-700 shadow-lg"
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="flex flex-col justify-center">
                      <p className="text-slate-600 dark:text-slate-400 text-sm font-semibold uppercase tracking-wide mb-2">Overall Score</p>
                      <div className="flex items-baseline gap-3 mb-6">
                        <span className="text-6xl font-black bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                          {analysis.overallScore || 0}
                        </span>
                        <span className="text-2xl font-bold text-slate-400">/100</span>
                      </div>
                      
                      <div className="space-y-3 mb-6">
                        <div className="p-3 bg-slate-100 dark:bg-slate-700/50 rounded-lg">
                          <p className="text-xs text-slate-600 dark:text-slate-400 uppercase font-semibold mb-1">Experience Level</p>
                          <p className="text-lg font-bold text-slate-900 dark:text-white">{analysis.experienceLevel || 'N/A'}</p>
                        </div>
                        <div className={`p-3 rounded-lg border-2 ${getRecommendationColor(analysis.hiringRecommendation).bg} ${getRecommendationColor(analysis.hiringRecommendation).border} ${getRecommendationColor(analysis.hiringRecommendation).text}`}>
                          <p className="text-xs uppercase font-semibold mb-1">Hiring Recommendation</p>
                          <p className="text-lg font-bold">{analysis.hiringRecommendation || 'N/A'}</p>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col justify-between">
                      <div className="flex items-center justify-between mb-6">
                        <div>
                          <p className="text-slate-600 dark:text-slate-400 text-sm font-semibold uppercase tracking-wide mb-1">ATS Compatibility</p>
                          <p className="text-4xl font-black text-slate-900 dark:text-white">{analysis.atsScore || 0}/100</p>
                        </div>
                        <CircularProgress value={analysis.atsScore || 0} size={130} />
                      </div>
                      
                      {analysis.summary && (
                        <p className="text-slate-700 dark:text-slate-300 leading-relaxed text-base font-medium">
                          {analysis.summary}
                        </p>
                      )}
                    </div>
                  </div>
                </motion.div>

                {/* Content Quality Metrics */}
                {analysis.contentQuality && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 }}
                      className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700 shadow-md"
                    >
                      <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                          <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase">Bullet Point Quality</p>
                          <p className="text-lg font-bold text-slate-900 dark:text-white">{analysis.contentQuality.bulletPointQuality || 'N/A'}</p>
                        </div>
                      </div>
                    </motion.div>

                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.15 }}
                      className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700 shadow-md"
                    >
                      <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-lg">
                          <TrendingUp className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase">Use of Metrics</p>
                          <p className="text-lg font-bold text-slate-900 dark:text-white">{analysis.contentQuality.useOfMetrics || 'N/A'}</p>
                        </div>
                      </div>
                    </motion.div>

                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 }}
                      className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700 shadow-md"
                    >
                      <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                          <Zap className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase">Action Verb Usage</p>
                          <p className="text-lg font-bold text-slate-900 dark:text-white">{analysis.contentQuality.actionVerbUsage || 'N/A'}</p>
                        </div>
                      </div>
                    </motion.div>
                  </div>
                )}
              </motion.div>
            )}

            {/* SKILLS SECTION */}
            {activeSection === 'skills' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-8">
                <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">Skills Analysis</h2>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Technical Skills */}
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.25 }}
                    className="bg-gradient-to-br from-white to-green-50/20 dark:from-slate-800 dark:to-green-950/20 rounded-2xl p-7 border border-green-200/40 dark:border-green-900/40 shadow-lg"
                  >
                    <div className="flex items-center gap-3 mb-6">
                      <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                        <Code2 className="w-5 h-5 text-green-600 dark:text-green-400" />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white">Technical Skills</h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400">Extracted from your resume</p>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {analysis.technicalSkills && Array.isArray(analysis.technicalSkills) && analysis.technicalSkills.length > 0 ? (
                        analysis.technicalSkills.map((skill: string, i: number) => (
                          <motion.div
                            key={i}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.25 + i * 0.05 }}
                            className="px-3 py-1.5 bg-green-100 dark:bg-green-900/30 border border-green-300 dark:border-green-700 rounded-full text-sm font-semibold text-green-700 dark:text-green-300"
                          >
                            {skill}
                          </motion.div>
                        ))
                      ) : (
                        <p className="text-sm text-slate-500 dark:text-slate-400 italic">No technical skills extracted</p>
                      )}
                    </div>
                  </motion.div>

                  {/* Missing Skills */}
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 }}
                    className="bg-gradient-to-br from-white to-red-50/20 dark:from-slate-800 dark:to-red-950/20 rounded-2xl p-7 border border-red-200/40 dark:border-red-900/40 shadow-lg"
                  >
                    <div className="flex items-center gap-3 mb-6">
                      <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
                        <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white">Missing Skills</h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400">Important for your industry</p>
                      </div>
                    </div>

                    <div className="space-y-2">
                      {analysis.missingSkills && Array.isArray(analysis.missingSkills) && analysis.missingSkills.length > 0 ? (
                        analysis.missingSkills.map((skill: string, i: number) => (
                          <motion.div
                            key={i}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.3 + i * 0.05 }}
                            className="flex gap-2 p-2 bg-white dark:bg-slate-700/50 rounded-lg border border-red-100 dark:border-red-900/30"
                          >
                            <span className="text-red-600 dark:text-red-400 font-bold flex-shrink-0">•</span>
                            <p className="text-sm text-slate-700 dark:text-slate-300">{skill}</p>
                          </motion.div>
                        ))
                      ) : (
                        <p className="text-sm text-slate-500 dark:text-slate-400 italic">No missing skills identified</p>
                      )}
                    </div>
                  </motion.div>
                </div>
              </motion.div>
            )}

            {/* IMPROVEMENTS SECTION */}
            {activeSection === 'improvements' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-8">
                <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">Analysis & Improvements</h2>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Strengths */}
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.35 }}
                    className="bg-gradient-to-br from-white to-green-50/20 dark:from-slate-800 dark:to-green-950/20 rounded-2xl p-7 border border-green-200/40 dark:border-green-900/40 shadow-lg"
                  >
                    <div className="flex items-center gap-3 mb-6">
                      <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                        <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400" />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white">Strengths</h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400">What you're doing well</p>
                      </div>
                    </div>

                    <div className="space-y-3">
                      {analysis.strengths && Array.isArray(analysis.strengths) && analysis.strengths.length > 0 ? (
                        analysis.strengths.map((strength: string, i: number) => (
                          <motion.div
                            key={i}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.35 + i * 0.08 }}
                            className="flex gap-3 p-3 bg-white dark:bg-slate-700/50 rounded-lg border border-green-100 dark:border-green-900/30 hover:border-green-300 dark:hover:border-green-700 transition"
                          >
                            <span className="text-green-600 dark:text-green-400 font-bold flex-shrink-0 mt-0.5">✓</span>
                            <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">{strength}</p>
                          </motion.div>
                        ))
                      ) : (
                        <p className="text-sm text-slate-500 dark:text-slate-400 italic">No data available</p>
                      )}
                    </div>
                  </motion.div>

                  {/* Weaknesses */}
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4 }}
                    className="bg-gradient-to-br from-white to-red-50/20 dark:from-slate-800 dark:to-red-950/20 rounded-2xl p-7 border border-red-200/40 dark:border-red-900/40 shadow-lg"
                  >
                    <div className="flex items-center gap-3 mb-6">
                      <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
                        <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white">Weaknesses</h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400">Areas to improve</p>
                      </div>
                    </div>

                    <div className="space-y-3">
                      {analysis.weaknesses && Array.isArray(analysis.weaknesses) && analysis.weaknesses.length > 0 ? (
                        analysis.weaknesses.map((weakness: string, i: number) => (
                          <motion.div
                            key={i}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.4 + i * 0.08 }}
                            className="flex gap-3 p-3 bg-white dark:bg-slate-700/50 rounded-lg border border-red-100 dark:border-red-900/30 hover:border-red-300 dark:hover:border-red-700 transition"
                          >
                            <span className="text-red-600 dark:text-red-400 font-bold flex-shrink-0 mt-0.5">!</span>
                            <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">{weakness}</p>
                          </motion.div>
                        ))
                      ) : (
                        <p className="text-sm text-slate-500 dark:text-slate-400 italic">No data available</p>
                      )}
                    </div>
                  </motion.div>

                  {/* Recommendations */}
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.45 }}
                    className="bg-gradient-to-br from-white to-blue-50/20 dark:from-slate-800 dark:to-blue-950/20 rounded-2xl p-7 border border-blue-200/40 dark:border-blue-900/40 shadow-lg"
                  >
                    <div className="flex items-center gap-3 mb-6">
                      <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                        <Lightbulb className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white">Improvements</h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400">Actionable steps</p>
                      </div>
                    </div>

                    <div className="space-y-3">
                      {analysis.improvements && Array.isArray(analysis.improvements) && analysis.improvements.length > 0 ? (
                        analysis.improvements.map((improvement: string, i: number) => (
                          <motion.div
                            key={i}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.45 + i * 0.08 }}
                            className="flex gap-3 p-3 bg-white dark:bg-slate-700/50 rounded-lg border border-blue-100 dark:border-blue-900/30 hover:border-blue-300 dark:hover:border-blue-700 transition"
                          >
                            <span className="text-blue-600 dark:text-blue-400 font-bold flex-shrink-0 mt-0.5">→</span>
                            <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">{improvement}</p>
                          </motion.div>
                        ))
                      ) : (
                        <p className="text-sm text-slate-500 dark:text-slate-400 italic">No data available</p>
                      )}
                    </div>
                  </motion.div>
                </div>
              </motion.div>
            )}

            {/* INTERVIEW SECTION */}
            {activeSection === 'interview' && analysis.interviewFocusTopics && Array.isArray(analysis.interviewFocusTopics) && analysis.interviewFocusTopics.length > 0 && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">Interview Preparation</h2>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className="bg-gradient-to-r from-purple-50/50 to-blue-50/50 dark:from-purple-950/20 dark:to-blue-950/20 rounded-2xl p-7 border border-purple-200/40 dark:border-purple-900/40 shadow-lg"
                >
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                      <BookOpen className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-slate-900 dark:text-white">Key Topics to Prepare</h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400">Questions you might face</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {analysis.interviewFocusTopics.map((topic: string, i: number) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.5 + i * 0.05 }}
                        className="flex gap-3 p-4 bg-white dark:bg-slate-700/50 rounded-lg border border-purple-100 dark:border-purple-900/30 hover:border-purple-300 dark:hover:border-purple-700 transition"
                      >
                        <MessageSquare className="w-5 h-5 text-purple-600 dark:text-purple-400 flex-shrink-0 mt-0.5" />
                        <p className="text-sm text-slate-700 dark:text-slate-300">{topic}</p>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              </motion.div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 pb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.55 }}
            className="bg-gradient-to-r from-purple-600/10 to-blue-600/10 dark:from-purple-900/20 dark:to-blue-900/20 rounded-2xl p-8 border border-purple-200/30 dark:border-purple-900/30 text-center"
          >
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Ready to Improve?</h3>
            <p className="text-slate-600 dark:text-slate-300 mb-6 max-w-2xl mx-auto">
              Implement the recommendations above to boost your resume score and increase your chances of passing ATS filters and impressing recruiters.
            </p>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onReset}
              className="inline-flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg font-bold hover:shadow-lg transition"
            >
              <FileText className="w-5 h-5" />
              Analyze Another Resume
            </motion.button>
          </motion.div>
        </div>
      </div>
    </div>
  )
}
