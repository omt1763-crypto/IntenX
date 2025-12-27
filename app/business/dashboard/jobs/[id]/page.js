'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
)

export default function JobDetailsPage() {
  const router = useRouter()
  const params = useParams()
  const jobId = params?.id
  
  const [job, setJob] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!jobId) return

    const fetchJob = async () => {
      try {
        const { data, error } = await supabase
          .from('jobs')
          .select('*')
          .eq('id', jobId)
          .single()

        if (error) throw error
        setJob(data)
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchJob()
  }, [jobId])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-emerald-500"></div>
      </div>
    )
  }

  if (error || !job) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Error</h2>
          <p className="text-slate-600 mb-6">{error || 'Job not found'}</p>
          <button
            onClick={() => router.back()}
            className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
          >
            Go Back
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="max-w-4xl mx-auto">
        <button
          onClick={() => router.back()}
          className="mb-6 px-4 py-2 text-slate-600 hover:text-slate-900 hover:bg-slate-200 rounded-lg transition-all"
        >
          ← Back
        </button>

        <div className="bg-white rounded-xl shadow-lg border border-slate-200 p-8">
          <h1 className="text-4xl font-bold text-slate-900 mb-2">{job.title}</h1>
          <p className="text-slate-600 text-lg mb-6">at {job.company || 'Your Company'}</p>

          <div className="grid grid-cols-2 gap-6 mb-8">
            <div>
              <h3 className="text-sm font-semibold text-slate-600 uppercase mb-2">Status</h3>
              <p className="text-lg text-slate-900">{job.status || 'Open'}</p>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-600 uppercase mb-2">Posted</h3>
              <p className="text-lg text-slate-900">{new Date(job.created_at).toLocaleDateString()}</p>
            </div>
          </div>

          {job.description && (
            <div className="mb-8">
              <h3 className="text-xl font-semibold text-slate-900 mb-4">Description</h3>
              <p className="text-slate-600 whitespace-pre-wrap">{job.description}</p>
            </div>
          )}

          {job.skills && (
            <div>
              <h3 className="text-xl font-semibold text-slate-900 mb-4">Required Skills</h3>
              <div className="flex flex-wrap gap-2">
                {Array.isArray(job.skills) ? (
                  job.skills.map((skill, idx) => (
                    <span
                      key={idx}
                      className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-sm font-medium"
                    >
                      {typeof skill === 'string' ? skill : skill.name}
                    </span>
                  ))
                ) : (
                  <p className="text-slate-600">No skills specified</p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
