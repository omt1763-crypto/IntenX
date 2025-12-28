 'use client'

import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Briefcase, Plus, MapPin, DollarSign, Calendar, Copy, Clock, Link as LinkIcon } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { useSidebar } from '@/context/SidebarContext'
import Sidebar from '@/components/Sidebar'
import { supabase } from '@/lib/supabase'

export default function RecruiterJobsPage() {
  const router = useRouter()
  const { user: authUser } = useAuth()
  const { isOpen: isSidebarOpen } = useSidebar()
  const [jobs, setJobs] = useState([])
  const [jobsWithCounts, setJobsWithCounts] = useState([])
  const [loading, setLoading] = useState(true)
  const [jobTimers, setJobTimers] = useState({})
  const [copiedJob, setCopiedJob] = useState(null)
  const userId = authUser?.id

  useEffect(() => {
    if (userId) loadJobs()
  }, [userId])

  const loadJobs = async () => {
    try {
      console.log('[Jobs] Loading jobs summary for recruiter:', userId)
      setLoading(true)

      const res = await fetch(`/api/recruiter/jobs-summary?recruiterId=${userId}`)
      const json = await res.json()
      if (json && json.success) {
        const jobsList = json.jobs || []
        console.log('[Jobs] Loaded jobs from API:', jobsList)
        setJobs(jobsList)
        setJobsWithCounts(jobsList)

        const initialTimers = {}
        jobsList.forEach(job => {
          const secondsRemaining = getSecondsRemaining(job)
          console.log(`[Jobs] Job ${job.id} - created_at: ${job.created_at}, timer: ${secondsRemaining}s`)
          initialTimers[job.id] = secondsRemaining
        })
        setJobTimers(initialTimers)
      } else {
        console.warn('[Jobs] Jobs summary failed; falling back to client fetch')
        const { data: jobsData } = await supabase.from('jobs').select('*').eq('recruiter_id', userId).limit(50)
        console.log('[Jobs] Loaded jobs from Supabase:', jobsData)
        setJobs(jobsData || [])
        setJobsWithCounts(jobsData || [])
        const initialTimers = {}
        (jobsData || []).forEach(job => {
          const secondsRemaining = getSecondsRemaining(job)
          console.log(`[Jobs] Job ${job.id} - created_at: ${job.created_at}, timer: ${secondsRemaining}s`)
          initialTimers[job.id] = secondsRemaining
        })
        setJobTimers(initialTimers)
      }
      setLoading(false)
    } catch (error) {
      console.error('[Jobs] Error loading jobs summary:', error)
      setLoading(false)
    }
  }

  const LINK_TTL_SECONDS = 15 * 60 // 15 minutes

  const getSecondsRemaining = (job) => {
    try {
      if (!job?.created_at) {
        // If no created_at, default to 15 minutes (new job)
        return LINK_TTL_SECONDS
      }
      
      // Parse the created_at timestamp (handle both ISO and other formats)
      const createdTime = new Date(job.created_at).getTime()
      
      // Validate the date is valid
      if (isNaN(createdTime)) {
        console.warn(`[Jobs] Invalid created_at for job ${job.id}: ${job.created_at}`)
        return LINK_TTL_SECONDS
      }
      
      const now = Date.now()
      const ageMs = now - createdTime
      const remainingMs = (LINK_TTL_SECONDS * 1000) - ageMs
      const remainingSecs = Math.max(0, Math.floor(remainingMs / 1000))
      
      return remainingSecs
    } catch (e) {
      console.error(`[Jobs] Error calculating remaining time for job ${job.id}:`, e)
      // If there's any error parsing the date, assume it's a new job
      return LINK_TTL_SECONDS
    }
  }

  // Update timers every second
  useEffect(() => {
    const interval = setInterval(() => {
      setJobTimers(prev => {
        const next = { ...prev }
        const source = (jobsWithCounts && jobsWithCounts.length > 0) ? jobsWithCounts : jobs
        source.forEach(j => { next[j.id] = getSecondsRemaining(j) })
        return next
      })
    }, 1000)
    return () => clearInterval(interval)
  }, [jobs, jobsWithCounts])

  const formatRemaining = (secs) => {
    if (!secs || secs <= 0) return 'Expired'
    const m = Math.floor(secs / 60)
    const s = secs % 60
    return `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`
  }

  const getInterviewLink = (job) => {
    try { return `${window.location.origin}/interview/realtime?jobId=${job.id}` } catch (e) { return `/interview/realtime?jobId=${job.id}` }
  }

  const copyLink = async (job) => {
    const link = getInterviewLink(job)
    try {
      await navigator.clipboard.writeText(link)
      setCopiedJob(job.id)
      setTimeout(() => setCopiedJob(null), 3000)
    } catch (e) {
      console.warn('Copy failed', e)
    }
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.05, delayChildren: 0.1 } }
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } }
  }

  const handleViewDetails = (jobId) => router.push(`/recruiter/dashboard/applicants?jobId=${jobId}`)
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-50">
      <Sidebar role="recruiter" />
      <div className="fixed inset-0 pointer-events-none opacity-30">
        <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-gradient-to-b from-blue-500/20 to-transparent rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-gradient-to-t from-blue-600/15 to-transparent rounded-full blur-3xl" />
      </div>

      <div className="ml-64">
        <motion.div className="sticky top-0 z-40 border-b border-slate-200/50 bg-white/80 backdrop-blur-xl shadow-sm" initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
          <div className="px-8 py-5">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">Job Postings</h1>
                <p className="text-sm text-slate-600 mt-1">Manage your job listings and applications</p>
              </div>
              <button onClick={() => router.push('/recruiter/dashboard/jobs/new')} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:from-blue-700 hover:to-blue-800 transition-all font-semibold shadow-md hover:shadow-lg">
                <Plus className="w-4 h-4" /> Post a Job
              </button>
            </div>
          </div>
        </motion.div>

        <div className="px-8 py-12 relative z-10">
          <motion.div className="space-y-6" variants={containerVariants} initial="hidden" animate="visible">
            {loading ? (
              <p className="text-slate-600">Loading jobs...</p>
            ) : jobs.length > 0 ? (
              (jobsWithCounts.length > 0 ? jobsWithCounts : jobs).map((job) => (
                <motion.div key={job.id} className="rounded-xl border border-slate-200 p-6 bg-white shadow-sm hover:shadow-lg transition-all" variants={itemVariants}>
                  <div className="mb-4">
                    <h3 className="text-lg font-bold text-slate-900 mb-1">{job.title}</h3>
                    <p className="text-sm text-slate-600">{job.company}</p>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div className="flex items-center gap-2 text-slate-700 text-sm"><MapPin className="w-4 h-4 text-blue-600" />{job.location || 'N/A'}</div>
                    <div className="flex items-center gap-2 text-slate-700 text-sm"><DollarSign className="w-4 h-4 text-blue-600" />{job.salary_min ? `$${job.salary_min}K` : 'N/A'}</div>
                    <div className="flex items-center gap-2 text-slate-700 text-sm"><Briefcase className="w-4 h-4 text-blue-600" />{job.applicant_count ?? 0} applicant{(job.applicant_count ?? 0) !== 1 ? 's' : ''}</div>
                    <div className="flex items-center gap-2 text-slate-700 text-sm"><Calendar className="w-4 h-4 text-blue-600" />{new Date(job.created_at).toLocaleDateString()}</div>
                  </div>

                  <div className="mt-4 pt-4 border-t border-slate-200">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs text-slate-600">Created {new Date(job.created_at).toLocaleDateString()}</span>
                      <button onClick={() => handleViewDetails(job.id)} className="text-blue-600 hover:text-blue-800 font-semibold transition-all text-sm">View Applicants ({job.applicant_count ?? 0}) →</button>
                    </div>

                    {/* Interview Link Section */}
                    {jobTimers[job.id] > 0 ? (
                      <div className="bg-gradient-to-r from-blue-50 to-cyan-50 border border-blue-200 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <LinkIcon className="w-4 h-4 text-blue-600" />
                            <span className="text-sm font-semibold text-slate-900">Interview Link</span>
                          </div>
                          <div className="flex items-center gap-2 px-2 py-1 rounded-full bg-green-100 text-green-700">
                            <Clock className="w-3 h-3" />
                            <span className="text-xs font-medium">{formatRemaining(jobTimers[job.id])}</span>
                          </div>
                        </div>
                        <p className="text-xs text-slate-600 mb-3">Share this link with candidates (expires in {formatRemaining(jobTimers[job.id])})</p>
                        <div className="flex gap-2">
                          <a href={getInterviewLink(job)} target="_blank" rel="noreferrer" className="flex-1 px-3 py-2 bg-white border border-blue-300 rounded text-blue-600 hover:bg-blue-50 text-xs font-medium transition-all text-center truncate">
                            {getInterviewLink(job)}
                          </a>
                          <button onClick={() => copyLink(job)} className={`px-3 py-2 rounded font-semibold text-xs transition-all flex items-center gap-1 ${
                            copiedJob === job.id 
                              ? 'bg-green-600 text-white' 
                              : 'bg-blue-600 text-white hover:bg-blue-700'
                          }`}>
                            <Copy className="w-3 h-3" />
                            {copiedJob === job.id ? 'Copied!' : 'Copy'}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                        <p className="text-xs text-red-700 font-medium">Interview link expired - Create a new job to get a fresh link</p>
                      </div>
                    )}
                  </div>
                </motion.div>
              ))
            ) : (
              <motion.div className="rounded-xl border border-slate-200 p-12 bg-white shadow-sm text-center" variants={itemVariants}>
                <Briefcase className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-slate-900 mb-2">No job postings yet</h3>
                <p className="text-slate-600 mb-6">Create your first job posting to start recruiting</p>
                <button onClick={() => router.push('/recruiter/dashboard/jobs/new')} className="px-6 py-2 rounded-lg bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:from-blue-700 hover:to-blue-800 transition-all font-semibold shadow-md hover:shadow-lg">Post a Job</button>
              </motion.div>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  )
}
