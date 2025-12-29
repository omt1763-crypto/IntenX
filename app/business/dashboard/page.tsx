'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/context/AuthContext'
import { useSidebar } from '@/context/SidebarContext'
import Sidebar from '@/components/Sidebar'
import DashboardCard from '@/components/dashboard/DashboardCard'
import { BarChart3, Users, Briefcase, TrendingUp, Activity, ArrowUpRight, ArrowDownRight, Plus } from 'lucide-react'

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
}

interface Stats {
  totalJobs: number
  totalCandidates: number
  totalInterviews: number
  shortlisted: number
  jobPercent: number
  jobPercentDirection: 'up' | 'down' | 'none'
}

export default function BusinessDashboard() {
  const router = useRouter()
  const { user: authUser, isAuthenticated, loading: authLoading, role } = useAuth()
  const { isOpen: isSidebarOpen } = useSidebar()

  const [jobs, setJobs] = useState<Job[]>([])
  const [applicants, setApplicants] = useState<any[]>([])
  const [stats, setStats] = useState<Stats>({ 
    totalJobs: 0, 
    totalCandidates: 0, 
    totalInterviews: 0, 
    shortlisted: 0, 
    jobPercent: 0, 
    jobPercentDirection: 'none' 
  })
  const [loading, setLoading] = useState(true)
  const [mounted, setMounted] = useState(false)

  const userId = authUser?.id

  useEffect(() => {
    if (!authLoading && !userId && !isAuthenticated && !authUser) {
      router.replace('/auth/login')
    }
  }, [authLoading, userId, isAuthenticated, authUser, router])

  // Redirect if user is not a business or company
  useEffect(() => {
    if (!authLoading && role && role !== 'business' && role !== 'company') {
      console.log('[BusinessDashboard] User role is', role, ', not business/company. Redirecting to', role === 'recruiter' ? '/recruiter/dashboard' : '/auth/login')
      router.replace(role === 'recruiter' ? '/recruiter/dashboard' : '/auth/login')
    }
  }, [authLoading, role, router])

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (userId && mounted && !authLoading) {
      loadDashboard()
    }
  }, [userId, mounted, authLoading])

  const loadDashboard = async () => {
    try {
      if (!userId) return

      // Show UI immediately
      setStats(prev => ({ ...prev, totalJobs: 0, totalCandidates: 0, totalInterviews: 0, shortlisted: 0 }))
      setLoading(false)

      // Fetch jobs summary
      try {
        const res = await fetch(`/api/recruiter/jobs-summary?recruiterId=${userId}`)
        const json = await res.json()
        
        if (json && json.success && json.jobs) {
          const jobsList = json.jobs
          
          setJobs(jobsList)
          
          // Calculate total interviews from all jobs
          const totalInterviews = jobsList.reduce((sum, job) => sum + (job.interview_count || 0), 0)
          
          setStats(prev => ({
            ...prev,
            totalJobs: jobsList.length,
            totalCandidates: jobsList.reduce((sum, job) => sum + (job.applicant_count || 0), 0),
            totalInterviews: totalInterviews
          }))
          
          console.log('[BusinessDashboard] Jobs summary loaded:', {
            totalJobs: jobsList.length,
            totalCandidates: jobsList.reduce((sum, job) => sum + (job.applicant_count || 0), 0),
            totalInterviews: totalInterviews
          })
          
          // Fetch applicants
          const applicantsRes = await fetch(`/api/get-applicants?recruiterId=${userId}`)
          const applicantsJson = await applicantsRes.json()
          if (applicantsJson && applicantsJson.data) {
            setApplicants(applicantsJson.data.slice(0, 5))
          }
          
          // ALSO fetch ALL interviews (including legacy ones without job_id) to get accurate total count
          try {
            const allInterviewsRes = await fetch(`/api/get-interviews?recruiterId=${userId}`)
            const allInterviewsJson = await allInterviewsRes.json()
            if (allInterviewsJson && allInterviewsJson.data && allInterviewsJson.count) {
              console.log('[BusinessDashboard] Total interviews (including legacy):', allInterviewsJson.count)
              // Update stats with accurate interview count including legacy interviews
              setStats(prev => ({
                ...prev,
                totalInterviews: allInterviewsJson.count
              }))
            }
          } catch (err) {
            console.warn('[BusinessDashboard] Error fetching all interviews:', err)
          }
        }
      } catch (err) {
        console.warn('[BusinessDashboard] Jobs fetch error:', err)
      }

      // Calculate job percent
      try {
        const now = new Date()
        const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
        const startOfPrevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString()
        const endOfPrevMonth = startOfThisMonth

        const { count: thisMonthCount } = await supabase
          .from('jobs')
          .select('*', { count: 'exact' })
          .gte('created_at', startOfThisMonth)
          .eq('recruiter_id', userId)

        const { count: prevMonthCount } = await supabase
          .from('jobs')
          .select('*', { count: 'exact' })
          .gte('created_at', startOfPrevMonth)
          .lt('created_at', endOfPrevMonth)
          .eq('recruiter_id', userId)

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

        setStats(prev => ({ ...prev, jobPercent: percent, jobPercentDirection: direction }))
      } catch (err) {
        console.warn('[BusinessDashboard] Job percent calculation error:', err)
      }
    } catch (err) {
      console.error('[BusinessDashboard] Error:', err)
      setLoading(false)
    }
  }

  if (!mounted) {
    return null
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-white via-blue-50/30 to-purple-50/20 text-slate-900" suppressHydrationWarning>
      <Sidebar key="business-sidebar" role="company" />

      {/* Content */}
      <div className={`relative z-10 transition-all duration-300 ${isSidebarOpen ? 'ml-64' : 'ml-20'} pt-24 pb-16 min-h-screen`}>
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
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-5xl font-bold text-slate-900 mb-2">Company Hub</h1>
          <p className="text-lg text-slate-600 font-light">Manage jobs, track candidates, and conduct interviews</p>
        </div>

        {/* Header */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900">Performance Analytics</h2>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 mb-8">
          {/* Total Jobs Card with Chart */}
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
                    </div>
                  ))
                })()
              ) : (
                <div className="flex items-center justify-center w-full h-64">
                  <p className="text-gray-500">No job data</p>
                </div>
              )}
            </div>
            <button 
              onClick={() => router.push('/business/dashboard/jobs')}
              className="w-full mt-6 py-2.5 rounded-lg bg-gradient-to-r from-blue-600 to-blue-700 text-white font-medium hover:shadow-lg transition-all hover:scale-105">
              View All Jobs
            </button>
          </DashboardCard>

          {/* Total Candidates Card */}
          <DashboardCard hover gradient="purple">
            <div className="flex items-center justify-between mb-6">
              <div>
                <p className="text-sm text-gray-600 font-semibold">Total Applicants</p>
                <p className="text-4xl font-bold text-gray-900 mt-2">{stats.totalCandidates}</p>
              </div>
              <Users className="w-12 h-12 text-purple-500/20" />
            </div>
            <div className="pt-6 border-t border-gray-200/50">
              <p className="text-xs text-gray-600 mb-4">Quick Action</p>
              <button 
                onClick={() => router.push('/business/dashboard/applicants')}
                className="w-full py-2.5 rounded-lg bg-gradient-to-r from-purple-600 to-purple-700 text-white font-medium hover:shadow-lg transition-all hover:scale-105">
                View Applicants
              </button>
            </div>
          </DashboardCard>
        </div>

        {/* Second Row - Key Metrics */}
        <div className="mb-8">
          <div className="mb-4">
            <h2 className="text-2xl font-bold text-gray-900">Key Metrics</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Total Jobs Stat */}
            <DashboardCard hover>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Jobs</p>
                  <p className="text-3xl font-bold text-gray-900 mt-1">{stats.totalJobs}</p>
                </div>
                <Briefcase className="w-10 h-10 text-blue-500/20" />
              </div>
              {stats.jobPercentDirection === 'up' && (
                <p className="text-xs text-green-600 font-semibold mt-4 flex items-center gap-1">
                  <ArrowUpRight size={12} /> {stats.jobPercent}% this month
                </p>
              )}
            </DashboardCard>

            {/* Total Interviews Stat */}
            <DashboardCard hover gradient="yellow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Interviews Conducted</p>
                  <p className="text-3xl font-bold text-gray-900 mt-1">{stats.totalInterviews}</p>
                </div>
                <Activity className="w-10 h-10 text-yellow-500/20" />
              </div>
            </DashboardCard>
          </div>
        </div>

        {/* Recent Applicants Section */}
        <div className="grid grid-cols-1 gap-6 mb-12">
          <div className="relative overflow-hidden rounded-3xl backdrop-blur-xl bg-white/50 border border-white/60 shadow-lg hover:shadow-2xl transition-all duration-300 p-8">
            <div className="absolute inset-0 bg-gradient-to-br from-white to-[#f0fdf4]/30 opacity-0 hover:opacity-100 transition-opacity" />
            
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
                  <Users className="w-6 h-6 text-[#11cd68]" />
                  Recent Applicants
                </h2>
                <button 
                  onClick={() => router.push('/business/dashboard/applicants')}
                  className="text-sm text-[#11cd68] hover:text-[#0fb359] font-semibold transition-colors">
                  View All →
                </button>
              </div>

              {applicants.length > 0 ? (
                <div className="space-y-3">
                  {applicants.map((applicant) => (
                    <div key={applicant.id} className="p-4 rounded-xl bg-white/50 hover:bg-white/80 border border-white/40 hover:border-white/60 transition-all">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <p className="font-semibold text-slate-900">{applicant.first_name} {applicant.last_name}</p>
                          <p className="text-sm text-slate-600">{applicant.position_applied || applicant.jobs?.title}</p>
                        </div>
                        <span className={`text-xs font-semibold px-3 py-1 rounded-full ${
                          applicant.status === 'shortlisted' ? 'bg-green-100 text-green-800' :
                          applicant.status === 'rejected' ? 'bg-red-100 text-red-800' :
                          'bg-blue-100 text-blue-800'
                        }`}>
                          {applicant.status || 'Applied'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-slate-500">No applicants yet</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Quick Actions Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <button
            onClick={() => router.push('/business/dashboard/jobs')}
            className="group relative overflow-hidden rounded-2xl p-6 backdrop-blur-xl bg-white/50 border border-white/60 hover:border-white/80 shadow-lg hover:shadow-2xl transition-all duration-300"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-cyan-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
            <Briefcase className="w-8 h-8 text-blue-500 mb-3" />
            <h3 className="font-semibold text-slate-900 mb-1">Jobs</h3>
            <p className="text-sm text-slate-600">Manage your job postings</p>
          </button>

          <button
            onClick={() => router.push('/business/dashboard/applicants')}
            className="group relative overflow-hidden rounded-2xl p-6 backdrop-blur-xl bg-white/50 border border-white/60 hover:border-white/80 shadow-lg hover:shadow-2xl transition-all duration-300"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-emerald-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
            <Users className="w-8 h-8 text-green-500 mb-3" />
            <h3 className="font-semibold text-slate-900 mb-1">Applicants</h3>
            <p className="text-sm text-slate-600">Review candidate applications</p>
          </button>

          <button
            onClick={() => router.push('/business/dashboard/profile')}
            className="group relative overflow-hidden rounded-2xl p-6 backdrop-blur-xl bg-white/50 border border-white/60 hover:border-white/80 shadow-lg hover:shadow-2xl transition-all duration-300"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-pink-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
            <Activity className="w-8 h-8 text-purple-500 mb-3" />
            <h3 className="font-semibold text-slate-900 mb-1">Company Profile</h3>
            <p className="text-sm text-slate-600">Update company information</p>
          </button>

          <button
            onClick={() => router.push('/business/dashboard/billing')}
            className="group relative overflow-hidden rounded-2xl p-6 backdrop-blur-xl bg-white/50 border border-white/60 hover:border-white/80 shadow-lg hover:shadow-2xl transition-all duration-300"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 to-red-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
            <TrendingUp className="w-8 h-8 text-orange-500 mb-3" />
            <h3 className="font-semibold text-slate-900 mb-1">Billing</h3>
            <p className="text-sm text-slate-600">Manage your subscription</p>
          </button>
        </div>
        </>
        )}
        </div>
      </div>
    </main>
  )
}
