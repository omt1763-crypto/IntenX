'use client'

import '../styles/index.css'
import { AuthProvider } from '@/context/AuthContext'
import { SidebarProvider } from '@/context/SidebarContext'
import SecurityWrapper from '@/components/SecurityWrapper'
import AnalyticsTracker from '@/components/AnalyticsTracker'

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      </head>
      <body className="bg-neutral-50 dark:bg-neutral-900">
        <SecurityWrapper>
          <AuthProvider>
            <SidebarProvider>
              <AnalyticsTracker />
              <div className="min-h-screen w-full">
                {children}
              </div>
            </SidebarProvider>
          </AuthProvider>
        </SecurityWrapper>
      </body>
    </html>
  )
}
