import { FreeJobScraper } from '@/lib/FreeJobScraper';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('query') || 'developer';
    const location = searchParams.get('location') || 'remote';

    const scraper = new FreeJobScraper();
    
    // Scrape from all free sources
    const jobs = await scraper.scrapeAllFree(query, location);
    
    // Save to database
    const result = await scraper.saveJobsToDatabase(jobs);

    return Response.json({
      success: true,
      message: `Scraped ${jobs.length} jobs from free sources`,
      stats: result,
      jobsCount: jobs.length,
    });
  } catch (error) {
    console.error('Scrape error:', error);
    return Response.json(
      { success: false, error: 'Scraping failed', details: String(error) },
      { status: 500 }
    );
  }
}
