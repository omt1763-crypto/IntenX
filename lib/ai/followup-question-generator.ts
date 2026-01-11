/**
 * Follow-up Question Generator for AI Interviewer
 * Generates contextual follow-up questions based on:
 * 1. Job requirements and skills needed
 * 2. Candidate's previous answers
 * 3. Gaps in candidate's experience
 * 4. Required skill depth assessment
 */

export interface FollowUpContext {
  jobTitle: string
  requiredSkills: Array<{ name: string; reason: string; importance: string }>
  jobDescription: string
  candidateBackground: string
  conversationHistory: Array<{ role: string; content: string }>
  currentSkillBeingProbed?: string
}

export interface FollowUpQuestion {
  question: string
  type: 'depth' | 'example' | 'gap' | 'skill-match' | 'clarification' | 'probing'
  targetSkill: string
  rationale: string
  priority: 'high' | 'medium' | 'low'
}

/**
 * Generate targeted follow-up questions based on context
 */
export function generateFollowUpQuestion(context: FollowUpContext): FollowUpQuestion {
  const { jobTitle, requiredSkills, candidateBackground, conversationHistory, currentSkillBeingProbed } = context

  // Get the last candidate response
  const lastCandidateResponse = conversationHistory
    .filter(msg => msg.role === 'user')
    .slice(-1)[0]?.content || ''

  // Detect what type of follow-up is needed
  const followUpType = detectFollowUpType(lastCandidateResponse, requiredSkills)

  // Generate question based on type
  let question = ''
  let targetSkill = currentSkillBeingProbed || requiredSkills[0]?.name || 'general'
  let rationale = ''
  let priority: 'high' | 'medium' | 'low' = 'medium'

  switch (followUpType) {
    case 'depth':
      ({ question, rationale, targetSkill, priority } = generateDepthQuestion(
        lastCandidateResponse,
        targetSkill,
        jobTitle
      ))
      break

    case 'example':
      ({ question, rationale, targetSkill, priority } = generateExampleQuestion(
        lastCandidateResponse,
        targetSkill,
        requiredSkills
      ))
      break

    case 'gap':
      ({ question, rationale, targetSkill, priority } = generateGapFillingQuestion(
        lastCandidateResponse,
        requiredSkills,
        candidateBackground
      ))
      break

    case 'skill-match':
      ({ question, rationale, targetSkill, priority } = generateSkillMatchQuestion(
        lastCandidateResponse,
        requiredSkills,
        jobTitle
      ))
      break

    case 'clarification':
      ({ question, rationale, targetSkill, priority } = generateClarificationQuestion(
        lastCandidateResponse,
        jobTitle
      ))
      break

    case 'probing':
      ({ question, rationale, targetSkill, priority } = generateProbingQuestion(
        lastCandidateResponse,
        requiredSkills,
        jobTitle
      ))
      break

    default:
      question = `Can you tell me more about that experience and how it relates to the ${jobTitle} position?`
      rationale = 'Request for more details'
      priority = 'medium'
  }

  return {
    question,
    type: followUpType,
    targetSkill,
    rationale,
    priority,
  }
}

/**
 * Detect what type of follow-up question is needed
 */
function detectFollowUpType(
  candidateResponse: string,
  requiredSkills: Array<{ name: string; reason: string; importance: string }>
): 'depth' | 'example' | 'gap' | 'skill-match' | 'clarification' | 'probing' {
  const lowerResponse = candidateResponse.toLowerCase()

  // Check for vague or brief answers (need clarity/depth)
  if (
    lowerResponse.length < 50 ||
    lowerResponse.includes('kind of') ||
    lowerResponse.includes('somewhat') ||
    lowerResponse.includes('a little bit') ||
    lowerResponse.includes('i think') ||
    lowerResponse.includes('maybe')
  ) {
    return 'clarification'
  }

  // Check for skill mentions without examples (need examples)
  if (
    lowerResponse.includes('used') ||
    lowerResponse.includes('worked with') ||
    lowerResponse.includes('familiar with') ||
    lowerResponse.includes('know')
  ) {
    return 'example'
  }

  // Check for incomplete technical answers (need depth)
  if (lowerResponse.includes('basically') || lowerResponse.includes('it\'s like')) {
    return 'depth'
  }

  // Check for statements that need validation against job fit
  if (lowerResponse.includes('project') || lowerResponse.includes('experience')) {
    return 'skill-match'
  }

  // Check for answers that seem evasive or incomplete (need probing)
  if (
    lowerResponse.includes('not really') ||
    lowerResponse.includes('not much') ||
    lowerResponse.includes('not really sure')
  ) {
    return 'probing'
  }

  // Default: identify gaps
  return 'gap'
}

/**
 * Generate depth question - probe for deeper understanding
 */
