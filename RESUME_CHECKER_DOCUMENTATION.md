# AI Resume Checker - Feature Documentation

## Overview

The AI Resume Checker is a comprehensive resume analysis tool that uses AI to evaluate resumes across 16 crucial checkpoints. It provides users with an overall score, detailed feedback, and actionable improvements.

## Features

### 1. Phone Number Verification
- Users must verify their phone number via OTP before uploading a resume
- SMS OTP sent to user's phone (currently mock implementation)
- 10-minute OTP expiration
- Rate limiting: Max 3 OTP requests per hour per phone number

### 2. Resume Upload
- Supports PDF and DOCX formats
- Maximum file size: 2MB
- Drag-and-drop interface
- File validation before upload

### 3. AI-Powered Analysis
The analyzer performs **16 crucial checks** across 5 categories:

#### Content Analysis
- ATS parse rate compatibility
- Repetition of words and phrases
- Spelling and grammar
- Quantified achievements in experience section

#### Format Analysis
- File format and size
- Resume length (1-2 pages recommended)
- Bullet point length (under 60 characters)

#### Skills Analysis
- Hard skills identification
- Soft skills inclusion

#### Resume Sections
- Contact information
- Essential sections (Summary, Experience, Education, Skills)
- Personality showcase

#### Style Analysis
- Resume design quality
- Email address format
- Active voice usage
- Buzzwords and clichés identification

### 4. Comprehensive Results Dashboard
- Overall score (0-100)
- Category-specific scores
- Visual progress bars
- Strengths highlights
- Improvement recommendations
- Keyword matches
- Downloadable report

## Technology Stack

### Frontend Components
- **Main Page**: `/app/resources/resume-checker/page.tsx`
  - Layout and orchestration
  - Step-based user flow (Phone → Upload → Analysis)
  
- **PhoneVerification.tsx**: Phone number and OTP verification
- **ResumeUpload.tsx**: File upload and validation
- **ResumeAnalysis.tsx**: Results display with detailed breakdown

### Backend APIs

#### `/api/resume-checker/send-otp`
- **Method**: POST
- **Body**: `{ phoneNumber: string }`
- **Response**: `{ success: boolean, message: string, testOtp?: string }`
- **Features**:
  - Generates 6-digit OTP
  - Rate limiting
  - 10-minute expiration
  - SMS integration ready (Twilio placeholder)

#### `/api/resume-checker/verify-otp`
- **Method**: POST
- **Body**: `{ phoneNumber: string, otp: string }`
- **Response**: `{ success: boolean, phoneNumber: string, verifiedAt: string }`
- **Features**:
  - OTP validation
  - Expiration checking
  - Secure verification

#### `/api/resume-checker/analyze-resume`
- **Method**: POST
- **Body**: FormData with file and metadata
- **Response**: Detailed analysis object with scores and recommendations
- **Features**:
  - File validation
  - Text extraction (PDF/DOCX)
  - AI analysis
  - Structured feedback

## User Flow

```
1. User navigates to /resources/resume-checker
        ↓
2. Enters phone number
        ↓
3. Receives OTP via SMS
        ↓
4. Enters OTP to verify
        ↓
5. Uploads resume (PDF/DOCX)
        ↓
6. AI analyzes resume
        ↓
7. Views detailed results with:
   - Overall score
   - 16 crucial checks
   - Strengths & improvements
   - Keyword matches
   - Download report option
        ↓
8. Can analyze another resume
```

## Installation & Setup

### 1. Required Dependencies

For file processing, you'll need:
```bash
npm install pdf-parse mammoth twilio
```

### 2. Environment Variables

Add to `.env.local`:
```
# For SMS OTP (optional - using mock for now)
TWILIO_ACCOUNT_SID=your_account_sid
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_PHONE_NUMBER=+1234567890

# For AI Analysis (optional - using mock for now)
OPENAI_API_KEY=your_openai_key
```

### 3. Integration Steps

#### A. Enable SMS OTP (Production)
1. Sign up for Twilio account
2. Get credentials
3. Uncomment SMS sending code in `/api/resume-checker/send-otp`
4. Add credentials to `.env.local`

#### B. Enable OpenAI Integration (Production)
1. Sign up for OpenAI API
2. Get API key
3. Implement ChatGPT integration in `analyzeResumeWithAI()` function
4. Add key to `.env.local`

