'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { User, Mail, Phone, MapPin, Briefcase, Award, Settings } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { useSidebar } from '@/context/SidebarContext'
import Sidebar from '@/components/Sidebar'
import { supabase } from '@/lib/supabase'

export default function RecruiterProfilePage() {
  const router = useRouter()
  const { user: authUser, isAuthenticated } = useAuth()
  const { isOpen: isSidebarOpen } = useSidebar()
  const [profile, setProfile] = useState(null)
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  
  const userId = authUser?.id

  // Load profile when user is authenticated
  useEffect(() => {
    if (userId) {
      loadProfile()
    }
  }, [userId])

  const loadProfile = async () => {
    try {
      console.log('[Profile] Loading with userId:', userId)
      
      if (!userId) {
        console.error('[Profile] No userId available')
        setLoading(false)
        return
      }

      // Show UI immediately, load data in background
      setLoading(false)

      // Load both user and stats in parallel (non-blocking, fire and forget)
      supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single()
        .then(({ data, error }) => {
          if (!error && data) {
            console.log('[Profile] User data loaded:', data)
            setProfile(data)
          } else if (error) {
            console.warn('[Profile] Error loading user:', error.message)
          }
        })
        .catch(error => console.warn('[Profile] User load error:', error.message))

      supabase
        .from('recruiter_stats')
        .select('*')
        .eq('recruiter_id', userId)
        .single()
        .then(({ data, error }) => {
          if (!error && data) {
            console.log('[Profile] Stats data loaded:', data)
            setStats(data)
          } else if (error) {
            console.warn('[Profile] Error loading stats:', error.message)
          }
        })
        .catch(error => console.warn('[Profile] Stats load error:', error.message))
    } catch (error) {
      console.error('[Profile] Unexpected error:', error)
      setLoading(false)
    }
  }
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05,
        delayChildren: 0.1,
      },
    },
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5, ease: 'easeOut' },
    },
  }
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-50">
      {/* Sidebar */}
      <Sidebar role="recruiter" />

      {/* Subtle Background Gradient */}
      <div className="fixed inset-0 pointer-events-none opacity-30">
        <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-gradient-to-b from-blue-500/20 to-transparent rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-gradient-to-t from-blue-600/15 to-transparent rounded-full blur-3xl" />
      </div>

      {/* Main Content */}
      <div className={`transition-all duration-300 ${isSidebarOpen ? 'ml-64' : 'ml-20'}`}>
        {/* Header */}
        <motion.div
          className="sticky top-0 z-40 border-b border-blue-200/50 bg-gradient-to-r from-blue-600 to-blue-700 backdrop-blur-md"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <div className="px-8 py-5">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-white">
                  My Profile
                </h1>
                <p className="text-sm text-blue-100 mt-1">
                  Manage your recruiter profile and settings
                </p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Page Content */}
        <div className="px-8 py-12 relative z-10">
          <motion.div
            className="space-y-8"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            {loading ? (
              <motion.div className="text-center py-8" variants={itemVariants}>
                <p className="text-black">Loading profile...</p>
              </motion.div>
            ) : profile || authUser ? (
            <>            {/* Profile Card */}
            <motion.div
              className="rounded-2xl border border-blue-200 p-8 bg-white shadow-sm hover:shadow-md transition-all"
              variants={itemVariants}
            >
              <div className="flex items-start justify-between mb-8">
                <div className="flex items-center gap-6">
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center">
                    <User className="w-10 h-10 text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-blue-600 mb-1">
                      {profile?.first_name && profile?.last_name 
                        ? `${profile.first_name} ${profile.last_name}`
                        : authUser?.name || authUser?.email || 'Recruiter'}
                    </h2>
                    <p className="text-slate-600">
                      {profile?.role || authUser?.role || 'Recruiter'}
                    </p>
                  </div>
                </div>
                <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-all">
                  <Settings className="w-4 h-4" />
                  Edit Profile
                </button>
              </div>
            </motion.div>

            {/* Contact Information */}
            <motion.div
              className="rounded-2xl border border-blue-200 p-8 bg-white shadow-sm"
              variants={itemVariants}
            >
              <h3 className="text-lg font-semibold text-blue-600 mb-6">Contact Information</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="flex items-start gap-4">
                  <Mail className="w-5 h-5 text-blue-600 flex-shrink-0 mt-1" />
                  <div>
                    <p className="text-sm text-slate-600 font-semibold mb-1">Email</p>
                    <p className="text-slate-900">{profile?.email || authUser?.email || 'N/A'}</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <Phone className="w-5 h-5 text-blue-600 flex-shrink-0 mt-1" />
                  <div>
                    <p className="text-sm text-slate-600 font-semibold mb-1">Phone</p>
                    <p className="text-slate-900">+1 (555) 000-0000</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <MapPin className="w-5 h-5 text-blue-600 flex-shrink-0 mt-1" />
                  <div>
                    <p className="text-sm text-slate-600 font-semibold mb-1">Location</p>
                    <p className="text-slate-900">New York, USA</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <Briefcase className="w-5 h-5 text-blue-600 flex-shrink-0 mt-1" />
                  <div>
                    <p className="text-sm text-slate-600 font-semibold mb-1">Company</p>
                    <p className="text-slate-900">Your Company Name</p>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Professional Information */}
            <motion.div
              className="rounded-2xl border border-blue-200 p-8 bg-white shadow-sm"
              variants={itemVariants}
            >
              <h3 className="text-lg font-semibold text-blue-600 mb-6">Professional Information</h3>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-slate-600 font-semibold mb-2">Experience</p>
                  <p className="text-slate-900">5+ years in talent acquisition and recruitment</p>
                </div>
                <div>
                  <p className="text-sm text-slate-600 font-semibold mb-2">Specializations</p>
                  <div className="flex flex-wrap gap-2">
                    <span className="px-3 py-1 rounded-full bg-blue-50 text-blue-600 text-sm font-medium">Software Engineering</span>
                    <span className="px-3 py-1 rounded-full bg-blue-50 text-blue-600 text-sm font-medium">Product Management</span>
                    <span className="px-3 py-1 rounded-full bg-blue-50 text-blue-600 text-sm font-medium">Data Science</span>
                  </div>
                </div>
              </div>
            </motion.div>
            </>            ) : (
              <motion.div className="rounded-2xl border border-blue-200 p-8 bg-white" variants={itemVariants}>
                <p className="text-slate-900 font-semibold mb-2">Unable to load profile</p>
                <p className="text-slate-600 text-sm">Please ensure you are logged in and try refreshing the page.</p>
              </motion.div>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  )
}
