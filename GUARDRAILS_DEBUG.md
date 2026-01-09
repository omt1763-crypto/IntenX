# Guardrails & OpenAI Parameter Debugging Guide

## Issues Fixed

### 1. **OpenAI `input_audio_format` Parameter Error**
**Error:** `Unknown parameter: 'session.input_audio_format'`

**Root Cause:** The `input_audio_format` and `output_audio_format` parameters were being sent in `session.update()` calls, but OpenAI's Realtime API only accepts these during initial connection setup, not in updates.

**Fix Applied (Commit 09fcbf1):**
- Removed `input_audio_format` and `output_audio_format` from `session.update()` in `hooks/useRealtimeAudio.ts`
- These parameters are now only set during initial backend connection
- Backend proxy (Railway) handles audio format configuration

**Code Location:** `hooks/useRealtimeAudio.ts`, lines 84-103

---

### 2. **AI Ignoring Off-Topic Redirection**
**Issue:** When candidate talks about cars/sports/personal topics, AI engages instead of redirecting

**Root Cause:** The system prompt didn't have explicit, strict language forcing the AI to refuse off-topic conversation

**Fix Applied (Commit 1e079e7):**
- Added `🚫 STRICT OFF-TOPIC REDIRECTION (MUST ENFORCE)` section to system prompt
- Explicit examples of off-topic topics: cars, sports, hobbies, weather, personal life
- Explicit redirection phrases the AI must use
- Clarified that EVERY response must relate to job/company/required skills

**Code Location:** `app/interview/realtime/page.tsx`, function `generateSystemPromptWithJobDetails()`, lines ~275-305

---

## How to Verify Guardrails Are Working

### Method 1: Browser Console Logs
1. Open browser DevTools (F12)
2. Go to Console tab
3. Test the interview
4. Look for these logs:

```
[RealtimeAudio] Full instructions being sent:
[CRITICAL SYSTEM INSTRUCTION - MUST FOLLOW EXACTLY]
YOU ARE A TECHNICAL JOB INTERVIEWER...
🔒 LANGUAGE POLICY (CRITICAL - MUST FOLLOW):
...
🚫 STRICT OFF-TOPIC REDIRECTION (MUST ENFORCE):
...
[RealtimeAudio] Instructions length: [should be >2000 chars]
```

### Method 2: Verify the System Prompt Content
The system prompt should include:
1. ✅ `[CRITICAL SYSTEM INSTRUCTION - MUST FOLLOW EXACTLY]`
2. ✅ `🔒 LANGUAGE POLICY (CRITICAL - MUST FOLLOW)`
3. ✅ Position details (job title, company, description)
4. ✅ `=== CANDIDATE PROFILE (JSON FORMAT) ===`
5. ✅ `🚫 STRICT OFF-TOPIC REDIRECTION (MUST ENFORCE)` ← NEW
6. ✅ Required skills list
7. ✅ Skill assessment strategy
8. ✅ Interview phases
9. ✅ Prohibited behaviors list

### Method 3: Test Off-Topic Redirection
1. Start an interview
2. When AI asks first question, respond with something off-topic like:
   - "I like cars"
   - "How's the weather?"
   - "Tell me about sports"
3. AI should immediately respond with something like:
   ```
   "I appreciate you sharing that, but I need to keep our interview focused on the 
   [Job Title] position and your technical qualifications. Let's get back to discussing 
   your experience with [SKILL]. Can you tell me about..."
   ```

---

## Current System Prompt Structure

```
[CRITICAL SYSTEM INSTRUCTION - MUST FOLLOW EXACTLY]
├─ 🔒 LANGUAGE POLICY (CRITICAL - MUST FOLLOW)
├─ POSITION DETAILS (job title, company, description)
├─ === CANDIDATE PROFILE (JSON FORMAT) ===
├─ CANDIDATE MATCHING STRATEGY
├─ CRITICAL - FIRST RESPONSE PROTOCOL
├─ CORE DIRECTIVES (8 main rules)
├─ SHORT/INCOMPLETE ANSWERS (handling patterns)
├─ VALIDATE COMPLETENESS (intro requirements)
├─ REQUIRED SKILLS TO EVALUATE
├─ SKILL ASSESSMENT STRATEGY
├─ INTERVIEW PHASES (5 phases)
├─ 🚫 STRICT OFF-TOPIC REDIRECTION (MUST ENFORCE) ← NEW FIX
└─ HUMAN INTERVIEWER TRAITS TO EMULATE
```

---

## Files Modified in Latest Commits

