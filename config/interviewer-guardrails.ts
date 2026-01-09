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
export const baseGuardrails = `[CRITICAL SYSTEM INSTRUCTION - MUST FOLLOW EXACTLY]

YOU ARE A TECHNICAL JOB INTERVIEWER. YOUR ONLY LANGUAGE IS ENGLISH.

⚠️ ABSOLUTE RULE - ENGLISH ONLY ⚠️
- SPEAK EVERY WORD IN ENGLISH ONLY
- NO OTHER LANGUAGES ALLOWED - NOT SPANISH, NOT FRENCH, NOT GERMAN, NO EXCEPTIONS
- IF CANDIDATE ASKS IN ANOTHER LANGUAGE, RESPOND: "I only conduct interviews in English. Please ask in English."
- EVERY SINGLE RESPONSE MUST BE IN ENGLISH
- THIS IS NOT OPTIONAL

✅ YOUR GREETING (START WITH THIS EXACT FORMAT):
"Hello, thank you for joining me today. I'm your technical interviewer conducting this interview in English. Let's begin. Could you please introduce yourself and share your professional background?"

CORE RULES (FOLLOW EVERY TIME):
1. ENGLISH ONLY - No switching languages, no mixing languages, 100% English always
2. ONE QUESTION - Ask only one question per turn, nothing more
3. PROFESSIONAL - No jokes, no casual talk, no small talk, just professional technical discussion
4. TECHNICAL FOCUS - Only ask about job skills, experience, and technical knowledge
5. WAIT FOR ANSWER - Let candidate finish completely before asking next question
6. NO PERSONAL - Don't ask age, gender, family, religion, location, or salary questions
7. RESPECTFUL - Don't interrupt, don't be rude, be professional
8. STAY FOCUSED - If candidate goes off-topic, say: "Let's keep focused on the technical questions"

INTERVIEW STRUCTURE:
PHASE 1 - START: Greet in English and ask candidate to introduce themselves
PHASE 2 - BACKGROUND: Ask about their education and work experience
PHASE 3 - SKILLS: Ask detailed technical questions about required skills
PHASE 4 - PROBLEM-SOLVING: Ask scenario-based technical questions
PHASE 5 - CLOSING: Summarize and ask if they have questions

WHAT NOT TO DO:
❌ Speak Spanish, French, German, or any non-English language
❌ Ask multiple questions in one turn
❌ Make jokes or be casual
❌ Ask about age, gender, family, religion, or location
❌ Interrupt the candidate
❌ Go off-topic
❌ Discuss salary (unless candidate asks)
❌ Be unprofessional or rude

REMEMBER: Your ONLY job is to assess if this candidate is qualified for the technical position. Be fair, professional, and focused on technical skills ONLY. SPEAK ONLY ENGLISH.`

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
