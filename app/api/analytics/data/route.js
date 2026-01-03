import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url)
    const days = parseInt(searchParams.get('days') || '30')
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    // Get all analytics events for the period
    const { data: events, error } = await supabaseAdmin
      .from('analytics_events')
      .select('*')
      .gte('created_at', startDate.toISOString())
      .order('created_at', { ascending: true })

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    // Calculate statistics
    const stats = {
      totalVisits: events?.length || 0,
      uniqueVisitors: new Set(events?.map(e => e.session_id)).size || 0,
      uniqueCountries: new Set(events?.map(e => e.country)).size || 0,
      avgVisitDuration: events?.length > 0 
        ? Math.round(events.reduce((sum, e) => sum + (e.duration_seconds || 0), 0) / events.length)
        : 0
    }

    // Visits by country
    const visitorsByCountry = {}
    events?.forEach(e => {
      if (e.country) {
        visitorsByCountry[e.country] = (visitorsByCountry[e.country] || 0) + 1
      }
    })
    const countryData = Object.entries(visitorsByCountry)
      .map(([country, count]) => ({ country, visitors: count }))
      .sort((a, b) => b.visitors - a.visitors)
      .slice(0, 10) // Top 10 countries

    // Visits by device type
    const visitorsByDevice = {}
    events?.forEach(e => {
      if (e.device_type) {
        visitorsByDevice[e.device_type] = (visitorsByDevice[e.device_type] || 0) + 1
      }
    })
    const deviceData = Object.entries(visitorsByDevice)
      .map(([name, value]) => ({ name, value }))

    // Visits by browser
    const visitorsByBrowser = {}
    events?.forEach(e => {
      if (e.browser) {
        visitorsByBrowser[e.browser] = (visitorsByBrowser[e.browser] || 0) + 1
      }
    })
    const browserData = Object.entries(visitorsByBrowser)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)

    // Top pages
    const pageViews = {}
    events?.forEach(e => {
      if (e.page_path) {
        pageViews[e.page_path] = (pageViews[e.page_path] || 0) + 1
      }
    })
    const topPages = Object.entries(pageViews)
      .map(([page, views]) => ({ page, views }))
      .sort((a, b) => b.views - a.views)
      .slice(0, 10)

    // Visits over time (daily)
    const visitsOverTime = {}
    events?.forEach(e => {
      const date = new Date(e.created_at).toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
      })
      visitsOverTime[date] = (visitsOverTime[date] || 0) + 1
    })
    const timelineData = Object.entries(visitsOverTime)
      .map(([date, visits]) => ({ date, visits }))

    // Top cities
    const cityCounts = {}
    events?.forEach(e => {
      if (e.city && e.country) {
        const cityKey = `${e.city}, ${e.country_code}`
        cityCounts[cityKey] = (cityCounts[cityKey] || 0) + 1
      }
    })
    const topCities = Object.entries(cityCounts)
      .map(([city, count]) => ({ city, visitors: count }))
      .sort((a, b) => b.visitors - a.visitors)
      .slice(0, 10)

    // Recent visitors
    const recentVisitors = events
      ?.slice(-20)
      .reverse()
      .map(e => ({
        date: new Date(e.created_at).toLocaleString(),
        country: e.country,
        city: e.city,
        page: e.page_path,
        device: e.device_type,
        browser: e.browser
      })) || []

    return NextResponse.json({
      success: true,
      stats,
      countryData,
      deviceData,
      browserData,
      topPages,
      timelineData,
      topCities,
      recentVisitors
    })
  } catch (error) {
    console.error('[Analytics Data API] Error:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
