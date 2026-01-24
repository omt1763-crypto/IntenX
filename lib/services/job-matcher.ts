// File: lib/services/job-matcher.ts
// AI-powered job matching service using OpenAI

import OpenAI from 'openai';

export interface JobMatchResult {
  job_id: number;
  job_title: string;
  company_name: string;
  location: string;
  job_url: string;
  match_percentage: number;
  apply_readiness_score: number;
  skills_matched: string[];
  skills_gap: string[];
  why_match: string;
  next_steps: string[];
  salary_range?: string;
  job_type?: string;
  is_remote?: boolean;
}

interface Job {
  id: number;
  job_title: string;
  company_name: string;
  description: string;
  requirements?: string;
  skills?: string[];
  location: string;
  is_remote: boolean;
  job_url: string;
  salary_min?: number;
  salary_max?: number;
  currency?: string;
  job_type?: string;
}

interface ResumeAnalysis {
  technicalSkills: string[];
  missingSkills: string[];
  experienceLevel: string;
  summary: string;
  strengths: string[];
  overallScore: number;
}

export class JobMatcher {
  private openai: OpenAI;

  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }

  /**
   * Match a resume with a single job
   */
  async matchResumeWithJob(
    resume: ResumeAnalysis,
    job: Job
  ): Promise<JobMatchResult> {
    try {
      const systemPrompt = `You are an expert recruiter and career advisor. Analyze how well a candidate's resume matches a job posting.

Return ONLY valid JSON - no markdown or explanations.

Consider:
1. Skill match (technical and soft skills)
2. Experience level alignment
3. Career progression fit
4. Remote work preference
5. Salary expectations (if available)

Be realistic with scoring - don't give high scores just because there are some matching skills.

Return EXACTLY this JSON (no other text):
{
  "match_percentage": <0-100>,
  "apply_readiness_score": <0-100>,
  "skills_matched": [<skills the candidate has>],
  "skills_gap": [<important skills missing>],
  "why_match": "<2-3 sentences why this is/isn't a good match>",
  "next_steps": [<specific actions to improve chances>]
}`;

      const userContent = `
Candidate Resume Summary:
- Experience Level: ${resume.experienceLevel}
- Technical Skills: ${resume.technicalSkills.join(', ')}
- Missing Skills: ${resume.missingSkills.join(', ')}
- Overall Score: ${resume.overallScore}/100
- Strengths: ${resume.strengths.join(', ')}
- Summary: ${resume.summary}

Job Posting:
- Title: ${job.job_title}
- Company: ${job.company_name}
- Location: ${job.location} ${job.is_remote ? '(Remote)' : ''}
- Job Type: ${job.job_type || 'Not specified'}
- Description: ${job.description.substring(0, 1000)}
- Requirements: ${job.requirements?.substring(0, 500) || 'Not specified'}
- Required Skills: ${job.skills?.join(', ') || 'Not specified'}

Analyze how well the candidate fits this job.`;

      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userContent },
        ],
        temperature: 0.5,
        max_tokens: 1000,
      });

      const responseContent = response.choices[0]?.message?.content;
      if (!responseContent) {
        throw new Error('No response from OpenAI');
      }

      const jsonMatch = responseContent.match(/\{[\s\S]*\}/);
      const jsonStr = jsonMatch ? jsonMatch[0] : responseContent;
      const matchData = JSON.parse(jsonStr);

      return {
        job_id: job.id,
        job_title: job.job_title,
        company_name: job.company_name,
        location: job.location,
        job_url: job.job_url,
        match_percentage: Math.min(100, Math.max(0, matchData.match_percentage)),
        apply_readiness_score: Math.min(100, Math.max(0, matchData.apply_readiness_score)),
        skills_matched: matchData.skills_matched || [],
        skills_gap: matchData.skills_gap || [],
        why_match: matchData.why_match || '',
        next_steps: matchData.next_steps || [],
        salary_range: job.salary_min && job.salary_max 
          ? `${job.currency || '$'}${job.salary_min}k - ${job.salary_max}k`
          : undefined,
        job_type: job.job_type,
        is_remote: job.is_remote,
      };
    } catch (error) {
      console.error('Job matching error:', error);
      // Return a default low match if AI fails
      return {
        job_id: job.id,
        job_title: job.job_title,
        company_name: job.company_name,
        location: job.location,
        job_url: job.job_url,
        match_percentage: 25,
        apply_readiness_score: 20,
        skills_matched: [],
        skills_gap: [],
        why_match: 'Unable to fully analyze match. Please review manually.',
        next_steps: ['Review job requirements carefully'],
      };
    }
  }

  /**
   * Match a resume with multiple jobs
   */
  async matchResumeWithJobs(
    resume: ResumeAnalysis,
    jobs: Job[],
    topN: number = 10
  ): Promise<JobMatchResult[]> {
    try {
      console.log(`[JobMatcher] Matching resume with ${jobs.length} jobs...`);
      
      // Process in batches to avoid overwhelming the API
      const batchSize = 5;
      const matches: JobMatchResult[] = [];

      for (let i = 0; i < jobs.length; i += batchSize) {
        const batch = jobs.slice(i, i + batchSize);
        const batchMatches = await Promise.all(
          batch.map(job => this.matchResumeWithJob(resume, job))
        );
        matches.push(...batchMatches);

        // Rate limiting
        if (i + batchSize < jobs.length) {
          await this.delay(1000);
        }
      }

      // Sort by match percentage and return top N
      const sortedMatches = matches
        .sort((a, b) => b.match_percentage - a.match_percentage)
        .slice(0, topN);

      console.log(`[JobMatcher] Found ${sortedMatches.length} top matches`);
      return sortedMatches;
    } catch (error) {
      console.error('Batch job matching error:', error);
      return [];
    }
  }

  /**
   * Calculate basic match score using keyword matching (fast fallback)
   */
  calculateBasicMatch(
    resume: ResumeAnalysis,
    job: Job
  ): { match_percentage: number; skills_matched: string[] } {
    const jobText = (
      `${job.job_title} ${job.company_name} ${job.description} ${job.requirements || ''}`
    ).toLowerCase();

    const resumeText = (
      `${resume.technicalSkills.join(' ')} ${resume.strengths.join(' ')}`
    ).toLowerCase();

    let matchedSkills: string[] = [];
    let matchScore = 0;

    // Check each resume skill against job
    resume.technicalSkills.forEach(skill => {
      const skillRegex = new RegExp(`\\b${skill.toLowerCase()}\\b`);
      if (skillRegex.test(jobText)) {
        matchedSkills.push(skill);
        matchScore += 10;
      }
    });

    // Check experience level match
    if (jobText.includes(resume.experienceLevel.toLowerCase())) {
      matchScore += 15;
    }

    // Cap at 100
    matchScore = Math.min(100, matchScore);

    return {
      match_percentage: matchScore,
      skills_matched: matchedSkills,
    };
  }

  /**
   * Utility function for rate limiting
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

export const jobMatcher = new JobMatcher();
