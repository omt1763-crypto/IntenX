'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Phone, LogOut, Mic, MicOff, Video, VideoOff, AlertCircle, CheckCircle2 } from 'lucide-react'
import { useRealtimeAudio } from '@/hooks/useRealtimeAudio'
import { useConversationManager } from '@/hooks/useConversationManager'
import { useAuth } from '@/context/AuthContext'
import { supabase } from '@/lib/supabase'
import SubscriptionPaywall from '@/components/SubscriptionPaywall'
import { ConversationDisplay } from '@/components/ConversationDisplay'

interface InterviewData {
  title?: string
  client?: string
  skills?: Array<{ name: string; reason: string; importance: string }>
  hiringFor?: string
  jobId?: string
  systemPrompt?: string
  description?: string
  jobDescription?: string
}

/**
 * Generate a custom system prompt that includes job details
 */
function generateSystemPromptWithJobDetails(
  jobTitle: string,
  jobDescription: string,
  skills: Array<{ name: string; reason: string }>,
  company: string
): string {
  const skillsList = skills
    .map(s => `• ${s.name}`)
    .join('\n')

  return `You are a professional technical job interviewer conducting a formal interview in English.

🔒 LANGUAGE POLICY (CRITICAL - MUST FOLLOW):
- SPEAK ONLY ENGLISH - Every single response must be in English, no exceptions
- START IN ENGLISH - Greet in English: "Hello, thank you for joining me today..."
- NEVER USE OTHER LANGUAGES - No Spanish, French, German, or any other language

POSITION DETAILS:
- Job Title: ${jobTitle}
- Company: ${company}
- Job Description:
${jobDescription}

CORE DIRECTIVES:
1. ENGLISH LANGUAGE ONLY - Respond ONLY in English. This is not negotiable.
2. PROFESSIONAL TONE - no casual language, jokes, slang, or small talk
3. ONE QUESTION AT A TIME - ask only one question per turn, wait for complete response
4. TECHNICAL FOCUS - concentrate exclusively on job-related skills and experience
5. NO PERSONAL QUESTIONS - never ask about age, gender, religion, location, family, or salary
6. OPEN-ENDED QUESTIONS - avoid yes/no questions, encourage detailed explanations
7. RESPECTFUL LISTENING - never interrupt the candidate
8. REDIRECT IF OFF-TOPIC - if candidate goes off-topic, say "Let's keep our focus on the technical questions"

REQUIRED SKILLS TO EVALUATE (High Priority):
${skillsList}

SKILL ASSESSMENT STRATEGY:
- For each required skill listed above, ask 2-3 targeted technical questions
- Base questions on the job description and responsibilities
- Probe for depth of understanding, not just familiarity
- Ask for real-world examples of using each skill
- Assess both theoretical knowledge and practical experience
- Reference specific job requirements in your questions

INTERVIEW PHASES:
1. INTRODUCTION - "Hello, thank you for joining me today. I'm your technical interviewer for the ${jobTitle} position at ${company}. Could you please introduce yourself and share your background?"
2. BACKGROUND - Ask about education, work experience, and current role relevant to this position
3. TECHNICAL SKILLS - Deep dive into the required skills with practical questions related to the job description
4. PROBLEM-SOLVING - Ask scenario-based questions relevant to the ${jobTitle} position
5. CLOSING - Summarize discussion and ask if they have questions

PROHIBITED BEHAVIORS:
❌ Speaking in any language other than English
❌ Asking personal or demographic questions
❌ Making jokes or using casual language
❌ Asking multiple questions in one turn
❌ Interrupting the candidate
❌ Going off-topic
❌ Making assumptions about the candidate
❌ Expressing personal opinions
❌ Discussing salary before appropriate stage

REMEMBER:
You are ONLY a technical job interviewer for this specific ${jobTitle} position. Your role is to fairly assess the candidate's qualifications based on the job description and required skills. Be respectful, professional, and focused on job-related competencies.`
}

