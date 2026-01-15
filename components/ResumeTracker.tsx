'use client'

import React, { useState, useRef } from 'react'
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import jsPDF from 'jspdf'

interface ResumeAnalysis {
  atsScore: number
  readabilityScore: number
  keywordMatchScore: number
  roleFitScore: number
  experienceRelevance: number
  skillsCoverage: number
  formattingQuality: number
  overallScore: number
  strengths: string[]
  weaknesses: string[]
  keywords: string[]
  missingKeywords: string[]
  atsCompatibility: {
    issues: string[]
    passed: string[]
  }
  improvementSuggestions: {
    criticalFixes: string[]
    bulletPointImprovements: string[]
    actionVerbSuggestions: string[]
    summaryRewrite: string
    skillSectionTips: string[]
    quantificationNeeded: string[]
  }
  jdComparison?: {
    matchedKeywords: string[]
    missingKeywords: string[]
    roleAlignment: number
    matchPercentage: number
  }
  atsSimulation: {
    parsedSuccessfully: boolean
    contactInfoFound: boolean
    experienceSection: boolean
    educationSection: boolean
    skillsSection: boolean
    formattingWarnings: string[]
  }
  actionableTips: string[]
}

interface ResumeData {
  id?: string
  status: 'applied' | 'under_review' | 'shortlisted' | 'interview' | 'offer' | 'rejected'
  analysis: ResumeAnalysis
  createdAt: string
  jobTitle?: string
}

