'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Mail, Phone, MapPin, Briefcase, Settings, Save, Upload } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { useSidebar } from '@/context/SidebarContext'
import { supabase } from '@/lib/supabase'
import Sidebar from '@/components/Sidebar'

export default function BusinessProfilePage() {
  const router = useRouter()
  const { user: authUser, isAuthenticated, loading: authLoading } = useAuth()
  const { isOpen: isSidebarOpen } = useSidebar()
  
  const [company, setCompany] = useState(null)
  const [formData, setFormData] = useState({
    name: '',
    industry: '',
    email: '',
    phone: '',
    location: '',
    description: '',
    company_size: '',
    focus_areas: '',
    website: '',
    logo_url: ''
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [message, setMessage] = useState({ type: '', text: '' })

  const userId = authUser?.id

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

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !userId && !isAuthenticated && !authUser) {
      console.log('[BusinessProfile] No authentication found, redirecting to login')
      router.replace('/auth/login')
    }
  }, [authLoading, userId, isAuthenticated, authUser, router])

  useEffect(() => {
    setMounted(true)
  }, [])

  // Load company data
  useEffect(() => {
    if (userId && mounted && !authLoading) {
      loadCompanyData()
    }
  }, [userId, mounted, authLoading])

  const loadCompanyData = async () => {
    try {
      if (!userId) return

      console.log('[BusinessProfile] Loading company data for user:', userId)
      
      const { data: companyData, error } = await supabase
        .from('companies')
        .select('*')
        .eq('owner_id', userId)
        .single()

      if (error && error.code !== 'PGRST116') {
        throw error
      }

      if (companyData) {
        console.log('[BusinessProfile] Company data loaded:', companyData.name)
        setCompany(companyData)
        setFormData({
          name: companyData.name || '',
          industry: companyData.industry || '',
          email: companyData.email || '',
          phone: companyData.phone || '',
          location: companyData.location || '',
          description: companyData.description || '',
          company_size: companyData.company_size || '',
          focus_areas: companyData.focus_areas || '',
          website: companyData.website || '',
          logo_url: companyData.logo_url || ''
        })
      }

      setLoading(false)
    } catch (err) {
      console.error('[BusinessProfile] Error loading company:', err)
      setLoading(false)
    }
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSave = async () => {
    try {
      if (!userId) return
      
      setSaving(true)
      setMessage({ type: '', text: '' })

      console.log('[BusinessProfile] Saving company data...')

      if (company) {
        // Update existing company
        const { error } = await supabase
          .from('companies')
          .update({
            name: formData.name,
            industry: formData.industry,
            email: formData.email,
            phone: formData.phone,
            location: formData.location,
            description: formData.description,
            company_size: formData.company_size,
            focus_areas: formData.focus_areas,
            website: formData.website,
            logo_url: formData.logo_url,
            updated_at: new Date().toISOString()
          })
          .eq('id', company.id)

        if (error) throw error

        setMessage({ type: 'success', text: 'Company profile updated successfully!' })
        console.log('[BusinessProfile] Company updated successfully')
      } else {
        // Create new company
        const { data, error } = await supabase
          .from('companies')
          .insert([{
            owner_id: userId,
            name: formData.name,
            industry: formData.industry,
            email: formData.email,
            phone: formData.phone,
            location: formData.location,
            description: formData.description,
            company_size: formData.company_size,
            focus_areas: formData.focus_areas,
            website: formData.website,
            logo_url: formData.logo_url,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }])
          .select()

        if (error) throw error

        setCompany(data[0])
        setMessage({ type: 'success', text: 'Company profile created successfully!' })
        console.log('[BusinessProfile] Company created successfully')
      }

      setSaving(false)
    } catch (err) {
      console.error('[BusinessProfile] Error saving company:', err)
      setMessage({ type: 'error', text: 'Failed to save company profile. Please try again.' })
      setSaving(false)
    }
  }
  if (!mounted) return null

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-blue-50/30 to-purple-50/20">
      {/* Sidebar */}
      <Sidebar role="company" />

      {/* Fixed background gradients */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-white via-blue-50/30 to-purple-50/20" />
        <div className="absolute top-20 right-1/3 w-[600px] h-[600px] bg-gradient-to-br from-blue-300/40 via-blue-200/20 to-transparent rounded-full blur-3xl opacity-40 animate-pulse" style={{ animation: 'pulse 8s ease-in-out infinite' }} />
        <div className="absolute bottom-1/4 left-1/4 w-[500px] h-[500px] bg-gradient-to-br from-purple-300/30 via-purple-200/15 to-transparent rounded-full blur-3xl opacity-30 animate-pulse" style={{ animation: 'pulse 10s ease-in-out infinite 2s' }} />
      </div>

      {/* Main Content */}
      <div className={`relative z-10 transition-all duration-300 ${isSidebarOpen ? 'ml-64' : 'ml-20'}`}>
        {/* Header */}
        <motion.div
          className="sticky top-0 z-40 border-b border-white/40 bg-white/60 backdrop-blur-2xl"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <div className="px-8 py-5">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-slate-900">
                  Company Profile
                </h1>
                <p className="text-sm text-slate-600 mt-1">
                  Manage your company information and settings
                </p>
              </div>
            </div>
          </div>
        </motion.div>        {/* Page Content */}
        <div className="px-8 py-12">
          <motion.div
            className="space-y-8"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
              {/* Message Alert */}
              {message.text && (
                <motion.div
                  className={`rounded-lg p-4 ${
                    message.type === 'success'
                      ? 'bg-green-50 border border-green-200 text-green-800'
                      : 'bg-red-50 border border-red-200 text-red-800'
                  }`}
                  variants={itemVariants}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  {message.text}
                </motion.div>
              )}

              {/* Profile Card */}
              <motion.div
                className="rounded-2xl border border-white/60 p-8 bg-white/50 backdrop-blur-xl shadow-lg hover:shadow-xl transition-all"
                variants={itemVariants}
              >
                <div className="flex items-start justify-between mb-8">
                  <div className="flex items-center gap-6">
                    <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center">
                      <Briefcase className="w-10 h-10 text-white" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-slate-900 mb-1">
                        {company?.name || 'New Company'}
                      </h2>
                      <p className="text-slate-600">
                        {company?.industry || 'Add industry information'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Company Name & Industry */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Company Name *</label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      placeholder="Enter company name"
                      className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Industry</label>
                    <input
                      type="text"
                      name="industry"
                      value={formData.industry}
                      onChange={handleInputChange}
                      placeholder="e.g., Technology, Finance"
                      className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all"
                    />
                  </div>
                </div>
              </motion.div>

              {/* Contact Information */}
              <motion.div
                className="rounded-2xl border border-white/60 p-8 bg-white/50 backdrop-blur-xl shadow-lg"
                variants={itemVariants}
              >
                <h3 className="text-lg font-semibold text-slate-900 mb-6 flex items-center gap-2">
                  <Mail className="w-5 h-5 text-blue-600" />
                  Contact Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Email</label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      placeholder="contact@company.com"
                      className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Phone</label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      placeholder="+1 (555) 000-0000"
                      className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Location</label>
                    <input
                      type="text"
                      name="location"
                      value={formData.location}
                      onChange={handleInputChange}
                      placeholder="City, Country"
                      className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Website</label>
                    <input
                      type="url"
                      name="website"
                      value={formData.website}
                      onChange={handleInputChange}
                      placeholder="https://company.com"
                      className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all"
                    />
                  </div>
                </div>
              </motion.div>

              {/* Company Details */}
              <motion.div
                className="rounded-2xl border border-white/60 p-8 bg-white/50 backdrop-blur-xl shadow-lg"
                variants={itemVariants}
              >
                <h3 className="text-lg font-semibold text-slate-900 mb-6 flex items-center gap-2">
                  <Briefcase className="w-5 h-5 text-purple-600" />
                  Company Details
                </h3>
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Company Description</label>
                    <textarea
                      name="description"
                      value={formData.description}
                      onChange={handleInputChange}
                      placeholder="Tell us about your company..."
                      rows={4}
                      className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all resize-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Company Size</label>
                    <select
                      name="company_size"
                      value={formData.company_size}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all"
                    >
                      <option value="">Select company size</option>
                      <option value="1-10">1-10 employees</option>
                      <option value="11-50">11-50 employees</option>
                      <option value="51-100">51-100 employees</option>
                      <option value="101-500">101-500 employees</option>
                      <option value="501-1000">501-1000 employees</option>
                      <option value="1000+">1000+ employees</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Focus Areas</label>
                    <input
                      type="text"
                      name="focus_areas"
                      value={formData.focus_areas}
                      onChange={handleInputChange}
                      placeholder="e.g., Software Engineering, Product Management, Data Science (comma-separated)"
                      className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all"
                    />
                  </div>
                </div>
              </motion.div>

              {/* Save Button */}
              <motion.div
                className="flex justify-end gap-4"
                variants={itemVariants}
              >
                <button
                  onClick={() => router.back()}
                  className="px-6 py-2 rounded-lg border border-slate-200 text-slate-700 font-semibold hover:bg-slate-50 transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="px-6 py-2 rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2"
                >
                  <Save className="w-4 h-4" />                  {saving ? 'Saving...' : 'Save Profile'}
                </button>
              </motion.div>
            </motion.div>
        </div>
      </div>
    </div>
  )
}
