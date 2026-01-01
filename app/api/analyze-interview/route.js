import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

const OPENAI_API_KEY = process.env.OPENAI_API_KEY

export async function POST(req) {
  try {
    const body = await req.json()
    const { conversation, skills, duration, applicantId, interviewId } = body

    console.log('[AnalyzeInterview API] Request body:', JSON.stringify(body, null, 2))
    console.log('[AnalyzeInterview API] Analyzing interview for applicant:', applicantId)
    console.log('[AnalyzeInterview API] Conversation messages:', conversation?.length || 0)
    console.log('[AnalyzeInterview API] Skills extracted:', skills?.length || 0)
    console.log('[AnalyzeInterview API] Interview duration:', duration, 'seconds')

    if (!conversation || !Array.isArray(conversation) || conversation.length === 0) {
      console.error('[AnalyzeInterview API] Invalid conversation:', conversation)
      return NextResponse.json(
        { error: 'No conversation data to analyze', received: conversation },
        { status: 400 }
      )
    }

    // Validate minimum interview participation
    const MINIMUM_DURATION = 30 // seconds - require at least 30 seconds
    const MINIMUM_CANDIDATE_MESSAGES = 2 // require at least 2 candidate responses
    const MINIMUM_AVG_MESSAGE_LENGTH = 10 // characters - require meaningful responses

    // Count candidate messages and check their length
    const candidateMessages = conversation
      .filter(msg => msg.role === 'user')
      .filter(msg => msg.content && msg.content.trim().length > 0)
    
    console.log('[AnalyzeInterview API] Candidate messages count:', candidateMessages.length)
    
    const avgCandidateMessageLength = candidateMessages.length > 0
      ? candidateMessages.reduce((sum, msg) => sum + (msg.content?.length || 0), 0) / candidateMessages.length
      : 0

    console.log('[AnalyzeInterview API] Average candidate message length:', avgCandidateMessageLength)

    // Reject if interview is too short
    if (duration < MINIMUM_DURATION) {
      console.warn(`[AnalyzeInterview API] Interview too short: ${duration}s < ${MINIMUM_DURATION}s`)
      return NextResponse.json(
        {
          error: 'Interview duration too short',
          message: `Interview must be at least ${MINIMUM_DURATION} seconds long. Current: ${duration}s`,
          minRequired: MINIMUM_DURATION,
          actual: duration
        },
        { status: 400 }
      )
    }

    // Reject if not enough candidate participation
    if (candidateMessages.length < MINIMUM_CANDIDATE_MESSAGES) {
      console.warn(`[AnalyzeInterview API] Not enough candidate responses: ${candidateMessages.length} < ${MINIMUM_CANDIDATE_MESSAGES}`)
      return NextResponse.json(
        {
          error: 'Not enough candidate participation',
          message: `Candidate must provide at least ${MINIMUM_CANDIDATE_MESSAGES} responses. Got: ${candidateMessages.length}`,
          minRequired: MINIMUM_CANDIDATE_MESSAGES,
          actual: candidateMessages.length
        },
        { status: 400 }
      )
    }

    // Reject if responses are too short (not meaningful)
    if (avgCandidateMessageLength < MINIMUM_AVG_MESSAGE_LENGTH) {
      console.warn(`[AnalyzeInterview API] Candidate responses too short: avg ${avgCandidateMessageLength} chars < ${MINIMUM_AVG_MESSAGE_LENGTH}`)
      return NextResponse.json(
        {
          error: 'Candidate responses too brief',
          message: `Responses must be more detailed. Average length: ${Math.round(avgCandidateMessageLength)} characters (minimum: ${MINIMUM_AVG_MESSAGE_LENGTH})`,
          minRequired: MINIMUM_AVG_MESSAGE_LENGTH,
          actual: Math.round(avgCandidateMessageLength)
        },
        { status: 400 }
      )
    }

    console.log('[AnalyzeInterview API] Interview validation passed - proceeding with analysis')

    if (!OPENAI_API_KEY) {
      console.error('[AnalyzeInterview API] Missing OPENAI_API_KEY')
      return NextResponse.json(
        { error: 'API key not configured' },
        { status: 500 }
      )
    }

    // Format conversation for AI analysis
    const conversationText = conversation
      .map(msg => `${msg.role === 'user' ? 'Candidate' : 'Interviewer'}: ${msg.content}`)
      .join('\n\n')

    const skillsText = skills && skills.length > 0 
      ? skills.map(s => `- ${typeof s === 'string' ? s : s.name || s}`).join('\n')
      : 'No specific skills identified'

    // Create prompt for AI to analyze - request JSON ONLY
    const analysisPrompt = `You are an expert HR recruiter and interview analyst. Analyze this job interview VERY CAREFULLY and critically.

IMPORTANT SCORING GUIDELINES:
- Score 0-30: Candidate showed little to no relevant experience, unclear communication, or lack of preparation
- Score 31-50: Basic understanding but missing depth, limited examples, vague answers
- Score 51-70: Good understanding, relevant examples, clear communication but some gaps
- Score 71-85: Strong understanding, multiple relevant examples, excellent communication
- Score 86-100: Exceptional understanding, comprehensive examples, outstanding communication and fit

INTERVIEW CONVERSATION:
${conversationText}

TARGET SKILLS:
${skillsText}

INTERVIEW DURATION: ${duration} seconds

CRITICAL EVALUATION REQUIREMENTS:
1. ONLY score high (>70) if candidate demonstrates CLEAR, SPECIFIC examples of relevant experience
2. ONLY score high if candidate shows UNDERSTANDING of the target skills/role
3. Score lower if candidate gives generic, vague, or off-topic answers
4. Weight scores based on how specifically candidate addressed job requirements
5. If candidate barely spoke, scores should be much lower (0-40 range)
6. Be HARSH on vague answers - require concrete examples

Respond with ONLY valid JSON (no markdown, no extra text):
{
  "jobSuitability": <number 0-100 - How well does candidate fit this specific job?>,
  "relevantAccomplishments": <number 0-100 - Did candidate show SPECIFIC relevant achievements?>,
  "driveInitiative": <number 0-100 - Did candidate show motivation and proactive thinking?>,
  "problemSolving": <number 0-100 - Did candidate demonstrate problem-solving with concrete examples?>,
  "cultureScopes": <number 0-100 - Would candidate fit company culture?>,
  "leadershipInfluence": <number 0-100 - Did candidate show leadership or collaboration skills?>,
  "overall": <number 0-100 - OVERALL ASSESSMENT (be critical and conservative in scoring)>,
  "recommendation": "<MUST be one of: 'Strong Candidate' (overall 75+) | 'Consider for Interview' (overall 50-74) | 'Do Not Hire' (overall <50)>",
  "summary": "<2-3 sentences - what are the key observations about this candidate? Be specific.>",
  "strengths": ["<specific strength based on what they said>", "<another specific strength>", "<third if applicable>"],
  "weaknesses": ["<specific weakness or gap>", "<another weakness>"],
  "areasToExplore": ["<follow-up question or area>", "<another area to probe>"]
}`

    console.log('[AnalyzeInterview API] Sending to OpenAI for analysis...')

    // Call OpenAI API with gpt-4o-mini (reliable and cost-effective)
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are an expert HR recruiter and interview analyst. Provide detailed assessments ONLY in valid JSON format. Return proper JSON object.'
          },
          {
            role: 'user',
            content: analysisPrompt
          }
        ],
        temperature: 0.7,
        max_tokens: 2000
      })
    })

    if (!response.ok) {
      const error = await response.json()
      console.error('[AnalyzeInterview API] OpenAI error:', error)
      return NextResponse.json(
        { error: 'Failed to analyze interview', details: error },
        { status: 400 }
      )
    }

    const aiResponse = await response.json()
    const analysisContent = aiResponse.choices[0].message.content

    console.log('[AnalyzeInterview API] AI Response length:', analysisContent.length)
    console.log('[AnalyzeInterview API] AI Response first 200 chars:', analysisContent.substring(0, 200))

    // Parse the JSON response
    let analysis
    try {
      analysis = JSON.parse(analysisContent)
      console.log('[AnalyzeInterview API] Successfully parsed JSON analysis')
    } catch (parseError) {
      console.error('[AnalyzeInterview API] Failed to parse AI response as JSON:', parseError)
      console.error('[AnalyzeInterview API] Response content:', analysisContent)
      // Try to extract JSON from the response
      const jsonMatch = analysisContent.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        try {
          analysis = JSON.parse(jsonMatch[0])
          console.log('[AnalyzeInterview API] Successfully extracted and parsed JSON')
        } catch (extractError) {
          console.error('[AnalyzeInterview API] Failed to parse extracted JSON:', extractError)
          throw new Error(`Could not parse AI response as JSON: ${extractError.message}`)
        }
      } else {
        throw new Error('Could not find JSON in AI response')
      }
    }

    console.log('[AnalyzeInterview API] Analysis parsed:', JSON.stringify(analysis).substring(0, 200))

    // Save analysis to interviews table
    // Priority: Use interviewId if provided, otherwise try applicantId
    if (interviewId) {
      console.log('[AnalyzeInterview API] Saving analysis directly to interview:', interviewId)
      const { error: updateError } = await supabaseAdmin
        .from('interviews')
        .update({
          analysis: analysis,
          score: Math.round(analysis.overall || 0),
          updated_at: new Date().toISOString()
        })
        .eq('id', interviewId)

      if (updateError) {
        console.error('[AnalyzeInterview API] Error updating interview with analysis:', updateError)
      } else {
        console.log('[AnalyzeInterview API] Interview analysis saved successfully to interview id:', interviewId)
      }
    } else if (applicantId) {
      console.log('[AnalyzeInterview API] Saving analysis for applicantId:', applicantId)
      const { data: interviewData, error: fetchError } = await supabaseAdmin
        .from('interviews')
        .select('id')
        .eq('applicant_id', applicantId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      if (fetchError) {
        console.error('[AnalyzeInterview API] Error fetching interview:', fetchError)
      } else if (interviewData) {
        console.log('[AnalyzeInterview API] Found interview to update:', interviewData.id)
        const { error: updateError } = await supabaseAdmin
          .from('interviews')
          .update({
            analysis: analysis,
            score: Math.round(analysis.overall || 0),
            updated_at: new Date().toISOString()
          })
          .eq('id', interviewData.id)

        if (updateError) {
          console.error('[AnalyzeInterview API] Error updating interview with analysis:', updateError)
        } else {
          console.log('[AnalyzeInterview API] Interview analysis saved successfully to interview id:', interviewData.id)
        }
      } else {
        console.log('[AnalyzeInterview API] No interview found for applicantId:', applicantId)
      }
    } else {
      console.log('[AnalyzeInterview API] No interviewId or applicantId provided, analysis not saved to database')
    }

    return NextResponse.json({
      success: true,
      analysis: analysis
    })
  } catch (error) {
    console.error('[AnalyzeInterview API] Error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
