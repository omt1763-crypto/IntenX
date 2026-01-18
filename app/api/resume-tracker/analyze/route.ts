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

// Enhanced PDF extraction with better error handling
async function extractTextFromPDF(buffer: Buffer): Promise<string> {
  let extractedText = '';
  const extractionMethods = [];
  
  // Method 1: Try pdf-parse first (usually works better in serverless)
  try {
    console.log('[PDF-EXTRACT] Attempting pdf-parse extraction...');
    // pdf-parse is a CommonJS module, use require
    const pdfParse = require('pdf-parse');
    const data = await pdfParse(buffer, {
      max: 20, // Limit pages for performance
    });
    
    extractedText = (data.text || '').trim();
    extractionMethods.push('pdf-parse');
    
    if (extractedText.length > 100) {
      console.log(`[PDF-EXTRACT] pdf-parse SUCCESS: ${extractedText.length} characters extracted`);
      return extractedText;
    }
    console.log(`[PDF-EXTRACT] pdf-parse returned only ${extractedText.length} characters`);
  } catch (error) {
    console.warn('[PDF-EXTRACT] pdf-parse failed:', error instanceof Error ? error.message : error);
  }

  // Method 2: Try pdfjs-dist as fallback
  try {
    console.log('[PDF-EXTRACT] Attempting pdfjs-dist extraction...');
    
    // Import pdfjs-dist correctly - it exports as default
    const pdfjsModule = await import('pdfjs-dist');
    const pdfjs = pdfjsModule.default || pdfjsModule;
    
    const loadingTask = pdfjs.getDocument({ data: new Uint8Array(buffer) });
    const pdf = await loadingTask.promise;
    const pageCount = Math.min(pdf.numPages, 10); // Limit to 10 pages
    
    let fullText = '';
    
    for (let i = 1; i <= pageCount; i++) {
      try {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items
          .map((item: any) => {
            if (item.str) return item.str + ' ';
            return '';
          })
          .join(' ')
          .replace(/\s+/g, ' ')
          .trim();
        
        fullText += pageText + '\n';
      } catch (pageError) {
        console.warn(`[PDF-EXTRACT] Error extracting page ${i}:`, pageError);
        continue;
      }
    }
    
    extractedText = fullText.trim();
    extractionMethods.push('pdfjs-dist');
    
    if (extractedText.length > 100) {
      console.log(`[PDF-EXTRACT] pdfjs-dist SUCCESS: ${extractedText.length} characters extracted`);
      return extractedText;
    }
  } catch (error) {
    console.warn('[PDF-EXTRACT] pdfjs-dist failed:', error instanceof Error ? error.message : error);
  }

  // Method 3: Try simple text extraction for plain text PDFs
  try {
    console.log('[PDF-EXTRACT] Attempting raw buffer text extraction...');
    const text = buffer.toString('utf-8', 0, Math.min(buffer.length, 100000));
    // Check if it contains readable text
    const lines = text.split('\n').filter(line => line.trim().length > 0);
    if (lines.length > 5) {
      extractedText = lines.join('\n').trim();
      extractionMethods.push('raw-buffer');
      
      if (extractedText.length > 100) {
        console.log(`[PDF-EXTRACT] Raw buffer SUCCESS: ${extractedText.length} characters extracted`);
        return extractedText;
      }
    }
  } catch (error) {
    console.warn('[PDF-EXTRACT] Raw buffer extraction failed:', error);
  }

  // If all methods failed
  if (extractedText.length === 0) {
    throw new Error(
      'Could not extract text from PDF. Possible reasons:\n' +
      '1. PDF is image-based or scanned (use OCR software first)\n' +
      '2. PDF is password protected\n' +
      '3. PDF is corrupted\n' +
      '4. PDF uses non-standard encoding\n\n' +
      'Please convert to text-based PDF or paste content directly.'
    );
  }
  
  if (extractedText.length < 50) {
    throw new Error(
      `Insufficient text extracted (${extractedText.length} characters). ` +
      'The PDF may contain only images or be improperly formatted.'
    );
  }
  
  console.log(`[PDF-EXTRACT] Using combined result from: ${extractionMethods.join(', ')}`);
  return extractedText;
}

