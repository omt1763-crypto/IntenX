'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { ArrowLeft, Mail, Phone, FileText, Calendar, CheckCircle2, Clock } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import Sidebar from '@/components/Sidebar'

interface Applicant {
  id: string
  name: string
  email: string
  phone: string
  position: string
  resume_url?: string
  created_at: string
  job_id: string
  analysis?: {
    hasResume: boolean
    appliedAt: string
    status: string
  }
}

export default function ApplicantsPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user } = useAuth()
  
  const jobId = searchParams?.get('jobId')
  const jobTitle = searchParams?.get('jobTitle') || 'Job'
  
  const [applicants, setApplicants] = useState<Applicant[]>([])
  const [loading, setLoading] = useState(true)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!mounted || !jobId || !user) return
    
    loadApplicants()
  }, [jobId, user, mounted])

  const loadApplicants = async () => {
    try {
      const res = await fetch(`/api/jobs/applicants?jobId=${jobId}&recruiterId=${user?.id}`)
      const data = await res.json()
      
      if (data.success) {
        setApplicants(data.applicants)
      }
    } catch (error) {
      console.error('Error loading applicants:', error)
    } finally {
      setLoading(false)
    }
  }

  if (!mounted) return null

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <Sidebar role="business" />
      
      <div className="ml-64">
        {/* Header */}
        <motion.div
          className="sticky top-0 z-40 border-b border-teal-200/50 bg-gradient-to-r from-teal-600 to-teal-700 backdrop-blur-md"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <div className="px-8 py-5">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.back()}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-white" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-white">Applicants</h1>
                <p className="text-sm text-teal-50 mt-1">Position: {jobTitle}</p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Content */}
        <div className="px-8 py-12">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <p className="text-slate-600">Loading applicants...</p>
            </div>
          ) : applicants.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-600 text-lg">No applicants yet</p>
              <p className="text-slate-500 text-sm mt-2">Share the interview link to start receiving applications</p>
            </div>
          ) : (
            <div className="space-y-4">
              {applicants.map((applicant, idx) => (
                <motion.div
                  key={applicant.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: idx * 0.05 }}
                  className="bg-white rounded-lg border border-slate-200 p-6 hover:shadow-md transition-all"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      {/* Name and Position */}
                      <h3 className="text-lg font-semibold text-slate-900 mb-2">{applicant.name}</h3>
                      <p className="text-sm text-slate-600 mb-4">{applicant.position}</p>
                      
                      {/* Contact Info */}
                      <div className="space-y-2 mb-4">
                        <div className="flex items-center gap-2 text-sm text-slate-600">
                          <Mail className="w-4 h-4 text-teal-600" />
                          <a href={`mailto:${applicant.email}`} className="hover:text-teal-600">
                            {applicant.email}
                          </a>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-slate-600">
                          <Phone className="w-4 h-4 text-teal-600" />
                          <a href={`tel:${applicant.phone}`} className="hover:text-teal-600">
                            {applicant.phone}
                          </a>
                        </div>
                      </div>

                      {/* Applied Date */}
                      <div className="flex items-center gap-2 text-xs text-slate-500">
                        <Calendar className="w-4 h-4" />
                        Applied {new Date(applicant.created_at).toLocaleDateString()}
                      </div>
                    </div>

                    {/* Status and Actions */}
                    <div className="text-right space-y-3">
                      {applicant.analysis?.status === 'completed' ? (
                        <div className="flex items-center gap-2 justify-end text-green-600 font-semibold text-sm">
                          <CheckCircle2 className="w-4 h-4" />
                          Completed
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 justify-end text-yellow-600 font-semibold text-sm">
                          <Clock className="w-4 h-4" />
                          Pending
                        </div>
                      )}
                      
                      {applicant.analysis?.hasResume && (
                        <div className="flex items-center gap-2 justify-end text-slate-600 text-sm">
                          <FileText className="w-4 h-4" />
                          <span>Resume</span>
                        </div>
                      )}
                      
                      <button
                        onClick={() => router.push(`/business/dashboard/applicants/${applicant.id}?jobId=${jobId}`)}
                        className="block px-4 py-2 bg-teal-600 text-white text-sm rounded-lg hover:bg-teal-700 transition-colors font-semibold"
                      >
                        View Details
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
