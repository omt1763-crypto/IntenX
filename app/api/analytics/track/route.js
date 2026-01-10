import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

// Get geolocation from IP using multiple providers for better accuracy
async function getGeoLocation(ip) {
  try {
    // Skip private/local IPs
    if (ip === '0.0.0.0' || ip === 'localhost' || ip === '127.0.0.1' || ip?.startsWith('192.168') || ip?.startsWith('10.')) {
      return null
    }

    // Try ip-api.com first (free tier: 45 requests/minute, good accuracy)
    try {
      const response = await fetch(`https://ip-api.com/json/${ip}?fields=country,countryCode,city,isp`, {
        next: { revalidate: 3600 },
        timeout: 5000
      })
      
      if (response.ok) {
        const data = await response.json()
        
        if (data.status === 'success' && data.country && data.country !== 'Unknown') {
          return {
            country: data.country,
            country_code: data.countryCode || '',
            city: data.city || 'Unknown'
          }
        }
      }
    } catch (e) {
      console.warn('[Analytics] ip-api.com failed:', e.message)
      // Continue to fallback
    }

    // Fallback to ipwho.is (more reliable for international visitors)
    try {
      const response = await fetch(`https://ipwho.is/${ip}`, {
        next: { revalidate: 3600 },
        timeout: 5000
      })
      
      if (response.ok) {
        const data = await response.json()
        
        if (data.success && data.country) {
          return {
            country: data.country,
            country_code: data.country_code?.toUpperCase() || '',
            city: data.city || 'Unknown'
          }
        }
      }
    } catch (e) {
      console.warn('[Analytics] ipwho.is failed:', e.message)
      // Continue to next fallback
    }

    // Final fallback to ip-geo-block.com
    try {
      const response = await fetch(`https://ip-geo-block.com/json/check?ip=${ip}`, {
        next: { revalidate: 3600 },
        timeout: 5000
      })
      
      if (response.ok) {
        const data = await response.json()
        
        if (data.countryCode && data.countryCode !== 'XX') {
          return {
            country: data.countryName || 'Unknown',
            country_code: data.countryCode || '',
            city: data.city || 'Unknown'
          }
        }
      }
    } catch (e) {
      console.warn('[Analytics] ip-geo-block.com failed:', e.message)
    }

    return null
  } catch (error) {
    console.error('[Analytics] Geolocation error:', error)
    return null
  }
}

// Parse user agent to get device type and browser
function parseUserAgent(userAgent) {
  if (!userAgent) return { device_type: 'unknown', browser: 'unknown' }
  
  const ua = userAgent.toLowerCase()
  
  // Detect device type
  let device_type = 'desktop'
  if (ua.includes('mobile') || ua.includes('android') || ua.includes('iphone') || ua.includes('ipad')) {
    device_type = ua.includes('mobile') || ua.includes('android') || ua.includes('iphone') ? 'mobile' : 'tablet'
  }
  
  // Detect browser
  let browser = 'unknown'
  if (ua.includes('chrome')) browser = 'Chrome'
  else if (ua.includes('firefox')) browser = 'Firefox'
  else if (ua.includes('safari')) browser = 'Safari'
  else if (ua.includes('edge')) browser = 'Edge'
  else if (ua.includes('opera')) browser = 'Opera'
  
  return { device_type, browser }
}

export async function POST(req) {
  try {
    const body = await req.json()
    const {
      page_path,
      referrer,
      session_id,
      user_id
    } = body

    // Get IP from headers
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim() || 
               req.headers.get('x-real-ip') || 
               '0.0.0.0'

    // Get user agent
    const userAgent = req.headers.get('user-agent') || ''
    const { device_type, browser } = parseUserAgent(userAgent)

    // Get geolocation (with fallback)
    let geoData = await getGeoLocation(ip)
    if (!geoData) {
      geoData = {
        country: 'Unknown',
        country_code: 'XX',
        city: 'Unknown'
      }
    }

    // Insert analytics event
    const { data, error } = await supabaseAdmin
      .from('analytics_events')
      .insert([
        {
          page_path,
          country: geoData.country,
          country_code: geoData.country_code,
          city: geoData.city,
          device_type,
          browser,
          referrer: referrer || null,
          ip_address: ip,
          user_agent: userAgent,
          session_id,
          user_id: user_id || null
        }
      ])
      .select()

    if (error) {
      console.error('[Analytics] Insert error:', error)
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error('[Analytics] Tracking error:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
