'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { FileText, Zap, TrendingUp, CheckCircle2 } from 'lucide-react'

const ResumeScanner = () => {
  return (
    <section className="py-20 px-4 bg-gradient-to-b from-transparent via-purple-500/5 to-transparent">
      <div className="max-w-6xl mx-auto">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          {/* Left Side - Content */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="space-y-6"
          >
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-500/10 border border-purple-500/20">
              <Zap className="w-4 h-4 text-purple-500" />
              <span className="text-sm font-medium text-purple-600 dark:text-purple-400">Free Tool</span>
            </div>

            {/* Heading */}
            <div>
              <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
                Improve your resume in minutes!
              </h2>
              <p className="text-lg text-muted-foreground">
                Scan your resume for an instant ATS-friendly score and get actionable insights to land more interviews.
              </p>
            </div>

            {/* Features List */}
            <div className="space-y-3 py-4">
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0">
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                </div>
                <span className="text-foreground">16 crucial ATS checks</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0">
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                </div>
                <span className="text-foreground">AI-powered analysis</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0">
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                </div>
                <span className="text-foreground">100% privacy guaranteed</span>
              </div>
            </div>

            {/* CTA Button */}
            <div>
              <Link href="/resources/resume-checker">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="px-8 py-4 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold rounded-xl transition-all shadow-lg hover:shadow-xl inline-flex items-center gap-2 group"
                >
                  <FileText className="w-5 h-5 group-hover:scale-110 transition-transform" />
                  Try Resume Scanner
                  <Zap className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                </motion.button>
              </Link>
            </div>
          </motion.div>

          {/* Right Side - Visual Demo */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            viewport={{ once: true }}
            className="relative"
          >
            {/* Main Card */}
            <div className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl border border-white/20 rounded-3xl p-6 shadow-2xl">
              {/* Header */}
              <div className="flex items-center justify-between mb-6 pb-4 border-b border-white/10">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-purple-600/30 flex items-center justify-center">
                    <FileText className="w-5 h-5 text-purple-400" />
                  </div>
                  <div>
                    <p className="font-semibold text-foreground text-sm">Resume Analysis</p>
                    <p className="text-xs text-muted-foreground">John Doe</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-blue-500">78</p>
                  <p className="text-xs text-muted-foreground">/100 Score</p>
                </div>
              </div>

              {/* Score Visualization */}
              <div className="space-y-4 mb-6">
                {/* Overall Score */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-foreground">Overall Score</span>
                    <span className="text-sm font-semibold text-green-500">78%</span>
                  </div>
                  <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      whileInView={{ width: '78%' }}
                      transition={{ duration: 1, ease: 'easeOut' }}
                      viewport={{ once: true }}
                      className="h-full bg-gradient-to-r from-green-500 to-emerald-500"
                    />
                  </div>
                </div>

                {/* ATS Score */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-foreground">ATS Compatibility</span>
                    <span className="text-sm font-semibold text-blue-500">75%</span>
                  </div>
                  <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      whileInView={{ width: '75%' }}
                      transition={{ duration: 1, delay: 0.2, ease: 'easeOut' }}
                      viewport={{ once: true }}
                      className="h-full bg-gradient-to-r from-blue-500 to-cyan-500"
                    />
                  </div>
                </div>

                {/* Content Score */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-foreground">Content Quality</span>
                    <span className="text-sm font-semibold text-yellow-500">82%</span>
                  </div>
                  <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      whileInView={{ width: '82%' }}
                      transition={{ duration: 1, delay: 0.4, ease: 'easeOut' }}
                      viewport={{ once: true }}
                      className="h-full bg-gradient-to-r from-yellow-500 to-orange-500"
                    />
                  </div>
                </div>
              </div>

              {/* Checks Grid */}
              <div className="grid grid-cols-2 gap-2">
                {[
                  { label: 'Grammar', status: 'pass' },
                  { label: 'Keywords', status: 'pass' },
                  { label: 'Format', status: 'warning' },
                  { label: 'Length', status: 'pass' },
                ].map((check, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, scale: 0.8 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.3, delay: 0.5 + idx * 0.1 }}
                    viewport={{ once: true }}
                    className={`flex items-center gap-2 p-3 rounded-lg text-xs font-medium ${
                      check.status === 'pass'
                        ? 'bg-green-500/10 text-green-600 dark:text-green-400'
                        : 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400'
                    }`}
                  >
                    <CheckCircle2 className="w-3 h-3" />
                    {check.label}
                  </motion.div>
                ))}
              </div>

              {/* Footer Note */}
              <div className="mt-6 pt-4 border-t border-white/10">
                <p className="text-xs text-muted-foreground text-center">
                  📄 PDF & DOCX • 🔒 Private • ⚡ Instant Results
                </p>
              </div>
            </div>

            {/* Floating Badge */}
            <motion.div
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 3, repeat: Infinity }}
              className="absolute -bottom-4 -right-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white px-4 py-2 rounded-full text-sm font-semibold shadow-lg"
            >
              Analysis in seconds
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}

export default ResumeScanner
