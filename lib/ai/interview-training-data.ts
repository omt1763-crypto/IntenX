/**
 * AI Training Data for Interview Follow-up Questions
 * 
 * This file contains training examples to improve the AI's ability to ask
 * follow-up questions based on recruiter requirements and candidate answers.
 * 
 * Format: Each entry has the job context, candidate response, and ideal follow-up
 */

export interface TrainingExample {
  jobContext: {
    jobTitle: string
    requiredSkills: string[]
    jobDescription: string
    company: string
  }
  candidateResponse: string
  idealFollowUp: string
  followUpType: 'depth' | 'example' | 'gap' | 'skill-match' | 'clarification' | 'probing'
  reasoning: string
}

export const INTERVIEW_TRAINING_DATA: TrainingExample[] = [
  {
    jobContext: {
      jobTitle: 'Senior Frontend Developer',
      requiredSkills: ['React', 'TypeScript', 'Next.js', 'Performance Optimization'],
      jobDescription: 'Build scalable web applications with modern React patterns',
      company: 'TechCorp',
    },
    candidateResponse: 'I have worked with React for about 3 years.',
    idealFollowUp:
      'That\'s helpful context. Can you walk me through a specific production project where you used React? What was the complexity, and how did you handle state management and performance optimization?',
    followUpType: 'example',
    reasoning:
      'Candidate mentioned experience level but no concrete examples. Need to validate actual hands-on experience with real projects.',
  },
  {
    jobContext: {
      jobTitle: 'Senior Frontend Developer',
      requiredSkills: ['React', 'TypeScript', 'Next.js', 'Performance Optimization'],
      jobDescription: 'Build scalable web applications with modern React patterns',
      company: 'TechCorp',
    },
    candidateResponse:
      'I used React for state management, basically just the useState hook most of the time.',
    idealFollowUp:
      'I understand you\'ve used React hooks. Can you explain what useState does under the hood, and when you would choose useReducer or Context API instead? What are the trade-offs?',
    followUpType: 'depth',
    reasoning:
      'Candidate gave simplified explanation. Need to probe for deeper technical understanding of React fundamentals.',
  },
  {
    jobContext: {
      jobTitle: 'Backend Engineer',
      requiredSkills: ['Node.js', 'PostgreSQL', 'REST APIs', 'Authentication'],
      jobDescription: 'Design and implement scalable backend services',
      company: 'DataSystems',
    },
    candidateResponse: 'I\'ve built APIs using Node.js and Express, and worked with databases.',
    idealFollowUp:
      'That\'s good. I\'d like to understand more about your database design. Tell me about a complex schema you\'ve designed - what challenges did you face with relationships, indexing, or migrations, and how did you solve them?',
    followUpType: 'gap',
    reasoning:
      'Candidate mentioned databases generically but didn\'t specify SQL experience. Need to assess PostgreSQL specifically since it\'s a required skill.',
  },
  {
    jobContext: {
      jobTitle: 'Full Stack Developer',
      requiredSkills: ['React', 'Node.js', 'MongoDB', 'Docker'],
      jobDescription: 'Develop full-stack web applications with modern tooling',
      company: 'StartupX',
    },
    candidateResponse:
      'I\'ve done some Docker work in my last role, but I\'m not really an expert or anything.',
    idealFollowUp:
      'I appreciate the honesty. Can you tell me specifically what Docker tasks you\'ve handled? Have you written Dockerfiles, managed containers, or worked with docker-compose? And what would you say is your comfort level - are you open to deepening your Docker expertise on the job?',
    followUpType: 'probing',
    reasoning:
      'Candidate is hesitant about a required skill. Need to assess actual hands-on experience and their learning capability.',
  },
  {
    jobContext: {
      jobTitle: 'DevOps Engineer',
      requiredSkills: ['Kubernetes', 'AWS', 'CI/CD', 'Infrastructure as Code'],
      jobDescription: 'Manage cloud infrastructure and deployment pipelines',
      company: 'CloudTech',
    },
    candidateResponse:
      'I\'ve deployed applications to AWS using EC2 instances, and I\'ve set up some CI/CD pipelines with Jenkins.',
    idealFollowUp:
      'That sounds relevant to our infrastructure needs. Specifically, how does your CI/CD experience translate to our tech stack? Have you worked with Kubernetes at scale, and if not, what would your approach be to ramping up on container orchestration for this role?',
    followUpType: 'skill-match',
    reasoning:
      'Candidate has some relevant experience. Need to validate how their background aligns with this specific role\'s requirements.',
  },
  {
    jobContext: {
      jobTitle: 'Machine Learning Engineer',
      requiredSkills: ['Python', 'TensorFlow', 'Model Deployment', 'Data Analysis'],
      jobDescription: 'Build and deploy machine learning models at scale',
      company: 'AI Solutions',
    },
    candidateResponse: 'I know Python pretty well and I\'ve done some machine learning stuff.',
    idealFollowUp:
      'Great, that\'s foundational. Can you walk me through a complete ML project from start to finish? How did you approach data preparation, model selection, validation, and what did you do to deploy it to production?',
    followUpType: 'example',
    reasoning:
      'Candidate answer is vague. Need specific, end-to-end project examples to understand their actual ML capabilities.',
  },
  {
    jobContext: {
      jobTitle: 'Software Engineer',
      requiredSkills: ['System Design', 'Data Structures', 'Scalability', 'Problem-Solving'],
      jobDescription: 'Design and implement scalable systems handling millions of users',
      company: 'HighScale Inc',
    },
    candidateResponse:
      'I\'ve worked on projects that handle a decent amount of traffic. I made them faster by optimizing the database queries and caching.',
    idealFollowUp:
      'That\'s a good start. Can you walk me through your caching strategy? What did you cache, how did you handle cache invalidation, and how did you measure the performance improvement? What trade-offs did you make?',
    followUpType: 'depth',
    reasoning:
      'Candidate mentioned optimization but without technical depth. Need to understand their systems thinking and trade-off analysis.',
  },
  {
    jobContext: {
      jobTitle: 'Full Stack Developer',
      requiredSkills: ['React', 'Node.js', 'Databases', 'API Design'],
      jobDescription: 'Build full-stack features from database to UI',
      company: 'SaaS Platform',
    },
    candidateResponse: 'I\'ve done full stack development in my current role.',
    idealFollowUp:
      'That\'s relevant to what we\'re looking for. Can you walk me through how you would architect a feature end-to-end here? Start with the database schema, then the API endpoints, and finally the React UI. What are the key decisions you\'d make?',
    followUpType: 'skill-match',
    reasoning:
      'Generic answer about full stack experience. Need to assess their actual architectural thinking for this specific role\'s requirements.',
  },
  {
    jobContext: {
      jobTitle: 'QA Engineer',
      requiredSkills: ['Test Automation', 'JavaScript', 'Selenium', 'Test Strategy'],
      jobDescription: 'Develop comprehensive test suites for web applications',
      company: 'QA Tech',
    },
    candidateResponse:
      'I\'ve written some test scripts using Selenium, and I know how to use JavaScript for automation.',
    idealFollowUp:
      'Good foundation. Tell me about your approach to test strategy - how do you decide what to test? Have you worked with CI/CD integration, test data management, or scaling tests across browsers and devices?',
    followUpType: 'gap',
    reasoning:
      'Candidate has tool knowledge but unclear on broader testing practices. Need to assess strategic thinking about test automation.',
  },
  {
    jobContext: {
      jobTitle: 'Data Engineer',
      requiredSkills: ['SQL', 'Python', 'Data Pipelines', 'Big Data Tools'],
      jobDescription: 'Build reliable data pipelines processing terabytes of data',
      company: 'DataFlow Corp',
    },
    candidateResponse:
      'I\'ve worked with SQL and Python, and I\'ve built some data processing scripts.',
    idealFollowUp:
      'That sounds like a start. When you say data processing scripts, can you describe the complexity? How much data were you handling, what was your approach to handling failures, and did you implement any monitoring or alerting for data pipeline issues?',
    followUpType: 'clarification',
    reasoning:
      'Candidate answer is too vague about data scale and pipeline robustness. Need specific examples to assess production readiness.',
  },
]

