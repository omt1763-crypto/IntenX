'use client'

import { motion } from 'framer-motion'
import { BarChart3, CheckCircle, AlertCircle, TrendingUp, FileDown, RefreshCw } from 'lucide-react'

interface AnalysisResult {
  overallScore: number
  atsScore: number
  contentScore: number
  formattingScore: number
  skillsScore: number
  checks: {
    category: string
    items: {
      name: string
      passed: boolean
      suggestion?: string
    }[]
  }[]
  strengths: string[]
  improvements: string[]
  keywordMatches: string[]
}

interface ResumeAnalysisProps {
  results: AnalysisResult
  phoneNumber: string
  onReset: () => void
}

export default function ResumeAnalysis({
  results,
  phoneNumber,
  onReset,
}: ResumeAnalysisProps) {
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'from-green-500 to-emerald-500'
    if (score >= 60) return 'from-yellow-500 to-orange-500'
    return 'from-red-500 to-pink-500'
  }

  const getScoreBg = (score: number) => {
    if (score >= 80) return 'bg-green-500/20 border-green-500/30'
    if (score >= 60) return 'bg-yellow-500/20 border-yellow-500/30'
    return 'bg-red-500/20 border-red-500/30'
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
      },
    },
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { type: 'spring', stiffness: 100 },
    },
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-8"
    >
      {/* Overall Score Card */}
      <motion.div
        variants={itemVariants}
        className={`bg-gradient-to-br ${getScoreColor(results.overallScore)} p-0.5 rounded-3xl`}
      >
        <div className="bg-card rounded-3xl p-8 md:p-12 text-center">
          <h2 className="text-2xl font-bold text-foreground mb-6">Your Resume Score</h2>
          <div className="flex items-center justify-center gap-8 flex-wrap">
            <motion.div
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="relative w-32 h-32"
            >
              <svg className="w-full h-full transform -rotate-90">
                <circle
                  cx="64"
                  cy="64"
                  r="56"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="8"
                  className="text-border"
                />
                <motion.circle
                  cx="64"
                  cy="64"
                  r="56"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="8"
                  className="text-gradient"
                  strokeDasharray={`${(results.overallScore / 100) * 2 * Math.PI * 56} ${2 * Math.PI * 56}`}
                  initial={{ strokeDasharray: `0 ${2 * Math.PI * 56}` }}
                  animate={{ strokeDasharray: `${(results.overallScore / 100) * 2 * Math.PI * 56} ${2 * Math.PI * 56}` }}
                  transition={{ duration: 2, ease: 'easeInOut' }}
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                    className="text-4xl font-bold text-foreground"
                  >
                    {results.overallScore}
                  </motion.div>
                  <p className="text-sm text-muted-foreground">/100</p>
                </div>
              </div>
            </motion.div>

            <div className="space-y-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="w-5 h-5 text-blue-400" />
                  <span className="text-muted-foreground">ATS Score</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-24 h-2 bg-border rounded-full overflow-hidden">
                    <motion.div
                      className="h-full bg-blue-500"
                      initial={{ width: 0 }}
                      animate={{ width: `${results.atsScore}%` }}
                      transition={{ duration: 1.5, ease: 'easeOut' }}
                    />
                  </div>
                  <span className="text-sm font-semibold text-foreground w-10">{results.atsScore}%</span>
                </div>
              </div>
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <BarChart3 className="w-5 h-5 text-flow-purple" />
                  <span className="text-muted-foreground">Content</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-24 h-2 bg-border rounded-full overflow-hidden">
                    <motion.div
                      className="h-full bg-flow-purple"
                      initial={{ width: 0 }}
                      animate={{ width: `${results.contentScore}%` }}
                      transition={{ duration: 1.5, ease: 'easeOut', delay: 0.2 }}
                    />
                  </div>
                  <span className="text-sm font-semibold text-foreground w-10">{results.contentScore}%</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Strengths and Improvements */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Strengths */}
        <motion.div
          variants={itemVariants}
          className="bg-green-500/10 border border-green-500/30 rounded-2xl p-6"
        >
          <div className="flex items-center gap-2 mb-4">
            <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
            <h3 className="text-lg font-bold text-foreground">Strengths</h3>
          </div>
          <ul className="space-y-2">
            {results.strengths.map((strength, idx) => (
              <motion.li
                key={idx}
                variants={itemVariants}
                className="flex items-start gap-2"
              >
                <span className="text-green-400 font-bold mt-0.5">✓</span>
                <span className="text-muted-foreground text-sm">{strength}</span>
              </motion.li>
            ))}
          </ul>
        </motion.div>

        {/* Areas for Improvement */}
        <motion.div
          variants={itemVariants}
          className="bg-orange-500/10 border border-orange-500/30 rounded-2xl p-6"
        >
          <div className="flex items-center gap-2 mb-4">
            <AlertCircle className="w-6 h-6 text-orange-600 dark:text-orange-400" />
            <h3 className="text-lg font-bold text-foreground">Areas to Improve</h3>
          </div>
          <ul className="space-y-2">
            {results.improvements.map((improvement, idx) => (
              <motion.li
                key={idx}
                variants={itemVariants}
                className="flex items-start gap-2"
              >
                <span className="text-orange-400 font-bold mt-0.5">→</span>
                <span className="text-muted-foreground text-sm">{improvement}</span>
              </motion.li>
            ))}
          </ul>
        </motion.div>
      </div>

      {/* Detailed Checks */}
      <motion.div variants={itemVariants} className="space-y-4">
        <h3 className="text-xl font-bold text-foreground flex items-center gap-2">
          <BarChart3 className="w-6 h-6 text-flow-purple" />
          16 Crucial Checks
        </h3>

        {results.checks.map((checkCategory, idx) => (
          <motion.div
            key={idx}
            variants={itemVariants}
            className="bg-card border border-border rounded-xl overflow-hidden"
          >
            <div className="bg-card/80 border-b border-border p-4">
              <h4 className="font-semibold text-foreground">{checkCategory.category}</h4>
            </div>
            <div className="p-4 space-y-3">
              {checkCategory.items.map((item, itemIdx) => (
                <motion.div
                  key={itemIdx}
                  variants={itemVariants}
                  className="flex items-start gap-3"
                >
                  {item.passed ? (
                    <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-orange-600 dark:text-orange-400 flex-shrink-0 mt-0.5" />
                  )}
                  <div className="flex-1">
                    <p className={`font-medium ${item.passed ? 'text-green-300' : 'text-orange-300'}`}>
                      {item.name}
                    </p>
                    {item.suggestion && (
                      <p className="text-sm text-muted-foreground mt-1">{item.suggestion}</p>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        ))}
      </motion.div>

      {/* Keywords Found */}
      {results.keywordMatches.length > 0 && (
        <motion.div
          variants={itemVariants}
          className="bg-blue-500/10 border border-blue-500/30 rounded-2xl p-6"
        >
          <h3 className="text-lg font-bold text-foreground mb-4">Keywords Found</h3>
          <div className="flex flex-wrap gap-2">
            {results.keywordMatches.map((keyword, idx) => (
              <motion.span
                key={idx}
                variants={itemVariants}
                className="px-3 py-1 bg-blue-500/20 border border-blue-500/40 rounded-full text-sm text-blue-300"
              >
                {keyword}
              </motion.span>
            ))}
          </div>
        </motion.div>
      )}

      {/* Action Buttons */}
      <motion.div
        variants={itemVariants}
        className="flex flex-col sm:flex-row gap-4"
      >
        <button
          onClick={() => {
            // Download report functionality
            const report = JSON.stringify(results, null, 2)
            const blob = new Blob([report], { type: 'application/json' })
            const url = URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url
            a.download = 'resume-analysis.json'
            a.click()
          }}
          className="flex-1 flex items-center justify-center gap-2 bg-card border border-border hover:border-flow-purple/20 text-foreground font-semibold py-3 rounded-lg transition"
        >
          <FileDown className="w-5 h-5" />
          Download Report
        </button>
        <button
          onClick={onReset}
          className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-flow-purple to-flow-blue hover:shadow-lg text-white font-semibold py-3 rounded-lg transition"
        >
          <RefreshCw className="w-5 h-5" />
          Analyze Another Resume
        </button>
      </motion.div>

      {/* Footer Note */}
      <motion.div
        variants={itemVariants}
        className="text-center p-4 bg-white/5 border border-white/10 rounded-lg"
      >
        <p className="text-sm text-slate-400">
          Analysis completed for: <span className="font-semibold text-slate-200">{phoneNumber}</span>
        </p>
      </motion.div>
    </motion.div>
  )
}
