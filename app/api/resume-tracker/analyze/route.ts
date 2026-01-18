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

// OCR extraction for scanned/image-based PDFs
async function extractTextFromPDFViaOCR(buffer: Buffer): Promise<string> {
  try {
    console.log('[PDF-OCR] Starting OCR extraction (like Google Lens)...');
    
    // Use pdf2image + tesseract.js approach
    const pdfParse = require('pdf-parse');
    const Tesseract = require('tesseract.js');
    
    // First, get PDF images using pdfjs
    const pdfjsModule = await import('pdfjs-dist');
    const pdfjs = pdfjsModule.default || pdfjsModule;
    
    const loadingTask = pdfjs.getDocument({ data: new Uint8Array(buffer) });
    const pdf = await loadingTask.promise;
    const pageCount = Math.min(pdf.numPages, 3); // Limit to first 3 pages for OCR (performance)
    
    let ocrText = '';
    
    for (let i = 1; i <= pageCount; i++) {
      try {
        console.log(`[PDF-OCR] Processing page ${i} with OCR...`);
        const page = await pdf.getPage(i);
        
        // Render page to canvas
        const viewport = page.getViewport({ scale: 2 });
        const canvas = require('canvas').createCanvas(viewport.width, viewport.height);
        const context = canvas.getContext('2d');
        
        await page.render({
          canvas: canvas,
          context: context,
          viewport: viewport,
        }).promise;
        
        // Convert canvas to image and run OCR
        const imageData = canvas.toBuffer('image/png');
        const { data: result } = await Tesseract.recognize(imageData, 'eng');
        
        if (result?.text) {
          ocrText += result.text + '\n';
        }
      } catch (pageError) {
        console.warn(`[PDF-OCR] OCR failed on page ${i}:`, pageError);
        continue;
      }
    }
    
    const cleanedText = ocrText
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 2)
      .join('\n')
      .trim();
    
    console.log(`[PDF-OCR] OCR extracted: ${cleanedText.length} characters from ${pageCount} pages`);
    return cleanedText;
  } catch (error) {
    console.warn('[PDF-OCR] OCR extraction failed:', error instanceof Error ? error.message : error);
    return ''; // Return empty string to allow fallback
  }
}

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
    
    console.log(`[PDF-EXTRACT] pdf-parse extracted: ${extractedText.length} characters`);
    
    if (extractedText.length > 500) {
      console.log(`[PDF-EXTRACT] pdf-parse SUCCESS: ${extractedText.length} characters extracted`);
      return extractedText;
    }
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
    const pageCount = Math.min(pdf.numPages, 15);
    
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
          .join('')
          .replace(/\s+/g, ' ')
          .trim();
        
        if (pageText.length > 0) {
          fullText += pageText + '\n';
        }
      } catch (pageError) {
        console.warn(`[PDF-EXTRACT] Error extracting page ${i}:`, pageError);
        continue;
      }
    }
    
    extractedText = fullText.trim();
    extractionMethods.push('pdfjs-dist');
    
    console.log(`[PDF-EXTRACT] pdfjs-dist extracted: ${extractedText.length} characters from ${pageCount} pages`);
    
    if (extractedText.length > 500) {
      console.log(`[PDF-EXTRACT] pdfjs-dist SUCCESS: ${extractedText.length} characters extracted`);
      return extractedText;
    }
  } catch (error) {
    console.warn('[PDF-EXTRACT] pdfjs-dist failed:', error instanceof Error ? error.message : error);
  }

  // Method 3: Try raw buffer extraction with multiple approaches
  try {
    console.log('[PDF-EXTRACT] Attempting raw buffer text extraction...');
    
    // Try UTF-8 first
    let text = buffer.toString('utf-8', 0, Math.min(buffer.length, 500000));
    
    // Remove binary characters and clean up
    text = text
      .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '') // Remove control characters
      .replace(/[\x80-\x9F]/g, '') // Remove extended control characters
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 2)
      .join('\n');
    
    extractedText = text.trim();
    extractionMethods.push('raw-buffer');
    
    console.log(`[PDF-EXTRACT] Raw buffer extracted: ${extractedText.length} characters`);
    
    if (extractedText.length > 500) {
      console.log(`[PDF-EXTRACT] Raw buffer SUCCESS: ${extractedText.length} characters extracted`);
      return extractedText;
    }
  } catch (error) {
    console.warn('[PDF-EXTRACT] Raw buffer extraction failed:', error);
  }

  // Method 4: Try Latin-1 encoding for PDFs with non-UTF8 text
  try {
    console.log('[PDF-EXTRACT] Attempting Latin-1 extraction...');
    let text = buffer.toString('latin1', 0, Math.min(buffer.length, 500000));
    
    // Clean up
    text = text
      .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 2 && !line.includes('PDF') && !line.includes('stream'))
      .join('\n');
    
    extractedText = text.trim();
    extractionMethods.push('latin1-buffer');
    
    console.log(`[PDF-EXTRACT] Latin-1 extracted: ${extractedText.length} characters`);
    
    if (extractedText.length > 500) {
      return extractedText;
    }
  } catch (error) {
    console.warn('[PDF-EXTRACT] Latin-1 extraction failed:', error);
  }

  // Method 5: OCR for scanned/image-based PDFs (like Google Lens)
  if (extractedText.length < 500) {
    console.log('[PDF-EXTRACT] Text extraction insufficient, trying OCR (Google Lens style)...');
    try {
      const ocrText = await extractTextFromPDFViaOCR(buffer);
      if (ocrText.length > 200) {
        extractedText = ocrText;
        extractionMethods.push('ocr');
        console.log(`[PDF-EXTRACT] OCR SUCCESS: ${extractedText.length} characters extracted`);
        return extractedText;
      }
    } catch (ocrError) {
      console.warn('[PDF-EXTRACT] OCR extraction failed:', ocrError);
    }
  }

  // If we have some text from any method, return it
  if (extractedText.length >= 100) {
    console.log(`[PDF-EXTRACT] Using result from: ${extractionMethods.join(', ')}`);
    return extractedText;
  }

  // If all methods failed with minimal text
  const errorMsg = `Could not extract sufficient text from PDF (only ${extractedText.length} characters found). 

Possible reasons:
1. PDF is corrupted or malformed
2. PDF is password protected or encrypted
3. File is not a valid PDF

Solutions:
• Try uploading a different version of the file
• Save the PDF as DOCX in Microsoft Word, then upload that version
• Copy and paste the resume text directly (most reliable)`;

  throw new Error(errorMsg);
}