/**
 * Advanced training examples for follow-up in context
 * These show how to chain follow-ups based on previous responses
 */
export interface ConversationFlowExample {
  jobContext: {
    jobTitle: string
    requiredSkills: string[]
  }
  conversationFlow: Array<{
    speaker: 'interviewer' | 'candidate'
    text: string
    followUpReasoning?: string
  }>
  skillsAssessed: string[]
  assessmentSummary: string
}

export const CONVERSATION_FLOW_EXAMPLES: ConversationFlowExample[] = [
  {
    jobContext: {
      jobTitle: 'Senior React Developer',
      requiredSkills: ['React', 'State Management', 'Performance', 'TypeScript'],
    },
    conversationFlow: [
      {
        speaker: 'interviewer',
        text: 'Tell me about your experience with React state management.',
      },
      {
        speaker: 'candidate',
        text: 'I\'ve used Redux in my projects, and recently I\'ve been exploring Context API.',
      },
      {
        speaker: 'interviewer',
        text: 'Interesting - when would you choose Context API over Redux for a large application?',
        followUpReasoning: 'Candidate mentioned both tools. Need to assess their decision-making criteria.',
      },
      {
        speaker: 'candidate',
        text: 'Context API is simpler, so when the app is small or medium-sized.',
      },
      {
        speaker: 'interviewer',
        text: 'That makes sense. Can you walk me through a specific large-scale project where you chose Redux? What complexity made Redux the right choice?',
        followUpReasoning:
          'Candidate gave oversimplified answer. Need depth and real-world examples to validate understanding.',
      },
      {
        speaker: 'candidate',
        text: 'We had a complex e-commerce platform with thousands of products, user carts, filters, search state, etc.',
      },
      {
        speaker: 'interviewer',
        text: 'Great context. How did you structure your Redux store? Did you use middleware, and how did you handle performance with large datasets?',
        followUpReasoning:
          'Candidate provided good context. Now probe for architectural depth and performance considerations.',
      },
    ],
    skillsAssessed: ['State Management', 'Architectural Decision-Making', 'Performance Thinking'],
    assessmentSummary:
      'Candidate shows understanding of state management tools but initially gave surface-level answers. With probing, demonstrated deeper architectural knowledge.',
  },

  {
    jobContext: {
      jobTitle: 'Backend Engineer',
      requiredSkills: ['Database Design', 'Scaling', 'APIs', 'Security'],
    },
    conversationFlow: [
      {
        speaker: 'interviewer',
        text: 'Tell me about your experience designing databases for high-traffic applications.',
      },
      {
        speaker: 'candidate',
        text: 'I\'ve worked on databases that handle millions of records.',
      },
      {
        speaker: 'interviewer',
        text: 'Can you be more specific? Walk me through how you designed your schema for one such application.',
        followUpReasoning: 'Vague answer about scale. Need concrete examples of design decisions.',
      },
      {
        speaker: 'candidate',
        text: 'I used proper normalization, indexed the right columns, and used foreign keys.',
      },
      {
        speaker: 'interviewer',
        text: 'Good fundamentals. When have you had to denormalize for performance? Can you share a specific scenario where normalization hurt performance?',
        followUpReasoning:
          'Candidate recited basics. Need to assess if they understand trade-offs and when to break rules.',
      },
      {
        speaker: 'candidate',
        text: 'Hmm, not really. I usually stick to normalization.',
      },
      {
        speaker: 'interviewer',
        text: 'Interesting. Have you faced N+1 query problems, and if so, how did you solve them?',
        followUpReasoning:
          'Candidate hasn\'t explored design trade-offs. Pivot to another common scaling challenge.',
      },
    ],
    skillsAssessed: ['Database Design', 'Scaling Knowledge', 'Design Trade-offs', 'Problem-Solving'],
    assessmentSummary:
      'Candidate understands normalization fundamentals but lacks experience with design trade-offs. Limited exposure to scaling challenges.',
  },
]

