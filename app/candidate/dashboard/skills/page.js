'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/context/AuthContext'
import CandidateSidebar from '@/components/CandidateSidebar'
import DashboardBreadcrumb from '@/components/DashboardBreadcrumb'
import { TrendingUp, Award, Target } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function SkillsMapPage() {
  const router = useRouter()
  const { user: authUser, session: authSession } = useAuth()
  const [skills, setSkills] = useState([])
  const [loading, setLoading] = useState(true)
  const [userId, setUserId] = useState(null)
  const [totalInterviewCount, setTotalInterviewCount] = useState(0)

  useEffect(() => {
    // Get userId from auth
    let user_id = authUser?.id
    if (!user_id && authSession?.user?.id) {
      user_id = authSession.user.id
    }
    if (!user_id) {
      try {
        const stored = localStorage.getItem('auth_user')
        if (stored) {
          const parsed = JSON.parse(stored)
          user_id = parsed.id
        }
      } catch (e) {}
    }
    
    if (user_id) {
      setUserId(user_id)
      loadSkills(user_id)
    } else {
      setLoading(false)
    }
  }, [authUser?.id, authSession?.user?.id])

  const loadSkills = async (userId) => {
    try {
      console.log('[SkillsMap] Loading interviews for userId:', userId)
      
      // Fetch all interviews for this user
      const response = await fetch(`/api/interviews?userId=${userId}`)
      const result = await response.json()
      
      if (!result.success || !result.data) {
        console.log('[SkillsMap] No interviews found')
        setSkills([])
        setLoading(false)
        return
      }

      const interviews = result.data
      console.log('[SkillsMap] Found', interviews.length, 'interviews')
      
      // Store total interview count
      setTotalInterviewCount(interviews.length)      // Extract and aggregate skills from all interviews
      const skillsMap = {}
      
      // Default skills to track if not in interview data
      const defaultSkills = ['Communication', 'Teamwork', 'Problem Solving', 'Coding', 'Data Structures', 'Algorithms']
      
      interviews.forEach(interview => {
        const interviewScore = interview.score || 0
        
        // Use skills from interview if available, otherwise use default skills
        const skillsToProcess = (interview.skills && Array.isArray(interview.skills) && interview.skills.length > 0) 
          ? interview.skills 
          : defaultSkills.map(name => ({ name, category: 'Technical' }))
        
        skillsToProcess.forEach(skill => {
          const skillName = typeof skill === 'string' ? skill : skill.name
          const skillCategory = skill.category || 'Technical'
          
          if (skillName) {
            if (!skillsMap[skillName]) {
              skillsMap[skillName] = {
                name: skillName,
                category: skillCategory,
                ratings: [],
                interviewIds: [],
                previousRatings: []
              }
            }
            // Use interview score if available, otherwise assign default rating of 5
            skillsMap[skillName].ratings.push(interviewScore || 5)
            skillsMap[skillName].interviewIds.push(interview.id)
          }
        })
      })

      console.log('[SkillsMap] Skills found:', Object.keys(skillsMap))

      // Calculate metrics for each skill
      const skillsList = Object.values(skillsMap).map(skill => {
        // Convert scores (0-100) to rating (1-10) by dividing by 10, then average
        const convertedRatings = skill.ratings.map(score => Math.round((score || 0) / 10))
        const avgRating = convertedRatings.length > 0 
          ? Math.round(convertedRatings.reduce((a, b) => a + b, 0) / convertedRatings.length)
          : 5
        
        const recentRatings = convertedRatings.slice(-3)
        const olderRatings = convertedRatings.slice(0, -3)
        const recentAvg = recentRatings.length > 0 ? recentRatings.reduce((a, b) => a + b, 0) / recentRatings.length : 0
        const olderAvg = olderRatings.length > 0 ? olderRatings.reduce((a, b) => a + b, 0) / olderRatings.length : 0
        
        // Determine trend based on recent vs older performance
        let trend = 'stable'
        if (convertedRatings.length > 1) {
          if (recentAvg > olderAvg + 1) {
            trend = 'up'
          } else if (recentAvg < olderAvg - 1) {
            trend = 'down'
          } else {
            trend = 'stable'
          }
        }

        return {
          name: skill.name,
          rating: avgRating,
          category: skill.category,
          trend: trend,
          interviews: skill.interviewIds.length,
          scores: skill.ratings
        }
      }).sort((a, b) => b.interviews - a.interviews)

      console.log('[SkillsMap] Processed skills:', skillsList)
      setSkills(skillsList)
    } catch (err) {
      console.error('[SkillsMap] Error loading skills:', err)
      setSkills([])
    } finally {
      setLoading(false)
    }
  }

  const technicalSkills = skills.filter(s => s.category === 'Technical')
  const softSkills = skills.filter(s => s.category === 'Soft Skills')
  const averageRating = skills.length > 0 
    ? (skills.reduce((sum, s) => sum + s.rating, 0) / skills.length).toFixed(1)
    : 0
  
  // Use actual interview count, not aggregated from skills
  const totalInterviews = totalInterviewCount
  const improvingSkills = skills.filter(s => s.trend === 'up').length

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-white to-cyan-50 flex items-center justify-center">
        <p className="text-slate-600">Loading skills...</p>
      </div>
    )
  }

  if (skills.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-white to-cyan-50">
        <CandidateSidebar />
        <div className="ml-64 pt-8 pb-16">
          <div className="px-8 lg:px-12">
            <div className="rounded-3xl p-12 backdrop-blur-xl bg-white/50 border border-white/60 text-center">
              <h2 className="text-2xl font-bold text-slate-900 mb-4">No Skills Data Yet</h2>
              <p className="text-slate-600 mb-6">Complete some interviews to start tracking your skills!</p>
              <button 
                onClick={() => router.push('/candidate/dashboard/practice')}
                className="px-8 py-3 bg-gradient-to-r from-purple-500 to-cyan-400 border border-purple-400 text-white rounded-xl hover:bg-cyan-500 transition-all font-semibold"
              >
                Start an Interview
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-white to-cyan-50">
      <CandidateSidebar />
      {/* Sidebar Spacing */}
      <div className="ml-64 pt-8 pb-16">
        <div className="px-8 lg:px-12">
          <DashboardBreadcrumb />
          
          <div className="mb-12">
            <h1 className="text-5xl font-bold text-slate-900 mb-2">Skills Map</h1>
            <p className="text-lg text-slate-600 font-light">Track and improve your skills based on your interviews</p>
          </div>

          {/* Technical Skills */}
          {technicalSkills.length > 0 && (
            <div className="mb-12">
              <h2 className="text-2xl font-bold text-slate-900 mb-6 flex items-center gap-2">
                <Target className="w-6 h-6" />
                Technical Skills
              </h2>
              <div className="space-y-4">
                {technicalSkills.map((skill) => (
                  <div key={skill.name} className="rounded-2xl p-6 backdrop-blur-xl bg-white/50 border border-white/60 shadow-lg">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h3 className="font-bold text-slate-900">{skill.name}</h3>
                        <p className="text-sm text-slate-600">{skill.interviews} interview{skill.interviews !== 1 ? 's' : ''} completed</p>
                      </div>
                      <div className="text-right">
                        <p className="text-3xl font-bold text-cyan-500">{skill.rating}/10</p>
                        <p className={`text-xs font-semibold ${skill.trend === 'up' ? 'text-cyan-600' : skill.trend === 'down' ? 'text-red-600' : 'text-slate-600'}`}>
                          {skill.trend === 'up' ? '↑ Improving' : skill.trend === 'down' ? '↓ Needs Work' : '→ Stable'}
                        </p>
                      </div>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-3">
                      <div className="bg-gradient-to-r from-purple-500 to-cyan-400 h-3 rounded-full" style={{ width: `${(skill.rating / 10) * 100}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Soft Skills */}
          {softSkills.length > 0 && (
            <div className="mb-12">
              <h2 className="text-2xl font-bold text-slate-900 mb-6 flex items-center gap-2">
                <Award className="w-6 h-6" />
                Soft Skills
              </h2>
              <div className="space-y-4">
                {softSkills.map((skill) => (
                  <div key={skill.name} className="rounded-2xl p-6 backdrop-blur-xl bg-white/50 border border-white/60 shadow-lg">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h3 className="font-bold text-slate-900">{skill.name}</h3>
                        <p className="text-sm text-slate-600">{skill.interviews} interview{skill.interviews !== 1 ? 's' : ''} completed</p>
                      </div>
                      <div className="text-right">
                        <p className="text-3xl font-bold text-cyan-500">{skill.rating}/10</p>
                        <p className={`text-xs font-semibold ${skill.trend === 'up' ? 'text-cyan-600' : skill.trend === 'down' ? 'text-red-600' : 'text-slate-600'}`}>
                          {skill.trend === 'up' ? '↑ Improving' : skill.trend === 'down' ? '↓ Needs Work' : '→ Stable'}
                        </p>
                      </div>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-3">
                      <div className="bg-gradient-to-r from-purple-500 to-cyan-400 h-3 rounded-full" style={{ width: `${(skill.rating / 10) * 100}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Overall Assessment */}
          <div className="rounded-3xl p-8 backdrop-blur-xl bg-white/50 border border-white/60 shadow-lg">
            <h2 className="text-2xl font-bold text-slate-900 mb-6 flex items-center gap-2">
              <TrendingUp className="w-6 h-6" />
              Overall Assessment
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <p className="text-slate-600 font-semibold mb-2">Average Rating</p>
                <p className="text-5xl font-bold text-cyan-500">
                  {averageRating}
                </p>
                <p className="text-sm text-slate-600 mt-1">/10</p>
              </div>
              <div>
                <p className="text-slate-600 font-semibold mb-2">Total Interviews</p>
                <p className="text-5xl font-bold text-cyan-500">
                  {totalInterviews}
                </p>
              </div>
              <div>
                <p className="text-slate-600 font-semibold mb-2">Skills Improving</p>
                <p className="text-5xl font-bold text-cyan-600">
                  {improvingSkills}
                </p>
                <p className="text-sm text-slate-600 mt-1">trending up</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