// Extract text from DOCX
async function extractTextFromDOCX(buffer: Buffer): Promise<string> {
  try {
    console.log('[DOCX-EXTRACT] Starting DOCX extraction...');
    const mammoth = require('mammoth');
    const result = await mammoth.extractRawText({ arrayBuffer: buffer.buffer });
    const text = (result.value || '').trim();
    console.log(`[DOCX-EXTRACT] Extracted ${text.length} characters from DOCX`);
    return text;
  } catch (error) {
    console.error('[DOCX-EXTRACT] Failed:', error instanceof Error ? error.message : error);
    throw new Error(`Failed to extract text from DOCX: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// Extract text from TXT
function extractTextFromTXT(buffer: Buffer): string {
  try {
    console.log('[TXT-EXTRACT] Starting TXT extraction...');
    // Try different encodings
    const encodings = ['utf-8', 'utf16le', 'latin1'];
    
    for (const encoding of encodings) {
      try {
        const text = buffer.toString(encoding as BufferEncoding).trim();
        if (text.length > 10 && !text.includes('�')) { // Check for valid text
          console.log(`[TXT-EXTRACT] Success with ${encoding}: ${text.length} characters`);
          return text;
        }
      } catch (e) {
        continue;
      }
    }
    
    // Fallback to utf-8
    const text = buffer.toString('utf-8').trim();
    console.log(`[TXT-EXTRACT] Extracted ${text.length} characters from TXT`);
    return text;
  } catch (error) {
    console.error('[TXT-EXTRACT] Failed:', error instanceof Error ? error.message : error);
    throw new Error(`Failed to extract text from TXT: ${error instanceof Error ? error.message : 'Unknown error'}`);
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
    
    const resumeFile = formData.get('resume') as File | null;
    const resumeText = formData.get('resumeText') as string | null;
    const jobDescription = formData.get('jobDescription') as string || '';
    
    log('STEP-3', 'Form data parsed successfully', {
      hasResumeFile: !!resumeFile,
      hasResumeText: !!resumeText,
      jobDescriptionLength: jobDescription.length,
    });

    let extractedResumeText = '';

    // Process resume based on input type
    if (resumeFile && resumeFile.size > 0) {
      log('STEP-4', 'Processing resume file', {
        fileName: resumeFile.name,
        fileType: resumeFile.type,
        fileSize: resumeFile.size,
      });

      const buffer = Buffer.from(await resumeFile.arrayBuffer());
      const fileName = resumeFile.name.toLowerCase();

      // Determine file type and extract text
      if (fileName.endsWith('.pdf') || resumeFile.type === 'application/pdf') {
        log('STEP-5', 'Detected PDF file');
        try {
          extractedResumeText = await extractTextFromPDF(buffer);
          log('STEP-6', 'PDF extraction completed', {
            textLength: extractedResumeText.length,
            preview: extractedResumeText.substring(0, 200) + '...',
          });
        } catch (pdfError: any) {
          log('STEP-6-ERROR', 'PDF extraction failed', {
            error: pdfError.message,
          });
          return NextResponse.json(
            { 
              error: pdfError.message,
              suggestion: 'Please try converting your PDF to text using an online converter, or paste the text directly.',
            },
            { status: 400 }
          );
        }
      } else if (fileName.endsWith('.docx') || fileName.endsWith('.doc')) {
        log('STEP-7', 'Detected DOCX/DOC file');
        try {
          extractedResumeText = await extractTextFromDOCX(buffer);
          log('STEP-8', 'DOCX extraction completed', {
            textLength: extractedResumeText.length,
          });
        } catch (docxError: any) {
          log('STEP-8-ERROR', 'DOCX extraction failed', {
            error: docxError.message,
          });
          return NextResponse.json(
            { 
              error: 'Failed to extract text from Word document',
              suggestion: 'Please save as PDF or copy the text directly.',
            },
            { status: 400 }
          );
        }
      } else if (fileName.endsWith('.txt') || fileName.endsWith('.rtf') || fileName.endsWith('.md')) {
        log('STEP-9', 'Detected text file');
        try {
          extractedResumeText = extractTextFromTXT(buffer);
          log('STEP-10', 'Text extraction completed', {
            textLength: extractedResumeText.length,
          });
        } catch (txtError: any) {
          log('STEP-10-ERROR', 'Text extraction failed', {
            error: txtError.message,
          });
          return NextResponse.json(
            { error: 'Failed to read text file' },
            { status: 400 }
          );
        }
      } else {
        log('STEP-11-ERROR', 'Unsupported file type', {
          fileName: resumeFile.name,
          fileType: resumeFile.type,
        });
        return NextResponse.json(
          { 
            error: 'Unsupported file type',
            supportedTypes: 'PDF, DOCX, DOC, TXT, RTF, MD',
          },
          { status: 400 }
        );
      }
    } else if (resumeText && resumeText.trim().length > 0) {
      log('STEP-12', 'Using direct text input');
      extractedResumeText = resumeText.trim();
      log('STEP-13', 'Text input ready', {
        textLength: extractedResumeText.length,
      });
    } else {
      log('STEP-14-ERROR', 'No resume input provided');
      return NextResponse.json(
        { error: 'Please provide a resume file or paste the text' },
        { status: 400 }
      );
    }

    // Validate extracted text
    if (!extractedResumeText || extractedResumeText.trim().length < 50) {
      log('STEP-15-ERROR', 'Insufficient text extracted', {
        textLength: extractedResumeText?.length || 0,
      });
      return NextResponse.json(
        { 
          error: 'Could not extract sufficient text from resume',
          suggestion: 'Please ensure your file contains readable text, not just images.',
        },
        { status: 400 }
      );
    }

    // ===== OPENAI API CALL =====
    log('STEP-16', 'Building analysis prompt...');

    const systemPrompt = `You are an expert technical recruiter and ATS resume evaluator with 15+ years of hiring experience.

IMPORTANT: You MUST analyze the actual resume content provided and give REAL scores based on what's actually in the resume.
Do NOT give generic or default scores. Each resume is unique and deserves unique analysis.

Your analysis must be based ONLY on the actual content of the resume:
- Extract REAL technical skills mentioned in the resume
- Identify REAL strengths from actual accomplishments
- Point out REAL weaknesses from what's missing or poorly presented
- Score based on actual content quality, not defaults

${jobDescription ? `You should also match the resume against the job description and score how well it aligns.` : ''}

CRITICAL SCORING RULES:
- Impact (0-100): Rate how well the resume demonstrates value and achievements. Look for quantified results, metrics, and business impact.
- Brevity (0-100): Rate how concise and efficient the writing is. Penalize verbose descriptions, reward punchy bullet points.
- Style (0-100): Rate the professionalism, formatting, and presentation. Check for consistent formatting, proper grammar.
- Skills (0-100): Rate how relevant and specific the technical skills are. Award higher scores for in-demand skills.
- Overall Score: Average of the four metrics above, adjusted by experience level and how well it matches job description.

MANDATORY RULES:
- Return ONLY valid JSON, no markdown, no extra text
- All scores must be different and based on actual resume content
- Do NOT return default values (50, 50, 50, 50)
- Analyze what IS in the resume, not what SHOULD be there
- If skills are missing, note them in missingSkills array

Return EXACTLY this JSON structure:
{
  "overallScore": <0-100, based on actual content>,
  "experienceLevel": "<Fresher|Junior|Mid|Senior>",
  "hiringRecommendation": "<Reject|Review|Interview|Strong Hire>",
  "metrics": {
    "impact": <0-100, based on achievement demonstrations>,
    "brevity": <0-100, based on writing efficiency>,
    "style": <0-100, based on formatting and presentation>,
    "skills": <0-100, based on technical relevance>
  },
  "atsScore": <0-100, ATS keyword matching and formatting>,
  "technicalSkills": [<ONLY skills explicitly mentioned in resume>],
  "missingSkills": [<important skills not mentioned for this experience level>],
  "strengths": [<ONLY strengths evident from actual resume content>],
  "weaknesses": [<ONLY weaknesses from actual resume analysis>],
  "contentQuality": {
    "bulletPointQuality": "<Poor|Average|Good>",
    "useOfMetrics": "<Poor|Average|Good>",
    "actionVerbUsage": "<Poor|Average|Good>"
  },
  "interviewFocusTopics": [<topics to explore based on actual resume>],
  "improvements": [<specific improvements based on what's in the resume>],
  "summary": "<professional recruiter summary of the actual candidate>"
}`;

    const userContent = jobDescription
      ? `Resume:\n${extractedResumeText}\n\nJob Description:\n${jobDescription}\n\nPlease analyze this resume against the job description.`
      : `Resume:\n${extractedResumeText}\n\nPlease analyze this resume.`;

    log('STEP-17', 'Calling OpenAI API', {
      model: 'gpt-4o-mini',
      hasJobDescription: !!jobDescription,
      resumeLength: extractedResumeText.length,
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

      log('STEP-18', 'OpenAI API call succeeded', {
        hasContent: !!response.choices?.[0]?.message?.content,
      });
    } catch (openaiError: any) {
      log('STEP-18-ERROR', 'OpenAI API call failed', {
        errorMessage: openaiError?.message,
        errorCode: openaiError?.code,
        errorStatus: openaiError?.status,
      });
      throw new Error(
        `OpenAI API failed: ${openaiError?.message || 'Unknown error'}`
      );
    }

    // ===== PARSE RESPONSE =====
    log('STEP-19', 'Parsing OpenAI response...');

    const analysisContent = response.choices[0]?.message?.content;

    if (!analysisContent) {
      log('STEP-20-ERROR', 'No content in OpenAI response');
      throw new Error('No analysis content from OpenAI');
    }

    log('STEP-20', 'Response content extracted', {
      contentLength: analysisContent.length,
      preview: analysisContent.substring(0, 300),
    });

    let analysis;
    try {
      // Try to extract JSON from the response
      const jsonMatch = analysisContent.match(/\{[\s\S]*\}/);
      const jsonStr = jsonMatch ? jsonMatch[0] : analysisContent;

      log('STEP-20b', 'Attempting JSON parse', {
        extractedJsonLength: jsonStr.length,
      });

      analysis = JSON.parse(jsonStr);
      
      log('STEP-21', 'JSON parsed successfully', {
        keys: Object.keys(analysis),
        overallScore: analysis.overallScore,
        experienceLevel: analysis.experienceLevel,
      });
    } catch (parseError) {
      log('STEP-21-WARNING', 'Could not parse JSON, returning raw response', {
        error: String(parseError),
        attemptedContent: analysisContent.substring(0, 200),
      });
      // Provide a complete fallback structure matching expected format
      analysis = {
        overallScore: 50,
        experienceLevel: 'Fresher',
        hiringRecommendation: 'Review',
        metrics: {
          impact: 50,
          brevity: 50,
          style: 50,
          skills: 50,
        },
        atsScore: 50,
        technicalSkills: [],
        missingSkills: [],
        strengths: ['Resume submitted', 'Unique background'],
        weaknesses: ['Minimal formatting', 'Limited detail', 'Unclear structure'],
        contentQuality: {
          bulletPointQuality: 'Average',
          useOfMetrics: 'Average',
          actionVerbUsage: 'Average',
        },
        interviewFocusTopics: ['Background', 'Skills', 'Motivation'],
        improvements: [
          'Add more specific achievements with metrics',
          'Use action verbs to start bullet points',
          'Improve formatting and structure',
          'Add measurable results and impact',
          'Highlight relevant technical skills',
        ],
        summary: analysisContent,
        rawAnalysis: analysisContent,
      };
    }

    // ===== SAVE TO DATABASE =====
    log('STEP-22', 'Saving analysis to Supabase...');

    try {
      const { data: saved, error: dbError } = await supabase
        .from('resume_tracker')
        .insert({
          resume_text: extractedResumeText,
          job_description: jobDescription || null,
          analysis: analysis,
          created_at: new Date().toISOString(),
        })
        .select();

      if (dbError) {
        log('STEP-22-WARNING', 'Database save failed, but continuing', {
          error: dbError.message,
        });
      } else {
        log('STEP-23', 'Analysis saved to database successfully');
      }
    } catch (dbError) {
      log('STEP-22-WARNING', 'Database operation error, continuing', {
        error: String(dbError),
      });
    }

    // ===== SUCCESS =====
    log('STEP-24', 'SUCCESS: Returning analysis to client');

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


