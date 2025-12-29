'use client'

import { createContext, useContext, useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

const AuthContext = createContext()

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [session, setSession] = useState(null)
  const [role, setRole] = useState(null)
  const [loading, setLoading] = useState(false)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isHydrated, setIsHydrated] = useState(false)

  // Save auth state to localStorage
  const saveAuthState = (userData, sessionData, userRole) => {
    const authData = {
      user: userData,
      session: sessionData,
      role: userRole,
      timestamp: new Date().toISOString()
    }
    localStorage.setItem('authState', JSON.stringify(authData))
    console.log('[Auth] Auth state saved to localStorage')
  }

  // Load auth state from localStorage
  const loadAuthState = () => {
    try {
      const stored = localStorage.getItem('authState')
      if (stored) {
        const authData = JSON.parse(stored)
        console.log('[Auth] Loaded auth state from localStorage for:', authData.user?.email)
        return authData
      }
    } catch (err) {
      console.error('[Auth] Failed to load auth state:', err)
    }
    return null
  }
  // Clear auth state from localStorage
  const clearAuthState = () => {
    localStorage.removeItem('authState')
    localStorage.removeItem('interviewSetup')
    localStorage.removeItem('resumeSkillsSaved')
    console.log('[Auth] Auth state cleared from localStorage')
  }
  useEffect(() => {
    // Immediately load from localStorage for instant restore
    const savedAuth = loadAuthState()
    if (savedAuth?.user && savedAuth?.session && savedAuth?.role) {
      console.log('[Auth] ✅ Restored session from localStorage:', savedAuth.user.email)
      setUser(savedAuth.user)
      setSession(savedAuth.session)
      setRole(savedAuth.role)
      setIsAuthenticated(true)
      // Mark as hydrated immediately since we have cached data
      setIsHydrated(true)
    } else {
      console.log('[Auth] ⏳ No cached session, verifying with Supabase...')
    }

    // Then verify with Supabase (non-blocking)
    const verifySession = async () => {
      try {
        const { data: { session: currentSession } } = await supabase.auth.getSession()
        
        if (currentSession?.user) {
          console.log('[Auth] ✅ Valid Supabase session found')
          setSession(currentSession)
          setUser(currentSession.user)
          setIsAuthenticated(true)
          
          // Fetch user profile for role
          const { data } = await supabase
            .from('users')
            .select('role')
            .eq('id', currentSession.user.id)
            .single()
          
          if (data) {
            setRole(data.role)
            saveAuthState(currentSession.user, currentSession, data.role)
          }
        } else if (!savedAuth?.user) {
          // Only clear if we don't have a cached session
          console.log('[Auth] ❌ No session found anywhere')
          setSession(null)
          setUser(null)
          setRole(null)
          setIsAuthenticated(false)
          clearAuthState()
        }
        
        // Mark hydration complete after verification (even if we had cached data)
        setIsHydrated(true)
      } catch (error) {
        console.warn('[Auth] ⚠️ Session verification error:', error.message)
        // Still mark as hydrated even on error so pages can proceed
        setIsHydrated(true)
      }
    }

    // Only verify with Supabase if we don't already have cached data
    if (!savedAuth?.user) {
      verifySession()
    } else {
      // We have cached data, so just verify in background without blocking
      verifySession().catch(err => console.warn('[Auth] Background verification failed:', err))
    }

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, currentSession) => {
        console.log('[Auth] Auth state change event:', _event)
        
        if (currentSession?.user) {
          console.log('[Auth] Session valid, updating state')
          setSession(currentSession)
          setUser(currentSession.user)
          setIsAuthenticated(true)
          
          // Fetch user profile for role
          const { data } = await supabase
            .from('users')
            .select('role')
            .eq('id', currentSession.user.id)
            .single()
          
          if (data) {
            setRole(data.role)
            saveAuthState(currentSession.user, currentSession, data.role)
          }
        } else {
          // Only clear if this is a SIGNED_OUT event, not INITIAL_SESSION
          if (_event === 'SIGNED_OUT') {
            console.log('[Auth] User signed out, clearing session')
            setSession(null)
            setUser(null)
            setRole(null)
            setIsAuthenticated(false)
            clearAuthState()
          } else {
            // For INITIAL_SESSION and other events, keep cached session if available
            // Check localStorage directly in case React state hasn't updated yet
            const savedAuth = loadAuthState()
            if (!savedAuth?.user) {
              console.log('[Auth] No current session and no cached session')
              setIsAuthenticated(false)
            } else {
              console.log('[Auth] Keeping cached session for:', savedAuth.user?.email)
              // Ensure state is set from cache if it isn't already
              if (!user) {
                setUser(savedAuth.user)
                setSession(savedAuth.session)
                setRole(savedAuth.role)
                setIsAuthenticated(true)
              }
            }
          }
        }
      }
    )

    return () => subscription?.unsubscribe()
  }, [])

  const signup = async (userData, userRole) => {
    try {
      console.log('[Signup] Attempting signup for:', userData.email)
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: userData.firstName,
          lastName: userData.lastName,
          email: userData.email,
          password: userData.password,
          role: userRole,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        console.error('[Signup] API error:', error)
        throw new Error(error.error || 'Signup failed')
      }

      const data = await response.json()
      console.log('[Signup] Account created successfully! User must now log in.')
      
      // Account created successfully - user needs to log in manually
      // Return the user data but don't auto-authenticate
      return {
        user: data.user,
        needsLogin: true,
        message: data.message
      }
    } catch (error) {
      console.error('[Signup] Error:', error)
      throw error
    }
  }

  const login = async (email, password, userRole) => {
    try {
      console.log('[AuthContext] Attempting login:', { email, role: userRole })
      
      // Call our API endpoint instead of going directly to Supabase
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          password,
          role: userRole,
        }),
      })

      console.log('[AuthContext] Login response status:', response.status)

      if (!response.ok) {
        const error = await response.json()
        console.error('[AuthContext] Login error response:', error)
        throw new Error(error.error || 'Login failed')
      }

      const data = await response.json()
      
      console.log('[AuthContext] Login successful, setting session')
      
      // If session is returned, set it and save to localStorage
      if (data.session) {
        setSession(data.session)
        setUser(data.session.user || data.user)
      }
      
      // Use the actual role from the database (data.user.role), not the parameter
      const actualRole = data.user?.role || userRole
      setRole(actualRole)
      setIsAuthenticated(true)
      
      // Save auth state for persistence
      saveAuthState(data.session?.user || data.user, data.session, actualRole)
      
      console.log('[AuthContext] Auth state saved to localStorage')
      
      return data.user
    } catch (error) {
      console.error('[AuthContext] Login error:', error)
      throw error
    }
  }
  const logout = async () => {
    try {
      await supabase.auth.signOut()
      setSession(null)
      setUser(null)
      setRole(null)
      setIsAuthenticated(false)
      clearAuthState()
      console.log('[Auth] User logged out, auth state cleared')
    } catch (error) {
      console.error('Logout error:', error)
      throw error
    }
  }

  return (
    <AuthContext.Provider value={{ user, session, role, loading, isAuthenticated, isHydrated, signup, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}
