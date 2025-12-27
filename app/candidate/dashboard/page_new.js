'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/context/AuthContext'
import Sidebar from '@/components/Sidebar'
import { BarChart3, Users, Award, Brain, TrendingUp } from 'lucide-react'

export default function CandidateDashboard() {
  const router = useRouter()
  const { user: authUser, isAuthenticated } = useAuth()
  const [session, setSession] = useState<any>(null)
  const [candidate, setCandidate] = useState(null)
  const [interviews, setInterviews] = useState([])
  const [stats, setStats] = useState({ total: 0, avgScore: 0, completed: 0, nextSuggested: 'HR' })
  const [loading, setLoading] = useState(true)
  const [mounted, setMounted] = useState(false)
  const [skillsData, setSkillsData] = useState([])

  const userId = authUser?.id || session?.user?.id

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })
    return () => subscription?.unsubscribe()
  }, [])

  useEffect(() => {
    setMounted(true)
    if (userId) {
      loadCandidateData(userId)
    } else if (mounted) {
      setLoading(false)
    }
  }, [userId, mounted])

  const loadCandidateData = async (userId) => {
    try {
      // Load candidate profile
      const { data: profileData } = await supabase
        .from('candidate_profiles')
        .select('*')
        .eq('user_id', userId)
        .single()

      if (profileData) {
        setCandidate(profileData)
      }

      // Load interviews
      const { data: interviewsData } = await supabase
        .from('interviews')
        .select('*')
        .eq('user_id', userId)
        .order('timestamp', { ascending: false })
      
      setInterviews(interviewsData || [])

      // Sample skills data
      const sampleSkills = [
        { name: 'JavaScript', rating: 8, category: 'Technical', trend: 'up' },
        { name: 'React', rating: 7, category: 'Technical', trend: 'up' },
        { name: 'Communication', rating: 6, category: 'Soft Skills', trend: 'stable' },
        { name: 'Problem Solving', rating: 7, category: 'Soft Skills', trend: 'up' },
      ]
      setSkillsData(sampleSkills)

      const types = ['HR', 'Technical', 'Behavioral', 'Role-based']
      const nextType = types[Math.floor(Math.random() * types.length)]

      if (interviewsData && interviewsData.length > 0) {
        const avgScore = Math.round(
          interviewsData.reduce((sum, i) => sum + (i.score || 0), 0) / interviewsData.length
        )
        const completedCount = interviewsData.filter(i => i.status === 'completed').length
        setStats({
          total: interviewsData.length,
          avgScore: avgScore,
          completed: completedCount,
          nextSuggested: nextType
        })
      } else {
        setStats({
          total: 0,
          avgScore: 0,
          completed: 0,
          nextSuggested: nextType
        })
      }
    } catch (error) {
      console.error('[CandidateDashboard] Error:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  if (!mounted) return null

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Sidebar */}
      <Sidebar />

      {/* Content */}
      <div className="relative z-10 ml-64 pt-24 pb-16 min-h-screen w-full">
        <div className="w-full px-8 lg:px-12">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <p className="text-slate-600 text-lg">Loading dashboard...</p>
            </div>
          ) : !userId && !isAuthenticated ? (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-8">
              <p className="text-yellow-800">Please <a href="/auth/login" className="font-semibold underline">log in</a> to access the dashboard.</p>
            </div>
          ) : (
            <>
              {/* Header */}
              <div className="mb-8">
                <h1 className="text-5xl font-bold text-slate-900 mb-2">Interview Hub</h1>
                <p className="text-lg text-slate-600 font-light">Master your interview skills</p>
              </div>

              {/* Stats Grid with Analytics */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-12">
                {/* Completed Interviews Card with Chart */}
                <div className="group relative overflow-hidden rounded-3xl p-8 backdrop-blur-xl bg-white/50 border border-white/60 hover:border-white/80 shadow-lg hover:shadow-2xl transition-all duration-300">
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-cyan-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-200/30 to-cyan-200/20 rounded-full blur-3xl opacity-0 group-hover:opacity-40 transition-opacity" />
                  
                  <div className="relative z-10">
                    <div className="flex items-center justify-between mb-6">
                      <div>
                        <p className="text-slate-600 font-semibold text-sm">Interviews Completed</p>
                        <p className="text-5xl font-bold text-slate-900 mt-2">{stats.completed}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-green-600 font-bold">↑ Keep practicing</p>
                      </div>
                    </div>
                    
                    {/* Mini Bar Chart */}
                    <div className="bg-white/40 rounded-2xl p-4 mb-4">
                      <div className="flex items-end justify-between h-20 gap-1">
                        {[2, 3, 2, 4, 3, 1, stats.completed || 2].map((val, i) => (
                          <div
                            key={i}
                            className="flex-1 bg-gradient-to-t from-blue-500 to-blue-400 rounded-t-lg hover:opacity-80 transition-opacity"
                            style={{ height: `${(val / 4) * 100}%` }}
                          />
                        ))}
                      </div>
                      <div className="flex justify-between text-xs text-slate-500 mt-2">
                        <span>Mon</span>
                        <span>Tue</span>
                        <span>Wed</span>
                        <span>Thu</span>
                        <span>Fri</span>
                        <span>Sat</span>
                        <span>Sun</span>
                      </div>
                    </div>
                    
                    <button 
                      onClick={() => router.push('/candidate/practice')}
                      className="w-full py-2 rounded-xl backdrop-blur-xl bg-emerald-500/80 border border-emerald-400 hover:border-emerald-300 text-white font-semibold hover:bg-emerald-600 transition-all text-sm">
                      Start Practice
                    </button>
                  </div>
                </div>

                {/* Average Score Card with Pie Chart */}
                <div className="group relative overflow-hidden rounded-3xl p-8 backdrop-blur-xl bg-white/50 border border-white/60 hover:border-white/80 shadow-lg hover:shadow-2xl transition-all duration-300">
                  <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-pink-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-purple-200/30 to-pink-200/20 rounded-full blur-3xl opacity-0 group-hover:opacity-40 transition-opacity" />
                  
                  <div className="relative z-10">
                    <div className="flex items-center justify-between mb-6">
                      <div>
                        <p className="text-slate-600 font-semibold text-sm">Average Score</p>
                        <p className="text-5xl font-bold text-slate-900 mt-2">{stats.avgScore}/100</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-slate-600 font-semibold">Score Trend</p>
                      </div>
                    </div>
                    
                    {/* Mini Pie Chart */}
                    <div className="bg-white/40 rounded-2xl p-4 mb-4 flex items-center justify-center">
                      <svg className="w-24 h-24" viewBox="0 0 100 100">
                        <circle cx="50" cy="50" r="45" fill="none" stroke="#e0e7ff" strokeWidth="8" />
                        <circle
                          cx="50"
                          cy="50"
                          r="45"
                          fill="none"
                          stroke="#8b5cf6"
                          strokeWidth="8"
                          strokeDasharray={`${142 * (stats.avgScore / 100)} ${142 * (1 - stats.avgScore / 100)}`}
                          strokeLinecap="round"
                          transform="rotate(-90 50 50)"
                        />
                      </svg>
                    </div>
                    
                    <button 
                      onClick={() => document.getElementById('history-section')?.scrollIntoView({ behavior: 'smooth' })}
                      className="w-full py-2 rounded-xl backdrop-blur-xl bg-emerald-500/80 border border-emerald-400 hover:border-emerald-300 text-white font-semibold hover:bg-emerald-600 transition-all text-sm">
                      View History
                    </button>
                  </div>
                </div>
              </div>

              {/* Secondary Stats Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-12">
                {/* Total Attempts Card */}
                <div className="group relative overflow-hidden rounded-3xl p-6 backdrop-blur-xl bg-white/50 border border-white/60 hover:border-white/80 shadow-lg hover:shadow-xl transition-all duration-300">
                  <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="absolute -top-20 -right-20 w-40 h-40 bg-gradient-to-br from-cyan-200/30 to-blue-200/20 rounded-full blur-2xl opacity-0 group-hover:opacity-40 transition-opacity" />
                  
                  <div className="relative z-10 flex items-center justify-between">
                    <div>
                      <p className="text-slate-600 font-semibold text-sm">Total Attempts</p>
                      <p className="text-4xl font-bold text-slate-900 mt-1">{stats.total}</p>
                      <p className="text-xs text-cyan-600 font-semibold mt-2">All Interviews</p>
                    </div>
                    <div className="text-5xl opacity-30">📊</div>
                  </div>
                </div>

                {/* Recommended Type Card */}
                <div className="group relative overflow-hidden rounded-3xl p-6 backdrop-blur-xl bg-white/50 border border-white/60 hover:border-white/80 shadow-lg hover:shadow-xl transition-all duration-300">
                  <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-emerald-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="absolute -bottom-20 -right-20 w-40 h-40 bg-gradient-to-br from-green-200/30 to-emerald-200/20 rounded-full blur-2xl opacity-0 group-hover:opacity-40 transition-opacity" />
                  
                  <div className="relative z-10 flex items-center justify-between">
                    <div>
                      <p className="text-slate-600 font-semibold text-sm">Next Suggested</p>
                      <p className="text-4xl font-bold text-slate-900 mt-1">{stats.nextSuggested}</p>
                      <p className="text-xs text-green-600 font-semibold mt-2">Practice Type</p>
                    </div>
                    <div className="text-5xl opacity-30">🎯</div>
                  </div>
                </div>
              </div>

              {/* Interview History Section */}
              <div id="history-section" className="mt-12">
                <h2 className="text-3xl font-bold text-slate-900 mb-6">Interview History</h2>
                
                {interviews.length === 0 ? (
                  <div className="rounded-3xl p-12 backdrop-blur-xl bg-white/50 border border-white/60 text-center">
                    <p className="text-slate-600 mb-6 text-lg">No interviews yet. Start practicing to build your skills!</p>
                    <button
                      onClick={() => router.push('/candidate/practice')}
                      className="px-8 py-3 bg-emerald-500/80 border border-emerald-400 text-white font-semibold rounded-xl hover:bg-emerald-600 transition-all"
                    >
                      Start Your First Interview
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {interviews.map((interview) => (
                      <div
                        key={interview.id}
                        className="rounded-3xl p-6 backdrop-blur-xl bg-white/50 border border-white/60 hover:border-white/80 shadow-lg transition-all duration-300"
                      >
                        <div className="flex items-start justify-between mb-4">
                          <div>
                            <h3 className="font-bold text-slate-900">{interview.title || 'Interview'}</h3>
                            <p className="text-sm text-slate-600 mt-1">
                              {new Date(interview.created_at).toLocaleDateString()}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-3xl font-bold text-slate-900">{interview.score || 0}</p>
                            <p className="text-xs text-slate-500">/100</p>
                          </div>
                        </div>
                        <button
                          className="w-full py-2 text-sm rounded-lg border border-emerald-400 text-emerald-600 hover:bg-emerald-500/10 font-semibold transition-all"
                        >
                          View Details
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Skills Section */}
              <div className="mt-12">
                <h2 className="text-3xl font-bold text-slate-900 mb-6">Your Skills</h2>
                
                <div className="rounded-3xl p-8 backdrop-blur-xl bg-white/50 border border-white/60 shadow-lg">
                  <div className="space-y-4">
                    {skillsData.map((skill) => (
                      <div key={skill.name}>
                        <div className="flex items-center justify-between mb-2">
                          <p className="font-semibold text-slate-900">{skill.name}</p>
                          <span className="text-sm text-slate-600">{skill.category}</span>
                        </div>
                        <div className="bg-slate-200 rounded-full h-3">
                          <div 
                            className="bg-emerald-500 h-3 rounded-full transition-all"
                            style={{ width: `${skill.rating * 10}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
