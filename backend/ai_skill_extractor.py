"""
AI-powered skill extraction from job descriptions
Uses OpenAI to analyze job descriptions and extract must-have skills
"""

import os
import logging
from typing import List, Dict
from openai import OpenAI
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

logger = logging.getLogger(__name__)

# Get API key
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
if not OPENAI_API_KEY:
    raise ValueError("OPENAI_API_KEY not set in .env")

# Initialize OpenAI client
client = OpenAI(api_key=OPENAI_API_KEY)


def extract_skills_from_description(job_description: str) -> Dict[str, any]:
    """
    Extract top 3 must-have skills from a job description using AI
    
    Args:
        job_description: The job description text
        
    Returns:
        Dictionary with extracted skills and enhancements
    """
    try:
        logger.info("🔄 Extracting skills from job description...")
        
        prompt = f"""Analyze the following job description and extract the top 3 MUST-HAVE skills.

Job Description:
{job_description}

Please respond in JSON format with this exact structure:
{{
  "skills": [
    {{
      "name": "Skill Name",
      "importance": "critical/high/medium",
      "reason": "Brief explanation why this skill is important for this role"
    }},
    {{
      "name": "Skill Name",
      "importance": "critical/high/medium",
      "reason": "Brief explanation why this skill is important for this role"
    }},
    {{
      "name": "Skill Name",
      "importance": "critical/high/medium",
      "reason": "Brief explanation why this skill is important for this role"
    }}
  ],
  "summary": "2-3 sentence summary of key requirements"
}}

Make sure the response is valid JSON only, no additional text."""

        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {
                    "role": "system",
                    "content": "You are an expert HR recruiter and skills analyst. Extract the most critical skills from job descriptions."
                },
                {
                    "role": "user",
                    "content": prompt
                }
            ],
            temperature=0.7,
            max_tokens=1000
        )
        
        # Parse response
        import json
        response_text = response.choices[0].message.content.strip()
        
        # Try to extract JSON if response contains additional text
        if "```json" in response_text:
            response_text = response_text.split("```json")[1].split("```")[0]
        elif "```" in response_text:
            response_text = response_text.split("```")[1].split("```")[0]
        
        skills_data = json.loads(response_text)
        
        logger.info(f"✅ Successfully extracted {len(skills_data['skills'])} skills")
        
        return {
            "success": True,
            "skills": skills_data.get("skills", []),
            "summary": skills_data.get("summary", "")
        }
        
    except Exception as e:
        logger.error(f"❌ Error extracting skills: {e}")
        return {
            "success": False,
            "error": str(e),
            "skills": []
        }


def enhance_skill_description(skill_name: str, context: str) -> str:
    """
    Enhance a skill description with AI-generated insights
    
    Args:
        skill_name: The skill to enhance
        context: Additional context about the role
        
    Returns:
        Enhanced description
    """
    try:
        logger.info(f"🔄 Enhancing description for skill: {skill_name}")
        
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {
                    "role": "system",
                    "content": "You are a skills and career development expert. Provide concise, actionable insights about technical skills."
                },
                {
                    "role": "user",
                    "content": f"Provide a 1-2 sentence enhancement for the '{skill_name}' skill in the context of: {context}"
                }
            ],
            temperature=0.7,
            max_tokens=300
        )
        
        enhancement = response.choices[0].message.content.strip()
        logger.info(f"✅ Enhanced description for {skill_name}")
        
        return enhancement
        
    except Exception as e:
        logger.error(f"❌ Error enhancing skill description: {e}")
        return f"Expertise in {skill_name} is essential for this role."


if __name__ == "__main__":
    # Test
    sample_description = """
    We are looking for a Senior Data Scientist with 5+ years of experience.
    Must have strong Python and R skills. Experience with machine learning
    and deep learning frameworks required. Knowledge of cloud platforms
    (AWS, GCP, Azure) is a plus. Strong SQL and data manipulation skills needed.
    """
    
    result = extract_skills_from_description(sample_description)
    print(result)
