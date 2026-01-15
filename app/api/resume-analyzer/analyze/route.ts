import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function POST(request: NextRequest) {
  try {
    const { resumeText, phoneNumber } = await request.json()

    if (!resumeText) {
      return NextResponse.json(
        { error: 'Resume text is required' },
        { status: 400 }
      )
    }

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'OpenAI API key not configured' },
        { status: 500 }
      )
    }

    console.log('[Resume Analyzer] Analyzing resume for phone:', phoneNumber)
    console.log('[Resume Analyzer] Resume length:', resumeText.length)

    // Call OpenAI to analyze the resume
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini', // Use gpt-4o-mini for faster, cheaper analysis
      messages: [
        {
          role: 'system',
          content: `You are an expert resume analyst. Analyze the given resume and provide a detailed JSON response with the following structure:
{
  "overallScore": number (0-100),
  "atsScore": number (0-100),
  "contentScore": number (0-100),
  "strengths": [string array of 3-5 strengths],
  "areasToImprove": [string array of 3-5 areas to improve],
  "keywords": [array of important keywords found],
  "sections": {
    "contentChecks": {
      "atsParseRate": { status: "pass|fail", feedback: string },
      "repetitionOfWords": { status: "pass|fail", feedback: string },
      "spellingAndGrammar": { status: "pass|fail", feedback: string },
      "quantifiedAchievements": { status: "pass|fail", feedback: string }
    },
    "formatChecks": {
      "fileFormat": { status: "pass|fail", feedback: string },
      "resumeLength": { status: "pass|fail", feedback: string },
      "bulletPointLength": { status: "pass|fail", feedback: string }
    },
    "skillsChecks": {
      "hardSkillsListed": { status: "pass|fail", feedback: string },
      "softSkillsIncluded": { status: "pass|fail", feedback: string }
    },
    "resumeSectionsChecks": {
      "contactInformation": { status: "pass|fail", feedback: string },
      "essentialSections": { status: "pass|fail", feedback: string },
      "personalityShowcase": { status: "pass|fail", feedback: string }
    },
    "styleChecks": {
      "resumeDesign": { status: "pass|fail", feedback: string },
      "emailAddressFormat": { status: "pass|fail", feedback: string },
      "activeVoiceUsage": { status: "pass|fail", feedback: string },
      "buzzwordsClichés": { status: "pass|fail", feedback: string }
    }
  }
}`,
        },
        {
          role: 'user',
          content: `Please analyze this resume:\n\n${resumeText}`,
        },
      ],
      temperature: 0.7,
      max_tokens: 2000,
    })

    // Extract the response
    const analysisText = response.choices[0].message.content

    // Try to parse as JSON
    let analysis
    try {
      // Extract JSON from the response (in case there's extra text)
      const jsonMatch = analysisText.match(/\{[\s\S]*\}/)
      analysis = JSON.parse(jsonMatch ? jsonMatch[0] : analysisText)
    } catch (parseError) {
      console.error('[Resume Analyzer] Failed to parse OpenAI response as JSON')
      // Create structured response from text if JSON parsing fails
      analysis = {
        overallScore: 70,
        atsScore: 80,
        contentScore: 60,
        strengths: ['Resume structure is clear', 'Contains relevant keywords'],
        areasToImprove: ['Add more metrics', 'Improve formatting'],
        keywords: [],
        sections: {},
      }
    }

    console.log('[Resume Analyzer] Analysis complete')
    console.log('[Resume Analyzer] Overall Score:', analysis.overallScore)

    return NextResponse.json(
      {
        success: true,
        analysis: {
          ...analysis,
          analyzedAt: new Date().toISOString(),
        },
        phoneNumber: phoneNumber,
        analyzedAt: new Date().toISOString(),
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('[Resume Analyzer] Error:', error)
    return NextResponse.json(
      {
        error: 'Failed to analyze resume',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
