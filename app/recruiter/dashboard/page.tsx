'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/context/AuthContext'
import { useSidebar } from '@/context/SidebarContext'
import Sidebar from '@/components/Sidebar'
import DashboardCard from '@/components/dashboard/DashboardCard'
import { BarChart3, Users, Briefcase, TrendingUp, Activity } from 'lucide-react'

interface Job {
  id: string
  title: string
  position?: string
  company?: string
  status: string
  created_at: string
  description?: string
  applicant_count?: number
  interview_count?: number
  _count?: { candidates: number; interviews: number }
}

interface Candidate {
  id: string
  user_id: string
  job_id: string
  status: string
  created_at: string
}

export default function RecruiterDashboard() {
  const router = useRouter()
  const { user: authUser, isAuthenticated, loading: authLoading, role } = useAuth()
  const { isOpen: isSidebarOpen } = useSidebar()

  const [jobs, setJobs] = useState<Job[]>([])
  const [applicants, setApplicants] = useState<any[]>([])
  const [stats, setStats] = useState({ 
    totalJobs: 0, 
    totalCandidates: 0, 
    totalInterviews: 0, 
    shortlisted: 0, 
    jobPercent: 0, 
    jobPercentDirection: 'none', 
    newJobsThisMonth: 0, 
    newApplicationsThisMonth: 0, 
    interviewsScheduledThisMonth: 0, 
    candidatesHiredThisMonth: 0 
  })
  const [loading, setLoading] = useState(true)
  const [mounted, setMounted] = useState(false)

  // Get current user ID from AuthContext
  const userId = authUser?.id

  console.log('[RecruiterDashboard] Rendered. authUser:', authUser?.id, 'role:', role, 'authLoading:', authLoading, 'isAuthenticated:', isAuthenticated)
  
  // Redirect if not authenticated or wrong role
  useEffect(() => {
    if (!authLoading && !userId && !isAuthenticated && !authUser) {
      console.log('[RecruiterDashboard] No authentication found, redirecting to login')
      router.replace('/auth/login')
    }
  }, [authLoading, userId, isAuthenticated, authUser, router])

  // Redirect if user is not a recruiter
  useEffect(() => {
    if (!authLoading && role && role !== 'recruiter') {
      console.log('[RecruiterDashboard] User role is', role, ', not recruiter. Redirecting to', role === 'business' ? '/business/dashboard' : '/auth/login')
      router.replace(role === 'business' ? '/business/dashboard' : '/auth/login')
    }
  }, [authLoading, role, router])

  useEffect(() => {
    setMounted(true)
  }, [])

  const loadDashboard = useCallback(async () => {
    try {
      if (!userId) return

      console.log('[RecruiterDashboard] Starting dashboard load for user:', userId)
      console.log('[RecruiterDashboard] User type:', typeof userId)
      
      // Show UI immediately with empty state (preserve percent fields)
      setStats(prev => ({ ...prev, totalJobs: 0, totalCandidates: 0, totalInterviews: 0, shortlisted: 0 }))
      setLoading(false)

      // Fetch jobs summary (same as jobs page - has applicant_count already)
      try {
        console.log('[RecruiterDashboard] Fetching jobs summary...')
        const res = await fetch(`/api/recruiter/jobs-summary?recruiterId=${userId}`)
        const json = await res.json()
        
        if (json && json.success && json.jobs) {
          const jobsList = json.jobs
          console.log('[RecruiterDashboard] Jobs summary fetched:', jobsList.length, 'jobs')
          
          setJobs(jobsList)
          setStats(prev => ({
            ...prev,
            totalJobs: jobsList.length,
            totalCandidates: jobsList.reduce((sum, job) => sum + (job.applicant_count || 0), 0),
            totalInterviews: jobsList.reduce((sum, job) => sum + (job.interview_count || 0), 0)
          }))
          
          // Fetch applicants for this recruiter
          console.log('[RecruiterDashboard] Fetching applicants...')
          const applicantsRes = await fetch(`/api/get-applicants?recruiterId=${userId}`)
          const applicantsJson = await applicantsRes.json()
          if (applicantsJson && applicantsJson.data) {
            console.log('[RecruiterDashboard] Applicants fetched:', applicantsJson.data.length)
            setApplicants(applicantsJson.data.slice(0, 5)) // Show first 5
          }
          
          console.log('[RecruiterDashboard] Dashboard jobs loaded:', jobsList.length, 'jobs')
        } else {
          console.warn('[RecruiterDashboard] Jobs summary API failed, trying fallback...')
          // Fallback to applicants endpoint if jobs-summary fails
          const res2 = await fetch(`/api/get-applicants?recruiterId=${userId}`)
          const json2 = await res2.json()
          
          if (json2 && json2.data && json2.data.length > 0) {
            // Group applicants by job
            const jobsMap: { [jobId: string]: any } = {}
            const jobApplicantCounts: { [jobId: string]: number } = {}
            
            json2.data.forEach((applicant: any) => {
              const jobId = applicant.job_id
              if (jobId && !jobsMap[jobId]) {
                const jobTitle = applicant.jobs?.title || applicant.position_applied || 'Unknown Position'
                const jobCompany = applicant.jobs?.company || 'Unknown Company'
                jobsMap[jobId] = {
                  id: applicant.jobs?.id || jobId,
                  title: jobTitle,
                  company: jobCompany,
                  status: 'open',
                  created_at: applicant.created_at,
                  applicant_count: 0,
                  interview_count: 0
                }
              }
              if (jobId) {
                jobApplicantCounts[jobId] = (jobApplicantCounts[jobId] || 0) + 1
              }
            })
            
            Object.keys(jobsMap).forEach(jobId => {
              jobsMap[jobId].applicant_count = jobApplicantCounts[jobId] || 0
            })
            
            let jobsList = Object.values(jobsMap)
            
            if (jobsList.length === 0) {
              console.log('[RecruiterDashboard] No jobs with job_id, grouping by position_applied...')
              const positionMap: { [position: string]: any } = {}
              const positionApplicantCounts: { [position: string]: number } = {}
              
              json2.data.forEach((applicant: any) => {
                const position = applicant.position_applied || 'Unknown Position'
                if (!positionMap[position]) {
                  positionMap[position] = {
                    id: position,
                    title: position,
                    company: applicant.jobs?.company || 'Unknown Company',
                    status: 'open',
                    created_at: applicant.created_at,
                    applicant_count: 0,
                    interview_count: 0
                  }
                }
                positionApplicantCounts[position] = (positionApplicantCounts[position] || 0) + 1
              })
              
              Object.keys(positionMap).forEach(position => {
                positionMap[position].applicant_count = positionApplicantCounts[position] || 0
              })
              
              jobsList = Object.values(positionMap)
            }
            
            setJobs(jobsList)
            setApplicants(json2.data.slice(0, 5))
            setStats(prev => ({
              ...prev,
              totalJobs: jobsList.length,
              totalCandidates: json2.data.length
            }))
          } else {
            setJobs([])
          }
        }
      } catch (e) {
        console.warn('[RecruiterDashboard] Jobs fetch error:', e)
        setJobs([])
      }

      // Compute job counts for this month and previous month to calculate percent change
      const computeJobPercent = async () => {
        try {
          const now = new Date()
          const startOfThisMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)).toISOString()
          const startOfPrevMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1)).toISOString()
          const startOfThisMonthDate = new Date(startOfThisMonth)
          const startOfNextMonthDate = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1))

          // Count jobs created this month
          const { count: thisMonthCount, error: thisErr } = await supabase
            .from('jobs')
            .select('*', { count: 'exact' })
            .gte('created_at', startOfThisMonth)
            .lt('created_at', startOfNextMonthDate.toISOString())
            .eq('recruiter_id', userId)

          if (thisErr) {
            console.warn('[RecruiterDashboard] Error counting this month jobs:', thisErr)
          }

          // Count jobs created previous month
          const { count: prevMonthCount, error: prevErr } = await supabase
            .from('jobs')
            .select('*', { count: 'exact' })
            .gte('created_at', startOfPrevMonth)
            .lt('created_at', startOfThisMonth)
            .eq('recruiter_id', userId)

          if (prevErr) {
            console.warn('[RecruiterDashboard] Error counting previous month jobs:', prevErr)
          }

          const tCount = thisMonthCount || 0
          const pCount = prevMonthCount || 0
          let percent = 0
          let direction: 'up' | 'down' | 'none' = 'none'
          if (pCount === 0 && tCount > 0) {
            percent = 100
            direction = 'up'
          } else if (pCount === 0 && tCount === 0) {
            percent = 0
            direction = 'none'
          } else {
            percent = Math.round(((tCount - pCount) / Math.max(1, pCount)) * 100)
            direction = percent > 0 ? 'up' : percent < 0 ? 'down' : 'none'
          }

          setStats(prev => ({ ...prev, totalJobs: prev.totalJobs || tCount, jobPercent: percent, jobPercentDirection: direction, newJobsThisMonth: tCount }))
          console.log('[RecruiterDashboard] Job percent calc:', { thisMonth: tCount, prevMonth: pCount, percent, direction })
        } catch (err) {
          console.warn('[RecruiterDashboard] computeJobPercent error:', err)
        }
      }

      await computeJobPercent()
    } catch (err) {
      console.error('[RecruiterDashboard] Error:', err)
      setLoading(false)
    }
  }, [userId])

  useEffect(() => {
    console.log('[RecruiterDashboard] Data load effect. userId:', userId, 'mounted:', mounted, 'authLoading:', authLoading)
    if (userId && mounted && !authLoading) {
      console.log('[RecruiterDashboard] Loading dashboard for user:', userId)
      loadDashboard()
    } else if (mounted && !authLoading && !userId) {
      console.log('[RecruiterDashboard] No user found, checking auth status')
      setLoading(false)
    }
  }, [userId, mounted, authLoading])

  if (!mounted) {
    return null
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-white via-blue-50/30 to-purple-50/20 text-slate-900" suppressHydrationWarning>
      {/* Sidebar - Always visible */}
      <Sidebar key="recruiter-sidebar" role="recruiter" />

      {/* Premium Background with Glow Effects */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-white via-blue-50/30 to-purple-50/20" />
        
        {/* Glow Blob 1 - Blue */}
        <div className="absolute top-20 right-1/3 w-[600px] h-[600px] bg-gradient-to-br from-blue-300/40 via-blue-200/20 to-transparent rounded-full blur-3xl opacity-40 animate-pulse" style={{ animation: 'pulse 8s ease-in-out infinite' }} />
        
        {/* Glow Blob 2 - Purple */}
        <div className="absolute bottom-1/4 left-1/4 w-[500px] h-[500px] bg-gradient-to-br from-purple-300/30 via-purple-200/15 to-transparent rounded-full blur-3xl opacity-30 animate-pulse" style={{ animation: 'pulse 10s ease-in-out infinite 2s' }} />
        
        {/* Glow Blob 3 - Cyan */}
        <div className="absolute top-1/2 right-0 w-[400px] h-[400px] bg-gradient-to-br from-cyan-300/30 via-cyan-200/15 to-transparent rounded-full blur-3xl opacity-25" />
      </div>

      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-40 border-b border-white/40 bg-white/60 backdrop-blur-2xl transition-all duration-300 lg:left-64">
        <div className="mx-auto px-4 md:px-6 lg:px-8 py-3 flex justify-between items-center relative z-10">
          <div className="flex items-center gap-3">
            <span className="text-lg font-bold text-slate-900">Dashboard</span>
          </div>
          <button
            onClick={() => router.push('/recruiter/dashboard/jobs')}
            className="flex items-center gap-2 px-6 py-2 backdrop-blur-xl bg-gradient-to-r from-blue-600 to-blue-700 border border-blue-500 hover:border-blue-400 text-white rounded-2xl hover:shadow-lg hover:shadow-blue-600/40 hover:from-blue-700 hover:to-blue-800 transition-all font-semibold text-sm hover:scale-105"
          >
            <TrendingUp size={18} />
            Create Job
          </button>
        </div>
      </nav>

      {/* Content */}
      <div className={`relative z-10 transition-all duration-300 ${isSidebarOpen ? 'lg:ml-64' : 'lg:ml-20'} pt-24 pb-16 min-h-screen`}>
        <div className="w-full px-8 lg:px-12">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <p className="text-slate-600 text-lg">Loading dashboard...</p>
            </div>
          ) : !userId && !isAuthenticated ? (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-8">
              <p className="text-yellow-800">Please <a href="/auth/login" className="font-semibold underline">log in</a> to access the dashboard.</p>
            </div>
          ) : (
            <>
              {/* Performance Analytics - Top */}
              <div className="mb-8">
                <div className="mb-4">
                  <h2 className="text-2xl font-bold text-gray-900">Performance Analytics</h2>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                  {/* Jobs Trend Chart */}
                  <DashboardCard hover>
                    <div className="mb-8">
                      <h3 className="text-xl font-bold text-gray-900">Jobs Posted Trend</h3>
                      <p className="text-xs text-gray-600 mt-2">Last 7 days</p>
                    </div>
                    <div className="h-80 flex items-end justify-between gap-4 px-6 py-6 bg-gray-50 rounded-lg">
                      {jobs.length > 0 ? (
                        (() => {
                          const last7Days = Array.from({ length: 7 }, (_, i) => {
                            const date = new Date()
                            date.setDate(date.getDate() - (6 - i))
                            return date.toDateString()
                          })
                          const jobCounts = last7Days.map(date => 
                            jobs.filter(job => new Date(job.created_at).toDateString() === date).length
                          )
                          const maxCount = Math.max(...jobCounts, 1)
                          return jobCounts.map((count, i) => (
                            <div key={i} className="flex-1 flex flex-col items-center gap-3 group">
                              <div className="w-full h-full bg-gradient-to-t from-blue-500 to-blue-400 rounded-lg shadow-md hover:shadow-lg transition group-hover:from-blue-600 group-hover:to-blue-500" style={{ height: `${(count / maxCount) * 240}px` }}></div>
                              <span className="text-xs text-gray-600 font-semibold">{['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][i]}</span>
                              <span className="text-xs text-gray-700 font-bold">{count}</span>
                            </div>
                          ))
                        })()
                      ) : (
                        <div className="w-full flex items-center justify-center text-gray-500">No job data</div>
                      )}
                    </div>
                    <div className="mt-8 pt-8 border-t border-gray-200 grid grid-cols-3 gap-4">
                      <div>
                        <p className="text-xs text-gray-600">Total</p>
                        <p className="text-2xl font-bold text-blue-600 mt-2">{stats.totalJobs}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-600">This Month</p>
                        <p className="text-2xl font-bold text-green-600 mt-2">+{stats.newJobsThisMonth}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-600">Change</p>
                        <p className={`text-2xl font-bold mt-2 ${stats.jobPercentDirection === 'up' ? 'text-green-600' : stats.jobPercentDirection === 'down' ? 'text-red-600' : 'text-gray-600'}`}>
                          {stats.jobPercentDirection === 'up' ? '↑' : stats.jobPercentDirection === 'down' ? '↓' : '→'} {stats.jobPercent}%
                        </p>
                      </div>
                    </div>
                  </DashboardCard>

                  {/* Candidates Trend Chart */}
                  <DashboardCard hover>
                    <div className="mb-8">
                      <h3 className="text-xl font-bold text-gray-900">Candidates Pipeline</h3>
                      <p className="text-xs text-gray-600 mt-2">Application status breakdown</p>
                    </div>
                    <div className="space-y-6">
                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-sm font-semibold text-gray-700">Total Applications</span>
                          <span className="text-sm font-bold text-gray-900">{stats.totalCandidates}</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-3">
                          <div className="bg-gradient-to-r from-purple-500 to-purple-400 h-3 rounded-full" style={{ width: '100%' }}></div>
                        </div>
                      </div>
                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-sm font-semibold text-gray-700">Under Review</span>
                          <span className="text-sm font-bold text-gray-900">{Math.floor(stats.totalCandidates * 0.4)}</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-3">
                          <div className="bg-gradient-to-r from-yellow-500 to-yellow-400 h-3 rounded-full" style={{ width: '40%' }}></div>
                        </div>
                      </div>
                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-sm font-semibold text-gray-700">Shortlisted</span>
                          <span className="text-sm font-bold text-gray-900">{stats.shortlisted}</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-3">
                          <div className="bg-gradient-to-r from-blue-500 to-blue-400 h-3 rounded-full" style={{ width: `${stats.totalCandidates > 0 ? (stats.shortlisted / stats.totalCandidates) * 100 : 0}%` }}></div>
                        </div>
                      </div>
                    </div>
                    <div className="mt-8 pt-8 border-t border-gray-200">
                      <p className="text-xs text-gray-600">New Applications</p>
                      <p className="text-3xl font-bold text-gray-900 mt-3">{stats.newApplicationsThisMonth}</p>
                    </div>
                  </DashboardCard>

                  {/* Interviews Chart */}
                  <DashboardCard hover>
                    <div className="mb-10">
                      <h3 className="text-xl font-bold text-gray-900">Interview Schedule</h3>
                      <p className="text-xs text-gray-600 mt-2">Upcoming interviews</p>
                    </div>
                    <div className="space-y-8">
                      <div>
                        <div className="flex items-center justify-between mb-4">
                          <span className="text-sm font-semibold text-gray-700">Total Interviews</span>
                          <span className="text-lg font-bold text-green-600">{stats.totalInterviews}</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-4">
                          <div className="bg-gradient-to-r from-green-500 to-green-400 h-4 rounded-full transition-all" style={{ width: '100%' }}></div>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-6 pt-6 border-t border-gray-200">
                        <div className="bg-gradient-to-br from-blue-50 to-blue-100/50 rounded-lg p-6 border border-blue-200">
                          <p className="text-xs text-gray-600 font-semibold">Scheduled</p>
                          <p className="text-4xl font-bold text-blue-600 mt-3">{stats.interviewsScheduledThisMonth}</p>
                        </div>
                        <div className="bg-gradient-to-br from-green-50 to-green-100/50 rounded-lg p-6 border border-green-200">
                          <p className="text-xs text-gray-600 font-semibold">Completed</p>
                          <p className="text-4xl font-bold text-green-600 mt-3">{stats.totalInterviews - stats.interviewsScheduledThisMonth}</p>
                        </div>
                      </div>
                    </div>
                  </DashboardCard>

                  {/* Hiring Chart */}
                  <DashboardCard hover>
                    <div className="mb-10">
                      <h3 className="text-xl font-bold text-gray-900">Hiring Summary</h3>
                      <p className="text-xs text-gray-600 mt-2">This month's progress</p>
                    </div>
                    <div className="space-y-6">
                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-sm font-semibold text-gray-700">Candidates Hired</span>
                          <span className="text-sm font-bold text-gray-900">{stats.candidatesHiredThisMonth}</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-3">
                          <div className="bg-gradient-to-r from-green-500 to-green-400 h-3 rounded-full" style={{ width: `${Math.min(stats.candidatesHiredThisMonth * 25, 100)}%` }}></div>
                        </div>
                      </div>
                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-sm font-semibold text-gray-700">Jobs Posted</span>
                          <span className="text-sm font-bold text-gray-900">{stats.newJobsThisMonth}</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-3">
                          <div className="bg-gradient-to-r from-blue-500 to-blue-400 h-3 rounded-full" style={{ width: `${Math.min(stats.newJobsThisMonth * 25, 100)}%` }}></div>
                        </div>
                      </div>
                    </div>
                    <div className="mt-8 pt-8 border-t border-gray-200 grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs text-gray-600">Conversion</p>
                        <p className="text-2xl font-bold text-gray-900 mt-2">{stats.totalCandidates > 0 ? ((stats.shortlisted / stats.totalCandidates) * 100).toFixed(1) : 0}%</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-600">Success Rate</p>
                        <p className="text-2xl font-bold text-green-600 mt-2">{stats.candidatesHiredThisMonth > 0 ? Math.floor((stats.candidatesHiredThisMonth / stats.newJobsThisMonth) * 100) : 0}%</p>
                      </div>
                    </div>
                  </DashboardCard>
                </div>
              </div>

              {/* Key Metrics */}
              <div className="mb-16">
                <div className="mb-10">
                  <h2 className="text-3xl font-bold text-gray-900">Key Metrics</h2>
                  <p className="text-gray-600 text-sm mt-3">Overview of your recruitment activity</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                  {/* Total Jobs Card */}
                  <DashboardCard gradient="blue" hover>
                    <div className="flex items-start justify-between mb-8">
                      <div>
                        <p className="text-gray-700 text-sm font-semibold">Total Jobs Posted</p>
                      </div>
                      <div className="w-14 h-14 bg-blue-300 rounded-xl flex items-center justify-center">
                        <Briefcase size={32} className="text-blue-700" />
                      </div>
                    </div>
                    <p className="text-5xl font-bold text-gray-900 mb-3">{stats.totalJobs}</p>
                    <p className="text-xs text-gray-600">active job postings</p>
                    <div className="mt-8 pt-8 border-t border-gray-200">
                      <div className="flex items-center gap-2 text-green-600 text-xs font-semibold">
                        <TrendingUp size={16} />
                        <span>{stats.jobPercentDirection === 'up' ? '↑' : stats.jobPercentDirection === 'down' ? '↓' : '→'} {stats.jobPercent}% this month</span>
                      </div>
                    </div>
                  </DashboardCard>

                  {/* Total Candidates Card */}
                  <DashboardCard gradient="purple" hover>
                    <div className="flex items-start justify-between mb-8">
                      <div>
                        <p className="text-gray-700 text-sm font-semibold">Total Candidates</p>
                      </div>
                      <div className="w-14 h-14 bg-purple-300 rounded-xl flex items-center justify-center">
                        <Users size={32} className="text-purple-700" />
                      </div>
                    </div>
                    <p className="text-5xl font-bold text-gray-900 mb-3">{stats.totalCandidates}</p>
                    <p className="text-xs text-gray-600">total applications</p>
                    <div className="mt-8 pt-8 border-t border-gray-200">
                      <div className="flex items-center gap-2 text-green-600 text-xs font-semibold">
                        <TrendingUp size={16} />
                        <span>+{stats.newApplicationsThisMonth} this month</span>
                      </div>
                    </div>
                  </DashboardCard>

                  {/* Total Interviews Card */}
                  <DashboardCard gradient="yellow" hover>
                    <div className="flex items-start justify-between mb-8">
                      <div>
                        <p className="text-gray-700 text-sm font-semibold">Total Interviews</p>
                      </div>
                      <div className="w-14 h-14 bg-yellow-300 rounded-xl flex items-center justify-center">
                        <BarChart3 size={32} className="text-yellow-700" />
                      </div>
                    </div>
                    <p className="text-5xl font-bold text-gray-900 mb-3">{stats.totalInterviews}</p>
                    <p className="text-xs text-gray-600">conducted</p>
                    <div className="mt-8 pt-8 border-t border-gray-200">
                      <div className="flex items-center gap-2 text-green-600 text-xs font-semibold">
                        <TrendingUp size={16} />
                        <span>+{stats.interviewsScheduledThisMonth} scheduled</span>
                      </div>
                    </div>
                  </DashboardCard>

                  {/* Shortlisted Card */}
                  <DashboardCard gradient="pink" hover>
                    <div className="flex items-start justify-between mb-8">
                      <div>
                        <p className="text-gray-700 text-sm font-semibold">Shortlisted</p>
                      </div>
                      <div className="w-14 h-14 bg-pink-300 rounded-xl flex items-center justify-center">
                        <Activity size={32} className="text-pink-700" />
                      </div>
                    </div>
                    <p className="text-5xl font-bold text-gray-900 mb-3">{stats.shortlisted}</p>
                    <p className="text-xs text-gray-600">candidates</p>
                    <div className="mt-8 pt-8 border-t border-gray-200">
                      <div className="flex items-center gap-2 text-green-600 text-xs font-semibold">
                        <TrendingUp size={16} />
                        <span>+{stats.candidatesHiredThisMonth} hired</span>
                      </div>
                    </div>
                  </DashboardCard>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="mb-8">
                <button 
                  onClick={() => router.push('/recruiter/dashboard/jobs')}
                  className="flex items-center gap-2 px-8 py-3 backdrop-blur-xl bg-gradient-to-r from-blue-600 to-blue-700 border border-blue-500 hover:border-blue-400 text-white rounded-xl hover:shadow-lg hover:shadow-blue-600/40 hover:from-blue-700 hover:to-blue-800 transition-all font-semibold text-sm hover:scale-105"
                >
                  <TrendingUp size={18} />
                  Create New Job
                </button>
              </div>

              {/* Jobs Section */}
              <div className="relative overflow-hidden rounded-3xl p-8 backdrop-blur-2xl bg-white/50 border border-white/60 shadow-xl mb-12">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-purple-500/5 opacity-50" />
                <div className="absolute -top-1/2 -right-1/2 w-[600px] h-[600px] bg-gradient-to-br from-blue-200/30 to-purple-200/20 rounded-full blur-3xl opacity-0 hover:opacity-40 transition-opacity duration-500" />
                <div className="relative z-10 mb-8 flex items-center justify-between">
                  <div>
                    <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Your Jobs</h2>
                    <p className="text-slate-600 text-sm mt-1">Manage your active job postings</p>
                  </div>
                  <button
                    onClick={() => router.push('/recruiter/dashboard/jobs')}
                    className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl font-semibold hover:shadow-lg hover:shadow-blue-600/40 transition-all hover:scale-105"
                  >
                    View All Jobs →
                  </button>
                </div>

                {loading ? (
                  <div className="text-center py-12">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    <p className="text-slate-600 mt-3">Loading jobs...</p>
                  </div>
                ) : jobs.length === 0 ? (
                  <div className="text-center py-16">
                    <div className="flex justify-center mb-4">
                      <div className="bg-gradient-to-br from-blue-400/20 to-blue-300/10 backdrop-blur-lg rounded-full p-4 border border-blue-300/30">
                        <Briefcase className="text-blue-600" size={48} />
                      </div>
                    </div>
                    <p className="text-slate-700 font-semibold mb-2 text-lg">No jobs posted yet</p>
                    <p className="text-slate-500 text-sm mb-6">Create your first job posting to start recruiting</p>
                    <button
                      onClick={() => {
                        console.log('[Dashboard] Create Job button clicked')
                        router.push('/recruiter/dashboard/jobs')
                      }}
                      className="relative z-20 px-8 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-2xl hover:shadow-lg hover:shadow-blue-600/40 transition-all font-semibold hover:scale-105 cursor-pointer"
                    >
                      Create Job
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {jobs.slice(0, 6).map(job => (
                      <div
                        key={job.id}
                        onClick={() => router.push(`/recruiter/dashboard/applicants?jobId=${job.id}`)}
                        className="group relative overflow-hidden rounded-2xl p-6 backdrop-blur-lg bg-gradient-to-br from-white/80 to-white/40 border border-white/60 hover:border-blue-400/80 cursor-pointer hover:shadow-xl transition-all duration-300 hover:-translate-y-2"
                      >
                        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-purple-500/10 to-pink-500/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                        <div className="absolute -top-32 -right-32 w-64 h-64 bg-gradient-to-br from-blue-300/40 to-purple-300/30 rounded-full blur-3xl opacity-0 group-hover:opacity-50 transition-opacity duration-500" />
                        
                        <div className="relative z-10">
                          {/* Header with Title and Status Badge */}
                          <div className="flex justify-between items-start gap-3 mb-4">
                            <div className="flex-1 min-w-0">
                              <h3 className="text-base font-bold text-slate-900 group-hover:text-blue-600 transition-all truncate">{job.title || 'Untitled Position'}</h3>
                              <p className="text-xs text-slate-600 mt-1 font-medium">{job.company || 'Unknown Company'}</p>
                            </div>
                            <span className={`px-2 py-1 rounded-full text-xs font-bold whitespace-nowrap flex-shrink-0 ${
                              job.status === 'open' || job.status === 'active'
                                ? 'bg-emerald-100 text-emerald-700'
                                : job.status === 'closed'
                                ? 'bg-red-100 text-red-700'
                                : 'bg-blue-100 text-blue-700'
                            }`}>
                              {(job.status || 'active').charAt(0).toUpperCase() + (job.status || 'active').slice(1)}
                            </span>
                          </div>
                          {/* Stats Grid */}
                          <div className="grid grid-cols-2 gap-3 py-4 border-y border-slate-200/50">
                            <div className="text-center">
                              <p className="text-2xl font-bold text-blue-600">{job.applicant_count || 0}</p>
                              <p className="text-xs text-slate-600 mt-1">Applications</p>
                            </div>
                            <div className="text-center border-l border-slate-200/50">
                              <p className="text-2xl font-bold text-purple-600">{job.interview_count || 0}</p>
                              <p className="text-xs text-slate-600 mt-1">Interviews</p>
                            </div>
                          </div>

                          {/* Footer with Date and Action */}
                          <div className="mt-4">
                            <p className="text-xs text-slate-500 mb-3">Posted: {new Date(job.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                            <button 
                              onClick={(e) => {
                                e.stopPropagation()
                                router.push(`/recruiter/dashboard/applicants?jobId=${job.id}`)
                              }}
                              className="w-full px-3 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white text-sm rounded-lg font-semibold hover:from-blue-700 hover:to-blue-800 transition-all shadow-md hover:shadow-lg opacity-0 group-hover:opacity-100"
                            >
                              View Applicants
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Applicants Section */}
              <div id="applicants-section" className="relative overflow-hidden rounded-3xl p-8 backdrop-blur-2xl bg-white/50 border border-white/60 shadow-xl">
                <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-blue-500/5 opacity-50" />
                <div className="absolute -bottom-1/2 -left-1/2 w-[600px] h-[600px] bg-gradient-to-br from-cyan-200/30 to-blue-200/20 rounded-full blur-3xl opacity-0 hover:opacity-40 transition-opacity duration-500" />
                
                <div className="relative z-10 mb-8 flex items-center justify-between">
                  <div>
                    <h2 className="text-3xl font-bold bg-gradient-to-r from-cyan-600 to-blue-600 bg-clip-text text-transparent">Applicants</h2>
                    <p className="text-slate-600 text-sm mt-2">All candidates who applied for your jobs</p>
                  </div>
                  {applicants.length > 0 && (
                    <button
                      onClick={() => router.push('/recruiter/dashboard/applicants')}
                      className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-2xl font-semibold hover:shadow-lg hover:shadow-blue-600/40 transition-all hover:scale-105"
                    >
                      View All ({applicants.length})
                    </button>
                  )}
                </div>

                {loading ? (
                  <p className="text-slate-600">Loading applicants...</p>
                ) : applicants.length === 0 ? (
                  <div className="text-center py-16">
                    <div className="flex justify-center mb-4">
                      <div className="bg-gradient-to-br from-cyan-400/20 to-cyan-300/10 backdrop-blur-lg rounded-full p-4 border border-cyan-300/30">
                        <Users className="text-cyan-600" size={48} />
                      </div>
                    </div>
                    <p className="text-slate-700 font-semibold mb-2 text-lg">No applicants yet</p>
                    <p className="text-slate-500 text-sm">Share your job links with candidates to receive applications</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto rounded-2xl border border-white/40 backdrop-blur-lg bg-white/30">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-white/40 bg-gradient-to-r from-white/40 to-white/20">
                          <th className="text-left py-4 px-6 font-bold text-slate-700 text-sm">Name</th>
                          <th className="text-left py-4 px-6 font-bold text-slate-700 text-sm">Email</th>
                          <th className="text-left py-4 px-6 font-bold text-slate-700 text-sm">Position Applied</th>
                          <th className="text-left py-4 px-6 font-bold text-slate-700 text-sm">Applied On</th>
                        </tr>
                      </thead>
                      <tbody>
                        {applicants.map((applicant, idx) => (
                          <tr key={applicant.id} className={`border-b border-white/30 hover:bg-white/30 transition-colors ${idx % 2 === 0 ? 'bg-white/10' : 'bg-white/5'}`}>
                            <td className="py-4 px-6 text-slate-900 font-semibold">{applicant.name}</td>
                            <td className="py-4 px-6 text-slate-600 text-sm">{applicant.email}</td>
                            <td className="py-4 px-6 text-slate-600">{applicant.position_applied}</td>
                            <td className="py-4 px-6 text-slate-500 text-sm">
                              {new Date(applicant.created_at).toLocaleDateString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 0.6; }
          50% { opacity: 0.3; }
        }
        
        @keyframes glow {
          0%, 100% { 
            box-shadow: 0 0 20px rgba(59, 130, 246, 0.5), 0 8px 32px rgba(0, 0, 0, 0.1);
          }
          50% { 
            box-shadow: 0 0 40px rgba(139, 92, 246, 0.6), 0 8px 32px rgba(0, 0, 0, 0.15);
          }
        }
        
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }
        
        .hover\:scale-102:hover {
          transform: scale(1.02);
        }
      `}</style>
    </main>
  )
}