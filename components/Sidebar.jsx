'use client'

import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { LayoutGrid, User, Briefcase, Users, CreditCard, LogOut, BarChart3, Users2, FileText, Mic2, AlertCircle, Menu, X, Database } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { useSidebar } from '@/context/SidebarContext'

export default function Sidebar({role='company'}) {
  const router = useRouter()
  const pathname = usePathname()
  const { logout } = useAuth()
  const { isOpen, setIsOpen } = useSidebar()

  const handleLogout = () => {
    router.push('/auth/logout')
  }

  const getBasePath = () => {
    if (role === 'candidate') return '/candidate/dashboard'
    if (role === 'recruiter') return '/recruiter/dashboard'
    if (role === 'company') return '/business/dashboard'
    return '/dashboard'
  }

  const basePath = getBasePath()

  const isActive = (href) => {
    if (href === basePath) {
      return pathname === basePath
    }
    return pathname.startsWith(href)
  }

  const menuItems = [
    { href: `${basePath}`, label: 'Dashboard', icon: LayoutGrid },
    { href: `${basePath}/profile`, label: 'My Profile', icon: User },
    { href: `${basePath}/jobs`, label: 'Jobs', icon: Briefcase },
    { href: `${basePath}/billing`, label: 'Billing', icon: CreditCard },
    ...(role !== 'candidate' 
      ? [{ href: `${basePath}/applicants`, label: 'Applicants', icon: Users }]
      : [{ href: '/interview/mock', label: 'Mock Interviews', icon: LayoutGrid }]
    ),
  ]

  return (
    <div className={`fixed left-0 top-0 h-screen z-50 bg-gradient-to-b from-blue-600 via-blue-500 to-purple-600 shadow-lg transition-all duration-300 ${isOpen ? 'w-64' : 'w-20'} border-r border-blue-400/20`}>
      {/* Header with Toggle */}
      <div className='p-6 border-b border-blue-300/20 flex items-center justify-between'>
        {isOpen && <h2 className='text-xl font-bold text-white'>InterviewX</h2>}
        <button onClick={() => setIsOpen(!isOpen)} className='text-white hover:text-blue-100 transition-colors'>
          {isOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Logo - Only show when open */}
      {isOpen && (
        <div className='px-6 pt-4 pb-8'>
          <div className='flex items-center gap-2 mb-2'>
            <div className='w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-purple-400 flex items-center justify-center'>
              <span className='text-white font-bold text-sm'>X</span>
            </div>
          </div>
          <p className='text-xs text-blue-100'>AI Interview Platform</p>
        </div>
      )}

      {/* Navigation */}
      <nav className='px-4 py-2 space-y-2'>
        {menuItems.map((item, index) => {
          const IconComponent = item.icon
          const active = isActive(item.href)
          return (
            <Link key={index} href={item.href}>
              <div className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 cursor-pointer group ${
                active 
                  ? 'bg-white/20 text-white shadow-lg' 
                  : 'text-blue-100 hover:bg-white/10'
              }`}>
                <IconComponent className={`w-5 h-5 transition-colors ${
                  active 
                    ? 'text-white' 
                    : 'text-blue-200 group-hover:text-white'
                }`} />
                {isOpen && (
                  <span className={`font-medium transition-colors ${
                    active 
                      ? 'text-white' 
                      : 'group-hover:text-white'
                  }`}>{item.label}</span>
                )}
              </div>
            </Link>
          )
        })}
      </nav>

      {/* Debug Section: Only show on /debug/data */}
      {isOpen && typeof window !== 'undefined' && window.location.pathname.startsWith('/debug/data') && (
        <div className='mt-8 px-4 pt-6 border-t border-blue-300/30'>
          <p className='text-xs font-semibold text-blue-200 uppercase tracking-wider mb-3 px-4'>🔧 Debug Tools</p>
          <nav className='space-y-2'>
            <Link href='/debug/data'>
              <div className='flex items-center gap-3 px-4 py-2 rounded-lg text-xs text-blue-100 hover:bg-white/10 transition-all cursor-pointer group'>
                <BarChart3 className='w-4 h-4 text-blue-200 group-hover:text-white transition-colors' />
                <span className='group-hover:text-white transition-colors'>📊 Overview</span>
              </div>
            </Link>
            <Link href='/debug/data?tab=users'>
              <div className='flex items-center gap-3 px-4 py-2 rounded-lg text-xs text-blue-100 hover:bg-white/10 transition-all cursor-pointer group'>
                <Users2 className='w-4 h-4 text-blue-200 group-hover:text-white transition-colors' />
                <span className='group-hover:text-white transition-colors'>👥 Users</span>
              </div>
            </Link>
            <Link href='/debug/data?tab=jobs'>
              <div className='flex items-center gap-3 px-4 py-2 rounded-lg text-xs text-blue-100 hover:bg-white/10 transition-all cursor-pointer group'>
                <Briefcase className='w-4 h-4 text-blue-200 group-hover:text-white transition-colors' />
                <span className='group-hover:text-white transition-colors'>💼 Jobs</span>
              </div>
            </Link>
            <Link href='/debug/data?tab=applicants'>
              <div className='flex items-center gap-3 px-4 py-2 rounded-lg text-xs text-blue-100 hover:bg-white/10 transition-all cursor-pointer group'>
                <FileText className='w-4 h-4 text-blue-200 group-hover:text-white transition-colors' />
                <span className='group-hover:text-white transition-colors'>📝 Applicants</span>
              </div>
            </Link>
            <Link href='/debug/data?tab=interviews'>
              <div className='flex items-center gap-3 px-4 py-2 rounded-lg text-xs text-blue-100 hover:bg-white/10 transition-all cursor-pointer group'>
                <Mic2 className='w-4 h-4 text-blue-200 group-hover:text-white transition-colors' />
                <span className='group-hover:text-white transition-colors'>🎤 Interviews</span>
              </div>
            </Link>
            <Link href='/debug/data?tab=activitylogs'>
              <div className='flex items-center gap-3 px-4 py-2 rounded-lg text-xs text-blue-100 hover:bg-white/10 transition-all cursor-pointer group'>
                <AlertCircle className='w-4 h-4 text-blue-200 group-hover:text-white transition-colors' />
                <span className='group-hover:text-white transition-colors'>🚨 Activity Logs</span>
              </div>
            </Link>
            <Link href='/debug/data?tab=resume-data'>
              <div className='flex items-center gap-3 px-4 py-2 rounded-lg text-xs text-blue-100 hover:bg-white/10 transition-all cursor-pointer group'>
                <Database className='w-4 h-4 text-blue-200 group-hover:text-white transition-colors' />
                <span className='group-hover:text-white transition-colors'>💾 Resume Data</span>
              </div>
            </Link>
          </nav>
        </div>
      )}

      {/* Footer with Logout */}
      <div className='absolute bottom-6 left-4 right-4 pt-6 border-t border-blue-300/20 space-y-2'>
        {isOpen && (
          <div className='bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg p-2.5 shadow-lg'>
            <button
              onClick={handleLogout}
              className='w-full flex items-center justify-center gap-2 px-3 py-1.5 rounded-lg bg-white/20 text-white hover:bg-white/30 transition-all duration-200 group font-medium text-xs shadow-md hover:shadow-lg hover:scale-105 active:scale-95'
            >
              <LogOut className='w-4 h-4' />
              <span>Logout</span>
            </button>
          </div>
        )}
        {!isOpen && (
          <button
            onClick={handleLogout}
            className='w-full flex items-center justify-center p-2 rounded-lg bg-red-500/20 text-white hover:bg-red-500/30 transition-all duration-200 group font-medium shadow-md hover:shadow-lg'
            title='Logout'
          >
            <LogOut className='w-4 h-4' />
          </button>
        )}
        {isOpen && <p className='text-xs text-blue-100 text-center'>© 2024 InterviewX</p>}
      </div>
    </div>
  )
}
