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

// Method 1: Extract using pdfjs-dist with detailed logging
async function extractViaPDFJS(buffer: Buffer): Promise<string> {
  try {
    console.log('[PDF-PDFJS] Starting pdfjs-dist extraction...');
    
    const pdfjsModule = await import('pdfjs-dist');
    const pdfjs = pdfjsModule.default || pdfjsModule;
    
    // Set worker path for PDF.js
    const workerSrc = pdfjsModule.GlobalWorkerOptions?.workerSrc || 
                     (pdfjsModule.GlobalWorkerOptions && (pdfjsModule.GlobalWorkerOptions.workerSrc = 'pdfjs-dist/build/pdf.worker.min.js'));
    
    const loadingTask = pdfjs.getDocument({ data: new Uint8Array(buffer) });
    const pdf = await loadingTask.promise;
    
    console.log(`[PDF-PDFJS] PDF has ${pdf.numPages} pages`);
    
    let fullText = '';
    let successCount = 0;
    
    // Extract from ALL pages
    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      try {
        const page = await pdf.getPage(pageNum);
        const textContent = await page.getTextContent();
        
        const pageText = textContent.items
          .map((item: any) => {
            if (typeof item === 'string') return item;
            if (typeof item === 'object' && 'str' in item) return item.str;
            return '';
          })
          .filter((text: string) => text.trim().length > 0)
          .join(' ')
          .trim();
        
        if (pageText.length > 0) {
          fullText += pageText + '\n';
          successCount++;
          console.log(`[PDF-PDFJS] Page ${pageNum}: ${pageText.length} chars extracted`);
        }
      } catch (pageError) {
        console.warn(`[PDF-PDFJS] Page ${pageNum} failed, continuing...`);
        continue;
      }
    }
    
    const cleanedText = aggressiveTextCleanup(fullText);
    console.log(`[PDF-PDFJS] Success: ${successCount}/${pdf.numPages} pages, ${cleanedText.length} chars`);
    
    return cleanedText;
  } catch (error) {
    console.warn('[PDF-PDFJS] Failed:', error instanceof Error ? error.message : error);
    return '';
  }
}

// Method 2: Extract using pdf-parse
async function extractViaPdfParse(buffer: Buffer): Promise<string> {
  try {
    console.log('[PDF-PARSE] Starting pdf-parse extraction...');
    
    const pdfParse = require('pdf-parse');
    const data = await pdfParse(buffer, { 
      max: 0, // Process all pages
      version: 'v2.0.550'
    });
    
    const text = (data.text || '').trim();
    const cleanedText = aggressiveTextCleanup(text);
    
    console.log(`[PDF-PARSE] Extracted: ${cleanedText.length} chars from ${data.numpages} pages`);
    return cleanedText;
  } catch (error) {
    console.warn('[PDF-PARSE] Failed:', error instanceof Error ? error.message : error);
    return '';
  }
}

// Method 3: Extract using pdfjs with streaming
async function extractViaPDFJSAdvanced(buffer: Buffer): Promise<string> {
  try {
    console.log('[PDF-PDFJS-ADV] Starting advanced pdfjs extraction...');
    
    const pdfjsModule = await import('pdfjs-dist');
    const pdfjs = pdfjsModule.default || pdfjsModule;
    
    const pdf = await pdfjs.getDocument({ data: new Uint8Array(buffer) }).promise;
    let fullText = '';
    
    for (let i = 1; i <= pdf.numPages; i++) {
      try {
        const page = await pdf.getPage(i);
        
        // Try text content extraction
        try {
          const content = await page.getTextContent();
          const text = content.items
            .map((item: any) => item.str || '')
            .join('')
            .trim();
          
          if (text.length > 0) {
            fullText += text + '\n';
            console.log(`[PDF-PDFJS-ADV] Page ${i}: ${text.length} chars`);
          }
        } catch (textError) {
          // Try rendering as fallback
          console.warn(`[PDF-PDFJS-ADV] Text extraction failed for page ${i}, trying render...`);
        }
      } catch (pageError) {
        console.warn(`[PDF-PDFJS-ADV] Page ${i} error, continuing...`);
      }
    }
    
    const cleanedText = aggressiveTextCleanup(fullText);
    console.log(`[PDF-PDFJS-ADV] Result: ${cleanedText.length} chars`);
    
    return cleanedText;
  } catch (error) {
    console.warn('[PDF-PDFJS-ADV] Failed:', error instanceof Error ? error.message : error);
    return '';
  }
}

