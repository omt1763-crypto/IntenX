'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Briefcase, Plus, MapPin, Eye } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { useSidebar } from '@/context/SidebarContext'
import Sidebar from '@/components/Sidebar'

export default function BusinessJobsPage() {
  const router = useRouter()
  const { user: authUser, isAuthenticated, loading: authLoading } = useAuth()
  const { isOpen: isSidebarOpen } = useSidebar()

  const [jobs, setJobs] = useState([])
  const [loading, setLoading] = useState(true)
  const [mounted, setMounted] = useState(false)

  const userId = authUser?.id

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.05, delayChildren: 0.1 },
    },
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } },
  }

  const handleViewApplicants = (jobId, jobTitle) => {
    router.push(`/business/dashboard/jobs/applicants?jobId=${jobId}&jobTitle=${encodeURIComponent(jobTitle)}`)
  }

  useEffect(() => {
    if (!authLoading && !userId && !isAuthenticated && !authUser) {
      router.replace('/auth/login')
    }
  }, [authLoading, userId, isAuthenticated, authUser, router])

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (userId && mounted && !authLoading) {
      loadJobs()
    }
  }, [userId, mounted, authLoading])

  const loadJobs = async () => {
    try {
      if (!userId) return
      console.log('[BusinessJobs] Loading jobs for userId:', userId)
      const res = await fetch(`/api/recruiter/jobs-summary?recruiterId=${userId}`)
      const json = await res.json()
      console.log('[BusinessJobs] Jobs API response:', json)
      if (json && json.success && json.jobs) {
        console.log('[BusinessJobs] Found', json.jobs.length, 'jobs')
        setJobs(json.jobs)
      } else {
        console.warn('[BusinessJobs] No jobs found in response')
        setJobs([])
      }
    } catch (error) {
      console.error('[BusinessJobs] Error loading jobs:', error)
      setJobs([])
    } finally {
      setLoading(false)
    }
  }

  if (!mounted || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#f0fdf4] via-white to-[#ecfdf5]">
        <Sidebar role="company" />
        <div className={`ml-20 lg:${isSidebarOpen ? 'ml-64' : 'ml-20'} transition-all duration-300 flex items-center justify-center min-h-screen`}>
          <p className="text-slate-600">Loading jobs...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f0fdf4] via-white to-[#ecfdf5]">
      <Sidebar role="company" />
      <div className="fixed inset-0 pointer-events-none opacity-30">
        <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-gradient-to-b from-[#11cd68]/20 to-transparent rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-gradient-to-t from-[#007a78]/15 to-transparent rounded-full blur-3xl" />
      </div>
      <div className={`transition-all duration-300 ${isSidebarOpen ? 'ml-64' : 'ml-20'}`}>
        <motion.div className="sticky top-0 z-40 border-b border-[#11cd68]/20 bg-[#007a78]/95 backdrop-blur-md" initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
          <div className="px-8 py-5">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-white">Job Postings</h1>
                <p className="text-sm text-[#d1f2eb] mt-1">Manage your job listings and applications</p>
              </div>
              <button onClick={() => router.push('/business/dashboard/jobs/new')} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-[#007a78] to-[#00a89a] text-white hover:shadow-lg hover:shadow-teal-400/30 transition-all font-semibold">
                <Plus className="w-4 h-4" />
                New Job
              </button>
            </div>
          </div>
        </motion.div>
        <div className="px-8 py-12 relative z-10">
          <motion.div className="space-y-6" variants={containerVariants} initial="hidden" animate="visible">
            {jobs.length > 0 ? (
              jobs.map((job) => (
                <motion.div key={job.id} className="rounded-xl border border-[#007a78]/20 p-6 bg-gradient-to-br from-white to-[#f0fdf4] shadow-sm hover:shadow-md transition-all" variants={itemVariants}>
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4 flex-1">
                      <div className="p-3 bg-[#11cd68]/10 rounded-lg">
                        <Briefcase className="w-6 h-6 text-[#11cd68]" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-xl font-semibold text-[#007a78] mb-1">{job.title}</h3>
                        <p className="text-sm text-slate-600 mb-3">{job.description || 'No description'}</p>
                        <div className="flex flex-wrap items-center gap-4 text-sm text-slate-600">
                          {job.location && (
                            <div className="flex items-center gap-1">
                              <MapPin className="w-4 h-4 text-[#11cd68]" />
                              {job.location}
                            </div>
                          )}
                          {job.applicant_count !== undefined && (
                            <div className="flex items-center gap-1">
                              <Eye className="w-4 h-4 text-[#11cd68]" />
                              {job.applicant_count} applicants
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="text-right ml-4 flex flex-col gap-3">
                      <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${job.status === 'open' ? 'bg-green-100 text-green-800' : 'bg-slate-100 text-slate-800'}`}>
                        {job.status || 'Open'}
                      </span>
                      {job.created_at && (
                        <p className="text-xs text-slate-500">
                          Posted {new Date(job.created_at).toLocaleDateString()}
                        </p>
                      )}
                      <button 
                        onClick={(e) => {
                          e.stopPropagation()
                          handleViewApplicants(job.id, job.title)
                        }}
                        className="px-4 py-2 bg-[#11cd68] text-white rounded-lg hover:bg-[#00a89a] transition-colors font-semibold text-sm whitespace-nowrap"
                      >
                        View Applicants ({job.applicant_count ?? 0})
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))
            ) : (
              <motion.div className="rounded-xl border border-[#11cd68]/20 p-12 bg-gradient-to-br from-white to-[#f0fdf4] text-center" variants={itemVariants}>
                <Briefcase className="w-12 h-12 text-[#11cd68]/30 mx-auto mb-4" />
                <p className="text-slate-600 mb-6 text-lg">No jobs posted yet</p>
                <button onClick={() => router.push('/business/dashboard/jobs/new')} className="px-6 py-2 bg-gradient-to-r from-[#007a78] to-[#00a89a] text-white rounded-lg hover:shadow-lg hover:shadow-teal-400/30 transition-all font-semibold">
                  Create Your First Job
                </button>
              </motion.div>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  )
}
