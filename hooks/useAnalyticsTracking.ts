import { useEffect } from 'react'
import { usePathname } from 'next/navigation'

export function useAnalyticsTracking() {
  const pathname = usePathname()

  useEffect(() => {
    const trackPageView = async () => {
      try {
        // Generate or retrieve session ID
        let sessionId = localStorage.getItem('analytics_session_id')
        if (!sessionId) {
          sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
          localStorage.setItem('analytics_session_id', sessionId)
        }

        // Track the page view
        const response = await fetch('/api/analytics/track', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            page_path: pathname,
            referrer: document.referrer || null,
            session_id: sessionId,
            user_id: null // Could get from auth context if available
          })
        })

        if (!response.ok) {
          console.warn('[Analytics] Failed to track page view:', response.status)
        }
      } catch (error) {
        console.warn('[Analytics] Tracking error:', error)
        // Fail silently to not affect user experience
      }
    }

    trackPageView()
  }, [pathname])
}
