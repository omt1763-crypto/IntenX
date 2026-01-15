import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import OpenAI from 'openai'

// Dynamic import for pdf-parse to handle ESM/CJS compatibility
let pdfParse: any = null

async function getPdfParser() {
  if (!pdfParse) {
    const module = await import('pdf-parse')
    pdfParse = module.default || module
  }
  return pdfParse
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
)

console.log('[Resume Tracker Init] Module initialized')

async function extractTextFromPDF(buffer: Buffer): Promise<string> {
  try {
    console.log('[Resume Tracker] Parsing PDF buffer...')
    const pdfParser = await getPdfParser()
    const data = await pdfParser(buffer)
    console.log('[Resume Tracker] PDF parsed successfully, text length:', data.text?.length)
    return data.text
  } catch (error) {
    console.error('[Resume Tracker] PDF parse error:', error)
    throw new Error('Failed to extract text from PDF')
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('[Resume Tracker] ==================== NEW REQUEST ====================')
    
    // Initialize OpenAI client INSIDE the handler to ensure env vars are loaded
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    })
    
    // Check if OpenAI API key is set
    if (!process.env.OPENAI_API_KEY) {
      console.error('[Resume Tracker] FATAL: OPENAI_API_KEY is not set in environment variables')
      console.error('[Resume Tracker] Available env vars:', Object.keys(process.env).filter(k => k.includes('OPENAI') || k.includes('KEY')).join(', '))
      return NextResponse.json(
        { error: 'Server configuration error: OpenAI API key is not configured.' },
        { status: 500 }
      )
    }
    
    console.log('[Resume Tracker] ✅ STEP 1: OPENAI_API_KEY is configured')
    console.log('[Resume Tracker] Key length:', process.env.OPENAI_API_KEY.length)
    console.log('[Resume Tracker] Key prefix:', process.env.OPENAI_API_KEY.substring(0, 20) + '...')

    console.log('[Resume Tracker] STEP 2: Parsing form data...')
    const formData = await request.formData()
    const file = formData.get('file') as File | null
    let resumeText = formData.get('resumeText') as string | null
    const jobDescription = formData.get('jobDescription') as string | null
    const phoneNumber = formData.get('phoneNumber') as string

    console.log('[Resume Tracker] Form data received:', { hasFile: !!file, hasText: !!resumeText, phoneNumber })

    // Extract text from file if provided
    if (file) {
      console.log('[Resume Tracker] STEP 3: Processing file:', file.name, file.type)
      const buffer = Buffer.from(await file.arrayBuffer())
      
      if (file.type === 'application/pdf') {
        console.log('[Resume Tracker] Extracting text from PDF...')
        resumeText = await extractTextFromPDF(buffer)
      } else if (file.type === 'text/plain') {
        resumeText = buffer.toString('utf-8')
      } else {
        resumeText = buffer.toString('utf-8')
      }
      console.log('[Resume Tracker] Extracted text length:', resumeText?.length)
    }

    if (!resumeText || !resumeText.trim()) {
      console.warn('[Resume Tracker] No resume text provided')
      return NextResponse.json({ error: 'Could not extract text from file. Please paste text manually.' }, { status: 400 })
    }

    console.log('[Resume Tracker] STEP 4: Resume text ready (' + resumeText.length + ' chars)')
    console.log('[Resume Tracker] STEP 5: Preparing OpenAI API call...')

    // OpenAI Analysis
    let analysis

    try {
      console.log('[Resume Tracker] STEP 6: Creating OpenAI client...')
      console.log('[Resume Tracker] OpenAI client exists:', !!openai)
      
      console.log('[Resume Tracker] STEP 7: Calling openai.chat.completions.create()...')
      
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
        ] as any,
        temperature: 0.7,
        max_tokens: 4000,
      })

      console.log('[Resume Tracker] STEP 8: ✅ OpenAI API call succeeded')
      
      const analysisText = response.choices[0].message.content
      console.log('[Resume Tracker] Response length:', analysisText?.length)

      console.log('[Resume Tracker] STEP 9: Parsing JSON response...')
      try {
        analysis = JSON.parse(analysisText || '{}')
        console.log('[Resume Tracker] STEP 10: ✅ JSON parsed successfully')
        console.log('[Resume Tracker] Analysis keys:', Object.keys(analysis).join(', '))
      } catch (parseError) {
        console.error('[Resume Tracker] ❌ JSON parse error:', parseError)
        console.error('[Resume Tracker] Content:', analysisText?.substring(0, 500))
        return NextResponse.json(
          {
            error: 'Failed to parse resume analysis response',
            details: 'OpenAI response was not valid JSON',
          },
          { status: 500 }
        )
      }
    } catch (openaiError) {
      console.error('[Resume Tracker] ❌ STEP 7/8 FAILED: OpenAI API error')
      console.error('[Resume Tracker] Error type:', openaiError instanceof Error ? openaiError.constructor.name : typeof openaiError)
      console.error('[Resume Tracker] Error message:', openaiError instanceof Error ? openaiError.message : String(openaiError))
      
      if (openaiError instanceof Error) {
        console.error('[Resume Tracker] Error stack:', openaiError.stack)
      }
      
      const errorMessage = openaiError instanceof Error ? openaiError.message : String(openaiError)
      
      // Check for specific OpenAI errors
      if (errorMessage.includes('401') || errorMessage.includes('Unauthorized')) {
        console.error('[Resume Tracker] ❌ AUTHENTICATION ERROR - API key invalid or expired')
        return NextResponse.json(
          {
            error: 'Authentication error with OpenAI',
            details: 'API key appears to be invalid or expired',
          },
          { status: 401 }
        )
      }
      
      if (errorMessage.includes('429') || errorMessage.includes('rate_limit')) {
        console.error('[Resume Tracker] ❌ RATE LIMIT - Too many requests')
        return NextResponse.json(
          {
            error: 'OpenAI rate limit exceeded',
            details: 'Please try again in a few moments',
          },
          { status: 429 }
        )
      }
      
      if (errorMessage.includes('quota') || errorMessage.includes('insufficient_quota')) {
        console.error('[Resume Tracker] ❌ QUOTA EXCEEDED')
        return NextResponse.json(
          {
            error: 'OpenAI quota exceeded',
            details: 'Your OpenAI account has reached its usage limit',
          },
          { status: 402 }
        )
      }
      
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
      console.log('[Resume Tracker] STEP 11: Saving to Supabase...')
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
        console.log('[Resume Tracker] ✅ Saved to Supabase')
      }
    } catch (supabaseError) {
      console.warn('[Resume Tracker] Supabase save failed (non-fatal):', supabaseError)
    }

    console.log('[Resume Tracker] STEP 12: ✅ REQUEST COMPLETED SUCCESSFULLY')
    console.log('[Resume Tracker] ==================================================\n')

    return NextResponse.json({
      success: true,
      analysis,
      phoneNumber,
      createdAt: new Date().toISOString(),
    })
  } catch (error) {
    console.error('[Resume Tracker] ❌ UNEXPECTED ERROR:')
    console.error('[Resume Tracker] Type:', error instanceof Error ? error.constructor.name : typeof error)
    console.error('[Resume Tracker] Message:', error instanceof Error ? error.message : String(error))
    if (error instanceof Error) {
      console.error('[Resume Tracker] Stack:', error.stack)
    }
    
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
