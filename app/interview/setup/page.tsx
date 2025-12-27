'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Upload, ArrowRight, Briefcase, TrendingUp, FileText, RotateCcw } from 'lucide-react'

const ROLES = [
  'Software Engineer',
  'Data Analyst',
  'Data Scientist',
  'Product Manager',
  'HR Executive',
  'UI/UX Designer',
  'Backend Developer',
  'Frontend Developer',
  'Full Stack Developer',
  'DevOps Engineer',
  'Business Analyst',
  'Project Manager',
  'Marketing Manager',
  'Sales Executive',
  'Other'
]

const EXPERIENCE_LEVELS = [
  { value: 'fresher', label: 'Fresher (0 years)', description: 'Just graduating or starting' },
  { value: '1-3', label: '1–3 years', description: 'Early career professional' },
  { value: '3-5', label: '3–5 years', description: 'Mid-level professional' },
  { value: '5+', label: '5+ years', description: 'Senior professional' }
]

export default function InterviewSetupPage() {
  const router = useRouter()
  const [selectedRole, setSelectedRole] = useState<string>('')
  const [selectedExperience, setSelectedExperience] = useState<string>('')
  const [resume, setResume] = useState<File | null>(null)
  const [resumeName, setResumeName] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string>('')
  const [savedData, setSavedData] = useState<any>(null)
  const [showSaved, setShowSaved] = useState(false)

  // Load saved data on mount
  useEffect(() => {
    const saved = localStorage.getItem('interviewSetupSaved')
    if (saved) {
      try {
        const data = JSON.parse(saved)
        setSavedData(data)
        setShowSaved(true)
      } catch (err) {
        console.error('Failed to load saved data:', err)
      }
    }
  }, [])

  const handleLoadSaved = () => {
    if (savedData) {
      setSelectedRole(savedData.role)
      setSelectedExperience(savedData.experience)
      setResumeName(savedData.resumeName || '')
      setShowSaved(false)
      setError('')
    }
  }

  const handleResumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError('Resume must be less than 5MB')
        return
      }
      setResume(file)
      setResumeName(file.name)
      setError('')
    }
  }

  const handleProceed = async () => {
    if (!selectedRole || !selectedExperience) {
      setError('Please select both role and experience level')
      return
    }

    setLoading(true)
    setError('')

    try {
      // Store interview setup data in sessionStorage AND localStorage
      const setupData = {
        role: selectedRole,
        experience: selectedExperience,
        hasResume: !!resume,
        resumeName: resumeName,
        timestamp: new Date().toISOString()
      }

      sessionStorage.setItem('interviewSetup', JSON.stringify(setupData))
      
      // Save to localStorage for next time (persistent)
      localStorage.setItem('interviewSetupSaved', JSON.stringify(setupData))

      // If resume provided, extract skills
      if (resume) {
        const formData = new FormData()
        formData.append('resume', resume)
        formData.append('role', selectedRole)

        try {
          const extractResponse = await fetch('/api/extract-resume-skills', {
            method: 'POST',
            body: formData
          })

          if (extractResponse.ok) {
            const skills = await extractResponse.json()
            sessionStorage.setItem('resumeSkills', JSON.stringify(skills))
            // Also save to localStorage
            localStorage.setItem('resumeSkillsSaved', JSON.stringify(skills))
            console.log('✅ Resume skills extracted:', skills)
          } else {
            console.warn('⚠️ Could not extract resume skills, continuing without')
          }
        } catch (err) {
          console.warn('⚠️ Resume extraction error:', err)
        }
      }

      // Redirect to interview practice page
      router.push('/candidate/dashboard/practice')
    } catch (err) {
      console.error('Setup error:', err)
      setError('Failed to save interview setup')
    } finally {
      setLoading(false)
    }
  }

  const handleClearSaved = () => {
    localStorage.removeItem('interviewSetupSaved')
    localStorage.removeItem('resumeSkillsSaved')
    setSavedData(null)
    setShowSaved(false)
    setSelectedRole('')
    setSelectedExperience('')
    setResumeName('')
    setError('')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-slate-100 to-slate-50">
      {/* Background Effects */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-emerald-200/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-teal-200/10 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 min-h-screen flex flex-col items-center justify-center px-4 py-12">
        <div className="w-full max-w-2xl">
          {/* Header */}
          <div className="mb-12 text-center">
            <h1 className="text-4xl md:text-5xl font-bold text-slate-900 mb-3">
              Interview Setup
            </h1>
            <p className="text-lg text-slate-600">
              Help us personalize your interview experience
            </p>
          </div>

          {/* Saved Data Alert */}
          {showSaved && savedData && (
            <div className="mb-6 p-4 bg-emerald-50 border-2 border-emerald-300 rounded-xl">
              <p className="text-emerald-900 font-semibold mb-3">
                ✅ We found your previous settings!
              </p>
              <p className="text-emerald-800 text-sm mb-4">
                <strong>Role:</strong> {savedData.role} | <strong>Experience:</strong> {savedData.experience}
              </p>
              <div className="flex gap-3">
                <button
                  onClick={handleLoadSaved}
                  className="px-4 py-2 bg-emerald-500 text-white font-semibold rounded-lg hover:bg-emerald-600 transition-all"
                >
                  Use Saved Settings
                </button>
                <button
                  onClick={handleClearSaved}
                  className="px-4 py-2 bg-emerald-200 text-emerald-900 font-semibold rounded-lg hover:bg-emerald-300 transition-all flex items-center gap-2"
                >
                  <RotateCcw className="w-4 h-4" />
                  Change
                </button>
              </div>
            </div>
          )}

          {/* Setup Card */}
          <div className="bg-white rounded-3xl shadow-lg border border-slate-100 p-8 md:p-12">
            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-800 text-sm font-medium">{error}</p>
              </div>
            )}

            {/* Step 1: Role Selection */}
            <div className="mb-10">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-8 h-8 rounded-full bg-emerald-500 text-white flex items-center justify-center font-bold text-sm">
                  1
                </div>
                <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                  <Briefcase className="w-5 h-5 text-emerald-500" />
                  Select Your Role / Position
                </h2>
              </div>
              <p className="text-slate-600 text-sm mb-4">
                ✔ Role alone gives 70% of interview context
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {ROLES.map((role) => (
                  <button
                    key={role}
                    onClick={() => setSelectedRole(role)}
                    className={`p-4 rounded-xl border-2 transition-all text-left font-medium ${
                      selectedRole === role
                        ? 'border-emerald-500 bg-emerald-50 text-emerald-900'
                        : 'border-slate-200 bg-white text-slate-700 hover:border-emerald-300 hover:bg-emerald-50/30'
                    }`}
                  >
                    {role}
                  </button>
                ))}
              </div>
            </div>

            {/* Step 2: Experience Level */}
            <div className="mb-10">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-8 h-8 rounded-full bg-emerald-500 text-white flex items-center justify-center font-bold text-sm">
                  2
                </div>
                <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-emerald-500" />
                  Experience Level
                </h2>
              </div>
              <p className="text-slate-600 text-sm mb-4">
                ✔ This controls the difficulty and question depth
              </p>

              <div className="space-y-3">
                {EXPERIENCE_LEVELS.map((level) => (
                  <button
                    key={level.value}
                    onClick={() => setSelectedExperience(level.value)}
                    className={`w-full p-4 rounded-xl border-2 transition-all text-left ${
                      selectedExperience === level.value
                        ? 'border-emerald-500 bg-emerald-50'
                        : 'border-slate-200 bg-white hover:border-emerald-300 hover:bg-emerald-50/30'
                    }`}
                  >
                    <div className="font-semibold text-slate-900">
                      {level.label}
                    </div>
                    <div className="text-sm text-slate-500 mt-1">
                      {level.description}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Step 3: Resume Upload */}
            <div className="mb-10">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-8 h-8 rounded-full bg-emerald-500 text-white flex items-center justify-center font-bold text-sm">
                  3
                </div>
                <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-emerald-500" />
                  Upload Resume
                </h2>
              </div>
              <p className="text-slate-600 text-sm mb-4">
                ✔ Optional but recommended - AI will extract skills and personalize questions
              </p>

              <div className={`border-2 border-dashed rounded-xl p-8 text-center transition-all ${
                resume
                  ? 'border-emerald-400 bg-emerald-50/50'
                  : 'border-slate-300 bg-slate-50 hover:border-emerald-400 hover:bg-emerald-50/30'
              }`}>
                {resume ? (
                  <div className="flex items-center justify-center gap-3">
                    <FileText className="w-6 h-6 text-emerald-600" />
                    <div className="text-left">
                      <p className="font-semibold text-emerald-900">{resumeName}</p>
                      <p className="text-sm text-emerald-700">Ready to upload</p>
                    </div>
                    <button
                      onClick={() => {
                        setResume(null)
                        setResumeName('')
                      }}
                      className="ml-auto text-emerald-600 hover:text-emerald-900 font-medium text-sm"
                    >
                      Change
                    </button>
                  </div>
                ) : (
                  <div>
                    <Upload className="w-8 h-8 text-slate-400 mx-auto mb-3" />
                    <label className="cursor-pointer">
                      <span className="font-semibold text-slate-900">
                        Click to upload
                      </span>
                      <span className="text-slate-600"> or drag and drop</span>
                      <input
                        type="file"
                        accept=".pdf,.doc,.docx"
                        onChange={handleResumeChange}
                        className="hidden"
                      />
                    </label>
                    <p className="text-xs text-slate-500 mt-2">
                      PDF, DOC, or DOCX (Max 5MB)
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Proceed Button */}
            <button
              onClick={handleProceed}
              disabled={!selectedRole || !selectedExperience || loading}
              className="w-full py-4 bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-bold rounded-xl hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  Proceed to Interview
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
