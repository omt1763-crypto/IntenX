'use client'

import ResumeTracker from '@/components/ResumeTracker'
import ResumeStatusTracker from '@/components/ResumeStatusTracker'

export default function ResumeChecker() {
  return (
    <main className='min-h-screen'>
      <ResumeTracker />
      <div className='mt-12'>
        <ResumeStatusTracker />
      </div>
    </main>
  )
}
