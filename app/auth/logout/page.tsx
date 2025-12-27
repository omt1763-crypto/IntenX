'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { LogOut, AlertCircle } from 'lucide-react'

export default function LogoutPage() {
  const router = useRouter()
  const { logout } = useAuth()
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const handleConfirmLogout = async () => {
    setIsLoggingOut(true)
    try {
      await logout()
      router.push('/auth/login')
    } catch (error) {
      console.error('Logout error:', error)
      setIsLoggingOut(false)
    }
  }

  const handleCancel = () => {
    router.back()
  }

  if (!mounted) return null

  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-slate-50 p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-lg p-8 border border-slate-200">
          {/* Icon */}
          <div className="flex justify-center mb-6">
            <div className="p-4 bg-gradient-to-br from-red-100 to-red-200 rounded-full">
              <AlertCircle className="w-8 h-8 text-red-600" />
            </div>
          </div>

          {/* Heading */}
          <h1 className="text-2xl font-bold text-center text-slate-900 mb-2">
            Sign Out?
          </h1>
          <p className="text-center text-slate-600 mb-8">
            Are you sure you want to log out? You'll need to sign in again to access your account.
          </p>

          {/* Buttons */}
          <div className="space-y-3">
            <button
              onClick={handleConfirmLogout}
              disabled={isLoggingOut}
              className="w-full px-6 py-3 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-lg font-semibold hover:from-red-700 hover:to-red-800 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-md hover:shadow-lg"
            >
              <LogOut className="w-5 h-5" />
              {isLoggingOut ? 'Signing out...' : 'Yes, Sign Out'}
            </button>
            <button
              onClick={handleCancel}
              disabled={isLoggingOut}
              className="w-full px-6 py-3 bg-slate-100 text-slate-900 rounded-lg font-semibold hover:bg-slate-200 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
          </div>

          {/* Footer */}
          <div className="mt-6 pt-6 border-t border-slate-200">
            <p className="text-xs text-slate-500 text-center">
              © 2024 InterviewX. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </main>
  )
}
