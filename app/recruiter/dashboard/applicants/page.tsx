'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { useSidebar } from '@/context/SidebarContext'
import Sidebar from '@/components/Sidebar'
import { Users, ArrowLeft, Mail, Calendar, CheckCircle2, Clock, XCircle, ChevronDown, ChevronUp, Search, Filter, FileText, Briefcase, TrendingUp } from 'lucide-react'

interface Applicant {
  id: string
  name: string
  email: string
  position_applied: string
  status: string
  created_at: string
  job_id: string
  jobs?: {
    id: string
    title: string
    company: string
  }
}

interface JobGroup {
  job: {
    id: string
    title: string
    company: string
  }
  applicants: Applicant[]
  expanded: boolean
}

export default function ApplicantsPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user: authUser, isAuthenticated, isHydrated } = useAuth()
  const { isOpen: isSidebarOpen } = useSidebar()
  const [applicants, setApplicants] = useState<Applicant[]>([])
  const [jobGroups, setJobGroups] = useState<JobGroup[]>([])
  const [loading, setLoading] = useState(true)
  const [mounted, setMounted] = useState(false)
  const [expandedJobs, setExpandedJobs] = useState<Set<string>>(new Set())
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [redirectAttempted, setRedirectAttempted] = useState(false)

  const userId = authUser?.id
  const filterJobId = searchParams.get('jobId')

  useEffect(() => {
    setMounted(true)
  }, [])

  // Redirect to login ONLY if we're 100% sure user is not authenticated
  // Use authUser as the source of truth - if authUser exists, they're logged in
  // Don't redirect if we have cached auth data in localStorage
  useEffect(() => {
    if (mounted && isHydrated && !authUser && !redirectAttempted) {
      // Extra safety check: if there's any auth data in localStorage, don't redirect
      const savedAuth = typeof window !== 'undefined' ? localStorage.getItem('authState') : null
      if (!savedAuth) {
        console.log('[ApplicantsPage] No authentication found, redirecting to login')
        setRedirectAttempted(true)
        router.push('/auth/login')
      } else {
        console.log('[ApplicantsPage] Auth data exists in localStorage, not redirecting')
      }
    }
  }, [isHydrated, mounted, redirectAttempted, authUser])

  // Load applicants after we have a userId (authUser exists)
  useEffect(() => {
    if (userId && mounted) {
      loadApplicants()
    }
  }, [userId, mounted])

  const loadApplicants = async () => {
    try {
      if (!userId) return

      console.log('[ApplicantsPage] Loading applicants for recruiter:', userId)
      const response = await fetch(`/api/get-applicants?recruiterId=${userId}`)
      const result = await response.json()

      console.log('[ApplicantsPage] API response:', result)
      
      if (result.data) {
        console.log('[ApplicantsPage] Raw applicants data:', result.data)
        setApplicants(result.data)
        const groups = groupApplicantsByJob(result.data)
        console.log('[ApplicantsPage] Grouped by job:', groups)
        setJobGroups(groups)
        
        // If filtering by jobId, expand only that job
        if (filterJobId) {
          setExpandedJobs(new Set([filterJobId]))
        } else {
          // Default: expand all jobs
          setExpandedJobs(new Set(groups.map(g => g.job.id)))
        }
        
        console.log('[ApplicantsPage] Applicants loaded:', result.data.length)
      }
    } catch (error) {
      console.error('[ApplicantsPage] Error loading applicants:', error)
    } finally {
      setLoading(false)
    }
  }

  const groupApplicantsByJob = (data: Applicant[]) => {
    // Filter by jobId if provided
    let filteredData = data
    if (filterJobId) {
      filteredData = data.filter(a => a.job_id === filterJobId)
    }

    const groups: { [jobId: string]: JobGroup } = {}

    filteredData.forEach(applicant => {
      const jobId = applicant.job_id
      if (!groups[jobId]) {
        groups[jobId] = {
          job: {
            id: applicant.jobs?.id || jobId,
            title: applicant.jobs?.title || 'Unknown Job',
            company: applicant.jobs?.company || 'Unknown Company'
          },
          applicants: [],
          expanded: true // Default expanded
        }
      }
      groups[jobId].applicants.push(applicant)
    })

    const groupsArray = Object.values(groups).sort((a, b) => {
      // Sort by job title
      return a.job.title.localeCompare(b.job.title)
    })

    return groupsArray
  }

  const toggleJobExpand = (jobId: string) => {
    const newExpanded = new Set(expandedJobs)
    if (newExpanded.has(jobId)) {
      newExpanded.delete(jobId)
    } else {
      newExpanded.add(jobId)
    }
    setExpandedJobs(newExpanded)
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="w-5 h-5 text-green-600" />
      case 'in-progress':
        return <Clock className="w-5 h-5 text-blue-600" />
      case 'rejected':
        return <XCircle className="w-5 h-5 text-red-600" />
      default:
        return <Clock className="w-5 h-5 text-yellow-600" />
    }
  }

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800'
      case 'in-progress':
        return 'bg-blue-100 text-blue-800'
      case 'rejected':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-slate-100 text-slate-800'
    }
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }
  const getTotalApplicants = () => {
    return jobGroups.reduce((sum, group) => sum + group.applicants.length, 0)
  }

  const getFilteredJobGroups = () => {
    return jobGroups.map(group => ({
      ...group,
      applicants: group.applicants.filter(applicant => {
        const matchesSearch = 
          applicant.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          applicant.email.toLowerCase().includes(searchQuery.toLowerCase())
        const matchesStatus = !statusFilter || applicant.status === statusFilter
        return matchesSearch && matchesStatus
      })
    })).filter(group => group.applicants.length > 0)
  }

  const getStatusStats = () => {
    const stats = {
      completed: 0,
      'in-progress': 0,
      rejected: 0,
      pending: 0
    }
    applicants.forEach(app => {
      if (stats.hasOwnProperty(app.status)) {
        stats[app.status as keyof typeof stats]++
      } else {
        stats.pending++
      }
    })
    return stats
  }
  if (!mounted) return null
  // Don't render null during hydration, show loading instead
  if (!isHydrated) {
    return (
      <main className="flex h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-50">
        <Sidebar role="recruiter" />
        <div className="flex-1 overflow-auto flex items-center justify-center">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="text-slate-600 mt-4">Loading...</p>
          </div>
        </div>
      </main>
    )
  }
  if (!isAuthenticated) return null

  const statusStats = getStatusStats()
  const filteredGroups = getFilteredJobGroups()

  return (
    <main className="flex h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-50">
      <Sidebar role="recruiter" />
      
      <div className={`flex-1 overflow-auto transition-all duration-300 ${isSidebarOpen ? 'ml-64' : 'ml-20'}`}>
        {/* Header Section */}
        <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-xl border-b border-slate-200/50 shadow-sm">
          <div className="p-6">
            <div className="flex items-center gap-4 mb-6">
              <button
                onClick={() => router.push(filterJobId ? '/recruiter/dashboard/jobs' : '/recruiter/dashboard')}
                className="p-2 hover:bg-slate-100 rounded-lg transition-all hover:scale-110 duration-200"
              >
                <ArrowLeft className="w-6 h-6 text-slate-600" />
              </button>
              <div className="flex-1">
                <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent flex items-center gap-3">
                  <div className="p-2 bg-gradient-to-br from-blue-100 to-blue-200 rounded-lg">
                    <Users className="w-8 h-8 text-blue-600" />
                  </div>
                  {filterJobId ? 'Job Applicants' : 'All Applicants'}
                </h1>
                <p className="text-slate-600 mt-2">
                  {filterJobId 
                    ? `${getTotalApplicants()} candidate${getTotalApplicants() !== 1 ? 's' : ''} for ${jobGroups[0]?.job.title || 'this job'}`
                    : `${getTotalApplicants()} total candidates across ${jobGroups.length} job${jobGroups.length !== 1 ? 's' : ''}`
                  }
                </p>
              </div>
            </div>

            {/* Stats Cards */}
            {applicants.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
                <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4 border border-green-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-green-600 font-medium">Completed</p>
                      <p className="text-2xl font-bold text-green-700">{statusStats.completed}</p>
                    </div>
                    <CheckCircle2 className="w-8 h-8 text-green-600 opacity-30" />
                  </div>
                </div>
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4 border border-blue-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-blue-600 font-medium">In Progress</p>
                      <p className="text-2xl font-bold text-blue-700">{statusStats['in-progress']}</p>
                    </div>
                    <Clock className="w-8 h-8 text-blue-600 opacity-30" />
                  </div>
                </div>
                <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-lg p-4 border border-red-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-red-600 font-medium">Rejected</p>
                      <p className="text-2xl font-bold text-red-700">{statusStats.rejected}</p>
                    </div>
                    <XCircle className="w-8 h-8 text-red-600 opacity-30" />
                  </div>
                </div>
                <div className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-lg p-4 border border-amber-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-amber-600 font-medium">Pending</p>
                      <p className="text-2xl font-bold text-amber-700">{statusStats.pending}</p>
                    </div>
                    <FileText className="w-8 h-8 text-amber-600 opacity-30" />
                  </div>
                </div>
              </div>
            )}

            {/* Search and Filter Bar */}
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search by name or email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
              </div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-3 rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all cursor-pointer"
              >
                <option value="">All Status</option>
                <option value="completed">Completed</option>
                <option value="in-progress">In Progress</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {loading ? (
            <div className="text-center py-20">
              <div className="inline-block">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-blue-200 border-t-blue-600"></div>
              </div>
              <p className="text-slate-600 mt-6 text-lg font-medium">Loading applicants...</p>
            </div>
          ) : filteredGroups.length === 0 && !searchQuery && !statusFilter && jobGroups.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-xl border-2 border-dashed border-slate-200 shadow-sm">
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-blue-600" />
              </div>
              <p className="text-slate-900 text-xl font-semibold">No applicants yet</p>
              <p className="text-slate-600 text-sm mt-2">
                Applicants will appear here when candidates apply for your jobs
              </p>
            </div>
          ) : filteredGroups.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-xl border-2 border-dashed border-slate-200 shadow-sm">
              <Filter className="w-12 h-12 text-slate-400 mx-auto mb-4" />
              <p className="text-slate-900 text-lg font-semibold">No results found</p>
              <p className="text-slate-600 text-sm mt-2">
                Try adjusting your search or filter criteria
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredGroups.map((group) => (
                <div key={group.job.id} className="bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-lg transition-all duration-200 overflow-hidden">
                  {/* Job Header */}
                  <button
                    onClick={() => toggleJobExpand(group.job.id)}
                    className="w-full px-6 py-5 hover:bg-gradient-to-r hover:from-blue-50 to-transparent transition-all flex items-center justify-between border-b border-slate-100"
                  >
                    <div className="flex items-center gap-4 flex-1 text-left">
                      <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center flex-shrink-0 shadow-md">
                        <Briefcase className="w-7 h-7 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-bold text-slate-900">{group.job.title}</h3>
                        <p className="text-sm text-slate-500 mt-1">{group.job.company}</p>
                      </div>
                      <div className="text-sm font-semibold text-white bg-gradient-to-r from-blue-600 to-blue-700 px-4 py-2 rounded-full shadow-md">
                        {group.applicants.length} applicant{group.applicants.length !== 1 ? 's' : ''}
                      </div>
                    </div>
                    <div className="ml-4">
                      {expandedJobs.has(group.job.id) ? (
                        <ChevronUp className="w-6 h-6 text-slate-400" />
                      ) : (
                        <ChevronDown className="w-6 h-6 text-slate-400" />
                      )}
                    </div>
                  </button>

                  {/* Job Applicants */}
                  {expandedJobs.has(group.job.id) && (
                    <div className="divide-y divide-slate-100">
                      {group.applicants.map((applicant, index) => (
                        <div
                          key={applicant.id}
                          className="px-6 py-5 hover:bg-gradient-to-r hover:from-blue-50 to-transparent transition-all duration-150 group"
                        >
                          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                            {/* Applicant Info */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start gap-4">
                                <div className="w-12 h-12 bg-gradient-to-br from-slate-300 to-slate-400 rounded-lg flex items-center justify-center flex-shrink-0 font-bold text-white text-sm">
                                  {applicant.name.charAt(0).toUpperCase()}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <span className="font-bold text-slate-900 text-base">{applicant.name}</span>
                                    {getStatusIcon(applicant.status)}
                                  </div>
                                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm text-slate-600 mt-2">
                                    <div className="flex items-center gap-2 min-w-0">
                                      <Mail className="w-4 h-4 flex-shrink-0 text-slate-400" />
                                      <a href={`mailto:${applicant.email}`} className="hover:text-blue-600 truncate font-medium">
                                        {applicant.email}
                                      </a>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <span className="text-slate-400">•</span>
                                      <span className="font-medium text-slate-700">{applicant.position_applied}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <Calendar className="w-4 h-4 flex-shrink-0 text-slate-400" />
                                      <span className="font-medium">{formatDate(applicant.created_at)}</span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* Status and Action */}
                            <div className="flex items-center gap-3 flex-shrink-0">
                              {applicant.status && (
                                <span
                                  className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all ${getStatusBadgeColor(
                                    applicant.status
                                  )}`}
                                >
                                  {applicant.status.charAt(0).toUpperCase() + applicant.status.slice(1).replace('-', ' ')}
                                </span>
                              )}
                              <button
                                onClick={() => router.push(`/recruiter/dashboard/applicants/detail?applicantId=${applicant.id}`)}
                                className="px-5 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg font-semibold hover:from-blue-700 hover:to-blue-800 transition-all duration-200 whitespace-nowrap shadow-md hover:shadow-lg hover:scale-105 active:scale-95"
                              >
                                View Details
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>      </div>
    </main>
  )
}
