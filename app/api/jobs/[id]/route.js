import { supabase } from '@/lib/supabase'

export async function GET(request, { params }) {
  try {
    const jobId = params.id

    if (!jobId) {
      return Response.json({ error: 'Job ID is required' }, { status: 400 })
    }

    console.log('[Jobs API] Fetching job:', jobId)

    // Fetch job from database
    const { data: job, error } = await supabase
      .from('jobs')
      .select('*')
      .eq('id', jobId)
      .single()

    if (error) {
      console.error('[Jobs API] Error fetching job:', error)
      return Response.json({ error: error.message }, { status: 400 })
    }

    if (!job) {
      console.warn('[Jobs API] Job not found:', jobId)
      return Response.json({ error: 'Job not found' }, { status: 404 })
    }

    console.log('[Jobs API] Job found:', job.title)

    // Parse skills if they're stored as JSON string
    let skills = job.skills || []
    if (typeof skills === 'string') {
      try {
        skills = JSON.parse(skills)
      } catch (e) {
        skills = [skills]
      }
    }

    // Return job data
    return Response.json({
      id: job.id,
      title: job.title,
      company: job.company_name || 'Unknown',
      position: job.title,
      description: job.description,
      skills: Array.isArray(skills) ? skills : [],
      requirements: job.requirements,
      created_at: job.created_at
    })
  } catch (error) {
    console.error('[Jobs API] Unexpected error:', error)
    return Response.json(
      { error: 'Failed to fetch job' },
      { status: 500 }
    )
  }
}
