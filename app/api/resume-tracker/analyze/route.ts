import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const maxDuration = 300; // 5 minutes for Vercel

// Initialize Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('FATAL: Missing Supabase credentials');
}

const supabase = createClient(supabaseUrl || '', supabaseKey || '');

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
      hasJobDescription: formData.has('jobDescription'),
    });

    const resumeInput = formData.get('resume') as string | File | null;
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
          // @ts-ignore - dynamic import
          const { default: pdfParse } = await import('pdf-parse');
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

    // ===== OPENAI INITIALIZATION =====
    log('STEP-9', 'Initializing OpenAI client...', {
      apiKeyExists: !!process.env.OPENAI_API_KEY,
      apiKeyLength: process.env.OPENAI_API_KEY?.length || 0,
      apiKeyPrefix: process.env.OPENAI_API_KEY?.substring(0, 10) || 'NONE',
    });

    let OpenAI;
    try {
      // @ts-ignore - dynamic import
      OpenAI = (await import('openai')).default || (await import('openai')).OpenAI;
      log('STEP-10', 'OpenAI module imported successfully');
    } catch (importError) {
      log('STEP-10-ERROR', 'Failed to import OpenAI module', {
        error: String(importError),
      });
      throw new Error(`OpenAI import failed: ${importError}`);
    }

    if (!OpenAI) {
      log('STEP-10a-ERROR', 'OpenAI module is null/undefined');
      throw new Error('OpenAI module is null/undefined');
    }

    let openai;
    try {
      openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
      });
      log('STEP-11', 'OpenAI client instantiated successfully', {
        clientType: typeof openai,
        hasChat: !!openai.chat,
        hasCompletions: !!openai.chat?.completions,
      });
    } catch (clientError) {
      log('STEP-11-ERROR', 'Failed to instantiate OpenAI client', {
        error: String(clientError),
      });
      throw new Error(`OpenAI client instantiation failed: ${clientError}`);
    }

    if (!openai.chat?.completions?.create) {
      log(
        'STEP-11a-ERROR',
        'OpenAI client missing chat.completions.create method'
      );
      throw new Error(
        'OpenAI client missing chat.completions.create method'
      );
    }

    // ===== OPENAI API CALL =====
    log('STEP-12', 'Building prompt and messages...');

    const systemPrompt = `You are an expert resume analyzer. Analyze the provided resume and job description, then provide:
1. A match score (0-100)
2. Key strengths
3. Areas for improvement
4. Specific recommendations

Format your response as JSON with keys: matchScore, strengths, improvements, recommendations`;

    const userMessage = `Resume:\n${resumeText}\n\nJob Description:\n${jobDescription}\n\nPlease analyze this resume against the job description.`;

    log('STEP-13', 'Messages prepared', {
      systemPromptLength: systemPrompt.length,
      userMessageLength: userMessage.length,
      model: 'gpt-4o-mini',
    });

    log('STEP-14', 'ABOUT TO CALL openai.chat.completions.create()');

    let response;
    try {
      log('STEP-15', 'Inside try block, calling OpenAI API...');

      response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userMessage },
        ],
        temperature: 0.7,
        max_tokens: 4000,
      });

      log('STEP-16', 'OpenAI API call succeeded', {
        hasContent: !!response.choices?.[0]?.message?.content,
        firstContentChars: response.choices?.[0]?.message?.content?.substring(0, 50),
      });
    } catch (openaiError: any) {
      log('STEP-15-CATCH', 'OpenAI API call threw error', {
        errorType: openaiError?.constructor?.name,
        errorMessage: openaiError?.message,
        errorCode: openaiError?.code,
        errorStatus: openaiError?.status,
        fullError: JSON.stringify(openaiError, null, 2),
      });

      // Log the full error for debugging
      console.error('FULL OPENAI ERROR:', openaiError);

      throw new Error(
        `OpenAI API failed: ${openaiError?.message || JSON.stringify(openaiError)}`
      );
    }

    // ===== PARSE RESPONSE =====
    log('STEP-17', 'Parsing OpenAI response...');

    const analysisContent = response.choices[0]?.message?.content;

    if (!analysisContent) {
      log('STEP-18-ERROR', 'No content in OpenAI response');
      throw new Error('No analysis content from OpenAI');
    }

    log('STEP-18', 'Response content extracted', {
      contentLength: analysisContent.length,
    });

    let analysis;
    try {
      // Try to extract JSON from the response
      const jsonMatch = analysisContent.match(/\{[\s\S]*\}/);
      const jsonStr = jsonMatch ? jsonMatch[0] : analysisContent;

      analysis = JSON.parse(jsonStr);
      log('STEP-19', 'JSON parsed successfully', {
        keys: Object.keys(analysis),
      });
    } catch (parseError) {
      log('STEP-19-WARNING', 'Could not parse JSON, using raw content', {
        error: String(parseError),
      });
      analysis = { rawAnalysis: analysisContent };
    }

    // ===== SAVE TO DATABASE =====
    log('STEP-20', 'Saving analysis to Supabase...');

    const { data: saved, error: dbError } = await supabase
      .from('resume_tracker')
      .insert({
        resume_text: resumeText,
        job_description: jobDescription,
        analysis: analysis,
        created_at: new Date(),
      });

    if (dbError) {
      log('STEP-20-ERROR', 'Database save failed', {
        error: dbError.message,
        details: dbError.details,
      });
      // Don't throw - still return the analysis even if DB save fails
    } else {
      log('STEP-21', 'Analysis saved to database', {
        savedId: saved?.[0]?.id,
      });
    }

    // ===== SUCCESS =====
    log('STEP-22', 'SUCCESS: Returning analysis to client');

    return NextResponse.json(
      {
        success: true,
        analysis: analysis,
        debugLogs: logs, // Return logs for debugging
      },
      { status: 200 }
    );
  } catch (error: any) {
    log('FATAL-ERROR', 'Unhandled error in POST handler', {
      errorType: error?.constructor?.name,
      errorMessage: error?.message,
      errorStack: error?.stack?.split('\n').slice(0, 5).join(' | '),
      fullError: JSON.stringify(error, null, 2),
    });

    console.error('FATAL ERROR in resume analyzer:', error);
    console.error('Full logs:', logs);

    return NextResponse.json(
      {
        error: error?.message || 'Failed to analyze resume',
        debugLogs: logs, // Return logs even on error for debugging
      },
      { status: 500 }
    );
  }
}
