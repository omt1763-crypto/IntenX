'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { Download, ArrowLeft, TrendingUp, CheckCircle2, AlertTriangle, Lightbulb, Zap, Target, FileText } from 'lucide-react'
import jsPDF from 'jspdf'

interface ResumeAnalysisProps {
  results: any
  phoneNumber?: string
  onReset: () => void
}

export default function ResumeAnalysis({ results, phoneNumber, onReset }: ResumeAnalysisProps) {
  const analysis = results?.analysis || {}

  const getScoreGrade = (score: number): { label: string; color: string; bgColor: string; textColor: string } => {
    if (score >= 90) return { label: 'Excellent', color: '#22c55e', bgColor: 'bg-green-50 dark:bg-green-950/30', textColor: 'text-green-700 dark:text-green-300' }
    if (score >= 80) return { label: 'Very Good', color: '#3b82f6', bgColor: 'bg-blue-50 dark:bg-blue-950/30', textColor: 'text-blue-700 dark:text-blue-300' }
    if (score >= 70) return { label: 'Good', color: '#06b6d4', bgColor: 'bg-cyan-50 dark:bg-cyan-950/30', textColor: 'text-cyan-700 dark:text-cyan-300' }
    if (score >= 60) return { label: 'Fair', color: '#f59e0b', bgColor: 'bg-amber-50 dark:bg-amber-950/30', textColor: 'text-amber-700 dark:text-amber-300' }
    return { label: 'Needs Work', color: '#ef4444', bgColor: 'bg-red-50 dark:bg-red-950/30', textColor: 'text-red-700 dark:text-red-300' }
  }

  const scores = [
    { label: 'ATS Score', value: analysis.atsScore || 0, icon: Target, description: 'ATS System Compatibility' },
    { label: 'Readability', value: analysis.readabilityScore || 0, icon: FileText, description: 'Clarity & Format' },
    { label: 'Keywords', value: analysis.keywordMatchScore || 0, icon: Zap, description: 'Keyword Relevance' },
    { label: 'Role Fit', value: analysis.roleFitScore || 0, icon: TrendingUp, description: 'Job Match' },
  ]

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

    // Overall Score
    pdf.setFontSize(16)
    pdf.setTextColor(0, 0, 0)
    pdf.setFont(undefined, 'bold')
    pdf.text('OVERALL SCORE', 15, y)
    y += 8
    pdf.setFontSize(32)
    pdf.setTextColor(99, 102, 241)
    pdf.text(`${analysis.overallScore || 0}/100`, 15, y)
    y += 15

    // Summary
    if (analysis.summary) {
      pdf.setFontSize(11)
      pdf.setTextColor(50, 50, 50)
      pdf.setFont(undefined, 'normal')
      const summaryLines = pdf.splitTextToSize(analysis.summary, pageWidth - 30)
      summaryLines.forEach((line: string) => {
        pdf.text(line, 15, y)
        y += 5
      })
      y += 5
    }

    // Score Breakdown
    pdf.setFont(undefined, 'bold')
    pdf.setFontSize(12)
    pdf.setTextColor(50, 50, 50)
    pdf.text('SCORE BREAKDOWN', 15, y)
    y += 8

    const scoreData = [
      [`ATS Score: ${analysis.atsScore || 0}/100`, `Readability: ${analysis.readabilityScore || 0}/100`],
      [`Keywords: ${analysis.keywordMatchScore || 0}/100`, `Role Fit: ${analysis.roleFitScore || 0}/100`],
    ]

    scoreData.forEach(row => {
      row.forEach((score, idx) => {
        pdf.setFontSize(10)
        pdf.setFont(undefined, 'normal')
        pdf.text(score, 15 + idx * 90, y)
      })
      y += 6
    })
    y += 5

    // Strengths
    pdf.addPage()
    y = 20
    pdf.setFont(undefined, 'bold')
    pdf.setFontSize(14)
    pdf.setTextColor(34, 197, 94)
    pdf.text('✓ STRENGTHS', 15, y)
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
          y += 6
        })
      })
    }
    y += 5

    // Areas to Improve
    if (y > pageHeight - 40) {
      pdf.addPage()
      y = 20
    }
    pdf.setFont(undefined, 'bold')
    pdf.setFontSize(14)
    pdf.setTextColor(239, 68, 68)
    pdf.text('! AREAS FOR IMPROVEMENT', 15, y)
    y += 8
    pdf.setFont(undefined, 'normal')
    pdf.setTextColor(0, 0, 0)
    pdf.setFontSize(10)

    if (analysis.areasForImprovement && Array.isArray(analysis.areasForImprovement)) {
      analysis.areasForImprovement.forEach((area: string) => {
        const lines = pdf.splitTextToSize(`• ${area}`, pageWidth - 30)
        lines.forEach((line: string) => {
          if (y > pageHeight - 20) {
            pdf.addPage()
            y = 20
          }
          pdf.text(line, 20, y)
          y += 6
        })
      })
    }
    y += 5

    // Recommendations
    if (y > pageHeight - 40) {
      pdf.addPage()
      y = 20
    }
    pdf.setFont(undefined, 'bold')
    pdf.setFontSize(14)
    pdf.setTextColor(59, 130, 246)
    pdf.text('💡 RECOMMENDATIONS', 15, y)
    y += 8
    pdf.setFont(undefined, 'normal')
    pdf.setTextColor(0, 0, 0)
    pdf.setFontSize(10)

    if (analysis.recommendations && Array.isArray(analysis.recommendations)) {
      analysis.recommendations.forEach((rec: string) => {
        const lines = pdf.splitTextToSize(`• ${rec}`, pageWidth - 30)
        lines.forEach((line: string) => {
          if (y > pageHeight - 20) {
            pdf.addPage()
            y = 20
          }
          pdf.text(line, 20, y)
          y += 6
        })
      })
    }

    pdf.save(`resume-analysis-${new Date().getTime()}.pdf`)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-900 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-8"
        >
          <div className="flex items-center gap-4">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onReset}
              className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 hover:shadow-md transition text-slate-900 dark:text-white font-semibold text-sm"
            >
              <ArrowLeft className="w-4 h-4" />
              New Analysis
            </motion.button>
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white">Your Resume Report</h1>
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">Comprehensive AI-powered analysis</p>
            </div>
          </div>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={downloadPDF}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:shadow-lg transition font-semibold"
          >
            <Download className="w-5 h-5" />
            Download Report
          </motion.button>
        </motion.div>

        {/* Overall Score Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 bg-gradient-to-br from-white to-blue-50/30 dark:from-slate-800 dark:to-slate-800/50 rounded-2xl p-8 border border-slate-200 dark:border-slate-700 shadow-lg"
        >
          <div className="flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="flex-1">
              <p className="text-slate-600 dark:text-slate-400 text-sm font-semibold uppercase tracking-wide mb-2">Overall Score</p>
              <div className="flex items-baseline gap-3 mb-6">
                <span className="text-6xl font-black bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                  {analysis.overallScore || 0}
                </span>
                <span className="text-2xl font-bold text-slate-400">/100</span>
              </div>
              {analysis.summary && (
                <p className="text-slate-700 dark:text-slate-300 leading-relaxed max-w-xl text-base font-medium">
                  {analysis.summary}
                </p>
              )}
            </div>

            <div className="flex-shrink-0">
              <CircularProgress value={analysis.overallScore || 0} size={160} />
            </div>
          </div>
        </motion.div>

        {/* Four Metric Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {scores.map((score, i) => {
            const Icon = score.icon
            const grade = getScoreGrade(score.value)
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className={`${grade.bgColor} rounded-xl p-6 border border-slate-200 dark:border-slate-700 backdrop-blur-sm hover:shadow-lg transition`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide mb-1">
                      {score.label}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{score.description}</p>
                  </div>
                  <Icon className="w-5 h-5 text-slate-400 dark:text-slate-500" />
                </div>

                <div className="mb-4">
                  <div className="text-3xl font-black text-slate-900 dark:text-white mb-2">
                    {score.value}
                  </div>
                  <div className={`text-xs font-bold ${grade.textColor}`}>
                    {grade.label}
                  </div>
                </div>

                <div className="w-full bg-slate-300 dark:bg-slate-700 rounded-full h-1.5">
                  <motion.div
                    className="h-1.5 rounded-full transition-all"
                    style={{ backgroundColor: grade.color }}
                    initial={{ width: 0 }}
                    animate={{ width: `${score.value}%` }}
                    transition={{ duration: 1.2, delay: 0.3 + i * 0.1 }}
                  />
                </div>
              </motion.div>
            )
          })}
        </div>

        {/* Three Column Main Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Strengths */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
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
                    transition={{ delay: 0.5 + i * 0.08 }}
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

          {/* Areas for Improvement */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-gradient-to-br from-white to-red-50/20 dark:from-slate-800 dark:to-red-950/20 rounded-2xl p-7 border border-red-200/40 dark:border-red-900/40 shadow-lg"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
                <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Areas to Improve</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">Opportunities for growth</p>
              </div>
            </div>

            <div className="space-y-3">
              {analysis.areasForImprovement && Array.isArray(analysis.areasForImprovement) && analysis.areasForImprovement.length > 0 ? (
                analysis.areasForImprovement.map((area: string, i: number) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.55 + i * 0.08 }}
                    className="flex gap-3 p-3 bg-white dark:bg-slate-700/50 rounded-lg border border-red-100 dark:border-red-900/30 hover:border-red-300 dark:hover:border-red-700 transition"
                  >
                    <span className="text-red-600 dark:text-red-400 font-bold flex-shrink-0 mt-0.5">!</span>
                    <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">{area}</p>
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
            transition={{ delay: 0.6 }}
            className="bg-gradient-to-br from-white to-blue-50/20 dark:from-slate-800 dark:to-blue-950/20 rounded-2xl p-7 border border-blue-200/40 dark:border-blue-900/40 shadow-lg"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <Lightbulb className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Recommendations</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">Actionable steps to improve</p>
              </div>
            </div>

            <div className="space-y-3">
              {analysis.recommendations && Array.isArray(analysis.recommendations) && analysis.recommendations.length > 0 ? (
                analysis.recommendations.map((rec: string, i: number) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.6 + i * 0.08 }}
                    className="flex gap-3 p-3 bg-white dark:bg-slate-700/50 rounded-lg border border-blue-100 dark:border-blue-900/30 hover:border-blue-300 dark:hover:border-blue-700 transition"
                  >
                    <span className="text-blue-600 dark:text-blue-400 font-bold flex-shrink-0 mt-0.5">→</span>
                    <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">{rec}</p>
                  </motion.div>
                ))
              ) : (
                <p className="text-sm text-slate-500 dark:text-slate-400 italic">No data available</p>
              )}
            </div>
          </motion.div>
        </div>

        {/* Footer CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
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
  )
}
