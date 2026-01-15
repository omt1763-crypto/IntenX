'use client'

import React, { useState } from 'react'
import jsPDF from 'jspdf'

interface AnalysisSection {
  status: 'pass' | 'fail'
  feedback: string
}

interface Analysis {
  overallScore: number
  atsScore: number
  contentScore: number
  searchability: number
  strengths: string[]
  areasToImprove: string[]
  keywords: string[]
  hardSkills: string[]
  softSkills: string[]
  missingElements: string[]
  skillsComparison: Record<string, { yourLevel: string; industryAverage: string; gap: number }>
  competitiveAnalysis: string
  recruiterTips: string[]
  formattingIssues: string[]
  analyzedAt?: string
  sections?: {
    contentChecks?: Record<string, AnalysisSection>
    formatChecks?: Record<string, AnalysisSection>
    skillsChecks?: Record<string, AnalysisSection>
    resumeSectionsChecks?: Record<string, AnalysisSection>
    styleChecks?: Record<string, AnalysisSection>
  }
}

interface AnalysisResult {
  success?: boolean
  analysis?: Analysis
  phoneNumber?: string
  analyzedAt?: string
  error?: string
}

const ResumeAnalyzerPro: React.FC<{
  resumeText: string
  phoneNumber?: string
}> = ({ resumeText, phoneNumber }) => {
  const [analysis, setAnalysis] = useState<Analysis | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const analyzeResume = async () => {
    if (!resumeText.trim()) {
      setError('Please paste your resume text first')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/resume-analyzer/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resumeText,
          phoneNumber: phoneNumber || 'anonymous',
        }),
      })

      const data: AnalysisResult = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to analyze resume')
      }

      setAnalysis(data.analysis || null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const downloadPDF = () => {
    if (!analysis) return

    const pdf = new jsPDF()
    const pageWidth = pdf.internal.pageSize.getWidth()
    const pageHeight = pdf.internal.pageSize.getHeight()
    let yPosition = 10

    // Helper function to add section with proper spacing
    const addSection = (title: string, yPos: number) => {
      pdf.setFontSize(14)
      pdf.setTextColor(20, 80, 160)
      pdf.text(title, 10, yPos)
      pdf.setDrawColor(20, 80, 160)
      pdf.line(10, yPos + 2, pageWidth - 10, yPos + 2)
      return yPos + 8
    }

    // Header
    pdf.setFontSize(26)
    pdf.setTextColor(30, 100, 200)
    pdf.text('RESUME ANALYSIS REPORT', pageWidth / 2, yPosition, {
      align: 'center',
    })
    yPosition += 15

    // Score Cards Section
    yPosition = addSection('OVERALL SCORES', yPosition)

    const scores: Array<{ label: string; value: string; color: [number, number, number] }> = [
      { label: 'Overall Score', value: `${analysis.overallScore}/100`, color: [200, 220, 255] },
      { label: 'ATS Score', value: `${analysis.atsScore}%`, color: [200, 255, 200] },
      { label: 'Content Score', value: `${analysis.contentScore}%`, color: [255, 240, 200] },
      { label: 'Searchability', value: `${analysis.searchability}%`, color: [230, 200, 255] },
    ]

    let xPos = 10
    scores.forEach((score) => {
      pdf.setFillColor(score.color[0], score.color[1], score.color[2])
      pdf.rect(xPos, yPosition, 40, 20, 'F')
      pdf.setFontSize(14)
      pdf.setTextColor(30, 30, 30)
      pdf.text(score.value, xPos + 20, yPosition + 10, { align: 'center' })
      pdf.setFontSize(8)
      pdf.text(score.label, xPos + 20, yPosition + 17, { align: 'center' })
      xPos += 42
    })

    yPosition += 28

    // Skills Section
    yPosition = addSection('SKILLS BREAKDOWN', yPosition)

    // Hard Skills
    pdf.setFontSize(11)
    pdf.setTextColor(40, 40, 40)
    pdf.text('Hard/Technical Skills:', 10, yPosition)
    yPosition += 5
    pdf.setFontSize(9)
    const hardSkillsText = analysis.hardSkills.slice(0, 8).join(' • ')
    const wrappedHardSkills = pdf.splitTextToSize(hardSkillsText, pageWidth - 20)
    pdf.text(wrappedHardSkills, 12, yPosition)
    yPosition += wrappedHardSkills.length * 4 + 3

    // Soft Skills
    pdf.setFontSize(11)
    pdf.setTextColor(40, 40, 40)
    pdf.text('Soft Skills:', 10, yPosition)
    yPosition += 5
    pdf.setFontSize(9)
    const softSkillsText = analysis.softSkills.slice(0, 8).join(' • ')
    const wrappedSoftSkills = pdf.splitTextToSize(softSkillsText, pageWidth - 20)
    pdf.text(wrappedSoftSkills, 12, yPosition)
    yPosition += wrappedSoftSkills.length * 4 + 5

    // Check for page break
    if (yPosition > pageHeight - 30) {
      pdf.addPage()
      yPosition = 10
    }

    // Areas to Fix
    yPosition = addSection('AREAS TO IMPROVE', yPosition)

    analysis.areasToImprove.forEach((area) => {
      pdf.setFillColor(255, 240, 200)
      pdf.rect(10, yPosition - 2, pageWidth - 20, 8, 'F')
      pdf.setFontSize(9)
      pdf.setTextColor(200, 100, 0)
      pdf.text('→ ' + area, 12, yPosition + 2)
      yPosition += 10
    })
    yPosition += 2

    // Missing Elements
    yPosition = addSection('MISSING CRITICAL ELEMENTS (ATS CHECK)', yPosition)

    if (analysis.missingElements.length === 0) {
      pdf.setFontSize(9)
      pdf.setTextColor(0, 150, 0)
      pdf.text('✓ All critical elements are present!', 10, yPosition)
      yPosition += 6
    } else {
      analysis.missingElements.forEach((element) => {
        pdf.setFillColor(255, 200, 200)
        pdf.rect(10, yPosition - 2, pageWidth - 20, 8, 'F')
        pdf.setFontSize(9)
        pdf.setTextColor(200, 0, 0)
        pdf.text('✗ ' + element, 12, yPosition + 2)
        yPosition += 10
      })
    }

    yPosition += 3

    // Check for page break
    if (yPosition > pageHeight - 40) {
      pdf.addPage()
      yPosition = 10
    }

    // Strengths
    yPosition = addSection('KEY STRENGTHS', yPosition)

    analysis.strengths.forEach((strength) => {
      pdf.setFillColor(200, 255, 200)
      pdf.rect(10, yPosition - 2, pageWidth - 20, 8, 'F')
      pdf.setFontSize(9)
      pdf.setTextColor(0, 150, 0)
      pdf.text('✓ ' + strength, 12, yPosition + 2)
      yPosition += 10
    })
    yPosition += 3

    // Check for page break
    if (yPosition > pageHeight - 40) {
      pdf.addPage()
      yPosition = 10
    }

    // Competitive Analysis
    yPosition = addSection('HOW YOUR RESUME COMPARES', yPosition)

    pdf.setFontSize(9)
    pdf.setTextColor(50, 50, 50)
    const competitiveText = pdf.splitTextToSize(analysis.competitiveAnalysis, pageWidth - 20)
    pdf.text(competitiveText, 12, yPosition)
    yPosition += competitiveText.length * 5 + 5

    // Check for page break
    if (yPosition > pageHeight - 40) {
      pdf.addPage()
      yPosition = 10
    }

    // Recruiter Tips
    yPosition = addSection('RECRUITER TIPS FOR EXCELLENCE', yPosition)

    analysis.recruiterTips.forEach((tip, idx) => {
      pdf.setFontSize(9)
      pdf.setTextColor(30, 100, 200)
      const tipText = pdf.splitTextToSize(`${idx + 1}. ${tip}`, pageWidth - 24)
      pdf.text(tipText, 14, yPosition)
      yPosition += tipText.length * 4 + 2
    })

    yPosition += 3

    // Check for page break
    if (yPosition > pageHeight - 30) {
      pdf.addPage()
      yPosition = 10
    }

    // Formatting Issues
    if (analysis.formattingIssues.length > 0) {
      yPosition = addSection('FORMATTING ISSUES', yPosition)

      analysis.formattingIssues.forEach((issue) => {
        pdf.setFontSize(9)
        pdf.setTextColor(200, 100, 0)
        pdf.text('⚠ ' + issue, 12, yPosition)
        yPosition += 6
      })
      yPosition += 3
    }

    // Keywords Found
    yPosition = addSection('KEY KEYWORDS FOUND', yPosition)

    pdf.setFontSize(8)
    const keywordText = analysis.keywords.slice(0, 15).join(' • ')
    const wrappedKeywords = pdf.splitTextToSize(keywordText, pageWidth - 20)
    pdf.setTextColor(50, 50, 50)
    pdf.text(wrappedKeywords, 10, yPosition)

    // Footer on last page
    pdf.setFontSize(8)
    pdf.setTextColor(150, 150, 150)
    pdf.text(
      `Analysis completed on ${new Date(analysis.analyzedAt || '').toLocaleDateString()}`,
      10,
      pageHeight - 10
    )

    pdf.save('resume-analysis-report.pdf')
  }

  if (!analysis) {
    return (
      <div className='w-full min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8'>
        <div className='max-w-2xl mx-auto bg-white rounded-xl shadow-2xl p-8'>
          <h1 className='text-4xl font-bold text-blue-600 mb-2'>Resume Analyzer Pro</h1>
          <p className='text-gray-600 mb-8'>AI-Powered Resume Analysis with OpenAI</p>

          <button
            onClick={analyzeResume}
            disabled={loading}
            className='w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:bg-gray-400 text-white font-bold py-4 px-6 rounded-lg transition duration-300 text-lg'
          >
            {loading ? (
              <span className='flex items-center justify-center'>
                <span className='animate-spin mr-3'>⌛</span> Analyzing Resume...
              </span>
            ) : (
              '🚀 Analyze My Resume'
            )}
          </button>

          {error && (
            <div className='mt-6 p-4 bg-red-100 border-l-4 border-red-500 text-red-700 rounded'>
              <p className='font-bold'>Error</p>
              <p>{error}</p>
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className='w-full min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-8'>
      <div className='max-w-7xl mx-auto'>
        {/* Header */}
        <div className='mb-8'>
          <h1 className='text-4xl font-bold text-gray-900 mb-2'>Resume Analysis Report</h1>
          <p className='text-gray-600'>AI-Powered Analysis using OpenAI GPT-4</p>
        </div>

        {/* Score Cards */}
        <div className='grid grid-cols-2 md:grid-cols-4 gap-4 mb-8'>
          <div className='bg-white p-6 rounded-lg shadow-lg border-l-4 border-blue-600'>
            <div className='text-4xl font-bold text-blue-600'>{analysis.overallScore}</div>
            <div className='text-gray-600 text-sm mt-2'>/100</div>
            <p className='text-gray-700 font-semibold mt-2 text-sm'>Overall Score</p>
          </div>

          <div className='bg-white p-6 rounded-lg shadow-lg border-l-4 border-green-600'>
            <div className='text-4xl font-bold text-green-600'>{analysis.atsScore}%</div>
            <p className='text-gray-700 font-semibold mt-4 text-sm'>ATS Score</p>
          </div>

          <div className='bg-white p-6 rounded-lg shadow-lg border-l-4 border-orange-600'>
            <div className='text-4xl font-bold text-orange-600'>{analysis.contentScore}%</div>
            <p className='text-gray-700 font-semibold mt-4 text-sm'>Content Score</p>
          </div>

          <div className='bg-white p-6 rounded-lg shadow-lg border-l-4 border-purple-600'>
            <div className='text-4xl font-bold text-purple-600'>{analysis.searchability}%</div>
            <p className='text-gray-700 font-semibold mt-4 text-sm'>Searchability</p>
          </div>
        </div>

        <div className='grid grid-cols-1 lg:grid-cols-3 gap-8'>
          {/* Left Column */}
          <div className='lg:col-span-2 space-y-8'>
            {/* Skills Section */}
            <div className='bg-white rounded-lg shadow-lg p-6'>
              <h2 className='text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2'>
                <span>🎯</span> Skills & Competencies
              </h2>

              <div className='mb-6'>
                <h3 className='font-bold text-gray-800 mb-3'>Hard/Technical Skills</h3>
                <div className='flex flex-wrap gap-2'>
                  {analysis.hardSkills.map((skill, idx) => (
                    <span key={idx} className='px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium'>
                      {skill}
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <h3 className='font-bold text-gray-800 mb-3'>Soft Skills</h3>
                <div className='flex flex-wrap gap-2'>
                  {analysis.softSkills.map((skill, idx) => (
                    <span key={idx} className='px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium'>
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Areas to Fix */}
            <div className='bg-white rounded-lg shadow-lg p-6'>
              <h2 className='text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2'>
                <span className='text-orange-600'>⚠️</span> Areas to Improve
              </h2>
              <div className='space-y-3'>
                {analysis.areasToImprove.map((area, idx) => (
                  <div key={idx} className='flex gap-3 p-3 bg-orange-50 border-l-4 border-orange-500 rounded'>
                    <span className='text-orange-600 font-bold'>→</span>
                    <span className='text-gray-700'>{area}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* ATS Checklist */}
            <div className='bg-white rounded-lg shadow-lg p-6'>
              <h2 className='text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2'>
                <span>✓</span> ATS Compatibility Check
              </h2>
              {analysis.missingElements.length === 0 ? (
                <div className='p-4 bg-green-50 border-l-4 border-green-500 rounded'>
                  <p className='text-green-700 font-semibold'>✓ All critical elements present!</p>
                  <p className='text-green-600 text-sm'>Your resume has all the essential components for ATS systems.</p>
                </div>
              ) : (
                <div className='space-y-3'>
                  {analysis.missingElements.map((element, idx) => (
                    <div key={idx} className='flex gap-3 p-3 bg-red-50 border-l-4 border-red-500 rounded'>
                      <span className='text-red-600 font-bold'>✗</span>
                      <span className='text-gray-700'>{element}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Recruiter Tips */}
            <div className='bg-white rounded-lg shadow-lg p-6'>
              <h2 className='text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2'>
                <span>💡</span> Recruiter Tips for Excellence
              </h2>
              <div className='space-y-4'>
                {analysis.recruiterTips.map((tip, idx) => (
                  <div key={idx} className='flex gap-4 p-4 bg-blue-50 rounded-lg border-l-4 border-blue-500'>
                    <span className='text-blue-600 font-bold text-lg'>{idx + 1}</span>
                    <p className='text-gray-700'>{tip}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div className='space-y-8'>
            {/* Strengths */}
            <div className='bg-white rounded-lg shadow-lg p-6'>
              <h2 className='text-xl font-bold text-gray-900 mb-4 flex items-center gap-2'>
                <span className='text-green-600'>✓</span> Strengths
              </h2>
              <div className='space-y-3'>
                {analysis.strengths.map((strength, idx) => (
                  <div key={idx} className='p-3 bg-green-50 border-l-4 border-green-500 rounded'>
                    <p className='text-green-700 text-sm font-medium'>{strength}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Competitive Analysis */}
            <div className='bg-white rounded-lg shadow-lg p-6'>
              <h2 className='text-xl font-bold text-gray-900 mb-4'>🏆 Competitive Analysis</h2>
              <p className='text-gray-700 text-sm leading-relaxed'>{analysis.competitiveAnalysis}</p>
            </div>

            {/* Keywords */}
            <div className='bg-white rounded-lg shadow-lg p-6'>
              <h2 className='text-xl font-bold text-gray-900 mb-4'>🔑 Top Keywords</h2>
              <div className='flex flex-wrap gap-2'>
                {analysis.keywords.slice(0, 12).map((keyword, idx) => (
                  <span key={idx} className='px-2 py-1 bg-indigo-100 text-indigo-800 rounded text-xs font-medium'>
                    {keyword}
                  </span>
                ))}
              </div>
            </div>

            {/* Formatting */}
            {analysis.formattingIssues.length > 0 && (
              <div className='bg-white rounded-lg shadow-lg p-6'>
                <h2 className='text-xl font-bold text-gray-900 mb-4'>📋 Formatting Issues</h2>
                <div className='space-y-2'>
                  {analysis.formattingIssues.map((issue, idx) => (
                    <div key={idx} className='flex gap-2 text-sm text-orange-700'>
                      <span>⚠️</span>
                      <span>{issue}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Download Button */}
        <div className='flex gap-4 mt-12 mb-8'>
          <button
            onClick={downloadPDF}
            className='flex-1 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-bold py-4 px-6 rounded-lg transition duration-300 text-lg flex items-center justify-center gap-2'
          >
            📥 Download Full Report (PDF)
          </button>
          <button
            onClick={() => {
              setAnalysis(null)
              setError(null)
            }}
            className='flex-1 bg-gray-600 hover:bg-gray-700 text-white font-bold py-4 px-6 rounded-lg transition duration-300'
          >
            🔄 Analyze Another Resume
          </button>
        </div>
      </div>
    </div>
  )
}

export default ResumeAnalyzerPro
