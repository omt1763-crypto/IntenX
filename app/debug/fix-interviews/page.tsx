'use client'

import { useState } from 'react'
import { useAuth } from '@/context/AuthContext'
import Sidebar from '@/components/Sidebar'

export default function FixInterviewsPage() {
  const { user: authUser } = useAuth()
  const [diagnostics, setDiagnostics] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [fixing, setFixing] = useState(false)
  const [message, setMessage] = useState('')
  const [selectedJobId, setSelectedJobId] = useState('')

  const runDiagnostics = async () => {
    setLoading(true)
    setMessage('')
    try {
      const response = await fetch(`/api/fix-interview-job-ids?recruiterId=${authUser?.id}`)
      const result = await response.json()
      console.log('Diagnostics result:', result)
      setDiagnostics(result.diagnostics)
      
      if (result.diagnostics.interviews_without_job_id > 0) {
        setMessage(`ISSUE FOUND: ${result.diagnostics.interviews_without_job_id} interviews are missing job_id!`)
      } else {
        setMessage('✅ All interviews have job_id. No issues found.')
      }
    } catch (error) {
      console.error('Diagnostic error:', error)
      setMessage('Error running diagnostics: ' + error)
    } finally {
      setLoading(false)
    }
  }

  const fixInterviews = async () => {
    if (!selectedJobId) {
      setMessage('Please select a job ID to link interviews to')
      return
    }

    setFixing(true)
    setMessage('')
    try {
      const response = await fetch('/api/fix-interview-job-ids', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recruiterId: authUser?.id,
          jobId: selectedJobId
        })
      })
      const result = await response.json()
      console.log('Fix result:', result)
      setMessage(result.message || 'Fix completed')
      
      // Re-run diagnostics after fix
      await runDiagnostics()
    } catch (error) {
      console.error('Fix error:', error)
      setMessage('Error fixing interviews: ' + error)
    } finally {
      setFixing(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-50">
      <Sidebar role="recruiter" />
      
      <main className="ml-64 p-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Interview Diagnostics & Fix</h1>
          <p className="text-slate-600 mb-8">
            Debug why interviews aren't showing on the dashboard
          </p>

          {/* Diagnostics Button */}
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="text-xl font-semibold text-slate-900 mb-4">Run Diagnostics</h2>
            <button
              onClick={runDiagnostics}
              disabled={loading}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-slate-400 transition font-semibold"
            >
              {loading ? 'Running...' : 'Run Diagnostics'}
            </button>
          </div>

          {/* Message */}
          {message && (
            <div className={`p-4 rounded-lg mb-6 ${message.includes('ISSUE') ? 'bg-red-50 text-red-800 border border-red-200' : 'bg-green-50 text-green-800 border border-green-200'}`}>
              {message}
            </div>
          )}

          {/* Diagnostics Results */}
          {diagnostics && (
            <div className="bg-white rounded-lg shadow p-6 mb-6">
              <h2 className="text-xl font-semibold text-slate-900 mb-4">Diagnostics Results</h2>
              
              <div className="space-y-4 mb-6">
                <div className="border-l-4 border-blue-500 pl-4">
                  <p className="text-sm text-slate-600">Total Jobs</p>
                  <p className="text-2xl font-bold text-slate-900">{diagnostics.total_jobs}</p>
                </div>
                
                <div className="border-l-4 border-green-500 pl-4">
                  <p className="text-sm text-slate-600">Interviews with job_id</p>
                  <p className="text-2xl font-bold text-slate-900">{diagnostics.interviews_with_job_id}</p>
                </div>
                
                <div className={`border-l-4 ${diagnostics.interviews_without_job_id > 0 ? 'border-red-500' : 'border-green-500'} pl-4`}>
                  <p className="text-sm text-slate-600">Interviews WITHOUT job_id ⚠️</p>
                  <p className={`text-2xl font-bold ${diagnostics.interviews_without_job_id > 0 ? 'text-red-600' : 'text-green-600'}`}>
                    {diagnostics.interviews_without_job_id}
                  </p>
                </div>
              </div>

              {/* Fix Section */}
              {diagnostics.interviews_without_job_id > 0 && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                  <h3 className="font-semibold text-yellow-900 mb-4">Fix Missing job_id Values</h3>
                  
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Select Job to Link To:
                    </label>
                    <select
                      value={selectedJobId}
                      onChange={(e) => setSelectedJobId(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">-- Select a job --</option>
                      {diagnostics.jobs?.map((job: any) => (
                        <option key={job.id} value={job.id}>
                          {job.title} ({job.id.substring(0, 8)}...)
                        </option>
                      ))}
                    </select>
                  </div>

                  <button
                    onClick={fixInterviews}
                    disabled={fixing || !selectedJobId}
                    className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-slate-400 transition font-semibold"
                  >
                    {fixing ? 'Fixing...' : `Fix All ${diagnostics.interviews_without_job_id} Interviews`}
                  </button>
                </div>
              )}

              {/* Jobs List */}
              {diagnostics.jobs && diagnostics.jobs.length > 0 && (
                <div>
                  <h3 className="font-semibold text-slate-900 mb-3">Your Jobs</h3>
                  <div className="space-y-2">
                    {diagnostics.jobs.map((job: any) => (
                      <div key={job.id} className="p-3 bg-slate-50 rounded border border-slate-200">
                        <p className="font-medium text-slate-900">{job.title}</p>
                        <p className="text-xs text-slate-500 font-mono">{job.id}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Recommendation */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <h3 className="font-semibold text-blue-900 mb-2">What's happening?</h3>
            <p className="text-blue-800 text-sm mb-4">
              When interviews are saved, they should be linked to a job_id so the dashboard can filter and count them correctly. 
              If you see "Interviews WITHOUT job_id" above, it means old interviews don't have this linkage.
            </p>
            <p className="text-blue-800 text-sm">
              Click "Fix All [N] Interviews" to automatically link them to the selected job. 
              After fixing, go to your dashboard and refresh to see the interview count update!
            </p>
          </div>
        </div>
      </main>
    </div>
  )
}
