'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/context/AuthContext'
import { supabase } from '@/lib/supabase'

export default function CandidateDebugPage() {
  const { user, session } = useAuth()
  const [userInfo, setUserInfo] = useState(null)
  const [interviews, setInterviews] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadData = async () => {
      try {
        console.log('🔍 Auth user:', user)
        console.log('🔍 Session:', session)
        
        setUserInfo({
          authUserId: user?.id,
          authEmail: user?.email,
          sessionUserId: session?.user?.id,
          sessionEmail: session?.user?.email
        })

        // Get all interviews
        const { data: allInterviews, error: allError } = await supabase
          .from('interviews')
          .select('*')
          .limit(5)

        if (allError) {
          console.error('Error fetching all interviews:', allError)
        } else {
          console.log('📝 All interviews:', allInterviews)
          setInterviews(allInterviews || [])
        }
      } catch (err) {
        console.error('Error:', err)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [user, session])

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-slate-900 mb-8">🔍 Candidate Debug Info</h1>

        {/* User Info */}
        <div className="bg-white rounded-lg p-6 mb-6 border border-slate-200">
          <h2 className="text-xl font-bold text-slate-900 mb-4">👤 Your User IDs</h2>
          {userInfo ? (
            <div className="space-y-2 font-mono text-sm">
              <p><span className="font-bold">Auth User ID:</span> {userInfo.authUserId || 'Not found'}</p>
              <p><span className="font-bold">Auth Email:</span> {userInfo.authEmail || 'Not found'}</p>
              <p><span className="font-bold">Session User ID:</span> {userInfo.sessionUserId || 'Not found'}</p>
              <p><span className="font-bold">Session Email:</span> {userInfo.sessionEmail || 'Not found'}</p>
            </div>
          ) : (
            <p className="text-slate-600">Loading...</p>
          )}
        </div>

        {/* Interviews */}
        <div className="bg-white rounded-lg p-6 border border-slate-200">
          <h2 className="text-xl font-bold text-slate-900 mb-4">📝 All Interviews in DB</h2>
          {loading ? (
            <p className="text-slate-600">Loading...</p>
          ) : interviews.length === 0 ? (
            <p className="text-slate-600">No interviews found</p>
          ) : (
            <div className="space-y-4">
              {interviews.map((interview) => (
                <div key={interview.id} className="bg-slate-50 p-4 rounded border border-slate-200">
                  <p><span className="font-bold">ID:</span> {interview.id}</p>
                  <p><span className="font-bold">User ID:</span> <span className="bg-yellow-100 px-2 py-1 rounded">{interview.user_id}</span></p>
                  <p><span className="font-bold">Title:</span> {interview.title}</p>
                  <p><span className="font-bold">Status:</span> {interview.status}</p>
                  <p><span className="font-bold">Created:</span> {new Date(interview.created_at).toLocaleString()}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Instructions */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mt-6">
          <h3 className="font-bold text-blue-900 mb-2">📌 What to check:</h3>
          <ol className="list-decimal list-inside space-y-1 text-sm text-blue-800">
            <li>Does your "Auth User ID" match the "User ID" in the interview?</li>
            <li>If not, the dashboard query won't find your interviews</li>
            <li>Copy your Auth User ID and run: <code className="bg-white px-2 py-1 rounded">SELECT * FROM users WHERE id = 'YOUR_ID'</code></li>
          </ol>
        </div>
      </div>
    </div>
  )
}
