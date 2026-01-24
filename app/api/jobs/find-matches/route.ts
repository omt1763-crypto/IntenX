// File: app/api/jobs/find-matches/route.ts
// API endpoint to find job matches for a resume

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { jobScraper } from '@/lib/services/job-scraper';
import { jobMatcher } from '@/lib/services/job-matcher';

export const maxDuration = 60; // 60 seconds for Vercel

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('FATAL: Missing Supabase credentials');
}

const supabase = createClient(supabaseUrl || '', supabaseKey || '');

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      resumeAnalysis,     // The parsed resume analysis
      jobKeywords,        // Skills/job titles to search for
      location = '',      // Location preference
      salaryMin,
      salaryMax,
      jobType,            // full-time, part-time, contract, etc.
      topN = 10,          // Return top N matches
      useCache = true     // Use cached jobs if available
    } = body;

    if (!resumeAnalysis) {
      return NextResponse.json(
        { error: 'resumeAnalysis is required' },
        { status: 400 }
      );
    }

    console.log('[Find Matches] Starting job search...', {
      jobKeywords,
      location,
      topN,
    });

    let jobs = [];

    // Step 1: Check if we have cached jobs that match the criteria
    if (useCache) {
      console.log('[Find Matches] Checking cache for existing jobs...');
      
      try {
        const { data: cachedJobs, error } = await supabase
          .from('scraped_jobs')
          .select('*')
          .eq('is_active', true)
          .gte('expiration_date', new Date().toISOString())
          .order('posted_date', { ascending: false })
          .limit(50);

        if (!error && cachedJobs && cachedJobs.length > 0) {
          console.log(`[Find Matches] Found ${cachedJobs.length} cached active jobs`);
          jobs = cachedJobs;
        }
      } catch (cacheError) {
        console.warn('[Find Matches] Cache check failed, will scrape fresh data', cacheError);
      }
    }

    // Step 2: If not enough cached jobs, scrape new jobs
    if (jobs.length < topN * 2) {
      console.log('[Find Matches] Scraping fresh jobs...');
      
      const searchKeywords = jobKeywords || resumeAnalysis.technicalSkills?.slice(0, 3)?.join(' ') || 'developer';

      try {
        // Scrape from multiple sources
        const [indeedJobs, glassdoorJobs, stackOverflowJobs] = await Promise.all([
          jobScraper.scrapeIndeedJobs(searchKeywords, location, 1).catch(() => []),
          jobScraper.scrapeGlassdoorJobs(searchKeywords, location, 1).catch(() => []),
          jobScraper.scrapeStackOverflowJobs(searchKeywords).catch(() => []),
        ]);

        const scrapedJobs = [...indeedJobs, ...glassdoorJobs, ...stackOverflowJobs];
        
        console.log(`[Find Matches] Scraped ${scrapedJobs.length} fresh jobs`);

        // Save scraped jobs to database
        if (scrapedJobs.length > 0) {
          try {
            const jobsToInsert = scrapedJobs.map(job => ({
              job_title: job.job_title,
              company_name: job.company_name,
              description: job.description,
              requirements: job.requirements,
              skills: job.skills ? JSON.stringify(job.skills) : null,
              location: job.location,
              is_remote: job.is_remote,
              job_url: job.job_url,
              source: job.source,
              posted_date: job.posted_date,
              job_type: job.job_type,
              is_active: true,
              expiration_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
            }));

            const { error: insertError } = await supabase
              .from('scraped_jobs')
              .insert(jobsToInsert)
              .select();

            if (!insertError) {
              console.log('[Find Matches] Saved new jobs to database');
              jobs.push(...scrapedJobs);
            }
          } catch (insertError) {
            console.warn('[Find Matches] Failed to save jobs to database', insertError);
            jobs.push(...scrapedJobs);
          }
        }
      } catch (scrapingError) {
        console.error('[Find Matches] Scraping error:', scrapingError);
        
        // Fallback: return cached jobs even if old
        if (jobs.length === 0) {
          try {
            const { data: fallbackJobs } = await supabase
              .from('scraped_jobs')
              .select('*')
              .eq('is_active', true)
              .order('posted_date', { ascending: false })
              .limit(30);
            
            if (fallbackJobs) {
              jobs = fallbackJobs;
            }
          } catch (fallbackError) {
            console.warn('[Find Matches] Fallback query failed', fallbackError);
          }
        }
      }
    }

    if (jobs.length === 0) {
      return NextResponse.json(
        {
          success: true,
          matchedJobs: [],
          message: 'No jobs found. Please try different keywords or check back later.',
        },
        { status: 200 }
      );
    }

    console.log(`[Find Matches] Matching against ${jobs.length} jobs...`);

    // Step 3: Match resume with jobs
    const jobMatches = await jobMatcher.matchResumeWithJobs(
      {
        technicalSkills: resumeAnalysis.technicalSkills || [],
        missingSkills: resumeAnalysis.missingSkills || [],
        experienceLevel: resumeAnalysis.experienceLevel || 'Mid',
        summary: resumeAnalysis.summary || '',
        strengths: resumeAnalysis.strengths || [],
        overallScore: resumeAnalysis.overallScore || 50,
      },
      jobs.map(job => ({
        id: job.id,
        job_title: job.job_title,
        company_name: job.company_name,
        description: job.description,
        requirements: job.requirements,
        skills: Array.isArray(job.skills) ? job.skills : 
               typeof job.skills === 'string' ? JSON.parse(job.skills) : [],
        location: job.location,
        is_remote: job.is_remote,
        job_url: job.job_url,
        salary_min: job.salary_min,
        salary_max: job.salary_max,
        currency: job.currency,
        job_type: job.job_type,
      })),
      topN
    );

    // Step 4: Save matches to database
    try {
      const matchesToInsert = jobMatches.map(match => ({
        resume_id: resumeAnalysis.resumeId || 'anonymous',
        job_id: match.job_id,
        match_score: match.match_percentage,
        skills_matched: JSON.stringify(match.skills_matched),
        skills_gap: JSON.stringify(match.skills_gap),
        why_match: match.why_match,
        apply_readiness_score: match.apply_readiness_score,
        next_steps: JSON.stringify(match.next_steps),
      }));

      await supabase
        .from('resume_job_matches')
        .insert(matchesToInsert)
        .select();

      console.log('[Find Matches] Saved matches to database');
    } catch (saveError) {
      console.warn('[Find Matches] Failed to save matches to database', saveError);
    }

    console.log(`[Find Matches] Success! Found ${jobMatches.length} matching jobs`);

    return NextResponse.json(
      {
        success: true,
        matchedJobs: jobMatches,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('[Find Matches] Error:', error);

    return NextResponse.json(
      {
        success: false,
        error: error?.message || 'Failed to find job matches',
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    // Get top matching jobs
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '20');
    const source = searchParams.get('source');

    let query = supabase
      .from('scraped_jobs')
      .select('*')
      .eq('is_active', true)
      .order('posted_date', { ascending: false })
      .limit(limit);

    if (source) {
      query = query.eq('source', source);
    }

    const { data: jobs, error } = await query;

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        jobs: jobs || [],
        count: jobs?.length || 0,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('[Get Jobs] Error:', error);

    return NextResponse.json(
      {
        success: false,
        error: error?.message || 'Failed to retrieve jobs',
      },
      { status: 500 }
    );
  }
}
