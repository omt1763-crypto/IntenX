'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { supabase } from '@/lib/supabase'
import CandidateSidebar from '@/components/CandidateSidebar'
import { User, Mail, MapPin, Briefcase, Award, Edit2, Save, X } from 'lucide-react'

export default function MyProfilePage() {
  const router = useRouter()
  const { user, session, loading: authLoading } = useAuth()
  
  const [profile, setProfile] = useState(null)
  const [isEditing, setIsEditing] = useState(false)
  const [loading, setLoading] = useState(true)
  const [formData, setFormData] = useState({
    headline: '',
    location: '',
    bio: '',
    experience_years: 0,
    skills: [],
    education: [],
    portfolio_url: '',
    github_url: '',
    linkedin_url: ''
  })
  const [email, setEmail] = useState('')
  const [firstName, setFirstName] = useState('')
  const [userId, setUserId] = useState(null)

  // Wait for auth to load, then load profile
  useEffect(() => {
    if (authLoading) {
      console.log('⏳ Waiting for auth context...')
      return
    }

    if (!user || !session) {
      console.warn('❌ Not logged in - redirecting to login')
      router.push('/auth/login')
      return
    }

    loadProfileOnMount()
  }, [authLoading, user, session])

  const loadProfileOnMount = async () => {
    try {
      console.log('=== Starting profile load ===')
      
      // User info comes from AuthContext (already authenticated)
      const currentUserId = user.id
      const currentEmail = user.email
      const currentName = user.user_metadata?.full_name || currentEmail?.split('@')[0] || 'User'

      console.log('✅ User logged in:', { currentUserId, currentEmail, currentName })
      
      // Set user info immediately
      setUserId(currentUserId)
      setEmail(currentEmail)
      setFirstName(currentName)
      
      // Stop loading immediately - don't wait for database
      setLoading(false)

      // Load profile from database in background (non-blocking, fire and forget)
      supabase
        .from('candidate_profiles')
        .select('*')
        .eq('id', currentUserId)
        .maybeSingle()
        .then(({ data: profileData, error: profileError }) => {
          if (!profileError && profileData) {
            console.log('✅ Profile loaded:', profileData)
            setProfile(profileData)
            setFormData(profileData)
          } else if (profileError) {
            console.warn('⚠️ Database error:', profileError.message)
          } else {
            console.log('No profile found - user can create one on save')
          }
        })
        .catch(err => console.warn('⚠️ Profile load error:', err.message))
    } catch (err) {
      console.error('Error loading profile:', err)
      setLoading(false)
    }
  }

  const handleSave = async () => {
    try {
      if (!userId) {
        alert('Please log in again to save your profile')
        return
      }

      console.log('Saving profile for user:', userId)

      if (profile?.id) {
        // Update existing profile
        console.log('Updating existing profile...')
        const { error } = await supabase
          .from('candidate_profiles')
          .update(formData)
          .eq('id', userId)
        
        if (error) {
          console.error('Update error:', error)
          alert('Error updating profile: ' + error.message)
          return
        }
        console.log('✅ Profile updated')
      } else {
        // Create new profile
        console.log('Creating new profile...')
        const { data, error } = await supabase
          .from('candidate_profiles')
          .insert([{
            id: userId,
            ...formData
          }])
          .select()
          .single()
        
        if (error) {
          console.error('Insert error:', error)
          alert('Error saving profile: ' + error.message)
          return
        }
        console.log('✅ Profile created:', data)
        setProfile(data)
      }

      setIsEditing(false)
      alert('✅ Profile saved successfully!')
    } catch (err) {
      console.error('Save error:', err)
      alert('Error: ' + err.message)
    }
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-white to-cyan-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-cyan-500 mx-auto mb-4"></div>
          <p className="text-slate-600 font-semibold">
            {authLoading ? 'Verifying your login...' : 'Loading your profile...'}
          </p>
          {email && <p className="text-sm text-slate-500 mt-2">Email: {email}</p>}
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-white to-cyan-50">
      <CandidateSidebar />
      {/* Sidebar Spacing */}
      <div className="ml-64 pt-8 pb-16">
        <div className="px-8 lg:px-12">
          {/* Header */}
          <div className="mb-12">
            <h1 className="text-5xl font-bold text-slate-900 mb-2">My Profile</h1>
            <p className="text-lg text-slate-600 font-light">Manage your professional information</p>
          </div>

          {/* Profile Overview Card */}
          <div className="mb-8 rounded-3xl overflow-hidden backdrop-blur-xl bg-gradient-to-br from-white/50 to-cyan-50/30 border border-white/60 shadow-lg">
            <div className="p-8 lg:p-12">
              <div className="flex items-start justify-between">
                <div className="flex gap-6 flex-1">
                  {/* Avatar */}
                  <div className="flex-shrink-0">
                    <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-purple-500 to-cyan-400 flex items-center justify-center text-white shadow-lg">
                      <User className="w-12 h-12" />
                    </div>
                  </div>
                  
                  {/* Profile Summary */}
                  <div className="flex-1">
                    <h2 className="text-3xl font-bold text-slate-900">{firstName || 'Your Name'}</h2>
                    <p className="text-cyan-600 font-semibold mt-1">{formData.headline || 'Add your job title'}</p>
                    <p className="text-slate-600 mt-3 flex items-center gap-2">
                      <MapPin className="w-4 h-4" />
                      {formData.location || 'Add your location'}
                    </p>
                    <div className="flex gap-4 mt-4">
                      <div className="px-4 py-2 rounded-full bg-cyan-50 text-cyan-700 text-sm font-semibold">
                        ★ 5 Interviews
                      </div>
                      <div className="px-4 py-2 rounded-full bg-purple-50 text-purple-700 text-sm font-semibold">
                        🏆 2 Certificates
                      </div>
                    </div>
                  </div>
                </div>

                {/* Edit Button */}
                <button
                  onClick={() => setIsEditing(!isEditing)}
                  className="p-3 rounded-xl bg-gradient-to-r from-purple-500 to-cyan-400 border border-purple-400 text-white hover:bg-cyan-500 transition-all flex items-center gap-2"
                >
                  {isEditing ? <X className="w-5 h-5" /> : <Edit2 className="w-5 h-5" />}
                </button>
              </div>
            </div>
          </div>

          {/* Contact & Professional Info Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            {/* Contact Information */}
            <div className="rounded-3xl p-8 backdrop-blur-xl bg-white/50 border border-white/60 shadow-lg">
              <h3 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
                <Mail className="w-5 h-5 text-cyan-500" />
                Contact Information
              </h3>
              
              <div className="space-y-6">
                {/* Email - READ ONLY */}
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-3">Email Address</label>
                  <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-slate-50 border border-slate-200">
                    <Mail className="w-5 h-5 text-slate-400" />
                    <input
                      type="email"
                      value={email || 'Loading...'}
                      disabled
                      className="flex-1 bg-transparent text-slate-900 outline-none font-medium"
                    />
                  </div>
                  <p className="text-xs text-slate-500 mt-2">Cannot be changed (linked to account)</p>
                </div>
              </div>
            </div>

            {/* Location & Professional Info */}
            <div className="rounded-3xl p-8 backdrop-blur-xl bg-white/50 border border-white/60 shadow-lg">
              <h3 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
                <Briefcase className="w-5 h-5 text-purple-500" />
                Professional Info
              </h3>
              
              <div className="space-y-6">
                {/* Job Title / Headline */}
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-3">Headline / Job Title</label>
                  <input
                    type="text"
                    value={formData.headline || ''}
                    onChange={(e) => setFormData({ ...formData, headline: e.target.value })}
                    disabled={!isEditing}
                    className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 outline-none font-medium disabled:opacity-60"
                    placeholder="e.g., Senior Developer"
                  />
                </div>

                {/* Location */}
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-3">Location</label>
                  <input
                    type="text"
                    value={formData.location || ''}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    disabled={!isEditing}
                    className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 outline-none font-medium disabled:opacity-60"
                    placeholder="City, Country"
                  />
                </div>

                {/* Years of Experience */}
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-3">Years of Experience</label>
                  <input
                    type="number"
                    value={formData.experience_years || 0}
                    onChange={(e) => setFormData({ ...formData, experience_years: parseInt(e.target.value) || 0 })}
                    disabled={!isEditing}
                    className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 outline-none font-medium disabled:opacity-60"
                    placeholder="0"
                    min="0"
                    max="99"
                  />
                </div>
              </div>
            </div>

            {/* Links & Bio */}
            <div className="rounded-3xl p-8 backdrop-blur-xl bg-white/50 border border-white/60 shadow-lg">
              <h3 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
                <Award className="w-5 h-5 text-cyan-500" />
                Links & Bio
              </h3>
              
              <div className="space-y-6">
                {/* Portfolio URL */}
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-3">Portfolio URL</label>
                  <input
                    type="url"
                    value={formData.portfolio_url || ''}
                    onChange={(e) => setFormData({ ...formData, portfolio_url: e.target.value })}
                    disabled={!isEditing}
                    className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 outline-none font-medium disabled:opacity-60"
                    placeholder="https://example.com"
                  />
                </div>

                {/* GitHub URL */}
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-3">GitHub URL</label>
                  <input
                    type="url"
                    value={formData.github_url || ''}
                    onChange={(e) => setFormData({ ...formData, github_url: e.target.value })}
                    disabled={!isEditing}
                    className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 outline-none font-medium disabled:opacity-60"
                    placeholder="https://github.com/username"
                  />
                </div>

                {/* LinkedIn URL */}
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-3">LinkedIn URL</label>
                  <input
                    type="url"
                    value={formData.linkedin_url || ''}
                    onChange={(e) => setFormData({ ...formData, linkedin_url: e.target.value })}
                    disabled={!isEditing}
                    className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 outline-none font-medium disabled:opacity-60"
                    placeholder="https://linkedin.com/in/username"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Bio Section */}
          <div className="rounded-3xl p-8 backdrop-blur-xl bg-white/50 border border-white/60 shadow-lg mb-8">
            <h3 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
              <Award className="w-5 h-5 text-purple-500" />
              About You
            </h3>
            
            <div className="border-2 rounded-xl overflow-hidden transition-all"
              style={{
                borderColor: isEditing ? '#7c3aed' : '#e2e8f0',
                backgroundColor: isEditing ? 'rgba(124, 58, 237, 0.05)' : '#f8fafc'
              }}>
              <textarea
                value={formData.bio || ''}
                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                disabled={!isEditing}
                className="w-full px-4 py-3 bg-transparent text-slate-900 outline-none font-medium resize-none disabled:opacity-60"
                rows="5"
                placeholder="Tell us about yourself, your experience, and career goals..."
              />
            </div>
            <p className="text-xs text-slate-500 mt-2">Share information about your professional background and interests</p>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4 justify-end">
            {isEditing && (
              <>
                <button
                  onClick={() => {
                    setIsEditing(false)
                    setFormData(profile || {})
                  }}
                  className="px-6 py-3 rounded-xl border-2 border-slate-300 text-slate-900 font-semibold hover:bg-slate-50 transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  className="px-6 py-3 rounded-xl bg-gradient-to-r from-purple-500 to-cyan-400 border-2 border-purple-400 text-white font-semibold hover:bg-cyan-500 transition-all flex items-center gap-2"
                >
                  <Save className="w-5 h-5" />
                  Save Changes
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
