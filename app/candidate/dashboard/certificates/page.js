'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/context/AuthContext'
import CandidateSidebar from '@/components/CandidateSidebar'
import { Trophy, Award, Star, Lock, Share2 } from 'lucide-react'

export default function CertificatesPage() {
  const { user: authUser, session: authSession } = useAuth()
  const [certificates, setCertificates] = useState([])
  const [stats, setStats] = useState({ total: 0, completed: 0 })
  const [loading, setLoading] = useState(true)
  const [userId, setUserId] = useState(null)

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
      loadCertificates(user_id)
    } else {
      setLoading(false)
    }
  }, [authUser?.id, authSession?.user?.id])

  const loadCertificates = async (userId) => {
    try {
      console.log('[Certificates] Loading interviews for userId:', userId)
      
      // Fetch all interviews for this user
      const response = await fetch(`/api/interviews?userId=${userId}`)
      const result = await response.json()
      
      if (!result.success || !result.data) {
        console.log('[Certificates] No interviews found')
        setCertificates(generateDefaultCertificates(0, 0))
        setLoading(false)
        return
      }

      const interviews = result.data
      console.log('[Certificates] Found', interviews.length, 'interviews')
      
      // Calculate metrics from interviews
      const totalInterviews = interviews.length
      const scores = interviews.map(i => i.score || 0).filter(s => s > 0)
      const averageScore = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0
      const completedCount = interviews.filter(i => i.status === 'completed').length
      
      console.log('[Certificates] Metrics:', { totalInterviews, averageScore, completedCount })
      
      // Generate certificates based on real data
      const generatedCerts = generateCertificates(totalInterviews, averageScore, completedCount)
      setCertificates(generatedCerts)
      
      const earnedCount = generatedCerts.filter(c => c.earned).length
      setStats({
        total: generatedCerts.length,
        completed: earnedCount
      })
    } catch (err) {
      console.error('[Certificates] Error loading certificates:', err)
      setCertificates(generateDefaultCertificates(0, 0))
    } finally {
      setLoading(false)
    }
  }

  const generateCertificates = (totalInterviews, averageScore, completedCount) => {
    const certs = [
      {
        id: 1,
        title: 'Interview Champion',
        description: 'Completed your first interview',
        icon: Trophy,
        color: 'bg-blue-50 text-blue-600',
        earned: totalInterviews >= 1,
        earnedDate: totalInterviews >= 1 ? new Date().toISOString().split('T')[0] : null,
        requirement: 'Complete 1 interview',
        progress: Math.min(totalInterviews, 1)
      },
      {
        id: 2,
        title: 'Interview Enthusiast',
        description: 'Completed 5 interviews',
        icon: Award,
        color: 'bg-purple-50 text-purple-600',
        earned: totalInterviews >= 5,
        earnedDate: totalInterviews >= 5 ? new Date().toISOString().split('T')[0] : null,
        requirement: `Complete 5 interviews (${Math.min(totalInterviews, 5)}/5)`,
        progress: Math.min(totalInterviews / 5, 1)
      },
      {
        id: 3,
        title: 'Persistence Master',
        description: 'Completed 10 interviews',
        icon: Star,
        color: 'bg-yellow-50 text-yellow-600',
        earned: totalInterviews >= 10,
        earnedDate: totalInterviews >= 10 ? new Date().toISOString().split('T')[0] : null,
        requirement: `Complete 10 interviews (${Math.min(totalInterviews, 10)}/10 ${totalInterviews < 10 ? `- ${10 - totalInterviews} more needed` : ''})`,
        progress: Math.min(totalInterviews / 10, 1)
      },
      {
        id: 4,
        title: 'Expert Communicator',
        description: 'Achieved 80+ average score',
        icon: Trophy,
        color: 'bg-green-50 text-green-600',
        earned: averageScore >= 80,
        earnedDate: averageScore >= 80 ? new Date().toISOString().split('T')[0] : null,
        requirement: `Average score of 80+ (Current: ${averageScore})`,
        progress: Math.min(averageScore / 80, 1)
      },
      {
        id: 5,
        title: 'Technical Wizard',
        description: 'Mastered technical interviews',
        icon: Award,
        color: 'bg-indigo-50 text-indigo-600',
        earned: totalInterviews >= 5 && averageScore >= 70,
        earnedDate: totalInterviews >= 5 && averageScore >= 70 ? new Date().toISOString().split('T')[0] : null,
        requirement: `Complete 5 technical interviews with 70+ avg (${Math.min(totalInterviews, 5)}/5 - Score: ${averageScore})`,
        progress: Math.min((totalInterviews / 5) * (averageScore / 70), 1)
      },
      {
        id: 6,
        title: 'Master Interviewer',
        description: 'Achieved 90+ average score',
        icon: Star,
        color: 'bg-pink-50 text-pink-600',
        earned: averageScore >= 90,
        earnedDate: averageScore >= 90 ? new Date().toISOString().split('T')[0] : null,
        requirement: `Average score of 90+ (Current: ${averageScore} ${averageScore >= 80 ? '- Unlocked when 90+' : '- Locked until 80+ achieved'})`,
        progress: Math.min(averageScore / 90, 1),
        locked: averageScore < 80
      }
    ]
    
    return certs
  }

  const generateDefaultCertificates = (totalInterviews, averageScore) => {
    return generateCertificates(totalInterviews, averageScore, 0)
  }

  const earnedCerts = certificates.filter(c => c.earned)
  const unlockedCerts = certificates.filter(c => !c.earned)

  return (
    <div className="min-h-screen bg-gradient-to-br from-white to-cyan-50">
      <CandidateSidebar />
      {/* Sidebar Spacing */}
      <div className="ml-64 pt-8 pb-16">
        <div className="px-8 lg:px-12">
          <div className="mb-12">
            <h1 className="text-5xl font-bold text-slate-900 mb-2">Certificates & Achievements</h1>
            <p className="text-lg text-slate-600 font-light">Earn certificates by completing milestones</p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            <div className="rounded-3xl p-6 backdrop-blur-xl bg-white/50 border border-white/60 shadow-lg">
              <p className="text-slate-600 font-semibold mb-2">Total Available</p>
              <p className="text-4xl font-bold text-cyan-500">{stats.total}</p>
            </div>
            <div className="rounded-3xl p-6 backdrop-blur-xl bg-white/50 border border-white/60 shadow-lg">
              <p className="text-slate-600 font-semibold mb-2">Earned</p>
              <p className="text-4xl font-bold text-cyan-500">{stats.completed}</p>
            </div>
            <div className="rounded-3xl p-6 backdrop-blur-xl bg-white/50 border border-white/60 shadow-lg">
              <p className="text-slate-600 font-semibold mb-2">Progress</p>
              <p className="text-4xl font-bold text-cyan-500">
                {Math.round((stats.completed / stats.total) * 100)}%
              </p>
            </div>
          </div>

          {/* Earned Certificates */}
          {earnedCerts.length > 0 && (
            <div className="mb-12">
              <h2 className="text-2xl font-bold text-slate-900 mb-6">🏆 Earned Certificates</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {earnedCerts.map((cert) => {
                  const IconComponent = cert.icon
                  return (
                    <div
                      key={cert.id}
                      className={`rounded-3xl p-8 backdrop-blur-xl bg-gradient-to-br from-purple-100 to-cyan-100 border border-white/60 shadow-lg hover:shadow-xl transition-all`}
                    >
                      <div className="flex items-start justify-between mb-4">
                        <IconComponent className="w-12 h-12" />
                        <Star className="w-5 h-5" />
                      </div>
                      <h3 className="font-bold text-lg mb-1 text-slate-900">{cert.title}</h3>
                      <p className="text-sm text-slate-700 mb-4">{cert.description}</p>
                      <p className="text-xs text-slate-600 mb-4">
                        Earned on {new Date(cert.earnedDate).toLocaleDateString()}
                      </p>
                      <button className="w-full py-2 rounded-lg bg-white/20 hover:bg-white/30 transition-all text-sm font-semibold flex items-center justify-center gap-2">
                        <Share2 className="w-4 h-4" />
                        Share
                      </button>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Locked/Incomplete Certificates */}
          {unlockedCerts.length > 0 && (
            <div>
              <h2 className="text-2xl font-bold text-slate-900 mb-6">🔒 Locked Certificates</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {unlockedCerts.map((cert) => {
                  const IconComponent = cert.icon
                  return (
                    <div key={cert.id} className="rounded-3xl p-8 backdrop-blur-xl bg-white/50 border border-white/60 shadow-lg opacity-75">
                      <div className="flex items-start justify-between mb-4">
                        <IconComponent className="w-12 h-12 text-slate-400" />
                        <Lock className="w-5 h-5 text-slate-400" />
                      </div>
                      <h3 className="font-bold text-lg mb-1 text-slate-900">{cert.title}</h3>
                      <p className="text-sm text-slate-700 mb-4">{cert.description}</p>
                        <div className="bg-slate-200 rounded-full h-2 mb-2">
                          <div className="bg-gradient-to-r from-purple-500 to-cyan-400 h-2 rounded-full" style={{ width: '40%' }} />
                        </div>
                      <p className="text-xs text-slate-600">{cert.requirement}</p>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
