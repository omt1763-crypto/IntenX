import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import OpenAI from 'openai'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
)

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

async function extractTextFromPDF(buffer: Buffer): Promise<string> {
  try {
    const pdfParse = require('pdf-parse')
    const data = await pdfParse(buffer)
    return data.text
  } catch (error) {
    console.error('PDF parse error:', error)
    throw new Error('Failed to extract text from PDF')
  }
}

export async function POST(request: NextRequest) {
  try {
    // Check if OpenAI API key is set
    if (!process.env.OPENAI_API_KEY) {
      console.error('[Resume Tracker] FATAL: OPENAI_API_KEY is not set in environment variables')
      console.error('[Resume Tracker] Available env vars:', Object.keys(process.env).filter(k => k.includes('OPENAI') || k.includes('KEY')).join(', '))
      return NextResponse.json(
        { error: 'Server configuration error: OpenAI API key is not configured. Please set OPENAI_API_KEY environment variable.' },
        { status: 500 }
      )
    }
    
    console.log('[Resume Tracker] ✅ OPENAI_API_KEY is configured')

    const formData = await request.formData()
    const file = formData.get('file') as File | null
    let resumeText = formData.get('resumeText') as string | null
    const jobDescription = formData.get('jobDescription') as string | null
    const phoneNumber = formData.get('phoneNumber') as string

    console.log('[Resume Tracker] Received request:', { hasFile: !!file, hasText: !!resumeText, phoneNumber })

    // Extract text from file if provided
    if (file) {
      console.log('[Resume Tracker] Processing file:', file.name, file.type)
      const buffer = Buffer.from(await file.arrayBuffer())
      
      if (file.type === 'application/pdf') {
        console.log('[Resume Tracker] Extracting text from PDF...')
        resumeText = await extractTextFromPDF(buffer)
      } else if (file.type === 'text/plain') {
        resumeText = buffer.toString('utf-8')
      } else {
        // For DOCX, try to extract as text
        resumeText = buffer.toString('utf-8')
      }
      console.log('[Resume Tracker] Extracted text length:', resumeText?.length)
    }

    if (!resumeText || !resumeText.trim()) {
      return NextResponse.json({ error: 'Could not extract text from file. Please paste text manually.' }, { status: 400 })
    }

    console.log('[Resume Tracker] Analyzing resume with OpenAI...')
    console.log('[Resume Tracker] Resume text length:', resumeText.length)
    console.log('[Resume Tracker] Job description provided:', !!jobDescription)

    // OpenAI Analysis
    let analysis

    try {
      console.log('[Resume Tracker] Making OpenAI API call with model: gpt-4o-mini')
      const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `You are an expert ATS system and recruiter. Analyze the resume and provide ONLY a JSON response with this exact structure (no extra text):
{
  "atsScore": number (0-100),
  "readabilityScore": number (0-100),
  "keywordMatchScore": number (0-100),
  "roleFitScore": number (0-100),
  "experienceRelevance": number (0-100),
  "skillsCoverage": number (0-100),
  "formattingQuality": number (0-100),
  "overallScore": number (0-100),
  "strengths": [string array of 4-5 key strengths],
  "weaknesses": [string array of 4-5 areas to improve],
  "keywords": [array of 15-20 important keywords found],
  "missingKeywords": [array of 10-15 important keywords that should be added],
  "atsCompatibility": {
    "issues": [array of specific ATS issues found],
    "passed": [array of ATS checks that passed]
  },
  "improvementSuggestions": {
    "criticalFixes": [array of 3-4 critical things to fix immediately],
    "bulletPointImprovements": [array of 3-5 weak bullet points to rewrite with suggestions],
    "actionVerbSuggestions": [array of weak verbs to replace],
    "summaryRewrite": "A compelling professional summary suggestion",
    "skillSectionTips": [array of tips],
    "quantificationNeeded": [array of achievements needing metrics]
  },
  "jdComparison": {
    "matchedKeywords": [array of matched keywords],
    "missingKeywords": [array of missing keywords],
    "roleAlignment": number (0-100),
    "matchPercentage": number (0-100)
  },
  "atsSimulation": {
    "parsedSuccessfully": boolean,
    "contactInfoFound": boolean,
    "experienceSection": boolean,
    "educationSection": boolean,
    "skillsSection": boolean,
    "formattingWarnings": [array of warnings]
  },
  "actionableTips": [array of 5-7 tips]
}`,
          },
          {
            role: 'user',
            content: jobDescription
              ? `Analyze this resume against the job description:\n\nRESUME:\n${resumeText}\n\nJOB DESCRIPTION:\n${jobDescription}`
              : `Analyze this resume:\n\n${resumeText}`,
          },
        ],
        temperature: 0.7,
        max_tokens: 4000,
      })

      const analysisText = response.choices[0].message.content
      console.log('[Resume Tracker] OpenAI response received, length:', analysisText?.length)

      try {
        analysis = JSON.parse(analysisText || '{}')
        console.log('[Resume Tracker] Successfully parsed OpenAI response')
      } catch (parseError) {
        console.error('[Resume Tracker] JSON parse error:', parseError, 'Content:', analysisText?.substring(0, 500))
        return NextResponse.json(
          {
            error: 'Failed to parse resume analysis response',
            details: 'OpenAI response was not valid JSON',
          },
          { status: 500 }
        )
      }
    } catch (openaiError) {
      console.error('[Resume Tracker] OpenAI API error:', openaiError)
      const errorMessage = openaiError instanceof Error ? openaiError.message : String(openaiError)
      return NextResponse.json(
        {
          error: 'Failed to analyze resume with AI',
          details: errorMessage,
        },
        { status: 500 }
      )
    }

    // Save to Supabase (optional - don't fail if it doesn't work)
    try {
      const { data: resumeData, error: saveError } = await supabase
        .from('resumes')
        .insert({
          phone_number: phoneNumber || 'anonymous',
          resume_text: resumeText,
          job_description: jobDescription || null,
          analysis: analysis,
          status: 'applied',
          created_at: new Date().toISOString(),
        })
        .select()

      if (saveError) {
        console.warn('[Resume Tracker] Supabase save warning (non-fatal):', saveError.message)
      } else {
        console.log('[Resume Tracker] Successfully saved to Supabase')
      }
    } catch (supabaseError) {
      console.warn('[Resume Tracker] Supabase save failed (non-fatal):', supabaseError)
    }

    return NextResponse.json({
      success: true,
      analysis,
      phoneNumber,
      createdAt: new Date().toISOString(),
    })
  } catch (error) {
    console.error('[Resume Tracker] Unexpected outer error:', error)
    const errorMessage = error instanceof Error ? error.message : String(error)
    return NextResponse.json(
      {
        error: 'Failed to analyze resume',
        details: errorMessage,
      },
      { status: 500 }
    )
  }
}
