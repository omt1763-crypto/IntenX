'use client'

import { useState } from 'react'
import CandidateSidebar from '@/components/CandidateSidebar'
import DashboardBreadcrumb from '@/components/DashboardBreadcrumb'
import { FileText, Upload, BarChart3, Lightbulb, AlertCircle } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function ResumeAnalysisPage() {
  const router = useRouter()
  const [file, setFile] = useState(null)
  const [analysis, setAnalysis] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const handleFileUpload = async (e) => {
    const selectedFile = e.target.files?.[0]
    if (!selectedFile) return

    // Validate file type
    const validTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
    if (!validTypes.includes(selectedFile.type)) {
      setError('Please upload a PDF or Word document')
      return
    }

    // Validate file size (5MB max)
    if (selectedFile.size > 5 * 1024 * 1024) {
      setError('File size must be less than 5MB')
      return
    }

    setFile(selectedFile)
    setAnalysis(null)
    setError(null)
    setLoading(true)

    try {
      // Read file as base64
      const reader = new FileReader()
      reader.onload = async (event) => {
        const fileContent = event.target.result
        console.log('[ResumeAnalysis] File loaded, size:', fileContent.length)
        
        // Send to resume analysis API
        try {
          console.log('[ResumeAnalysis] Sending to API...')
          const response = await fetch('/api/analyze-resume', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              fileName: selectedFile.name,
              fileType: selectedFile.type,
              fileContent: fileContent
            })
          })

          console.log('[ResumeAnalysis] Response status:', response.status)
          const result = await response.json()
          console.log('[ResumeAnalysis] Full response:', result)

          if (!response.ok) {
            console.error('[ResumeAnalysis] API error:', result)
            setError(result.error || `Failed to analyze resume (Status: ${response.status})`)
            setLoading(false)
            return
          }

          console.log('[ResumeAnalysis] Analysis result:', result)

          // Parse AI response - handle both nested and flat responses
          const aiAnalysis = result.analysis || result
          console.log('[ResumeAnalysis] Parsed analysis:', aiAnalysis)

          const analysisData = {
            overallScore: aiAnalysis.score !== undefined ? aiAnalysis.score : (aiAnalysis.overallScore || 75),
            atsScore: aiAnalysis.atsScore || aiAnalysis.score || 75,
            strengths: Array.isArray(aiAnalysis.strengths) ? aiAnalysis.strengths : [],
            improvements: Array.isArray(aiAnalysis.improvements) ? aiAnalysis.improvements : (Array.isArray(aiAnalysis.areasForImprovement) ? aiAnalysis.areasForImprovement : []),
            suggestions: Array.isArray(aiAnalysis.suggestions) ? aiAnalysis.suggestions : (Array.isArray(aiAnalysis.recommendations) ? aiAnalysis.recommendations : []),
            recommendations: Array.isArray(aiAnalysis.recommendations) ? aiAnalysis.recommendations : [],
            skills: Array.isArray(aiAnalysis.skills) ? aiAnalysis.skills : [],
            extractedText: aiAnalysis.text || 'Resume analyzed'
          }
          
          console.log('[ResumeAnalysis] Final analysis data:', analysisData)
          setAnalysis(analysisData)

          setLoading(false)
        } catch (err) {
          console.error('[ResumeAnalysis] Error calling API:', err)
          setError(`Error analyzing resume: ${err.message}`)
          setLoading(false)
        }
      }
      reader.readAsDataURL(selectedFile)
    } catch (err) {
      console.error('[ResumeAnalysis] File reading error:', err)
      setError('Error reading file. Please try again.')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-white to-cyan-50">
      <CandidateSidebar />
      {/* Sidebar Spacing */}
      <div className="ml-64 pt-8 pb-16">
        <div className="px-8 lg:px-12">
          <DashboardBreadcrumb />

          <div className="mb-12">
            <h1 className="text-5xl font-bold text-slate-900 mb-2">Resume Analysis</h1>
            <p className="text-lg text-slate-600 font-light">Get AI-powered feedback on your resume</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Upload Section */}
            <div className="lg:col-span-1">
              <div className="rounded-3xl p-8 backdrop-blur-xl bg-white/50 border border-white/60 border-dashed shadow-lg">
                <label className="cursor-pointer">
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx"
                    onChange={handleFileUpload}
                    disabled={loading}
                    className="hidden"
                  />
                  <div className="text-center">
                    <Upload className="w-12 h-12 text-cyan-500 mx-auto mb-4" />
                    <h3 className="font-bold text-slate-900 mb-2">Upload Resume</h3>
                    <p className="text-sm text-slate-600 mb-4">
                      Drag and drop your resume or click to browse
                    </p>
                    <p className="text-xs text-slate-500">PDF, DOC, or DOCX (Max 5MB)</p>
                  </div>
                </label>
              </div>

              {file && (
                <div className="mt-4 rounded-3xl p-4 bg-cyan-50 border border-cyan-200">
                  <p className="text-sm font-semibold text-cyan-900">✓ {file.name}</p>
                </div>
              )}

              {error && (
                <div className="mt-4 rounded-3xl p-4 bg-red-50 border border-red-200">
                  <p className="text-sm font-semibold text-red-900">✗ {error}</p>
                </div>
              )}
            </div>

            {/* Analysis Results */}
            <div className="lg:col-span-2 space-y-6">
              {loading ? (
                <div className="rounded-3xl p-12 backdrop-blur-xl bg-white/50 border border-white/60 shadow-lg text-center">
                  <div className="animate-spin w-8 h-8 border-4 border-cyan-200 border-t-cyan-500 rounded-full mx-auto mb-4" />
                  <p className="text-slate-600">Analyzing your resume with AI...</p>
                </div>
              ) : analysis ? (
                <>
                  {/* Score */}
                  <div className="rounded-3xl p-8 backdrop-blur-xl bg-white/50 border border-white/60 shadow-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-slate-600 font-semibold mb-2">Overall Score</p>
                        <p className="text-5xl font-bold text-cyan-500">{analysis.overallScore}</p>
                        <p className="text-sm text-slate-600 mt-2">/100</p>
                      </div>
                      <BarChart3 className="w-16 h-16 text-cyan-500/20" />
                    </div>
                  </div>

                  {/* Strengths */}
                  {analysis.strengths && analysis.strengths.length > 0 && (
                    <div className="rounded-3xl p-8 backdrop-blur-xl bg-white/50 border border-white/60 shadow-lg">
                      <h3 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
                        <span className="text-cyan-600">✓</span>
                        Strengths
                      </h3>
                      <ul className="space-y-3">
                        {analysis.strengths.map((strength, i) => (
                          <li key={i} className="flex items-start gap-3">
                            <span className="w-2 h-2 rounded-full bg-cyan-500 mt-2 flex-shrink-0" />
                            <span className="text-slate-700">{strength}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Improvements */}
                  {analysis.improvements && analysis.improvements.length > 0 && (
                    <div className="rounded-3xl p-8 backdrop-blur-xl bg-white/50 border border-white/60 shadow-lg">
                      <h3 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
                        <AlertCircle className="w-5 h-5 text-purple-500" />
                        Areas for Improvement
                      </h3>
                      <ul className="space-y-3">
                        {analysis.improvements.map((improvement, i) => (
                          <li key={i} className="flex items-start gap-3">
                            <span className="w-2 h-2 rounded-full bg-purple-500 mt-2 flex-shrink-0" />
                            <span className="text-slate-700">{improvement}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Suggestions */}
                  {analysis.suggestions && analysis.suggestions.length > 0 && (
                    <div className="rounded-3xl p-8 backdrop-blur-xl bg-white/50 border border-white/60 shadow-lg">
                      <h3 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
                        <Lightbulb className="w-5 h-5 text-cyan-500" />
                        AI Suggestions
                      </h3>
                      <ul className="space-y-3">
                        {analysis.suggestions.map((suggestion, i) => (
                          <li key={i} className="flex items-start gap-3">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 mt-2 flex-shrink-0" />
                            <span className="text-slate-700">{suggestion}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Extracted Skills */}
                  {analysis.skills && analysis.skills.length > 0 && (
                    <div className="rounded-3xl p-8 backdrop-blur-xl bg-white/50 border border-white/60 shadow-lg">
                      <h3 className="text-xl font-bold text-slate-900 mb-4">Extracted Skills</h3>
                      <div className="flex flex-wrap gap-2">
                        {analysis.skills.map((skill, i) => (
                            <span key={i} className="px-4 py-2 bg-cyan-100 text-cyan-900 rounded-full text-sm font-semibold">
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="rounded-3xl p-12 backdrop-blur-xl bg-white/50 border border-white/60 shadow-lg text-center">
                  <FileText className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                  <p className="text-slate-600">Upload your resume to get started</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
