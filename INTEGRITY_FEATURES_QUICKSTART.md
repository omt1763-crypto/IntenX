# Interview Integrity Features - Quick Setup Guide

## What Was Added

Two critical security features to detect and prevent cheating during interviews:

### 1. **Deepfake & AI Voice Detection** 🎥🎤
- Automatically detects deepfake videos
- Detects AI-generated voices
- Analyzes video artifacts, lip-sync, frequency patterns, breathing, etc.
- **Cancels interview automatically** if strong evidence found

### 2. **Window Switching Detection** 🔄
- Detects when candidate switches browser tabs
- Detects when candidate leaves the interview window (Alt+Tab)
- Detects fullscreen exit
- Blocks Alt+Tab and Ctrl+Tab keys
- **Cancels interview immediately** if critical violation detected

---

## Installation Steps

### Step 1: Run Database Migration

Execute the SQL to create the violations tracking table:

```bash
# Via psql
psql -h your-db-host -U postgres -d your-db < CREATE_INTERVIEW_INTEGRITY_TABLE.sql

# Or via Supabase Dashboard:
# 1. Go to SQL Editor
# 2. Copy-paste contents of CREATE_INTERVIEW_INTEGRITY_TABLE.sql
# 3. Click "Run"
```

### Step 2: Verify Files Are in Place

Check these new files exist:

```
✅ lib/interview-integrity/deepfake-detector.ts
✅ lib/interview-integrity/window-switch-detector.ts
✅ hooks/useInterviewIntegrity.ts
✅ app/api/interview-violations/route.ts
✅ CREATE_INTERVIEW_INTEGRITY_TABLE.sql
✅ INTERVIEW_INTEGRITY_GUIDE.md (this file)
```

### Step 3: Integration Already Done

The main interview page has been updated:

```
✅ app/interview/realtime/page.tsx
   - Import added
   - Hook integrated
   - Monitoring initialized on interview start
   - Violations logged to database
   - Auto-cancellation implemented
```

### Step 4: Test It

1. **Start an interview** at `/interview/realtime`
2. **Test deepfake detection**:
   - System automatically analyzes video frames
   - Check browser console for detection logs
   - Violations appear in database

3. **Test window switching**:
   - Try pressing Alt+Tab (should be blocked)
   - Try switching browser tabs (should trigger cancellation)
   - Try exiting fullscreen (should trigger cancellation)

---

## How It Works - User Flow

### Interview Start
```
Candidate starts interview
↓
Video/Audio streams initialized
↓
Integrity monitoring starts (automatic)
↓
Interview continues normally
```

### During Interview
```
Continuously monitoring:
- Video frames for deepfakes
- Audio for AI voice
- Window focus (tab switches)
- Fullscreen status
- Key combinations (Alt+Tab)
```

### Violation Detected
```
Violation happens (e.g., tab switch)
↓
System detects it immediately
↓
Critical violation → Interview CANCELED
Warning violation → Logged, interview continues
↓
Report saved to database
↓
Admins notified of critical violations
```

---

## What Happens on Auto-Cancellation

When the interview is auto-canceled:

1. ✅ All streams stop immediately
2. ✅ AI stops responding
3. ✅ **Cancellation reason shown to candidate**:
   - "You switched away from the interview tab. The interview has been canceled."
   - "You exited fullscreen mode. The interview has been canceled."
   - "Deepfake video detected. The interview has been canceled due to integrity concerns."
   - "AI-generated voice detected. The interview has been canceled."

4. ✅ Violation report saved to database
5. ✅ Admin dashboard shows the violation with full details
6. ✅ Hiring manager can review what happened

---

## Violations Database

All violations are stored in: `interview_integrity_violations` table

### View Violations (SQL)
```sql
-- All violations for an applicant
SELECT * FROM interview_integrity_violations
WHERE applicant_id = 'uuid';

-- Only critical violations
SELECT * FROM critical_interview_violations
ORDER BY detected_at DESC;

-- Violations by type
SELECT violation_types, COUNT(*) as count
FROM interview_integrity_violations
GROUP BY violation_types;
```

### View via API (Admin Only)
```bash
GET /api/interview-violations?limit=50&applicantId=uuid
```

---

## Configuration

### Deepfake Detection Sensitivity

Edit `lib/interview-integrity/deepfake-detector.ts`:

```typescript
// More detections = lower threshold
private readonly ARTIFACT_THRESHOLD = 3  // Change to 2 for more sensitive

// More frame changes = lower similarity threshold
private readonly FRAME_CONSISTENCY_THRESHOLD = 0.85  // Change to 0.90 for more sensitive
```

### Window Monitoring Thresholds

