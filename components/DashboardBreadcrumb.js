'use client'

import { useRouter, usePathname } from 'next/navigation'
import { ChevronRight, Home } from 'lucide-react'

export default function DashboardBreadcrumb() {
  const router = useRouter()
  const pathname = usePathname()

  // Only show breadcrumb on sub-pages, not on main dashboard
  // Hide if path is exactly /candidate/dashboard, /recruiter/dashboard, or /business/dashboard
  if (pathname === '/candidate/dashboard' || pathname === '/recruiter/dashboard' || pathname === '/business/dashboard') {
    return null
  }

  // Map paths to breadcrumb labels
  const getBreadcrumbs = () => {
    const parts = pathname.split('/').filter(Boolean)
    
    if (parts.length <= 2) return [] // Only main dashboard, no breadcrumb

    const breadcrumbs = []
    let isDashboard = false

    if (parts[0] === 'candidate') {
      breadcrumbs.push({ label: 'Dashboard', path: '/candidate/dashboard', icon: 'home' })
      isDashboard = true
    } else if (parts[0] === 'recruiter') {
      breadcrumbs.push({ label: 'Dashboard', path: '/recruiter/dashboard', icon: 'home' })
      isDashboard = true
    } else if (parts[0] === 'business') {
      breadcrumbs.push({ label: 'Dashboard', path: '/business/dashboard', icon: 'home' })
      isDashboard = true
    }

    // Add current section (only if not at dashboard)
    if (parts.length > 2) {
      const section = parts[2]
      const sectionLabels = {
        'practice': 'Practice Types',
        'skills': 'Skills Map',
        'resume': 'Resume Analysis',
        'certificates': 'Certificates',
        'profile': 'My Profile',
        'activity': 'Activity',
        'billing': 'Billing',
        'history': 'Interview History',
        'applicants': 'Applicants',
        'jobs': 'Jobs',
        'detail': 'Applicant Details',
      }
      
      if (sectionLabels[section]) {
        breadcrumbs.push({
          label: sectionLabels[section],
          path: `/${parts[0]}/dashboard/${section}`,
          icon: 'document'
        })
      }
    }

    return breadcrumbs
  }

  const breadcrumbs = getBreadcrumbs()

  if (breadcrumbs.length === 0) return null

  return (
    <div className="flex items-center gap-1 text-sm text-slate-600 mb-6">
      {breadcrumbs.map((crumb, index) => (
        <div key={crumb.path} className="flex items-center gap-1">
          <button
            onClick={() => router.push(crumb.path)}
            className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-slate-200/50 hover:text-slate-900 transition-all duration-200 font-medium text-slate-700 hover:font-semibold"
          >
            {crumb.icon === 'home' && <Home className="w-4 h-4" />}
            {crumb.label}
          </button>
          {index < breadcrumbs.length - 1 && <ChevronRight className="w-4 h-4 text-slate-400" />}
        </div>
      ))}
    </div>
  )
}
