/**
 * AI Interview Analysis Service
 *
 * Integrates with:
 * 1. Whisper (OpenAI) - Speech-to-text transcription
 * 2. GPT-4 / Claude - Answer evaluation and scoring
 * 3. Real-time analysis for live feedback
 *
 * Architecture:
 * - Audio stream from WebRTC → Sent to backend
 * - Backend streams to Whisper API
 * - Transcription stored in database
 * - GPT-4 analyzes responses in real-time
 * - Scores returned to frontend for UI display
 *
 * Installation:
 * npm install openai
 * npm install @anthropic-ai/sdk
 */

export interface TranscriptionChunk {
  timestamp: number
  text: string
  speaker: 'candidate' | 'recruiter'
  confidence: number
}

export interface AnalysisResult {
  score: number // 0-100
  strengths: string[]
  improvements: string[]
  keyPoints: string[]
  sentiment: 'positive' | 'neutral' | 'negative'
  depth: number // 0-100 (how technical/detailed)
  clarity: number // 0-100 (how clear/articulate)
}

export interface InterviewMetrics {
  communicationScore: number
  technicalScore: number
  engagementScore: number
  responseTime: number // Average seconds to respond
  turnCount: number // Number of speaker turns
  totalDuration: number // Total seconds
  transcription: TranscriptionChunk[]
  analyses: Map<string, AnalysisResult>
}

/**
 * Transcribe audio using Whisper API
 *
 * TODO: Implement server-side endpoint:
 * POST /api/interview/transcribe
 *
 * Backend should:
 * 1. Receive audio blob/buffer
 * 2. Send to OpenAI Whisper API
 * 3. Stream transcription chunks back
 * 4. Store in database
 *
 * Example using openai-js SDK:
 * ```typescript
 * import { OpenAI } from 'openai'
 *
 * const openai = new OpenAI({
 *   apiKey: process.env.OPENAI_API_KEY
 * })
 *
 * const transcription = await openai.audio.transcriptions.create({
 *   file: audioFile,
 *   model: 'whisper-1',
 *   language: 'en',
 *   prompt: 'Interview discussion about software engineering',
 * })
 *
 * return { text: transcription.text }
 * ```
 */
export async function transcribeAudio(
  audioBlob: Blob,
  speaker: 'candidate' | 'recruiter'
): Promise<string> {
  try {
    const formData = new FormData()
    formData.append('audio', audioBlob)
    formData.append('speaker', speaker)

    const response = await fetch('/api/interview/transcribe', {
      method: 'POST',
      body: formData,
    })

    if (!response.ok) throw new Error('Transcription failed')
    const data = await response.json()
    return data.text
  } catch (error) {
    console.error('[AI] Transcription error:', error)
    throw error
  }
}

/**
 * Analyze candidate response using LLM
 *
 * TODO: Implement server-side endpoint:
 * POST /api/interview/analyze
 *
 * Backend should:
 * 1. Receive transcription + job requirements
 * 2. Call GPT-4 or Claude with structured prompt
 * 3. Return JSON with scoring
 *
 * Example using openai-js SDK:
 * ```typescript
 * const completion = await openai.chat.completions.create({
 *   model: 'gpt-4',
 *   messages: [
 *     {
 *       role: 'system',
 *       content: `You are an expert technical interviewer evaluating candidate responses...`
 *     },
 *     {
 *       role: 'user',
 *       content: `Analyze this response: "${transcription}"\nJob requirements: ${jobReqs}`
 *     }
 *   ],
 *   temperature: 0.7,
 *   max_tokens: 500,
 *   response_format: { type: 'json_object' }
 * })
 *
 * return JSON.parse(completion.choices[0].message.content)
 * ```
 *
 * Example using Anthropic Claude:
 * ```typescript
 * import Anthropic from '@anthropic-ai/sdk'
 *
 * const client = new Anthropic()
 *
 * const message = await client.messages.create({
 *   model: 'claude-3-opus-20240229',
 *   max_tokens: 1024,
 *   messages: [
 *     {
 *       role: 'user',
 *       content: `Analyze this response...`
 *     }
 *   ]
 * })
 *
 * return message.content[0].type === 'text' ? JSON.parse(message.content[0].text) : null
 * ```
 */
