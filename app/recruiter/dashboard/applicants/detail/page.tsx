'use client'

import { Suspense } from 'react'
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

function ApplicantDetailPageContent() {
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

  // Load interview data as soon as we have applicantId and mounted (don't wait for auth)
  useEffect(() => {
    if (applicantId && mounted && isHydrated) {
      console.log('[ApplicantDetail] Loading interview data...')
      loadInterviewData()
    }
  }, [applicantId, isHydrated, mounted])

  // Redirect to login ONLY if we're 100% sure user is not authenticated
  // If authUser exists, user is authenticated even if isAuthenticated flag is temporarily false
  useEffect(() => {
    if (mounted && isHydrated && !authUser && !loading && !interview && noInterviewFound) {
      console.log('[ApplicantDetail] No authUser and no data available, redirecting to login')
      router.push('/auth/login')
    }
  }, [isHydrated, authUser, mounted, loading, interview, noInterviewFound])

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
    // Improved scoring based on quality, not just quantity
    const userMessages = data.conversation?.filter(m => m.role === 'user') || []
    const skillsCount = data.skills?.length || 0

    console.log('[Assessment] Analyzing', userMessages.length, 'user messages with', skillsCount, 'skills')

    let driveInitiative = 0
    let relevantAccomplishments = 0
    let problemSolving = 0

    // ═══════════════════════════════════════════════════════════════════════
    // 1️⃣ DRIVE & INITIATIVE (0-60 pts)
    // Measures: Response completion, follow-ups, consistency
    // ═══════════════════════════════════════════════════════════════════════
    
    const totalQuestions = data.conversation?.filter(m => m.role === 'ai' || m.role === 'assistant')?.length || 1
    const responseCompletionRate = (userMessages.length / Math.max(totalQuestions, 1)) * 100
    
    // Response completion rate: how many questions did they answer?
    if (responseCompletionRate >= 90) {
      driveInitiative += 20  // Completed all/almost all questions
    } else if (responseCompletionRate >= 70) {
      driveInitiative += 15
    } else if (responseCompletionRate >= 50) {
      driveInitiative += 10
    }

    // Follow-up questions: did candidate ask clarifying questions?
    const askedFollowUps = userMessages.some(m => 
      m.content?.toLowerCase().includes('?') && 
      m.content?.toLowerCase().includes('what') || 
      m.content?.toLowerCase().includes('how')
    ) ? 20 : 0
    driveInitiative += askedFollowUps

    // Consistency: do responses maintain quality throughout?
    const avgLength = userMessages.reduce((sum, msg) => sum + (msg.content?.length || 0), 0) / Math.max(userMessages.length, 1)
    const responses = userMessages.map(m => m.content?.length || 0)
    const consistency = responses.length > 0 && responses.every(len => len > 50) ? 20 : 10
    driveInitiative += consistency

    driveInitiative = Math.min(60, driveInitiative)

    // ═══════════════════════════════════════════════════════════════════════
    // 2️⃣ RELEVANT ACCOMPLISHMENTS / EVIDENCE SCORE (0-80 pts)
    // Measures: Specificity, real examples, ownership language
    // ═══════════════════════════════════════════════════════════════════════
    
    let evidenceScore = 0

    userMessages.forEach(msg => {
      const content = msg.content?.toLowerCase() || ''
      
      // Specificity: numbers, metrics, tools mentioned
      const hasNumbers = /\d+/.test(content) ? 5 : 0
      const hasMetrics = ['improve', 'increase', 'decrease', 'reduce', '%', 'faster', 'scale'].some(word => content.includes(word)) ? 5 : 0
      const hasTools = ['python', 'javascript', 'react', 'node', 'sql', 'api', 'database', 'framework', 'library'].some(tool => content.includes(tool)) ? 5 : 0
      
      evidenceScore += hasNumbers + hasMetrics + hasTools

      // Real examples: ownership language
      const hasOwnershipLanguage = ['i built', 'i created', 'i led', 'i designed', 'i developed', 'i implemented', 'i decided', 'i improved'].some(phrase => content.includes(phrase)) ? 10 : 0
      evidenceScore += hasOwnershipLanguage

      // Concrete outcomes
      const hasOutcomes = ['result', 'achieved', 'completed', 'delivered', 'impact', 'outcome', 'delivered'].some(word => content.includes(word)) ? 5 : 0
      evidenceScore += hasOutcomes
    })

    relevantAccomplishments = Math.min(80, evidenceScore)

    // ═══════════════════════════════════════════════════════════════════════
    // 3️⃣ PROBLEM SOLVING → REASONING SCORE (0-90 pts)
    // Measures: Reasoning steps, trade-offs, problem breakdown
    // ═══════════════════════════════════════════════════════════════════════
    
    let reasoningScore = 0

    userMessages.forEach(msg => {
      const content = msg.content?.toLowerCase() || ''
      
      // Clear approach: step-by-step thinking
      const hasApproach = ['first', 'then', 'next', 'step', 'process', 'approach', 'method'].some(word => content.includes(word)) ? 30 : 0
      reasoningScore += hasApproach

      // Constraints considered: trade-offs, limitations
      const hasConstraints = ['trade-off', 'tradeoff', 'consider', 'limitation', 'constraint', 'challenge', 'however', 'but', 'although'].some(word => content.includes(word)) ? 30 : 0
      reasoningScore += hasConstraints

      // Outcome evaluated: reflection, lessons learned
      const hasOutcomeEval = ['learned', 'realized', 'discovered', 'improved', 'better', 'success', 'failed', 'lesson', 'outcome'].some(word => content.includes(word)) ? 30 : 0
      reasoningScore += hasOutcomeEval
    })

    // Bonus: explicit skill mentions show technical depth
    if (skillsCount > 3) {
      reasoningScore += Math.min(30, skillsCount * 5)
    }

    problemSolving = Math.min(90, reasoningScore)

    console.log('[Assessment] Scores:', { driveInitiative, relevantAccomplishments, problemSolving })

    // Calculate overall job suitability
    const jobSuitability = Math.round(
      (relevantAccomplishments + driveInitiative + problemSolving) / 3
    )

    const summary = generateSummary(userMessages.length, data)

    setAssessment({
      jobSuitability: jobSuitability,
      relevantAccomplishments,
      driveInitiative,
      problemSolving,
      cultureScopes: 60,
      leadershipInfluence: 55,
      userMessageCount: userMessages.length,
      skillsCount: skillsCount,
      summary: summary,
      recommendation: jobSuitability > 60 ? 'Consider for Interview' : 'Do Not Hire'
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
  
  // Only redirect to login if hydration is complete AND we're not authenticated AND we don't have data
  if (isHydrated && !isAuthenticated && !interview && !loading) {
    console.log('[ApplicantDetail] Auth failed and no data loaded, redirecting to login')
    return null
  }

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

export default function ApplicantDetailPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-900 flex items-center justify-center"><p className="text-white">Loading...</p></div>}>
      <ApplicantDetailPageContent />
    </Suspense>
  )
}