function generateDepthQuestion(
  candidateResponse: string,
  targetSkill: string,
  jobTitle: string
): { question: string; rationale: string; targetSkill: string; priority: 'high' | 'medium' | 'low' } {
  const depthQuestions = [
    `You mentioned ${targetSkill}. Can you walk me through the specific architecture or approach you used in your most recent project with this technology?`,
    `When you work with ${targetSkill}, what's your process for handling edge cases or complex scenarios?`,
    `Can you explain the underlying principles of ${targetSkill} and why it's important for the ${jobTitle} role?`,
    `What are the most critical performance considerations you've had to address when implementing ${targetSkill}?`,
    `In your experience, what common mistakes do developers make with ${targetSkill}, and how have you avoided or fixed them?`,
  ]

  const question = depthQuestions[Math.floor(Math.random() * depthQuestions.length)]

  return {
    question,
    rationale: 'Candidate mentioned skill but with limited depth. Probing for deeper technical understanding.',
    targetSkill,
    priority: 'high',
  }
}

/**
 * Generate example question - ask for real-world examples
 */
function generateExampleQuestion(
  candidateResponse: string,
  targetSkill: string,
  requiredSkills: Array<{ name: string; reason: string; importance: string }>
): { question: string; rationale: string; targetSkill: string; priority: 'high' | 'medium' | 'low' } {
  const exampleQuestions = [
    `That's good context. Can you walk me through a specific, real-world project where you applied ${targetSkill}? What was the challenge, and how did you solve it?`,
    `Tell me about the last time you used ${targetSkill} in production. What was the outcome, and what did you learn?`,
    `Can you describe a situation where your ${targetSkill} expertise directly contributed to the success of a project?`,
    `Give me a concrete example of how you've optimized or improved something using ${targetSkill}.`,
    `Walk me through a complex problem you solved with ${targetSkill}. What made it difficult, and how did you overcome it?`,
  ]

  const question = exampleQuestions[Math.floor(Math.random() * exampleQuestions.length)]

  return {
    question,
    rationale: 'Candidate mentioned skill but without concrete examples. Need real-world validation of experience.',
    targetSkill,
    priority: 'high',
  }
}

/**
 * Generate gap-filling question - address missing skills or experience
 */
function generateGapFillingQuestion(
  candidateResponse: string,
  requiredSkills: Array<{ name: string; reason: string; importance: string }>,
  candidateBackground: string
): { question: string; rationale: string; targetSkill: string; priority: 'high' | 'medium' | 'low' } {
  // Find a required skill not yet discussed
  const skillsToCover = requiredSkills.slice(0, 3)
  const randomSkill = skillsToCover[Math.floor(Math.random() * skillsToCover.length)]

  const gapQuestions = [
    `I want to understand your experience with ${randomSkill.name}. The role requires ${randomSkill.reason}. Can you share your background with this?`,
    `Looking at the requirements for this role, ${randomSkill.name} is important because ${randomSkill.reason}. What's your experience level with ${randomSkill.name}?`,
    `Let's shift gears a bit. Can you tell me about your experience with ${randomSkill.name}? This is a key skill we're looking for in this position.`,
    `How would you rate your proficiency with ${randomSkill.name}, and can you give me an example of where you've applied it?`,
  ]

  const question = gapQuestions[Math.floor(Math.random() * gapQuestions.length)]

  return {
    question,
    rationale: `Need to assess candidate's competency in required skill: ${randomSkill.name}`,
    targetSkill: randomSkill.name,
    priority: 'high',
  }
}

/**
 * Generate skill-match question - evaluate how candidate's experience matches job requirements
 */
function generateSkillMatchQuestion(
  candidateResponse: string,
  requiredSkills: Array<{ name: string; reason: string; importance: string }>,
  jobTitle: string
): { question: string; rationale: string; targetSkill: string; priority: 'high' | 'medium' | 'low' } {
  const matchQuestions = [
    `That project sounds relevant. Specifically, how does your experience there translate to what we need for this ${jobTitle} position?`,
    `When you mention your background with that technology, how directly does it apply to the responsibilities of this ${jobTitle} role?`,
    `I'm interested in how your experience maps to the technical challenges we face here. Can you connect those dots for me?`,
    `Based on what you've shared, how confident are you that you can immediately contribute to our ${jobTitle} team?`,
    `Walk me through how your approach to that problem would be the same or different in the context of this ${jobTitle} role.`,
  ]

  const question = matchQuestions[Math.floor(Math.random() * matchQuestions.length)]

  return {
    question,
    rationale: 'Validate that candidate\'s experience aligns with specific job requirements',
    targetSkill: 'job-fit-assessment',
    priority: 'high',
  }
}

/**
 * Generate clarification question - clear up vague or incomplete answers
 */
