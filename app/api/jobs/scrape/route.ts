import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { jobScraper } from '@/lib/services/job-scraper';
import { FreeJobScraper } from '@/lib/FreeJobScraper';

export const maxDuration = 300; // 5 minutes

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('FATAL: Missing Supabase credentials');
}

const supabase = createClient(supabaseUrl || '', supabaseKey || '');

// List of popular job search keywords
const POPULAR_KEYWORDS = [
  'Software Engineer',
  'Full Stack Developer',
  'Frontend Developer',
  'Backend Developer',
  'Python Developer',
  'JavaScript Developer',
  'React Developer',
  'DevOps Engineer',
  'Data Scientist',
  'Machine Learning Engineer',
  'Product Manager',
  'UX Designer',
];

// Popular locations
const POPULAR_LOCATIONS = [
  'Remote',
  'United States',
  'San Francisco, CA',
  'New York, NY',
  'London, UK',
];

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      keywords,
      locations = POPULAR_LOCATIONS,
      sources = ['indeed', 'glassdoor', 'stackoverflow'],
      forceRefresh = false
    } = body;

    const apiKey = request.headers.get('x-api-key');
    
    if (apiKey && apiKey !== process.env.JOB_SCRAPER_API_KEY) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const searchKeywords = Array.isArray(keywords) ? keywords : 
                          keywords ? [keywords] : POPULAR_KEYWORDS;
    const searchLocations = Array.isArray(locations) ? locations : [locations];

    console.log('[Scraper] Starting job scraping session', {
      keywords: searchKeywords,
      locations: searchLocations,
      sources,
    });

    // Create scraping session
    const { data: sessionData, error: sessionError } = await supabase
      .from('job_scraping_sessions')
      .insert({
        source: sources.join(','),
        status: 'in_progress',
      })
      .select();

    const sessionId = sessionData?.[0]?.id || null;

    let totalJobsFound = 0;
    let totalJobsAdded = 0;
    const errors: string[] = [];

    // Scrape from each source
    for (const source of sources) {
      try {
        console.log(`[Scraper] Scraping from ${source}...`);
        let sourceJobs: any[] = [];

        if (source === 'indeed') {
          for (const keyword of searchKeywords.slice(0, 2)) {
            for (const location of searchLocations.slice(0, 1)) {
              try {
                const jobs = await jobScraper.scrapeIndeedJobs(keyword, location, 1);
                sourceJobs.push(...jobs);
              } catch (err) {
                console.warn(`Failed to scrape Indeed for ${keyword}`, err);
              }
            }
          }
        } else if (source === 'glassdoor') {
          for (const keyword of searchKeywords.slice(0, 2)) {
            try {
              const jobs = await jobScraper.scrapeGlassdoorJobs(keyword, 'Remote', 1);
              sourceJobs.push(...jobs);
            } catch (err) {
              console.warn(`Failed to scrape Glassdoor for ${keyword}`, err);
            }
          }
        } else if (source === 'stackoverflow') {
          for (const keyword of searchKeywords.slice(0, 2)) {
            try {
              const jobs = await jobScraper.scrapeStackOverflowJobs(keyword);
              sourceJobs.push(...jobs);
            } catch (err) {
              console.warn(`Failed to scrape Stack Overflow`, err);
            }
          }
        }

        totalJobsFound += sourceJobs.length;

        // Process and save jobs
        if (sourceJobs.length > 0) {
          const jobsToInsert = sourceJobs.map(job => ({
            job_title: job.job_title,
            company_name: job.company_name,
            description: job.description || '',
            requirements: job.requirements,
            skills: job.skills ? JSON.stringify(job.skills) : null,
            location: job.location,
            is_remote: job.is_remote,
            job_url: job.job_url,
            source: job.source,
            posted_date: job.posted_date || new Date(),
            job_type: job.job_type,
            is_active: true,
            expiration_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          }));

          try {
            const { error: insertError, data: insertedData } = await supabase
              .from('scraped_jobs')
              .insert(jobsToInsert)
              .select();

            if (!insertError) {
              totalJobsAdded += insertedData?.length || 0;
            } else {
              errors.push(`${source}: ${insertError.message}`);
            }
          } catch (insertErr) {
            errors.push(`${source}: Insert failed`);
          }
        }
      } catch (sourceError: any) {
        errors.push(`${source}: ${sourceError?.message}`);
      }
    }

    // Update session
    if (sessionId) {
      try {
        await supabase
          .from('job_scraping_sessions')
          .update({
            completed_at: new Date(),
            total_jobs_found: totalJobsFound,
            jobs_added: totalJobsAdded,
            errors: errors.length > 0 ? JSON.stringify(errors) : null,
            status: 'completed',
          })
          .eq('id', sessionId);
      } catch (updateErr) {
        console.warn('[Scraper] Failed to update session:', updateErr);
      }
    }

    return NextResponse.json(
      {
        success: true,
        sessionId,
        summary: {
          totalJobsFound,
          totalJobsAdded,
          errors: errors.length > 0 ? errors : undefined,
        },
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('[Scraper POST] Fatal error:', error);

    return NextResponse.json(
      {
        success: false,
        error: error?.message || 'Scraping failed',
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('query') || 'developer';
    const location = searchParams.get('location') || 'remote';
    const sessionId = searchParams.get('sessionId');

    // If sessionId provided, get that session status
    if (sessionId) {
      const { data: session, error } = await supabase
        .from('job_scraping_sessions')
        .select('*')
        .eq('id', sessionId)
        .single();

      if (error) {
        return NextResponse.json(
          { error: 'Session not found' },
          { status: 404 }
        );
      }

      return NextResponse.json({ success: true, session }, { status: 200 });
    }

    // Otherwise use legacy method
    const scraper = new FreeJobScraper();
    const jobs = await scraper.scrapeAllFree(query, location);
    const result = await scraper.saveJobsToDatabase(jobs);

    return NextResponse.json({
      success: true,
      message: `Scraped ${jobs.length} jobs from free sources`,
      stats: result,
      jobsCount: jobs.length,
    });
  } catch (error) {
    console.error('Scrape error:', error);
    return NextResponse.json(
      { success: false, error: 'Scraping failed', details: String(error) },
      { status: 500 }
    );
  }
}
