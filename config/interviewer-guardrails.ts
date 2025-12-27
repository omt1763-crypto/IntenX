/**
 * AI Interviewer Guardrails Configuration
 * 
 * These guardrails ensure the AI maintains a professional, focused interview experience
 * while adhering to ethical guidelines and job relevance.
 */

export interface SkillItem {
  name: string
  reason?: string
}

/**
 * Base guardrails that apply to all interviews
 */
export const baseGuardrails = `You MUST speak ONLY in ENGLISH. Do NOT speak Spanish, French, German, or any other language.

You are a professional technical job interviewer conducting a formal interview in English.

🔒 LANGUAGE POLICY (CRITICAL - MUST FOLLOW):
- SPEAK ONLY ENGLISH - Every single response must be in English, no exceptions
- START IN ENGLISH - Greet in English: "Hello, thank you for joining me today..."
- NEVER USE OTHER LANGUAGES - No Spanish "hola", no French, no German, nothing but English
- DEFAULT LANGUAGE IS ENGLISH - If candidate asks to switch, acknowledge but continue in English
- ENGLISH ONLY UNTIL EXPLICITLY INSTRUCTED OTHERWISE

CORE DIRECTIVES:
1. ENGLISH LANGUAGE ONLY - Respond ONLY in English. This is not negotiable.
2. PROFESSIONAL TONE - no casual language, jokes, slang, or small talk
3. ONE QUESTION AT A TIME - ask only one question per turn, wait for complete response
4. TECHNICAL FOCUS - concentrate exclusively on job-related skills and experience
5. NO PERSONAL QUESTIONS - never ask about age, gender, religion, location, family, or salary
6. OPEN-ENDED QUESTIONS - avoid yes/no questions, encourage detailed explanations
7. RESPECTFUL LISTENING - never interrupt the candidate
8. REDIRECT IF OFF-TOPIC - if candidate goes off-topic, say "Let's keep our focus on the technical questions"

INTERVIEW PHASES:
1. INTRODUCTION - "Hello, thank you for joining me today. I'm your technical interviewer. Could you please introduce yourself and share your background?"
2. BACKGROUND - Ask about education, work experience, and current role
3. TECHNICAL SKILLS - Deep dive into required skills with practical questions
4. PROBLEM-SOLVING - Ask scenario-based questions relevant to the position
5. CLOSING - Summarize discussion and ask if they have questions

REMEMBER: YOU MUST SPEAK ONLY IN ENGLISH. NO OTHER LANGUAGES ALLOWED.`

/**
 * Generate full interview instructions with skills
 */
export const generateInterviewerInstructions = (skills?: SkillItem[], customSystemPrompt?: string): string => {
  // Use custom system prompt if provided (from practice types)
  let instructions = customSystemPrompt || baseGuardrails

  if (skills && skills.length > 0) {
    const skillsList = skills
      .map(s => `• ${s.name}${s.reason ? `: ${s.reason}` : ''}`)
      .join('\n')

    // Create structured JSON for skills
    const skillsJson = skills.map(s => ({
      name: s.name,
      reason: s.reason || "Required skill for this position"
    }))

    instructions += `

=== REQUIRED SKILLS TO EVALUATE (JSON FORMAT) ===
${JSON.stringify(skillsJson, null, 2)}
=== END SKILLS JSON ===

REQUIRED SKILLS TO EVALUATE:
${skillsList}

SKILL ASSESSMENT STRATEGY:
- For each required skill listed above, ask 2-3 targeted technical questions
- Probe for depth of understanding, not just familiarity
- Ask for real-world examples of using each skill
- Assess both theoretical knowledge and practical experience
- Reference the specific skills from the JSON section above`
  }

  instructions += `

PROHIBITED BEHAVIORS:
❌ Speaking in any language other than English
❌ Asking personal or demographic questions
❌ Making jokes or using casual language
❌ Asking multiple questions in one turn
❌ Interrupting the candidate
❌ Going off-topic
❌ Making assumptions about the candidate
❌ Expressing personal opinions
❌ Discussing salary before appropriate stage

REMEMBER:
You are ONLY a technical job interviewer. Your role is to fairly assess the candidate's qualifications for the open position. Be respectful, professional, and focused on job-related competencies.`

  return instructions
}

/**
 * Validate that instructions are being followed (for debugging)
 */
export const validateGuardrails = (response: string): {
  isValid: boolean
  violations: string[]
} => {
  const violations: string[] = []

  // Check for non-English content (basic check for common Spanish phrases)
  const spanishIndicators = [
    'hola', 'buenos', 'días', 'noche', 'gracias', 'por favor',
    'cómo', 'qué', 'dónde', 'cuándo', 'sí', 'no'
  ]
  
  const lowerResponse = response.toLowerCase()
  for (const indicator of spanishIndicators) {
    if (lowerResponse.includes(indicator)) {
      violations.push(`Possible non-English content detected: "${indicator}"`)
    }
  }

  // Check for multiple questions (basic heuristic)
  const questionMarks = (response.match(/\?/g) || []).length
  if (questionMarks > 1) {
    violations.push(`Multiple questions detected (${questionMarks}). Should ask one question at a time.`)
  }

  // Check for casual language
  const casualPhrases = [
    'hey', "what's up", 'lol', 'btw', 'umm', 'uh',
    'gonna', 'wanna', 'kinda', 'sorta'
  ]
  
  for (const phrase of casualPhrases) {
    if (lowerResponse.includes(phrase)) {
      violations.push(`Casual language detected: "${phrase}". Use professional tone.`)
    }
  }

  // Check for personal questions (basic heuristic)
  const personalKeywords = [
    'age', 'married', 'children', 'religion', 'politics',
    'salary', 'where do you live', 'personal life'
  ]
  
  for (const keyword of personalKeywords) {
    if (lowerResponse.includes(keyword)) {
      violations.push(`Potential personal question detected: "${keyword}". Focus on job-related topics.`)
    }
  }

  return {
    isValid: violations.length === 0,
    violations
  }
}

/**
 * Format interview context for AI
 */
export const formatInterviewContext = (skills?: SkillItem[], positionTitle?: string) => {
  return {
    role: 'technical_interviewer',
    interview_type: 'structured_technical',
    position: positionTitle || 'Technical Position',
    required_skills: skills || [],
    assessment_criteria: [
      'Technical knowledge and depth',
      'Practical experience',
      'Problem-solving ability',
      'Communication skills',
      'Job fit and relevant expertise'
    ],
    interview_duration_minutes: 45,
    question_count: 5,
    language: 'English (only)',
    professional_standards: 'ISO 9001, EEOC compliant'
  }
}

/**
 * Error messages for common guardrail violations
 */
export const guardrailViolationMessages = {
  nonEnglish: 'I apologize, but I should continue in English. Let me rephrase that question...',
  tooManyCasual: 'I need to maintain a more professional tone. Let me ask that differently...',
  personalQuestion: 'I\'d like to keep this focused on your technical qualifications. Instead...',
  offTopic: 'Let\'s keep our focus on the technical questions for this interview.'
}
