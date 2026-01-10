'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { ArrowLeft, Plus, X, CheckCircle2, Copy, Clock, Link as LinkIcon } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import Sidebar from '@/components/Sidebar'
import { v4 as uuidv4 } from 'uuid'

export default function NewJobPage() {
  const router = useRouter()
  const { user: authUser, isAuthenticated, loading: authLoading } = useAuth()

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    company: '',
    location: '',
    salary_min: '',
    salary_max: '',
    requiredSkills: [],
    skillInput: '',
    status: 'open',
  })

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [mounted, setMounted] = useState(false)
  const [createdJob, setCreatedJob] = useState(null)
  const [timeRemaining, setTimeRemaining] = useState(15 * 60) // 15 minutes in seconds
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.replace('/auth/login')
    }
  }, [authLoading, isAuthenticated, router])

  useEffect(() => {
    setMounted(true)
  }, [])

  // Timer effect for interview link expiry
  useEffect(() => {
    if (!createdJob) return

    const interval = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(interval)
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [createdJob])

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleAddSkill = () => {
    const skill = formData.skillInput.trim()
    if (skill && !formData.requiredSkills.includes(skill)) {
      setFormData((prev) => ({
        ...prev,
        requiredSkills: [...prev.requiredSkills, skill],
        skillInput: '',
      }))
    }
  }

  const handleRemoveSkill = (skillToRemove) => {
    setFormData((prev) => ({
      ...prev,
      requiredSkills: prev.requiredSkills.filter(
        (skill) => skill !== skillToRemove
      ),
    }))
  }

  const handleSkillKeyPress = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleAddSkill()
    }
  }

  const formatTimeRemaining = (seconds) => {
    if (seconds <= 0) return 'Expired'
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
  }

  const getInterviewLink = () => {
    if (!createdJob) return ''
    try {
      return `${window.location.origin}/interview/realtime?jobId=${createdJob.id}`
    } catch (e) {
      return `/interview/realtime?jobId=${createdJob.id}`
    }
  }

  const copyLink = async () => {
    const link = getInterviewLink()
    try {
      await navigator.clipboard.writeText(link)
      setCopied(true)
      setTimeout(() => setCopied(false), 3000)
    } catch (e) {
      console.warn('[RecruiterNewJob] Copy to clipboard failed:', e.message || e)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      // Validate required fields
      if (!formData.title.trim()) {
        throw new Error('Job title is required')
      }

      if (!authUser?.id) {
        throw new Error('User not authenticated')
      }

      // Create job data
      const jobData = {
        id: uuidv4(),
        title: formData.title.trim(),
        description: formData.description.trim(),
        company: formData.company.trim() || 'Unspecified Company',
        location: formData.location.trim(),
        salary_min: formData.salary_min ? parseInt(formData.salary_min) : null,
        salary_max: formData.salary_max ? parseInt(formData.salary_max) : null,
        required_skills: formData.requiredSkills,
        status: formData.status,
        recruiter_id: authUser.id,
        created_at: new Date().toISOString(),
      }

      // Call API to create job
      const response = await fetch('/api/jobs/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          jobData,
          userId: authUser.id,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        
        // Check if limit reached
        if (response.status === 403 && errorData.limitReached) {
          throw new Error(`You've reached the limit of 3 free job postings. Upgrade your subscription to create more jobs.`)
        }
        
        throw new Error(errorData.error || 'Failed to create job')
      }

      const result = await response.json()

      // Success - show the job with interview link
      setCreatedJob(result.job)
      setTimeRemaining(15 * 60) // Reset timer to 15 minutes
    } catch (err) {
      console.error('[NewJobPage] Error:', err)
      setError(err.message || 'Failed to create job')
    } finally {
      setLoading(false)
    }
  }

  if (!mounted) {
    return null
  }

  // Success screen - show interview link
  if (createdJob) {
    return (
      <div className="min-h-screen bg-white">
        <Sidebar role="recruiter" />
        <div className="fixed inset-0 pointer-events-none opacity-30">
          <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-gradient-to-b from-green-500/20 to-transparent rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-gradient-to-t from-green-600/15 to-transparent rounded-full blur-3xl" />
        </div>

        <div className="ml-64">
          {/* Header */}
          <motion.div
            className="sticky top-0 z-40 border-b border-green-200/50 bg-gradient-to-r from-green-600 to-green-700 backdrop-blur-md"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <div className="px-8 py-5">
              <div className="flex items-center gap-4">
                <CheckCircle2 className="w-8 h-8 text-white" />
                <div>
                  <h1 className="text-3xl font-bold text-white">Job Created Successfully!</h1>
                  <p className="text-sm text-green-50 mt-1">Your interview link is ready to share</p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Success Content */}
          <div className="px-8 py-12 relative z-10">
            <motion.div
              className="max-w-2xl mx-auto"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              {/* Job Details Card */}
              <div className="bg-white border border-slate-200 rounded-xl p-8 shadow-lg mb-8">
                <div className="mb-6">
                  <h2 className="text-2xl font-bold text-slate-900 mb-2">{createdJob.title}</h2>
                  <p className="text-slate-600">{createdJob.company}</p>
                </div>

                <div className="grid grid-cols-2 gap-4 pb-6 border-b border-slate-200 mb-6">
                  {createdJob.location && (
                    <div className="flex items-center gap-2 text-slate-700">
                      <LinkIcon className="w-4 h-4 text-blue-600" />
                      <span>{createdJob.location}</span>
                    </div>
                  )}
                  {createdJob.salary_min && (
                    <div className="text-slate-700">
                      ${createdJob.salary_min}K - ${createdJob.salary_max || createdJob.salary_min}K
                    </div>
                  )}
                </div>

                {/* Interview Link Section */}
                <div className="bg-gradient-to-br from-blue-50 to-blue-50/50 border border-blue-200 rounded-lg p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <LinkIcon className="w-5 h-5 text-blue-600" />
                      <span className="font-semibold text-slate-900">Interview Link</span>
                    </div>
                    <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${
                      timeRemaining > 0 
                        ? 'bg-green-100 text-green-700' 
                        : 'bg-red-100 text-red-700'
                    }`}>
                      <Clock className="w-4 h-4" />
                      {formatTimeRemaining(timeRemaining)}
                    </div>
                  </div>

                  <p className="text-xs text-slate-500 mb-3">
                    {timeRemaining > 0 
                      ? 'Share this link with candidates. Link expires in ' + formatTimeRemaining(timeRemaining)
                      : 'This link has expired. Create a new job to generate a fresh link.'}
                  </p>

                  {timeRemaining > 0 ? (
                    <div className="flex gap-3">
                      <div className="flex-1 bg-white border border-slate-300 rounded-lg p-3 overflow-x-auto">
                        <code className="text-sm text-slate-700 font-mono whitespace-nowrap">
                          {getInterviewLink()}
                        </code>
                      </div>
                      <button
                        onClick={copyLink}
                        className={`px-4 py-3 rounded-lg font-semibold transition-all flex items-center gap-2 ${
                          copied
                            ? 'bg-green-600 text-white'
                            : 'bg-blue-600 text-white hover:bg-blue-700 hover:shadow-lg'
                        }`}
                      >
                        <Copy className="w-4 h-4" />
                        {copied ? 'Copied!' : 'Copy'}
                      </button>
                    </div>
                  ) : (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-red-700 text-sm">
                      Link expired - Please create a new job posting to generate a new interview link
                    </div>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-4">
                <button
                  onClick={() => router.push('/recruiter/dashboard/jobs')}
                  className="flex-1 px-6 py-3 border border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 transition-colors font-semibold"
                >
                  View All Jobs
                </button>
                <button
                  onClick={() => {
                    setCreatedJob(null)
                    setFormData({
                      title: '',
                      description: '',
                      company: '',
                      location: '',
                      salary_min: '',
                      salary_max: '',
                      requiredSkills: [],
                      skillInput: '',
                      status: 'open',
                    })
                    setError(null)
                  }}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:shadow-lg hover:shadow-blue-400/30 transition-all font-semibold"
                >
                  Create Another Job
                </button>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    )
  }

  // Form screen
  return (
    <div className="min-h-screen bg-white">
      <Sidebar role="recruiter" />
      <div className="fixed inset-0 pointer-events-none opacity-30">
        <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-gradient-to-b from-blue-500/20 to-transparent rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-gradient-to-t from-blue-600/15 to-transparent rounded-full blur-3xl" />
      </div>

      <div className="ml-64">
        {/* Header */}
        <motion.div
          className="sticky top-0 z-40 border-b border-blue-200/50 bg-gradient-to-r from-blue-600 to-blue-700 backdrop-blur-md"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <div className="px-8 py-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => router.back()}
                  className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                >
                  <ArrowLeft className="w-5 h-5 text-white" />
                </button>
                <div>
                  <h1 className="text-3xl font-bold text-white">Create New Job</h1>
                  <p className="text-sm text-blue-50 mt-1">
                    Post a new job position to find candidates
                  </p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Form Content */}
        <div className="px-8 py-12 relative z-10">
          <motion.div
            className="max-w-2xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Error Message */}
              {error && (
                <motion.div
                  className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-800"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  {error}
                </motion.div>
              )}

              {/* Job Title */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Job Title *
                </label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  placeholder="e.g., Senior React Developer"
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-500/20 bg-white transition-colors"
                  required
                />
              </div>

              {/* Company Name */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Company Name
                </label>
                <input
                  type="text"
                  name="company"
                  value={formData.company}
                  onChange={handleInputChange}
                  placeholder="Company name"
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-500/20 bg-white transition-colors"
                />
              </div>

              {/* Location */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Location
                </label>
                <input
                  type="text"
                  name="location"
                  value={formData.location}
                  onChange={handleInputChange}
                  placeholder="e.g., New York, NY or Remote"
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-500/20 bg-white transition-colors"
                />
              </div>

              {/* Salary Range */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Min Salary (K)
                  </label>
                  <input
                    type="number"
                    name="salary_min"
                    value={formData.salary_min}
                    onChange={handleInputChange}
                    placeholder="e.g., 80"
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-500/20 bg-white transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Max Salary (K)
                  </label>
                  <input
                    type="number"
                    name="salary_max"
                    value={formData.salary_max}
                    onChange={handleInputChange}
                    placeholder="e.g., 120"
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-500/20 bg-white transition-colors"
                  />
                </div>
              </div>

              {/* Job Description */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Job Description
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Describe the job position, responsibilities, and requirements..."
                  rows="6"
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-500/20 bg-white transition-colors resize-none"
                />
              </div>

              {/* Required Skills */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Required Skills
                </label>
                <div className="flex gap-2 mb-3">
                  <input
                    type="text"
                    name="skillInput"
                    value={formData.skillInput}
                    onChange={handleInputChange}
                    onKeyPress={handleSkillKeyPress}
                    placeholder="Add a skill and press Enter"
                    className="flex-1 px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-500/20 bg-white transition-colors"
                  />
                  <button
                    type="button"
                    onClick={handleAddSkill}
                    className="px-4 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:shadow-lg hover:shadow-blue-400/30 transition-all font-semibold flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    Add
                  </button>
                </div>

                {/* Skills List */}
                {formData.requiredSkills.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {formData.requiredSkills.map((skill) => (
                      <motion.div
                        key={skill}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        className="flex items-center gap-2 px-3 py-2 bg-blue-50 border border-blue-300 rounded-full"
                      >
                        <span className="text-sm font-medium text-blue-700">
                          {skill}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleRemoveSkill(skill)}
                          className="text-blue-600 hover:text-red-600 transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>

              {/* Status */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Status
                </label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-500/20 bg-white transition-colors"
                >
                  <option value="open">Open</option>
                  <option value="closed">Closed</option>
                  <option value="on-hold">On Hold</option>
                </select>
              </div>

              {/* Actions */}
              <div className="flex gap-4 pt-6">
                <button
                  type="button"
                  onClick={() => router.back()}
                  className="flex-1 px-6 py-3 border border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 transition-colors font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:shadow-lg hover:shadow-blue-400/30 transition-all font-semibold disabled:opacity-50"
                >
                  {loading ? 'Creating Job...' : 'Create Job'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      </div>
    </div>
  )
}
