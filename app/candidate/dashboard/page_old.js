'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { BarChart3, Brain, TrendingUp, Award, Plus, LogOut, Menu, X, FileText, CheckCircle, AlertCircle } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/context/AuthContext'

export default function CandidateDashboard() {
  const router = useRouter()
  const { user: authUser, isAuthenticated } = useAuth()
  const [session, setSession] = useState(null)
  const [candidate, setCandidate] = useState(null)
  const [interviews, setInterviews] = useState([])
  const [stats, setStats] = useState({ total: 0, avgScore: 0, completed: 0 })
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [activeSection, setActiveSection] = useState('dashboard')
  const [loading, setLoading] = useState(true)
  const [skillsData, setSkillsData] = useState([])
  const [recommendedType, setRecommendedType] = useState('HR')

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
    const userId = authUser?.id || session?.user?.id
    if (userId) {
      loadCandidateData(userId)
    } else {
      setLoading(false)
    }
  }, [authUser?.id, session?.user?.id])

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
        .eq('candidate_id', userId)
        .order('created_at', { ascending: false })
      
      setInterviews(interviewsData || [])

      // Generate sample skills data based on candidate profile
      const sampleSkills = [
        { name: 'JavaScript', rating: 8, category: 'Technical', trend: 'up' },
        { name: 'React', rating: 7, category: 'Technical', trend: 'up' },
        { name: 'Communication', rating: 6, category: 'Soft Skills', trend: 'stable' },
        { name: 'Problem Solving', rating: 7, category: 'Soft Skills', trend: 'up' },
        { name: 'Python', rating: 5, category: 'Technical', trend: 'down' },
        { name: 'Team Work', rating: 8, category: 'Soft Skills', trend: 'stable' }
      ]
      setSkillsData(sampleSkills)

      // Determine recommended interview type
      const types = ['HR', 'Technical', 'Behavioral', 'Role-based']
      setRecommendedType(types[Math.floor(Math.random() * types.length)])

      // Calculate stats
      if (interviewsData && interviewsData.length > 0) {
        const avgScore = Math.round(
          interviewsData.reduce((sum, i) => sum + (i.score || 0), 0) / interviewsData.length
        )
        setStats({
          total: interviewsData.length,
          avgScore: avgScore,
          completed: interviewsData.filter(i => i.completed_at).length
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

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#f0fdf4] via-white to-[#ecfdf5] flex items-center justify-center">
        <p className="text-[#007a78] font-semibold">Loading...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f0fdf4] via-white to-[#ecfdf5]">
      {/* Background Accents */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-20 right-0 w-96 h-96 bg-[#d4f1f5] rounded-full mix-blend-multiply filter blur-3xl opacity-30" />
        <div className="absolute bottom-20 left-0 w-96 h-96 bg-[#e6f7f5] rounded-full mix-blend-multiply filter blur-3xl opacity-40" />
      </div>

      {/* Sidebar */}
      <motion.div
        className={`fixed left-0 top-0 h-screen bg-gradient-to-b from-[#007a78] to-[#005a58] text-white transition-all duration-300 z-40 ${
          sidebarOpen ? 'w-64' : 'w-20'
        }`}
        initial={{ x: -256 }}
        animate={{ x: 0 }}
      >
        <div className="p-6">
          <div className="flex items-center gap-2 mb-8">
            <Brain className="w-8 h-8 text-[#11cd68]" />
            {sidebarOpen && <span className="font-bold text-lg">InterviewX</span>}
          </div>

          <nav className="space-y-2">
            {[
              { id: 'dashboard', label: 'Home' },
              { id: 'practice', label: 'Practice Types' },
              { id: 'skills', label: 'Skills Map' },
              { id: 'history', label: 'Interview History' },
              { id: 'resume', label: 'Resume Analysis' },
              { id: 'certificates', label: 'Certificates' }
            ].map((section) => (
              <motion.button
                key={section.id}
                onClick={() => setActiveSection(section.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all capitalize ${
                  activeSection === section.id
                    ? 'bg-[#11cd68]/30 text-[#11cd68] border-l-4 border-[#11cd68]'
                    : 'text-white/70 hover:bg-white/10'
                }`}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Brain className="w-5 h-5" />
                {sidebarOpen && <span className="text-sm">{section.label}</span>}
              </motion.button>
            ))}
          </nav>
        </div>

        <div className="absolute bottom-6 left-6 right-6">
          <motion.button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg bg-red-500/20 text-red-300 hover:bg-red-500/30"
            whileHover={{ scale: 1.05 }}
          >
            <LogOut className="w-5 h-5" />
            {sidebarOpen && <span className="text-sm">Logout</span>}
          </motion.button>
        </div>
      </motion.div>

      {/* Main Content */}
      <div className={`transition-all duration-300 ${sidebarOpen ? 'ml-64' : 'ml-20'}`}>
        {/* Header */}
        <motion.div
          className="sticky top-0 z-30 backdrop-blur-md bg-[#007a78]/95 border-b border-[#11cd68]/20 py-6"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-center justify-between px-8">
            <div>
              <h1 className="text-3xl font-bold text-white">
                Welcome, {candidate?.first_name || authUser?.name || session?.user?.email || 'Candidate'}!
              </h1>
              <p className="text-white/80 text-sm mt-1">Master your interview skills</p>
            </div>
            <motion.button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 rounded-lg bg-white/10 hover:bg-white/20"
              whileHover={{ scale: 1.05 }}
            >
              {sidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </motion.button>
          </div>
        </motion.div>

        {/* Content */}
        <div className="p-8 relative z-10">
          <motion.div variants={containerVariants} initial="hidden" animate="visible">
            {/* Practice Interviews */}
            {activeSection === 'dashboard' && (
              <motion.div className="space-y-6" variants={itemVariants}>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <motion.div
                    className="rounded-xl border border-[#11cd68]/20 p-6 bg-white shadow-sm"
                    whileHover={{ y: -2 }}
                  >
                    <p className="text-sm text-black mb-1">Total Interviews</p>
                    <p className="text-3xl font-bold text-[#007a78]">{stats.total}</p>
                  </motion.div>
                  <motion.div
                    className="rounded-xl border border-[#11cd68]/20 p-6 bg-white shadow-sm"
                    whileHover={{ y: -2 }}
                  >
                    <p className="text-sm text-black mb-1">Average Score</p>
                    <p className="text-3xl font-bold text-[#007a78]">{stats.avgScore}/100</p>
                  </motion.div>
                  <motion.div
                    className="rounded-xl border border-[#11cd68]/20 p-6 bg-white shadow-sm"
                    whileHover={{ y: -2 }}
                  >
                    <p className="text-sm text-black mb-1">Completed</p>
                    <p className="text-3xl font-bold text-[#007a78]">{stats.completed}</p>
                  </motion.div>
                </div>

                <motion.button
                  onClick={() => router.push('/interview/realtime')}
                  className="w-full py-3 rounded-lg bg-gradient-to-r from-[#007a78] to-[#11cd68] text-white font-semibold hover:shadow-lg"
                  whileHover={{ scale: 1.02 }}
                >
                  <Plus className="w-4 h-4 inline mr-2" />
                  Start New Interview
                </motion.button>

                <h3 className="text-xl font-bold text-[#007a78] mt-8">Recent Interviews</h3>
                {interviews.length === 0 ? (
                  <div className="rounded-xl border border-[#11cd68]/20 p-12 bg-white text-center">
                    <Award className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                    <p className="text-black mb-4">No interviews yet</p>
                    <motion.button
                      onClick={() => router.push('/interview/realtime')}
                      className="px-6 py-2 rounded-lg bg-[#11cd68] text-white font-semibold"
                      whileHover={{ scale: 1.05 }}
                    >
                      Start First Interview
                    </motion.button>
                  </div>
                ) : (
                  <div className="grid gap-4">
                    {interviews.map((interview) => (
                      <motion.div
                        key={interview.id}
                        className="rounded-xl border border-[#11cd68]/20 p-6 bg-white shadow-sm hover:shadow-md"
                        whileHover={{ y: -2 }}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="font-bold text-[#007a78]">{interview.title || 'Interview'}</h3>
                            <p className="text-sm text-slate-600 mt-1">
                              {new Date(interview.created_at).toLocaleDateString()}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-2xl font-bold text-[#11cd68]">{interview.score || 0}</p>
                            <p className="text-xs text-slate-500">/100</p>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </motion.div>
            )}

            {/* AI Feedback Analysis */}
            {activeSection === 'feedback' && (
              <motion.div className="space-y-6" variants={itemVariants}>
                <h2 className="text-2xl font-bold text-[#007a78]">AI Feedback Analysis</h2>
                {interviews.length === 0 ? (
                  <div className="rounded-xl border border-[#11cd68]/20 p-12 bg-white text-center">
                    <BarChart3 className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                    <p className="text-black mb-4">No interviews completed yet</p>
                    <motion.button
                      onClick={() => router.push('/interview/realtime')}
                      className="px-6 py-2 rounded-lg bg-[#11cd68] text-white font-semibold"
                      whileHover={{ scale: 1.05 }}
                    >
                      Start Your First Interview
                    </motion.button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {interviews.map((interview) => (
                      <motion.div
                        key={interview.id}
                        className="rounded-xl border border-[#11cd68]/20 p-6 bg-white shadow-sm hover:shadow-md"
                        whileHover={{ y: -2 }}
                      >
                        <div className="flex items-start justify-between mb-4">
                          <div>
                            <h3 className="font-bold text-[#007a78]">{interview.title || 'Interview'}</h3>
                            <p className="text-sm text-slate-600">
                              {new Date(interview.created_at).toLocaleDateString()}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-2xl font-bold text-[#11cd68]">{interview.score || 0}</p>
                            <p className="text-xs text-slate-500">/100</p>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <p className="text-slate-600">Communication</p>
                            <div className="w-full bg-slate-200 rounded h-2 mt-1">
                              <div className="bg-[#11cd68] h-2 rounded" style={{ width: `${(interview.score || 0) * 0.8}%` }} />
                            </div>
                          </div>
                          <div>
                            <p className="text-slate-600">Technical</p>
                            <div className="w-full bg-slate-200 rounded h-2 mt-1">
                              <div className="bg-[#11cd68] h-2 rounded" style={{ width: `${(interview.score || 0) * 0.7}%` }} />
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </motion.div>
            )}

            {/* Progress Tracking */}
            {activeSection === 'progress' && (
              <motion.div className="space-y-6" variants={itemVariants}>
                <h2 className="text-2xl font-bold text-[#007a78]">Progress Tracking</h2>
                {stats.total === 0 ? (
                  <div className="rounded-xl border border-[#11cd68]/20 p-12 bg-white text-center">
                    <TrendingUp className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                    <p className="text-black mb-4">Start interviews to track your progress</p>
                    <motion.button
                      onClick={() => router.push('/interview/realtime')}
                      className="px-6 py-2 rounded-lg bg-[#11cd68] text-white font-semibold"
                      whileHover={{ scale: 1.05 }}
                    >
                      Start Interview
                    </motion.button>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <motion.div className="rounded-xl border border-[#11cd68]/20 p-6 bg-white" whileHover={{ y: -2 }}>
                        <p className="text-sm text-slate-600 mb-2">Overall Progress</p>
                        <p className="text-3xl font-bold text-[#11cd68]">{Math.round((stats.completed / stats.total) * 100)}%</p>
                      </motion.div>
                      <motion.div className="rounded-xl border border-[#11cd68]/20 p-6 bg-white" whileHover={{ y: -2 }}>
                        <p className="text-sm text-slate-600 mb-2">Average Improvement</p>
                        <p className="text-3xl font-bold text-[#007a78]">+{Math.round(stats.avgScore / 20)}%</p>
                      </motion.div>
                      <motion.div className="rounded-xl border border-[#11cd68]/20 p-6 bg-white" whileHover={{ y: -2 }}>
                        <p className="text-sm text-slate-600 mb-2">Streak</p>
                        <p className="text-3xl font-bold text-[#007a78]">{Math.floor(stats.completed / 5)} weeks</p>
                      </motion.div>
                    </div>
                    <motion.div className="rounded-xl border border-[#11cd68]/20 p-6 bg-white">
                      <h3 className="font-bold text-[#007a78] mb-4">Score Trend</h3>
                      <div className="space-y-2">
                        {interviews.slice(0, 5).map((interview, idx) => (
                          <div key={interview.id} className="flex items-center gap-4">
                            <span className="text-sm text-slate-600 w-12">#{idx + 1}</span>
                            <div className="flex-1 bg-slate-200 rounded h-2">
                              <div className="bg-[#11cd68] h-2 rounded" style={{ width: `${(interview.score || 0)}%` }} />
                            </div>
                            <span className="text-sm font-semibold text-[#007a78]">{interview.score || 0}</span>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  </div>
                )}
              </motion.div>
            )}

            {/* Resume Tools */}
            {activeSection === 'resume' && (
              <motion.div className="space-y-6" variants={itemVariants}>
                <h2 className="text-2xl font-bold text-[#007a78]">Resume Tools</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <motion.div
                    className="rounded-xl border border-[#11cd68]/20 p-6 bg-white hover:shadow-md cursor-pointer"
                    whileHover={{ y: -2 }}
                  >
                    <div className="w-12 h-12 rounded-lg bg-[#11cd68]/10 flex items-center justify-center mb-4">
                      <BarChart3 className="w-6 h-6 text-[#11cd68]" />
                    </div>
                    <h3 className="font-bold text-[#007a78] mb-2">Resume Analysis</h3>
                    <p className="text-sm text-slate-600">Get AI-powered feedback on your resume format and content</p>
                  </motion.div>
                  <motion.div
                    className="rounded-xl border border-[#11cd68]/20 p-6 bg-white hover:shadow-md cursor-pointer"
                    whileHover={{ y: -2 }}
                  >
                    <div className="w-12 h-12 rounded-lg bg-[#11cd68]/10 flex items-center justify-center mb-4">
                      <TrendingUp className="w-6 h-6 text-[#11cd68]" />
                    </div>
                    <h3 className="font-bold text-[#007a78] mb-2">Profile Optimization</h3>
                    <p className="text-sm text-slate-600">Optimize your professional profile for better visibility</p>
                  </motion.div>
                </div>
                <motion.div className="rounded-xl border border-[#11cd68]/20 p-8 bg-white text-center">
                  <Plus className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                  <p className="text-black mb-4">Upload your resume to get started</p>
                  <motion.button
                    className="px-6 py-2 rounded-lg bg-[#11cd68] text-white font-semibold"
                    whileHover={{ scale: 1.05 }}
                  >
                    Upload Resume
                  </motion.button>
                </motion.div>
              </motion.div>
            )}

            {/* Learning Resources */}
            {activeSection === 'resources' && (
              <motion.div className="space-y-6" variants={itemVariants}>
                <h2 className="text-2xl font-bold text-[#007a78]">Learning Resources</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <motion.div
                    className="rounded-xl border border-[#11cd68]/20 p-6 bg-white hover:shadow-md cursor-pointer"
                    whileHover={{ y: -2 }}
                  >
                    <div className="w-12 h-12 rounded-lg bg-[#007a78]/10 flex items-center justify-center mb-4">
                      <Brain className="w-6 h-6 text-[#007a78]" />
                    </div>
                    <h3 className="font-bold text-[#007a78] mb-2">Common Questions</h3>
                    <p className="text-sm text-slate-600">Learn answers to frequently asked interview questions</p>
                  </motion.div>
                  <motion.div
                    className="rounded-xl border border-[#11cd68]/20 p-6 bg-white hover:shadow-md cursor-pointer"
                    whileHover={{ y: -2 }}
                  >
                    <div className="w-12 h-12 rounded-lg bg-[#007a78]/10 flex items-center justify-center mb-4">
                      <Award className="w-6 h-6 text-[#007a78]" />
                    </div>
                    <h3 className="font-bold text-[#007a78] mb-2">Interview Tips</h3>
                    <p className="text-sm text-slate-600">Master the skills and techniques that impress recruiters</p>
                  </motion.div>
                  <motion.div
                    className="rounded-xl border border-[#11cd68]/20 p-6 bg-white hover:shadow-md cursor-pointer"
                    whileHover={{ y: -2 }}
                  >
                    <div className="w-12 h-12 rounded-lg bg-[#007a78]/10 flex items-center justify-center mb-4">
                      <TrendingUp className="w-6 h-6 text-[#007a78]" />
                    </div>
                    <h3 className="font-bold text-[#007a78] mb-2">Career Guides</h3>
                    <p className="text-sm text-slate-600">Navigate your career path with expert guidance</p>
                  </motion.div>
                  <motion.div
                    className="rounded-xl border border-[#11cd68]/20 p-6 bg-white hover:shadow-md cursor-pointer"
                    whileHover={{ y: -2 }}
                  >
                    <div className="w-12 h-12 rounded-lg bg-[#007a78]/10 flex items-center justify-center mb-4">
                      <Brain className="w-6 h-6 text-[#007a78]" />
                    </div>
                    <h3 className="font-bold text-[#007a78] mb-2">Skill Assessments</h3>
                    <p className="text-sm text-slate-600">Test your knowledge across different domains</p>
                  </motion.div>
                </div>
              </motion.div>
            )}

            {/* Certificates */}
            {activeSection === 'certificates' && (
              <motion.div className="space-y-6" variants={itemVariants}>
                <h2 className="text-2xl font-bold text-[#007a78]">Certificates & Achievements</h2>
                {stats.completed === 0 ? (
                  <div className="rounded-xl border border-[#11cd68]/20 p-12 bg-white text-center">
                    <Award className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                    <p className="text-black mb-4">Complete interviews to earn certificates</p>
                    <motion.button
                      onClick={() => router.push('/interview/realtime')}
                      className="px-6 py-2 rounded-lg bg-[#11cd68] text-white font-semibold"
                      whileHover={{ scale: 1.05 }}
                    >
                      Start Interview
                    </motion.button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {stats.completed >= 1 && (
                      <motion.div
                        className="rounded-xl border-2 border-[#11cd68] p-6 bg-gradient-to-br from-[#11cd68]/5 to-[#007a78]/5 hover:shadow-md"
                        whileHover={{ y: -2 }}
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="font-bold text-[#007a78] mb-1">Interview Champion</h3>
                            <p className="text-sm text-slate-600">Completed first interview</p>
                          </div>
                          <Award className="w-8 h-8 text-[#11cd68]" />
                        </div>
                      </motion.div>
                    )}
                    {stats.completed >= 5 && (
                      <motion.div
                        className="rounded-xl border-2 border-[#11cd68] p-6 bg-gradient-to-br from-[#11cd68]/5 to-[#007a78]/5 hover:shadow-md"
                        whileHover={{ y: -2 }}
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="font-bold text-[#007a78] mb-1">Persistence Winner</h3>
                            <p className="text-sm text-slate-600">Completed 5 interviews</p>
                          </div>
                          <Award className="w-8 h-8 text-[#11cd68]" />
                        </div>
                      </motion.div>
                    )}
                    {stats.avgScore >= 80 && (
                      <motion.div
                        className="rounded-xl border-2 border-[#11cd68] p-6 bg-gradient-to-br from-[#11cd68]/5 to-[#007a78]/5 hover:shadow-md"
                        whileHover={{ y: -2 }}
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="font-bold text-[#007a78] mb-1">Expert Interviewee</h3>
                            <p className="text-sm text-slate-600">Achieved 80+ average score</p>
                          </div>
                          <Award className="w-8 h-8 text-[#11cd68]" />
                        </div>
                      </motion.div>
                    )}
                    {stats.avgScore >= 90 && (
                      <motion.div
                        className="rounded-xl border-2 border-[#11cd68] p-6 bg-gradient-to-br from-[#11cd68]/5 to-[#007a78]/5 hover:shadow-md"
                        whileHover={{ y: -2 }}
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="font-bold text-[#007a78] mb-1">Master Interviewer</h3>
                            <p className="text-sm text-slate-600">Achieved 90+ average score</p>
                          </div>
                          <Award className="w-8 h-8 text-[#11cd68]" />
                        </div>
                      </motion.div>
                    )}
                  </div>
                )}
              </motion.div>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  )
}
