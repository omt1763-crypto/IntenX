/**
 * Quick Start: AI Interview Fine-Tuning Implementation
 * 
 * This file shows how to integrate the AI fine-tuning system
 * into your existing interview realtime page.
 * 
 * Copy the relevant parts into your app/interview/realtime/page.tsx
 */

import { generateSmartFollowUp, generateEnhancedSystemPrompt, InterviewAIConfig } from '@/lib/ai/interview-ai-integration'
import { suggestNextSkillToProbe } from '@/lib/ai/followup-question-generator'

// ============================================================================
// STEP 1: Add this to your interview state initialization
// ============================================================================

interface UseInterviewState {
  interviewConfig: InterviewAIConfig | null
  conversationHistory: Array<{ role: string; content: string }>
  skillsCovered: Set<string>
  assessmentData: Map<string, any>
}

// ============================================================================
// STEP 2: When you have interview data, create the config
// ============================================================================

function initializeInterviewConfig(
  jobData: any,
  applicantData: any
): InterviewAIConfig {
  return {
    jobTitle: jobData?.title || 'Technical Position',
    jobDescription: jobData?.description || '',
    requiredSkills: jobData?.skills || [
      { name: 'Core Technical Skill', reason: 'Essential for role', importance: 'high' },
    ],
    company: jobData?.company || 'Our Company',
    candidateName: applicantData?.name || undefined,
    candidatePosition: applicantData?.position || undefined,
    resumeText: applicantData?.resume || undefined,
    candidateEmail: applicantData?.email || undefined,
    candidatePhone: applicantData?.phone || undefined,
  }
}

// ============================================================================
// STEP 3: Generate the system prompt for your AI
// ============================================================================

function createAISystemPrompt(interviewConfig: InterviewAIConfig): string {
  return generateEnhancedSystemPrompt(interviewConfig)
}

// Example usage:
/*
const systemPrompt = createAISystemPrompt(interviewConfig)

// Use this when initializing your AI:
const aiResponse = await openai.chat.completions.create({
  model: 'gpt-4',
  messages: [
    { role: 'system', content: systemPrompt },
    ...conversationHistory
  ],
  temperature: 0.7,
})
*/

// ============================================================================
// STEP 4: When candidate responds, generate smart follow-up
// ============================================================================

async function handleCandidateResponse(
  candidateResponse: string,
  interviewConfig: InterviewAIConfig,
  conversationHistory: Array<{ role: string; content: string }>
) {
  // Add candidate response to history
  const updatedHistory = [
    ...conversationHistory,
    { role: 'user', content: candidateResponse },
  ]

  // Option A: Use automatic follow-up generation (recommended for training)
  const smartFollowUp = generateSmartFollowUp(
    candidateResponse,
    updatedHistory,
    interviewConfig
  )

  console.log('Generated Follow-Up Question:', smartFollowUp)

  // Option B: Let the AI handle it naturally
  // (The enhanced system prompt guides the AI to ask good follow-ups)

  return {
    updatedHistory,
    suggestedFollowUp: smartFollowUp,
  }
}

// ============================================================================
// STEP 5: Track skills being assessed
// ============================================================================

function trackSkillAssessment(
  candidateResponse: string,
  conversationHistory: Array<{ role: string; content: string }>,
  interviewConfig: InterviewAIConfig
): {
  nextSkill: string
  skillsCovered: string[]
} {
  const nextSkill = suggestNextSkillToProbe(conversationHistory, interviewConfig.requiredSkills)

  // Extract skills mentioned in conversation
  const skillsCovered = interviewConfig.requiredSkills
    .filter(skill => {
      const conversationText = conversationHistory
        .map(msg => msg.content.toLowerCase())
        .join(' ')
      return conversationText.includes(skill.name.toLowerCase())
    })
    .map(skill => skill.name)

  return {
    nextSkill,
    skillsCovered,
  }
}

// ============================================================================
// STEP 6: Save assessment data for later analysis
// ============================================================================

interface SkillAssessment {
  skill: string
  candidateResponses: string[]
  assessmentNotes: string
  confidenceLevel: 'high' | 'medium' | 'low'
  recommendation: 'strong-fit' | 'good-fit' | 'borderline' | 'poor-fit'
}

function generateSkillAssessment(
  skill: string,
  responses: string[],
  interviewConfig: InterviewAIConfig
): SkillAssessment {
  return {
    skill,
    candidateResponses: responses,
    assessmentNotes: `Assessed ${skill} through targeted follow-up questions based on job requirements`,
    confidenceLevel: 'medium', // Would be enhanced with actual assessment logic
    recommendation: 'good-fit', // Would be enhanced with actual assessment logic
  }
}

// ============================================================================
// STEP 7: Integrate into your existing interview page
// ============================================================================

