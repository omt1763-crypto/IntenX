# 🎯 AI Interview Fine-Tuning - Quick Reference

## TL;DR - What You Got

Your AI interviewer can now ask **smart follow-up questions** based on:
- ✅ Job requirements (what recruiters need)
- ✅ Candidate answers (how they respond)
- ✅ Skill gaps (what's missing)
- ✅ Interview flow (building context)

## The 6 Question Types

| Type | When | Example |
|------|------|---------|
| **Depth** | Surface-level answer | "Can you explain how that works under the hood?" |
| **Example** | No proof of experience | "Tell me about a specific project where you used this" |
| **Gap** | Required skill not mentioned | "What's your experience with [skill]?" |
| **Skill-Match** | Apply to this role? | "How does your experience translate to this position?" |
| **Clarification** | Too vague | "Can you walk me through that step-by-step?" |
| **Probing** | Uncertain/evasive | "What would it take to become comfortable with this?" |

## Files Created

```
✅ followup-question-generator.ts     - Core engine (smart follow-ups)
✅ interview-training-data.ts         - 10 training examples  
✅ interview-ai-integration.ts        - Integration module
✅ interview-integration-quickstart.ts - Implementation examples
✅ AI_INTERVIEW_FINETUNING_GUIDE.md   - Complete documentation
✅ AI_FINE_TUNING_IMPLEMENTATION.md   - This summary
```

## Quick Start (3 Steps)

### Step 1: Import
```typescript
import { generateSmartFollowUp, generateEnhancedSystemPrompt } from '@/lib/ai/interview-ai-integration'
```

### Step 2: Configure
```typescript
const config = {
  jobTitle: 'Senior React Developer',
  requiredSkills: [
    { name: 'React', reason: 'Core framework', importance: 'critical' },
    { name: 'TypeScript', reason: 'Type safety', importance: 'high' },
  ],
  // ... more config
}
```

### Step 3: Generate
```typescript
// Generate system prompt for AI
const systemPrompt = generateEnhancedSystemPrompt(config)

// Generate smart follow-up questions
const followUp = generateSmartFollowUp(candidateResponse, history, config)
```

## Training Your Model

### With OpenAI (Recommended)

```typescript
import { generateOpenAIFineTuningJSON } from '@/lib/ai/interview-training-data'

// 1. Get training data
const trainingData = generateOpenAIFineTuningJSON()

// 2. Save to JSONL file
const jsonl = trainingData
  .map(item => JSON.stringify(item))
  .join('\n')
fs.writeFileSync('training-data.jsonl', jsonl)

// 3. Upload to OpenAI
// https://platform.openai.com/files

// 4. Create fine-tuning job
const job = await fetch('https://api.openai.com/v1/fine_tuning/jobs', {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${OPENAI_API_KEY}` },
  body: JSON.stringify({
    training_file: 'file-xxx',
    model: 'gpt-4-turbo-preview',
    hyperparameters: { n_epochs: 3 }
  })
})

// 5. Use fine-tuned model
const model = job.fine_tuned_model // e.g., "ft:gpt-4-turbo-preview:..."
```

### With Your Own Data

```typescript
import { INTERVIEW_TRAINING_DATA } from '@/lib/ai/interview-training-data'

// Add your own examples
const customExamples = [
  {
    jobContext: { /* your job */ },
    candidateResponse: '...',
    idealFollowUp: '...',
    followUpType: 'example' as const,
    reasoning: '...',
  }
]

// Combine
const allExamples = [...INTERVIEW_TRAINING_DATA, ...customExamples]

// Train your model with combined data
```

## Key Functions

### Generate Smart Follow-Up
```typescript
generateSmartFollowUp(
  candidateResponse: string,
  conversationHistory: Array<{ role: string; content: string }>,
  config: InterviewAIConfig
): string
```
**Returns:** Next ideal follow-up question

### Track Skills
```typescript
suggestNextSkillToProbe(
  conversationHistory,
  requiredSkills
): string
```
**Returns:** Which skill to assess next

### Generate System Prompt
```typescript
generateEnhancedSystemPrompt(config: InterviewAIConfig): string
```
**Returns:** Enhanced AI system prompt with all guidelines

### Track Assessment
```typescript
trackSkillAssessment(
  candidateResponse,
  conversationHistory,
  config
): { nextSkill: string; skillsCovered: string[] }
```
**Returns:** Skills assessed so far and what's next

## Example Interview Flow

```
Q1: Interviewer: "Tell me about your React experience"
A1: Candidate: "I have 5 years of React"
    Follow-up Type: EXAMPLE
Q2: Interviewer: "Tell me about your most complex project"
A2: Candidate: "Built an e-commerce platform with Redux"
    Follow-up Type: DEPTH
