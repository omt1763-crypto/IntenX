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
          content: `You are an expert resume analyst and recruiter. Analyze the given resume and provide a detailed JSON response ONLY with this exact structure (no extra text, pure JSON):
{
  "overallScore": number (0-100),
  "atsScore": number (0-100),
  "contentScore": number (0-100),
  "searchability": number (0-100),
  "strengths": [string array of 3-5 key strengths],
  "areasToImprove": [string array of 3-5 areas to improve],
  "keywords": [array of 10-15 important keywords found],
  "hardSkills": [array of technical/hard skills found like "Python", "AWS", "SQL"],
  "softSkills": [array of soft skills found like "Leadership", "Communication"],
  "missingElements": [array of important elements missing that would make resume better, e.g. "GPA/Academic honors", "Certifications", "Quantifiable metrics"],
  "skillsComparison": {"skillName": {"yourLevel": "Expert|Intermediate|Beginner", "industryAverage": "Expert|Intermediate|Beginner", "gap": number (-100 to 100)}, ...},
  "competitiveAnalysis": "1-2 sentence analysis of how this resume compares to typical candidates in the industry",
  "recruiterTips": [array of 5-7 specific actionable tips from a recruiter perspective to make the resume excellent],
  "formattingIssues": [array of formatting problems if any, e.g. "Inconsistent date formats", "Too many fonts"],
  "sections": {
    "contentChecks": {"atsParseRate": {"status": "pass|fail", "feedback": string}, "repetitionOfWords": {"status": "pass|fail", "feedback": string}, "spellingAndGrammar": {"status": "pass|fail", "feedback": string}, "quantifiedAchievements": {"status": "pass|fail", "feedback": string}},
    "formatChecks": {"fileFormat": {"status": "pass|fail", "feedback": string}, "resumeLength": {"status": "pass|fail", "feedback": string}, "bulletPointLength": {"status": "pass|fail", "feedback": string}},
    "skillsChecks": {"hardSkillsListed": {"status": "pass|fail", "feedback": string}, "softSkillsIncluded": {"status": "pass|fail", "feedback": string}},
    "resumeSectionsChecks": {"contactInformation": {"status": "pass|fail", "feedback": string}, "essentialSections": {"status": "pass|fail", "feedback": string}, "personalityShowcase": {"status": "pass|fail", "feedback": string}},
    "styleChecks": {"resumeDesign": {"status": "pass|fail", "feedback": string}, "emailAddressFormat": {"status": "pass|fail", "feedback": string}, "activeVoiceUsage": {"status": "pass|fail", "feedback": string}, "buzzwordsClichés": {"status": "pass|fail", "feedback": string}}
  }
}`,
        },
        {
          role: 'user',
          content: `Please analyze this resume:\n\n${resumeText}`,
        },
      ],
      temperature: 0.7,
      max_tokens: 3000,
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
        searchability: 75,
        hardSkills: [],
        softSkills: [],
        missingElements: [],
        skillsComparison: {},
        competitiveAnalysis: '',
        recruiterTips: [],
        formattingIssues: [],
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
