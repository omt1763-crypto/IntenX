# Interview Integrity & Security Features
## Deepfake Detection & Window Switching Prevention

### Overview

This document describes two critical security features added to the Interviewverse interview system:

1. **Deepfake & AI Voice Detection** - Detects deepfake videos and AI-generated voices during interviews
2. **Window Switching Detection** - Detects when candidates try to switch windows/tabs and automatically cancels interviews

---

## Feature 1: Deepfake & AI Voice Detection

### What It Does

The deepfake detector analyzes real-time video and audio streams to identify:

#### Video Analysis (Deepfake Detection)
- **Color Bleeding Artifacts** - Detects unnatural color transitions typical of deepfake generation
- **Alpha Channel Inconsistencies** - Identifies suspicious transparency patterns
- **Lip-Sync Mismatches** - Detects misalignment between lip movement and audio
- **Frame Inconsistency** - Identifies abnormally similar consecutive frames (frame looping)
- **Biometric Issues** - Tracks unnatural eye blink patterns inconsistent with human behavior

#### Audio Analysis (AI Voice Detection)
- **Unnatural Frequency Distribution** - Identifies concentrated frequency patterns typical of synthesis
- **Robotic Pitch Patterns** - Detects unnatural pitch transitions and formant changes
- **Perfect Noise Gating** - Identifies unrealistic silence periods in audio
- **Compression Artifacts** - Detects harmonic distortion from codec/synthesis artifacts
- **Breathing Absence** - Identifies lack of natural breathing sounds
- **Prosody Issues** - Detects unnaturally stable or monotone pitch

### Confidence Scoring

Each detection has a confidence score (0-1):
- **Low Confidence (< 0.6)** - May be false positive, logged but not critical
- **Medium Confidence (0.6-0.8)** - Suspicious, requires investigation
- **High Confidence (> 0.8)** - Strong indicator of deepfake/AI voice

### Severity Levels

- **LOW** - Single artifact detected, may be environmental noise
- **MEDIUM** - Multiple artifacts suggesting manipulation
- **HIGH** - Strong evidence of deepfake/AI manipulation
- **CRITICAL** - Multiple critical indicators, interview should be canceled

### How to Use

The deepfake detector is automatically initialized when the interview starts:

```typescript
import { useInterviewIntegrity } from '@/hooks/useInterviewIntegrity'

function InterviewComponent() {
  const { initializeMonitoring, getDeepfakeDetectionResult } = useInterviewIntegrity()

  useEffect(() => {
    // Initialize when video/audio streams are ready
    if (videoRef.current && audioStream) {
      initializeMonitoring(videoRef.current, audioStream)
    }
  }, [videoRef.current, audioStream])
}
```

### Detection Results

When violations are detected, they're stored with:

```typescript
{
  type: 'deepfake' | 'ai-voice',
  severity: 'low' | 'medium' | 'high' | 'critical',
  description: string,
  confidence: number,
  artifactType: string,
  frameNumber?: number
}
```

---

## Feature 2: Window Switching & Browser Tab Detection

### What It Does

The window switch detector monitors:

1. **Window Focus Loss** - Detects when interview window loses focus (Alt+Tab, clicking another app)
2. **Tab Switching** - Detects when candidate switches to another browser tab
3. **Fullscreen Exit** - Detects when candidate exits fullscreen mode
4. **Alt+Tab Attempts** - Blocks and logs Alt+Tab key combination
5. **Developer Tools Access** - Detects attempts to open inspector (F12, Ctrl+Shift+I)
6. **Screen Orientation Changes** - Detects phone/tablet orientation changes during mobile interviews

### Violation Types

```typescript
type WindowViolationType = 
  | 'tab-switch' - Switched to another browser tab
  | 'window-blur' - Lost window focus
  | 'fullscreen-exit' - Exited fullscreen mode
  | 'alt-tab-detected' - Alt+Tab key pressed
  | 'screen-share-detected' - Screen sharing attempted
```

