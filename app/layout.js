import '../styles/index.css'
import { AuthProvider } from '@/context/AuthContext'
import { SidebarProvider } from '@/context/SidebarContext'
import SecurityWrapper from '@/components/SecurityWrapper'

export const metadata = {
  title: 'InterviewVerse - AI-Powered Interview Platform',
  description: 'Master your interview skills with AI-powered mock interviews and real-time feedback.',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="bg-neutral-50 dark:bg-neutral-900">
        <SecurityWrapper>
          <AuthProvider>
            <SidebarProvider>
              <div className="min-h-screen">
                {children}
              </div>
            </SidebarProvider>
          </AuthProvider>
        </SecurityWrapper>
      </body>
    </html>
  )
}
