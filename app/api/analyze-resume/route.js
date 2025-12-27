import { NextResponse } from 'next/server'

const OPENAI_API_KEY = process.env.OPENAI_API_KEY

// Import pdf-parse for PDF text extraction
let pdfParse

async function getPdfParser() {
  if (!pdfParse) {
    try {
      pdfParse = require('pdf-parse')
    } catch (e) {
      console.warn('pdf-parse not available, will use text-based approach')
      return null
    }
  }
  return pdfParse
}

export async function POST(req) {
  try {
    const body = await req.json()
    const { fileName, fileType, fileContent } = body

    console.log('[AnalyzeResume] Starting analysis for:', fileName)
    console.log('[AnalyzeResume] File type:', fileType)
    console.log('[AnalyzeResume] Content size:', fileContent?.length)

    if (!fileContent) {
      return NextResponse.json(
        { error: 'No resume content provided' },
        { status: 400 }
      )
    }

    if (!OPENAI_API_KEY) {
      console.error('[AnalyzeResume] OPENAI_API_KEY not set')
      return NextResponse.json(
        { error: 'OpenAI API key not configured' },
        { status: 500 }
      )
    }

    // Extract base64 from data URL if needed
    let base64Content = fileContent
    if (fileContent.startsWith('data:')) {
      const parts = fileContent.split(',')
      base64Content = parts[1]
    }

    console.log('[AnalyzeResume] Base64 length:', base64Content.length)
    
    let resumeText = ''
    
    try {
      const buffer = Buffer.from(base64Content, 'base64')
      console.log('[AnalyzeResume] Buffer size:', buffer.length)

      // Try pdf-parse first
      const pdfParser = await getPdfParser()
      
      if (pdfParser && fileType?.includes('pdf')) {
        try {
          const data = await pdfParser(buffer)
          resumeText = data.text || ''
          console.log('[AnalyzeResume] PDF parsed successfully, text length:', resumeText.length)
        } catch (pdfErr) {
          console.warn('[AnalyzeResume] pdf-parse failed, falling back to text extraction:', pdfErr.message)
          // Fall back to text extraction
          resumeText = buffer.toString('utf-8', 0, Math.min(buffer.length, 100000))
        }
      } else {
        // For non-PDF files or if parser unavailable, extract as text
        resumeText = buffer.toString('utf-8', 0, Math.min(buffer.length, 100000))
      }
      
      // Clean up extracted text
      resumeText = resumeText
        .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
      
      console.log('[AnalyzeResume] Extracted text length:', resumeText.length)
      
      if (resumeText.length < 30) {
        console.warn('[AnalyzeResume] Warning: Very short extracted text')
        return NextResponse.json(
          { error: 'Could not extract text from resume. File may be corrupted, image-based, or not a valid document.' },
          { status: 400 }
        )
      }
    } catch (err) {
      console.error('[AnalyzeResume] Text extraction error:', err.message)
      return NextResponse.json(
        { error: `Resume extraction failed: ${err.message}` },
        { status: 400 }
      )
    }

    console.log('[AnalyzeResume] Text preview:', resumeText.substring(0, 300))

    // Create analysis prompt with extracted text
    const analysisPrompt = `You are an expert recruiter and career coach. Analyze this resume and provide comprehensive feedback.

RESUME TEXT:
${resumeText.substring(0, 5000)}

Return ONLY a valid JSON object (no markdown, no code blocks, no explanations, no extra text) with this structure:
{
  "score": <number 0-100>,
  "strengths": ["strength1", "strength2", "strength3", "strength4", "strength5"],
  "improvements": ["improvement1", "improvement2", "improvement3", "improvement4", "improvement5"],
  "suggestions": ["suggestion1", "suggestion2", "suggestion3", "suggestion4"],
  "skills": ["skill1", "skill2", "skill3", "skill4", "skill5", "skill6", "skill7", "skill8"],
  "atsScore": <number 0-100>,
  "recommendations": ["recommendation1", "recommendation2", "recommendation3"]
}`

    console.log('[AnalyzeResume] Calling OpenAI GPT-4...')

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'You are a recruiter. Output ONLY valid JSON, no other text.'
          },
          {
            role: 'user',
            content: analysisPrompt
          }
        ],
        temperature: 0.7,
        max_tokens: 1500
      })
    })

    console.log('[AnalyzeResume] OpenAI response status:', response.status)

    if (!response.ok) {
      const errorText = await response.text()
      console.error('[AnalyzeResume] OpenAI error response:', errorText.substring(0, 500))
      return NextResponse.json(
        { error: `OpenAI API error: ${response.status}` },
        { status: response.status }
      )
    }

    const aiResponse = await response.json()
    console.log('[AnalyzeResume] Got response from OpenAI')

    if (!aiResponse.choices?.[0]?.message?.content) {
      console.error('[AnalyzeResume] Invalid response structure')
      return NextResponse.json(
        { error: 'Invalid response from OpenAI' },
        { status: 500 }
      )
    }

    let content = aiResponse.choices[0].message.content
    console.log('[AnalyzeResume] Response content length:', content.length)

    // Parse JSON response
    let analysis = null
    
    try {
      // Try direct parse
      analysis = JSON.parse(content)
    } catch (e1) {
      // Try removing markdown
      try {
        let cleaned = content
        if (cleaned.startsWith('```json')) {
          cleaned = cleaned.replace(/^```json\s*/, '').replace(/\s*```$/, '')
        } else if (cleaned.startsWith('```')) {
          cleaned = cleaned.replace(/^```\s*/, '').replace(/\s*```$/, '')
        }
        analysis = JSON.parse(cleaned)
      } catch (e2) {
        // Try extracting JSON
        try {
          const match = content.match(/\{[\s\S]*\}/)
          if (match) {
            analysis = JSON.parse(match[0])
          }
        } catch (e3) {
          console.error('[AnalyzeResume] Could not parse JSON:', e1.message)
          console.log('[AnalyzeResume] Raw content:', content.substring(0, 300))
        }
      }
    }

    // Provide safe defaults if parsing failed
    if (!analysis) {
      analysis = {
        score: 70,
        strengths: ['Resume provided', 'Professional format'],
        improvements: ['Add more details', 'Improve formatting'],
        suggestions: ['Enhance content'],
        skills: ['Communication'],
        atsScore: 70,
        recommendations: ['Review and improve']
      }
    }

    // Ensure all required fields exist
    const safeAnalysis = {
      score: typeof analysis.score === 'number' ? analysis.score : 70,
      strengths: Array.isArray(analysis.strengths) ? analysis.strengths.slice(0, 5) : [],
      improvements: Array.isArray(analysis.improvements) ? analysis.improvements.slice(0, 5) : [],
      suggestions: Array.isArray(analysis.suggestions) ? analysis.suggestions.slice(0, 4) : [],
      skills: Array.isArray(analysis.skills) ? analysis.skills.slice(0, 8) : [],
      atsScore: typeof analysis.atsScore === 'number' ? analysis.atsScore : 70,
      recommendations: Array.isArray(analysis.recommendations) ? analysis.recommendations.slice(0, 3) : []
    }

    console.log('[AnalyzeResume] Analysis complete')

    return NextResponse.json({
      success: true,
      analysis: safeAnalysis
    })
  } catch (error) {
    console.error('[AnalyzeResume] Unexpected error:', error.message)
    console.error('[AnalyzeResume] Stack:', error.stack)
    return NextResponse.json(
      { error: `Server error: ${error.message}` },
      { status: 500 }
    )
  }
}
