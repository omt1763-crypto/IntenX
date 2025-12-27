#!/usr/bin/env node

/**
 * Script to regenerate analysis for interviews that don't have it yet
 * This allows us to show real AI feedback for all existing interviews
 */

const fs = require('fs')
const path = require('path')
const { createClient } = require('@supabase/supabase-js')

// Load environment variables from .env.local
function loadEnv() {
  const envPath = path.join(__dirname, '.env.local')
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf-8')
    envContent.split('\n').forEach(line => {
      const trimmed = line.trim()
      if (trimmed && !trimmed.startsWith('#')) {
        const [key, ...valueParts] = trimmed.split('=')
        const value = valueParts.join('=')
        if (key && value) {
          process.env[key.trim()] = value.trim()
        }
      }
    })
  }
}

loadEnv()

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_ADMIN_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ADMIN_KEY
const OPENAI_API_KEY = process.env.OPENAI_API_KEY

const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_ADMIN_KEY)

async function generateAnalysisForInterview(interview) {
  console.log(`\n[Regenerate] Processing interview: ${interview.id}`)
  console.log(`[Regenerate] Title: ${interview.title}, Score: ${interview.score}`)
  
  if (!interview.conversation || interview.conversation.length === 0) {
    console.warn(`[Regenerate] No conversation data for interview ${interview.id}, skipping`)
    return false
  }

  try {
    // Format conversation for AI analysis
    const conversationText = interview.conversation
      .map(msg => `${msg.role === 'user' ? 'Candidate' : 'Interviewer'}: ${msg.content}`)
      .join('\n\n')

    const skillsText = interview.skills && interview.skills.length > 0 
      ? interview.skills.map(s => `- ${typeof s === 'string' ? s : s.name || s}`).join('\n')
      : 'No specific skills identified'

    // Create prompt for AI to analyze
    const analysisPrompt = `Analyze this job interview VERY CAREFULLY. Return ONLY a valid JSON object, no other text.

INTERVIEW CONVERSATION:
${conversationText}

TARGET SKILLS:
${skillsText}

INTERVIEW DURATION: ${interview.duration || 0} seconds

Analyze the candidate's performance and respond with ONLY this JSON structure (no markdown, no extra text):
{
  "jobSuitability": <number 0-100>,
  "relevantAccomplishments": <number 0-100>,
  "driveInitiative": <number 0-100>,
  "problemSolving": <number 0-100>,
  "cultureScopes": <number 0-100>,
  "leadershipInfluence": <number 0-100>,
  "overall": <number 0-100>,
  "recommendation": "<hire/maybe/reject>",
  "strengths": ["<strength1>", "<strength2>", "<strength3>"],
  "weaknesses": ["<weakness1>", "<weakness2>", "<weakness3>"],
  "summary": "<2-3 sentence professional summary>"
}`

    console.log(`[Regenerate] Calling OpenAI API for interview ${interview.id}...`)
    
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
            content: 'You are an expert hiring manager and interview analyst. Analyze interviews and provide detailed feedback.'
          },
          {
            role: 'user',
            content: analysisPrompt
          }
        ],
        temperature: 0.7
      })
    })

    if (!response.ok) {
      const errorData = await response.text()
      console.error(`[Regenerate] API error: ${response.status} - ${errorData}`)
      return false
    }

    const aiResponse = await response.json()
    const analysisContent = aiResponse.choices[0].message.content

    console.log(`[Regenerate] Received AI response, length: ${analysisContent.length}`)

    // Parse the JSON response
    let analysis
    try {
      analysis = JSON.parse(analysisContent)
      console.log(`[Regenerate] Successfully parsed JSON analysis`)
    } catch (parseError) {
      console.error(`[Regenerate] Failed to parse AI response as JSON, attempting extraction`)
      const jsonMatch = analysisContent.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        try {
          analysis = JSON.parse(jsonMatch[0])
          console.log(`[Regenerate] Successfully extracted and parsed JSON`)
        } catch (extractError) {
          console.error(`[Regenerate] Failed to extract JSON: ${extractError.message}`)
          return false
        }
      } else {
        console.error(`[Regenerate] Could not find JSON in response`)
        return false
      }
    }

    // Calculate score from analysis
    const scoreFromAnalysis = Math.round(analysis.overall || 0)
    console.log(`[Regenerate] Analysis overall score: ${scoreFromAnalysis}`)

    // Update the interview with the analysis and calculated score
    console.log(`[Regenerate] Updating interview ${interview.id} with analysis...`)
    const { error: updateError } = await supabaseAdmin
      .from('interviews')
      .update({
        analysis: analysis,
        score: scoreFromAnalysis, // Set the score from analysis
        updated_at: new Date().toISOString()
      })
      .eq('id', interview.id)

    if (updateError) {
      console.error(`[Regenerate] Error updating interview: ${updateError.message}`)
      return false
    }

    console.log(`[Regenerate] ✅ Successfully updated interview ${interview.id}`)
    return true
  } catch (error) {
    console.error(`[Regenerate] Exception processing interview ${interview.id}: ${error.message}`)
    return false
  }
}

async function main() {
  console.log('🚀 Starting interview analysis regeneration...')
  console.log(`SUPABASE_URL: ${SUPABASE_URL}`)
  console.log(`OPENAI_API_KEY: ${OPENAI_API_KEY ? 'Set' : 'NOT SET'}`)

  if (!SUPABASE_URL || !SUPABASE_ADMIN_KEY || !OPENAI_API_KEY) {
    console.error('❌ Missing environment variables')
    console.error('Required: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, OPENAI_API_KEY')
    process.exit(1)
  }

  try {
    // Fetch all interviews with zero score or no analysis
    console.log('\n[Regenerate] Fetching interviews that need analysis...')
    const { data: interviewsToAnalyze, error: fetchError } = await supabaseAdmin
      .from('interviews')
      .select('*')
      .or('score.eq.0,analysis.is.null')
      .order('created_at', { ascending: false })

    if (fetchError) {
      console.error(`[Regenerate] Error fetching interviews: ${fetchError.message}`)
      process.exit(1)
    }

    console.log(`[Regenerate] Found ${interviewsToAnalyze?.length || 0} interviews needing analysis`)

    if (!interviewsToAnalyze || interviewsToAnalyze.length === 0) {
      console.log('✅ No interviews need analysis')
      process.exit(0)
    }

    // Process each interview
    let successCount = 0
    let failureCount = 0

    for (const interview of interviewsToAnalyze) {
      const success = await generateAnalysisForInterview(interview)
      if (success) {
        successCount++
      } else {
        failureCount++
      }
      // Add delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 1000))
    }

    console.log(`\n\n✅ Analysis regeneration complete!`)
    console.log(`   Successful: ${successCount}`)
    console.log(`   Failed: ${failureCount}`)
    process.exit(failureCount > 0 ? 1 : 0)
  } catch (error) {
    console.error(`[Regenerate] Fatal error: ${error.message}`)
    console.error(error)
    process.exit(1)
  }
}

main()
