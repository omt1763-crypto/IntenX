'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'

export default function ProtectedRoute({ children, requiredRole = null }) {
  const router = useRouter()
  const { user, loading, isAuthenticated, role } = useAuth()
  const [shouldRedirect, setShouldRedirect] = useState(false)

  useEffect(() => {
    // If not authenticated and not loading, redirect
    if (!loading && (!isAuthenticated || !user)) {
      console.log('[ProtectedRoute] No authentication found, redirecting to login')
      setShouldRedirect(true)
      return
    }

    // Check if user has required role (if specified)
    if (user && requiredRole && role !== requiredRole) {
      console.log(`[ProtectedRoute] User role (${role}) does not match required role (${requiredRole}), redirecting`)
      setShouldRedirect(true)
      return
    }

    if (isAuthenticated && user) {
      console.log(`[ProtectedRoute] Access granted for user: ${user.email}, role: ${role}`)
      setShouldRedirect(false)
    }
  }, [loading, isAuthenticated, user, role, requiredRole])

  // Execute redirect if needed
  useEffect(() => {
    if (shouldRedirect) {
      console.log('[ProtectedRoute] Executing redirect to login')
      router.push('/auth/login')
    }
  }, [shouldRedirect, router])

  // Show loading state while checking auth
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-emerald-200 border-t-emerald-500 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-600 font-medium">Verifying access...</p>
        </div>
      </div>
    )
  }

  // Show nothing if not authenticated (will redirect)
  if (!isAuthenticated || !user) {
    return null
  }

  // Check role if required
  if (requiredRole && role !== requiredRole) {
    return null
  }

  // User is authenticated and has required role
  return children
}
