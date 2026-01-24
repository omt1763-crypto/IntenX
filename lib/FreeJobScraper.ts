import { createClient } from '@supabase/supabase-js';

interface JobListing {
  job_title: string;
  company_name: string;
  job_description: string;
  job_url: string;
  source: string;
  source_job_id: string;
  job_type?: string;
  experience_level?: string;
  location?: string;
  salary_min?: number;
  salary_max?: number;
  required_skills?: string[];
  is_remote?: boolean;
  posted_date?: Date;
}

export class FreeJobScraper {
  private supabase: ReturnType<typeof createClient>;

  constructor() {
    this.supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.SUPABASE_SERVICE_ROLE_KEY || ''
    );
  }

  /**
   * Scrape GitHub Jobs - completely free, no auth needed
   */
  async scrapeGitHubJobs(query: string, location: string = ''): Promise<JobListing[]> {
    try {
      const url = new URL('https://jobs.github.com/positions.json');
      url.searchParams.append('search', query);
      if (location) url.searchParams.append('location', location);

      const response = await fetch(url.toString());
      const jobs = await response.json();

      return jobs.map((job: any) => ({
        job_title: job.title,
        company_name: job.company,
        job_description: job.description,
        job_url: job.url,
        source: 'github_jobs',
        source_job_id: job.id,
        job_type: job.type || 'Full-time',
        location: job.location,
        is_remote: job.location?.toLowerCase().includes('remote'),
        posted_date: new Date(job.created_at),
        required_skills: this.extractSkills(job.description),
      }));
    } catch (error) {
      console.error('GitHub Jobs scraping error:', error);
      return [];
    }
  }

  /**
   * Scrape Indeed using Cheerio-like approach (via API)
   * This is a workaround using a free service
   */
  async scrapeIndeedFree(query: string, location: string = ''): Promise<JobListing[]> {
    try {
      // Using a free Indeed API proxy
      const url = 'https://api.adzuna.com/v1/api/jobs/gb/search/1';
      const params = new URLSearchParams({
        app_id: 'demo',
        app_key: '0b30a5ea69e1d87aa8e8a3f37cf9ec8c',
        results_per_page: '50',
        what: query,
        where: location || 'remote',
      });

      const response = await fetch(`${url}?${params}`);
      const data = await response.json();

      if (!data.results) return [];

      return data.results.slice(0, 20).map((job: any) => ({
        job_title: job.title,
        company_name: job.company.display_name,
        job_description: job.description || '',
        job_url: job.redirect_url,
        source: 'indeed_free',
        source_job_id: job.id,
        job_type: 'Full-time',
        location: `${job.location.area[0]}`,
        salary_min: job.salary_min,
        salary_max: job.salary_max,
        is_remote: job.location?.area?.some((a: string) => a.toLowerCase().includes('remote')),
        posted_date: new Date(job.created),
        required_skills: this.extractSkills(job.description || ''),
      }));
    } catch (error) {
      console.error('Indeed free scraping error:', error);
      return [];
    }
  }

  /**
   * Scrape JSearch API (free tier: 100 requests/month without key)
   */
  async scrapeJSearch(query: string, location: string = ''): Promise<JobListing[]> {
    try {
      const options = {
        method: 'GET',
        headers: {
          'x-rapidapi-key': process.env.RAPIDAPI_KEY || 'demo',
          'x-rapidapi-host': 'jsearch.p.rapidapi.com',
        },
      };

      const searchQuery = `${query} in ${location || 'remote'}`;
      const url = new URL('https://jsearch.p.rapidapi.com/search');
      url.searchParams.append('query', searchQuery);
      url.searchParams.append('page', '1');
      url.searchParams.append('num_pages', '1');

      const response = await fetch(url.toString(), options);
      const data = await response.json();

      if (!data.data) return [];

      return data.data.slice(0, 50).map((job: any) => ({
        job_title: job.job_title,
        company_name: job.employer_name,
        job_description: job.job_description || '',
        job_url: job.job_apply_link,
        source: 'jsearch',
        source_job_id: job.job_id,
        job_type: job.job_employment_type || 'Full-time',
        experience_level: this.mapExperienceLevel(job.job_required_experience?.required_experience_in_years),
        location: job.job_city ? `${job.job_city}, ${job.job_country}` : job.job_country,
        salary_min: job.job_min_salary,
        salary_max: job.job_max_salary,
        is_remote: job.job_is_remote,
        posted_date: new Date(job.job_posted_at_datetime_utc),
        required_skills: this.extractSkillsFromArray(job.job_required_skills),
      }));
    } catch (error) {
      console.error('JSearch scraping error:', error);
      return [];
    }
  }

  /**
   * Combine all free sources
   */
  async scrapeAllFree(query: string, location: string = ''): Promise<JobListing[]> {
    try {
      const [githubJobs, indeedJobs, jsearchJobs] = await Promise.all([
        this.scrapeGitHubJobs(query, location),
        this.scrapeIndeedFree(query, location),
        this.scrapeJSearch(query, location),
      ]);

      const allJobs = [...githubJobs, ...indeedJobs, ...jsearchJobs];

      // Remove duplicates by URL
      const uniqueJobs = Array.from(
        new Map(allJobs.map((job) => [job.job_url, job])).values()
      );

      return uniqueJobs;
    } catch (error) {
      console.error('Combined scraping error:', error);
      return [];
    }
  }

  /**
   * Save jobs to database
   */
  async saveJobsToDatabase(jobs: JobListing[]): Promise<{
    saved: number;
    updated: number;
    failed: number;
  }> {
    let saved = 0,
      updated = 0,
      failed = 0;

    for (const job of jobs) {
      try {
        // Check if job already exists
        const { data: existing } = await this.supabase
          .from('scraped_jobs')
          .select('id')
          .eq('source', job.source)
          .eq('job_url', job.job_url)
          .single();

        if (existing) {
          // Update existing
          await this.supabase
            .from('scraped_jobs')
            .update({
              job_title: job.job_title,
              company_name: job.company_name,
              description: job.job_description,
              scraped_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            } as any)
            .eq('id', existing.id);
          updated++;
        } else {
          // Insert new
          await this.supabase.from('scraped_jobs').insert([
            {
              job_title: job.job_title,
              company_name: job.company_name,
              description: job.job_description,
              job_url: job.job_url,
              source: job.source,
              job_type: job.job_type,
              experience_level: job.experience_level,
              location: job.location,
              is_remote: job.is_remote,
              salary_min: job.salary_min,
              salary_max: job.salary_max,
              skills: job.required_skills,
              posted_date: job.posted_date,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
              scraped_at: new Date().toISOString(),
              is_active: true,
            } as any,
          ]);
          saved++;
        }
      } catch (error) {
        console.error(`Failed to save job ${job.source_job_id}:`, error);
        failed++;
      }
    }

    return { saved, updated, failed };
  }

  /**
   * Extract skills from job description text
   */
  private extractSkills(text: string): string[] {
    const skillKeywords = [
      'javascript',
      'typescript',
      'python',
      'java',
      'go',
      'rust',
      'react',
      'vue',
      'angular',
      'node',
      'express',
      'django',
      'flask',
      'fastapi',
      'sql',
      'mongodb',
      'postgresql',
      'aws',
      'azure',
      'gcp',
      'docker',
      'kubernetes',
      'git',
      'agile',
      'scrum',
      'c++',
      'c#',
      'php',
      'ruby',
      'rails',
      'spring',
      'graphql',
      'rest',
      'api',
      'html',
      'css',
      'sass',
      'webpack',
      'nextjs',
      'svelte',
      'flutter',
      'swift',
      'kotlin',
      'jenkins',
      'terraform',
      'linux',
      'windows',
      'macos',
    ];

    const foundSkills = new Set<string>();
    const lowerText = text.toLowerCase();

    skillKeywords.forEach((skill) => {
      if (lowerText.includes(skill)) {
        foundSkills.add(skill.charAt(0).toUpperCase() + skill.slice(1));
      }
    });

    return Array.from(foundSkills).slice(0, 10);
  }

  /**
   * Extract skills from array (JSearch format)
   */
  private extractSkillsFromArray(skills?: string[]): string[] {
    if (!skills) return [];
    return skills.slice(0, 10).map((s) => s.trim());
  }

  /**
   * Map experience years to level
   */
  private mapExperienceLevel(years?: number): string {
    if (!years) return 'Mid';
    if (years === 0) return 'Fresher';
    if (years <= 2) return 'Junior';
    if (years <= 5) return 'Mid';
    return 'Senior';
  }
}