const ResumeTracker: React.FC = () => {
  const [resumeText, setResumeText] = useState('')
  const [jobDescription, setJobDescription] = useState('')
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState<'overview' | 'ats' | 'improvements' | 'comparison'>('overview')
  const [resumeData, setResumeData] = useState<ResumeData | null>(null)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const analyzeResume = async () => {
    if (!resumeText.trim()) {
      setError('Please paste or upload your resume')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/resume-tracker/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resumeText,
          jobDescription: jobDescription.trim() || null,
          phoneNumber: 'user',
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to analyze')
      }

      setResumeData({
        analysis: data.analysis,
        status: 'applied',
        createdAt: data.createdAt,
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Analysis failed')
    } finally {
      setLoading(false)
    }
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Simple text extraction from file name (in real app, use pdf-parse)
    const reader = new FileReader()
    reader.onload = (event) => {
      const text = event.target?.result as string
      setResumeText(text.substring(0, 5000)) // Truncate for demo
      setError(null)
    }
    reader.readAsText(file)
  }

  const downloadPDF = () => {
    if (!resumeData) return

    const pdf = new jsPDF()
    const pageWidth = pdf.internal.pageSize.getWidth()
    let y = 15

    // Title
    pdf.setFontSize(20)
    pdf.setTextColor(30, 100, 200)
    pdf.text('AI RESUME ANALYSIS REPORT', pageWidth / 2, y, { align: 'center' })
    y += 12

    // Score Section
    pdf.setFontSize(12)
    pdf.setTextColor(0, 0, 0)
    pdf.text('OVERALL SCORES', 10, y)
    y += 8

    const scores = [
      { label: 'ATS Score', value: resumeData.analysis.atsScore },
      { label: 'Readability', value: resumeData.analysis.readabilityScore },
      { label: 'Keyword Match', value: resumeData.analysis.keywordMatchScore },
      { label: 'Role Fit', value: resumeData.analysis.roleFitScore },
    ]

    pdf.setFontSize(10)
    scores.forEach((score, idx) => {
      pdf.text(`${score.label}: ${score.value}/100`, 10, y)
      y += 6
    })

    y += 6

    // Strengths
    pdf.text('STRENGTHS', 10, y)
    y += 6
    pdf.setFontSize(9)
    resumeData.analysis.strengths.forEach((s) => {
      pdf.text('✓ ' + s, 12, y)
      y += 5
    })

    y += 4

    // Weaknesses
    pdf.setFontSize(10)
    pdf.text('AREAS TO IMPROVE', 10, y)
    y += 6
    pdf.setFontSize(9)
    resumeData.analysis.weaknesses.forEach((w) => {
      pdf.text('→ ' + w, 12, y)
      y += 5
    })

    y += 4

    // Critical Fixes
    pdf.setFontSize(10)
    pdf.text('CRITICAL FIXES NEEDED', 10, y)
    y += 6
    pdf.setFontSize(9)
    resumeData.analysis.improvementSuggestions.criticalFixes.forEach((fix) => {
      const wrapped = pdf.splitTextToSize(fix, pageWidth - 24)
      pdf.text(wrapped, 12, y)
      y += wrapped.length * 4 + 2
    })

    // Footer
    pdf.setFontSize(8)
    pdf.setTextColor(150, 150, 150)
    pdf.text(`Generated on ${new Date().toLocaleDateString()}`, 10, pdf.internal.pageSize.getHeight() - 10)

    pdf.save('resume-analysis-report.pdf')
  }

  if (!resumeData) {
    return (
      <div className='min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-8'>
        <div className='max-w-4xl mx-auto'>
          {/* Header */}
          <div className='text-center mb-12'>
            <h1 className='text-5xl font-bold text-white mb-3'>Resume Analyzer Pro</h1>
            <p className='text-gray-400 text-lg'>AI-Powered Resume Tracking & Analysis</p>
          </div>

          {/* Upload Section */}
          <div className='bg-white rounded-xl shadow-2xl p-8 mb-8'>
            <div className='grid grid-cols-2 gap-8'>
              {/* Left - Upload */}
              <div>
                <h2 className='text-2xl font-bold text-gray-900 mb-4'>📄 Upload Resume</h2>
                <input
                  type='file'
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  accept='.pdf,.doc,.docx,.txt'
                  className='w-full p-4 border-2 border-dashed border-blue-300 rounded-lg cursor-pointer'
                />
                <p className='text-sm text-gray-600 mt-2'>PDF, DOC, or TXT format</p>
              </div>

              {/* Right - Paste */}
              <div>
                <h2 className='text-2xl font-bold text-gray-900 mb-4'>✏️ Or Paste Resume</h2>
                <textarea
                  value={resumeText}
                  onChange={(e) => setResumeText(e.target.value)}
                  placeholder='Paste your resume text here...'
                  className='w-full h-40 p-4 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none'
                />
              </div>
            </div>

            {/* Job Description */}
            <div className='mt-8'>
              <h3 className='text-lg font-bold text-gray-900 mb-3'>🎯 (Optional) Job Description</h3>
              <textarea
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                placeholder='Paste job description to get role-specific analysis...'
                className='w-full h-32 p-4 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none'
              />
              <p className='text-sm text-gray-600 mt-2'>Will analyze how well your resume matches the role</p>
            </div>

            {/* Error */}
            {error && <div className='mt-6 p-4 bg-red-100 text-red-700 rounded-lg'>{error}</div>}

            {/* Button */}
            <button
              onClick={analyzeResume}
              disabled={loading}
              className='w-full mt-8 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:bg-gray-400 text-white font-bold py-4 rounded-lg transition duration-300 text-lg'
            >
              {loading ? '🔄 Analyzing with AI...' : '🚀 Analyze Resume'}
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className='min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-8'>
      <div className='max-w-7xl mx-auto'>
        {/* Header */}
        <div className='mb-8 flex justify-between items-center'>
          <div>
            <h1 className='text-4xl font-bold text-white'>Resume Analysis Report</h1>
            <p className='text-gray-400 mt-2'>Complete AI-powered breakdown of your resume</p>
          </div>
          <button
            onClick={downloadPDF}
            className='px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg'
          >
            📥 Download PDF
          </button>
        </div>

        {/* Score Cards */}
        <div className='grid grid-cols-2 md:grid-cols-4 gap-4 mb-8'>
          {[
            { label: 'Overall', value: resumeData.analysis.overallScore, color: 'bg-blue-600' },
            { label: 'ATS Score', value: resumeData.analysis.atsScore, color: 'bg-green-600' },
            { label: 'Readability', value: resumeData.analysis.readabilityScore, color: 'bg-purple-600' },
            { label: 'Keyword Match', value: resumeData.analysis.keywordMatchScore, color: 'bg-orange-600' },
          ].map((score, i) => (
            <div key={i} className={`${score.color} text-white rounded-lg p-6 shadow-lg`}>
              <div className='text-4xl font-bold'>{score.value}</div>
              <div className='text-sm opacity-90'>{score.label}</div>
              <div className='mt-2 h-1 bg-white bg-opacity-30 rounded'>
                <div className='h-full bg-white rounded' style={{ width: `${score.value}%` }} />
              </div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className='bg-white rounded-xl shadow-2xl overflow-hidden'>
          <div className='flex border-b'>
            {['overview', 'ats', 'improvements', 'comparison'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab as any)}
                className={`flex-1 py-4 px-6 font-bold transition ${
                  activeTab === tab
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {tab === 'overview' && '📊 Overview'}
                {tab === 'ats' && '✓ ATS Report'}
                {tab === 'improvements' && '💡 Improvements'}
                {tab === 'comparison' && '⚡ JD Match'}
              </button>
            ))}
          </div>

          <div className='p-8'>
            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <div className='space-y-8'>
                <div className='grid grid-cols-2 gap-8'>
                  {/* Strengths */}
                  <div>
                    <h3 className='text-xl font-bold text-gray-900 mb-4'>✓ Strengths</h3>
                    <div className='space-y-3'>
                      {resumeData.analysis.strengths.map((s, i) => (
                        <div key={i} className='p-3 bg-green-50 border-l-4 border-green-500 rounded'>
                          <p className='text-gray-700'>{s}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Weaknesses */}
                  <div>
                    <h3 className='text-xl font-bold text-gray-900 mb-4'>→ Weaknesses</h3>
                    <div className='space-y-3'>
                      {resumeData.analysis.weaknesses.map((w, i) => (
                        <div key={i} className='p-3 bg-orange-50 border-l-4 border-orange-500 rounded'>
                          <p className='text-gray-700'>{w}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Keywords */}
                <div>
                  <h3 className='text-xl font-bold text-gray-900 mb-4'>🔑 Keywords Found</h3>
                  <div className='flex flex-wrap gap-2'>
                    {resumeData.analysis.keywords.slice(0, 20).map((k, i) => (
                      <span key={i} className='px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium'>
                        {k}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Score Distribution */}
                <div>
                  <h3 className='text-xl font-bold text-gray-900 mb-4'>📈 Score Distribution</h3>
                  <ResponsiveContainer width='100%' height={300}>
                    <BarChart data={[
                      { name: 'ATS', value: resumeData.analysis.atsScore },
                      { name: 'Readability', value: resumeData.analysis.readabilityScore },
                      { name: 'Keywords', value: resumeData.analysis.keywordMatchScore },
                      { name: 'Role Fit', value: resumeData.analysis.roleFitScore },
                      { name: 'Experience', value: resumeData.analysis.experienceRelevance },
                      { name: 'Skills', value: resumeData.analysis.skillsCoverage },
                    ]}>
                      <CartesianGrid strokeDasharray='3 3' />
                      <XAxis dataKey='name' />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey='value' fill='#3b82f6' />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {/* ATS Tab */}
            {activeTab === 'ats' && (
              <div className='space-y-8'>
                <div>
                  <h3 className='text-xl font-bold text-gray-900 mb-4'>✓ ATS Checks Passed</h3>
                  <div className='space-y-2'>
                    {resumeData.analysis.atsCompatibility.passed.map((p, i) => (
                      <div key={i} className='flex items-center gap-3 p-3 bg-green-50 rounded'>
                        <span className='text-green-600 font-bold'>✓</span>
                        <span className='text-gray-700'>{p}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className='text-xl font-bold text-gray-900 mb-4'>✗ ATS Issues</h3>
                  <div className='space-y-2'>
                    {resumeData.analysis.atsCompatibility.issues.length === 0 ? (
                      <p className='text-green-700 font-semibold'>No ATS issues found!</p>
                    ) : (
                      resumeData.analysis.atsCompatibility.issues.map((issue, i) => (
                        <div key={i} className='flex items-center gap-3 p-3 bg-red-50 rounded'>
                          <span className='text-red-600 font-bold'>✗</span>
                          <span className='text-gray-700'>{issue}</span>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                <div>
                  <h3 className='text-xl font-bold text-gray-900 mb-4'>⚙️ ATS Simulation</h3>
                  <div className='grid grid-cols-2 gap-4'>
                    {[
                      { label: 'Parsed Successfully', value: resumeData.analysis.atsSimulation.parsedSuccessfully },
                      { label: 'Contact Info Found', value: resumeData.analysis.atsSimulation.contactInfoFound },
                      { label: 'Experience Section', value: resumeData.analysis.atsSimulation.experienceSection },
                      { label: 'Education Section', value: resumeData.analysis.atsSimulation.educationSection },
                    ].map((item, i) => (
                      <div key={i} className={`p-4 rounded-lg ${item.value ? 'bg-green-50' : 'bg-red-50'}`}>
                        <p className='text-gray-700 font-semibold'>{item.label}</p>
                        <p className={`text-lg font-bold ${item.value ? 'text-green-600' : 'text-red-600'}`}>
                          {item.value ? '✓ Pass' : '✗ Fail'}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Improvements Tab */}
            {activeTab === 'improvements' && (
              <div className='space-y-8'>
                <div className='bg-red-50 border-l-4 border-red-600 p-6 rounded'>
                  <h3 className='text-lg font-bold text-red-900 mb-3'>🔴 Critical Fixes (Do First!)</h3>
                  <ul className='space-y-3'>
                    {resumeData.analysis.improvementSuggestions.criticalFixes.map((fix, i) => (
                      <li key={i} className='flex gap-3 text-red-800'>
                        <span className='font-bold'>{i + 1}.</span>
                        <span>{fix}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h3 className='text-lg font-bold text-gray-900 mb-4'>💡 Actionable Tips (10-20 min)</h3>
                  <div className='grid grid-cols-1 gap-4'>
                    {resumeData.analysis.actionableTips.map((tip, i) => (
                      <div key={i} className='p-4 bg-blue-50 border-l-4 border-blue-500 rounded'>
                        <p className='text-blue-900 font-semibold mb-1'>Tip {i + 1}</p>
                        <p className='text-gray-700'>{tip}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className='text-lg font-bold text-gray-900 mb-4'>📝 Professional Summary Suggestion</h3>
                  <div className='p-6 bg-gray-50 border-2 border-gray-300 rounded-lg'>
                    <p className='text-gray-800 italic'>{resumeData.analysis.improvementSuggestions.summaryRewrite}</p>
                  </div>
                </div>

                <div>
                  <h3 className='text-lg font-bold text-gray-900 mb-4'>🎯 Weak Action Verbs to Replace</h3>
                  <div className='space-y-2'>
                    {resumeData.analysis.improvementSuggestions.actionVerbSuggestions.map((verb, i) => (
                      <p key={i} className='p-3 bg-yellow-50 text-gray-700'>{verb}</p>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* JD Comparison Tab */}
            {activeTab === 'comparison' && resumeData.analysis.jdComparison && (
              <div className='space-y-8'>
                <div className='grid grid-cols-2 gap-8'>
                  <div>
                    <h3 className='text-lg font-bold text-gray-900 mb-4'>📊 Role Alignment: {resumeData.analysis.jdComparison.roleAlignment}%</h3>
                    <div className='h-4 bg-gray-300 rounded-full overflow-hidden'>
                      <div
                        className='h-full bg-gradient-to-r from-blue-600 to-indigo-600'
                        style={{ width: `${resumeData.analysis.jdComparison.roleAlignment}%` }}
                      />
                    </div>
                  </div>
                  <div>
                    <h3 className='text-lg font-bold text-gray-900 mb-4'>🎯 Keyword Match: {resumeData.analysis.jdComparison.matchPercentage}%</h3>
                    <div className='h-4 bg-gray-300 rounded-full overflow-hidden'>
                      <div
                        className='h-full bg-gradient-to-r from-green-600 to-emerald-600'
                        style={{ width: `${resumeData.analysis.jdComparison.matchPercentage}%` }}
                      />
                    </div>
                  </div>
                </div>

                <div className='grid grid-cols-2 gap-8'>
                  <div>
                    <h3 className='text-lg font-bold text-green-900 mb-3'>✓ Matched Keywords</h3>
                    <div className='flex flex-wrap gap-2'>
                      {resumeData.analysis.jdComparison.matchedKeywords.map((k, i) => (
                        <span key={i} className='px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm'>
                          {k}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h3 className='text-lg font-bold text-red-900 mb-3'>✗ Missing Keywords</h3>
                    <div className='flex flex-wrap gap-2'>
                      {resumeData.analysis.jdComparison.missingKeywords.slice(0, 15).map((k, i) => (
                        <span key={i} className='px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm'>
                          {k}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Reset Button */}
        <button
          onClick={() => {
            setResumeData(null)
            setResumeText('')
            setJobDescription('')
          }}
          className='mt-8 w-full py-4 bg-gray-600 hover:bg-gray-700 text-white font-bold rounded-lg'
        >
          🔄 Analyze Another Resume
        </button>
      </div>
    </div>
  )
}

export default ResumeTracker
