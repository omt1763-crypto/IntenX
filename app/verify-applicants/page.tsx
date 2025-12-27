'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { CheckCircle2, RefreshCw } from 'lucide-react'

export default function VerifyApplicants() {
  const [status, setStatus] = useState<any>({
    tableExists: false,
    applicantCount: 0,
    testData: null,
    loading: true,
    error: null
  })

  useEffect(() => {
    verifySetup()
  }, [])

  const verifySetup = async () => {
    try {
      console.log('🔍 Verifying job_applicants table...')
      
      // Check if table exists by trying to query it
      const { data, error, count } = await supabase
        .from('job_applicants')
        .select('*', { count: 'exact' })
        .limit(5)

      if (error) {
        console.error('❌ Error querying table:', error)
        setStatus({
          tableExists: false,
          applicantCount: 0,
          testData: null,
          loading: false,
          error: error.message
        })
        return
      }

      console.log('✅ Table exists! Found', count, 'applicants')

      setStatus({
        tableExists: true,
        applicantCount: count || 0,
        testData: data,
        loading: false,
        error: null
      })
    } catch (err: any) {
      console.error('❌ Verification failed:', err)
      setStatus({
        tableExists: false,
        applicantCount: 0,
        testData: null,
        loading: false,
        error: err.message
      })
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-[#f0fdf4] via-white to-[#ecfdf5] p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-[#007a78] mb-8">Applicants Table Status</h1>

        <div className="bg-white border border-[#11cd68]/20 rounded-lg p-8 space-y-6">
          {/* Table Status */}
          <div className="flex items-center justify-between pb-6 border-b border-slate-200">
            <div>
              <h2 className="text-xl font-semibold text-slate-900">Table Status</h2>
              <p className="text-sm text-slate-600 mt-1">job_applicants</p>
            </div>
            <div className="text-right">
              {status.loading ? (
                <div className="animate-spin text-2xl">⚙️</div>
              ) : status.tableExists ? (
                <div className="flex items-center gap-2 text-green-600">
                  <CheckCircle2 size={32} />
                  <span className="text-xl font-bold">Ready</span>
                </div>
              ) : (
                <div className="text-red-600 font-bold text-xl">Error</div>
              )}
            </div>
          </div>

          {/* Applicants Count */}
          {status.tableExists && (
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-600 font-semibold">Total Applicants</p>
                <p className="text-3xl font-bold text-blue-900 mt-2">{status.applicantCount}</p>
              </div>

              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <p className="text-sm text-green-600 font-semibold">Status</p>
                <p className="text-xl font-bold text-green-900 mt-2">✅ Active</p>
              </div>
            </div>
          )}

          {/* Recent Applicants */}
          {status.tableExists && status.testData && status.testData.length > 0 && (
            <div>
              <h3 className="font-semibold text-slate-900 mb-3">Recent Applicants</h3>
              <div className="space-y-2">
                {status.testData.slice(0, 5).map((app: any) => (
                  <div key={app.id} className="flex justify-between items-start bg-slate-50 p-3 rounded border border-slate-200">
                    <div>
                      <p className="font-semibold text-slate-900">{app.name}</p>
                      <p className="text-sm text-slate-600">{app.email}</p>
                    </div>
                    <span className={`px-2 py-1 rounded text-xs font-semibold ${
                      app.status === 'completed' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'
                    }`}>
                      {app.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {status.tableExists && status.testData && status.testData.length === 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <p className="text-yellow-800 font-semibold">No applicants yet</p>
              <p className="text-sm text-yellow-700 mt-1">Create a job and share the link with candidates to receive applications</p>
            </div>
          )}

          {/* Error Message */}
          {status.error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-900 font-semibold">Error</p>
              <p className="text-sm text-red-700 mt-1">{status.error}</p>
            </div>
          )}

          {/* Refresh Button */}
          <button
            onClick={verifySetup}
            className="w-full bg-gradient-to-r from-[#007a78] to-[#11cd68] text-white py-2 rounded-lg font-semibold hover:shadow-lg transition-all flex items-center justify-center gap-2"
          >
            <RefreshCw size={18} />
            Refresh Status
          </button>

          {/* Next Steps */}
          {status.tableExists && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-semibold text-blue-900 mb-2">✅ Next Steps:</h3>
              <ul className="text-sm text-blue-800 space-y-2">
                <li>1. Go to recruiter dashboard: <a href="/recruiter/dashboard" className="text-blue-600 hover:underline">/recruiter/dashboard</a></li>
                <li>2. Create a new job</li>
                <li>3. Copy the job link and send to candidates</li>
                <li>4. Candidates fill in their details</li>
                <li>5. Interview starts automatically</li>
                <li>6. Applicants appear in recruiter dashboard</li>
              </ul>
            </div>
          )}
        </div>
      </div>
    </main>
  )
}
