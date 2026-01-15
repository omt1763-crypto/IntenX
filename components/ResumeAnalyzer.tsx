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
  strengths: string[]
  areasToImprove: string[]
  keywords: string[]
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

const ResumeAnalyzer: React.FC<{
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
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          resumeText,
          phoneNumber: phoneNumber || 'anonymous',
        }),
      })

      const data: AnalysisResult = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to analyze resume')
      }

      setAnalysis(data.analysis)
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

    // Title
    pdf.setFontSize(24)
    pdf.setTextColor(30, 100, 200)
    pdf.text('Resume Analysis Report', pageWidth / 2, yPosition, {
      align: 'center',
    })
    yPosition += 15

    // Scores Section
    pdf.setFontSize(12)
    pdf.setTextColor(0, 0, 0)
    pdf.text('OVERALL SCORES', 10, yPosition)
    yPosition += 8

    // Score boxes
    pdf.setFillColor(200, 220, 255)
    pdf.rect(10, yPosition, 50, 20, 'F')
    pdf.setFontSize(16)
    pdf.setTextColor(30, 100, 200)
    pdf.text(`${analysis.overallScore}/100`, 35, yPosition + 12, {
      align: 'center',
    })
    pdf.setFontSize(10)
    pdf.setTextColor(100, 100, 100)
    pdf.text('Resume Score', 35, yPosition + 18, { align: 'center' })

    pdf.setFillColor(200, 255, 200)
    pdf.rect(65, yPosition, 50, 20, 'F')
    pdf.setFontSize(16)
    pdf.setTextColor(0, 150, 0)
    pdf.text(`${analysis.atsScore}%`, 90, yPosition + 12, { align: 'center' })
    pdf.setFontSize(10)
    pdf.setTextColor(100, 100, 100)
    pdf.text('ATS Score', 90, yPosition + 18, { align: 'center' })

    pdf.setFillColor(255, 240, 200)
    pdf.rect(120, yPosition, 50, 20, 'F')
    pdf.setFontSize(16)
    pdf.setTextColor(200, 100, 0)
    pdf.text(`${analysis.contentScore}%`, 145, yPosition + 12, {
      align: 'center',
    })
    pdf.setFontSize(10)
    pdf.setTextColor(100, 100, 100)
    pdf.text('Content Score', 145, yPosition + 18, { align: 'center' })

    yPosition += 35

    // Strengths Section
    pdf.setFontSize(12)
    pdf.setTextColor(0, 0, 0)
    pdf.text('STRENGTHS', 10, yPosition)
    yPosition += 8

    analysis.strengths.forEach((strength) => {
      pdf.setFontSize(10)
      pdf.setTextColor(0, 150, 0)
      pdf.text('✓ ', 10, yPosition)
      const wrappedText = pdf.splitTextToSize(strength, pageWidth - 20)
      pdf.text(wrappedText, 15, yPosition)
      yPosition += wrappedText.length * 5 + 3
    })

    yPosition += 5

    // Areas to Improve Section
    pdf.setFontSize(12)
    pdf.setTextColor(0, 0, 0)
    pdf.text('AREAS TO IMPROVE', 10, yPosition)
    yPosition += 8

    analysis.areasToImprove.forEach((area) => {
      pdf.setFontSize(10)
      pdf.setTextColor(200, 100, 0)
      pdf.text('→ ', 10, yPosition)
      const wrappedText = pdf.splitTextToSize(area, pageWidth - 20)
      pdf.text(wrappedText, 15, yPosition)
      yPosition += wrappedText.length * 5 + 3
    })

    // Add new page if needed
    if (yPosition > pageHeight - 20) {
      pdf.addPage()
      yPosition = 10
    }

    // Keywords Section
    yPosition += 5
    pdf.setFontSize(12)
    pdf.setTextColor(0, 0, 0)
    pdf.text('KEY KEYWORDS FOUND', 10, yPosition)
    yPosition += 8

    const keywordText = analysis.keywords.join(' • ')
    const wrappedKeywords = pdf.splitTextToSize(keywordText, pageWidth - 20)
    pdf.setFontSize(9)
    pdf.setTextColor(50, 50, 50)
    pdf.text(wrappedKeywords, 10, yPosition)

    // Footer
    pdf.setFontSize(8)
    pdf.setTextColor(150, 150, 150)
    pdf.text(
      `Analysis completed on ${new Date(analysis.analyzedAt || '').toLocaleDateString()}`,
      10,
      pageHeight - 10
    )

    pdf.save('resume-analysis.pdf')
  }

  return (
    <div className='w-full max-w-4xl mx-auto p-6 bg-white rounded-lg'>
      {!analysis ? (
        <div className='mb-6'>
          <button
            onClick={analyzeResume}
            disabled={loading}
            className='w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-bold py-3 px-4 rounded-lg transition duration-200'
          >
            {loading ? 'Analyzing Resume...' : 'Analyze My Resume'}
          </button>

          {error && (
            <div className='mt-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded'>
              {error}
            </div>
          )}
        </div>
      ) : (
        <>
          {/* Score Cards */}
          <div className='grid grid-cols-3 gap-4 mb-8'>
            <div className='bg-blue-50 p-6 rounded-lg border border-blue-200'>
              <div className='text-4xl font-bold text-blue-600'>
                {analysis.overallScore}
              </div>
              <div className='text-gray-600 text-sm mt-2'>/100</div>
              <p className='text-gray-700 font-semibold mt-2'>Resume Score</p>
            </div>

            <div className='bg-green-50 p-6 rounded-lg border border-green-200'>
              <div className='text-4xl font-bold text-green-600'>
                {analysis.atsScore}%
              </div>
              <p className='text-gray-700 font-semibold mt-4'>ATS Score</p>
            </div>

            <div className='bg-orange-50 p-6 rounded-lg border border-orange-200'>
              <div className='text-4xl font-bold text-orange-600'>
                {analysis.contentScore}%
              </div>
              <p className='text-gray-700 font-semibold mt-4'>Content Score</p>
            </div>
          </div>

          {/* Strengths */}
          <div className='mb-8'>
            <h3 className='text-xl font-bold text-gray-800 mb-4 flex items-center gap-2'>
              <span className='text-green-600'>✓</span> Strengths
            </h3>
            <ul className='space-y-2'>
              {analysis.strengths.map((strength, idx) => (
                <li
                  key={idx}
                  className='flex items-start gap-3 p-3 bg-green-50 rounded-lg border border-green-200'
                >
                  <span className='text-green-600 font-bold mt-1'>✓</span>
                  <span className='text-gray-700'>{strength}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Areas to Improve */}
          <div className='mb-8'>
            <h3 className='text-xl font-bold text-gray-800 mb-4 flex items-center gap-2'>
              <span className='text-orange-600'>→</span> Areas to Improve
            </h3>
            <ul className='space-y-2'>
              {analysis.areasToImprove.map((area, idx) => (
                <li
                  key={idx}
                  className='flex items-start gap-3 p-3 bg-orange-50 rounded-lg border border-orange-200'
                >
                  <span className='text-orange-600 font-bold mt-1'>→</span>
                  <span className='text-gray-700'>{area}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Keywords */}
          <div className='mb-8'>
            <h3 className='text-xl font-bold text-gray-800 mb-4'>
              Keywords Found
            </h3>
            <div className='flex flex-wrap gap-2'>
              {analysis.keywords.map((keyword, idx) => (
                <span
                  key={idx}
                  className='px-4 py-2 bg-blue-100 text-blue-800 rounded-full text-sm font-medium'
                >
                  {keyword}
                </span>
              ))}
            </div>
          </div>

          {/* Detailed Checks */}
          {analysis.sections && (
            <>
              {analysis.sections.contentChecks && (
                <div className='mb-8'>
                  <h3 className='text-lg font-bold text-gray-800 mb-4'>
                    Content Checks
                  </h3>
                  <div className='space-y-2'>
                    {Object.entries(analysis.sections.contentChecks).map(
                      ([key, check]) => (
                        <div
                          key={key}
                          className={`p-3 rounded-lg border ${
                            check.status === 'pass'
                              ? 'bg-green-50 border-green-200'
                              : 'bg-orange-50 border-orange-200'
                          }`}
                        >
                          <p className='font-semibold text-gray-800'>
                            {key.replace(/([A-Z])/g, ' $1').trim()}
                          </p>
                          <p className='text-sm text-gray-600'>
                            {check.feedback}
                          </p>
                        </div>
                      )
                    )}
                  </div>
                </div>
              )}
            </>
          )}

          {/* Download Button */}
          <div className='flex gap-4 mt-8'>
            <button
              onClick={downloadPDF}
              className='flex-1 bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-4 rounded-lg transition duration-200'
            >
              📥 Download Report as PDF
            </button>
            <button
              onClick={() => {
                setAnalysis(null)
                setError(null)
              }}
              className='flex-1 bg-gray-600 hover:bg-gray-700 text-white font-bold py-3 px-4 rounded-lg transition duration-200'
            >
              Analyze Another Resume
            </button>
          </div>
        </>
      )}
    </div>
  )
}

export default ResumeAnalyzer