/**
 * Generate a training prompt for fine-tuning LLMs
 * Use this to train custom models on interview follow-up patterns
 */
export function generateFineTuningPrompt(): string {
  const examples = INTERVIEW_TRAINING_DATA.slice(0, 5)
    .map(
      (example, idx) => `
Example ${idx + 1}:
Job: ${example.jobContext.jobTitle}
Required Skills: ${example.jobContext.requiredSkills.join(', ')}

Candidate Response: "${example.candidateResponse}"

Ideal Follow-Up: "${example.idealFollowUp}"
Follow-Up Type: ${example.followUpType}
Reasoning: ${example.reasoning}
`
    )
    .join('\n---\n')

  return `You are an expert technical interviewer. Your task is to generate follow-up questions based on:
1. The job requirements and skills
2. The candidate's response
3. The gaps between what they said and what you need to know

Key principles:
- Ask one question at a time
- Base questions on job requirements
- Probe for depth, examples, and real-world experience
- Identify gaps and address them systematically
- Be conversational but professional

${examples}

When generating follow-ups, consider:
- Did they provide specific examples?
- Is the answer complete or vague?
- What skills haven't been addressed?
- What technical depth can I probe?
- How does their experience match this specific job?`
}

/**
 * Fine-tuning dataset export for OpenAI or other LLM services
 */
export function generateOpenAIFineTuningJSON() {
  return INTERVIEW_TRAINING_DATA.map(example => ({
    messages: [
      {
        role: 'system',
        content:
          'You are an expert technical interviewer. Generate a follow-up question based on the job context and candidate response.',
      },
      {
        role: 'user',
        content: `
Job Title: ${example.jobContext.jobTitle}
Required Skills: ${example.jobContext.requiredSkills.join(', ')}
Job Description: ${example.jobContext.jobDescription}

Candidate said: "${example.candidateResponse}"

Generate an appropriate follow-up question. The question type should be: ${example.followUpType}
Reasoning: ${example.reasoning}
        `,
      },
      {
        role: 'assistant',
        content: example.idealFollowUp,
      },
    ],
  }))
}
