# Interview Integrity System Architecture

## System Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                    INTERVIEW INTEGRITY SYSTEM                        │
│                                                                      │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │                   Interview Page (Next.js)                   │  │
│  │           app/interview/realtime/page.tsx                    │  │
│  │                                                              │  │
│  │  - Starts interview                                          │  │
│  │  - Manages video/audio streams                              │  │
│  │  - Initializes integrity monitoring                         │  │
│  │  - Handles auto-cancellation                                │  │
│  │  - Logs violations to API                                   │  │
│  └──────────────────────┬───────────────────────────────────────┘  │
│                         │                                            │
│                    Uses Hook                                         │
│                         │                                            │
│  ┌──────────────────────▼───────────────────────────────────────┐  │
│  │          useInterviewIntegrity React Hook                    │  │
│  │              hooks/useInterviewIntegrity.ts                  │  │
│  │                                                              │  │
│  │  - Combines both detectors                                  │  │
│  │  - Manages violation state                                  │  │
│  │  - Generates reports                                        │  │
│  │  - Handles cleanup                                          │  │
│  └──────────┬─────────────────────────────┬────────────────────┘  │
│             │                             │                        │
│         Uses          Uses                                         │
│             │             │                                        │
└─────────────┼─────────────┼────────────────────────────────────────┘
              │             │
         ┌────▼────┐   ┌────▼──────────────┐
         │ Deepfake │   │ Window Switching  │
         │ Detector │   │   Detector        │
         ├──────────┤   ├───────────────────┤
         │ .ts File │   │ .ts File          │
         └────┬─────┘   └────┬──────────────┘
              │              │
    Analyzes  │              │  Monitors
    ┌─────────┼──────┐       │
    │         │      │       │
    v         v      v       v
  Video     Audio  Window  Fullscreen
  Frame   Stream  Focus    State
