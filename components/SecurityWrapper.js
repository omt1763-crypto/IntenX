'use client'

import { useEffect } from 'react'
import { disableConsoleInProduction, disableContextMenuInProduction } from '@/lib/console-security'

export default function SecurityWrapper({ children }) {
  useEffect(() => {
    // Apply security measures
    disableConsoleInProduction()
    disableContextMenuInProduction()

    // Additional security: Prevent accessing sensitive data via DOM
    if (process.env.NEXT_PUBLIC_ENVIRONMENT === 'production') {
      // Remove any console-related data from window object
      Object.defineProperty(window, 'console', {
        value: new Proxy(console, {
          get: () => undefined
        }),
        writable: false
      })

      // Prevent accessing localStorage for sensitive keys
      const originalGetItem = Storage.prototype.getItem
      Storage.prototype.getItem = function (key) {
        if (key.includes('auth') || key.includes('token') || key.includes('debug')) {
          console.warn = () => {} // Silently fail
          return null
        }
        return originalGetItem.call(this, key)
      }
    }
  }, [])

  return <>{children}</>
}
