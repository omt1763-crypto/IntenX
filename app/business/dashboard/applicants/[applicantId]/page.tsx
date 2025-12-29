'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
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
  const params = useParams()
  const { user: authUser, isAuthenticated, isHydrated } = useAuth()
  const [interview, setInterview] = useState<Interview | null>(null)
  const [loading, setLoading] = useState(true)
  const [mounted, setMounted] = useState(false)
  const [assessment, setAssessment] = useState<any>(null)
  const [noInterviewFound, setNoInterviewFound] = useState(false)

  const applicantId = params?.applicantId as string
  const userId = authUser?.id

  useEffect(() => {
    setMounted(true)
    console.log('[ApplicantDetail] Mounted with params:', params)
  }, [])

  // Load interview data as soon as we have applicantId and mounted (don't wait for auth)
  useEffect(() => {
    if (applicantId && mounted && isHydrated) {
      console.log('[ApplicantDetail] Loading interview data...')
      loadInterviewData()
    }
  }, [applicantId, isHydrated, mounted])

  // Redirect to login ONLY if auth is complete and user is not authenticated AND we've tried to load but got no data
  useEffect(() => {
    if (mounted && isHydrated && !isAuthenticated && !loading && !interview && noInterviewFound) {
      console.log('[ApplicantDetail] Not authenticated and no data available, redirecting to login')
      router.push('/auth/login')
    }
  }, [isHydrated, isAuthenticated, mounted, loading, interview, noInterviewFound])

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

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}m ${secs}s`
  }

  if (!mounted) return null
  // Don't render null during hydration, show loading instead
  if (!isHydrated) {
    return (
      <main className="flex h-screen bg-slate-50 overflow-hidden">
        <Sidebar role="company" />
        <div className="flex-1 overflow-auto ml-64 flex items-center justify-center">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="text-slate-600 mt-4">Loading...</p>
          </div>
        </div>
      </main>
    )
  }
  
  // Only redirect to login if hydration is complete AND we're not authenticated AND we don't have data
  if (isHydrated && !isAuthenticated && !interview && !loading) {
    console.log('[ApplicantDetail] Auth failed and no data loaded, redirecting to login')
    return null
  }

  return (
    <main className="flex h-screen bg-slate-50 overflow-hidden">
      <Sidebar role="company" />

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
                  <h2 className="text-xl font-bold text-slate-900 mb-4">Job Suitability Analysis</h2>
                  <div className="flex items-end gap-4">
                    <div>
                      <p className={`text-5xl font-bold ${getSuitabilityColor(assessment.jobSuitability)}`}>
                        {assessment.jobSuitability}%
                      </p>
                      <p className="text-sm text-slate-600 mt-2">{interview.duration || 0}s interview</p>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-slate-600 mb-2">Recommendation</p>
                      <p className={`text-lg font-bold ${assessment.recommendation === 'Consider for Interview' ? 'text-green-600' : 'text-red-600'}`}>
                        {assessment.recommendation}
                      </p>
                    </div>
                  </div>

                  {/* Detailed Assessment */}
                  <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-white/50 p-4 rounded-lg">
                      <p className="text-sm text-slate-600 mb-2">Relevant Accomplishments</p>
                      <p className="text-2xl font-bold text-slate-900">{assessment.relevantAccomplishments}%</p>
                    </div>
                    <div className="bg-white/50 p-4 rounded-lg">
                      <p className="text-sm text-slate-600 mb-2">Drive & Initiative</p>
                      <p className="text-2xl font-bold text-slate-900">{assessment.driveInitiative}%</p>
                    </div>
                    <div className="bg-white/50 p-4 rounded-lg">
                      <p className="text-sm text-slate-600 mb-2">Problem Solving</p>
                      <p className="text-2xl font-bold text-slate-900">{assessment.problemSolving}%</p>
                    </div>
                  </div>

                  {/* Summary */}
                  <div className="mt-6">
                    <h3 className="font-semibold text-slate-900 mb-2">Assessment Summary</h3>
                    <p className="text-slate-700">{assessment.summary}</p>
                  </div>

                  {/* Statistics */}
                  <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <p className="text-slate-600">Total Responses</p>
                      <p className="text-lg font-bold text-slate-900">{assessment.userMessageCount}</p>
                    </div>
                    <div>
                      <p className="text-slate-600">Skills Discussed</p>
                      <p className="text-lg font-bold text-slate-900">{assessment.skillsCount}</p>
                    </div>
                    <div>
                      <p className="text-slate-600">Avg Response Length</p>
                      <p className="text-lg font-bold text-slate-900">{assessment.avgResponseLength} chars</p>
                    </div>
                    <div>
                      <p className="text-slate-600">Duration</p>
                      <p className="text-lg font-bold text-slate-900">{formatDuration(interview.duration)}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-4">
                <button
                  onClick={() => updateApplicantStatus('shortlisted')}
                  className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-semibold"
                  disabled={loading}
                >
                  Shortlist Candidate
                </button>
                <button
                  onClick={() => updateApplicantStatus('rejected')}
                  className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition font-semibold"
                  disabled={loading}
                >
                  Reject Candidate
                </button>
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <AlertCircle className="w-12 h-12 text-slate-400 mx-auto mb-4" />
              <p className="text-slate-600">No data available</p>
            </div>
          )}
        </div>
      </div>
    </main>
  )
}
