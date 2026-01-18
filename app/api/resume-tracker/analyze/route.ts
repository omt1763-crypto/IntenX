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

// Extract text from PDF using pdf-parse with fallback to pdfjs-dist
async function extractTextFromPDF(buffer: Buffer): Promise<string> {
  let extractedText = '';

  // Try pdf-parse first (faster for simple PDFs)
  try {
    // @ts-ignore - pdf-parse CommonJS module
    const pdfParse = require('pdf-parse');
    const data = await pdfParse(buffer, {
      max: 50, // Max 50 pages
      pagerender: async (pageData: any) => {
        try {
          const textContent = await pageData.getTextContent();
          return textContent.items
            .map((item: any) => item.str || '')
            .join(' ');
        } catch (error) {
          console.warn('Error rendering page:', error);
          return '';
        }
      },
    });
    extractedText = (data.text || '').trim();
    
    if (extractedText.length > 50) {
      // Successfully extracted sufficient text
      return extractedText;
    }
  } catch (error) {
    console.warn('pdf-parse extraction failed, trying pdfjs-dist:', error);
  }

  // Fallback to pdfjs-dist for better compatibility
  try {
    const pdfjs = require('pdfjs-dist');
    // Set up worker for pdfjs
    const pdfjsWorker = require('pdfjs-dist/build/pdf.worker');
    pdfjs.GlobalWorkerOptions.workerSrc = pdfjsWorker;
    
    const pdf = await pdfjs.getDocument({ data: buffer }).promise;
    const pageCount = pdf.numPages;
    let fullText = '';
    
    for (let i = 1; i <= Math.min(pageCount, 50); i++) {
      try {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items
          .map((item: any) => item.str || '')
          .join(' ');
        fullText += ' ' + pageText;
      } catch (pageError) {
        console.warn(`Error extracting page ${i}:`, pageError);
        continue;
      }
    }
    
    extractedText = fullText.trim();
    
    if (extractedText.length > 50) {
      return extractedText;
    }
  } catch (error) {
    console.error('pdfjs-dist extraction also failed:', error);
  }

  // If both methods failed or returned too little text
  if (extractedText.length === 0) {
    throw new Error('Could not extract text from PDF. The file may be corrupted, image-based, or encrypted.');
  }
  
  return extractedText;
}

// Extract text from DOCX
async function extractTextFromDOCX(buffer: Buffer): Promise<string> {
  try {
    // @ts-ignore - mammoth CommonJS module
    const mammoth = require('mammoth');
    const result = await mammoth.extractRawText({ arrayBuffer: buffer });
    return (result.value || '').trim();
  } catch (error) {
    console.error('DOCX extraction failed:', error);
    return '';
  }
}