#### C. PDF/DOCX Text Extraction (Production)
```typescript
// In analyze-resume/route.ts, uncomment and use:
import pdfParse from 'pdf-parse'
import mammoth from 'mammoth'

// For PDF
const pdfData = await pdfParse(Buffer.from(bytes))
const resumeText = pdfData.text

// For DOCX
const docResult = await mammoth.extractRawText({ buffer: Buffer.from(bytes) })
const resumeText = docResult.value
```

## Customization Guide

### Change Color Scheme
Edit the gradient colors in components:
```typescript
// In page.tsx
className="bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900"

// Colors available: purple, blue, green, orange, red, etc.
```

### Modify Analysis Criteria
Edit the checks array in `/api/resume-checker/analyze-resume`:
```typescript
checks: [
  {
    category: 'Your Category',
    items: [
      {
        name: 'Check Name',
        passed: boolean,
        suggestion: 'Improvement tip'
      }
    ]
  }
]
```

### Adjust File Size Limit
In `ResumeUpload.tsx`:
```typescript
const maxSize = 5 * 1024 * 1024 // Change to 5MB
```

### Add New Analysis Categories
Add to the checks array in the mock analysis function with new category objects.

## API Response Structure

### Analysis Result Object
```typescript
{
  overallScore: number (0-100)
  atsScore: number (0-100)
  contentScore: number (0-100)
  formattingScore: number (0-100)
  skillsScore: number (0-100)
  checks: Array<{
    category: string
    items: Array<{
      name: string
      passed: boolean
      suggestion?: string
    }>
  }>
  strengths: string[]
  improvements: string[]
  keywordMatches: string[]
}
```

## Testing

### Development Mode
In development, the OTP endpoint returns a `testOtp` field:
```typescript
{
  success: true,
  message: 'OTP sent successfully',
  testOtp: '123456' // Use this for testing
}
```

### Manual Testing Flow
1. Visit `http://localhost:3000/resources/resume-checker`
2. Enter phone number (any 10+ digit number)
3. Check console logs for test OTP
4. Enter the OTP
5. Upload a test PDF/DOCX file
6. View mock analysis results

## Production Checklist

- [ ] Replace mock OTP store with database
- [ ] Integrate Twilio for real SMS OTP
- [ ] Implement PDF/DOCX text extraction
- [ ] Integrate OpenAI for AI analysis
- [ ] Add database storage for analysis results
- [ ] Implement email notifications
- [ ] Add rate limiting with Redis
- [ ] Implement user authentication
- [ ] Add analytics tracking
- [ ] Set up error monitoring (Sentry)
- [ ] Implement CI/CD pipeline
- [ ] Add comprehensive logging

## Known Limitations

### Current Version (Development)
- OTP is mock (not actually sent via SMS)
- Analysis is mock (uses random scores)
- Text extraction from PDF/DOCX not implemented
- No database persistence
- No user authentication
- Results not stored

### Next Steps for Production
1. Implement real SMS OTP with Twilio
2. Add OpenAI integration for real analysis
3. Store analysis results in Supabase
4. Implement user accounts and history
5. Add email notifications
6. Create admin dashboard for monitoring

## Troubleshooting

### OTP Not Sending
- Check Twilio configuration in `.env.local`
- Verify phone number format (include country code)
- Check rate limiting (max 3 per hour)

### File Upload Failing
- Ensure file is PDF or DOCX
- Check file size is under 2MB
- Verify MIME type is correct

### Analysis Taking Too Long
- Check API endpoint logs
- Verify OpenAI API is responsive
- Consider adding timeout handling

## Future Enhancements

1. **AI Resume Rewriting**
   - Generate ChatGPT-powered improvements
   - Tailored to job descriptions
   - Export as new resume

2. **Job Matching**
   - Compare resume with job postings
   - Keyword gap analysis
   - Skill mismatch report

3. **Interview Preparation**
   - Questions based on resume content
   - Mock interview practice
   - Performance tracking

4. **Recruiter Tools**
   - Bulk resume analysis
   - Candidate comparison
   - Talent pool insights

5. **Mobile App**
   - Native iOS/Android apps
   - Offline resume storage
   - Push notifications

## Support & Maintenance

For issues or feature requests, please contact the development team or check the GitHub repository.

---

**Last Updated**: January 14, 2026  
**Version**: 1.0 (MVP)  
**Status**: Development Ready