### Commit 09fcbf1: OpenAI Parameter Fix
- **File:** `hooks/useRealtimeAudio.ts`
- **Change:** Removed invalid audio format parameters from session.update()
- **Lines:** 84-103

### Commit 1e079e7: Off-Topic Redirection
- **File:** `app/interview/realtime/page.tsx`
- **Change:** Added strict off-topic redirection section to system prompt
- **Function:** `generateSystemPromptWithJobDetails()`
- **Lines:** ~275-305

---

## Deployment Status

- ✅ Code changes committed to GitHub (2 commits)
- ✅ Pushed to main branch
- 🔄 **Vercel is auto-deploying** (may take 1-2 minutes)

### Timeline:
1. Changes pushed at: ~[current time]
2. Vercel builds (takes ~1-2 min)
3. Once build completes, refresh https://www.aiinterviewx.com
4. New code will be live

**Do not use the old cached build - the browser may need a hard refresh (Ctrl+Shift+R)**

---

## Next Steps for Testing

1. **Wait for Vercel deployment** (check https://vercel.com for build status)
2. **Hard refresh the page** (Ctrl+Shift+R on Windows)
3. **Open browser DevTools** (F12)
4. **Start an interview** and check:
   - Console logs showing full instructions with guardrails
   - AI responding with professional, technical-only tone
   - AI redirecting off-topic conversation immediately
   - No "Unknown parameter" error from OpenAI

---

## If Issues Persist

### If you still see `input_audio_format` error:
- Backend might be cached - wait 5-10 minutes
- Hard refresh the page (Ctrl+Shift+R)
- Check if Vercel build succeeded on https://vercel.com

### If AI still talks about cars:
- System prompt might not be fully transmitted
- Check console log to verify **full instructions** are being logged
- The instructions log should show the `🚫 STRICT OFF-TOPIC REDIRECTION` section
- If not shown, the session setup failed - check browser console for errors

### If you don't see guardrails in console:
- Check that `systemPrompt` is being passed to `connect()` function
- Verify `interviewData?.systemPrompt` contains the full prompt
- Look for any errors in the connection setup phase

---

## Configuration Details

| Parameter | Value | Location |
|-----------|-------|----------|
| Temperature | 0.3 | `hooks/useRealtimeAudio.ts` line 89 |
| Max Response Tokens | 300 | `hooks/useRealtimeAudio.ts` line 90 |
| Voice | 'alloy' | `hooks/useRealtimeAudio.ts` line 91 |
| Language | English (enforced) | System prompt |
| Turn Detection | server_vad | `hooks/useRealtimeAudio.ts` line 92-96 |

---

## Key System Prompt Sections

### LANGUAGE POLICY (Lines 54-57)
Forces English-only responses with explicit rejection of other languages

### STRICT OFF-TOPIC REDIRECTION (NEW)
**Key Rule:** If candidate talks about cars, sports, hobbies, weather, or personal life:
1. AI must acknowledge the input
2. AI must immediately redirect back to interview topics
3. AI must mention the job title, company, or specific skill
4. Example: "I appreciate you sharing that, but I need to keep our interview focused on the [Job Title] position and your technical qualifications."

### CANDIDATE PROFILE JSON
AI receives structured candidate data:
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "phone": "+1 (555) 000-0000",
  "appliedPosition": "Senior React Developer",
  "resume": "[extracted resume content]"
}
```

---

## Expected Interview Flow

1. **AI Welcome:** Professional greeting mentioning job title and company
2. **First Question:** "Introduce yourself and share your professional background"
3. **AI Behavior:**
   - Asks one question at a time
   - Always acknowledges candidate's response
   - References their background from candidate profile
   - Immediately redirects off-topic conversation
   - Maintains professional, technical tone
   - NEVER speaks languages other than English
4. **If Off-Topic:** "Let's keep our focus on the [Job Title] position..."

---

## Testing Checklist

- [ ] Vercel build has completed successfully
- [ ] Hard refreshed page (Ctrl+Shift+R)
- [ ] Opened browser DevTools Console
- [ ] Started interview and scrolled to console
- [ ] Saw log: `[RealtimeAudio] Full instructions being sent:`
- [ ] Guardrails text visible in console (LANGUAGE POLICY, OFF-TOPIC REDIRECTION)
- [ ] AI gave professional interview welcome (not speaking other languages)
- [ ] AI asked first question about professional background
- [ ] No "Unknown parameter" errors in console
- [ ] Tested off-topic response (e.g., "I like cars")
- [ ] AI immediately redirected back to interview topics

---

Last Updated: 2025-01-09
Commits: 09fcbf1, 1e079e7
