'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/context/AuthContext'

export default function RecruiterDebugPage() {
  const { user: authUser } = useAuth()
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (authUser?.id) {
      loadRecruiterData()
    }
  }, [authUser?.id])

  const loadRecruiterData = async () => {
    try {
      console.log('[DebugRecruiter] Checking data for recruiter:', authUser?.id)
      
      // Get all jobs for this recruiter
      const jobsRes = await fetch('/api/recruiter/jobs')
      const jobsData = await jobsRes.json()
      
      // Get applicants for this recruiter
      const appRes = await fetch(`/api/get-applicants?recruiterId=${authUser?.id}`)
      const appData = await appRes.json()
      
      // Get interviews for this recruiter
      const intRes = await fetch(`/api/get-interviews?recruiterId=${authUser?.id}`)
      const intData = await intRes.json()
      
      setData({
        recruiterId: authUser?.id,
        jobs: jobsData,
        applicants: appData,
        interviews: intData
      })
      setLoading(false)
    } catch (err: any) {
      setError(err.message)
      setLoading(false)
    }
  }

  if (loading) return <div className="p-8">Loading...</div>
  if (error) return <div className="p-8 text-red-600">Error: {error}</div>

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">Recruiter Debug Info</h1>
      
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-xl font-bold mb-4">Your Recruiter ID</h2>
        <p className="font-mono text-sm bg-gray-100 p-4 rounded break-all">{data?.recruiterId}</p>
      </div>

      <div className="grid grid-cols-3 gap-6 mb-6">
        <div className="bg-blue-50 rounded-lg p-6 border border-blue-200">
          <h3 className="text-lg font-bold text-blue-900">Jobs</h3>
          <p className="text-3xl font-bold text-blue-600 mt-2">{data?.jobs?.data?.length || 0}</p>
        </div>
        <div className="bg-green-50 rounded-lg p-6 border border-green-200">
          <h3 className="text-lg font-bold text-green-900">Applicants</h3>
          <p className="text-3xl font-bold text-green-600 mt-2">{data?.applicants?.data?.length || 0}</p>
        </div>
        <div className="bg-purple-50 rounded-lg p-6 border border-purple-200">
          <h3 className="text-lg font-bold text-purple-900">Interviews</h3>
          <p className="text-3xl font-bold text-purple-600 mt-2">{data?.interviews?.data?.length || 0}</p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-xl font-bold mb-4">Raw API Responses</h2>
        <div className="space-y-4">
          <details className="bg-gray-50 p-4 rounded">
            <summary className="font-bold cursor-pointer">Jobs API Response</summary>
            <pre className="mt-4 bg-gray-900 text-gray-100 p-4 rounded text-xs overflow-auto max-h-48">
              {JSON.stringify(data?.jobs, null, 2)}
            </pre>
          </details>
          
          <details className="bg-gray-50 p-4 rounded">
            <summary className="font-bold cursor-pointer">Applicants API Response</summary>
            <pre className="mt-4 bg-gray-900 text-gray-100 p-4 rounded text-xs overflow-auto max-h-48">
              {JSON.stringify(data?.applicants, null, 2)}
            </pre>
          </details>
          
          <details className="bg-gray-50 p-4 rounded">
            <summary className="font-bold cursor-pointer">Interviews API Response</summary>
            <pre className="mt-4 bg-gray-900 text-gray-100 p-4 rounded text-xs overflow-auto max-h-48">
              {JSON.stringify(data?.interviews, null, 2)}
            </pre>
          </details>
        </div>
      </div>

      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
        <h3 className="font-bold text-yellow-900 mb-2">Diagnosis</h3>
        {!data?.jobs?.data?.length && (
          <p className="text-yellow-800 mb-2">
            ❌ <strong>No jobs found</strong> - You need to create a job first or the recruiter_id doesn't match
          </p>
        )}
        {data?.jobs?.data?.length > 0 && !data?.interviews?.data?.length && (
          <p className="text-yellow-800 mb-2">
            ⚠️ <strong>No interviews yet</strong> - You have jobs but candidates haven't started interviews
          </p>
        )}
        {data?.jobs?.data?.length > 0 && data?.interviews?.data?.length > 0 && (
          <p className="text-green-800 mb-2">
            ✅ <strong>Everything looks good!</strong> - You have jobs and interviews
          </p>
        )}
      </div>
    </div>
  )
}
