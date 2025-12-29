'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import Sidebar from '@/components/Sidebar'
import DashboardBreadcrumb from '@/components/DashboardBreadcrumb'
import { Mail, Calendar, Clock, TrendingUp, AlertCircle, CheckCircle2, XCircle } from 'lucide-react'

interface Interview {
  id: string
  name: string
  email: string
  position: string
  job_id: string
  duration: number
  timestamp: string
  skills: Array<{ name: string; reason: string; importance: string }>
  conversation: Array<{ role: string; content: string; timestamp: string }>
  notes: string
}

export default function ApplicantDetailPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user: authUser, isAuthenticated, isHydrated } = useAuth()
  const [interview, setInterview] = useState<Interview | null>(null)
  const [loading, setLoading] = useState(true)
  const [mounted, setMounted] = useState(false)
  const [assessment, setAssessment] = useState<any>(null)
  const [noInterviewFound, setNoInterviewFound] = useState(false)

  const applicantId = searchParams?.get('applicantId')
  const userId = authUser?.id

  useEffect(() => {
    setMounted(true)
  }, [])

  // Redirect to login if auth is hydrated and user is not authenticated
  useEffect(() => {
    if (mounted && isHydrated && !isAuthenticated) {
      console.log('[ApplicantDetail] Not authenticated, redirecting to login')
      router.push('/auth/login')
    }
  }, [isHydrated, isAuthenticated, mounted])

  // Load interview data after auth is verified and we have required params
  useEffect(() => {
    if (applicantId && userId && isAuthenticated && isHydrated && mounted) {
      loadInterviewData()
    }
  }, [applicantId, userId, isAuthenticated, isHydrated, mounted])

  const loadInterviewData = async () => {
    try {
      // Fetch interview data from interviews table
      const response = await fetch(`/api/interview-detail?applicantId=${applicantId}`)
      const result = await response.json()

      if (result.data) {
        setInterview(result.data)
        setNoInterviewFound(false)
        // Use stored AI analysis if available, otherwise fall back to calculation
        if (result.data.analysis) {
          setAssessment(result.data.analysis)
          console.log('[ApplicantDetail] Using stored AI analysis:', result.data.analysis)
        } else {
          generateAssessment(result.data)
          console.log('[ApplicantDetail] No AI analysis found, generating assessment...')
        }
        console.log('[ApplicantDetail] Interview loaded:', result.data)
      } else if (result.error) {
        console.warn('[ApplicantDetail] No interview found:', result.error)
        setNoInterviewFound(true)
        setInterview(null)
      }
    } catch (error) {
      console.error('[ApplicantDetail] Error loading interview:', error)
      setNoInterviewFound(true)
    } finally {
      setLoading(false)
    }
  }

  const generateAssessment = (data: Interview) => {
    // Calculate scores based on conversation and skills
    const conversationLength = data.conversation?.length || 0
    const skillsCount = data.skills?.length || 0
    const duration = data.duration || 0

    // Simple scoring logic based on actual interview data
    let relevantAccomplishments = 0
    let driveInitiative = 0
    let problemSolving = 0

    // Analyze conversation for engagement - count user messages
    const userMessages = data.conversation?.filter(m => m.role === 'user') || []
    const aiMessages = data.conversation?.filter(m => m.role === 'ai' || m.role === 'assistant') || []
    
    console.log('[Assessment] User messages:', userMessages.length, 'AI messages:', aiMessages.length)

    // Drive & Initiative: based on how many times candidate engaged
    if (userMessages.length > 8) {
      driveInitiative = 80
    } else if (userMessages.length > 5) {
      driveInitiative = 60
    } else if (userMessages.length > 2) {
      driveInitiative = 40
    } else if (userMessages.length > 0) {
      driveInitiative = 20
    }

    // Relevant Accomplishments: based on response length and detail
    const avgResponseLength = userMessages.reduce((sum, msg) => sum + (msg.content?.length || 0), 0) / Math.max(userMessages.length, 1)
    if (avgResponseLength > 200) {
      relevantAccomplishments = 70
    } else if (avgResponseLength > 100) {
      relevantAccomplishments = 50
    } else if (avgResponseLength > 50) {
      relevantAccomplishments = 30
    } else if (userMessages.length > 0) {
      relevantAccomplishments = 15
    }

    // Problem Solving: based on skills extracted
    if (skillsCount > 5) {
      problemSolving = 75
    } else if (skillsCount > 3) {
      problemSolving = 55
    } else if (skillsCount > 1) {
      problemSolving = 35
    } else if (skillsCount > 0) {
      problemSolving = 20
    }

    // Calculate overall job suitability
    const jobSuitability = Math.round(
      (relevantAccomplishments + driveInitiative + problemSolving) / 3
    )

    setAssessment({
      jobSuitability: jobSuitability,
      relevantAccomplishments,
      driveInitiative,
      problemSolving,
      cultureScopes: 30,
      leadershipInfluence: 25,
      userMessageCount: userMessages.length,
      skillsCount: skillsCount,
      avgResponseLength: Math.round(avgResponseLength),
      summary: generateSummary(userMessages.length, data),
      recommendation: jobSuitability > 50 ? 'Consider for Interview' : 'Do Not Hire'
    })
  }

  const generateSummary = (messageCount: number, data: Interview) => {
    if (messageCount === 0) {
      return 'Candidate ended interview immediately without engaging, demonstrating very low motivation and questionable professionalism.'
    } else if (messageCount < 3) {
      return 'Candidate showed minimal engagement during the interview with very few responses. Limited information available to assess job-related competencies.'
    } else if (messageCount < 5) {
      return 'Candidate demonstrated moderate engagement during the interview. Some substantive responses provided but needs further evaluation.'
    } else if (messageCount < 8) {
      return 'Candidate demonstrated good engagement throughout the interview with multiple thoughtful responses. Shows competency in several areas.'
    } else {
      return 'Candidate demonstrated strong engagement with consistent, detailed responses throughout the interview. Showed good understanding of role requirements and strong communication skills.'
    }
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}m ${secs}s`
  }

  const getSuitabilityColor = (score: number) => {
    if (score >= 70) return 'text-green-600'
    if (score >= 50) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getSuitabilityBg = (score: number) => {
    if (score >= 70) return 'bg-green-50'
    if (score >= 50) return 'bg-yellow-50'
    return 'bg-red-50'
  }

  const updateApplicantStatus = async (status: string) => {
    if (!applicantId) return
    try {
      setLoading(true)
      const res = await fetch('/api/applicants', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ applicantId, status })
      })
      const json = await res.json()
      if (res.ok) {
        console.log('[ApplicantDetail] Status updated to', status, json.applicant)
        // Refresh interview/applicant data
        await loadInterviewData()
      } else {
        console.error('[ApplicantDetail] Failed to update status', json)
      }
    } catch (err) {
      console.error('[ApplicantDetail] Error updating status:', err)
    } finally {
      setLoading(false)
    }
  }

  if (!mounted) return null
  // Don't render null during hydration, show loading instead
  if (!isHydrated) {
    return (
      <main className="flex h-screen bg-slate-50 overflow-hidden">
        <Sidebar role="recruiter" />
        <div className="flex-1 overflow-auto ml-64 flex items-center justify-center">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="text-slate-600 mt-4">Loading...</p>
          </div>
        </div>
      </main>
    )
  }
  if (!isAuthenticated) return null

  return (
    <main className="flex h-screen bg-slate-50 overflow-hidden">
      <Sidebar role="recruiter" />

      <div className="flex-1 overflow-auto ml-64">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-white border-b border-slate-200 shadow-sm">
          <div className="p-6">
            <DashboardBreadcrumb />
            <h1 className="text-3xl font-bold text-slate-900">
              {interview?.name || 'Loading...'}
            </h1>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 max-w-6xl">
          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <p className="text-slate-600 mt-4">Loading interview data...</p>
            </div>
          ) : noInterviewFound ? (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-8 text-center">
              <AlertCircle className="w-12 h-12 text-yellow-600 mx-auto mb-4" />
              <h2 className="text-xl font-bold text-slate-900 mb-2">No Interview Found</h2>
              <p className="text-slate-600 mb-6">This applicant has not completed an interview yet.</p>
              <button
                onClick={() => window.history.back()}
                className="inline-block px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
              >
                Go Back
              </button>
            </div>
          ) : interview ? (
            <div className="space-y-6">
              {/* Interview Info */}
              <div className="bg-white rounded-lg border border-slate-200 p-6">
                <h2 className="text-xl font-bold text-slate-900 mb-4">Interview Information</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <p className="text-sm text-slate-600">Applied For</p>
                    <p className="text-lg font-semibold text-slate-900">{interview.position}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-600">Interviewed On</p>
                    <p className="text-lg font-semibold text-slate-900">
                      {formatDate(interview.timestamp)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-600 flex items-center gap-2">
                      <Mail className="w-4 h-4" />
                      Email
                    </p>
                    <p className="text-lg font-semibold text-slate-900">{interview.email}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-600 flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      Interview Duration
                    </p>
                    <p className="text-lg font-semibold text-slate-900">
                      {formatDuration(interview.duration)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Job Suitability Score */}
              {assessment && (
                <div className={`${getSuitabilityBg(assessment.jobSuitability)} rounded-lg border border-slate-200 p-6`}>
                  <h2 className="text-xl font-bold text-slate-900 mb-4">Job Suitability</h2>
                  <div className="flex items-end gap-4">
                    <div>
                      <p className={`text-5xl font-bold ${getSuitabilityColor(assessment.jobSuitability)}`}>
                        {assessment.jobSuitability}%
                      </p>
                      <p className="text-sm text-slate-600 mt-2">{interview.duration || 0}m interview</p>
                    </div>
                    <div className="flex-1 h-2 bg-slate-200 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all ${
                          assessment.jobSuitability >= 70
                            ? 'bg-green-500'
                            : assessment.jobSuitability >= 50
                            ? 'bg-yellow-500'
                            : 'bg-red-500'
                        }`}
                        style={{ width: `${assessment.jobSuitability}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              )}

              {/* Assessment Breakdown */}
              {assessment && (
                <div className="bg-white rounded-lg border border-slate-200 p-6">
                  <h2 className="text-xl font-bold text-slate-900 mb-6">Assessment Breakdown</h2>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <p className="font-semibold text-slate-900">Relevant Accomplishments</p>
                        <span className="text-sm font-bold text-slate-900">{assessment.relevantAccomplishments}%</span>
                      </div>
                      <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-blue-500 transition-all"
                          style={{ width: `${assessment.relevantAccomplishments}%` }}
                        ></div>
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <p className="font-semibold text-slate-900">Drive & Initiative</p>
                        <span className="text-sm font-bold text-slate-900">{assessment.driveInitiative}%</span>
                      </div>
                      <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-green-500 transition-all"
                          style={{ width: `${assessment.driveInitiative}%` }}
                        ></div>
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <p className="font-semibold text-slate-900">Problem Solving</p>
                        <span className="text-sm font-bold text-slate-900">{assessment.problemSolving}%</span>
                      </div>
                      <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-purple-500 transition-all"
                          style={{ width: `${assessment.problemSolving}%` }}
                        ></div>
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <p className="font-semibold text-slate-900">Culture & Scope Fit</p>
                        <span className="text-sm font-bold text-slate-900">{assessment.cultureScopes}%</span>
                      </div>
                      <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-orange-500 transition-all"
                          style={{ width: `${assessment.cultureScopes}%` }}
                        ></div>
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <p className="font-semibold text-slate-900">Leadership & Influence</p>
                        <span className="text-sm font-bold text-slate-900">{assessment.leadershipInfluence}%</span>
                      </div>
                      <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-pink-500 transition-all"
                          style={{ width: `${assessment.leadershipInfluence}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* AI Summary */}
              {assessment && (
                <div className="bg-white rounded-lg border border-slate-200 p-6">
                  <div className="flex items-start gap-3 mb-4">
                    <AlertCircle className="w-6 h-6 text-blue-600 flex-shrink-0 mt-1" />
                    <div>
                      <h2 className="text-xl font-bold text-slate-900">AI Summary</h2>
                      <p className={`text-lg font-semibold mt-2 ${
                        assessment.jobSuitability > 50 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {assessment.recommendation}
                      </p>
                    </div>
                  </div>
                  <p className="text-slate-700 leading-relaxed">{assessment.summary}</p>
                </div>
              )}

              {/* Qualitative Assessment */}
              <div className="bg-white rounded-lg border border-slate-200 p-6">
                <h2 className="text-xl font-bold text-slate-900 mb-4">Qualitative Assessment</h2>
                <p className="text-slate-600 mb-4 text-sm">
                  Interview analysis based on conversation and engagement during the interview session.
                </p>

                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold text-slate-900 mb-2">Relevant Accomplishments</h3>
                    <p className="text-slate-700">
                      {assessment?.relevantAccomplishments === 0
                        ? 'Insufficient data - Candidate provided minimal examples of relevant accomplishments.'
                        : 'Candidate demonstrated relevant accomplishments aligned with position requirements.'}
                    </p>
                  </div>

                  <div>
                    <h3 className="font-semibold text-slate-900 mb-2">Drive & Initiative</h3>
                    <p className="text-slate-700">
                      {assessment?.driveInitiative < 30
                        ? 'Candidate demonstrated low engagement and willingness to participate in the interview.'
                        : 'Candidate showed good engagement and initiative throughout the interview.'}
                    </p>
                  </div>

                  <div>
                    <h3 className="font-semibold text-slate-900 mb-2">Problem Solving</h3>
                    <p className="text-slate-700">
                      {assessment?.problemSolving === 0
                        ? 'Insufficient data - Not enough information to assess problem-solving skills.'
                        : `Candidate demonstrated ${assessment?.problemSolving > 50 ? 'strong' : 'moderate'} problem-solving abilities.`}
                    </p>
                  </div>

                  <div>
                    <h3 className="font-semibold text-slate-900 mb-2">Areas To Explore</h3>
                    <ul className="text-slate-700 space-y-2 list-disc list-inside">
                      <li>Motivation and interest in the position</li>
                      <li>Relevant experience and background</li>
                      <li>Communication and professional conduct</li>
                      <li>Technical competencies for the role</li>
                    </ul>
                  </div>
                </div>
              </div>              {/* Action Buttons */}
              <div className="flex gap-4 items-center">
                {/* Status buttons - update applicant status */}
                <>
                  <button
                    onClick={() => updateApplicantStatus('shortlisted')}
                    disabled={loading}
                    className="px-6 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-colors disabled:opacity-60"
                  >
                    Shortlist
                  </button>
                  <button
                    onClick={() => updateApplicantStatus('rejected')}
                    disabled={loading}
                    className="px-6 py-3 bg-slate-200 text-slate-900 rounded-lg font-semibold hover:bg-slate-300 transition-colors disabled:opacity-60"
                  >
                    Reject
                  </button>
                </>
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <AlertCircle className="w-12 h-12 text-slate-400 mx-auto mb-4" />
              <p className="text-slate-600 text-lg">No interview data found</p>
            </div>
          )}
        </div>
      </div>
    </main>
  )
}
