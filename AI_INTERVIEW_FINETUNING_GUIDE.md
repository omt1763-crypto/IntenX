# AI Interview Fine-Tuning Guide

## Overview

This system enables you to fine-tune your AI interviewer to ask intelligent follow-up questions based on:
1. **Job Requirements** - What the recruiter is looking for
2. **Candidate Answers** - How candidates respond
3. **Skill Gaps** - Missing or incomplete information
4. **Job Fit** - How well the candidate aligns with the role

## Architecture

### Components

#### 1. **Follow-Up Question Generator** (`followup-question-generator.ts`)
Generates context-aware follow-up questions based on:
- Candidate's previous response
- Required job skills
- Job description and responsibilities
- Conversation history

**Question Types:**
- **Depth** - Probe for deeper technical understanding
- **Example** - Request real-world examples and proof of experience
- **Gap** - Address missing required skills
- **Skill-Match** - Evaluate job fit
- **Clarification** - Clear up vague or incomplete answers
- **Probing** - Investigate weak or evasive responses

#### 2. **Training Data** (`interview-training-data.ts`)
Pre-built training examples showing:
- Job context and requirements
- Candidate responses
- Ideal follow-up questions
- Reasoning for each follow-up

**Usage:** Train custom LLM models or fine-tune existing ones

#### 3. **AI Integration** (`interview-ai-integration.ts`)
Connects everything together:
- Enhanced system prompts
- Smart follow-up generation
- Interview configuration export

## How to Use

### Step 1: Set Up Interview AI Config

```typescript
import { generateEnhancedSystemPrompt } from '@/lib/ai/interview-ai-integration'

const interviewConfig = {
  jobTitle: 'Senior React Developer',
  jobDescription: 'Build scalable web applications with modern React patterns...',
  requiredSkills: [
    { name: 'React', reason: 'Core framework for UI development', importance: 'critical' },
    { name: 'TypeScript', reason: 'Type safety and developer experience', importance: 'high' },
    { name: 'State Management', reason: 'Manage complex application state', importance: 'high' },
    { name: 'Performance Optimization', reason: 'Build fast, responsive UIs', importance: 'medium' },
  ],
  company: 'TechCorp',
  candidateName: 'John Doe',
  candidatePosition: 'Mid-level Frontend Engineer',
  resumeText: '...',
}

const systemPrompt = generateEnhancedSystemPrompt(interviewConfig)
```

### Step 2: Use Smart Follow-Ups

```typescript
import { generateSmartFollowUp } from '@/lib/ai/interview-ai-integration'

const conversationHistory = [
  { role: 'assistant', content: 'Welcome to the interview...' },
  { role: 'user', content: 'Hi, my name is John and I have 5 years of React experience' },
]

const followUpQuestion = generateSmartFollowUp(
  'Hi, my name is John and I have 5 years of React experience',
  conversationHistory,
  interviewConfig
)

// Result: "That's great context about your React experience. Can you walk me through 
// your most complex project and how you handled state management at scale?"
```

### Step 3: Fine-Tune Your Model (Optional)

#### Option A: Using OpenAI Fine-Tuning API

```typescript
import { generateOpenAIFineTuningJSON } from '@/lib/ai/interview-training-data'

const trainingData = generateOpenAIFineTuningJSON()

// Save to JSONL file and upload to OpenAI
// https://platform.openai.com/docs/api-reference/fine-tuning

// Example training request:
const response = await fetch('https://api.openai.com/v1/fine_tuning/jobs', {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${OPENAI_API_KEY}` },
  body: JSON.stringify({
    training_file: 'file-xxx',
    model: 'gpt-4-turbo-preview',
    hyperparameters: { n_epochs: 3 },
  })
})
```

#### Option B: Using Your Own Training Script

```typescript
import { INTERVIEW_TRAINING_DATA } from '@/lib/ai/interview-training-data'

// Add custom training examples
const customExamples = [
  {
    jobContext: { /* your job details */ },
    candidateResponse: 'My response...',
    idealFollowUp: 'Your ideal follow-up...',
    followUpType: 'example' as const,
    reasoning: 'Why this follow-up is ideal...',
  },
]

const allTrainingData = [...INTERVIEW_TRAINING_DATA, ...customExamples]