/*
// In your RealtimeInterviewPageContent component:

// State management
const [interviewConfig, setInterviewConfig] = useState<InterviewAIConfig | null>(null)
const [skillsAssessments, setSkillsAssessments] = useState<SkillAssessment[]>([])

// When interview data loads
useEffect(() => {
  if (interviewData && applicantData) {
    const config = initializeInterviewConfig(interviewData, applicantData)
    setInterviewConfig(config)
  }
}, [interviewData, applicantData])

// When sending message to AI
const handleSendMessage = async (userMessage: string) => {
  if (!interviewConfig) return

  // Track the response
  const { updatedHistory, suggestedFollowUp } = await handleCandidateResponse(
    userMessage,
    interviewConfig,
    conversationHistory
  )

  // Track skills
  const { nextSkill, skillsCovered } = trackSkillAssessment(
    userMessage,
    updatedHistory,
    interviewConfig
  )

  console.log('Next Skill to Probe:', nextSkill)
  console.log('Skills Covered So Far:', skillsCovered)

  // Update state
  setConversationHistory(updatedHistory)

  // Call your existing AI API
  const aiResponse = await fetch('/api/chat', {
    method: 'POST',
    body: JSON.stringify({
      messages: updatedHistory,
      systemPrompt: createAISystemPrompt(interviewConfig),
    }),
  })
}

// When interview ends, save assessments
const handleInterviewComplete = async () => {
  const finalAssessments = interviewConfig.requiredSkills.map(skill =>
    generateSkillAssessment(skill.name, [], interviewConfig)
  )

  // Save to database
  await fetch('/api/interviews/save-assessment', {
    method: 'POST',
    body: JSON.stringify({
      interviewId: currentInterviewId,
      assessments: finalAssessments,
      conversationHistory,
    }),
  })
}
*/

// ============================================================================
// STEP 8: API endpoint example for saving interview data
// ============================================================================

/*
// app/api/interviews/save-assessment/route.ts

import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { interviewId, assessments, conversationHistory } = await request.json()

    // Analyze the conversation with AI
    const analysisPrompt = `Analyze this interview conversation and provide:
1. Overall assessment
2. Key strengths shown
3. Gaps to address
4. Recommendation

Conversation:
${conversationHistory.map(msg => `${msg.role}: ${msg.content}`).join('\n\n')}`

    // Call OpenAI or your LLM
    const analysis = await analyzingLLM(analysisPrompt)

    // Save to database
    const result = await supabase
      .from('interviews')
      .update({
        assessment_data: {
          skillAssessments: assessments,
          overallAnalysis: analysis,
          conversationSummary: conversationHistory.length + ' messages',
        },
        analysis: analysis,
        score: calculateScore(assessments),
      })
      .eq('id', interviewId)

    return NextResponse.json({ success: true, data: result })
  } catch (error) {
    console.error('Error saving assessment:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
*/

// ============================================================================
// STEP 9: Monitoring and analytics
// ============================================================================

interface InterviewMetrics {
  interviewDuration: number
  totalMessages: number
  skillsAssessed: string[]
  averageResponseLength: number
  followUpEffectiveness: number // 0-100
}

function calculateInterviewMetrics(
  conversationHistory: Array<{ role: string; content: string }>,
  interviewConfig: InterviewAIConfig,
  startTime: Date
): InterviewMetrics {
  const candidateMessages = conversationHistory.filter(msg => msg.role === 'user')
  const totalLength = candidateMessages.reduce((sum, msg) => sum + msg.content.length, 0)

  const { skillsCovered } = trackSkillAssessment(
    '',
    conversationHistory,
    interviewConfig
  )

  return {
    interviewDuration: (Date.now() - startTime.getTime()) / 1000,
    totalMessages: conversationHistory.length,
    skillsAssessed: skillsCovered,
    averageResponseLength: totalLength / candidateMessages.length,
    followUpEffectiveness: (skillsCovered.length / interviewConfig.requiredSkills.length) * 100,
  }
}

// ============================================================================
// TESTING: Example test data
// ============================================================================

const EXAMPLE_JOB_DATA = {
  title: 'Senior React Developer',
  description: 'Build scalable web applications with React, TypeScript, and Next.js',
  company: 'TechCorp',
  skills: [
    { name: 'React', reason: 'Core UI framework', importance: 'critical' },
    { name: 'TypeScript', reason: 'Type safety', importance: 'high' },
    { name: 'State Management', reason: 'Complex state handling', importance: 'high' },
    { name: 'Performance Optimization', reason: 'Fast, responsive UIs', importance: 'medium' },
  ],
}

const EXAMPLE_CANDIDATE_DATA = {
  name: 'John Doe',
  email: 'john@example.com',
  position: 'Mid-level Frontend Developer',
  resume: 'Google 3 years, React experience...',
}

// Test
const config = initializeInterviewConfig(EXAMPLE_JOB_DATA, EXAMPLE_CANDIDATE_DATA)
const systemPrompt = createAISystemPrompt(config)

console.log('System Prompt Generated:', systemPrompt.substring(0, 200) + '...')
console.log('Interview Config:', config)

export {
  initializeInterviewConfig,
  createAISystemPrompt,
  handleCandidateResponse,
  trackSkillAssessment,
  generateSkillAssessment,
  calculateInterviewMetrics,
  EXAMPLE_JOB_DATA,
  EXAMPLE_CANDIDATE_DATA,
}
