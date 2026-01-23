import { NextRequest, NextResponse } from 'next/server';
import JobScraper from '../../../lib/JobScraper';

export const maxDuration = 300; // 5 minutes for scraping

/**
 * GET /api/jobs/scrape
 * Trigger job scraping from external sources
 * Query params: source (jsearch, indeed, all), query, location
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const source = searchParams.get('source') || 'jsearch';
    const query = searchParams.get('query') || 'software developer';
    const location = searchParams.get('location') || 'Remote';
    const jobType = searchParams.get('jobType');
    const experienceLevel = searchParams.get('experienceLevel');

    console.log('[JOB-SCRAPE] Starting scrape:', { source, query, location });

    const scraper = new JobScraper();
    const results = [];

    if (source === 'jsearch' || source === 'all') {
      const result = await scraper.scrapeFromJSearch(query, {
        jobType: jobType || undefined,
        location: location || undefined,
        experienceLevel: experienceLevel || undefined,
      });
      results.push(result);
    }

    if (source === 'indeed' || source === 'all') {
      const result = await scraper.scrapeFromIndeed(query);
      results.push(result);
    }

    return NextResponse.json(
      {
        success: true,
        scrapeResults: results,
        totalSaved: results.reduce((acc, r) => acc + r.saved, 0),
        totalFailed: results.reduce((acc, r) => acc + r.failed, 0),
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('[JOB-SCRAPE] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Scraping failed',
      },
      { status: 500 }
    );
  }
}
