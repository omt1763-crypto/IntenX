'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import CandidateSidebar from '@/components/CandidateSidebar'
import { Zap, BookOpen, Target, Lightbulb, AlertCircle } from 'lucide-react'

export default function PracticeTypesPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [savedSetup, setSavedSetup] = useState(null)

  // Load saved setup on mount
  useEffect(() => {
    const saved = localStorage.getItem('interviewSetupSaved')
    if (saved) {
      try {
        const data = JSON.parse(saved)
        setSavedSetup(data)
        // Auto-load into sessionStorage
        sessionStorage.setItem('interviewSetup', JSON.stringify({
          role: data.role,
          experience: data.experience,
          hasResume: data.hasResume,
          resumeName: data.resumeName
        }))
        
        // Load resume skills if available
        const savedSkills = localStorage.getItem('resumeSkillsSaved')
        if (savedSkills) {
          sessionStorage.setItem('resumeSkills', savedSkills)
        }
      } catch (err) {
        console.error('Failed to load saved setup:', err)
      }
    }
  }, [])

  const practiceTypes = [
    {
      id: 'hr',
      title: 'HR Interview',
      description: 'Practice general HR and behavioral questions',
      icon: '💼',
      color: 'from-blue-500 to-cyan-500',
      skills: ['Communication', 'Teamwork', 'Problem Solving'],
      systemPrompt: 'You are an experienced HR interviewer. Ask behavioral and situational questions to assess the candidate\'s soft skills, communication ability, and cultural fit. Focus on questions like "Tell me about a time...", "How would you handle...", and "What are your strengths and weaknesses?"'
    },
    {
      id: 'technical',
      title: 'Technical Interview',
      description: 'Master coding and technical problem-solving',
      icon: '💻',
      color: 'from-purple-500 to-pink-500',
      skills: ['Coding', 'Data Structures', 'Algorithms'],
      systemPrompt: 'You are a senior technical interviewer. Ask coding and algorithmic questions. Present problems related to data structures, algorithms, system design, and coding. Evaluate problem-solving approach, code quality, and optimization skills.'
    },
    {
      id: 'behavioral',
      title: 'Behavioral Interview',
      description: 'Develop strong behavioral responses',
      icon: '🎭',
      color: 'from-green-500 to-emerald-500',
      skills: ['Leadership', 'Adaptability', 'Conflict Resolution'],
      systemPrompt: 'You are a behavioral assessment specialist. Use the STAR method (Situation, Task, Action, Result) to evaluate candidate responses. Ask about leadership, conflict resolution, adaptability, and decision-making scenarios.'
    },
    {
      id: 'roleBased',
      title: 'Role-Based Interview',
      description: 'Prepare for specific job roles',
      icon: '🎯',
      color: 'from-orange-500 to-red-500',
      skills: ['Job-specific Skills', 'Industry Knowledge'],
      systemPrompt: 'You are conducting a role-specific interview. Ask questions tailored to the job position, assess industry knowledge, and evaluate job-specific technical and soft skills relevant to the role.'
    }
  ]

  const handleStartPractice = async (practiceType) => {
    setLoading(true)
    try {
      // Get interview setup data from sessionStorage
      const setupData = sessionStorage.getItem('interviewSetup')
      const resumeSkills = sessionStorage.getItem('resumeSkills')
      
      const parsed = setupData ? JSON.parse(setupData) : null

      console.log('[Practice] Setup data:', parsed)
      console.log('[Practice] Resume skills:', resumeSkills)

      // Enhance system prompt with role and experience context
      let enhancedPrompt = practiceType.systemPrompt
      if (parsed) {
        enhancedPrompt += `\n\nCandidate Context:\n- Position: ${parsed.role}\n- Experience Level: ${parsed.experience}`
        
        if (resumeSkills) {
          const skills = JSON.parse(resumeSkills)
          enhancedPrompt += `\n- Skills: ${skills.skills?.join(', ') || 'Not specified'}`
        }

        enhancedPrompt += '\n\nTailor your questions to match this candidate\'s role and experience level.'
      }

      // Store the selected practice type in sessionStorage
      sessionStorage.setItem('selectedPracticeType', JSON.stringify({
        id: practiceType.id,
        title: practiceType.title,
        description: practiceType.description,
        skills: practiceType.skills,
        systemPrompt: enhancedPrompt,
        startedAt: new Date().toISOString()
      }))
      
      // Navigate to interview page
      router.push(`/interview/realtime?type=${practiceType.id}`)
    } catch (error) {
      console.error('Error starting practice:', error)
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-white to-cyan-50">
      <CandidateSidebar />
      {/* Sidebar Spacing */}
      <div className="ml-64 pt-8 pb-16">
        <div className="px-8 lg:px-12">
          <div className="mb-12">
            <h1 className="text-5xl font-bold text-slate-900 mb-2">Practice Types</h1>
            <p className="text-lg text-slate-600 font-light">Choose your interview practice mode</p>
            
            {savedSetup && (
              <div className="mt-6 p-4 bg-cyan-50 border-2 border-cyan-300 rounded-xl">
                <p className="text-cyan-900 font-semibold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-cyan-500" />
                  Using saved settings: <strong>{savedSetup.role}</strong> • {savedSetup.experience}
                </p>
                <button
                  onClick={() => router.push('/interview/setup')}
                  className="mt-3 text-cyan-700 text-sm font-semibold hover:text-cyan-900 underline"
                >
                  → Update settings
                </button>
              </div>
            )}
            
            {!savedSetup && (
              <button
                onClick={() => router.push('/interview/setup')}
                className="mt-6 inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-50 to-cyan-50 border-2 border-purple-300 text-purple-700 font-semibold rounded-xl hover:bg-cyan-100 transition-all"
              >
                ⚙️ Configure Interview Settings
              </button>
            )}
          </div>

          {/* Practice Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {practiceTypes.map((type) => (
              <div
                key={type.id}
                className="group relative overflow-hidden rounded-3xl p-8 backdrop-blur-xl bg-white/50 border border-white/60 hover:border-white/80 shadow-lg hover:shadow-2xl transition-all duration-300"
              >
                <div className={`absolute inset-0 bg-gradient-to-br from-purple-500 to-cyan-400 opacity-0 group-hover:opacity-10 transition-opacity`} />
                <div className="relative z-10">
                  <div className="text-5xl mb-4">{type.icon}</div>
                  <h3 className="text-2xl font-bold text-slate-900 mb-2">{type.title}</h3>
                  <p className="text-slate-600 mb-6">{type.description}</p>

                  {/* Skills */}
                  <div className="mb-6">
                    <p className="text-sm font-semibold text-slate-700 mb-3">Key Skills:</p>
                    <div className="flex flex-wrap gap-2">
                      {type.skills.map((skill) => (
                        <span
                          key={skill}
                          className="px-3 py-1 rounded-full bg-gradient-to-r from-purple-100 to-cyan-100 text-purple-700 text-xs font-semibold"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>

                  <button
                    onClick={() => handleStartPractice(type)}
                    disabled={loading}
                    className="w-full py-3 rounded-xl bg-gradient-to-r from-purple-500 to-cyan-400 border border-purple-400 text-white font-semibold hover:bg-cyan-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? 'Starting...' : 'Start Practice'}
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Tips Section */}
          <div className="mt-16">
            <h2 className="text-2xl font-bold text-slate-900 mb-6">Tips for Success</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="rounded-3xl p-6 backdrop-blur-xl bg-white/50 border border-white/60 shadow-lg">
                <BookOpen className="w-8 h-8 text-purple-500 mb-3" />
                <h3 className="font-bold text-slate-900 mb-2">Prepare</h3>
                <p className="text-slate-600 text-sm">Research common questions and practice answers</p>
              </div>
              <div className="rounded-3xl p-6 backdrop-blur-xl bg-white/50 border border-white/60 shadow-lg">
                <Zap className="w-8 h-8 text-cyan-500 mb-3" />
                <h3 className="font-bold text-slate-900 mb-2">Practice</h3>
                <p className="text-slate-600 text-sm">Take multiple interviews to improve your skills</p>
              </div>
              <div className="rounded-3xl p-6 backdrop-blur-xl bg-white/50 border border-white/60 shadow-lg">
                <Target className="w-8 h-8 text-purple-500 mb-3" />
                <h3 className="font-bold text-slate-900 mb-2">Improve</h3>
                <p className="text-slate-600 text-sm">Review feedback and track your progress</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