Edit `lib/interview-integrity/window-switch-detector.ts`:

```typescript
// How long away before it's a violation
private readonly CRITICAL_VIOLATION_THRESHOLD = 5000  // 5 seconds
```

### Auto-Cancellation Triggers

Edit `hooks/useInterviewIntegrity.ts`:

```typescript
// Modify conditions in checkWindowViolations() function
// to customize what triggers auto-cancellation
```

---

## Monitoring & Logging

### Browser Console Logs

Look for `[DeepfakeDetector]`, `[WindowSwitchDetector]`, or `[IntegrityMonitor]` prefix:

```
[DeepfakeDetector] ✅ Initialized with streams
[WindowSwitchDetector] ✅ Initialized - monitoring window integrity
[IntegrityMonitor] 🚨 Deepfake artifacts detected
[WindowSwitchDetector] ⚠️  Window lost focus - candidate may have switched applications
```

### Database Logs

All violations are recorded in:
- Table: `interview_integrity_violations`
- View: `critical_interview_violations` (critical only)

### Admin Notifications

Admins are notified when:
- Critical violations occur
- Deepfake detected with high confidence
- Multiple window switches detected

---

## API Endpoints

### Log Violation
**POST** `/api/interview-violations`

```json
{
  "interviewId": "interview-1704067200000",
  "applicantId": "550e8400-e29b-41d4-a716-446655440000",
  "jobId": "550e8400-e29b-41d4-a716-446655440001",
  "cancellationReason": "Candidate switched away from interview tab",
  "violations": [
    {
      "type": "tab-switch",
      "severity": "critical",
      "description": "Candidate switched away from interview tab",
      "timestamp": 1704067200000,
      "details": { ... }
    }
  ],
  "report": { ... }
}
```

### Get Violations (Admin)
**GET** `/api/interview-violations?limit=50&offset=0`

---

## Troubleshooting

### Q: Interview cancels even though I didn't do anything wrong
A: Sensitivity might be too high. Lower thresholds in config files or disable monitoring temporarily during testing.

### Q: Alt+Tab isn't being blocked
A: Some browsers/OS don't allow web pages to block keys. This is a browser security limitation. Fullscreen mode helps mitigate this.

### Q: Deepfake detection has false positives
A: Video artifacts can be caused by poor lighting, camera issues, compression. Adjust sensitivity thresholds or use additional verification methods.

### Q: I don't see violations in the database
A: Check if table was created successfully. Run migration again:
```sql
SELECT * FROM interview_integrity_violations LIMIT 1;
```

---

## Security Best Practices

1. ✅ **Always use fullscreen mode** - This is the main protection against Alt+Tab
2. ✅ **Combine with other verification** - Use photo ID, email verification, phone verification
3. ✅ **Have live proctoring** - For high-value positions, consider human oversight
4. ✅ **Regular monitoring** - Review violation logs and adjust thresholds as needed
5. ✅ **Transparent policies** - Inform candidates about monitoring in advance
6. ✅ **Update detection** - Keep detection algorithms updated with latest deepfake techniques

---

## Testing Checklist

- [ ] Database table created successfully
- [ ] Interview starts without errors
- [ ] Video/audio streams working
- [ ] Fullscreen enforced automatically
- [ ] Deepfake detection working (check console logs)
- [ ] Window focus monitoring working
- [ ] Alt+Tab blocked
- [ ] Tab switch detected
- [ ] Violations logged to database
- [ ] Admin can view violation reports
- [ ] Test cancellation flow works properly

---

## Support

**Issue**: Stuck or need help?
1. Check `INTERVIEW_INTEGRITY_GUIDE.md` for detailed documentation
2. Review browser console for error messages
3. Check SQL logs for database issues
4. Test with a simple interview first to isolate issues

**Contact**: Share interview ID and violation details for investigation

---

## Files Reference

| File | Purpose | What It Does |
|------|---------|-------------|
| `deepfake-detector.ts` | Video/audio analysis | Detects deepfakes and AI voices |
| `window-switch-detector.ts` | Window monitoring | Detects tab/window switches |
| `useInterviewIntegrity.ts` | React integration | Combines detectors, handles violations |
| `interview-violations/route.ts` | API endpoint | Logs violations to database |
| `realtime/page.tsx` | Interview page | Uses integrity monitoring |
| `CREATE_INTERVIEW_INTEGRITY_TABLE.sql` | Database setup | Creates violations table |
| `INTERVIEW_INTEGRITY_GUIDE.md` | Full documentation | Complete guide and reference |

---

**Status**: ✅ Ready to Use  
**Version**: 1.0  
**Setup Time**: ~5 minutes (just run the SQL migration)
