'use client'

import React, { useState } from 'react'

interface ResumeStatus {
  id: string
  jobTitle: string
  company: string
  status: 'applied' | 'under_review' | 'shortlisted' | 'interview' | 'offer' | 'rejected'
  appliedDate: string
  overallScore: number
}

const ResumeStatusTracker: React.FC<{ resumes?: ResumeStatus[] }> = ({ resumes = [] }) => {
  const statuses: Array<'applied' | 'under_review' | 'shortlisted' | 'interview' | 'offer' | 'rejected'> = [
    'applied',
    'under_review',
    'shortlisted',
    'interview',
    'offer',
    'rejected',
  ]

  const statusConfig = {
    applied: { icon: '📤', label: 'Applied', color: 'bg-blue-100 text-blue-800', line: 'bg-blue-400' },
    under_review: { icon: '👀', label: 'Under Review', color: 'bg-yellow-100 text-yellow-800', line: 'bg-yellow-400' },
    shortlisted: { icon: '⭐', label: 'Shortlisted', color: 'bg-purple-100 text-purple-800', line: 'bg-purple-400' },
    interview: { icon: '🎤', label: 'Interview', color: 'bg-orange-100 text-orange-800', line: 'bg-orange-400' },
    offer: { icon: '🎉', label: 'Offer', color: 'bg-green-100 text-green-800', line: 'bg-green-400' },
    rejected: { icon: '❌', label: 'Rejected', color: 'bg-red-100 text-red-800', line: 'bg-red-400' },
  }

  const getResumesByStatus = (status: typeof statuses[number]) => {
    return resumes.filter((r) => r.status === status)
  }

  return (
    <div className='min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-8'>
      <div className='max-w-7xl mx-auto'>
        {/* Header */}
        <div className='mb-12'>
          <h1 className='text-4xl font-bold text-white mb-2'>Application Tracker</h1>
          <p className='text-gray-400'>Track your resume through the hiring pipeline</p>
        </div>

        {/* Horizontal Timeline */}
        <div className='bg-white rounded-xl shadow-2xl p-8 mb-12'>
          <div className='flex items-center justify-between relative mb-12'>
            {/* Progress Line */}
            <div className='absolute top-1/2 left-0 right-0 h-1 bg-gray-300 -translate-y-1/2' />

            {statuses.map((status, idx) => {
              const config = statusConfig[status]
              const resumeCount = getResumesByStatus(status)

              return (
                <div key={status} className='relative flex flex-col items-center w-full'>
                  {/* Status Node */}
                  <div className={`relative z-10 w-16 h-16 ${config.color} rounded-full flex items-center justify-center text-2xl font-bold shadow-lg border-4 border-white`}>
                    {config.icon}
                  </div>

                  {/* Status Label */}
                  <div className='mt-4 text-center'>
                    <p className='font-bold text-gray-900 whitespace-nowrap'>{config.label}</p>
                    <p className='text-sm text-gray-600 font-semibold'>{resumeCount.length} resumes</p>
                  </div>

                  {/* Separator */}
                  {idx < statuses.length - 1 && (
                    <div className='absolute top-1/2 right-0 w-full h-1 -translate-y-1/2 -translate-x-1/2'>
                      <div className={`h-full ${config.line}`} />
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          {/* Stats */}
          <div className='grid grid-cols-6 gap-4 mt-12 pt-8 border-t'>
            {statuses.map((status) => {
              const config = statusConfig[status]
              const count = getResumesByStatus(status).length

              return (
                <div key={status} className={`${config.color} p-4 rounded-lg text-center`}>
                  <p className='text-2xl font-bold'>{count}</p>
                  <p className='text-sm font-semibold mt-1'>{config.label}</p>
                </div>
              )
            })}
          </div>
        </div>

        {/* Status Details */}
        <div className='space-y-8'>
          {statuses.map((status) => {
            const resumeList = getResumesByStatus(status)
            const config = statusConfig[status]

            if (resumeList.length === 0) return null

            return (
              <div key={status} className='bg-white rounded-xl shadow-lg p-8'>
                <h2 className={`text-2xl font-bold mb-6 flex items-center gap-3`}>
                  <span className={`px-4 py-2 ${config.color} rounded-lg text-2xl`}>{config.icon}</span>
                  {config.label}
                </h2>

                <div className='space-y-4'>
                  {resumeList.map((resume) => (
                    <div key={resume.id} className={`p-4 border-l-4 ${config.line.replace('bg-', 'border-')} rounded-r-lg bg-gray-50`}>
                      <div className='flex justify-between items-start'>
                        <div>
                          <h3 className='text-lg font-bold text-gray-900'>{resume.jobTitle}</h3>
                          <p className='text-gray-600'>{resume.company}</p>
                          <p className='text-sm text-gray-500 mt-2'>Applied: {new Date(resume.appliedDate).toLocaleDateString()}</p>
                        </div>
                        <div className='text-right'>
                          <div className='text-3xl font-bold text-blue-600'>{resume.overallScore}</div>
                          <p className='text-gray-600 text-sm'>Resume Score</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>

        {/* Empty State */}
        {resumes.length === 0 && (
          <div className='bg-white rounded-xl shadow-lg p-12 text-center'>
            <p className='text-gray-600 text-lg'>No resumes tracked yet. Upload your first resume to get started!</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default ResumeStatusTracker
