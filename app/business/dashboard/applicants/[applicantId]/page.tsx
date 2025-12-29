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
    // Improved quality-based scoring rubric
    let relevantAccomplishments = 0
    let driveInitiative = 0
    let problemSolving = 0

    // Extract conversation messages
    const userMessages = data.conversation?.filter(m => m.role === 'user') || []
    const aiMessages = data.conversation?.filter(m => m.role === 'ai' || m.role === 'assistant') || []
    
    const totalQuestions = aiMessages.length
    const totalResponses = userMessages.length
    const completionRate = totalQuestions > 0 ? totalResponses / totalQuestions : 0

    // Combine all user responses for analysis
    const allUserText = userMessages.map(m => m.content?.toLowerCase() || '').join(' ')
    const allText = data.conversation?.map(m => m.content?.toLowerCase() || '').join(' ') || ''

    console.log('[Assessment] Completion rate:', completionRate.toFixed(2), `(${totalResponses}/${totalQuestions})`)

    // ========================================
    // 1️⃣ DRIVE & INITIATIVE (0-60 pts)
    // ========================================
    // Based on: Response completion rate, follow-up questions, consistency
    
    let driveScore = 0

    // Completion rate (0-30 pts)
    if (completionRate >= 0.95) {
      driveScore += 30
    } else if (completionRate >= 0.80) {
      driveScore += 25
    } else if (completionRate >= 0.60) {
      driveScore += 15
    } else if (completionRate >= 0.40) {
      driveScore += 8
    }

    // Follow-up questions / deep diving (0-20 pts)
    const followUpKeywords = ['tell me more', 'can you explain', 'what about', 'how did', 'why did', 'what was', 'could you']
    const followUpCount = followUpKeywords.filter(kw => allUserText.includes(kw)).length
    if (followUpCount >= 3) {
      driveScore += 20
    } else if (followUpCount >= 2) {
      driveScore += 12
    } else if (followUpCount >= 1) {
      driveScore += 5
    }

    // Consistency of responses (0-10 pts)
    const avgResponseLength = userMessages.reduce((sum, msg) => sum + (msg.content?.length || 0), 0) / Math.max(userMessages.length, 1)
    const responseVariance = userMessages.map(m => m.content?.length || 0).filter(len => len > 0).length >= 3
    if (responseVariance && avgResponseLength > 80) {
      driveScore += 10
    }

    driveInitiative = Math.min(60, driveScore)
    console.log('[Assessment] Drive & Initiative:', driveInitiative, '/60')

    // ========================================
    // 2️⃣ RELEVANT ACCOMPLISHMENTS / EVIDENCE (0-80 pts)
    // ========================================
    // Based on: Specificity (numbers, metrics, tools), Ownership language, Concrete outcomes
    
    let accomplishmentScore = 0

    // Specificity - detection of numbers, metrics, tools (0-35 pts)
    const numberPattern = /\d+/g
    const numbersFound = (allUserText.match(numberPattern) || []).length
    if (numbersFound >= 5) {
      accomplishmentScore += 35
    } else if (numbersFound >= 3) {
      accomplishmentScore += 25
    } else if (numbersFound >= 1) {
      accomplishmentScore += 10
    }

    // Tool/framework mentions (0-20 pts)
    const toolKeywords = ['python', 'javascript', 'react', 'node', 'sql', 'mongodb', 'aws', 'docker', 'kubernetes', 'api', 'rest', 'graphql', 'typescript', 'java', 'c++', 'golang', 'rust']
    const toolsFound = toolKeywords.filter(tool => allUserText.includes(tool)).length
    if (toolsFound >= 3) {
      accomplishmentScore += 20
    } else if (toolsFound >= 2) {
      accomplishmentScore += 12
    } else if (toolsFound >= 1) {
      accomplishmentScore += 5
    }

    // Ownership language (0-15 pts)
    const ownershipPhrases = ['i built', 'i created', 'i led', 'i designed', 'i implemented', 'i developed', 'i architected', 'i launched', 'my team', 'we built']
    const ownershipMatches = ownershipPhrases.filter(phrase => allUserText.includes(phrase)).length
    if (ownershipMatches >= 3) {
      accomplishmentScore += 15
    } else if (ownershipMatches >= 2) {
      accomplishmentScore += 10
    } else if (ownershipMatches >= 1) {
      accomplishmentScore += 5
    }

    // Concrete outcomes (0-10 pts)
    const outcomeKeywords = ['result', 'impact', 'improved', 'increased', 'reduced', 'performance', 'shipped', 'launched', 'delivered']
    const outcomesFound = outcomeKeywords.filter(kw => allUserText.includes(kw)).length
    if (outcomesFound >= 3) {
      accomplishmentScore += 10
    } else if (outcomesFound >= 1) {
      accomplishmentScore += 5
    }

    relevantAccomplishments = Math.min(80, accomplishmentScore)
    console.log('[Assessment] Relevant Accomplishments:', relevantAccomplishments, '/80')

    // ========================================
    // 3️⃣ PROBLEM SOLVING / REASONING (0-90 pts)
    // ========================================
    // Based on: Clear approach/steps, Constraints/trade-offs considered, Outcome evaluation
    
    let reasoningScore = 0

    // Approach/steps mentioned (0-35 pts)
    const approachKeywords = ['first', 'then', 'next', 'after that', 'step', 'process', 'approach', 'method', 'strategy', 'started with', 'began by']
    const approachMatches = approachKeywords.filter(phrase => allUserText.includes(phrase)).length
    if (approachMatches >= 4) {
      reasoningScore += 35
    } else if (approachMatches >= 3) {
      reasoningScore += 25
    } else if (approachMatches >= 2) {
      reasoningScore += 15
    } else if (approachMatches >= 1) {
      reasoningScore += 5
    }

    // Constraints/trade-offs considered (0-30 pts)
    const constraintKeywords = ['constraint', 'trade-off', 'challenge', 'limitation', 'difficult', 'problem was', 'had to', 'instead of', 'but', 'however', 'tradeoff']
    const constraintMatches = constraintKeywords.filter(phrase => allUserText.includes(phrase)).length
    if (constraintMatches >= 4) {
      reasoningScore += 30
    } else if (constraintMatches >= 3) {
      reasoningScore += 22
    } else if (constraintMatches >= 2) {
      reasoningScore += 12
    } else if (constraintMatches >= 1) {
      reasoningScore += 5
    }

    // Outcome evaluation / reflection (0-25 pts)
    const outcomeEvalKeywords = ['learned', 'lesson', 'would do', 'in retrospect', 'could have', 'successful because', 'failed because', 'what worked', 'what didn\'t']
    const evalMatches = outcomeEvalKeywords.filter(phrase => allUserText.includes(phrase)).length
    if (evalMatches >= 3) {
      reasoningScore += 25
    } else if (evalMatches >= 2) {
      reasoningScore += 15
    } else if (evalMatches >= 1) {
      reasoningScore += 8
    }

    problemSolving = Math.min(90, reasoningScore)
    console.log('[Assessment] Problem Solving:', problemSolving, '/90')

    // Calculate overall job suitability
    const jobSuitability = Math.round(
      (relevantAccomplishments + driveInitiative + problemSolving) / 3
    )

    setAssessment({
      jobSuitability: jobSuitability,
      relevantAccomplishments,
      driveInitiative,
      problemSolving,
      cultureScopes: 60,
      leadershipInfluence: 55,
      userMessageCount: userMessages.length,
      skillsCount: data.skills?.length || 0,
      avgResponseLength: Math.round(userMessages.reduce((sum, msg) => sum + (msg.content?.length || 0), 0) / Math.max(userMessages.length, 1)),
      summary: generateSummary(driveInitiative, relevantAccomplishments, problemSolving),
      recommendation: jobSuitability >= 70 ? 'Strong Candidate' : jobSuitability >= 50 ? 'Consider for Interview' : 'Do Not Hire'
    })
  }

  const generateSummary = (drive: number, accomplishments: number, reasoning: number) => {
    const total = drive + accomplishments + reasoning
    if (total < 80) {
      return 'Candidate showed limited evidence of drive, accomplishments, and problem-solving ability. Few concrete examples or reasoning steps demonstrated.'
    } else if (total < 140) {
      return 'Candidate provided some evidence of capabilities but responses lacked depth. Limited ownership language and few specific examples with metrics.'
    } else if (total < 180) {
      return 'Candidate demonstrated solid engagement with concrete examples and some evidence of accomplishments. Good communication of experiences with room for improvement in reasoning depth.'
    } else if (total < 200) {
      return 'Candidate showed strong drive and initiative with specific, detailed examples of accomplishments. Demonstrated clear problem-solving approach and trade-off considerations.'
    } else {
      return 'Exceptional candidate with high drive, detailed accomplishment descriptions with metrics, and strong reasoning skills. Excellent understanding of constraints and clear communication.'
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