### Severity Levels

- **WARNING** - Minor window switching, doesn't automatically cancel
- **CRITICAL** - Tab switch or fullscreen exit, automatically cancels interview

### How It Works

1. **Automatic Fullscreen** - Interview container is put into fullscreen automatically
2. **Continuous Monitoring** - Window focus is monitored every 500ms
3. **Event Blocking** - Alt+Tab, Ctrl+Tab, and other switching keys are blocked/prevented
4. **Violation Logging** - Each violation is logged with timestamp and duration away

### How to Use

```typescript
import { useInterviewIntegrity } from '@/hooks/useInterviewIntegrity'

function InterviewComponent() {
  const { 
    initializeMonitoring, 
    shouldCancelInterview, 
    cancellationReason,
    violations 
  } = useInterviewIntegrity()

  // Monitor for cancellation trigger
  useEffect(() => {
    if (shouldCancelInterview) {
      console.log('Interview canceled:', cancellationReason)
      // Cancel interview with reason
      handleInterviewCancellation(cancellationReason)
    }
  }, [shouldCancelInterview, cancellationReason])
}
```

---

## Auto-Cancellation Logic

The interview is **automatically canceled** when:

1. ✅ Candidate **switches to another browser tab** (critical violation)
2. ✅ Candidate **exits fullscreen mode** (critical violation)
3. ✅ Candidate **attempts Alt+Tab** (critical violation)
4. ✅ **Multiple deepfake artifacts detected** (critical violations)
5. ✅ **Strong evidence of AI-generated voice** (3+ audio violations)

### Cancellation with Remark

When auto-cancellation occurs:

1. Interview is stopped immediately
2. All streams are stopped
3. A **cancellation reason** is recorded:
   - "Candidate switched away from interview tab"
   - "Candidate exited fullscreen mode"
   - "Candidate attempted to switch applications using Alt+Tab"
   - "Deepfake video artifacts detected with X.XX% confidence"
   - "AI-generated voice detected with strong confidence"

4. The violation report is saved to the database
5. Admins are notified of critical violations
6. Candidate sees a message explaining why the interview was canceled

---

## Database Storage

### Violations Table

All violations are stored in `interview_integrity_violations` table:

```sql
CREATE TABLE interview_integrity_violations (
  id BIGSERIAL PRIMARY KEY,
  interview_id VARCHAR(255) UNIQUE,
  applicant_id UUID,
  job_id UUID,
  violation_types TEXT[], -- ['deepfake', 'ai-voice', 'window-switch']
  severity_levels TEXT[], -- ['warning', 'critical']
  description TEXT,
  cancellation_reason TEXT,
  violations_json JSONB, -- Full violation details
  report_json JSONB, -- Complete integrity report
  detected_at TIMESTAMP,
  created_at TIMESTAMP,
  reviewed_by UUID, -- Admin who reviewed
  review_notes TEXT,
  status VARCHAR(50) -- 'recorded', 'reviewed', 'archived'
)
```

### Setup Instructions

1. **Run Migration**:
```bash
psql -h your-db-host -U postgres -d your-db -f CREATE_INTERVIEW_INTEGRITY_TABLE.sql
```

2. **Or via Supabase Dashboard**:
   - Go to SQL Editor
   - Copy contents of `CREATE_INTERVIEW_INTEGRITY_TABLE.sql`
   - Execute the SQL

---

## API Endpoints

### 1. Log Interview Violations
**POST** `/api/interview-violations`

Request:
```json
{
  "interviewId": "interview-1234567890",
  "applicantId": "uuid",
  "jobId": "uuid",
  "cancellationReason": "Candidate switched away from interview tab",
  "violations": [
    {
      "type": "window-switch",
      "severity": "critical",
      "description": "Tab switch detected",
      "timestamp": 1704067200000
    }
  ],
  "report": {
    "totalViolations": 1,
    "criticalViolations": 1,
    "deepfakeDetections": 0,
    "windowSwitchDetections": 1
  }
}
```