export async function analyzeResponse(
  transcription: string,
  jobRequirements: string,
  skillsFocus: string[]
): Promise<AnalysisResult> {
  try {
    const response = await fetch('/api/interview/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        transcription,
        jobRequirements,
        skillsFocus,
      }),
    })

    if (!response.ok) throw new Error('Analysis failed')
    return await response.json()
  } catch (error) {
    console.error('[AI] Analysis error:', error)
    throw error
  }
}

/**
 * Get AI-generated feedback for candidate
 *
 * TODO: Implement real-time feedback generation
 */
export async function generateFeedback(
  interviewId: string,
  currentMetrics: InterviewMetrics
): Promise<string> {
  try {
    const response = await fetch('/api/interview/feedback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        interviewId,
        metrics: {
          communicationScore: currentMetrics.communicationScore,
          technicalScore: currentMetrics.technicalScore,
          engagementScore: currentMetrics.engagementScore,
        },
      }),
    })

    if (!response.ok) throw new Error('Feedback generation failed')
    const data = await response.json()
    return data.feedback
  } catch (error) {
    console.error('[AI] Feedback generation error:', error)
    throw error
  }
}

/**
 * Stream real-time analysis updates
 *
 * Uses Server-Sent Events (SSE) for real-time scoring
 *
 * TODO: Implement backend streaming endpoint
 */
export function subscribeToRealTimeAnalysis(
  interviewId: string,
  onUpdate: (metrics: Partial<InterviewMetrics>) => void,
  onError: (error: Error) => void
): () => void {
  const eventSource = new EventSource(
    `/api/interview/${interviewId}/analysis/stream`
  )

  eventSource.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data)
      onUpdate(data)
    } catch (error) {
      onError(error as Error)
    }
  }

  eventSource.onerror = () => {
    eventSource.close()
    onError(new Error('Analysis stream closed'))
  }

  // Return unsubscribe function
  return () => eventSource.close()
}

/**
 * Generate interview summary report
 *
 * TODO: Implement after-interview report generation
 */
export async function generateReport(interviewId: string): Promise<any> {
  try {
    const response = await fetch(`/api/interview/${interviewId}/report`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    })

    if (!response.ok) throw new Error('Report generation failed')
    return await response.json()
  } catch (error) {
    console.error('[AI] Report generation error:', error)
    throw error
  }
}

/**
 * Prompt engineering utilities
 *
 * Use these templates when calling LLMs
 */
export const PROMPTS = {
  SYSTEM_PROMPT: `You are an expert technical interviewer with 15+ years of experience interviewing candidates for senior roles at FAANG companies. Your job is to evaluate candidate responses based on:

1. Technical Depth - Understanding of concepts, not just memorization
2. Communication - Clear explanation of complex ideas
3. Problem-solving - Approach to unfamiliar problems
4. Experience - Relevant past projects and lessons learned
5. Culture Fit - Enthusiasm and values alignment

Always be fair, encouraging, and provide constructive feedback.`,

  ANALYSIS_PROMPT: (transcription: string, jobReqs: string, skills: string[]) => `
Analyze this candidate response:
"${transcription}"

Job Requirements:
${jobReqs}

Key Skills to Evaluate:
${skills.map((s) => `- ${s}`).join('\n')}

Provide a JSON response with:
{
  "score": 0-100,
  "strengths": ["..."],
  "improvements": ["..."],
  "keyPoints": ["..."],
  "sentiment": "positive|neutral|negative",
  "depth": 0-100,
  "clarity": 0-100,
  "feedback": "One sentence constructive feedback"
}
`,

  FEEDBACK_PROMPT: (metrics: any) => `
Based on these metrics:
- Communication: ${metrics.communicationScore}%
- Technical: ${metrics.technicalScore}%
- Engagement: ${metrics.engagementScore}%

Generate one encouraging sentence of real-time feedback to the candidate.
Keep it to 1-2 sentences max.
`,
}

export default {
  transcribeAudio,
  analyzeResponse,
  generateFeedback,
  subscribeToRealTimeAnalysis,
  generateReport,
}
