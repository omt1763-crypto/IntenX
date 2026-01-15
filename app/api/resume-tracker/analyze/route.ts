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
    const formData = await request.formData()
    const file = formData.get('file') as File | null
    let resumeText = formData.get('resumeText') as string | null
    const jobDescription = formData.get('jobDescription') as string | null
    const phoneNumber = formData.get('phoneNumber') as string

    // Extract text from file if provided
    if (file) {
      const buffer = Buffer.from(await file.arrayBuffer())
      
      if (file.type === 'application/pdf') {
        resumeText = await extractTextFromPDF(buffer)
      } else if (file.type === 'text/plain') {
        resumeText = buffer.toString('utf-8')
      } else {
        // For DOCX, try to extract as text
        resumeText = buffer.toString('utf-8')
      }
    }

    if (!resumeText || !resumeText.trim()) {
      return NextResponse.json({ error: 'Could not extract text from file. Please paste text manually.' }, { status: 400 })
    }

    console.log('[Resume Tracker] Analyzing resume...')

    // OpenAI Analysis
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
    "actionVerbSuggestions": [array of weak verbs to replace, e.g. "Replace 'worked' with 'led' or 'drove'"],
    "summaryRewrite": "A compelling professional summary suggestion (2-3 sentences)",
    "skillSectionTips": [array of 2-3 tips to optimize skills section],
    "quantificationNeeded": [array of achievements that need metrics]
  },
  "jdComparison": {
    "matchedKeywords": [array of keywords from JD that are in resume],
    "missingKeywords": [array of keywords from JD that are NOT in resume],
    "roleAlignment": number (0-100, how well resume fits the job),
    "matchPercentage": number (0-100, percentage of JD keywords covered)
  },
  "atsSimulation": {
    "parsedSuccessfully": boolean,
    "contactInfoFound": boolean,
    "experienceSection": boolean,
    "educationSection": boolean,
    "skillsSection": boolean,
    "formattingWarnings": [array of formatting issues that ATS might struggle with]
  },
  "actionableTips": [array of 5-7 specific, actionable tips to improve resume in 10-20 minutes]
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
    let analysis

    try {
      const jsonMatch = analysisText?.match(/\{[\s\S]*\}/)
      analysis = JSON.parse(jsonMatch ? jsonMatch[0] : analysisText || '{}')
    } catch (parseError) {
      console.error('[Resume Tracker] JSON parse error')
      analysis = {
        atsScore: 70,
        readabilityScore: 75,
        keywordMatchScore: 65,
        roleFitScore: 60,
        experienceRelevance: 70,
        skillsCoverage: 65,
        formattingQuality: 80,
        overallScore: 70,
        strengths: ['Clear structure', 'Good formatting'],
        weaknesses: ['Add more metrics', 'Expand skills'],
        keywords: [],
        missingKeywords: [],
        atsCompatibility: { issues: [], passed: [] },
        improvementSuggestions: {
          criticalFixes: [],
          bulletPointImprovements: [],
          actionVerbSuggestions: [],
          summaryRewrite: '',
          skillSectionTips: [],
          quantificationNeeded: [],
        },
        jdComparison: {
          matchedKeywords: [],
          missingKeywords: [],
          roleAlignment: 60,
          matchPercentage: 60,
        },
        atsSimulation: {
          parsedSuccessfully: true,
          contactInfoFound: true,
          experienceSection: true,
          educationSection: true,
          skillsSection: true,
          formattingWarnings: [],
        },
        actionableTips: [],
      }
    }

    // Save to Supabase
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
      console.error('[Resume Tracker] Save error:', saveError)
    }

    return NextResponse.json({
      success: true,
      analysis,
      resumeId: resumeData?.[0]?.id,
      phoneNumber,
      createdAt: new Date().toISOString(),
    })
  } catch (error) {
    console.error('[Resume Tracker] Error:', error)
    return NextResponse.json(
      {
        error: 'Failed to analyze resume',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
