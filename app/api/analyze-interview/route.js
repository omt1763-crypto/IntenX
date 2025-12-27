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

    if (!conversation || !Array.isArray(conversation) || conversation.length === 0) {
      console.error('[AnalyzeInterview API] Invalid conversation:', conversation)
      return NextResponse.json(
        { error: 'No conversation data to analyze', received: conversation },
        { status: 400 }
      )
    }

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
    const analysisPrompt = `Analyze this job interview VERY CAREFULLY. Return ONLY a valid JSON object, no other text.

INTERVIEW CONVERSATION:
${conversationText}

TARGET SKILLS:
${skillsText}

INTERVIEW DURATION: ${duration} seconds

Analyze the candidate's performance and respond with ONLY this JSON structure (no markdown, no extra text):
{
  "jobSuitability": <number 0-100>,
  "relevantAccomplishments": <number 0-100>,
  "driveInitiative": <number 0-100>,
  "problemSolving": <number 0-100>,
  "cultureScopes": <number 0-100>,
  "leadershipInfluence": <number 0-100>,
  "overall": <number 0-100>,
  "recommendation": "<'Strong Candidate' or 'Consider for Interview' or 'Do Not Hire'>",
  "summary": "<2-3 sentence summary of candidate performance>",
  "strengths": ["<strength 1>", "<strength 2>", "<strength 3>"],
  "weaknesses": ["<weakness 1>", "<weakness 2>"],
  "areasToExplore": ["<area 1>", "<area 2>"]
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