Response:
```json
{
  "status": "success",
  "message": "Interview violations recorded",
  "interviewId": "interview-1234567890",
  "violationCount": 1,
  "timestamp": "2024-01-01T12:00:00Z"
}
```

### 2. Get Violation Logs (Admin Only)
**GET** `/api/interview-violations?limit=50&offset=0&applicantId=uuid`

Response:
```json
{
  "status": "success",
  "violations": [...],
  "total": 42,
  "limit": 50,
  "offset": 0
}
```

---

## Implementation Details

### Files Created

1. **Deepfake Detection Module**
   - Location: `lib/interview-integrity/deepfake-detector.ts`
   - Exports: `deepfakeDetector` instance, interfaces for results

2. **Window Switch Detection Module**
   - Location: `lib/interview-integrity/window-switch-detector.ts`
   - Exports: `windowSwitchDetector` instance, event handlers

3. **Interview Integrity Hook**
   - Location: `hooks/useInterviewIntegrity.ts`
   - Exports: `useInterviewIntegrity()` React hook

4. **API Endpoint**
   - Location: `app/api/interview-violations/route.ts`
   - Methods: POST (log), GET (retrieve admin logs)

5. **Database Migration**
   - Location: `CREATE_INTERVIEW_INTEGRITY_TABLE.sql`
   - Creates table and RLS policies

### Integration Points

**Modified File**: `app/interview/realtime/page.tsx`

Changes:
1. Added import: `import { useInterviewIntegrity } from '@/hooks/useInterviewIntegrity'`
2. Added hook usage: `const { initializeMonitoring, stopMonitoring, shouldCancelInterview, ... } = useInterviewIntegrity()`
3. Added initialization in `handleStart()` function
4. Added violation check in message handler
5. Added cleanup in `handleEnd()` function

---

## Configuration & Customization

### Adjust Detection Sensitivity

Edit `deepfake-detector.ts`:

```typescript
// Artifact threshold (lower = more sensitive)
private readonly ARTIFACT_THRESHOLD = 3

// Frame similarity threshold (lower = more sensitive to changes)
private readonly FRAME_CONSISTENCY_THRESHOLD = 0.85

// Voice analysis thresholds
private readonly VOICE_AI_INDICATORS = [
  'robotic_pattern',
  'unnatural_frequency_range',
  'perfect_noise_gate',
  'compression_artifacts',
  'zero_breathing_sounds'
]
```

### Adjust Window Monitoring

Edit `window-switch-detector.ts`:

```typescript
// Time thresholds
private readonly FIRST_BLUR_WARNING_THRESHOLD = 3000 // 3 seconds
private readonly CRITICAL_VIOLATION_THRESHOLD = 5000 // 5 seconds
```

### Customize Cancellation Triggers

Edit `hooks/useInterviewIntegrity.ts`:

```typescript
// Modify the cancellation logic in checkWindowViolations()
// or getDeepfakeDetectionResult()
```

---

## Reporting & Analytics

### Admin Dashboard Features

Admins can:

1. **View Violation Summary**
   - Total violations recorded
   - Critical vs. warning violations
   - Most common violation types

2. **Review Individual Cases**
   - Interview ID
   - Candidate name/email
   - Violation details and confidence scores
   - Full detection report

3. **Filter & Search**
   - By applicant
   - By job
   - By violation type
   - By severity
   - By date range

4. **Actions**
   - Mark as reviewed
   - Add notes
   - Flag for investigation
   - Archive

### Violation Report Structure

```typescript
{
  totalViolations: number,
  criticalViolations: number,
  warningViolations: number,
  deepfakeDetections: number,
  windowSwitchDetections: number,
  aiVoiceDetections: number,
  violations: Array<{
    id: string,
    type: string,
    severity: string,
    description: string,
    timestamp: number,
    details: Record<string, any>
  }>,
  deepfakeResult: {
    isLikelyDeepfake: boolean,
    isLikelyAIVoice: boolean,
    confidenceScore: number,
    violations: Array<...>
  },
  windowStatus: {
    isInFocus: boolean,
    isFullscreen: boolean,
    isDocumentVisible: boolean,
    totalSwitches: number
  },
  timestamp: number
}
```