// Validate that extracted text has minimum meaningful content
function isValidResumeText(text: string): boolean {
  // Very lenient validation - just check minimum length
  // Let OpenAI handle the actual analysis
  if (text.length < 80) return false;
  
  // Check if text has some reasonable structure (not just garbage)
  const lines = text.split('\n').filter(line => line.trim().length > 5);
  if (lines.length < 2) return false; // At least 2 substantial lines
  
  // Check for at least some alphanumeric content (not just symbols)
  const alphanumeric = text.replace(/[^a-zA-Z0-9]/g, '').length;
  if (alphanumeric < 30) return false; // At least 30 letters/numbers
  
  return true;
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
            preview: extractedResumeText.substring(0, 300),
          });
        } catch (pdfError: any) {
          log('STEP-6-ERROR', 'PDF extraction failed', {
            error: pdfError.message,
          });
          return NextResponse.json(
            { 
              error: pdfError.message,
              suggestion: 'Your PDF could not be read. Please try: 1) Converting to DOCX/TXT format, 2) Using an online PDF converter, or 3) Pasting text directly.',
              canPasteText: true,
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

    // Validate that extracted text has meaningful content
    if (!isValidResumeText(extractedResumeText)) {
      log('STEP-15b-ERROR', 'Extracted text does not have minimum meaningful content', {
        textLength: extractedResumeText.length,
        preview: extractedResumeText.substring(0, 200),
      });
      return NextResponse.json(
        { 
          error: 'The extracted text is too minimal or corrupted to analyze.',
          suggestion: 'Please try: 1) Use a different PDF file, 2) Save the PDF as DOCX in Microsoft Word and upload that, 3) Copy and paste the resume text directly into the text area (most reliable method)',
          details: 'If you have a scanned PDF (image-based), please try taking a screenshot or using a different file format.',
        },
        { status: 400 }
      );
    }

    // ===== OPENAI API CALL =====
    log('STEP-16', 'Building analysis prompt...');

    const systemPrompt = `You are an expert technical recruiter and ATS resume evaluator.

Analyze the resume and return ONLY valid JSON - no markdown or explanations.

SCORING (0-100, must be realistic, not defaults):
- Impact: How well achievements show business value
- Brevity: Writing efficiency and conciseness  
- Style: Professional presentation and grammar
- Skills: Technical relevance and demand
- Overall: Average of metrics ±10-20 points for experience

Return EXACTLY this JSON (no other text):
{
  "overallScore": <0-100>,
  "experienceLevel": "<Fresher|Junior|Mid|Senior>",
  "hiringRecommendation": "<Reject|Review|Interview|Strong Hire>",
  "metrics": {
    "impact": <0-100>,
    "brevity": <0-100>,
    "style": <0-100>,
    "skills": <0-100>
  },
  "atsScore": <0-100>,
  "technicalSkills": [<skills from resume>],
  "missingSkills": [<important missing skills>],
  "strengths": [<specific strengths>],
  "weaknesses": [<specific weaknesses>],
  "contentQuality": {
    "bulletPointQuality": "<Poor|Average|Good>",
    "useOfMetrics": "<Poor|Average|Good>",
    "actionVerbUsage": "<Poor|Average|Good>"
  },
  "interviewFocusTopics": [<interview topics>],
  "improvements": [<actionable improvements>],
  "summary": "<2-3 sentence assessment>"
}`;

    // Limit resume text to first 8000 characters to avoid token limits
    const maxResumeLength = 8000;
    const trimmedResumeText = extractedResumeText.length > maxResumeLength 
      ? extractedResumeText.substring(0, maxResumeLength) + '\n[Resume truncated...]'
      : extractedResumeText;

    // Limit job description to first 2000 characters
    const maxJobDescLength = 2000;
    const trimmedJobDesc = jobDescription.length > maxJobDescLength
      ? jobDescription.substring(0, maxJobDescLength) + '\n[Job description truncated...]'
      : jobDescription;

    const userContent = trimmedJobDesc
      ? `Resume:\n${trimmedResumeText}\n\nJob Description:\n${trimmedJobDesc}\n\nAnalyze this resume.`
      : `Resume:\n${trimmedResumeText}\n\nAnalyze this resume.`;

    log('STEP-17', 'Calling OpenAI API', {
      model: 'gpt-4o-mini',
      hasJobDescription: !!jobDescription,
      resumeLength: trimmedResumeText.length,
      jobDescLength: trimmedJobDesc.length,
      totalContentLength: userContent.length,
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
        contentLength: response.choices?.[0]?.message?.content?.length || 0,
      });
      
      // Log the actual response for debugging
      console.log('[OPENAI-RESPONSE]', response.choices[0]?.message?.content);
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
        jsonPreview: jsonStr.substring(0, 500),
      });

      analysis = JSON.parse(jsonStr);
      
      // Validate that we got real scores, not defaults
      const hasDefaultScores = analysis.overallScore === 50 && 
                               analysis.metrics?.impact === 50 && 
                               analysis.metrics?.brevity === 50 && 
                               analysis.metrics?.style === 50 && 
                               analysis.metrics?.skills === 50;
      
      if (hasDefaultScores) {
        log('STEP-21-WARNING', 'Received default/fallback scores from OpenAI', {
          allScores: 50,
        });
        throw new Error('OpenAI returned only default scores');
      }
      
      log('STEP-21', 'JSON parsed successfully with real analysis', {
        keys: Object.keys(analysis),
        overallScore: analysis.overallScore,
        experienceLevel: analysis.experienceLevel,
        impactScore: analysis.metrics?.impact,
        brevityScore: analysis.metrics?.brevity,
        styleScore: analysis.metrics?.style,
        skillsScore: analysis.metrics?.skills,
      });
    } catch (parseError) {
      log('STEP-21-ERROR', 'Failed to parse valid analysis from OpenAI', {
        error: String(parseError),
        content: analysisContent.substring(0, 300),
      });
      
      throw new Error(
        `Could not analyze resume: OpenAI returned invalid data. ` +
        `Please try again or contact support if the problem persists.`
      );
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


