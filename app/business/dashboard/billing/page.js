'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { CreditCard, Check } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { useSidebar } from '@/context/SidebarContext'
import Sidebar from '@/components/Sidebar'
import { supabase } from '@/lib/supabase'

export default function BusinessBillingPage() {
  const router = useRouter()
  const { user: authUser, isAuthenticated, loading: authLoading } = useAuth()
  const { isOpen: isSidebarOpen } = useSidebar()

  const [subscription, setSubscription] = useState(null)
  const [loading, setLoading] = useState(true)
  const [mounted, setMounted] = useState(false)

  const userId = authUser?.id

  useEffect(() => {
    if (!authLoading && !userId && !isAuthenticated && !authUser) {
      router.replace('/auth/login')
    }
  }, [authLoading, userId, isAuthenticated, authUser, router])

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (userId && mounted && !authLoading) {
      loadSubscription()
    }
  }, [userId, mounted, authLoading])

  const loadSubscription = async () => {
    try {
      if (!userId) return
      const { data: subData } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', userId)
        .single()
      setSubscription(subData || null)
    } catch (error) {
      console.error('[BusinessBilling] Error loading subscription:', error)
      setSubscription(null)
    } finally {
      setLoading(false)
    }
  }

  const pricingTiers = [
    { interviews: 50, price: 199 },
    { interviews: 100, price: 300 },
    { interviews: 300, price: 1000 },
    { interviews: 500, price: 2000 },
    { interviews: 1000, price: 3500 },
  ]

  const fadeInUp = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
  }

  if (!mounted || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#f0fdf4] via-white to-[#ecfdf5]">
        <Sidebar role="company" />
        <div className={`ml-20 lg:${isSidebarOpen ? 'ml-64' : 'ml-20'} transition-all duration-300 flex items-center justify-center min-h-screen`}>
          <p className="text-slate-600">Loading billing information...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f0fdf4] via-white to-[#ecfdf5]">
      <Sidebar role="company" />
      <div className="fixed inset-0 pointer-events-none opacity-30">
        <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-gradient-to-b from-[#11cd68]/20 to-transparent rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-gradient-to-t from-[#007a78]/15 to-transparent rounded-full blur-3xl" />
      </div>
      <div className={`transition-all duration-300 ${isSidebarOpen ? 'ml-64' : 'ml-20'}`}>
        <motion.div className="sticky top-0 z-40 border-b border-[#11cd68]/20 bg-[#007a78]/95 backdrop-blur-md" initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
          <div className="px-8 py-5">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-white">Billing & Plans</h1>
                <p className="text-sm text-[#d1f2eb] mt-1">Manage your subscription and billing</p>
              </div>
            </div>
          </div>
        </motion.div>
        <div className="px-8 py-12 relative z-10">
          {subscription ? (
            <motion.div variants={fadeInUp} initial="hidden" animate="visible" className="bg-white rounded-lg border border-[#11cd68]/20 p-8 mb-12">
              <div className="flex items-center gap-4 mb-6">
                <CreditCard className="w-8 h-8 text-[#11cd68]" />
                <h2 className="text-2xl font-bold text-slate-900">Current Subscription</h2>
              </div>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <p className="text-sm text-slate-600 mb-2">Plan Name</p>
                  <p className="text-lg font-semibold text-slate-900">{subscription.plan_name || 'Standard'}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-600 mb-2">Interviews Available</p>
                  <p className="text-lg font-semibold text-slate-900">{subscription.interview_limit || '∞'}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-600 mb-2">Status</p>
                  <span className="inline-block px-3 py-1 rounded-full text-sm font-semibold bg-green-100 text-green-800">
                    {subscription.status || 'Active'}
                  </span>
                </div>
                <div>
                  <p className="text-sm text-slate-600 mb-2">Renewal Date</p>
                  <p className="text-lg font-semibold text-slate-900">
                    {subscription.renewal_date ? new Date(subscription.renewal_date).toLocaleDateString() : 'N/A'}
                  </p>
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div variants={fadeInUp} initial="hidden" animate="visible" className="bg-yellow-50 border border-yellow-200 rounded-lg p-8 mb-12">
              <p className="text-yellow-800 mb-4">No active subscription found.</p>
              <p className="text-yellow-700 text-sm">Choose a plan below to get started.</p>
            </motion.div>
          )}
          <h3 className="text-2xl font-bold text-slate-900 mb-6">Available Plans</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {pricingTiers.map((tier, i) => (
              <motion.div key={i} variants={fadeInUp} initial="hidden" animate="visible" transition={{ delay: i * 0.1 }} className="rounded-lg border border-[#11cd68]/20 p-6 bg-white hover:shadow-lg transition-all">
                <h4 className="text-lg font-semibold text-slate-900 mb-2">{tier.interviews} Interviews</h4>
                <p className="text-3xl font-bold text-[#007a78] mb-4">
                  ${tier.price}<span className="text-sm text-slate-600">/month</span>
                </p>
                <ul className="space-y-3 mb-6">
                  <li className="flex items-center gap-2 text-sm text-slate-700">
                    <Check className="w-4 h-4 text-[#11cd68]" />
                    {tier.interviews} interviews per month
                  </li>
                  <li className="flex items-center gap-2 text-sm text-slate-700">
                    <Check className="w-4 h-4 text-[#11cd68]" />
                    Full AI feedback
                  </li>
                  <li className="flex items-center gap-2 text-sm text-slate-700">
                    <Check className="w-4 h-4 text-[#11cd68]" />
                    Priority support
                  </li>
                </ul>
                <button className="w-full py-2 rounded-lg bg-[#11cd68] text-white font-semibold hover:bg-[#0fb359] transition-all">
                  Subscribe Now
                </button>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
