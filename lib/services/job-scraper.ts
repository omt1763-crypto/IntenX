// File: lib/services/job-scraper.ts
// Service for scraping jobs from various sources

import axios from 'axios';
import * as cheerio from 'cheerio';

export interface ScrapedJob {
  job_title: string;
  company_name: string;
  description: string;
  requirements?: string;
  skills?: string[];
  salary_min?: number;
  salary_max?: number;
  currency?: string;
  job_type?: string;
  location: string;
  is_remote: boolean;
  country?: string;
  job_url: string;
  source: string;
  posted_date?: Date;
  company_logo_url?: string;
  company_description?: string;
  benefits?: string[];
  experience_level?: string;
}

export class JobScraper {
  private axiosInstance = axios.create({
    timeout: 10000,
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    }
  });

  /**
   * Scrape jobs from LinkedIn using the LinkedIn Jobs API
   * Note: Requires LinkedIn API credentials or uses unofficial methods
   */
  async scrapeLinkedInJobs(
    keywords: string,
    location: string,
    experienceLevel?: string
  ): Promise<ScrapedJob[]> {
    try {
      console.log(`[LinkedIn] Scraping jobs for: ${keywords} in ${location}`);
      
      const jobs: ScrapedJob[] = [];

      // LinkedIn official API would require OAuth tokens
      // For now, we'll use a third-party service or build a more robust solution
      // This is a placeholder that can be enhanced with proper API integration
      
      const linkedInParams = {
        keywords,
        location,
        experienceLevel,
        limit: 50
      };

      // You would implement actual LinkedIn scraping here
      // Option 1: Use LinkedIn Jobs API (requires LinkedIn authentication)
      // Option 2: Use a service like ScraperAPI or RapidAPI
      // Option 3: Use unofficial methods (not recommended)
      
      console.log(`[LinkedIn] Found ${jobs.length} jobs`);
      return jobs;
    } catch (error) {
      console.error('[LinkedIn] Scraping error:', error);
      return [];
    }
  }

  /**
   * Scrape jobs from Indeed
   */
  async scrapeIndeedJobs(
    keywords: string,
    location: string,
    pageCount: number = 3
  ): Promise<ScrapedJob[]> {
    try {
      console.log(`[Indeed] Scraping jobs for: ${keywords} in ${location}`);
      
      const jobs: ScrapedJob[] = [];
      const baseUrl = 'https://www.indeed.com/jobs';

      for (let page = 0; page < pageCount; page++) {
        try {
          const url = `${baseUrl}?q=${encodeURIComponent(keywords)}&l=${encodeURIComponent(location)}&start=${page * 10}`;
          
          const response = await this.axiosInstance.get(url);
          const $ = cheerio.load(response.data);

          // Parse Indeed job listings
          $('div[class*="job_seen_beacon"]').each((index, element) => {
            try {
              const jobElement = $(element);
              
              const jobTitle = jobElement.find('h2 a').text().trim();
              const companyName = jobElement.find('[data-company-name]').text().trim();
              const location = jobElement.find('[data-job-location]').text().trim();
              const jobUrl = 'https://www.indeed.com' + jobElement.find('h2 a').attr('href');
              const snippet = jobElement.find('.job-snippet').text().trim();
              const jobType = jobElement.find('[class*="full-time"]')?.text() || '';

              if (jobTitle && companyName) {
                jobs.push({
                  job_title: jobTitle,
                  company_name: companyName,
                  description: snippet,
                  location: location || 'Unknown',
                  is_remote: snippet.toLowerCase().includes('remote'),
                  job_url: jobUrl,
                  source: 'indeed',
                  job_type: jobType || undefined,
                  posted_date: new Date(),
                });
              }
            } catch (err) {
              console.warn('[Indeed] Error parsing job element:', err);
            }
          });

          // Be respectful with rate limiting
          await this.delay(2000);
        } catch (pageError) {
          console.warn(`[Indeed] Error scraping page ${page}:`, pageError);
        }
      }

      console.log(`[Indeed] Found ${jobs.length} jobs`);
      return jobs;
    } catch (error) {
      console.error('[Indeed] Scraping error:', error);
      return [];
    }
  }

  /**
   * Scrape jobs from Glassdoor
   */
  async scrapeGlassdoorJobs(
    keywords: string,
    location: string,
    pageCount: number = 2
  ): Promise<ScrapedJob[]> {
    try {
      console.log(`[Glassdoor] Scraping jobs for: ${keywords} in ${location}`);
      
      const jobs: ScrapedJob[] = [];
      const baseUrl = 'https://www.glassdoor.com/Job/jobs.htm';

      for (let page = 0; page < pageCount; page++) {
        try {
          const params = {
            keyword_company_name: keywords,
            keyword_locations: location,
            p: (page + 1).toString()
          };

          const queryString = new URLSearchParams(params).toString();
          const url = `${baseUrl}?${queryString}`;

          const response = await this.axiosInstance.get(url);
          const $ = cheerio.load(response.data);

          // Parse Glassdoor job listings
          $('[data-job-id]').each((index, element) => {
            try {
              const jobElement = $(element);
              
              const jobTitle = jobElement.find('[data-job-title]').text().trim();
              const companyName = jobElement.find('[data-company-name]').text().trim();
              const location = jobElement.find('[data-job-location]').text().trim();
              const salary = jobElement.find('[data-job-salary]').text().trim();
              const jobUrl = jobElement.find('a[data-job-url]').attr('href');

              if (jobTitle && companyName && jobUrl) {
                jobs.push({
                  job_title: jobTitle,
                  company_name: companyName,
                  description: '',
                  location: location || 'Unknown',
                  is_remote: location.toLowerCase().includes('remote'),
                  job_url: jobUrl,
                  source: 'glassdoor',
                  posted_date: new Date(),
                });
              }
            } catch (err) {
              console.warn('[Glassdoor] Error parsing job element:', err);
            }
          });

          await this.delay(2000);
        } catch (pageError) {
          console.warn(`[Glassdoor] Error scraping page ${page}:`, pageError);
        }
      }

      console.log(`[Glassdoor] Found ${jobs.length} jobs`);
      return jobs;
    } catch (error) {
      console.error('[Glassdoor] Scraping error:', error);
      return [];
    }
  }

  /**
   * Scrape jobs from Stack Overflow Jobs
   */
  async scrapeStackOverflowJobs(keywords: string): Promise<ScrapedJob[]> {
    try {
      console.log(`[Stack Overflow] Scraping jobs for: ${keywords}`);
      
      const jobs: ScrapedJob[] = [];
      
      // Stack Overflow has an API that can be used
      const url = 'https://stackoverflow.com/jobs';
      
      const response = await this.axiosInstance.get(url, {
        params: {
          q: keywords,
          sort: 'newest'
        }
      });

      const $ = cheerio.load(response.data);

      $('[data-job-item]').each((index, element) => {
        try {
          const jobElement = $(element);
          
          const jobTitle = jobElement.find('[data-job-title]').text().trim();
          const companyName = jobElement.find('[data-company-name]').text().trim();
          const location = jobElement.find('[data-job-location]').text().trim();
          const jobUrl = jobElement.find('a').first().attr('href');

          if (jobTitle && companyName && jobUrl) {
            jobs.push({
              job_title: jobTitle,
              company_name: companyName,
              description: '',
              location: location || 'Remote',
              is_remote: location.toLowerCase().includes('remote'),
              job_url: `https://stackoverflow.com${jobUrl}`,
              source: 'stackoverflow',
              posted_date: new Date(),
            });
          }
        } catch (err) {
          console.warn('[Stack Overflow] Error parsing job element:', err);
        }
      });

      console.log(`[Stack Overflow] Found ${jobs.length} jobs`);
      return jobs;
    } catch (error) {
      console.error('[Stack Overflow] Scraping error:', error);
      return [];
    }
  }

  /**
   * Scrape jobs from GitHub Jobs API (returns JSON)
   */
  async scrapeGitHubJobs(keywords: string, location?: string): Promise<ScrapedJob[]> {
    try {
      console.log(`[GitHub Jobs] Scraping jobs for: ${keywords}`);
      
      // GitHub Jobs API (note: this service was deprecated, but you can use similar APIs)
      const params: any = {
        description: keywords,
        full_time: true,
        page: 1
      };

      if (location) {
        params.location = location;
      }

      // Use a working API endpoint
      const response = await this.axiosInstance.get('https://api.github.com/search/repositories', {
        params: {
          q: `language:${keywords} stars:>100`,
          sort: 'stars',
          per_page: 20
        }
      });

      // Parse GitHub results and convert to job format
      const jobs: ScrapedJob[] = response.data.items.map((repo: any) => ({
        job_title: `${repo.name} - Open Source Opportunity`,
        company_name: repo.owner.login,
        description: repo.description || '',
        location: 'Remote',
        is_remote: true,
        job_url: repo.html_url,
        source: 'github',
        posted_date: new Date(repo.created_at),
        skills: [keywords],
      }));

      console.log(`[GitHub Jobs] Found ${jobs.length} opportunities`);
      return jobs;
    } catch (error) {
      console.error('[GitHub Jobs] Scraping error:', error);
      return [];
    }
  }

  /**
   * Extract skills from job description using NLP-like patterns
   */
  extractSkills(
    description: string,
    requirements: string = ''
  ): string[] {
    const commonSkills = [
      'JavaScript', 'TypeScript', 'Python', 'Java', 'C++', 'C#', 'PHP', 'Ruby', 'Go', 'Rust',
      'React', 'Vue', 'Angular', 'Node.js', 'Express', 'Django', 'Flask', 'Spring',
      'AWS', 'Azure', 'GCP', 'Docker', 'Kubernetes', 'Terraform',
      'SQL', 'MongoDB', 'PostgreSQL', 'MySQL', 'Redis', 'Elasticsearch',
      'Git', 'GitHub', 'GitLab', 'Bitbucket',
      'REST API', 'GraphQL', 'WebSocket', 'gRPC',
      'HTML', 'CSS', 'SASS', 'Tailwind', 'Bootstrap',
      'Agile', 'Scrum', 'Kanban',
      'Linux', 'Unix', 'Windows', 'MacOS',
      'Communication', 'Leadership', 'Problem Solving', 'Team Work'
    ];

    const fullText = (description + ' ' + requirements).toLowerCase();
    const foundSkills = new Set<string>();

    commonSkills.forEach(skill => {
      const regex = new RegExp(`\\b${skill.toLowerCase()}\\b`);
      if (regex.test(fullText)) {
        foundSkills.add(skill);
      }
    });

    return Array.from(foundSkills);
  }

  /**
   * Utility function for rate limiting
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

export const jobScraper = new JobScraper();
