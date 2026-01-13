/**
 * API Endpoint: Log Interview Violations
 * Handles logging of deepfake and window switching violations
 * Stores violation data for review by admins and hiring managers
 */

import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

interface ViolationLog {
  interview_id: string
  applicant_id?: string
  job_id?: string
  user_id?: string
  violation_type: 'deepfake' | 'ai-voice' | 'window-switch'
  severity: 'warning' | 'critical'
  description: string
  cancellation_reason?: string
  violations_json: any[]
  report_json: any
  detected_at: string
  created_at: string
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    const {
      interviewId,
      applicantId,
      jobId,
      userId,
      cancellationReason,
      violations,
      report
    } = body

    console.log('[IntegrityAPI] 🚨 Recording interview violations')
    console.log('[IntegrityAPI] Interview ID:', interviewId)
    console.log('[IntegrityAPI] Cancellation Reason:', cancellationReason)
    console.log('[IntegrityAPI] Violations Count:', violations?.length || 0)

    // Validate required fields
    if (!interviewId) {
      return NextResponse.json(
        { error: 'Missing required field: interviewId' },
        { status: 400 }
      )
    }

    // Determine violation types from violations array
    const violationTypes = new Set<string>()
    const severityLevels = new Set<string>()

    violations?.forEach((v: any) => {
      violationTypes.add(v.type)
      severityLevels.add(v.severity)
    })

    // Use service role for database insert (bypasses RLS)
    const { data: adminData, error: adminError } = await supabase
      .from('interview_integrity_violations')
      .insert({
        interview_id: interviewId,
        applicant_id: applicantId || null,
        job_id: jobId || null,
        user_id: userId || null,
        violation_types: Array.from(violationTypes),
        severity_levels: Array.from(severityLevels),
        description: cancellationReason || 'Integrity violations detected',
        cancellation_reason: cancellationReason || null,
        violations_json: violations || [],
        report_json: report || {},
        detected_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
        status: 'recorded'
      })

    if (adminError) {
      console.error('[IntegrityAPI] ❌ Database insert error:', adminError)
      return NextResponse.json(
        { error: 'Failed to log violation: ' + adminError.message },
        { status: 500 }
      )
    }

    console.log('[IntegrityAPI] ✅ Violation logged successfully')

    // If there are critical violations, notify admins
    if (severityLevels.has('critical')) {
      try {
        await notifyAdmins({
          interviewId,
          applicantId,
          jobId,
          cancellationReason,
          violationCount: violations?.length || 0,
          timestamp: new Date().toISOString()
        })
      } catch (notifyError) {
        console.warn('[IntegrityAPI] Warning notifying admins:', notifyError)
        // Continue anyway - logging is more important than notifications
      }
    }

    return NextResponse.json({
      status: 'success',
      message: 'Interview violations recorded',
      interviewId,
      violationCount: violations?.length || 0,
      timestamp: new Date().toISOString()
    })
  } catch (error: any) {
    console.error('[IntegrityAPI] ❌ Error recording violations:', error)
    return NextResponse.json(
      { error: 'Internal server error: ' + error.message },
      { status: 500 }
    )
  }
}

/**
 * Notify admins and hiring managers of critical violations
 */
async function notifyAdmins(data: {
  interviewId: string
  applicantId?: string
  jobId?: string
  cancellationReason?: string
  violationCount: number
  timestamp: string
}): Promise<void> {
  try {
    // Try to fetch admin emails from your users/admins table
    const { data: admins } = await supabase
      .from('users')
      .select('email')
      .eq('role', 'admin')
      .limit(10)

    if (admins && admins.length > 0) {
      const adminEmails = admins.map(a => a.email).filter(Boolean)

      console.log('[IntegrityAPI] 📧 Sending violation notification to admins:', adminEmails)

      // Here you would send actual email notifications
      // For now, just log that we would send them
      console.log('[IntegrityAPI] Would send email notification:', {
        to: adminEmails,
        subject: `🚨 CRITICAL: Interview Integrity Violation Detected`,
        data: {
          interviewId: data.interviewId,
          applicantId: data.applicantId,
          jobId: data.jobId,
          reason: data.cancellationReason,
          violationCount: data.violationCount,
          timestamp: data.timestamp
        }
      })
    }
  } catch (error) {
    console.warn('[IntegrityAPI] Error in notifyAdmins:', error)
    throw error
  }
}

/**
 * GET endpoint to retrieve violation logs (admin only)
 */
export async function GET(req: NextRequest) {
  try {
    // In production, verify admin role here
    const authHeader = req.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const limit = req.nextUrl.searchParams.get('limit') || '50'
    const offset = req.nextUrl.searchParams.get('offset') || '0'
    const applicantId = req.nextUrl.searchParams.get('applicantId')

    let query = supabase
      .from('interview_integrity_violations')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(parseInt(offset), parseInt(offset) + parseInt(limit) - 1)

    if (applicantId) {
      query = query.eq('applicant_id', applicantId)
    }

    const { data: violations, count, error } = await query

    if (error) {
      console.error('[IntegrityAPI] Error fetching violations:', error)
      return NextResponse.json(
        { error: 'Failed to fetch violations' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      status: 'success',
      violations,
      total: count,
      limit: parseInt(limit),
      offset: parseInt(offset)
    })
  } catch (error: any) {
    console.error('[IntegrityAPI] Error in GET handler:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
