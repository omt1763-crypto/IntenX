import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export const dynamic = 'force-dynamic'
export const revalidate = 0

// Log suspicious activity
export async function POST(req) {
  try {
    const { userId, activityType, severity, description, ipAddress, metadata } = await req.json()

    const timestamp = new Date().toISOString()
    
    console.log(`[Activity Log] ${severity.toUpperCase()} - ${activityType}:`, description)

    // Insert activity log
    const { data, error } = await supabaseAdmin
      .from('activity_logs')
      .insert([
        {
          user_id: userId || null,
          activity_type: activityType,
          severity: severity || 'low', // low, medium, high, critical
          description,
          ip_address: ipAddress,
          metadata: metadata || {},
          created_at: timestamp,
          reviewed: false
        }
      ])
      .select()

    if (error) {
      console.error('[Activity Log] Insert error:', error)
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      data
    })
  } catch (error) {
    console.error('[Activity Log] Error:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}

// Get all activity logs + login logs
export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url)
    const severity = searchParams.get('severity')
    const limit = parseInt(searchParams.get('limit') || '100')
    const offset = parseInt(searchParams.get('offset') || '0')

    console.log('[Activity Log] Fetching logs with:', { severity, limit, offset })

    // Fetch activity logs
    let activityLogs = []
    let query = supabaseAdmin
      .from('activity_logs')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })

    if (severity && severity !== 'all') {
      query = query.eq('severity', severity)
    }

    const { data: activityData, error: activityError, count: activityCount } = await query
      .range(offset, offset + limit - 1)

    if (activityError) {
      console.log('[Activity Log] Activity logs not available:', activityError.code)
    } else {
      activityLogs = activityData || []
    }

    // Fetch login logs
    let loginLogs = []
    const { data: loginData, error: loginError } = await supabaseAdmin
      .from('login_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100)

    if (loginError) {
      console.log('[Activity Log] Login logs not available:', loginError.code)
    } else {
      loginLogs = loginData || []
    }

    // Combine logs
    let combinedLogs = []

    // Add activity logs
    activityLogs.forEach(log => {
      combinedLogs.push({
        id: log.id,
        type: 'activity',
        activity_type: log.activity_type || 'unknown',
        description: log.description || '',
        severity: log.severity || 'low',
        user_id: log.user_id,
        ip_address: log.ip_address,
        created_at: log.created_at,
        reviewed: log.reviewed || false
      })
    })

    // Add login logs
    loginLogs.forEach(log => {
      const location = [log.city, log.country].filter(Boolean).join(', ') || 'Unknown'
      combinedLogs.push({
        id: log.id,
        type: 'login',
        activity_type: 'user_login',
        description: `🔐 Login: ${log.email || log.user_id} | ${location}`,
        severity: 'low',
        user_id: log.user_id,
        email: log.email,
        ip_address: log.ip_address,
        user_agent: log.user_agent,
        country: log.country,
        city: log.city,
        device: log.device,
        browser: log.browser,
        os: log.os,
        created_at: log.created_at,
        reviewed: false
      })
    })

    // Sort by date descending
    combinedLogs.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))

    // Filter by severity if needed
    if (severity && severity !== 'all') {
      combinedLogs = combinedLogs.filter(log => log.severity === severity)
    }

    // Calculate statistics
    const stats = {
      total: combinedLogs.length,
      activities: activityLogs.length,
      logins: loginLogs.length,
      low: combinedLogs.filter(l => l.severity === 'low').length,
      medium: combinedLogs.filter(l => l.severity === 'medium').length,
      high: combinedLogs.filter(l => l.severity === 'high').length,
      critical: combinedLogs.filter(l => l.severity === 'critical').length
    }

    const response = NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      data: combinedLogs.slice(offset, offset + limit),
      stats,
      pagination: {
        total: combinedLogs.length,
        limit,
        offset
      }
    })

    // Add no-cache headers
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0')
    response.headers.set('Pragma', 'no-cache')
    response.headers.set('Expires', '0')

    return response
  } catch (error) {
    console.error('[Activity Log] Error:', error)
    return NextResponse.json(
      { 
        success: true,
        data: [],
        stats: { low: 0, medium: 0, high: 0, critical: 0, total: 0, activities: 0, logins: 0 },
        message: 'Activity logs and login logs tables not yet created.'
      }
    )
  }
}