// Train your model with this data
// Example: Send to Claude, GPT-4, or custom fine-tuning endpoint
```

## Training Strategy

### Collecting Training Data

1. **Record Real Interviews** - Capture candidate responses and interviewer follow-ups
2. **Annotate Responses** - Label which follow-up type was used
3. **Document Reasoning** - Why was that follow-up effective?

### Example Structure:

```typescript
const trainingExample = {
  jobContext: {
    jobTitle: 'Backend Engineer',
    requiredSkills: ['Python', 'PostgreSQL', 'REST APIs'],
    jobDescription: 'Design scalable backend services...',
    company: 'DataSystems',
  },
  candidateResponse: 'I have 3 years of Python experience.',
  idealFollowUp: 'Can you walk me through your largest Python project? What was the architecture?',
  followUpType: 'example' as const,
  reasoning: 'Candidate stated experience level but no proof. Examples validate real expertise.',
}
```

## Follow-Up Question Strategies

### 1. Depth Questions
**When:** Candidate mentions skill but explanation is surface-level
**Goal:** Probe technical understanding
**Example:**
- Candidate: "I used React hooks"
- Follow-up: "Can you explain how useState works under the hood? What about useReducer vs useState?"

### 2. Example Questions
**When:** Candidate claims experience without proof
**Goal:** Validate with real-world evidence
**Example:**
- Candidate: "I'm good at database design"
- Follow-up: "Tell me about a complex schema you designed. What challenges did you face?"

### 3. Gap Questions
**When:** Candidate hasn't addressed critical required skills
**Goal:** Assess missing areas
**Example:**
- Job requires: Docker, TypeScript, REST APIs
- Candidate discussed: React, Node.js
- Follow-up: "What's your experience with Docker? This is important for the role."

### 4. Skill-Match Questions
**When:** Candidate's experience could apply to this job
**Goal:** Validate relevance
**Example:**
- Candidate: "I built a social media platform"
- Follow-up: "How does your experience with real-time features apply to our chat system requirements?"

### 5. Clarification Questions
**When:** Candidate answer is vague or incomplete
**Goal:** Get specific information
**Example:**
- Candidate: "I've done some database work"
- Follow-up: "Can you be more specific? What databases? What was the scale?"

### 6. Probing Questions
**When:** Candidate seems uncertain about required skills
**Goal:** Understand gaps and learning capability
**Example:**
- Candidate: "I'm not really sure about Kubernetes"
- Follow-up: "What would it take for you to learn Kubernetes? Are you open to ramping up on new technologies?"

## Integration with Existing Interview System

### Update Your Interview Page

```typescript
// app/interview/realtime/page.tsx

import { generateSmartFollowUp, generateEnhancedSystemPrompt } from '@/lib/ai/interview-ai-integration'

function RealtimeInterviewPageContent() {
  // ... existing code ...

  const handleCandidateResponse = (response: string) => {
    // Generate smart follow-up
    const followUpQuestion = generateSmartFollowUp(
      response,
      conversationHistory,
      interviewConfig
    )

    // Send to AI
    sendAIMessage(followUpQuestion)
  }

  // When creating system prompt:
  const systemPrompt = generateEnhancedSystemPrompt({
    jobTitle: interviewData?.title || 'Technical Position',
    jobDescription: interviewData?.jobDescription || '',
    requiredSkills: interviewData?.skills || [],
    company: interviewData?.client || 'Our Company',
    candidateName: candidateInfo?.name,
    candidatePosition: candidateInfo?.position,
    resumeText: candidateInfo?.resume,
    candidateEmail: candidateInfo?.email,
    candidatePhone: candidateInfo?.phone,
  })

  return (
    // ... existing JSX ...
  )
}
```

## Performance Metrics

Track these metrics to measure improvement:

### Candidate Response Quality
- Average response length
- Number of specific examples given
- Technical depth shown

### Interviewer Quality
- Relevance of follow-up questions (0-100%)
- Coverage of required skills (%)
- Time to assess each skill

### Overall Interview Quality
- Candidate satisfaction rating
- Interviewer confidence in assessment
- Time taken to make hiring decision

## Advanced Customization

### Add Domain-Specific Training Data

```typescript
// Create a custom training dataset for your industry
const customTrainingData = [
  // Healthcare tech examples
  // FinTech examples
  // AI/ML examples
  // etc.
]

// Combine with standard training data
const allTrainingData = [
  ...INTERVIEW_TRAINING_DATA,
  ...customTrainingData,
]
```

### Create Role-Specific Prompts

```typescript
const roleSpecificEnhancement = {
  'Frontend': 'Focus on UI/UX, performance, and state management',
  'Backend': 'Focus on system design, databases, and APIs',
  'Full Stack': 'Balance between frontend and backend skills',
  'DevOps': 'Focus on infrastructure, deployment, and scaling',
}
```

### Monitor and Improve

1. **Log all interviews** with metadata
2. **Analyze follow-up effectiveness** - which types work best?
3. **Collect feedback** from candidates and recruiters
4. **Update training data** with successful examples
5. **Retrain model** periodically

## Troubleshooting

### AI Isn't Asking Relevant Follow-Ups

**Solution:** Add more training examples for this job type
```typescript
const customExamples = [
  // Add 5-10 specific examples for your use case
]
```

### Follow-Ups Are Too Similar

**Solution:** Increase variety in training data
```typescript
// Use all 6 follow-up types in training examples
// Include diverse job roles and candidate backgrounds
```

### Candidate Complains Follow-Ups Are Off-Topic

**Solution:** Review the job requirements and adjust skills list
```typescript
const interviewConfig = {
  // Make sure requiredSkills matches actual job needs
  requiredSkills: [...] // revisit these
}
```

## Next Steps

1. ✅ **Implement** - Add to your interview system
2. **Collect** - Gather real interview data
3. **Analyze** - Review follow-up effectiveness
4. **Fine-Tune** - Train your model with collected data
5. **Deploy** - Use improved model in production
6. **Monitor** - Track metrics and iterate

## Resources

- [Interview Training Data Examples](./interview-training-data.ts)
- [Follow-Up Question Generator](./followup-question-generator.ts)
- [AI Integration Module](./interview-ai-integration.ts)
- [OpenAI Fine-Tuning Docs](https://platform.openai.com/docs/guides/fine-tuning)
- [Claude Fine-Tuning Docs](https://docs.anthropic.com/claude/docs/finetuning)
