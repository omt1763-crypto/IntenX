import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET(req) {
  try {
    console.log('[Debug API] Starting data fetch at', new Date().toISOString())
    
    // Add no-cache headers to prevent caching
    const headers = {
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
      'Pragma': 'no-cache',
      'Expires': '0'
    }
    
    // Get all users
    console.log('[Debug API] Fetching users...')
    const { data: users, error: usersError } = await supabaseAdmin
      .from('users')
      .select('*')
      .order('created_at', { ascending: false })

    if (usersError) {
      console.error('[Debug API] Users Error - Full details:', JSON.stringify(usersError, null, 2))
    } else {
      console.log('[Debug API] Users fetched successfully:', users?.length || 0, 'records')
    }

    // Get all jobs
    const { data: jobs, error: jobsError } = await supabaseAdmin
      .from('jobs')
      .select('*')
      .order('created_at', { ascending: false })

    if (jobsError) {
      console.error('[Debug API] Jobs Error:', jobsError)
    }

    // Get all applicants
    const { data: applicants, error: appError } = await supabaseAdmin
      .from('job_applicants')
      .select('*')
      .order('created_at', { ascending: false })

    if (appError) {
      console.error('[Debug API] Applicants Error:', appError)
    }

    // Get all interviews
    const { data: interviews, error: interviewsError } = await supabaseAdmin
      .from('interviews')
      .select('*')
      .order('created_at', { ascending: false })

    if (interviewsError) {
      console.error('[Debug API] Interviews Error:', interviewsError)
    }

    // Get all subscriptions
    console.log('[Debug API] Fetching subscriptions...')
    const { data: subscriptions, error: subscriptionsError } = await supabaseAdmin
      .from('subscriptions')
      .select('*')
      .order('created_at', { ascending: false })

    if (subscriptionsError) {
      console.log('[Debug API] Subscriptions table not available:', subscriptionsError.code)
    } else {
      console.log('[Debug API] Subscriptions fetched:', subscriptions?.length || 0, 'records')
    }

    // Get all payments
    console.log('[Debug API] Fetching payments...')
    const { data: payments, error: paymentsError } = await supabaseAdmin
      .from('payments')
      .select('*')
      .order('created_at', { ascending: false })

    if (paymentsError) {
      console.log('[Debug API] Payments table not available:', paymentsError.code)
    } else {
      console.log('[Debug API] Payments fetched:', payments?.length || 0, 'records')
    }    console.log('[Debug API] Data Summary:')
    console.log(`  Users: ${users?.length || 0}`)
    console.log(`  Jobs: ${jobs?.length || 0}`)
    console.log(`  Applicants: ${applicants?.length || 0}`)
    console.log(`  Interviews: ${interviews?.length || 0}`)
    console.log(`  Subscriptions: ${subscriptions?.length || 0}`)
    console.log(`  Payments: ${payments?.length || 0}`)

    // Build user stats with interview counts
    const userStats = {}
    if (users && users.length > 0) {
      users.forEach(user => {
        const userInterviews = interviews?.filter(i => i.user_id === user.id) || []
        const userJobs = jobs?.filter(j => j.recruiter_id === user.id) || []
        const userApplicants = applicants?.filter(a => a.user_id === user.id) || []
        const recruiterApplicants = userJobs.length > 0 
          ? applicants?.filter(a => userJobs.some(j => j.id === a.job_id)) || []
          : []
        const recruiterInterviews = userJobs.length > 0
          ? interviews?.filter(i => recruiterApplicants.some(a => a.id === i.applicant_id)) || []
          : []
        
        userStats[user.id] = {
          interviews_count: user.role === 'recruiter' ? recruiterInterviews.length : userInterviews.length,
          jobs_count: user.role === 'recruiter' ? userJobs.length : 0,
          applicants_count: user.role === 'recruiter' ? recruiterApplicants.length : userApplicants.length,
          subscriptions_count: subscriptions?.filter(s => s.user_id === user.id).length || 0,
          last_activity: new Date().toISOString()
        }
        console.log(`[Debug API] User ${user.email}:`, userStats[user.id])
      })
    }

    // Calculate statistics
    let recruiters = 0
    let candidates = 0
    let admins = 0
    if (users && users.length > 0) {
      recruiters = users.filter(u => u.role === 'recruiter').length
      candidates = users.filter(u => u.role === 'candidate').length
      admins = users.filter(u => u.role === 'admin').length
      console.log(`[Debug API] Users breakdown: ${recruiters} recruiters, ${candidates} candidates, ${admins} admins`)
    }

    // Count applicant statuses
    let applicationStats = { pending: 0, shortlisted: 0, rejected: 0, accepted: 0 }
    if (applicants && applicants.length > 0) {
      applicants.forEach(app => {
        const status = app.status || 'pending'
        if (applicationStats.hasOwnProperty(status)) {
          applicationStats[status]++
        } else {
          applicationStats['pending']++
        }
      })
      console.log(`[Debug API] Application statuses:`, applicationStats)
    }

    // Match interviews with applicants
    let interviewStats = { completed: 0, pending: 0, analyzed: 0 }
    if (interviews && interviews.length > 0) {
      interviews.forEach(interview => {
        if (interview.analysis) {
          interviewStats.analyzed++
          interviewStats.completed++
        } else {
          interviewStats.pending++
        }
      })
      console.log(`[Debug API] Interview stats:`, interviewStats)
    }

    // Calculate subscription stats
    let subscriptionStats = { active: 0, inactive: 0, cancelled: 0, pending: 0 }
    let paymentStats = { completed: 0, pending: 0, failed: 0, total_amount: 0 }
    
    if (subscriptions && subscriptions.length > 0) {
      subscriptions.forEach(sub => {
        const status = sub.status || 'pending'
        if (subscriptionStats.hasOwnProperty(status)) {
          subscriptionStats[status]++
        }
      })
    }

    if (payments && payments.length > 0) {
      payments.forEach(payment => {
        const status = payment.status || 'pending'
        if (paymentStats.hasOwnProperty(status)) {
          paymentStats[status]++
        }
        if (payment.amount) {
          paymentStats.total_amount += payment.amount
        }
      })
    }    const response = NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      data: {
        users: users || [],
        jobs: jobs || [],
        applicants: applicants || [],
        interviews: interviews || [],
        subscriptions: subscriptions || [],
        payments: payments || [],
        userStats: userStats || {}
      },
      stats: {
        users: {
          total: users?.length || 0,
          recruiters,
          candidates,
          admins
        },
        jobs: {
          total: jobs?.length || 0
        },
        applicants: {
          total: applicants?.length || 0,
          byStatus: applicationStats
        },
        interviews: {
          total: interviews?.length || 0,
          analyzed: interviewStats.analyzed,
          pending: interviewStats.pending
        },
        subscriptions: {
          total: subscriptions?.length || 0,
          active: subscriptionStats.active,
          inactive: subscriptionStats.inactive,
          cancelled: subscriptionStats.cancelled,
          pending: subscriptionStats.pending
        },
        payments: {
          total: payments?.length || 0,
          completed: paymentStats.completed,
          pending: paymentStats.pending,
          failed: paymentStats.failed,
          totalAmount: paymentStats.total_amount
        }
      },
      errors: {
        users: usersError ? { message: usersError.message, code: usersError.code, details: usersError.details, hint: usersError.hint } : null,
        jobs: jobsError ? { message: jobsError.message, code: jobsError.code, details: jobsError.details, hint: jobsError.hint } : null,
        applicants: appError ? { message: appError.message, code: appError.code, details: appError.details, hint: appError.hint } : null,
        interviews: interviewsError ? { message: interviewsError.message, code: interviewsError.code, details: interviewsError.details, hint: interviewsError.hint } : null,
        subscriptions: subscriptionsError ? { message: subscriptionsError.message, code: subscriptionsError.code } : null,
        payments: paymentsError ? { message: paymentsError.message, code: paymentsError.code } : null
      }
    })

    // Add no-cache headers
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0')
    response.headers.set('Pragma', 'no-cache')
    response.headers.set('Expires', '0')

    return response
  } catch (error) {
    console.error('[Debug API] Error:', error)
    return NextResponse.json({
      error: error.message,
      success: false
    }, { status: 500 })
  }
}
