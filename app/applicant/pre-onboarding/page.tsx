'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { supabase } from '@/lib/supabase'
import { User, Briefcase, Mail, ArrowRight, CheckCircle2, AlertCircle } from 'lucide-react'

export default function ApplicantPreOnboarding() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const jobId = searchParams.get('jobId')

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [jobInfo, setJobInfo] = useState<any>(null)
  const [loadingJob, setLoadingJob] = useState(true)

  useEffect(() => {
    // Load job info
    if (jobId) {
      loadJobInfo()
    } else {
      setError('No job ID provided')
      setLoadingJob(false)
    }
  }, [jobId])

  const loadJobInfo = async () => {
    try {
      const { data, error: jobError } = await supabase
        .from('jobs')
        .select('id, title, position, company')
        .eq('id', jobId)
        .single()

      if (jobError) {
        setError('Job not found')
        setLoadingJob(false)
        return
      }

      setJobInfo(data)
      // Pre-fill role with job position
      setFormData(prev => ({ ...prev, role: data.position }))
      setLoadingJob(false)
    } catch (err) {
      console.error('Error loading job:', err)
      setError('Failed to load job information')
      setLoadingJob(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    setError('')
  }

  const validateForm = () => {
    if (!formData.name.trim()) {
      setError('Please enter your name')
      return false
    }
    if (!formData.email.trim()) {
      setError('Please enter your email')
      return false
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(formData.email)) {
      setError('Please enter a valid email')
      return false
    }
    if (!formData.role.trim()) {
      setError('Please enter the role you are applying for')
      return false
    }
    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) return
    
    setLoading(true)
    try {
      let applicantId = crypto.randomUUID()
      
      // Create applicant record using API endpoint
      const applicantData = {
        id: applicantId,
        job_id: jobId,
        name: formData.name,
        email: formData.email,
        position_applied: formData.role,
        status: 'invited',
        created_at: new Date().toISOString(),
      }

      console.log('[PreOnboarding] Submitting applicant data...')

      const response = await fetch('/api/applicants', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ applicantData }),
      })

      const responseData = await response.json()

      if (!response.ok) {
        console.error('[PreOnboarding] API error:', responseData)
        
        // If it's a 503 (table not found), allow them to continue anyway
        if (response.status === 503) {
          console.log('[PreOnboarding] Applicants table not created yet, continuing anyway...')
          // Continue with interview even if we can't save applicant details
          console.log('[PreOnboarding] Using temporary applicant ID:', applicantId)
        } else {
          setError(responseData.error || 'Failed to save your information. Please try again.')
          setLoading(false)
          return
        }
      } else {
        console.log('[PreOnboarding] Applicant saved:', responseData.applicant.id)
        applicantId = responseData.applicant.id
      }

      // Store applicant ID in localStorage for interview page
      localStorage.setItem('applicantId', applicantId)
      localStorage.setItem('applicantData', JSON.stringify({
        name: formData.name,
        email: formData.email,
        position: formData.role,
        jobId: jobId,
        applicantId: applicantId,
      }))

      console.log('[PreOnboarding] Redirecting to interview...')
      
      // Redirect to interview
      router.push(`/interview/realtime?jobId=${jobId}&applicantId=${applicantId}`)
    } catch (err) {
      console.error('Error:', err)
      setError('An unexpected error occurred. Please try again.')
      setLoading(false)
    }
  }

  if (loadingJob) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#f0fdf4] via-white to-[#ecfdf5] flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin text-3xl mb-4">⚙️</div>
          <p className="text-slate-600">Loading job information...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f0fdf4] via-white to-[#ecfdf5] flex items-center justify-center py-6 px-4">
      {/* Decorative background */}
      <div className="fixed inset-0 opacity-30 pointer-events-none">
        <div className="absolute top-20 right-0 w-96 h-96 bg-[#d4f1f5] rounded-full mix-blend-multiply filter blur-3xl" />
        <div className="absolute bottom-20 left-0 w-96 h-96 bg-[#e6f7f5] rounded-full mix-blend-multiply filter blur-3xl opacity-40" />
      </div>

      <motion.div
        className="relative z-10 w-full max-w-md"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* Card */}
        <div className="bg-white/95 backdrop-blur border border-[#11cd68]/30 rounded-2xl p-8 shadow-xl">
          {/* Header */}
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-br from-[#11cd68] to-[#00d084] mb-4">
              <Briefcase className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900 mb-2">Interview Details</h1>
            {jobInfo && (
              <div className="space-y-1 mb-4">
                <p className="text-lg font-semibold text-[#007a78]">{jobInfo.position}</p>
                <p className="text-sm text-slate-600">{jobInfo.company}</p>
              </div>
            )}
            <p className="text-sm text-slate-600">Please provide your information to start the interview</p>
          </div>

          {/* Error message */}
          {error && (
            <motion.div
              className="mb-6 p-3 bg-red-50 border border-red-200 rounded-lg flex gap-2"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-600">{error}</p>
            </motion.div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Name field */}
            <div>
              <label className="block text-sm font-semibold text-slate-900 mb-2">
                Full Name <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <User className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="John Doe"
                  className="w-full bg-white/70 border border-[#11cd68]/20 rounded-lg pl-10 pr-4 py-2.5 text-sm text-slate-900 placeholder-slate-500 focus:outline-none focus:border-[#11cd68]/50 transition-all"
                  disabled={loading}
                />
              </div>
            </div>

            {/* Email field */}
            <div>
              <label className="block text-sm font-semibold text-slate-900 mb-2">
                Email Address <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="john@example.com"
                  className="w-full bg-white/70 border border-[#11cd68]/20 rounded-lg pl-10 pr-4 py-2.5 text-sm text-slate-900 placeholder-slate-500 focus:outline-none focus:border-[#11cd68]/50 transition-all"
                  disabled={loading}
                />
              </div>
            </div>

            {/* Role field */}
            <div>
              <label className="block text-sm font-semibold text-slate-900 mb-2">
                Position Applying For <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Briefcase className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
                <input
                  type="text"
                  name="role"
                  value={formData.role}
                  onChange={handleChange}
                  placeholder={jobInfo?.position || "e.g. Senior Engineer"}
                  className="w-full bg-white/70 border border-[#11cd68]/20 rounded-lg pl-10 pr-4 py-2.5 text-sm text-slate-900 placeholder-slate-500 focus:outline-none focus:border-[#11cd68]/50 transition-all"
                  disabled={loading}
                />
              </div>
            </div>

            {/* Submit button */}
            <motion.button
              type="submit"
              disabled={loading}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={`w-full py-3 rounded-lg font-semibold text-white flex items-center justify-center gap-2 transition-all shadow-glow ${
                loading
                  ? 'bg-slate-300 cursor-not-allowed'
                  : 'bg-primary hover:bg-primary/90 hover:shadow-lg'
              }`}
            >
              {loading ? (
                <>
                  <span className="inline-block animate-spin">⚙️</span>
                  Starting Interview...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  Start Interview
                </>
              )}
            </motion.button>
          </form>

          {/* Info message */}
          <div className="mt-6 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-xs text-blue-700">
              ✓ Your information will be securely saved and shared with the recruiter after your interview.
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
