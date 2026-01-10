'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'

export default function AnalyticsTracker() {
  const pathname = usePathname()

  useEffect(() => {
    const trackPageView = async () => {
      try {
        // Skip tracking for certain paths (auth, debug, api, admin pages, and Next.js internals)
        const skipPaths = ['/api/', '/auth/', '/login', '/signup', '/register', '/debug/', '/admin/', '_next']
        if (skipPaths.some(path => pathname?.startsWith(path) || pathname?.includes(path))) {
          return
        }

        // Generate or retrieve session ID
        let sessionId = localStorage.getItem('analytics_session_id')
        if (!sessionId) {
          sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
          localStorage.setItem('analytics_session_id', sessionId)
        }

        // Track the page view
        await fetch('/api/analytics/track', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            page_path: pathname,
            referrer: document.referrer || null,
            session_id: sessionId
          })
        }).catch(err => {
          // Silently fail to not affect user experience
          console.warn('[Analytics] Tracking failed:', err.message)
        })
      } catch (error) {
        // Fail silently
      }
    }

    trackPageView()
  }, [pathname])

  return null
}