```

---

## Deepfake Detection Flow

```
                 VIDEO FRAME ANALYSIS
                        │
        ┌───────────────┼───────────────┐
        │               │               │
        v               v               v
    Color Banding   Alpha Channel   Lip Sync
    Artifacts       Issues          Detection
        │               │               │
        └───────────────┼───────────────┘
                        │
                        v
              CONFIDENCE SCORE
           (0.0 to 1.0)
                        │
        ┌───────────────┼───────────────┐
        │               │               │
        v               v               v
      LOW        MEDIUM          HIGH
    <0.6        0.6-0.8         >0.8
        │           │               │
        │           │           Cancel
        │           │           Interview
        │           │
    Log Only    Flag &
               Review

                 AUDIO ANALYSIS
                        │
        ┌───────────────┼───────────────┐
        │               │               │
        v               v               v
    Frequency      Voice Patterns   Breathing
    Distribution   (Pitch/Formants) Sounds
        │               │               │
        └───────────────┼───────────────┘
                        │
                        v
                  AI VOICE SCORE
                  (# of violations)
                        │
        ┌───────────────┼───────────────┐
        │               │               │
        v               v               v
      0-1          2-3              4+
    OK           Warning         Cancel
```

---

## Window Switching Detection Flow

```
              EVENT MONITORING
                    │
    ┌───────────────┼───────────────────────────────┐
    │               │               │               │
    v               v               v               v
Window           Tab             Fullscreen      Keyboard
Focus         Visibility        Change           Events
    │               │               │               │
    │               v               │               │
    │         VISIBILITY API        │         KEY COMBINATIONS
    │         (hidden/visible)      │         ├─ Alt+Tab
    │         │                     │         ├─ Ctrl+Tab
    │         v                     │         ├─ F12
    │      TAB SWITCH               │         └─ Cmd+Tab
    │      DETECTED                 │
    │         │                     │         BLOCK & LOG
    │         │                     v
    │    CRITICAL              CRITICAL
    │    VIOLATION             VIOLATION
    │         │                     │
    │         └─────────┬───────────┘
    │                   │
    │                   v
    │          CANCEL INTERVIEW
    │
    v
WINDOW BLUR
    │
    v
LOG VIOLATION
(Warning or Critical
 depending on duration)
```

---

## Data Flow - Violation Detection to Database

```
                    INTERVIEW RUNNING
                          │
                          v
              ┌─────────────────────┐
              │  Violation Detected  │
              │  (Deepfake/Window)   │
              └─────────────────────┘
                          │
                          v
              ┌─────────────────────┐
              │ Create Violation     │
              │ Object with:         │
              │ - Type               │
              │ - Severity           │
              │ - Description        │
              │ - Confidence         │
              │ - Timestamp          │
              └─────────────────────┘
                          │
                          v
              ┌─────────────────────┐
              │ Check Severity      │
              └─────────────────────┘
                    │           │
                    v           v
              WARNING       CRITICAL
                    │           │
                Log only    Cancel +
                & Continue  Log
                    │           │
                    └─────┬─────┘
                          v
              ┌─────────────────────┐
              │ Create Report with: │
              │ - All Violations    │
              │ - Detection Results │
              │ - Window Status     │
              │ - Timestamps        │
              └─────────────────────┘
                          │
                          v
              ┌─────────────────────┐
              │ POST to API         │
              │ /api/interview-     │
              │   violations        │
              └─────────────────────┘
                          │
                          v
              ┌─────────────────────┐
              │ API Stores to:      │
              │ - Database Table    │
              │ - Notify Admins     │
              │ - Return Success    │
              └─────────────────────┘
                          │
                          v
              ┌─────────────────────┐
              │ INTERVIEW CANCELED  │
              │ (if critical)       │
              │ With Reason Message │
              └─────────────────────┘
```

---

## Component Interaction Diagram

```
┌──────────────────────────────────────┐
│    Interview Realtime Page           │
│  (app/interview/realtime/page.tsx)   │
│                                      │
│  ┌──────────────────────────────┐   │
│  │ useInterviewIntegrity Hook   │   │
│  │ (from hooks/)                │   │
│  │                              │   │
│  │  State:                      │   │
│  │  - isMonitoring              │   │
│  │  - violations[]              │   │
│  │  - shouldCancelInterview     │   │
│  │  - cancellationReason        │   │
│  │  - deepfakeResult            │   │
│  │  - windowStatus              │   │
│  │                              │   │
│  │  Methods:                    │   │
│  │  - initializeMonitoring()    │   │
│  │  - stopMonitoring()          │   │
│  │  - getViolationReport()      │   │
│  │  - resetMonitoring()         │   │
│  └──────────────────────────────┘   │
│           │                │         │
│      Uses │                │ Uses    │
│           v                v         │
│  ┌──────────────────┐   ┌──────────────────┐
│  │ Deepfake         │   │ Window Switch    │
│  │ Detector         │   │ Detector         │
│  │                  │   │                  │
│  │ analyzeVideo()   │   │ getStatus()      │
│  │ analyzeAudio()   │   │ init()           │
│  │ getResult()      │   │ destroy()        │
│  └──────────────────┘   └──────────────────┘
│           │                     │
│      Monitors               Monitors
│           │                     │
│           v                     v
│       Video/Audio            Window
│       Streams                Events
│                              (focus,
│                              visibility)
└──────────────────────────────────────┘
           │
      Calls API
           │
           v
┌──────────────────────────────────────┐
│  API: /interview-violations          │
│  (app/api/interview-violations/)     │
│                                      │
│  POST: Log violations                │
│  GET: Retrieve logs (admin)          │
│  - Stores in database                │
│  - Notifies admins                   │
└──────────────────────────────────────┘
           │
      Writes to
           │
           v
┌──────────────────────────────────────┐
│  Database: Supabase PostgreSQL       │
│                                      │
│  Table:                              │
│  - interview_integrity_violations    │
│  - Fields: id, interview_id, etc.    │
│  - RLS Policies: Admin/Manager       │
│                                      │
│  View:                               │
│  - critical_interview_violations     │
└──────────────────────────────────────┘
```

---

## File Structure

```
interviewverse_frontend/
│
├── lib/
│   ├── interview-integrity/
│   │   ├── deepfake-detector.ts          ✅ NEW - Video/audio analysis
│   │   └── window-switch-detector.ts     ✅ NEW - Window monitoring
│   │
│   └── supabase.ts                       (existing)
│
├── hooks/
│   ├── useInterviewIntegrity.ts          ✅ NEW - Combined hook
│   ├── useRealtimeAudio.ts               (existing)
│   └── useConversationManager.ts         (existing)
│
├── app/
│   ├── interview/
│   │   └── realtime/
│   │       └── page.tsx                  ✅ MODIFIED - Integrated monitoring
│   │
│   └── api/
│       └── interview-violations/
│           └── route.ts                  ✅ NEW - Violation logging API
│
├── CREATE_INTERVIEW_INTEGRITY_TABLE.sql  ✅ NEW - Database schema
├── INTERVIEW_INTEGRITY_GUIDE.md          ✅ NEW - Full documentation
├── INTEGRITY_FEATURES_QUICKSTART.md      ✅ NEW - Quick setup
└── IMPLEMENTATION_COMPLETE.md            ✅ NEW - Implementation summary
```

---

## State Management Flow

```
Interview Page Component
         │
         v
useInterviewIntegrity Hook
         │
    ┌────┴──────────────────────┐
    │                           │
    v                           v
deepfakeDetector          windowSwitchDetector
    │                           │
    └────┬──────────────────────┘
         │
         v
    Hook State:
    ├─ isMonitoring
    ├─ violations[]
    ├─ shouldCancelInterview
    ├─ cancellationReason
    ├─ deepfakeDetectionResult
    └─ windowStatus
         │
         v
    useEffect triggers when:
    - shouldCancelInterview = true
    - violations updated
    - monitoring started/stopped
         │
         v
    Update UI:
    ├─ Show error message
    ├─ Cancel interview
    ├─ Disable controls
    ├─ Call handleEnd()
    └─ Log to API
```

---

## Violation Processing Timeline

```
T=0s    Interview Starts
        │
        ├─ Fullscreen enforced
        ├─ Monitoring initialized
        └─ Streams initialized

T=0.5s  First Video Frame Analyzed
        │
        ├─ Color artifacts checked
        ├─ Frame consistency checked
        └─ Results logged

T=1s    Window Status Checked
        │
        ├─ Focus monitored
        ├─ Tab visibility checked
        ├─ Fullscreen status checked
        └─ Violations accumulated

T=5s    Candidate Presses Alt+Tab
        │
        ├─ Key event detected
        ├─ Violation created (CRITICAL)
        ├─ Report generated
        ├─ Interview cancellation triggered
        └─ Reason: "Alt+Tab detected"

T=5.1s  API Call: POST /interview-violations
        │
        ├─ Violation data sent
        ├─ Database insert
        ├─ Admin notification sent
        └─ Response: {"status": "success"}

T=5.2s  Interview Ended
        │
        ├─ Streams stopped
        ├─ Monitoring stopped
        ├─ Cancellation message shown
        ├─ Report saved
        └─ User redirected

T=6s    Admin Notification
        │
        └─ Email/notification to admin
           with violation details
```

---

## Security Layers

```
┌─────────────────────────────────────────┐
│      Layer 1: Fullscreen Enforcement     │
│    (Prevents Alt+Tab, minimizes window)  │
└─────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────┐
│   Layer 2: Window Event Monitoring       │
│  (Detects focus loss, tab switches)      │
└─────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────┐
│   Layer 3: Key Combination Blocking      │
│  (Blocks Alt+Tab, F12, Ctrl+Shift+I)    │
└─────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────┐
│   Layer 4: Video Analysis                │
│  (Detects deepfakes, artifacts)         │
└─────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────┐
│   Layer 5: Audio Analysis                │
│  (Detects AI voice, unnatural patterns) │
└─────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────┐
│   Layer 6: Database Logging              │
│  (Permanent record for audit)            │
└─────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────┐
│   Layer 7: Admin Notification            │
│  (Alert human reviewers)                 │
└─────────────────────────────────────────┘
```

---

## Detection Algorithm Summary

```
DEEPFAKE DETECTION
├─ Video Analysis (FFT-based)
│  ├─ Color space analysis
│  ├─ Edge detection
│  ├─ Face region analysis
│  ├─ Frame hashing
│  └─ Similarity scoring
│
├─ Audio Analysis (Frequency-based)
│  ├─ Fast Fourier Transform (FFT)
│  ├─ Formant extraction
│  ├─ Pitch contour analysis
│  ├─ Silence detection
│  └─ Harmonic analysis
│
└─ Confidence Scoring
   └─ Weighted combination of:
      ├─ Number of artifacts (30%)
      ├─ Artifact severity (40%)
      ├─ Detection consistency (20%)
      └─ Audio/video correlation (10%)

WINDOW MONITORING
├─ Event-Based Detection
│  ├─ Window focus/blur events
│  ├─ Visibility change events
│  ├─ Fullscreen events
│  └─ Keyboard events
│
├─ Violation Classification
│  ├─ Duration of absence
│  ├─ Type of switch
│  ├─ Frequency of violations
│  └─ Severity level
│
└─ Response Actions
   ├─ Log violation
   ├─ Accumulate violations
   ├─ Check for critical threshold
   └─ Trigger cancellation if needed
```

---

**Architecture Version**: 1.0  
**Diagram Type**: System & Data Flow Visualization  
**Last Updated**: January 2024