---

## Testing

### Test Deepfake Detection

1. Create a test interview
2. Play a deepfake video in a window behind the browser
3. System should detect artifacts and log violations

### Test Window Switching

1. Start an interview
2. Press Alt+Tab to switch windows
3. System should:
   - Block the Alt+Tab
   - Log the violation
   - Cancel the interview if in critical mode
4. See cancellation message with reason

### Test Tab Switching

1. Start an interview in fullscreen
2. Switch to another browser tab
3. System should:
   - Detect tab switch via visibility API
   - Log critical violation
   - Cancel interview immediately

---

## Security Considerations

### Limitations

- **Deepfake Detection**: Not 100% accurate. Modern deepfakes may bypass detection.
- **Window Monitoring**: Can be bypassed on some systems (e.g., virtual machines, remote desktops)
- **Audio Analysis**: Works best with standard microphones; may have issues with audio routing

### Recommendations

1. **Combine with other measures**:
   - Live proctor for high-value positions
   - Photo ID verification
   - Email verification
   - Browser fingerprinting

2. **Regular Updates**:
   - Monitor for new deepfake techniques
   - Update detection algorithms
   - Adjust thresholds based on false positive rates

3. **Transparency**:
   - Inform candidates about security monitoring
   - Include in terms of service
   - Show warning messages when monitoring starts

---

## Troubleshooting

### Issue: False Positives (Interview Canceled Incorrectly)

**Solution**:
1. Lower sensitivity thresholds in detector configs
2. Adjust `ARTIFACT_THRESHOLD` and `FRAME_CONSISTENCY_THRESHOLD`
3. Review violation report to understand what triggered

### Issue: Deepfake Not Detected

**Solution**:
1. Check audio/video stream quality
2. Ensure proper lighting and camera angle
3. Review detection results in browser console
4. Increase sensitivity if appropriate

### Issue: Alt+Tab Still Works

**Solution**:
1. Ensure fullscreen is enforced
2. Check browser compatibility
3. Some OS/browser combos may not block key combinations
4. Use additional monitoring (screen recording, etc.)

---

## Future Enhancements

1. **ML-based Detection** - Train ML models on deepfake datasets
2. **Face Recognition** - Verify candidate face matches ID photo
3. **Behavior Analysis** - Track suspicious typing/speech patterns
4. **Screen Recording** - Record entire interview for review
5. **Liveness Detection** - Ensure real-time video (not pre-recorded)
6. **Phone Integration** - Detect phone cameras pointed at screen
7. **Network Analysis** - Detect VPN/proxy usage
8. **Biometric Verification** - Fingerprint/iris scanning on supported devices

---

## Support & Questions

For issues or questions:

1. Check browser console for detailed logs
2. Review violation report in database
3. Contact admin team with interview ID
4. Provide:
   - Interview ID
   - Browser/OS information
   - Screenshots of error
   - Steps to reproduce

---

## Glossary

| Term | Definition |
|------|-----------|
| **Deepfake** | Digitally manipulated video/audio impersonating someone |
| **AI Voice** | Voice synthesized by AI (text-to-speech) |
| **FFT** | Fast Fourier Transform - frequency analysis algorithm |
| **Formants** | Concentrations of acoustic energy around frequency |
| **Prosody** | Pitch, stress, and intonation patterns in speech |
| **RLS** | Row Level Security - database access control |
| **Confidence Score** | Probability (0-1) that detection is correct |
| **Artifact** | Unnatural defect/distortion in video/audio |

---

**Version**: 1.0  
**Last Updated**: January 2024  
**Status**: Production Ready
