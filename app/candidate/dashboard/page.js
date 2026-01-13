'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/context/AuthContext'
import ProtectedRoute from '@/components/ProtectedRoute'
import Sidebar from '@/components/Sidebar'
import { BarChart3, Users, Award, TrendingUp, Brain, FileText, Plus, LayoutDashboard, Zap, Trophy, LogOut, User } from 'lucide-react'

function CandidateDashboardContent() {
  const router = useRouter()
  const { user: authUser, session: authSession, isAuthenticated, loading: authLoading, logout, role } = useAuth()
  const [candidate, setCandidate] = useState(null)
  const [interviews, setInterviews] = useState([])
  const [stats, setStats] = useState({ total: 0, avgScore: 0, completed: 0, nextSuggested: 'HR' })
  const [loading, setLoading] = useState(true)
  const [mounted, setMounted] = useState(false)
  const [activeSection, setActiveSection] = useState('dashboard')
  const [skillsData, setSkillsData] = useState([])
  const [selectedInterview, setSelectedInterview] = useState(null) // For interview detail modal

  // Get userId from authUser OR session OR localStorage
  let userId = authUser?.id
  if (!userId && authSession?.user?.id) {
    userId = authSession.user.id
  }
  if (!userId) {
    // Try to get from localStorage as fallback
    try {
      const stored = localStorage.getItem('auth_user')
      if (stored) {
        const parsedUser = JSON.parse(stored)
        userId = parsedUser.id
      }
    } catch (e) {}
  }

  console.log('[CandidateDashboard] Component rendered. authUser:', authUser?.id, 'userId:', userId, 'authLoading:', authLoading, 'isAuthenticated:', isAuthenticated)

  useEffect(() => {
    console.log('[CandidateDashboard] Mounted')
    setMounted(true)
  }, [])

  // Redirect if not authenticated after auth loading completes
  useEffect(() => {
    if (!authLoading && !userId && !isAuthenticated && !authUser && !authSession) {
      console.log('[CandidateDashboard] No authentication found, redirecting to login')
      router.replace('/auth/login')
    }
  }, [authLoading, userId, isAuthenticated, authUser, authSession, router])

  // Redirect if user is not a candidate
  useEffect(() => {
    if (!authLoading && role && role !== 'candidate') {
      console.log('[CandidateDashboard] User role is', role, ', not candidate. Redirecting to', role === 'recruiter' ? '/recruiter/dashboard' : role === 'business' ? '/business/dashboard' : '/auth/login')
      router.replace(role === 'recruiter' ? '/recruiter/dashboard' : role === 'business' ? '/business/dashboard' : '/auth/login')
    }
  }, [authLoading, role, router])
  // Load dashboard data
  useEffect(() => {
    console.log('[CandidateDashboard] Data load effect triggered. userId:', userId, 'mounted:', mounted, 'authLoading:', authLoading)
    if (userId && mounted && !authLoading) {
      console.log('[CandidateDashboard] Calling loadDashboard with userId:', userId)
      loadDashboard()
    } else {
      console.log('[CandidateDashboard] Waiting for conditions: userId=', !!userId, 'mounted=', mounted, 'authLoading=', authLoading)
    }
  }, [userId, mounted, authLoading])

  const loadDashboard = async () => {
    let interviewsData = [] // DECLARE OUTSIDE try-catch so it's accessible throughout
    
    try {
      if (!userId) {
        console.log('[CandidateDashboard] No userId, skipping load')
        setLoading(false)
        return
      }

      console.log('[CandidateDashboard] Starting load for userId:', userId)
      setLoading(true)

      // Show initial stats instantly
      setStats({
        total: 0,
        avgScore: 0,
        completed: 0,
        nextSuggested: 'HR'
      })

      // Load interviews first - use API instead of direct Supabase query
      try {
        console.log('[CandidateDashboard] Fetching interviews via API for userId:', userId)
        const apiUrl = `/api/interviews?userId=${userId}`
        console.log('[CandidateDashboard] API URL:', apiUrl)
        
        const response = await fetch(apiUrl)
        
        console.log('[CandidateDashboard] API Response status:', response.status)
        console.log('[CandidateDashboard] API Response ok:', response.ok)
        console.log('[CandidateDashboard] API Response headers:', {
          'content-type': response.headers.get('content-type'),
          'content-length': response.headers.get('content-length')
        })
        
        if (!response.ok) {
          console.error('[CandidateDashboard] API returned error status:', response.status)
          const errorText = await response.text()
          console.error('[CandidateDashboard] Error response body:', errorText)
          setInterviews([])
          return
        }
        
        const result = await response.json()

        console.log('[CandidateDashboard] Parsed API response:', JSON.stringify(result, null, 2))
        console.log('[CandidateDashboard] result.success:', result.success)
        console.log('[CandidateDashboard] result.data type:', typeof result.data)
        console.log('[CandidateDashboard] result.data is array:', Array.isArray(result.data))
        console.log('[CandidateDashboard] result.data length:', result.data?.length)

        // Check if we have data
        if (result.data && Array.isArray(result.data) && result.data.length > 0) {
          interviewsData = result.data // ASSIGN to outer-scoped variable
          console.log('[CandidateDashboard] ✅ SUCCESS: Loaded', interviewsData.length, 'interviews')
          
          // Log first interview as example
          if (interviewsData.length > 0) {
            console.log('[CandidateDashboard] First interview:', interviewsData[0])
          }
          
          // Set interviews state - THIS IS CRITICAL
          setInterviews(interviewsData)
          console.log('[CandidateDashboard] ✅ setInterviews() called, state should update')

          // Calculate stats
          const avgScore = Math.round(
            interviewsData.reduce((sum, i) => sum + (i.score || 0), 0) / interviewsData.length
          )
          const completed = interviewsData.filter(i => i.status === 'completed').length
          const types = ['HR', 'Technical', 'Behavioral', 'Role-based']
          
          const newStats = {
            total: interviewsData.length,
            avgScore: avgScore,
            completed: completed,
            nextSuggested: types[Math.floor(Math.random() * types.length)]
          }
          
          setStats(newStats)
          console.log('[CandidateDashboard] ✅ Stats updated:', newStats)
        } else if (result.data && Array.isArray(result.data) && result.data.length === 0) {
          console.log('[CandidateDashboard] API returned empty array')
          setInterviews([])
          setStats({ total: 0, avgScore: 0, completed: 0, nextSuggested: 'HR' })
        } else if (result.error) {
          console.error('[CandidateDashboard] API returned error:', result.error)
          setInterviews([])
          setStats({ total: 0, avgScore: 0, completed: 0, nextSuggested: 'HR' })
        } else {
          console.warn('[CandidateDashboard] Invalid API response structure')
          console.warn('[CandidateDashboard] result keys:', Object.keys(result))
          setInterviews([])
          setStats({ total: 0, avgScore: 0, completed: 0, nextSuggested: 'HR' })
        }
      } catch (interviewErr) {
        console.error('[CandidateDashboard] Exception loading interviews:', interviewErr.message)
        console.error('[CandidateDashboard] Full error:', interviewErr)
        setInterviews([])
        setStats({ total: 0, avgScore: 0, completed: 0, nextSuggested: 'HR' })
      } finally {
        setLoading(false)
      }

      // Load profile (non-blocking) - SKIP FOR NOW
      console.log('[CandidateDashboard] Skipping profile load for now')
      /*
      try {
        const { data: profileData, error: profileError } = await supabase
          .from('candidate_profiles')
          .select('*')
          .eq('id', userId)
          .maybeSingle()

        if (profileData) {
          console.log('[CandidateDashboard] Profile loaded')
          setCandidate(profileData)
        }
      } catch (profileErr) {
        console.warn('[CandidateDashboard] Exception loading profile (non-critical):', profileErr)
      }
      */

      // Extract skills from interviews and resume
      console.log('[CandidateDashboard] Extracting skills from interviews and resume...')
      
      // First, try to load resume skills if available
      let resumeSkillsData = []
      try {
        const resumeSkillsStr = localStorage.getItem('resumeSkillsSaved') || sessionStorage.getItem('resumeSkills')
        if (resumeSkillsStr) {
          const parsed = JSON.parse(resumeSkillsStr)
          if (parsed.skills && Array.isArray(parsed.skills)) {
            resumeSkillsData = parsed.skills.map(skill => ({
              name: skill,
              rating: 7,
              category: 'Technical',
              trend: 'stable',
              source: 'resume'
            }))
            console.log('[CandidateDashboard] Loaded resume skills:', resumeSkillsData)
          }
        }
      } catch (err) {
        console.log('[CandidateDashboard] No resume skills found:', err)
      }

      // Load role-based skills from interview setup
      let roleBasedSkills = []
      try {
        const setupData = localStorage.getItem('interviewSetupSaved') || sessionStorage.getItem('interviewSetup')
        if (setupData) {
          const { role } = JSON.parse(setupData)
          console.log('[CandidateDashboard] Interview role:', role)
          
          // Map roles to their required skills
          const roleSkillsMap = {
            'Software Engineer': ['Coding', 'Problem Solving', 'Data Structures', 'Algorithms', 'System Design', 'Communication'],
            'Frontend Developer': ['HTML5, CSS3, and JavaScript', 'Front-end frameworks (React, Angular, or Vue.js)', 'Problem-solving skills', 'UI/UX Design', 'Responsive Design', 'Communication'],
            'Backend Developer': ['Coding', 'Data Structures', 'Algorithms', 'Database Design', 'System Architecture', 'Problem Solving'],
            'Full Stack Developer': ['Coding', 'Frontend Skills', 'Backend Skills', 'Database', 'Problem Solving', 'Communication'],
            'Data Analyst': ['Data Analysis', 'SQL', 'Excel', 'Data Visualization', 'Statistical Analysis', 'Problem Solving'],
            'Data Scientist': ['Python', 'Machine Learning', 'Data Analysis', 'Statistics', 'Problem Solving', 'Communication'],
            'Product Manager': ['Communication', 'Leadership', 'Problem Solving', 'Analytical Thinking', 'Strategic Planning', 'Teamwork'],
            'UI/UX Designer': ['Design Thinking', 'Wireframing', 'Prototyping', 'User Research', 'Problem Solving', 'Communication'],
            'DevOps Engineer': ['Linux', 'Docker', 'Kubernetes', 'CI/CD', 'Cloud Platforms', 'Problem Solving'],
            'Business Analyst': ['Communication', 'Problem Solving', 'Data Analysis', 'Requirements Gathering', 'Strategic Thinking', 'Teamwork'],
            'Project Manager': ['Leadership', 'Communication', 'Organization', 'Problem Solving', 'Teamwork', 'Planning'],
            'HR Executive': ['Communication', 'Leadership', 'Recruitment', 'Employee Relations', 'Strategic Planning', 'Problem Solving'],
            'Marketing Manager': ['Communication', 'Strategic Thinking', 'Analytics', 'Creativity', 'Leadership', 'Problem Solving'],
            'Sales Executive': ['Communication', 'Negotiation', 'Problem Solving', 'Leadership', 'Teamwork', 'Customer Focus']
          }
          
          const skillsForRole = roleSkillsMap[role] || ['Communication', 'Problem Solving', 'Teamwork']
          roleBasedSkills = skillsForRole.map(skill => ({
            name: skill,
            rating: 0,
            category: ['Communication', 'Leadership', 'Teamwork', 'Negotiation', 'Strategic Planning', 'Strategic Thinking', 'Creativity', 'Customer Focus', 'Recruitment', 'Employee Relations'].includes(skill) ? 'Soft Skills' : 'Technical',
            trend: 'stable',
            source: 'role',
            mentioned: 0
          }))
          console.log('[CandidateDashboard] Role-based skills:', roleBasedSkills)
        }
      } catch (err) {
        console.log('[CandidateDashboard] No interview setup found:', err)
      }

      // Then extract skills from interviews
      const extractedSkills = {}
      
      if (interviewsData && interviewsData.length > 0) {
        console.log('[CandidateDashboard] Processing', interviewsData.length, 'interviews for skills')
        interviewsData.forEach(interview => {
          if (interview.skills && Array.isArray(interview.skills)) {
            console.log('[CandidateDashboard] Interview skills:', interview.skills)
            interview.skills.forEach(skill => {
              const skillName = typeof skill === 'string' ? skill : skill.name
              if (skillName) {
                if (!extractedSkills[skillName]) {
                  extractedSkills[skillName] = {
                    name: skillName,
                    ratings: [],
                    category: skill.category || 'Technical',
                    mentions: 0
                  }
                }
                extractedSkills[skillName].mentions++
                // Calculate rating based on score and how often skill is mentioned
                const skillScore = Math.round((interview.score || 0) * (interview.skills.length > 0 ? 1 : 0.5) / 10)
                extractedSkills[skillName].ratings.push(Math.max(1, Math.min(10, skillScore)))
              }
            })
          }
        })
        
        // Calculate average rating for each skill and prepare display data
        const interviewSkillsList = Object.values(extractedSkills)
          .map(skill => ({
            name: skill.name,
            rating: skill.ratings.length > 0 ? Math.round(skill.ratings.reduce((a, b) => a + b, 0) / skill.ratings.length) : 5,
            category: skill.category,
            trend: skill.mentions > 2 ? 'up' : skill.mentions > 1 ? 'stable' : 'neutral',
            mentions: skill.mentions,
            source: 'interview'
          }))
          .sort((a, b) => b.rating - a.rating)
        
        console.log('[CandidateDashboard] Extracted interview skills:', interviewSkillsList)
        
        // Merge role-based skills with interview performance
        // If role skill exists in interviews, update rating; otherwise keep role skill with 0 rating
        const mergedWithRoleSkills = roleBasedSkills.map(roleSkill => {
          const matchingInterview = interviewSkillsList.find(is => 
            is.name.toLowerCase() === roleSkill.name.toLowerCase()
          )
          return matchingInterview || roleSkill
        })
        
        // Add any interview skills that aren't in role-based list
        const additionalInterviewSkills = interviewSkillsList.filter(is =>
          !roleBasedSkills.find(rs => rs.name.toLowerCase() === is.name.toLowerCase())
        )
        
        // Combine resume and interview skills, prioritizing merged role+interview, then additional interviews
        const combinedSkills = [
          ...mergedWithRoleSkills.sort((a, b) => b.rating - a.rating),
          ...additionalInterviewSkills,
          ...resumeSkillsData.filter(rs => !mergedWithRoleSkills.find(rs2 => rs2.name.toLowerCase() === rs.name.toLowerCase()) && !additionalInterviewSkills.find(is => is.name.toLowerCase() === rs.name.toLowerCase()))
        ]
        .slice(0, 12) // Top 12 skills to show
        
        if (combinedSkills.length > 0) {
          console.log('[CandidateDashboard] Final combined skills with role mapping:', combinedSkills)
          setSkillsData(combinedSkills)
        } else if (roleBasedSkills.length > 0) {
          console.log('[CandidateDashboard] Using role-based skills as defaults')
          setSkillsData(roleBasedSkills.slice(0, 12))
        } else {
          console.log('[CandidateDashboard] No skills found, using defaults')
          setSkillsData([
            { name: 'Communication', rating: 6, category: 'Soft Skills', trend: 'stable', source: 'default' },
            { name: 'Problem Solving', rating: 7, category: 'Soft Skills', trend: 'up', source: 'default' },
            { name: 'Technical Skills', rating: 5, category: 'Technical', trend: 'neutral', source: 'default' }
          ])
        }
      } else if (roleBasedSkills.length > 0) {
        console.log('[CandidateDashboard] No interviews but have role-based skills')
        setSkillsData(roleBasedSkills.slice(0, 12))
      } else if (resumeSkillsData.length > 0) {
        console.log('[CandidateDashboard] No interviews or roles but have resume skills')
        setSkillsData(resumeSkillsData.slice(0, 12))
      } else {
        console.log('[CandidateDashboard] No interviews or resume skills, using defaults')
        setSkillsData([
          { name: 'Communication', rating: 6, category: 'Soft Skills', trend: 'stable', source: 'default' },
          { name: 'Problem Solving', rating: 7, category: 'Soft Skills', trend: 'up', source: 'default' },
          { name: 'Technical Skills', rating: 5, category: 'Technical', trend: 'neutral', source: 'default' }
        ])
      }
      
      console.log('[CandidateDashboard] Data loaded successfully - setting loading to false')
      setLoading(false)
    } catch (err) {
      console.error('[CandidateDashboard] Critical error:', err)
      setLoading(false)
      setInterviews([])
    }
  }

  if (!mounted) return null

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, path: '/candidate/dashboard' },
    { id: 'practice', label: 'Practice Types', icon: Zap, path: '/candidate/dashboard/practice' },
    { id: 'skills', label: 'Skills Map', icon: TrendingUp, path: '/candidate/dashboard/skills' },
    { id: 'resume', label: 'Resume Analysis', icon: FileText, path: '/candidate/dashboard/resume' },
    { id: 'certificates', label: 'Certificates', icon: Trophy, path: '/candidate/dashboard/certificates' },
    { id: 'profile', label: 'My Profile', icon: User, path: '/candidate/dashboard/profile' }
  ]

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-white to-cyan-50">
      {/* Left Sidebar Navigation */}
      <div className="fixed left-0 top-0 h-screen w-64 bg-gradient-to-b from-purple-600 to-cyan-500 text-white p-6 overflow-y-auto z-40 border-r border-purple-300/20">
        {/* Logo */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-cyan-400 flex items-center justify-center">
              <span className="text-white font-bold text-sm">X</span>
            </div>
            <h2 className="text-xl font-bold text-white">InterviewX</h2>
          </div>
          <p className="text-xs text-cyan-100 ml-10">Candidate Platform</p>
        </div>

        {/* Navigation Menu */}
        <nav className="space-y-2">
          {menuItems.map((item) => {
            const IconComponent = item.icon
            return (
              <button
                key={item.id}
                onClick={() => router.push(item.path)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all text-left group text-cyan-100 hover:bg-white/10`}
              >
                <IconComponent className={`w-5 h-5 transition-colors text-cyan-200 group-hover:text-white`} />
                <span className={`font-medium text-sm group-hover:text-white`}>{item.label}</span>
              </button>
            )
          })}
        </nav>

        {/* Logout Button */}
        <div className="absolute bottom-6 left-6 right-6 pt-6 border-t border-purple-300/20 space-y-4">
          <button
            onClick={() => {
              logout()
              router.push('/')
            }}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-cyan-100 hover:bg-red-500/20 transition-all duration-200 group"
          >
            <LogOut className="w-5 h-5 text-[#ff6b6b] group-hover:text-white transition-colors" />
            <span className="font-medium group-hover:text-white transition-colors text-sm">Logout</span>
          </button>
          <p className="text-xs text-cyan-100 text-center">© 2024 InterviewX</p>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="relative z-10 md:ml-64 pt-8 md:pt-8 pb-16 min-h-screen w-full">
        <div className="w-full px-4 sm:px-6 md:px-8 lg:px-12">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <p className="text-slate-600 text-lg">Loading dashboard...</p>
            </div>
          ) : (
            <>
              {/* Dashboard Section */}
              {activeSection === 'dashboard' && (
                <>
                  {/* Analytics Board - Performance Metrics */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 mb-12">
                    {/* Performance Trend Chart */}
                    <div className="lg:col-span-2 group relative overflow-hidden rounded-3xl p-8 backdrop-blur-xl bg-gradient-to-br from-slate-50/90 to-white/80 border border-white/60 hover:border-white/80 shadow-xl hover:shadow-2xl transition-all duration-300">
                      <div className="absolute inset-0 bg-gradient-to-br from-cyan-400/5 via-transparent to-purple-400/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                      
                      <div className="relative z-10">
                        <div className="flex items-center justify-between mb-6">
                          <div>
                            <h3 className="text-2xl font-bold text-slate-900">Performance Trend</h3>
                            <p className="text-sm text-slate-600 mt-1">Your interview scores over time</p>
                          </div>
                          <div className="text-4xl opacity-30">📈</div>
                        </div>

                        {/* Chart Visualization */}
                        <div className="relative h-64 mt-6">
                          <svg className="w-full h-full" viewBox="0 0 400 200" preserveAspectRatio="xMidYMid meet">
                            {/* Grid Lines */}
                            {[0, 1, 2, 3, 4].map((i) => (
                              <line key={`grid-h-${i}`} x1="40" y1={40 + i * 40} x2="390" y2={40 + i * 40} stroke="#e2e8f0" strokeWidth="1" strokeDasharray="4" />
                            ))}
                            {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
                              <line key={`grid-v-${i}`} x1={40 + i * 50} y1="30" x2={40 + i * 50} y2="170" stroke="#e2e8f0" strokeWidth="1" strokeDasharray="4" />
                            ))}

                            {/* Y-axis labels */}
                            <text x="20" y="175" fontSize="12" fill="#94a3b8" textAnchor="end">0</text>
                            <text x="20" y="135" fontSize="12" fill="#94a3b8" textAnchor="end">25</text>
                            <text x="20" y="95" fontSize="12" fill="#94a3b8" textAnchor="end">50</text>
                            <text x="20" y="55" fontSize="12" fill="#94a3b8" textAnchor="end">75</text>
                            <text x="20" y="35" fontSize="12" fill="#94a3b8" textAnchor="end">100</text>

                            {/* Axes */}
                            <line x1="40" y1="170" x2="390" y2="170" stroke="#cbd5e1" strokeWidth="2" />
                            <line x1="40" y1="30" x2="40" y2="170" stroke="#cbd5e1" strokeWidth="2" />

                            {/* Data line - dynamic based on interview scores */}
                            {interviews.length > 0 ? (
                              <>
                                <polyline
                                  points={interviews.slice(-8).map((interview, idx) => {
                                    const x = 40 + (idx / Math.max(7, interviews.length - 1)) * 350
                                    const y = 170 - (interview.score || 0) * 1.4
                                    return `${x},${y}`
                                  }).join(' ')}
                                  fill="none"
                                  stroke="url(#lineGradient)"
                                  strokeWidth="3"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                />
                                {/* Data points */}
                                {interviews.slice(-8).map((interview, idx) => {
                                  const x = 40 + (idx / Math.max(7, interviews.length - 1)) * 350
                                  const y = 170 - (interview.score || 0) * 1.4
                                  return (
                                    <circle key={`point-${idx}`} cx={x} cy={y} r="4" fill="#06b6d4" stroke="#ffffff" strokeWidth="2" />
                                  )
                                })}
                                <defs>
                                  <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                                    <stop offset="0%" stopColor="#06b6d4" />
                                    <stop offset="100%" stopColor="#a855f7" />
                                  </linearGradient>
                                </defs>
                              </>
                            ) : (
                              <text x="200" y="100" fontSize="14" fill="#94a3b8" textAnchor="middle" dominantBaseline="middle">
                                Complete an interview to see your progress
                              </text>
                            )}
                          </svg>
                        </div>

                        <div className="mt-6 flex items-center gap-6 text-sm">
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-gradient-to-r from-cyan-500 to-purple-500" />
                            <span className="text-slate-600">Score Progression</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-cyan-600 font-semibold">{interviews.length} interviews</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Key Metrics Card */}
                    <div className="group relative overflow-hidden rounded-3xl p-8 backdrop-blur-xl bg-gradient-to-br from-pink-500/10 to-red-500/5 border border-pink-400/20 hover:border-pink-400/50 shadow-xl hover:shadow-2xl transition-all duration-300">
                      <div className="absolute inset-0 bg-gradient-to-br from-pink-400/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                      <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-pink-400/10 rounded-full blur-3xl opacity-0 group-hover:opacity-30 transition-opacity" />
                      
                      <div className="relative z-10 space-y-6">
                        <div>
                          <h3 className="text-2xl font-bold text-slate-900 mb-1">Interviews</h3>
                          <p className="text-sm text-slate-600">Completed</p>
                          <p className="text-5xl font-bold text-pink-600 mt-3">{stats.completed}</p>
                          <p className="text-xs text-slate-500 mt-2">of {stats.total} total</p>
                        </div>

                        <div className="relative h-2 bg-slate-200 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-gradient-to-r from-pink-500 to-red-500 rounded-full transition-all duration-500"
                            style={{ width: `${stats.total > 0 ? (stats.completed / stats.total) * 100 : 0}%` }}
                          />
                        </div>

                        <div className="pt-4 border-t border-slate-200 space-y-4">
                          <div>
                            <p className="text-xs text-slate-600 uppercase tracking-wider font-semibold mb-2">Highest Score</p>
                            <p className="text-3xl font-bold text-emerald-600">
                              {interviews.length > 0 ? Math.max(...interviews.map(i => i.score || 0)) : 0}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-slate-600 uppercase tracking-wider font-semibold mb-2">Current Avg</p>
                            <p className="text-3xl font-bold text-cyan-600">{stats.avgScore}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Interview History */}
                  {interviews.length > 0 && (
                    <div className="mb-12">
                      <div className="flex items-center justify-between mb-6">
                        <div>
                          <h2 className="text-2xl font-bold text-slate-900">Recent Interviews</h2>
                          <p className="text-slate-600 text-sm mt-1">Showing {Math.min(6, interviews.length)} of {interviews.length} interviews</p>
                        </div>
                        <button 
                          onClick={() => setActiveSection('history')}
                          className="px-6 py-2 bg-gradient-to-r from-purple-500 to-cyan-400 text-white rounded-lg font-semibold hover:shadow-lg transition-all text-sm"
                        >
                          View All →
                        </button>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {interviews.slice(0, 6).map((interview) => (
                          <div 
                            key={interview.id} 
                            onClick={() => setSelectedInterview(interview)}
                            className="rounded-3xl p-6 backdrop-blur-xl bg-white/50 border border-white/60 hover:border-cyan-300/50 shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer group"
                          >
                            <div className="flex items-center justify-between mb-3">
                              <h3 className="font-bold text-slate-900">{interview.title || 'Interview'}</h3>
                              <p className="text-2xl font-bold text-cyan-500">{interview.score || 0}</p>
                            </div>
                            <p className="text-sm text-slate-600 mb-4">{new Date(interview.created_at).toLocaleDateString()}</p>
                            <div className="w-full bg-slate-200 rounded-full h-2 mb-3">
                              <div className="bg-gradient-to-r from-purple-500 to-cyan-400 h-2 rounded-full" style={{ width: `${interview.score || 0}%` }} />
                            </div>
                            <p className="text-xs text-cyan-600 font-semibold group-hover:text-cyan-700">👆 Click for details</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Your Skills */}
                  {skillsData.length > 0 && (
                    <div>
                      <div className="mb-8">
                        <h2 className="text-3xl font-bold text-slate-900 mb-2">Your Skills</h2>
                        <p className="text-slate-600">Track your performance across key abilities</p>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                        {skillsData.map((skill) => (
                          <div key={skill.name} className="group relative overflow-hidden rounded-xl p-5 backdrop-blur-xl bg-white/40 border border-white/60 hover:border-white/80 hover:bg-white/60 shadow-md hover:shadow-xl transition-all duration-300">
                            <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                            <div className="relative z-10">
                              <div className="flex items-start justify-between mb-3">
                                <div className="flex-1">
                                  <p className="font-semibold text-slate-900 text-sm">{skill.name}</p>
                                  <p className="text-xs text-slate-600 mt-1">
                                    {skill.mentions ? `${skill.mentions} interview${skill.mentions !== 1 ? 's' : ''}` : 'Role-based'}
                                  </p>
                                </div>
                                <span className="text-lg font-bold text-cyan-600 ml-2">{skill.rating}</span>
                              </div>
                              <div className="w-full bg-slate-200 rounded-full h-2 mb-3">
                                <div 
                                  className="h-full bg-gradient-to-r from-cyan-500 to-blue-600 rounded-full transition-all duration-500"
                                  style={{ width: `${(skill.rating / 10) * 100}%` }} 
                                />
                              </div>
                              <div className="flex items-center justify-between text-xs">
                                <span className="text-slate-500">{skill.category}</span>
                                <span className={`font-semibold ${
                                  skill.trend === 'up' ? 'text-emerald-600' : 
                                  skill.trend === 'down' ? 'text-red-600' : 
                                  'text-slate-600'
                                }`}>
                                  {skill.trend === 'up' && '↑ Improving'}
                                  {skill.trend === 'down' && '↓ Needs Work'}
                                  {skill.trend === 'stable' && '→ Stable'}
                                  {!skill.trend && '○ New'}
                                </span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* Practice Section */}
              {activeSection === 'practice' && (
                <div className="space-y-6">
                  <div className="mb-8">
                    <h2 className="text-3xl font-bold text-slate-900 mb-2">Practice Interview Types</h2>
                    <p className="text-slate-600">Choose an interview type and practice to improve your skills</p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {[
                      { type: 'HR', icon: '👤', color: 'blue', desc: 'Focus on communication and interpersonal skills' },
                      { type: 'Technical', icon: '💻', color: 'purple', desc: 'Test your technical knowledge and problem-solving' },
                      { type: 'Behavioral', icon: '🎯', color: 'emerald', desc: 'Practice situational and competency-based questions' },
                      { type: 'Role-based', icon: '🚀', color: 'cyan', desc: 'Prepare for role-specific requirements' }
                    ].map(({ type, icon, color, desc }) => {
                      const colorClasses = {
                        blue: 'from-blue-500/10 to-blue-600/5 border-blue-400/20 hover:border-blue-400/50',
                        purple: 'from-purple-500/10 to-purple-600/5 border-purple-400/20 hover:border-purple-400/50',
                        emerald: 'from-emerald-500/10 to-emerald-600/5 border-emerald-400/20 hover:border-emerald-400/50',
                        cyan: 'from-cyan-500/10 to-cyan-600/5 border-cyan-400/20 hover:border-cyan-400/50'
                      }
                      return (
                        <div key={type} className={`group relative overflow-hidden rounded-2xl p-8 backdrop-blur-xl bg-gradient-to-br ${colorClasses[color]} shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:scale-105 cursor-pointer`} onClick={() => router.push('/interview/realtime')}>
                          <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                          <div className="relative z-10">
                            <div className="text-5xl mb-4">{icon}</div>
                            <h3 className="text-2xl font-bold text-slate-900 mb-2">{type} Interview</h3>
                            <p className="text-slate-600 mb-6 text-sm leading-relaxed">{desc}</p>
                            <button className="w-full py-3 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-semibold hover:shadow-lg transition-all duration-300 transform group-hover:scale-110">
                              Start Practice →
                            </button>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Skills Map Section */}
              {activeSection === 'skills' && (
                <div className="space-y-6">
                  <div className="mb-8">
                    <h2 className="text-3xl font-bold text-slate-900 mb-2">Skills Assessment</h2>
                    <p className="text-slate-600">Track your skill development across all interviews</p>
                  </div>
                  <div className="rounded-2xl p-8 backdrop-blur-xl bg-white/40 border border-white/60 shadow-lg">
                    <div className="space-y-6">
                      {skillsData.map((skill) => (
                        <div key={skill.name} className="group relative overflow-hidden rounded-lg p-6 bg-gradient-to-r from-white/40 to-white/20 hover:from-white/60 hover:to-white/40 border border-white/50 hover:border-white/70 transition-all duration-300">
                          <div className="absolute inset-0 bg-gradient-to-r from-cyan-400/5 via-transparent to-purple-400/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                          <div className="relative z-10">
                            <div className="flex items-center justify-between mb-4">
                              <div className="flex-1 min-w-0">
                                <p className="font-bold text-slate-900 text-lg">{skill.name}</p>
                                <p className="text-sm text-slate-600 mt-1">
                                  {skill.mentions ? `${skill.mentions} interview${skill.mentions !== 1 ? 's' : ''} completed` : 'Based on your role'}
                                  {skill.trend && skill.trend !== 'neutral' && (
                                    <span className="ml-3 font-semibold">
                                      {skill.trend === 'up' && '↑ Improving'}
                                      {skill.trend === 'stable' && '→ Stable'}
                                      {skill.trend === 'down' && '↓ Needs Work'}
                                    </span>
                                  )}
                                </p>
                              </div>
                              <p className={`text-2xl font-bold ml-4 ${
                                skill.rating >= 8 ? 'text-emerald-600' :
                                skill.rating >= 6 ? 'text-cyan-600' :
                                skill.rating >= 4 ? 'text-yellow-600' : 'text-red-600'
                              }`}>{skill.rating}/10</p>
                            </div>
                            <div className="flex items-center gap-3">
                              <div className="flex-1 bg-slate-200 rounded-full h-3 overflow-hidden">
                                <div 
                                  className={`h-full rounded-full transition-all duration-500 bg-gradient-to-r ${
                                    skill.rating >= 8 ? 'from-emerald-500 to-emerald-600' :
                                    skill.rating >= 6 ? 'from-cyan-500 to-blue-600' :
                                    skill.rating >= 4 ? 'from-yellow-500 to-orange-500' : 'from-red-500 to-red-600'
                                  }`}
                                  style={{ width: `${(skill.rating / 10) * 100}%` }} 
                                />
                              </div>
                              <span className="text-xs font-semibold text-slate-500 whitespace-nowrap">{skill.category}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Interview History Section */}
              {activeSection === 'history' && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between mb-8">
                    <div>
                      <h2 className="text-3xl font-bold text-slate-900">Interview History</h2>
                      <p className="text-slate-600 mt-2">Total interviews completed: <span className="font-bold text-cyan-600">{interviews.length || stats.total}</span></p>
                    </div>
                    <button 
                      onClick={() => setActiveSection('dashboard')}
                      className="px-6 py-2 rounded-lg bg-gradient-to-r from-slate-100 to-slate-50 hover:from-slate-200 hover:to-slate-100 text-slate-900 font-semibold transition-all flex items-center gap-2 shadow-md"
                    >
                      ← Back
                    </button>
                  </div>
                  {interviews.length === 0 && stats.total === 0 ? (
                    <div className="rounded-3xl p-12 backdrop-blur-xl bg-white/50 border border-white/60 text-center shadow-lg">
                      <Award className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                      <p className="text-slate-600 mb-6">No interviews yet</p>
                      <button onClick={() => router.push('/interview/realtime')} className="px-8 py-3 bg-gradient-to-r from-purple-500 to-cyan-400 border border-purple-400 text-white rounded-xl hover:bg-cyan-500 transition-all font-semibold">
                        Start Your First Interview
                      </button>
                    </div>
                  ) : interviews.length === 0 && stats.total > 0 ? (
                    <div className="rounded-3xl p-8 backdrop-blur-xl bg-yellow-50 border border-yellow-200 text-center shadow-lg">
                      <div className="text-yellow-600 font-semibold mb-2">⚠️ Loading interviews...</div>
                      <p className="text-slate-600">We found {stats.total} completed interviews. Refresh the page if they don't appear.</p>
                      
                      {/* Debug info */}
                      <div className="mt-4 p-3 bg-white/70 rounded-lg text-left text-xs text-slate-600 font-mono border border-yellow-300">
                        <div>State Debug:</div>
                        <div>interviews.length: {interviews.length}</div>
                        <div>stats.total: {stats.total}</div>
                        <div>loading: {String(loading)}</div>
                      </div>
                      
                      <button 
                        onClick={() => {
                          console.log('[Dashboard] 🔄 Manually reloading interviews...')
                          console.log('[Dashboard] Current state - interviews:', interviews.length, 'stats.total:', stats.total)
                          loadDashboard()
                        }} 
                        className="mt-4 px-6 py-2 bg-gradient-to-r from-yellow-500 to-orange-400 text-white rounded-xl font-semibold hover:shadow-lg transition-all">
                        🔄 Refresh Interviews
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 gap-4">
                      {interviews.map((interview) => (
                        <div 
                          key={interview.id} 
                          onClick={() => setSelectedInterview(interview)}
                          className="group relative overflow-hidden rounded-2xl p-6 backdrop-blur-xl bg-gradient-to-br from-white/60 to-white/40 border border-white/70 hover:border-cyan-300/50 shadow-lg hover:shadow-2xl transition-all duration-300 cursor-pointer transform hover:scale-102"
                        >
                          <div className="absolute inset-0 bg-gradient-to-br from-cyan-400/5 via-transparent to-purple-400/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                          
                          <div className="relative z-10 flex items-center justify-between gap-6">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-3 mb-2">
                                <h3 className="font-bold text-slate-900 text-lg truncate">{interview.title || 'Interview'}</h3>
                                {interview.interview_type === 'practice' && (
                                  <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-bold rounded-full whitespace-nowrap">📝 Practice</span>
                                )}
                              </div>
                              <p className="text-sm text-slate-600">
                                📅 {new Date(interview.created_at).toLocaleDateString()} at {new Date(interview.created_at).toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'})}
                              </p>
                              {interview.analysis && (
                                <p className="text-xs text-cyan-600 font-semibold mt-2 group-hover:text-cyan-700">
                                  👆 Click to view detailed analysis
                                </p>
                              )}
                            </div>
                            <div className="text-right flex-shrink-0">
                              <div className="inline-flex flex-col items-center">
                                <p className={`text-3xl font-bold ${
                                  interview.score >= 80 ? 'text-emerald-500' :
                                  interview.score >= 60 ? 'text-cyan-500' :
                                  interview.score >= 40 ? 'text-yellow-500' : 'text-red-500'
                                }`}>{interview.score || 0}</p>
                                <p className="text-xs text-slate-600">/100</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Resume Analysis Section */}
              {activeSection === 'resume' && (
                <div className="space-y-6">
                  <div className="mb-8">
                    <h2 className="text-3xl font-bold text-slate-900 mb-2">Resume Tools</h2>
                    <p className="text-slate-600">Improve your resume and career documents</p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="group relative overflow-hidden rounded-2xl p-8 backdrop-blur-xl bg-gradient-to-br from-emerald-500/10 to-emerald-600/5 border border-emerald-400/20 hover:border-emerald-400/50 shadow-lg hover:shadow-2xl transition-all duration-300 text-center cursor-pointer transform hover:scale-105">
                      <div className="absolute inset-0 bg-gradient-to-br from-emerald-400/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                      <div className="relative z-10">
                        <FileText className="w-12 h-12 text-emerald-500 mx-auto mb-4" />
                        <h3 className="font-bold text-slate-900 mb-2 text-lg">Resume Analysis</h3>
                        <p className="text-slate-600 mb-6">Get AI-powered feedback on your resume format and content</p>
                        <button className="px-6 py-2 bg-gradient-to-r from-purple-500 to-cyan-400 border border-purple-400 text-white rounded-xl hover:bg-cyan-500 transition-all font-semibold">
                          Upload Resume
                        </button>
                      </div>
                    </div>
                    <div className="rounded-3xl p-8 backdrop-blur-xl bg-white/50 border border-white/60 hover:border-white/80 shadow-lg hover:shadow-xl transition-all text-center cursor-pointer">
                      <TrendingUp className="w-12 h-12 text-emerald-500 mx-auto mb-4" />
                      <h3 className="font-bold text-slate-900 mb-2">Profile Optimization</h3>
                      <p className="text-slate-600 mb-6">Optimize your professional profile for better visibility</p>
                      <button className="px-6 py-2 bg-gradient-to-r from-purple-500 to-cyan-400 border border-purple-400 text-white rounded-xl hover:bg-cyan-500 transition-all font-semibold">
                        View Tips
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Certificates Section */}
              {activeSection === 'certificates' && (
                <div className="space-y-6">
                  <h2 className="text-2xl font-bold text-slate-900">Certificates & Achievements</h2>
                  {stats.completed === 0 ? (
                    <div className="rounded-3xl p-12 backdrop-blur-xl bg-white/50 border border-white/60 text-center shadow-lg">
                      <Award className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                      <p className="text-slate-600 mb-6">Complete interviews to earn certificates</p>
                      <button onClick={() => router.push('/interview/realtime')} className="px-8 py-3 bg-gradient-to-r from-purple-500 to-cyan-400 border border-purple-400 text-white rounded-xl hover:bg-cyan-500 transition-all font-semibold">
                        Start Interview
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {stats.completed >= 1 && (
                        <div className="rounded-3xl border-2 border-cyan-400 p-8 bg-gradient-to-br from-purple-500/5 to-cyan-500/5 shadow-lg hover:shadow-xl transition-all">
                          <div className="flex items-center gap-4">
                            <Award className="w-12 h-12 text-cyan-500" />
                            <div>
                              <h3 className="font-bold text-slate-900">Interview Champion</h3>
                              <p className="text-sm text-slate-600">Completed first interview</p>
                            </div>
                          </div>
                        </div>
                      )}
                      {stats.completed >= 5 && (
                        <div className="rounded-3xl border-2 border-cyan-400 p-8 bg-gradient-to-br from-purple-500/5 to-cyan-500/5 shadow-lg hover:shadow-xl transition-all">
                          <div className="flex items-center gap-4">
                            <Award className="w-12 h-12 text-cyan-500" />
                            <div>
                              <h3 className="font-bold text-slate-900">Persistence Winner</h3>
                              <p className="text-sm text-slate-600">Completed 5 interviews</p>
                            </div>
                          </div>
                        </div>
                      )}
                      {stats.avgScore >= 80 && (
                        <div className="rounded-3xl border-2 border-cyan-400 p-8 bg-gradient-to-br from-purple-500/5 to-cyan-500/5 shadow-lg hover:shadow-xl transition-all">
                          <div className="flex items-center gap-4">
                            <Award className="w-12 h-12 text-cyan-500" />
                            <div>
                              <h3 className="font-bold text-slate-900">Expert Interviewee</h3>
                              <p className="text-sm text-slate-600">Achieved 80+ average score</p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Interview Detail Modal */}
      {selectedInterview && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-3xl font-bold text-slate-900">{selectedInterview.title || 'Interview'}</h2>
                <p className="text-slate-600 mt-2">{new Date(selectedInterview.created_at).toLocaleDateString()} at {new Date(selectedInterview.created_at).toLocaleTimeString()}</p>
              </div>
              <button
                onClick={() => setSelectedInterview(null)}
                className="text-2xl text-slate-600 hover:text-slate-900"
              >
                ✕
              </button>
            </div>

            {/* Overall Score */}
            <div className="mb-8 p-6 bg-gradient-to-r from-purple-500/10 to-cyan-500/10 rounded-2xl border border-purple-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600 font-semibold">Overall Score</p>
                  <p className="text-4xl font-bold text-emerald-500 mt-2">{selectedInterview.score || 0}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-slate-600 font-semibold">Interview Type</p>
                  <p className="text-lg font-bold text-slate-900 mt-2">
                    {selectedInterview.interview_type === 'practice' ? '📝 Practice' : '🎯 Real'}
                  </p>
                </div>
              </div>
            </div>

            {/* Analysis Details */}
            {selectedInterview.analysis ? (
              <div className="space-y-6">
                {/* Key Metrics */}
                <div>
                  <h3 className="text-xl font-bold text-slate-900 mb-4">Performance Metrics</h3>
                  <div className="grid grid-cols-2 gap-4">
                    {[
                      { label: 'Job Suitability', value: selectedInterview.analysis.jobSuitability },
                      { label: 'Accomplishments', value: selectedInterview.analysis.relevantAccomplishments },
                      { label: 'Initiative & Drive', value: selectedInterview.analysis.driveInitiative },
                      { label: 'Problem Solving', value: selectedInterview.analysis.problemSolving },
                      { label: 'Culture Fit', value: selectedInterview.analysis.cultureScopes },
                      { label: 'Leadership', value: selectedInterview.analysis.leadershipInfluence }
                    ].map((metric, i) => (
                      <div key={i} className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                        <p className="text-sm text-slate-600 font-semibold">{metric.label}</p>
                        <p className="text-2xl font-bold text-cyan-500 mt-2">{metric.value || 0}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Summary */}
                {selectedInterview.analysis.summary && (
                  <div>
                    <h3 className="text-xl font-bold text-slate-900 mb-3">Summary</h3>
                    <p className="text-slate-700 leading-relaxed">{selectedInterview.analysis.summary}</p>
                  </div>
                )}

                {/* Strengths */}
                {selectedInterview.analysis.strengths && selectedInterview.analysis.strengths.length > 0 && (
                  <div>
                    <h3 className="text-xl font-bold text-slate-900 mb-3">💪 Strengths</h3>
                    <ul className="space-y-2">
                      {selectedInterview.analysis.strengths.map((strength, i) => (
                        <li key={i} className="flex items-start gap-3 text-slate-700">
                          <span className="text-green-500 font-bold mt-1">✓</span>
                          <span>{strength}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Weaknesses & Areas to Work On */}
                {selectedInterview.analysis.weaknesses && selectedInterview.analysis.weaknesses.length > 0 && (
                  <div>
                    <h3 className="text-xl font-bold text-slate-900 mb-3">🎯 Areas to Work On</h3>
                    <ul className="space-y-2">
                      {selectedInterview.analysis.weaknesses.map((weakness, i) => (
                        <li key={i} className="flex items-start gap-3 text-slate-700">
                          <span className="text-orange-500 font-bold mt-1">→</span>
                          <span>{weakness}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Recommendation */}
                {selectedInterview.analysis.recommendation && (
                  <div className="p-4 bg-blue-50 rounded-xl border border-blue-200">
                    <p className="text-sm text-blue-600 font-semibold">Hiring Recommendation</p>
                    <p className="text-lg font-bold text-blue-900 mt-2 capitalize">{selectedInterview.analysis.recommendation}</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="p-6 bg-yellow-50 rounded-2xl border border-yellow-200 text-center">
                <p className="text-yellow-800">Analysis data not yet available for this interview</p>
              </div>
            )}

            <button
              onClick={() => setSelectedInterview(null)}
              className="mt-8 w-full px-6 py-3 bg-gradient-to-r from-purple-500 to-cyan-400 text-white rounded-xl font-semibold hover:shadow-lg transition-all"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default function CandidateDashboard() {
  return (
    <ProtectedRoute requiredRole="candidate">
      <CandidateDashboardContent />
    </ProtectedRoute>
  )
}
