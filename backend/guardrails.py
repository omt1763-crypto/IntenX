"""
AI Interviewer Guardrails Module
Enforces professional, ethical, and focused interview standards
"""

import re
from typing import Dict, List, Optional, Tuple
from dataclasses import dataclass


@dataclass
class ValidationResult:
    """Result of guardrail validation"""
    is_valid: bool
    violations: List[str]
    severity: str  # 'none', 'warning', 'critical'


class InterviewerGuardrails:
    """
    Core guardrails for AI interviewer behavior
    """
    
    # Base instructions for all interviews
    BASE_INSTRUCTIONS = """You MUST speak ONLY in ENGLISH. Do NOT speak Spanish, French, German, or any other language.

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

PROHIBITED BEHAVIORS:
❌ Speaking in any language other than English
❌ Using Spanish, French, German, or any non-English language
❌ Saying "hola", "bonjour", "guten tag", or greetings in other languages
❌ Asking personal or demographic questions
❌ Making jokes or using casual language
❌ Asking multiple questions in one turn
❌ Interrupting the candidate
❌ Going off-topic
❌ Making assumptions about the candidate
❌ Expressing personal opinions
❌ Discussing salary before appropriate stage

REMEMBER: YOU MUST SPEAK ONLY IN ENGLISH. NO OTHER LANGUAGES ALLOWED."""

    # Language indicators to detect non-English content
    NON_ENGLISH_INDICATORS = {
        'spanish': [
            'hola', 'buenos', 'días', 'noche', 'gracias', 'por favor',
            'cómo', 'qué', 'dónde', 'cuándo', 'sí', 'no', 'bien',
            'buena', 'malo', 'mañana', 'semana', 'año', 'mes', 'ayer'
        ],
        'french': ['bonjour', 'merci', 'oui', 'non', 'comment', 'pourquoi'],
        'german': ['hallo', 'danke', 'ja', 'nein', 'wie', 'warum'],
        'other': ['你好', 'こんにちは', 'привет', '안녕하세요']
    }

    # Casual language phrases
    CASUAL_PHRASES = [
        r'\bhey\b', r'\bwhat\'?s up\b', r'\blol\b', r'\bbtw\b', r'\bumm\b', r'\buh\b',
        r'\bgonna\b', r'\bwanna\b', r'\bkinda\b', r'\bsorta\b', r'\byeah\b',
        r'\bliterally\b', r'\bbasically\b', r'\bstuff\b', r'\bthing\b'
    ]

    # Personal/demographic keywords
    PERSONAL_KEYWORDS = [
        'age', 'aged', 'young', 'old', 'married', 'children', 'kids',
        'religion', 'politics', 'salary', 'pay', 'where do you live',
        'personal life', 'family', 'relationship', 'gender', 'ethnicity',
        'nationality', 'visa', 'immigration'
    ]

    @classmethod
    def generate_instructions(cls, skills: Optional[List[Dict]] = None) -> str:
        """Generate full interview instructions with skills"""
        instructions = cls.BASE_INSTRUCTIONS
        
        if skills and len(skills) > 0:
            skills_text = '\n'.join([
                f"• {skill.get('name', '')}: {skill.get('reason', 'Required')}"
                for skill in skills
            ])
            
            instructions += f"""

REQUIRED SKILLS TO EVALUATE:
{skills_text}

SKILL ASSESSMENT STRATEGY:
- For each required skill, ask 2-3 targeted technical questions
- Probe for depth of understanding, not just familiarity
- Ask for real-world examples of using these skills
- Assess both theoretical knowledge and practical experience"""
        
        return instructions

    @classmethod
    def validate_response(cls, response: str) -> ValidationResult:
        """Validate AI response against guardrails"""
        violations = []
        severity = 'none'

        # Check for non-English content
        lower_response = response.lower()
        for language, indicators in cls.NON_ENGLISH_INDICATORS.items():
            for indicator in indicators:
                if re.search(rf'\b{re.escape(indicator)}\b', lower_response):
                    violations.append(
                        f"Possible non-English ({language}) content detected: '{indicator}'"
                    )
                    severity = 'critical'

        # Check for multiple questions
        question_count = response.count('?')
        if question_count > 1:
            violations.append(
                f"Multiple questions detected ({question_count}). Should ask one question at a time."
            )
            severity = 'warning'

        # Check for casual language
        for casual_phrase in cls.CASUAL_PHRASES:
            if re.search(casual_phrase, lower_response, re.IGNORECASE):
                violations.append(
                    f"Casual language detected: '{casual_phrase}'. Use professional tone."
                )
                severity = 'warning'

        # Check for personal questions
        for keyword in cls.PERSONAL_KEYWORDS:
            if keyword in lower_response:
                violations.append(
                    f"Potential personal question detected: '{keyword}'. Focus on job-related topics."
                )
                severity = 'critical'

        # Check for interruptions
        if any(phrase in response for phrase in ['let me finish', 'wait a moment', 'hold on']):
            violations.append("Response suggests interrupting behavior")
            severity = 'warning'

        return ValidationResult(
            is_valid=len(violations) == 0,
            violations=violations,
            severity=severity
        )

    @classmethod
    def validate_instructions(cls, instructions: str) -> Tuple[bool, List[str]]:
        """Validate that instructions contain all required guardrails"""
        issues = []
        
        required_phrases = [
            'SPEAK ONLY ENGLISH',
            'PROFESSIONAL TONE',
            'ONE QUESTION',
            'TECHNICAL FOCUS',
            'NO PERSONAL',
            'OPEN-ENDED'
        ]
        
        for phrase in required_phrases:
            if phrase not in instructions:
                issues.append(f"Missing required guardrail: '{phrase}'")
        
        return len(issues) == 0, issues

    @classmethod
    def format_context(cls, skills: Optional[List[Dict]] = None, position: str = 'Technical Position') -> Dict:
        """Format interview context for AI"""
        return {
            'role': 'technical_interviewer',
            'interview_type': 'structured_technical',
            'position': position,
            'required_skills': skills or [],
            'assessment_criteria': [
                'Technical knowledge and depth',
                'Practical experience',
                'Problem-solving ability',
                'Communication skills',
                'Job fit and relevant expertise'
            ],
            'interview_duration_minutes': 45,
            'question_count': 5,
            'language': 'English (only)',
            'professional_standards': 'ISO 9001, EEOC compliant'
        }


# Export function for quick access
def validate_ai_response(response: str) -> ValidationResult:
    """Validate AI response against all guardrails"""
    return InterviewerGuardrails.validate_response(response)


def generate_interview_instructions(skills: Optional[List[Dict]] = None) -> str:
    """Generate interview instructions with guardrails"""
    return InterviewerGuardrails.generate_instructions(skills)


def validate_instructions_format(instructions: str) -> Tuple[bool, List[str]]:
    """Validate that instructions contain required guardrails"""
    return InterviewerGuardrails.validate_instructions(instructions)