export default function RealtimeInterviewPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { role, user, session, loading: authLoading } = useAuth()
  const [mounted, setMounted] = useState(false)
  const [interviewStarted, setInterviewStarted] = useState(false)
  const [interviewCompleted, setInterviewCompleted] = useState(false)
  const [permissionError, setPermissionError] = useState<string | null>(null)
  const [micPermission, setMicPermission] = useState<boolean | null>(null)
  const [cameraPermission, setCameraPermission] = useState<boolean | null>(null)
  const [deviceWarning, setDeviceWarning] = useState<string | null>(null)
  const [applicantId, setApplicantId] = useState<string | null>(null)
  const [jobId, setJobId] = useState<string | null>(null)
  const [applicantData, setApplicantData] = useState<any>(null)
  const [timer, setTimer] = useState(0)
  const [isPractice, setIsPractice] = useState(false)
  const [maxDuration] = useState(120) // 2 minutes for practice mode
  const [timeWarning, setTimeWarning] = useState(false)
  const [micOn, setMicOn] = useState(true)
  const [cameraOn, setCameraOn] = useState(true)
  const [localStream, setLocalStream] = useState<MediaStream | null>(null)
  const [interviewData, setInterviewData] = useState<InterviewData | null>(null)
  const [showPaywall, setShowPaywall] = useState(false)
  const [subscriptionInfo, setSubscriptionInfo] = useState<any>(null)
  const [savingConversation, setSavingConversation] = useState(false)
  
  // Pre-interview form state
  const [candidateFormSubmitted, setCandidateFormSubmitted] = useState(false)
  const [candidateInfo, setCandidateInfo] = useState({
    name: '',
    email: '',
    phone: '',
    position: '',
    resumeFile: null as File | null
  })
  const [formLoading, setFormLoading] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  
  const videoRef = useRef<HTMLVideoElement>(null)
  const wsRef = useRef<WebSocket | null>(null)
  const { messages, addMessage, saveToDatabase } = useConversationManager()
  const { connected, isListening, error, connect, disconnect } = useRealtimeAudio()

  // Wait for auth to load, then initialize interview page
  useEffect(() => {
    if (authLoading) {
      console.log('⏳ Waiting for auth context...')
      return
    }

    // Get applicant and job IDs from query params
    const applicantIdParam = searchParams?.get('applicantId')
    const jobIdParam = searchParams?.get('jobId')
    const typeParam = searchParams?.get('type')

    // Detect if this is a practice interview (from Practice Types page)
    const isPracticeMode = !!typeParam
    setIsPractice(isPracticeMode)
    console.log('[InterviewPage] Query params:', { applicantIdParam, jobIdParam, typeParam, isPracticeMode })
    console.log('[InterviewPage] Interview type:', isPracticeMode ? '📝 PRACTICE (2-min limit)' : '🎯 REAL JOB INTERVIEW')

    // Allow candidates to proceed with either:
    // 1. applicantId (candidate from job applicants)
    // 2. jobId (candidate from shared interview link)
    // 3. typeParam (practice mode interview)
    if (applicantIdParam || jobIdParam || typeParam) {
      console.log('✅ Candidate interview (no auth required)', { applicantIdParam, jobIdParam, typeParam })
      if (applicantIdParam) setApplicantId(applicantIdParam)
      if (jobIdParam) {
        setJobId(jobIdParam)
        console.log('[InterviewPage] Job ID set to:', jobIdParam)
      }
    } else if (!user || !session) {
      // Only require auth if no interview params are provided
      console.warn('❌ Not authenticated - redirecting to login')
      router.push('/auth/login')
      return
    } else {
      // User is authenticated
      console.log('✅ User authenticated:', user.email)
      if (applicantIdParam) setApplicantId(applicantIdParam)
      if (jobIdParam) setJobId(jobIdParam)
    }
    
    // Load practice type from sessionStorage (from Practice Types page)
    if (typeParam) {
      const practiceTypeStr = sessionStorage.getItem('selectedPracticeType')
      if (practiceTypeStr) {
        try {
          const practiceType = JSON.parse(practiceTypeStr)
          console.log('✅ Loaded practice type:', practiceType)
          
          // Update interview data with practice type info
          setInterviewData({
            title: practiceType.title,
            systemPrompt: practiceType.systemPrompt,
            skills: practiceType.skills.map((skill: string) => ({
              name: skill,
              reason: `Essential for ${practiceType.title}`,
              importance: 'high'
            }))
          })
          
          sessionStorage.removeItem('selectedPracticeType') // Clear after loading
        } catch (err) {
          console.error('Failed to parse practice type:', err)
        }
      }
    }
    
    // Load applicant data from localStorage
    const applicantDataStr = localStorage.getItem('applicantData')
    if (applicantDataStr) {
      try {
        const data = JSON.parse(applicantDataStr)
        setApplicantData(data)
        localStorage.removeItem('applicantData') // Clear after loading
      } catch (err) {
        console.error('Failed to load applicant data:', err)
      }
    }
    
    // Load interview data from localStorage
    const data = localStorage.getItem('interviewData')
    if (data) {
      try {
        setInterviewData(JSON.parse(data))
        localStorage.removeItem('interviewData') // Clear after loading
      } catch (err) {
        console.error('Failed to load interview data:', err)
      }
    }
    
    // Load job info in the background if jobId is provided but no interview data
    if (jobIdParam && !data) {
      console.log('Loading job info from database for jobId:', jobIdParam)
      loadJobInfo(jobIdParam)
    }
    
    // Mount immediately - don't wait for job info to load
    setMounted(true)
    
    // Check media permissions on mount
    checkMediaPermissions()
  }, [authLoading, user, session, searchParams, router])

  // Check media permissions availability
  const checkMediaPermissions = async () => {
    try {
      const micStatus = await navigator.permissions.query({ name: 'microphone' as PermissionName })
      const cameraStatus = await navigator.permissions.query({ name: 'camera' as PermissionName })
      
      setMicPermission(micStatus.state === 'granted')
      setCameraPermission(cameraStatus.state === 'granted')
    } catch (err) {
      console.log('Permission check not supported, will prompt on access')
    }
  }

  // Handle candidate form submission
  const handleCandidateFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormLoading(true)
    setFormError(null)

    try {
      // Validate required fields
      if (!candidateInfo.name.trim()) {
        throw new Error('Name is required')
      }
      if (!candidateInfo.email.trim()) {
        throw new Error('Email is required')
      }
      if (!candidateInfo.phone.trim()) {
        throw new Error('Phone number is required')
      }
      if (!candidateInfo.position.trim()) {
        throw new Error('Position applying for is required')
      }

      // Prepare form data
      const formData = new FormData()
      formData.append('name', candidateInfo.name)
      formData.append('email', candidateInfo.email)
      formData.append('phone', candidateInfo.phone)
      formData.append('position', candidateInfo.position)
      formData.append('jobId', jobId || '')
      if (candidateInfo.resumeFile) {
        formData.append('resume', candidateInfo.resumeFile)
      }

      // Save candidate info to backend
      const response = await fetch('/api/candidate-intake', {
        method: 'POST',
        body: formData
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to save candidate information')
      }

      const result = await response.json()
      console.log('[Interview] Candidate info saved:', result)

      // Mark form as submitted and allow interview to proceed
      setCandidateFormSubmitted(true)
    } catch (err: any) {
      console.error('[Interview] Error saving candidate info:', err)
      setFormError(err.message || 'Failed to save information')
    } finally {
      setFormLoading(false)
    }
  }

  // Load job information from database
  const loadJobInfo = async (jobId: string) => {
    try {
      console.log('[Page] Loading job info for jobId:', jobId)
      
      // Add timeout to prevent hanging
      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), 5000) // 5 second timeout
      
      const response = await fetch(`/api/jobs/${jobId}`, { signal: controller.signal })
      clearTimeout(timeout)
      
      if (response.ok) {
        const job = await response.json()
        console.log('[Page] Job loaded:', job)
        
        // Parse required skills from the job
        const requiredSkills = Array.isArray(job.required_skills) 
          ? job.required_skills 
          : (job.skills || [])
        
        // Map skills to the proper format
        const skillsArray = (requiredSkills).map((skill: any) => ({
          name: typeof skill === 'string' ? skill : skill.name || skill,
          reason: `Required for ${job.title}`,
          importance: 'high'
        }))
        
        // Set interview data based on job info including description
        setInterviewData({
          title: job.title || 'Technical Interview',
          client: job.company || 'Unknown',
          hiringFor: job.position || job.title,
          jobId: jobId,
          description: job.description || '',
          jobDescription: job.description || '',
          skills: skillsArray,
          // Generate system prompt that includes job details
          systemPrompt: generateSystemPromptWithJobDetails(
            job.title,
            job.description,
            skillsArray,
            job.company
          )
        })
      } else {
        console.warn('[Page] Failed to load job info, status:', response.status)
        // Set default interview data if job fails to load
        setInterviewData({
          title: 'Technical Interview',
          jobId: jobId
        })
      }
    } catch (err) {
      console.error('[Page] Error loading job info:', err)
      // Set default interview data to continue
      setInterviewData({
        title: 'Technical Interview',
        jobId: jobId
      })
    }
  }

  // Request media permissions before interview
  const requestMediaPermissions = async () => {
    try {
      setPermissionError(null)
      
      // Show permission prompt for microphone with noise suppression constraints
      console.log('📢 Requesting microphone permission with noise suppression...')
      const audioStream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          channelCount: { ideal: 1 },
          sampleRate: { ideal: 16000 }
        }
      })
      const micTracks = audioStream.getAudioTracks()
      if (micTracks.length > 0) {
        console.log('✅ Microphone granted - Noise suppression:', micTracks[0].getSettings().noiseSuppression)
      }
      micTracks.forEach(track => track.stop())
      setMicPermission(true)
      
      // Show permission prompt for camera
      console.log('📷 Requesting camera permission...')
      const videoStream = await navigator.mediaDevices.getUserMedia({ video: true })
      const videoTracks = videoStream.getVideoTracks()
      videoTracks.forEach(track => track.stop())
      setCameraPermission(true)
      
      return true
    } catch (err: any) {
      let message = 'Failed to access camera or microphone.'
      
      if (err.name === 'NotAllowedError') {
        message = 'You denied camera/microphone access. Please allow access in your browser settings to start the interview.'
      } else if (err.name === 'NotFoundError') {
        message = 'No camera or microphone found on your device. Please check your hardware.'
      }
      
      console.error('❌ Permission error:', err)
      setPermissionError(message)
      return false
    }
  }

  // Auto-scroll conversation (handled by ConversationDisplay component)
  // This effect is no longer needed as the component handles auto-scrolling

  // Monitor device state during interview
  useEffect(() => {
    if (!interviewStarted) return

    const checkDeviceState = setInterval(() => {
      try {
        if (!navigator.mediaDevices) return

        // Check if audio devices are still available
        navigator.mediaDevices.enumerateDevices().then(devices => {
          const hasAudio = devices.some(d => d.kind === 'audioinput')
          const hasVideo = devices.some(d => d.kind === 'videoinput')
          
          if (!hasAudio && micOn) {
            setDeviceWarning('Microphone disconnected! Please reconnect.')
            setMicOn(false)
          } else if (hasAudio && deviceWarning?.includes('Microphone')) {
            setDeviceWarning(null)
          }
          
          if (!hasVideo && cameraOn) {
            setDeviceWarning('Camera disconnected! Please reconnect.')
            setCameraOn(false)
          } else if (hasVideo && deviceWarning?.includes('Camera')) {
            setDeviceWarning(null)
          }
        })
      } catch (err) {
        console.error('Device check error:', err)
      }
    }, 2000)

    return () => clearInterval(checkDeviceState)
  }, [interviewStarted, micOn, cameraOn, deviceWarning])

  // Setup camera
  useEffect(() => {
    if (!cameraOn || !interviewStarted) {
      if (localStream) {
        localStream.getTracks().forEach(t => t.stop())
        setLocalStream(null)
      }
      if (videoRef.current) {
        videoRef.current.srcObject = null
      }
      return
    }

    const setupCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: true, 
          audio: false 
        })
        setLocalStream(stream)
        if (videoRef.current) {
          videoRef.current.srcObject = stream
          console.log('[Page] Camera stream set to video element')
        }
        setDeviceWarning(null)
      } catch (err) {
        console.error('Camera error:', err)
        setDeviceWarning('Failed to access camera. Please check permissions.')
      }
    }

    setupCamera()

    return () => {
      if (localStream) {
        localStream.getTracks().forEach(t => t.stop())
        setLocalStream(null)
      }
      if (videoRef.current) {
        videoRef.current.srcObject = null
      }
    }
  }, [cameraOn, interviewStarted])

  // Timer with 2-minute limit for practice mode
  useEffect(() => {
    if (!interviewStarted) return
    
    const interval = setInterval(() => {
      setTimer(t => {
        const newTime = t + 1
        
        // For practice interviews, auto-end at 2 minutes (120 seconds)
        if (isPractice && newTime >= maxDuration) {
          console.log('[Timer] 📝 Practice interview time limit reached! Auto-ending...')
          setInterviewStarted(false)
          // Trigger the handleEnd function after a brief delay
          setTimeout(() => {
            document.getElementById('end-interview-btn')?.click()
          }, 500)
          return newTime
        }
        
        // Show warning at 30 seconds remaining for practice mode
        if (isPractice && newTime === maxDuration - 30) {
          console.log('[Timer] ⏰ 30 seconds remaining in practice interview!')
          setTimeWarning(true)
        }
        
        return newTime
      })
    }, 1000)
    
    return () => clearInterval(interval)
  }, [interviewStarted, isPractice, maxDuration])

  const handleStart = async () => {
    try {
      // Check interview limit first - only for authenticated users
      if (session?.user?.id) {
        console.log('[Page] Checking interview limit...')
        const limitRes = await fetch('/api/check-interview-limit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: session.user.id })
        })

        const limitData = await limitRes.json()
        console.log('[Page] Interview limit check:', limitData)

        if (!limitData.canContinue) {
          console.log('[Page] Interview limit reached, showing paywall')
          setSubscriptionInfo({
            currentPlan: limitData.planName,
            remainingInterviews: limitData.remainingInterviews,
            message: limitData.message
          })
          setShowPaywall(true)
          return
        }
      } else {
        console.log('[Page] No authenticated user, skipping interview limit check (applicant flow)')
      }

      // Check and request permissions
      const hasPermissions = await requestMediaPermissions()
      if (!hasPermissions) {
        return
      }

      console.log('[Page] Starting interview...')
      console.log('[Page] Interview data:', interviewData)
      setInterviewStarted(true)
      setTimer(0)
      
      // Add welcome message as first AI message
      addMessage('ai', `Welcome to your technical interview!

Please keep your microphone and camera ON during the session. This interview is being recorded for evaluation purposes.

You will be asked a series of questions. If you are unsure about any question, simply say "skip" and we will move to the next one.

Good luck!`)
      // Track if waiting for user answer
      let waitingForUser = false

      await connect((msg) => {
        console.log('[Page] 🎯 Received conversation message:', msg.role, msg.content)
        // Add message to conversation manager
        addMessage(msg.role, msg.content)
        console.log('[Page] 📋 Message added to conversation manager')

        // Only allow one AI question at a time
        if (msg.role === 'ai') {
          waitingForUser = true
        }
        // If user responds, allow next AI question
        if (msg.role === 'user') {
          waitingForUser = false
        }
      }, interviewData?.skills || [], interviewData?.systemPrompt)
      console.log('[Page] Connected! Starting interview.')
    } catch (err: any) {
      console.error('[Page] Failed to start:', err)
      setInterviewStarted(false)
      setPermissionError('Failed to start interview: ' + err.message)
    }
  }

  const handleEnd = async () => {
    try {
      console.log('[Page] Ending interview...')
      setInterviewStarted(false)
      
      // Save conversation to database first
      if (messages && messages.length > 0) {
        setSavingConversation(true)
        try {
          const interviewId = `interview-${Date.now()}`
          const saved = await saveToDatabase(interviewId, applicantId)
          if (saved) {
            console.log('[Page] ✅ Conversation saved successfully')
          } else {
            console.warn('[Page] ⚠️ Conversation save failed, but continuing...')
          }
        } catch (saveErr) {
          console.error('[Page] Error saving conversation:', saveErr)
        } finally {
          setSavingConversation(false)
        }
      }
      
      // Disconnect from WebSocket to stop AI
      try {
        await disconnect()
        console.log('[Page] Disconnected from AI')
      } catch (disconnectErr) {
        console.warn('[Page] Warning during disconnect:', disconnectErr)
      }
      
      // Stop all media streams
      if (localStream) {
        localStream.getTracks().forEach(t => t.stop())
        setLocalStream(null)
      }
      
      // Get user ID from useAuth hook or session, or generate a UUID for anonymous candidates
      let userId = user?.id || session?.user?.id
      
      if (!userId) {
        // Generate a valid UUID v4 for anonymous candidates
        userId = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
          const r = Math.random() * 16 | 0
          const v = c === 'x' ? r : (r & 0x3 | 0x8)
          return v.toString(16)
        })
        console.log('[Page] Generated anonymous user UUID:', userId)
      }
      
      // Calculate score based on interview performance
      // Score factors: response quality (50%), duration (30%), engagement (20%)
      const userResponses = messages.filter(msg => msg.role === 'user').length
      const durationScore = Math.min((timer / 300) * 30, 30) // max 30 for 5+ min
      const engagementScore = Math.min((userResponses / 10) * 20, 20) // max 20 for 10+ responses
      const qualityScore = 50 // base quality score (will be updated by AI analysis)
      const calculatedScore = Math.min(Math.round(durationScore + engagementScore + qualityScore), 100)
      
      // Prepare interview data
      const interviewDataToSave = {
        id: crypto.randomUUID(),
        user_id: userId,
        applicant_id: applicantId || null,
        job_id: jobId || null,
        interview_type: isPractice ? 'practice' : 'real',
        title: interviewData?.title || 'Technical Interview',
        position: interviewData?.hiringFor || interviewData?.title || 'Interview',
        company: interviewData?.client || 'Unknown',
        client: interviewData?.client || 'Unknown',
        duration: timer,
        status: 'completed',
        score: calculatedScore,
        timestamp: new Date().toISOString(),
        skills: interviewData?.skills || [],
        conversation: messages.map(msg => ({
          role: msg.role,
          content: msg.content,
          timestamp: msg.timestamp.toISOString(),
        })),
        systemPrompt: interviewData?.systemPrompt || null,
        notes: `Duration: ${timer}s, Messages: ${messages.length}, Type: ${isPractice ? '📝 Practice' : '🎯 Real'}, Practice Type: ${interviewData?.title}`,
      }
      
      console.log('[Page] Saving interview:', interviewDataToSave)
      console.log('[Page] Interview type:', isPractice ? '📝 PRACTICE (Test Mode)' : '🎯 REAL JOB INTERVIEW')
      
      // Save interview via API endpoint
      try {
        const response = await fetch('/api/interviews', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(interviewDataToSave),
        })

        const result = await response.json()

        if (!response.ok) {
          console.error('[Page] Failed to save interview - Status:', response.status)
          console.error('[Page] Error response:', JSON.stringify(result, null, 2))
          console.error('[Page] Error message:', result.error)
          console.error('[Page] Error code:', result.code)
          console.error('[Page] Full error:', result.fullError)
          // Continue anyway - interview was shown to candidate
        } else {
          console.log('[Page] Interview saved successfully:', result.data)
          
          // Get the interview ID from the save response
          const savedInterviewId = result.data?.id || interviewDataToSave.id
          console.log('[Page] Saved interview ID:', savedInterviewId)
          
          // Now analyze the interview with AI
          console.log('[Page] Analyzing interview with AI...')
          console.log('[Page] Conversation to analyze:', JSON.stringify(messages, null, 2))
          console.log('[Page] Number of messages:', messages.length)
          
          try {
            if (!messages || messages.length === 0) {
              console.warn('[Page] No conversation to analyze, skipping analysis')
            } else {
              const analysisResponse = await fetch('/api/analyze-interview', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  conversation: messages,
                  skills: interviewDataToSave.skills,
                  duration: timer,
                  applicantId: applicantId,
                  interviewId: savedInterviewId
                })
              })

              const analysisResult = await analysisResponse.json()

              if (analysisResponse.ok) {
                console.log('[Page] Interview analysis completed:', analysisResult.analysis)
              } else {
                console.error('[Page] Analysis failed:', analysisResult.error)
                console.error('[Page] Status code:', analysisResponse.status)
              }
            }
          } catch (analysisError) {
            console.error('[Page] Analysis API call error:', analysisError)
          }
        }
      } catch (error) {
        console.error('[Page] API call error:', error)
        // Continue anyway - interview was shown to candidate
      }
      
      // Update applicant status to 'completed' if we have an applicant ID
      if (applicantId) {
        const { error: updateError } = await supabase
          .from('job_applicants')
          .update({ status: 'completed' })
          .eq('id', applicantId)

        if (updateError) {
          console.error('[Page] Failed to update applicant status:', updateError)
        } else {
          console.log('[Page] Applicant status updated to completed')
        }
      }
      setTimer(0)
      setDeviceWarning(null)
      console.log('[Page] Interview ended, cleanup complete.')
      
      // Mark interview as completed - user cannot use it again
      setInterviewCompleted(true)
      setPermissionError(null)
      console.log('[Page] Interview marked as completed')
    } catch (err) {
      console.error('[Page] Error ending interview:', err)
      setPermissionError('Interview ended. ' + (err as Error).message)
      setInterviewStarted(false)
      setInterviewCompleted(true)
    }
  }

  const formatTime = (sec: number) => {
    const m = Math.floor(sec / 60)
    const s = sec % 60
    return `${m}:${s.toString().padStart(2, '0')}`
  }

  if (!mounted || authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500 mx-auto mb-4"></div>
          <p className="text-slate-600 font-semibold">
            {!mounted ? 'Initializing interview...' : 'Verifying your authentication...'}
          </p>
        </div>
      </div>
    )
  }

  // Show candidate intake form if not yet submitted
  if (jobId && !candidateFormSubmitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="fixed inset-0 pointer-events-none opacity-30">
          <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-gradient-to-b from-blue-500/20 to-transparent rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-gradient-to-t from-blue-600/15 to-transparent rounded-full blur-3xl" />
        </div>

        <div className="min-h-screen flex items-center justify-center p-4 relative z-10">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-slate-200 p-8">
            <h1 className="text-3xl font-bold text-slate-900 mb-2">Join Interview</h1>
            <p className="text-slate-600 mb-6">Please provide your information to begin</p>

            <form onSubmit={handleCandidateFormSubmit} className="space-y-4">
              {formError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                  {formError}
                </div>
              )}

              {/* Name */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  value={candidateInfo.name}
                  onChange={(e) => setCandidateInfo({...candidateInfo, name: e.target.value})}
                  placeholder="John Doe"
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-500/20"
                  required
                />
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">
                  Email Address *
                </label>
                <input
                  type="email"
                  value={candidateInfo.email}
                  onChange={(e) => setCandidateInfo({...candidateInfo, email: e.target.value})}
                  placeholder="john@example.com"
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-500/20"
                  required
                />
              </div>

              {/* Phone */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">
                  Phone Number *
                </label>
                <input
                  type="tel"
                  value={candidateInfo.phone}
                  onChange={(e) => setCandidateInfo({...candidateInfo, phone: e.target.value})}
                  placeholder="+1 (555) 000-0000"
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-500/20"
                  required
                />
              </div>

              {/* Position */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">
                  Position Applying For *
                </label>
                <input
                  type="text"
                  value={candidateInfo.position}
                  onChange={(e) => setCandidateInfo({...candidateInfo, position: e.target.value})}
                  placeholder="e.g., Senior React Developer"
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-500/20"
                  required
                />
              </div>

              {/* Resume */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">
                  Resume (Optional)
                </label>
                <input
                  type="file"
                  accept=".pdf,.doc,.docx"
                  onChange={(e) => setCandidateInfo({...candidateInfo, resumeFile: e.target.files?.[0] || null})}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-blue-600"
                />
                <p className="text-xs text-slate-500 mt-1">PDF, DOC, or DOCX format</p>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={formLoading}
                className="w-full mt-6 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg font-semibold hover:shadow-lg hover:shadow-blue-400/30 transition-all disabled:opacity-50"
              >
                {formLoading ? 'Saving...' : 'Start Interview'}
              </button>
            </form>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white text-slate-900 overflow-hidden flex flex-col">
      {/* Multi-layer Background Design (same as main page) */}
      <div className="fixed inset-0 pointer-events-none">
        {/* Light Base Gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-white via-[#f8fefb] to-[#f0fdf4]" />
        
        {/* Strong Light Blue Accent in Center */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-gradient-to-b from-[#d4f1f5]/50 via-[#e6f7f5]/40 to-transparent rounded-full blur-3xl opacity-60" />
        
        {/* White-Blue Accent - Top Center */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-gradient-to-b from-white/80 via-[#f0f9fa]/60 to-transparent rounded-full blur-3xl opacity-50" />
        
        {/* Light Green Accent - Top Right */}
        <div className="absolute top-10 right-0 w-[600px] h-[600px] bg-gradient-to-bl from-[#e6fdf4]/45 via-[#f0fdf4]/25 to-transparent rounded-full blur-3xl opacity-50" />
        
        {/* Soft Teal Accent - Bottom Left */}
        <div className="absolute bottom-0 -left-20 w-[500px] h-[500px] bg-gradient-to-tr from-[#d4f1f5]/35 to-transparent rounded-full blur-3xl opacity-40" />
        
        {/* Additional White Light Blur - Right Side */}
        <div className="absolute top-1/2 -right-20 w-[600px] h-[600px] bg-gradient-to-l from-white/60 to-transparent rounded-full blur-3xl opacity-50" />
      </div>

      {/* Navigation Bar */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-[#11cd68]/15 bg-white/80 backdrop-blur-xl">
        <div className="mx-auto px-4 md:px-6 lg:px-8 py-3 flex justify-between items-center relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#007a78] to-[#11cd68] flex items-center justify-center text-white font-bold text-sm">
              X
            </div>
            <span className="text-lg font-bold text-[#007a78]">InterviewX</span>
          </div>
          <div className="flex items-center gap-4">
            {interviewStarted && (
              <div className="text-xl font-bold text-[#007a78] font-mono px-3 py-1 bg-[#f0fdf4] rounded-lg border border-[#11cd68]/30 text-sm">
                {formatTime(timer)}
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* Main Content - Scrollable Container */}
      <div className="relative z-10 flex-1 overflow-y-auto pt-16 pb-6 px-0 md:px-0">
        {/* Debug Authentication Status - Top Alert */}
        {session?.user && !interviewStarted && (
          <div className="mx-auto max-w-6xl mb-6 p-3 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-green-800 font-semibold text-sm">
              ✅ Authenticated as: <span className="font-mono">{session.user.email}</span>
            </p>
          </div>
        )}

        {!interviewStarted ? (
          // Before Interview - Content within max-width container
          <div className="mx-auto max-w-6xl">
            {/* Header - Only show before interview starts */}
            <div className="mb-4">
              <h1 className="text-2xl md:text-3xl font-bold text-[#007a78] mb-1">
                {interviewData?.title ? `Interview: ${interviewData.title}` : 'Technical Interview'}
              </h1>
              <p className="text-sm text-slate-600">
                {interviewData?.hiringFor ? `Hiring for: ${interviewData.hiringFor}` : 
                 interviewData?.client && interviewData.client !== 'Unknown' ? `Hiring for: ${interviewData.client}` :
                 interviewData?.skills && interviewData.skills.length > 0 ? `Skills: ${interviewData.skills.slice(0, 3).map((s: any) => s.name).join(', ')}` :
                 'Powered by OpenAI Realtime API'}
              </p>
            </div>

            {/* Interview Skills Info */}
            {interviewData?.skills && interviewData.skills.length > 0 && (
              <div className="mb-4 p-4 bg-white/80 backdrop-blur-xl border border-[#11cd68]/30 rounded-xl shadow-sm">
                <p className="text-[#007a78] font-semibold text-sm mb-2">Key Skills</p>
                <div className="flex flex-wrap gap-2">
                  {interviewData.skills.map((skill, idx) => (
                    <div
                      key={idx}
                      className="px-3 py-1 rounded-full bg-gradient-to-r from-[#11cd68]/10 to-[#007a78]/10 border border-[#11cd68]/30 text-[#007a78] font-semibold text-xs hover:shadow-md transition-all"
                    >
                      {skill.name}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Error Alert */}
            {error && (
              <div className="mx-auto max-w-6xl mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2 text-sm">
                <AlertCircle className="text-red-600 flex-shrink-0 mt-0.5" size={18} />
                <div>
                  <p className="text-red-900 font-semibold">Connection Error</p>
                  <p className="text-red-700 text-xs">{error}</p>
                </div>
              </div>
            )}

            {interviewCompleted ? (
              // Thank You Screen - Interview Already Completed
              <div className="bg-white/80 backdrop-blur-xl border border-[#11cd68]/30 rounded-xl p-8 shadow-sm text-center">
                <div className="w-20 h-20 bg-gradient-to-br from-[#11cd68] to-[#007a78] rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                  <CheckCircle2 className="text-white" size={40} />
                </div>
                <h2 className="text-3xl font-bold text-[#007a78] mb-3">Thank You!</h2>
                <p className="text-slate-600 text-base mb-6">
                  Your technical interview has been completed and recorded. 
                </p>
                <p className="text-slate-600 text-sm mb-8">
                  Our team will review your responses and get back to you soon with feedback.
                </p>
                <div className="bg-[#f0fdf4] border border-[#11cd68]/30 rounded-lg p-4 mb-6">
                  <p className="text-[#007a78] font-semibold text-sm">
                    ✓ Interview responses saved
                  </p>
                  <p className="text-[#007a78] font-semibold text-sm">
                    ✓ Analysis in progress
                  </p>
                  <p className="text-[#007a78] font-semibold text-sm">
                    ✓ Feedback coming soon
                  </p>
                </div>
                <p className="text-slate-500 text-xs">
                  This interview session has ended. You cannot start a new interview in this session.
                </p>
              </div>
            ) : (
              // Start Interview Screen
              <div className="bg-white/80 backdrop-blur-xl border border-[#11cd68]/30 rounded-xl p-6 shadow-sm">
                <div className="text-center mb-6">
                  <div className="w-16 h-16 bg-gradient-to-br from-[#007a78] to-[#11cd68] rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                    <Mic className="text-white" size={32} />
                  </div>
                  <h2 className="text-2xl font-bold text-[#007a78] mb-2">Ready?</h2>
                  <p className="text-slate-600 text-sm">Start your AI-powered technical interview.</p>
                </div>

                {/* Permission Error Alert */}
                {permissionError && (
                  <div className="mb-4 p-4 bg-red-50 border border-red-300 rounded-lg flex items-start gap-3 text-sm">
                    <AlertCircle className="text-red-600 flex-shrink-0 mt-0.5" size={20} />
                    <div className="flex-1">
                      <p className="text-red-900 font-semibold mb-2">{permissionError}</p>
                      {permissionError === 'Not authenticated' && (
                        <div className="text-red-700 text-xs space-y-2">
                          <p>You need to be logged in to start an interview.</p>
                          <button
                            onClick={() => router.push('/auth/login')}
                            className="inline-block mt-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-semibold transition-all"
                          >
                            Go to Login
                          </button>
                        </div>
                      )}
                      {permissionError !== 'Not authenticated' && (
                        <p className="text-red-700">{permissionError}</p>
                      )}
                    </div>
                  </div>
                )}

                {/* Device Status Checks */}
                <div className="bg-[#f0fdf4] border border-[#11cd68]/30 rounded-lg p-4 mb-6 space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${micPermission ? 'bg-[#11cd68]' : 'bg-slate-400'}`} />
                    <span className="text-slate-700">
                      Microphone: <span className="font-semibold">{micPermission ? 'Granted' : 'Not Granted'}</span>
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${cameraPermission ? 'bg-[#11cd68]' : 'bg-slate-400'}`} />
                    <span className="text-slate-700">
                      Camera: <span className="font-semibold">{cameraPermission ? 'Granted' : 'Not Granted'}</span>
                    </span>
                  </div>
                </div>

                {/* Device Warning Alert */}
                {deviceWarning && (
                  <div className="mb-4 p-3 bg-yellow-50 border-l-4 border-yellow-400 rounded-lg flex items-start gap-2 text-sm">
                    <AlertCircle className="text-yellow-600 flex-shrink-0 mt-0.5" size={18} />
                    <div>
                      <p className="text-yellow-900 font-semibold">Device Alert</p>
                      <p className="text-yellow-800 text-xs">{deviceWarning}</p>
                    </div>
                  </div>
                )}

                {/* Status and Controls */}
                <div className="bg-white/80 backdrop-blur-xl border border-[#11cd68]/30 rounded-lg p-4 shadow-sm">
                  {/* Control buttons */}
                  <div className="flex gap-2 justify-center mb-4">
                    <button
                      onClick={() => setMicOn(!micOn)}
                      className={`p-2 rounded-lg transition-all ${
                        micOn ? 'bg-[#11cd68]/20 text-[#007a78] border border-[#11cd68]/50' : 'bg-red-50 text-red-600 border border-red-200'
                      }`}
                      title={micOn ? 'Mute' : 'Unmute'}
                    >
                      {micOn ? <Mic size={20} /> : <MicOff size={20} />}
                    </button>
                    <button
                      onClick={() => setCameraOn(!cameraOn)}
                      className={`p-2 rounded-lg transition-all ${
                        cameraOn ? 'bg-[#11cd68]/20 text-[#007a78] border border-[#11cd68]/50' : 'bg-red-50 text-red-600 border border-red-200'
                      }`}
                      title={cameraOn ? 'Stop Camera' : 'Start Camera'}
                    >
                      {cameraOn ? <Video size={20} /> : <VideoOff size={20} />}
                    </button>
                  </div>

                  {/* Start Button */}
                  <button
                    onClick={handleStart}
                    disabled={permissionError !== null}
                    className={`w-full py-2 px-4 rounded-lg font-semibold text-white transition-all text-sm ${
                      permissionError !== null
                        ? 'bg-slate-400 cursor-not-allowed'
                        : 'bg-gradient-to-r from-[#007a78] to-[#0a9f5d] hover:shadow-lg active:scale-95'
                    }`}
                  >
                    Start Interview
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          // During Interview - Full screen layout with camera maximized and conversation on right
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-0 h-screen w-screen fixed inset-0 top-16 bg-white">
            {/* Left Panel - Full Screen Camera with Floating Controls */}
            <div className="lg:col-span-8 flex flex-col gap-0 h-full overflow-hidden relative">
              {/* Camera Screen - Full height, maximized */}
              <div className="bg-slate-900 rounded-none shadow-none overflow-hidden flex items-center justify-center w-full h-full">
                {cameraOn ? (
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover"
                    style={{ transform: 'scaleX(-1)' }}
                  />
                ) : (
                  <div className="flex flex-col items-center gap-2">
                    <VideoOff size={64} className="text-slate-400" />
                    <span className="text-slate-400 text-base">Camera Off</span>
                  </div>
                )}
              </div>

              {/* Floating Control Buttons - Positioned at bottom center over video */}
              <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 flex gap-3 bg-white/90 backdrop-blur-md border border-slate-200 rounded-full px-4 py-3 shadow-lg hover:shadow-xl transition-shadow">
                <button
                  onClick={() => setMicOn(!micOn)}
                  className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
                    micOn ? 'bg-[#11cd68] text-white hover:bg-[#0a9f5d]' : 'bg-red-500 text-white hover:bg-red-600'
                  }`}
                  title={micOn ? 'Mute' : 'Unmute'}
                >
                  {micOn ? <Mic size={24} /> : <MicOff size={24} />}
                </button>
                <button
                  onClick={() => setCameraOn(!cameraOn)}
                  className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
                    cameraOn ? 'bg-[#11cd68] text-white hover:bg-[#0a9f5d]' : 'bg-red-500 text-white hover:bg-red-600'
                  }`}
                  title={cameraOn ? 'Stop Camera' : 'Start Camera'}
                >
                  {cameraOn ? <Video size={24} /> : <VideoOff size={24} />}
                </button>
                <div className="w-px bg-slate-300" />
                <button
                  onClick={handleEnd}
                  className="w-12 h-12 rounded-full flex items-center justify-center bg-red-600 text-white hover:bg-red-700 transition-all"
                  title="End Interview"
                >
                  <Phone size={24} style={{ transform: 'rotate(135deg)' }} />
                </button>
              </div>
            </div>

            {/* Right Panel - Full Conversation Transcript with AI Agent Animation */}
            <div className="lg:col-span-4 flex flex-col h-full overflow-hidden border-l border-slate-200">
              <ConversationDisplay 
                messages={messages}
                isListening={isListening}
                loading={savingConversation}
              />
              
              {/* Animated AI Agent Speaking Sphere */}
              <div className="flex-1 flex flex-col items-center justify-end p-4 bg-gradient-to-b from-slate-50 to-slate-100">
                <div className="relative w-28 h-28 flex items-center justify-center mb-3">
                  {/* Outer glow effect */}
                  <div className="absolute inset-0 rounded-full bg-gradient-to-br from-blue-400 via-purple-400 to-cyan-400 opacity-20 blur-3xl animate-pulse" />
                  
                  {/* Main sphere with gradient */}
                  <div className="relative w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 shadow-2xl overflow-hidden">
                    {/* Inner light effect */}
                    <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white to-transparent opacity-30 animate-spin" style={{ animationDuration: '3s' }} />
                    
                    {/* Wave animation lines */}
                    <div className="absolute inset-0 rounded-full border-2 border-cyan-300 opacity-50 animate-pulse" style={{ animationDuration: '1.5s' }} />
                    <div className="absolute inset-2 rounded-full border border-purple-300 opacity-40 animate-ping" style={{ animationDuration: '2s' }} />
                    
                    {/* Center highlight */}
                    <div className="absolute top-2 left-3 w-3 h-3 bg-white rounded-full opacity-60 blur-sm" />
                  </div>
                  
                  {/* Floating particles around sphere */}
                  <div className="absolute w-1 h-1 bg-cyan-400 rounded-full top-2 left-8 animate-bounce" style={{ animationDuration: '1.2s' }} />
                  <div className="absolute w-1 h-1 bg-purple-400 rounded-full bottom-4 right-6 animate-bounce" style={{ animationDuration: '1.5s', animationDelay: '0.3s' }} />
                  <div className="absolute w-1 h-1 bg-pink-400 rounded-full top-8 right-4 animate-bounce" style={{ animationDuration: '1.3s', animationDelay: '0.6s' }} />
                </div>
                
                {/* Status text */}
                <p className="text-sm font-medium text-slate-600">AI Agent</p>
                <p className="text-xs text-slate-500 mt-1">
                  {isListening ? 'Listening...' : savingConversation ? 'Processing...' : 'Ready'}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Subscription Paywall - Only show if user hits interview limits */}
      {showPaywall && (
        <SubscriptionPaywall 
          onClose={() => setShowPaywall(false)}
          remainingInterviews={subscriptionInfo.remainingInterviews}
          currentPlan={subscriptionInfo.currentPlan}
        />
      )}
    </div>
  )
}