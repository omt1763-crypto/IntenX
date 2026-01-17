import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';

export const maxDuration = 300; // 5 minutes for Vercel

// Initialize Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('FATAL: Missing Supabase credentials');
}

const supabase = createClient(supabaseUrl || '', supabaseKey || '');

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  const requestId = Math.random().toString(36).substring(7);
  const logs: string[] = [];

  const log = (step: string, message: string, data?: any) => {
    const entry = `[Resume-${requestId}] ${step}: ${message}${
      data ? ' | ' + JSON.stringify(data) : ''
    }`;
    logs.push(entry);
    console.log(entry);
  };

  try {
    log('STEP-1', 'POST request received');

    // ===== FORM PARSING =====
    log('STEP-2', 'Parsing form data...');
    const formData = await request.formData();
    log('STEP-3', 'Form data parsed successfully', {
      hasResume: formData.has('resume'),
      hasFile: formData.has('file'),
      hasResumeText: formData.has('resumeText'),
      hasJobDescription: formData.has('jobDescription'),
    });

    // Accept 'resume', 'file', or 'resumeText' from frontend
    const resumeInput = (formData.get('resume') || formData.get('file') || formData.get('resumeText')) as string | File | null;
    const jobDescription = (formData.get('jobDescription') as string) || '';

    log('STEP-4', 'Extracted form fields', {
      resumeType: resumeInput instanceof File ? 'File' : 'String',
      jobDescriptionLength: jobDescription?.length || 0,
    });

    if (!resumeInput) {
      log('STEP-5', 'ERROR: No resume provided');
      return NextResponse.json(
        { error: 'No resume provided' },
        { status: 400 }
      );
    }

    let resumeText: string = '';

    // Extract resume text based on type
    if (resumeInput instanceof File) {
      log('STEP-6a', 'Processing resume as File', { fileName: resumeInput.name });
      const buffer = await resumeInput.arrayBuffer();
      const bytes = new Uint8Array(buffer);

      // Try pdf-parse for PDF files
      if (resumeInput.name.toLowerCase().endsWith('.pdf')) {
        log('STEP-6b', 'Detected PDF file, attempting pdf-parse...');
        try {
          // Use require for pdf-parse to avoid TypeScript import issues
          // @ts-ignore - pdf-parse CommonJS module
          const pdfParse = require('pdf-parse');
          const pdfData = await pdfParse(bytes);
          resumeText = pdfData.text;
          log('STEP-6c', 'PDF parsed successfully', {
            textLength: resumeText?.length || 0,
          });
        } catch (pdfError) {
          log('STEP-6c-ERROR', 'PDF parsing failed, using empty text', {
            error: String(pdfError),
          });
          resumeText = '';
        }
      } else {
        // For non-PDF files, try to convert to text
        log('STEP-6d', 'Processing non-PDF file');
        resumeText = new TextDecoder().decode(bytes);
        log('STEP-6e', 'File converted to text', {
          textLength: resumeText?.length || 0,
        });
      }
    } else {
      // resumeInput is a string
      resumeText = resumeInput;
      log('STEP-6f', 'Resume provided as string', {
        textLength: resumeText?.length || 0,
      });
    }

    if (!resumeText.trim()) {
      log('STEP-7', 'ERROR: Resume text is empty after extraction');
      return NextResponse.json(
        { error: 'Could not extract resume text' },
        { status: 400 }
      );
    }

    log('STEP-8', 'Resume text successfully extracted', {
      textLength: resumeText.length,
      preview: resumeText.substring(0, 100),
    });

    // ===== OPENAI API CALL =====
    log('STEP-9', 'Building analysis prompt...');

    const systemPrompt = `You are an expert resume analyzer. Analyze the provided resume${
      jobDescription ? ' against the job description' : ''
    } and provide a detailed analysis.

Please respond with a JSON object containing:
{
  "matchScore": <number 0-100>,
  "strengths": [<list of key strengths from resume>],
  "areasForImprovement": [<areas that could be improved>],
  "recommendations": [<specific actionable recommendations>],
  "summary": "<brief professional summary>"
}`;

    const userContent = jobDescription
      ? `Resume:\n${resumeText}\n\nJob Description:\n${jobDescription}\n\nPlease analyze this resume against the job description.`
      : `Resume:\n${resumeText}\n\nPlease analyze this resume.`;

    log('STEP-10', 'Calling OpenAI API', {
      model: 'gpt-4o-mini',
      hasJobDescription: !!jobDescription,
      resumeLength: resumeText.length,
    });

    let response;
    try {
      response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userContent },
        ],
        temperature: 0.7,
        max_tokens: 2000,
      });

      log('STEP-11', 'OpenAI API call succeeded', {
        hasContent: !!response.choices?.[0]?.message?.content,
      });
    } catch (openaiError: any) {
      log('STEP-11-ERROR', 'OpenAI API call failed', {
        errorMessage: openaiError?.message,
        errorCode: openaiError?.code,
        errorStatus: openaiError?.status,
      });
      throw new Error(
        `OpenAI API failed: ${openaiError?.message || 'Unknown error'}`
      );
    }

    // ===== PARSE RESPONSE =====
    log('STEP-12', 'Parsing OpenAI response...');

    const analysisContent = response.choices[0]?.message?.content;

    if (!analysisContent) {
      log('STEP-13-ERROR', 'No content in OpenAI response');
      throw new Error('No analysis content from OpenAI');
    }

    log('STEP-13', 'Response content extracted', {
      contentLength: analysisContent.length,
    });

    let analysis;
    try {
      // Try to extract JSON from the response
      const jsonMatch = analysisContent.match(/\{[\s\S]*\}/);
      const jsonStr = jsonMatch ? jsonMatch[0] : analysisContent;

      analysis = JSON.parse(jsonStr);
      log('STEP-14', 'JSON parsed successfully', {
        keys: Object.keys(analysis),
      });
    } catch (parseError) {
      log('STEP-14-WARNING', 'Could not parse JSON, returning raw response', {
        error: String(parseError),
      });
      // Provide a fallback structure
      analysis = {
        rawAnalysis: analysisContent,
        matchScore: 0,
        strengths: [],
        areasForImprovement: [],
        recommendations: [],
        summary: analysisContent,
      };
    }

    // ===== SAVE TO DATABASE =====
    log('STEP-15', 'Saving analysis to Supabase...');

    try {
      const { data: saved, error: dbError } = await supabase
        .from('resume_tracker')
        .insert({
          resume_text: resumeText,
          job_description: jobDescription || null,
          analysis: analysis,
          created_at: new Date().toISOString(),
        })
        .select();

      if (dbError) {
        log('STEP-15-WARNING', 'Database save failed, but continuing', {
          error: dbError.message,
        });
      } else {
        log('STEP-16', 'Analysis saved to database successfully');
      }
    } catch (dbError) {
      log('STEP-15-WARNING', 'Database operation error, continuing', {
        error: String(dbError),
      });
    }

    // ===== SUCCESS =====
    log('STEP-17', 'SUCCESS: Returning analysis to client');

    return NextResponse.json(
      {
        success: true,
        analysis: analysis,
      },
      { status: 200 }
    );
  } catch (error: any) {
    log('FATAL-ERROR', 'Unhandled error in POST handler', {
      errorMessage: error?.message,
    });

    console.error('Resume analyzer error:', error?.message);

    return NextResponse.json(
      {
        success: false,
        error: error?.message || 'Failed to analyze resume',
      },
      { status: 500 }
    );
  }
}