function generateClarificationQuestion(
  candidateResponse: string,
  jobTitle: string
): { question: string; rationale: string; targetSkill: string; priority: 'high' | 'medium' | 'low' } {
  const clarificationQuestions = [
    `That's helpful, but could you be more specific? Can you elaborate on that point with more detail?`,
    `I want to make sure I understand completely. Can you walk me through that step-by-step?`,
    `When you say that, what exactly do you mean? Can you give me a more concrete example?`,
    `I appreciate the context. Can you break that down further and explain it in more technical detail?`,
    `That gives me a general idea. Can you dive deeper and explain the specific approach you took?`,
  ]

  const question = clarificationQuestions[Math.floor(Math.random() * clarificationQuestions.length)]

  return {
    question,
    rationale: 'Candidate answer was too vague or brief. Need more specific, detailed information.',
    targetSkill: 'communication-clarity',
    priority: 'high',
  }
}

/**
 * Generate probing question - investigate weak or evasive answers
 */
function generateProbingQuestion(
  candidateResponse: string,
  requiredSkills: Array<{ name: string; reason: string; importance: string }>,
  jobTitle: string
): { question: string; rationale: string; targetSkill: string; priority: 'high' | 'medium' | 'low' } {
  const skill = requiredSkills[0] || { name: 'technical skills', reason: 'job requirements' }

  const probingQuestions = [
    `I hear some hesitation about ${skill.name}. Is this an area where you feel less confident, or have you had limited exposure?`,
    `Can you tell me about your learning approach when encountering technologies or skills outside your current comfort zone?`,
    `When you don't have direct experience with something required for the job, how do you typically approach learning it?`,
    `What would it take for you to become comfortable with ${skill.name} if you haven't worked with it extensively before?`,
    `Let me ask directly: How would you rate your overall comfort level with ${skill.name} on a scale of 1-10, and why?`,
  ]

  const question = probingQuestions[Math.floor(Math.random() * probingQuestions.length)]

  return {
    question,
    rationale: 'Candidate seems uncertain or evasive about key skills. Need direct assessment.',
    targetSkill: skill.name,
    priority: 'high',
  }
}

/**
 * Analyze conversation flow and suggest next skill to probe
 */
export function suggestNextSkillToProbe(
  conversationHistory: Array<{ role: string; content: string }>,
  requiredSkills: Array<{ name: string; reason: string; importance: string }>
): string {
  const discussedSkills = new Set<string>()
  const conversationText = conversationHistory.map(msg => msg.content.toLowerCase()).join(' ')

  // Track which skills have been discussed
  requiredSkills.forEach(skill => {
    if (conversationText.includes(skill.name.toLowerCase())) {
      discussedSkills.add(skill.name)
    }
  })

  // Find high-importance skills not yet discussed
  const undiscussedSkills = requiredSkills.filter(
    skill => !discussedSkills.has(skill.name) && skill.importance !== 'low'
  )

  if (undiscussedSkills.length > 0) {
    return undiscussedSkills[0].name
  }

  // If all skills discussed, probe most important ones deeper
  const importantSkills = requiredSkills
    .filter(skill => skill.importance === 'high' || skill.importance === 'critical')
    .sort(() => Math.random() - 0.5)

  return importantSkills[0]?.name || requiredSkills[0]?.name || 'general-technical-skills'
}

/**
 * Generate system prompt enhancement for better follow-up questions
 */
export function generateFollowUpSystemPromptEnhancement(
  requiredSkills: Array<{ name: string; reason: string; importance: string }>,
  jobDescription: string
): string {
  const skillsList = requiredSkills.map(s => `• ${s.name}: ${s.reason}`).join('\n')

  return `
FOLLOW-UP QUESTION STRATEGY:
When the candidate gives a response, analyze what they've shared and ask one of these types of follow-ups:

1. DEPTH FOLLOW-UP: If they mention a skill but don't explain how/why
   Example: "Can you walk me through how you implemented that?"

2. EXAMPLE FOLLOW-UP: If they claim experience but don't provide evidence
   Example: "Tell me about a specific project where you used this technology."

3. GAP FILLING: If they haven't addressed a critical required skill
   Example: "The role requires [SKILL]. What's your experience with that?"

4. SKILL MATCH: If their experience could apply to this specific role
   Example: "How does your approach translate to the challenges we face here?"

5. CLARIFICATION: If their answer is vague or unclear
   Example: "Can you be more specific? Walk me through that step-by-step."

6. PROBING: If they seem uncertain about required skills
   Example: "What would it take for you to become comfortable with [SKILL]?"

REQUIRED SKILLS TO PROBE (in order of importance):
${skillsList}

INTERVIEW FLOW:
- Track which skills have been discussed
- Don't ask about the same skill twice unless probing deeper
- Progress to undiscussed critical skills
- As you discuss each skill, build context about how their experience aligns with the specific job responsibilities

ASSESSMENT CRITERIA DURING FOLLOW-UPS:
- Technical Depth: Do they understand the underlying concepts?
- Practical Experience: Can they provide real examples?
- Problem-Solving: How did they approach challenges?
- Relevance: How does it apply to THIS job?
- Communication: Can they explain complex ideas clearly?
`
}