// Extract text from TXT
function extractTextFromTXT(buffer: Buffer): string {
  try {
    return buffer.toString('utf-8').trim();
  } catch (error) {
    console.error('TXT extraction failed:', error);
    return '';
  }
}

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
      log('STEP-6a', 'Processing resume as File', { fileName: resumeInput.name, fileType: resumeInput.type, fileSize: resumeInput.size });
      const buffer = await resumeInput.arrayBuffer();
      const bufferNode = Buffer.from(buffer);
      const fileName = resumeInput.name.toLowerCase();

      log('STEP-6b', 'Buffer created', { size: bufferNode.length });

      // Try different extractors based on file type
      if (fileName.endsWith('.pdf') || resumeInput.type === 'application/pdf') {
        log('STEP-6c', 'Detected PDF file, extracting text...');
        try {
          resumeText = await extractTextFromPDF(bufferNode);
          log('STEP-6d', 'PDF extraction completed', {
            textLength: resumeText?.length || 0,
          });
        } catch (pdfError: any) {
          log('STEP-6d-ERROR', 'PDF extraction failed', {
            error: pdfError?.message,
          });
          throw new Error(`Failed to extract PDF: ${pdfError?.message || 'Unknown error'}`);
        }
      } else if (fileName.endsWith('.docx') || resumeInput.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
        log('STEP-6e', 'Detected DOCX file, extracting text...');
        try {
          resumeText = await extractTextFromDOCX(bufferNode);
          log('STEP-6f', 'DOCX extraction completed', {
            textLength: resumeText?.length || 0,
          });
        } catch (docxError: any) {
          log('STEP-6f-ERROR', 'DOCX extraction failed', {
            error: docxError?.message,
          });
          throw new Error(`Failed to extract DOCX: ${docxError?.message || 'Unknown error'}`);
        }
      } else if (fileName.endsWith('.txt') || resumeInput.type === 'text/plain') {
        log('STEP-6g', 'Detected TXT file, extracting text...');
        resumeText = extractTextFromTXT(bufferNode);
        log('STEP-6h', 'TXT extraction completed', {
          textLength: resumeText?.length || 0,
        });
      } else {
        // Try to decode as text as fallback
        log('STEP-6i', 'Unknown file type, attempting text decode...');
        resumeText = extractTextFromTXT(bufferNode);
        log('STEP-6j', 'Text decode completed', {
          textLength: resumeText?.length || 0,
        });
      }
    } else {
      // resumeInput is a string
      resumeText = resumeInput;
      log('STEP-6k', 'Resume provided as string', {
        textLength: resumeText?.length || 0,
      });
    }

    if (!resumeText.trim()) {
      log('STEP-7', 'ERROR: Resume text is empty after extraction');
      return NextResponse.json(
        { error: 'Could not extract text from your file. This may happen if: (1) The PDF is image-based or scanned, (2) The file is corrupted, or (3) The file format is not supported. Please try uploading a text-based PDF or paste your resume text directly.' },
        { status: 400 }
      );
    }

    log('STEP-8', 'Resume text successfully extracted', {
      textLength: resumeText.length,
      preview: resumeText.substring(0, 100),
    });

    // ===== OPENAI API CALL =====
    log('STEP-9', 'Building analysis prompt...');

    const systemPrompt = `You are an expert technical recruiter and ATS resume evaluator with 15+ years of hiring experience.

Analyze the provided resume${jobDescription ? ' against the job description' : ''} and provide a comprehensive, recruiter-focused analysis with detailed metrics.

CRITICAL RULES:
- Base analysis ONLY on provided resume text
- Do NOT hallucinate personal information
- Be concise and action-oriented
- Return ONLY valid JSON, no markdown
- All numeric scores 0-100
- Impact: How well achievements are communicated
- Brevity: Conciseness and word efficiency
- Style: Professional presentation and formatting
- Skills: Technical relevance and industry alignment

Respond with this exact JSON structure (no additional text):
{
  "overallScore": <number 0-100>,
  "experienceLevel": "<Fresher|Junior|Mid|Senior>",
  "hiringRecommendation": "<Reject|Review|Interview|Strong Hire>",
  "metrics": {
    "impact": <0-100, how well achievements communicate value>,
    "brevity": <0-100, conciseness and efficiency>,
    "style": <0-100, professional presentation and formatting>,
    "skills": <0-100, technical relevance and alignment>
  },
  "atsScore": <0-100 for ATS compatibility>,
  "technicalSkills": [<extracted skills from resume as strings>],
  "missingSkills": [<3-5 important skills missing for typical industry standards>],
  "strengths": [<3-5 key strengths as bullet points>],
  "weaknesses": [<3-5 areas to improve as bullet points>],
  "contentQuality": {
    "bulletPointQuality": "<Poor|Average|Good>",
    "useOfMetrics": "<Poor|Average|Good>",
    "actionVerbUsage": "<Poor|Average|Good>"
  },
  "interviewFocusTopics": [<5-7 topics to discuss in interview>],
  "improvements": [<5-7 specific, actionable improvement suggestions>],
  "summary": "<2-3 sentence professional recruiter summary>"
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
        atsScore: 0,
        readabilityScore: 0,
        keywordMatchScore: 0,
        roleFitScore: 0,
        overallScore: 0,
        strengths: [],
        areasForImprovement: [],
        recommendations: [],
        summary: analysisContent,
        rawAnalysis: analysisContent,
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


