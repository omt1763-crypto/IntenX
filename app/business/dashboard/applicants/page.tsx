'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { useSidebar } from '@/context/SidebarContext'
import Sidebar from '@/components/Sidebar'
import { Users, ArrowLeft, CheckCircle2, Clock, XCircle, Search, FileText, Briefcase } from 'lucide-react'

interface Applicant {
  id: string
  name: string
  email: string
  position_applied: string
  status: string
  created_at: string
  job_id: string
  interview_id?: string
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

export default function BusinessApplicantsPage() {
  const router = useRouter()
  const { user: authUser, isAuthenticated } = useAuth()
  const { isOpen: isSidebarOpen } = useSidebar()
  const [applicants, setApplicants] = useState<Applicant[]>([])
  const [jobGroups, setJobGroups] = useState<JobGroup[]>([])
  const [loading, setLoading] = useState(true)
  const [mounted, setMounted] = useState(false)
  const [expandedJobs, setExpandedJobs] = useState<Set<string>>(new Set())
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('')

  const userId = authUser?.id

  useEffect(() => {
    setMounted(true)
    if (userId && isAuthenticated) {
      loadApplicants()
    } else if (mounted && !isAuthenticated) {
      router.push('/auth/login')
    }
  }, [userId, isAuthenticated, mounted])

  const loadApplicants = async () => {
    try {
      if (!userId) return

      console.log('[BusinessApplicants] Loading applicants for company:', userId)
      const response = await fetch(`/api/get-applicants?recruiterId=${userId}`)
      const result = await response.json()

      console.log('[BusinessApplicants] Applicants API response:', result)
      
      if (result.data && Array.isArray(result.data)) {
        console.log('[BusinessApplicants] Found', result.data.length, 'applicants')
        setApplicants(result.data)
        const groups = groupApplicantsByJob(result.data)
        console.log('[BusinessApplicants] Grouped by job:', groups)
        setJobGroups(groups)
        
        // Default: expand all jobs
        setExpandedJobs(new Set(groups.map(g => g.job.id)))
        
        console.log('[BusinessApplicants] Applicants loaded:', result.data.length)
      }
    } catch (error) {
      console.error('[BusinessApplicants] Error loading applicants:', error)
    } finally {
      setLoading(false)
    }
  }

  const groupApplicantsByJob = (data: Applicant[]) => {
    const groups: { [jobId: string]: JobGroup } = {}

    data.forEach(applicant => {
      const jobId = applicant.job_id
      if (!groups[jobId]) {
        groups[jobId] = {
          job: {
            id: applicant.jobs?.id || jobId,
            title: applicant.jobs?.title || 'Unknown Job',
            company: applicant.jobs?.company || 'Unknown Company'
          },
          applicants: [],
          expanded: true
        }
      }
      groups[jobId].applicants.push(applicant)
    })

    const groupsArray = Object.values(groups).sort((a, b) => {
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

  const getStatusBadgeColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'completed':
      case 'interviewed':
        return 'bg-green-100 text-green-800'
      case 'in-progress':
        return 'bg-blue-100 text-blue-800'
      case 'rejected':
        return 'bg-red-100 text-red-800'
      case 'shortlisted':
        return 'bg-purple-100 text-purple-800'
      case 'applied':
      case 'reviewing':
        return 'bg-yellow-100 text-yellow-800'
      default:
        return 'bg-slate-100 text-slate-800'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'completed':
      case 'interviewed':
        return <CheckCircle2 className="w-5 h-5 text-green-600" />
      case 'in-progress':
        return <Clock className="w-5 h-5 text-blue-600" />
      case 'rejected':
        return <XCircle className="w-5 h-5 text-red-600" />
      default:
        return <Clock className="w-5 h-5 text-yellow-600" />
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

  const getInterviewedCount = (group: JobGroup) => {
    return group.applicants.filter(a => a.status?.toLowerCase() === 'interviewed' || a.status?.toLowerCase() === 'completed').length
  }

  const getFilteredJobGroups = () => {
    return jobGroups.map(group => ({
      ...group,
      applicants: group.applicants.filter(applicant => {
        const matchesSearch = 
          applicant.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          applicant.email.toLowerCase().includes(searchQuery.toLowerCase())
        const matchesStatus = !statusFilter || applicant.status?.toLowerCase() === statusFilter.toLowerCase()
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
      const status = app.status?.toLowerCase()
      if (status === 'completed' || status === 'interviewed') {
        stats.completed++
      } else if (status === 'in-progress') {
        stats['in-progress']++
      } else if (status === 'rejected') {
        stats.rejected++
      } else {
        stats.pending++
      }
    })
    return stats
  }

  if (!mounted) return null
  if (!isAuthenticated) return null

  const statusStats = getStatusStats()
  const filteredGroups = getFilteredJobGroups()

  return (
    <main className="flex h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-50">
      <Sidebar role="company" />
      
      <div className={`flex-1 overflow-auto transition-all duration-300 ${isSidebarOpen ? 'ml-64' : 'ml-20'}`}>
        {/* Header Section */}
        <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-xl border-b border-slate-200/50 shadow-sm">
          <div className="p-6">
            <div className="flex items-center gap-4 mb-6">
              <button
                onClick={() => router.push('/business/dashboard')}
                className="p-2 hover:bg-slate-100 rounded-lg transition-all hover:scale-110 duration-200"
              >
                <ArrowLeft className="w-6 h-6 text-slate-600" />
              </button>
              <div className="flex-1">
                <h1 className="text-4xl font-bold bg-gradient-to-r from-[#007a78] to-[#11cd68] bg-clip-text text-transparent flex items-center gap-3">
                  <div className="p-2 bg-gradient-to-br from-[#11cd68]/20 to-[#007a78]/20 rounded-lg">
                    <Users className="w-8 h-8 text-[#007a78]" />
                  </div>
                  Applicants
                </h1>
                <p className="text-slate-600 mt-2">
                  {getTotalApplicants()} total candidates across {jobGroups.length} job{jobGroups.length !== 1 ? 's' : ''}
                </p>
              </div>
            </div>

            {/* Stats Cards */}
            {applicants.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
                <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4 border border-green-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-green-600 font-medium">Interviewed</p>
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
                <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-4 border border-purple-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-purple-600 font-medium">Shortlisted</p>
                      <p className="text-2xl font-bold text-purple-700">{statusStats.pending}</p>
                    </div>
                    <FileText className="w-8 h-8 text-purple-600 opacity-30" />
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
              </div>
            )}

            {/* Search Bar */}
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search by name or email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-[#007a78] focus:border-transparent transition-all"
                />
              </div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-3 rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-[#007a78] focus:border-transparent transition-all cursor-pointer"
              >
                <option value="">All Status</option>
                <option value="interviewed">Interviewed</option>
                <option value="shortlisted">Shortlisted</option>
                <option value="applied">Applied</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
          </div>
        </div>

        {/* Content Section */}
        <div className="p-6 space-y-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <Clock className="w-12 h-12 text-slate-400 mx-auto mb-4 animate-spin" />
                <p className="text-slate-600 text-lg">Loading applicants...</p>
              </div>
            </div>
          ) : filteredGroups.length === 0 ? (
            <div className="bg-white rounded-lg p-12 text-center border border-slate-200">
              <Users className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-600 text-lg">No applicants found</p>
              <p className="text-slate-500 text-sm mt-2">Applicants will appear here once candidates apply to your jobs</p>
            </div>
          ) : (
            filteredGroups.map((group) => (
              <div key={group.job.id} className="bg-white rounded-lg border border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition-all">
                {/* Job Header */}
                <button
                  onClick={() => toggleJobExpand(group.job.id)}
                  className="w-full px-6 py-4 flex items-center justify-between hover:bg-slate-50 transition-colors border-b border-slate-100"
                >
                  <div className="flex items-center gap-4 flex-1 text-left">
                    <Briefcase className="w-6 h-6 text-[#007a78]" />
                    <div>
                      <h3 className="font-semibold text-slate-900">{group.job.title}</h3>
                      <p className="text-sm text-slate-600">
                        {group.applicants.length} applicant{group.applicants.length !== 1 ? 's' : ''} • {getInterviewedCount(group)} interviewed
                      </p>
                    </div>
                  </div>
                  <div className="text-slate-400">
                    {expandedJobs.has(group.job.id) ? '▼' : '▶'}
                  </div>
                </button>

                {/* Applicants List */}
                {expandedJobs.has(group.job.id) && (
                  <div className="divide-y divide-slate-100">
                    {group.applicants.map((applicant) => (
                      <div
                        key={applicant.id}
                        onClick={() => router.push(`/business/dashboard/applicants/${applicant.id}`)}
                        className="px-6 py-4 hover:bg-slate-50 transition-colors cursor-pointer border-l-4 border-transparent hover:border-[#11cd68]"
                      >
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-3 flex-1">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#007a78] to-[#11cd68] flex items-center justify-center text-white font-semibold text-sm">
                              {applicant.name.charAt(0).toUpperCase()}
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="font-semibold text-slate-900">{applicant.name}</h4>
                              <p className="text-sm text-slate-600 truncate">{applicant.email}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap ${getStatusBadgeColor(applicant.status)}`}>
                              {applicant.status || 'Applied'}
                            </span>
                            {getStatusIcon(applicant.status)}
                          </div>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-slate-600 ml-13">
                          <span className="flex items-center gap-1">
                            📋 {applicant.position_applied || 'Position not specified'}
                          </span>
                          <span className="flex items-center gap-1">
                            📅 {formatDate(applicant.created_at)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </main>
  )
}
