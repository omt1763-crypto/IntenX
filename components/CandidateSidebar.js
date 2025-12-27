'use client'

import { useRouter, usePathname } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { LayoutDashboard, Zap, TrendingUp, FileText, Trophy, User, LogOut } from 'lucide-react'

export default function CandidateSidebar() {
  const router = useRouter()
  const pathname = usePathname()
  const { logout } = useAuth()

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, path: '/candidate/dashboard' },
    { id: 'practice', label: 'Practice Types', icon: Zap, path: '/candidate/dashboard/practice' },
    { id: 'skills', label: 'Skills Map', icon: TrendingUp, path: '/candidate/dashboard/skills' },
    { id: 'resume', label: 'Resume Analysis', icon: FileText, path: '/candidate/dashboard/resume' },
    { id: 'certificates', label: 'Certificates', icon: Trophy, path: '/candidate/dashboard/certificates' },
    { id: 'profile', label: 'My Profile', icon: User, path: '/candidate/dashboard/profile' }
  ]

  // Get current path for active state
  let currentPath = '';
  if (typeof window !== 'undefined') {
    currentPath = window.location.pathname;
  }

  return (
    <div className="fixed left-0 top-0 h-screen w-64 bg-gradient-to-b from-purple-600 to-cyan-500 text-white p-6 overflow-y-auto z-40 border-r border-purple-300/20">
      {/* Logo */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-cyan-400 flex items-center justify-center">
            <span className="text-white font-bold text-sm">X</span>
          </div>
          <h2 className="text-xl font-bold text-white">InterviewX</h2>
        </div>
        <p className="text-xs text-cyan-100 ml-10">Candidate Platform</p>      </div>      {/* Navigation Menu */}
      <nav className="space-y-2">
        {menuItems.map((item) => {
          const IconComponent = item.icon
          // Mark as active if current path matches the item's path exactly
          const isActive = pathname === item.path
          return (            <button
              key={item.id}
              onClick={() => router.push(item.path)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all text-left group
                ${isActive ? 'bg-white/20 text-white font-semibold shadow-md' : 'text-cyan-100 hover:bg-white/10'}`}
            >
              <IconComponent className={`w-5 h-5 transition-colors ${isActive ? 'text-white' : 'text-cyan-300 group-hover:text-white'}`} />
              <span className={`font-medium text-sm ${isActive ? 'text-white' : 'text-cyan-100'}`}>{item.label}</span>
            </button>
          )
        })}
      </nav>{/* Footer with Logout */}
      <div className='absolute bottom-6 left-6 right-6 pt-6 border-t border-purple-300/20 space-y-3'>
        <button
          onClick={() => {
            logout()
            router.push('/')
          }}
          className='w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:shadow-lg transition-all duration-200 group font-medium text-sm shadow-md hover:scale-105 active:scale-95'
        >
          <LogOut className='w-4 h-4' />
          <span>Logout</span>
        </button>
        <p className='text-xs text-cyan-100 text-center'>© 2024 InterviewX</p>
      </div>
    </div>
  )
}