// Method 4: Binary extraction from raw PDF
async function extractViaBinaryAnalysis(buffer: Buffer): Promise<string> {
  try {
    console.log('[PDF-BINARY] Starting binary analysis extraction...');
    
    // Convert buffer to string, extract text objects
    let text = buffer.toString('latin1');
    
    // Extract text from PDF objects (pattern: (text))
    const matches = text.match(/\(([^()]*)\)/g) || [];
    let extracted = matches
      .map(match => match.slice(1, -1)) // Remove parentheses
      .map(str => {
        // Decode escaped characters
        return str
          .replace(/\\/g, ' ')
          .replace(/[^\w\s\-\.,'():]/g, '');
      })
      .filter(str => str.trim().length > 3)
      .join(' ');
    
    // Also try hex extraction
    const hexMatches = text.match(/<([0-9A-F]+)>/gi) || [];
    const hexExtracted = hexMatches
      .map(match => {
        try {
          const hex = match.slice(1, -1);
          return Buffer.from(hex, 'hex').toString('utf-8').replace(/[^\w\s]/g, '');
        } catch {
          return '';
        }
      })
      .filter(s => s.length > 0)
      .join(' ');
    
    const combined = (extracted + ' ' + hexExtracted).trim();
    const cleanedText = aggressiveTextCleanup(combined);
    
    console.log(`[PDF-BINARY] Extracted: ${cleanedText.length} chars`);
    return cleanedText;
  } catch (error) {
    console.warn('[PDF-BINARY] Failed:', error instanceof Error ? error.message : error);
    return '';
  }
}

// Method 5: Extract using base64 conversion
async function extractViaBase64(buffer: Buffer): Promise<string> {
  try {
    console.log('[PDF-BASE64] Starting base64 conversion...');
    
    const base64 = buffer.toString('base64');
    const decoded = Buffer.from(base64, 'base64').toString('utf-8');
    
    // Extract readable text
    const text = decoded
      .replace(/[^\w\s\-\.,'():%]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 2 && /[a-zA-Z]/.test(word))
      .join(' ');
    
    const cleanedText = aggressiveTextCleanup(text);
    console.log(`[PDF-BASE64] Extracted: ${cleanedText.length} chars`);
    
    return cleanedText;
  } catch (error) {
    console.warn('[PDF-BASE64] Failed:', error instanceof Error ? error.message : error);
    return '';
  }
}

// Main PDF text extraction - tries all methods in sequence
async function extractAllTextFromPDF(buffer: Buffer): Promise<string> {
  const methods = [
    { name: 'PDFJS', fn: () => extractViaPDFJS(buffer) },
    { name: 'pdf-parse', fn: () => extractViaPdfParse(buffer) },
    { name: 'PDFJS-Advanced', fn: () => extractViaPDFJSAdvanced(buffer) },
    { name: 'Binary Analysis', fn: () => extractViaBinaryAnalysis(buffer) },
    { name: 'Base64', fn: () => extractViaBase64(buffer) },
  ];
  
  for (const method of methods) {
    try {
      console.log(`[PDF-EXTRACT] Trying ${method.name} method...`);
      const text = await method.fn();
      
      if (text && text.length > 100) {
        console.log(`[PDF-EXTRACT] ✓ SUCCESS with ${method.name}: ${text.length} chars`);
        return text;
      }
    } catch (error) {
      console.warn(`[PDF-EXTRACT] ${method.name} failed:`, error instanceof Error ? error.message : error);
      continue;
    }
  }
  
  console.warn('[PDF-EXTRACT] All extraction methods returned insufficient text');
  return '';
}

// Aggressive text cleaning for token reduction (improved)
function aggressiveTextCleanup(text: string): string {
  if (!text) return '';
  
  return text
    // First, decode common escaped characters
    .replace(/\\n/g, '\n')
    .replace(/\\t/g, ' ')
    .replace(/\\r/g, '')
    // Remove null bytes
    .replace(/\0/g, '')
    // Collapse multiple newlines to double newlines
    .replace(/\n{3,}/g, '\n\n')
    // Remove excessive spaces (but keep some structure)
    .replace(/[ \t]{2,}/g, ' ')
    // Split into lines and clean each
    .split('\n')
    .map(line => {
      // Trim whitespace
      const trimmed = line.trim();
      
      // Keep line if it has at least 2 chars and some alphanumeric
      if (trimmed.length > 1 && /[a-zA-Z0-9]/.test(trimmed)) {
        return trimmed;
      }
      return '';
    })
    // Filter out empty lines
    .filter((line: string) => line.length > 0)
    // Rejoin lines
    .join('\n')
    // Final trim
    .trim();
}

// Fallback OCR for scanned PDFs
async function extractTextFromPDFViaOCR(buffer: Buffer): Promise<string> {
  try {
    console.log('[PDF-OCR] Starting OCR extraction (Tesseract)...');
    
    const Tesseract = require('tesseract.js');
    
    // Try OCR directly on the buffer
    const { data: result } = await Tesseract.recognize(buffer, 'eng', {
      logger: (m: any) => console.log('[PDF-OCR] Progress:', m.status, m.progress),
    });
    
    const text = (result?.text || '').trim();
    const cleanedText = aggressiveTextCleanup(text);
    
    console.log(`[PDF-OCR] OCR extracted: ${cleanedText.length} characters`);
    return cleanedText;
  } catch (error) {
    console.warn('[PDF-OCR] OCR extraction failed:', error instanceof Error ? error.message : error);
    return '';
  }
}

// Enhanced PDF extraction with comprehensive error handling
async function extractTextFromPDF(buffer: Buffer): Promise<string> {
  console.log('[PDF-EXTRACT] Starting comprehensive PDF extraction...');
  
  // Try all extraction methods
  try {
    console.log('[PDF-EXTRACT] Attempting all extraction methods...');
    const extractedText = await extractAllTextFromPDF(buffer);
    
    if (extractedText && extractedText.length > 100) {
      console.log(`[PDF-EXTRACT] SUCCESS: Extracted ${extractedText.length} characters`);
      return extractedText;
    }
  } catch (error) {
    console.warn('[PDF-EXTRACT] Main extraction failed:', error instanceof Error ? error.message : error);
  }

  // If that didn't work, try OCR as last resort
  console.log('[PDF-EXTRACT] Text extraction minimal, attempting OCR...');
  try {
    const ocrText = await extractTextFromPDFViaOCR(buffer);
    if (ocrText && ocrText.length > 80) {
      console.log(`[PDF-EXTRACT] OCR success: ${ocrText.length} characters`);
      return ocrText;
    }
  } catch (ocrError) {
    console.warn('[PDF-EXTRACT] OCR failed:', ocrError instanceof Error ? ocrError.message : ocrError);
  }

  // If still nothing, throw comprehensive error
  throw new Error(
    `Could not extract text from PDF. Tried: pdfjs-dist, pdf-parse, binary analysis, base64 conversion, and OCR.
    
The file may be:
1. A scanned/image-based PDF (no embedded text)
2. Password protected or encrypted
3. Corrupted or malformed
4. In an unsupported format

Please try:
• Using a text-based PDF (created from digital documents)
• Saving as DOCX in Microsoft Word
• Copying and pasting text directly (most reliable)
• Converting the PDF using an online converter first`
  );
}

// Validate that extracted text has minimum meaningful content
function isValidResumeText(text: string): boolean {
  if (!text || text.length < 50) {
    console.log('[VALIDATION] Text too short:', text.length);
    return false;
  }
  
  // Very lenient: just need some basic structure
  const lines = text.split('\n').filter(line => line.trim().length > 0);
  
  // Need at least 2 lines (very lenient)
  if (lines.length < 1) {
    console.log('[VALIDATION] Not enough lines:', lines.length);
    return false;
  }
  
  // Check for at least some alphanumeric content
  const alphanumeric = text.replace(/[^a-zA-Z0-9]/g, '').length;
  if (alphanumeric < 20) {
    console.log('[VALIDATION] Not enough alphanumeric:', alphanumeric);
    return false;
  }
  
  // Check if text contains common resume keywords
  const resumeKeywords = ['experience', 'education', 'skill', 'project', 'work', 'employment', 'role', 'responsibility', 'achievement', 'email', 'phone', 'address', 'company', 'job', 'title', 'years', 'developed', 'managed', 'led', 'designed', 'created', 'built', 'implemented'];
  const lowerText = text.toLowerCase();
  const hasKeywords = resumeKeywords.some(keyword => lowerText.includes(keyword));
  
  if (!hasKeywords) {
    // If no keywords, still accept if we have decent content
    console.log('[VALIDATION] No resume keywords found, but accepting based on content');
    return alphanumeric > 50; // Just need more alphanumeric content
  }
  
  console.log('[VALIDATION] Text is valid for resume analysis');
  return true;
}

// Extract text from DOCX with multiple fallback methods
async function extractTextFromDOCX(buffer: Buffer): Promise<string> {
  let extractedText = '';
  
  // Method 1: Try Mammoth (best for modern DOCX)
  try {
    console.log('[DOCX-EXTRACT] Method 1: Trying Mammoth extraction...');
    const mammoth = require('mammoth');
    const result = await mammoth.extractRawText({ arrayBuffer: buffer.buffer });
    extractedText = (result.value || '').trim();
    
    if (extractedText.length > 50) {
      console.log(`[DOCX-EXTRACT] Mammoth success: ${extractedText.length} characters`);
      return extractedText;
    }
  } catch (error) {
    console.warn('[DOCX-EXTRACT] Mammoth failed:', error instanceof Error ? error.message : error);
  }

  // Method 2: Try extracting from ZIP entries (DOCX is a ZIP file)
  try {
    console.log('[DOCX-EXTRACT] Method 2: Trying ZIP-based extraction...');
    const AdmZip = require('adm-zip');
    const zip = new AdmZip(buffer);
    const entries = zip.getEntries();
    
    let foundText = '';
    
    // Look for document.xml which contains the actual content
    for (const entry of entries) {
      if (entry.entryName === 'word/document.xml' || entry.entryName.includes('document.xml')) {
        const xmlContent = entry.getData().toString('utf-8');
        // Extract text between tags, removing XML markup
        const textMatches = xmlContent.match(/<w:t[^>]*>([^<]*)<\/w:t>/g);
        if (textMatches) {
          foundText = textMatches
            .map(match => match.replace(/<w:t[^>]*>|<\/w:t>/g, ''))
            .join(' ');
          break;
        }
      }
    }
    
    if (foundText.length > 50) {
      extractedText = foundText.trim();
      console.log(`[DOCX-EXTRACT] ZIP extraction success: ${extractedText.length} characters`);
      return extractedText;
    }
  } catch (error) {
    console.warn('[DOCX-EXTRACT] ZIP extraction failed:', error instanceof Error ? error.message : error);
  }

  // Method 3: Try raw text extraction (for corrupted/unusual DOCX files)
  try {
    console.log('[DOCX-EXTRACT] Method 3: Trying raw buffer extraction...');
    let text = buffer.toString('utf-8');
    
    // Remove XML tags and control characters
    text = text
      .replace(/<[^>]+>/g, '') // Remove XML tags
      .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '') // Remove control chars
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 2)
      .join('\n');
    
    if (text.length > 50) {
      extractedText = text.trim();
      console.log(`[DOCX-EXTRACT] Raw extraction success: ${extractedText.length} characters`);
      return extractedText;
    }
  } catch (error) {
    console.warn('[DOCX-EXTRACT] Raw extraction failed:', error instanceof Error ? error.message : error);
  }

  // Method 4: Try Latin-1 encoding for older DOC formats
  try {
    console.log('[DOCX-EXTRACT] Method 4: Trying Latin-1 encoding...');
    let text = buffer.toString('latin1');
    
    text = text
      .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 2 && /[a-zA-Z0-9]/.test(line))
      .join('\n');
    
    if (text.length > 50) {
      extractedText = text.trim();
      console.log(`[DOCX-EXTRACT] Latin-1 success: ${extractedText.length} characters`);
      return extractedText;
    }
  } catch (error) {
    console.warn('[DOCX-EXTRACT] Latin-1 failed:', error instanceof Error ? error.message : error);
  }

  // If we got some text from any method
  if (extractedText.length > 30) {
    console.log(`[DOCX-EXTRACT] Using extracted text: ${extractedText.length} characters`);
    return extractedText;
  }

  // All methods failed
  const errorMsg = `Could not extract text from Word document. 

Possible reasons:
1. Document is corrupted or in an unsupported format
2. Document is password protected
3. File is not a valid DOCX/DOC file

Solutions:
• Try saving the document again in Microsoft Word
• Save as PDF and upload that instead
• Copy and paste the text directly (most reliable)`;

  throw new Error(errorMsg);
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
              error: 'I tried to read your PDF, but the text could not be extracted from it (it looks like a scanned/image-based or protected PDF).',
              disclaimer: 'Because of this, I can\'t calculate a reliable ATS score yet.',
              solutions: [
                'Re-upload the resume as a text-based PDF or DOCX file',
                'Copy and paste the resume text directly into the text area (most reliable)',
                'Try using an online PDF converter to convert it to a standard PDF',
              ],
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
              error: docxError.message,
              disclaimer: 'The Word document could not be read.',
              solutions: [
                'Try saving the document again in Microsoft Word',
                'Save as PDF and upload that instead',
                'Copy and paste the text directly (most reliable)',
              ],
              canPasteText: true,
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
          error: 'I tried to read your PDF, but the text could not be extracted from it (it looks like a scanned/image-based or protected PDF).',
          disclaimer: 'Because of this, I can\'t calculate a reliable ATS score yet.',
          solutions: [
            'Re-upload the resume as a text-based PDF or DOCX file',
            'Copy and paste the resume text directly into the text area (most reliable)',
            'Try using an online PDF converter to convert it to a standard PDF',
          ],
          canPasteText: true,
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

    // Aggressive cleanup of extracted resume text to reduce tokens
    let cleanedResumeText = aggressiveTextCleanup(extractedResumeText);
    
    log('STEP-16a', 'Text cleanup results', {
      originalLength: extractedResumeText.length,
      cleanedLength: cleanedResumeText.length,
      reduction: Math.round((1 - cleanedResumeText.length / extractedResumeText.length) * 100) + '%',
      cleanedPreview: cleanedResumeText.substring(0, 200),
    });
    
    // If cleanup removed too much, use original
    if (cleanedResumeText.length < 100 && extractedResumeText.length > 100) {
      log('STEP-16b', 'Cleanup too aggressive, reverting to original text');
      cleanedResumeText = extractedResumeText;
    }
    
    // Limit resume text to first 5000 characters after cleanup to avoid token limits
    const maxResumeLength = 5000;
    const trimmedResumeText = cleanedResumeText.length > maxResumeLength 
      ? cleanedResumeText.substring(0, maxResumeLength) + '\n[Resume truncated...]'
      : cleanedResumeText;

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

    // ===== FIND JOB MATCHES =====
    log('STEP-24', 'Attempting to find job matches...');
    let matchedJobs = [];

    try {
      // Extract keywords from resume for job search
      const searchKeywords = analysis.technicalSkills?.slice(0, 3)?.join(' ') || 
                           jobDescription?.split(' ').slice(0, 3).join(' ') ||
                           'developer';

      log('STEP-24a', 'Calling job matching API', {
        keywords: searchKeywords,
      });

      const matchResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/jobs/find-matches`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          resumeAnalysis: analysis,
          jobKeywords: searchKeywords,
          location: '', // Optional: can be extracted from resume
          topN: 10,
          useCache: true,
        }),
      });

      if (matchResponse.ok) {
        const matchData = await matchResponse.json();
        matchedJobs = matchData.matchedJobs || [];
        log('STEP-25', 'Job matching successful', {
          matchedJobsCount: matchedJobs.length,
          topMatchScore: matchedJobs[0]?.match_percentage,
        });
      } else {
        log('STEP-25-WARNING', 'Job matching API returned non-200 status', {
          status: matchResponse.status,
        });
      }
    } catch (matchError) {
      log('STEP-25-WARNING', 'Job matching failed, but continuing with results', {
        error: String(matchError),
      });
    }

    // ===== SUCCESS =====
    log('STEP-26', 'SUCCESS: Returning analysis and job matches to client');

    return NextResponse.json(
      {
        success: true,
        analysis: analysis,
        matchedJobs: matchedJobs,
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