Q3: Interviewer: "How did you handle performance optimization?"
A3: Candidate: "Used code splitting and memoization"
    Follow-up Type: SKILL-MATCH
Q4: Interviewer: "How does that approach apply to our use case?"
A4: Candidate: "Well, you likely have similar patterns..."
    Follow-up Type: PROBING
Q5: Interviewer: "What about TypeScript? Your experience?"
    → AUTO-DETECTED: Gap (TypeScript not yet discussed)
```

## Metrics to Track

```typescript
{
  interviewDuration: number        // Total time
  totalMessages: number             // Questions + Answers
  skillsAssessed: string[]          // Skills covered
  averageResponseLength: number     // Candidate verbosity
  followUpEffectiveness: number     // % of skills covered (0-100)
}
```

## Common Patterns

### Pattern 1: Vague Answer → Clarify
```
Candidate: "I've done database work"
→ Generate: CLARIFICATION follow-up
Result: "Can you be specific? What databases? At what scale?"
```

### Pattern 2: Mentioned Skill → Probe Depth
```
Candidate: "I used React"
→ Generate: DEPTH or EXAMPLE follow-up
Result: "Can you walk me through your largest React project?"
```

### Pattern 3: Haven't Discussed Skill → Fill Gap
```
Conversation doesn't mention Docker yet
Job requires: Docker
→ Generate: GAP follow-up
Result: "What's your experience with Docker?"
```

### Pattern 4: Have Experience → Validate Job Fit
```
Candidate: "I built microservices at Google"
Job: Backend services (different scale)
→ Generate: SKILL-MATCH follow-up
Result: "How does that experience apply to our specific challenges?"
```

### Pattern 5: No Answer → Keep Probing
```
Candidate: "I'm not sure about Kubernetes"
Job requires: Kubernetes knowledge
→ Generate: PROBING follow-up
Result: "What would it take to become comfortable with Kubernetes?"
```

## Integration Checklist

- [ ] Copy functions from `interview-integration-quickstart.ts`
- [ ] Create `InterviewAIConfig` when interview starts
- [ ] Generate system prompt with `generateEnhancedSystemPrompt()`
- [ ] Call `generateSmartFollowUp()` after each candidate response
- [ ] Track skills with `trackSkillAssessment()`
- [ ] Save assessment data at interview end
- [ ] Collect metrics with `calculateInterviewMetrics()`

## Pro Tips

### 💡 Tip 1: Add Domain-Specific Skills
```typescript
const config = {
  requiredSkills: [
    // Add skills specific to your industry
    { name: 'HIPAA Compliance', reason: '...', importance: 'critical' },
    // ...
  ]
}
```

### 💡 Tip 2: Fine-Tune on Your Data
```typescript
// After 50+ interviews, fine-tune with your own examples
// Your data > generic data for your specific roles
const myExamples = /* collected from your interviews */
const trainingData = [...INTERVIEW_TRAINING_DATA, ...myExamples]
```

### 💡 Tip 3: A/B Test Follow-Ups
```typescript
// Generate multiple follow-ups and compare effectiveness
const option1 = generateSmartFollowUp(...) // Method A
const option2 = generateManualFollowUp(...) // Method B
// Track which gets better candidate responses
```

### 💡 Tip 4: Monitor Interviewer Quality
```typescript
// Track metrics across multiple interviews
const avgSkillsCovered = 8.2 / 10  // 82% of required skills
const avgDuration = 12.5 // minutes
const followUpEffectiveness = 78 // %
// Identify patterns and improve
```

## Troubleshooting

**Q: AI isn't asking relevant follow-ups?**
A: Check your `requiredSkills` list - make sure it matches actual job needs

**Q: Follow-ups are too similar?**
A: Add more training examples with diverse question types

**Q: Not assessing all skills?**
A: Use `suggestNextSkillToProbe()` to guide the conversation

**Q: Candidate complains about off-topic?**
A: Review the guardrails in the system prompt - they prevent off-topic questions

## Documentation

- **Full Guide:** `AI_INTERVIEW_FINETUNING_GUIDE.md`
- **Implementation:** `interview-integration-quickstart.ts`
- **Training Data:** `interview-training-data.ts`
- **Training Examples:** `AI_INTERVIEW_FINETUNING_GUIDE.md` → Section "Training Strategy"

## Resources

- OpenAI Fine-Tuning: https://platform.openai.com/docs/guides/fine-tuning
- Claude Fine-Tuning: https://docs.anthropic.com/claude/docs/finetuning
- Interview Best Practices: See `interview-training-data.ts` for 10+ examples

---

**Next Action:** Start with the 3-step quick start above, then read the full guide!
