'use client'

import { motion } from 'framer-motion'
import { Download, ArrowLeft, BarChart3, CheckCircle2, AlertCircle, Lightbulb } from 'lucide-react'
import jsPDF from 'jspdf'

interface AnalysisScore {
  color: string[]
  bg: string
}

interface ResumeAnalysisProps {
  results: any
  phoneNumber: string
  onReset: () => void
}

export default function ResumeAnalysis({ results, phoneNumber, onReset }: ResumeAnalysisProps) {
  const analysis = results?.analysis || {}

  const scoreColors: { [key: string]: AnalysisScore } = {
    excellent: { color: ['34', '197', '94'], bg: 'from-green-50 to-green-100/50' },
    good: { color: ['59', '130', '246'], bg: 'from-blue-50 to-blue-100/50' },
    fair: { color: ['245', '158', '11'], bg: 'from-amber-50 to-amber-100/50' },
    poor: { color: ['239', '68', '68'], bg: 'from-red-50 to-red-100/50' },
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return scoreColors.excellent
    if (score >= 60) return scoreColors.good
    if (score >= 40) return scoreColors.fair
    return scoreColors.poor
  }

  const scores = [
    { label: 'ATS Score', value: analysis.atsScore || 0 },
    { label: 'Readability', value: analysis.readabilityScore || 0 },
    { label: 'Keywords', value: analysis.keywordMatchScore || 0 },
    { label: 'Role Fit', value: analysis.roleFitScore || 0 },
  ]

  const downloadPDF = () => {
    const pdf = new jsPDF()
    const pageWidth = pdf.internal.pageSize.getWidth()
    let y = 15

    // Title
    pdf.setFontSize(20)
    pdf.setTextColor(99, 102, 241)
    pdf.text('RESUME ANALYSIS REPORT', pageWidth / 2, y, { align: 'center' })
    y += 10

    // Overall Score
    pdf.setFontSize(12)
    pdf.setTextColor(0, 0, 0)
    pdf.text(`Overall Score: ${analysis.overallScore || 0}/100`, 15, y)
    y += 8

    // Strengths
    pdf.setFontSize(14)
    pdf.setTextColor(34, 197, 94)
    pdf.text('Strengths:', 15, y)
    y += 6

    if (analysis.strengths && Array.isArray(analysis.strengths)) {
      analysis.strengths.forEach((strength: string) => {
        const lines = pdf.splitTextToSize(`• ${strength}`, pageWidth - 30)
        lines.forEach((line: string) => {
          pdf.text(line, 20, y)
          y += 5
        })
      })
    }
    y += 3

    // Weaknesses
    pdf.setFontSize(14)
    pdf.setTextColor(239, 68, 68)
    pdf.text('Areas for Improvement:', 15, y)
    y += 6

    if (analysis.weaknesses && Array.isArray(analysis.weaknesses)) {
      analysis.weaknesses.forEach((weakness: string) => {
        const lines = pdf.splitTextToSize(`• ${weakness}`, pageWidth - 30)
        lines.forEach((line: string) => {
          pdf.text(line, 20, y)
          y += 5
        })
      })
    }
    y += 3

    // Keywords
    if (analysis.keywords && Array.isArray(analysis.keywords)) {
      pdf.setFontSize(14)
      pdf.setTextColor(59, 130, 246)
      pdf.text('Key Skills Found:', 15, y)
      y += 6

      const keywordText = analysis.keywords.slice(0, 15).join(', ')
      const lines = pdf.splitTextToSize(keywordText, pageWidth - 30)
      lines.forEach((line: string) => {
        pdf.text(line, 20, y)
        y += 5
      })
    }

    pdf.save('resume-analysis.pdf')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-12"
        >
          <div className="flex items-center gap-4">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onReset}
              className="flex items-center gap-2 px-6 py-3 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 hover:shadow-md transition text-slate-900 dark:text-white font-semibold"
            >
              <ArrowLeft className="w-5 h-5" />
              Back
            </motion.button>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
              Resume Analysis
            </h1>
          </div>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={downloadPDF}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:shadow-lg transition font-semibold"
          >
            <Download className="w-5 h-5" />
            Download PDF
          </motion.button>
        </motion.div>

        {/* Score Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-12">
          {scores.map((score, i) => {
            const colorInfo = getScoreColor(score.value)
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className={`bg-gradient-to-br ${colorInfo.bg} rounded-xl p-6 border border-slate-200 dark:border-slate-700`}
              >
                <p className="text-slate-600 dark:text-slate-400 text-sm font-semibold mb-2">
                  {score.label}
                </p>
                <p className="text-4xl font-black text-slate-900 dark:text-white mb-3">
                  {score.value}
                </p>
                <div className="w-full bg-slate-300 dark:bg-slate-700 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full bg-gradient-to-r`}
                    style={{
                      width: `${score.value}%`,
                      backgroundColor: `rgb(${colorInfo.color.join(',')})`,
                    }}
                  ></div>
                </div>
              </motion.div>
            )
          })}
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Strengths */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="lg:col-span-1 bg-white dark:bg-slate-800 rounded-2xl p-8 border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition"
          >
            <div className="flex items-center gap-2 mb-6">
              <CheckCircle2 className="w-6 h-6 text-green-600" />
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">Strengths</h3>
            </div>
            <div className="space-y-3">
              {analysis.strengths?.slice(0, 4).map((strength: string, i: number) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 + i * 0.1 }}
                  className="p-3 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-800"
                >
                  <p className="text-sm text-green-900 dark:text-green-100">{strength}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Weaknesses */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.25 }}
            className="lg:col-span-1 bg-white dark:bg-slate-800 rounded-2xl p-8 border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition"
          >
            <div className="flex items-center gap-2 mb-6">
              <AlertCircle className="w-6 h-6 text-red-600" />
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">To Improve</h3>
            </div>
            <div className="space-y-3">
              {analysis.weaknesses?.slice(0, 4).map((weakness: string, i: number) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.35 + i * 0.1 }}
                  className="p-3 bg-red-50 dark:bg-red-950/20 rounded-lg border border-red-200 dark:border-red-800"
                >
                  <p className="text-sm text-red-900 dark:text-red-100">{weakness}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Recommendations */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="lg:col-span-1 bg-white dark:bg-slate-800 rounded-2xl p-8 border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition"
          >
            <div className="flex items-center gap-2 mb-6">
              <Lightbulb className="w-6 h-6 text-yellow-600" />
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">Tips</h3>
            </div>
            <div className="space-y-3">
              {analysis.actionableTips?.slice(0, 4).map((tip: string, i: number) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.4 + i * 0.1 }}
                  className="p-3 bg-yellow-50 dark:bg-yellow-950/20 rounded-lg border border-yellow-200 dark:border-yellow-800"
                >
                  <p className="text-sm text-yellow-900 dark:text-yellow-100">{tip}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Keywords Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="mt-6 bg-white dark:bg-slate-800 rounded-2xl p-8 border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition"
        >
          <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-4">Keywords Found</h3>
          <div className="flex flex-wrap gap-2 mb-6">
            {analysis.keywords?.slice(0, 20).map((keyword: string, i: number) => (
              <motion.span
                key={i}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.4 + i * 0.02 }}
                className="px-4 py-2 bg-gradient-to-r from-blue-100 to-blue-50 dark:from-blue-950 dark:to-blue-900 text-blue-900 dark:text-blue-100 rounded-full text-sm font-semibold border border-blue-200 dark:border-blue-800"
              >
                {keyword}
              </motion.span>
            ))}
          </div>

          {analysis.missingKeywords && analysis.missingKeywords.length > 0 && (
            <>
              <h4 className="text-lg font-bold text-slate-900 dark:text-white mb-3 mt-6">Keywords to Add</h4>
              <div className="flex flex-wrap gap-2">
                {analysis.missingKeywords.slice(0, 15).map((keyword: string, i: number) => (
                  <motion.span
                    key={i}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.5 + i * 0.02 }}
                    className="px-4 py-2 bg-gradient-to-r from-red-100 to-red-50 dark:from-red-950 dark:to-red-900 text-red-900 dark:text-red-100 rounded-full text-sm font-semibold border border-red-200 dark:border-red-800"
                  >
                    + {keyword}
                  </motion.span>
                ))}
              </div>
            </>
          )}
        </motion.div>
      </div>
    </div>
  )
}
