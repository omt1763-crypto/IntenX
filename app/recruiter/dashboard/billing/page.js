'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useSidebar } from '@/context/SidebarContext'
import Sidebar from '@/components/Sidebar'
import { supabase } from '@/lib/supabase'

export default function RecruiterBillingPage() {
  const { isOpen: isSidebarOpen } = useSidebar()
  const [isMonthly, setIsMonthly] = useState(true)
  const [session, setSession] = useState(null)

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session)
      }
    )
    return () => subscription?.unsubscribe()
  }, [])

  const professionalPlans = [
    { interviews: 50, monthlyPrice: 199, yearlyPrice: 1990 },
    { interviews: 100, monthlyPrice: 300, yearlyPrice: 3000 },
    { interviews: 300, monthlyPrice: 1000, yearlyPrice: 10000 },
    { interviews: 500, monthlyPrice: 2000, yearlyPrice: 20000 },
    { interviews: 1000, monthlyPrice: 3500, yearlyPrice: 35000 },
  ]

  const fadeInUp = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-blue-50/30 to-purple-50/20">
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
                <h1 className="text-3xl font-bold text-white">Professional Plans</h1>
                <p className="text-sm text-blue-100 mt-1">Choose the perfect plan for your recruitment needs</p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Page Content */}
        <div className="px-8 py-12 relative z-10">
          {/* Monthly/Yearly Toggle */}
          <motion.div 
            className="flex items-center justify-center gap-4 mb-12"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <span className={`text-lg font-semibold ${isMonthly ? 'text-slate-900' : 'text-slate-600'}`}>Monthly</span>
            <button
              onClick={() => setIsMonthly(!isMonthly)}
              className={`relative inline-flex h-10 w-20 items-center rounded-full transition-all duration-300 ${
                isMonthly 
                  ? 'bg-gradient-to-r from-blue-600 to-blue-700' 
                  : 'bg-gradient-to-r from-purple-600 to-purple-700'
              }`}
            >
              <motion.div
                className="h-8 w-8 rounded-full bg-white shadow-lg"
                animate={{ x: isMonthly ? 4 : 36 }}
                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
              />
            </button>
            <span className={`text-lg font-semibold ${!isMonthly ? 'text-slate-900' : 'text-slate-600'}`}>Yearly</span>
            {!isMonthly && <span className="ml-2 px-3 py-1 bg-green-100 text-green-700 text-xs font-bold rounded-full">Save 10%</span>}
          </motion.div>

          {/* Pricing Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto mb-16">
            {professionalPlans.map((plan, i) => (
              <motion.div
                key={i}
                variants={fadeInUp}
                initial="hidden"
                animate="visible"
                transition={{ delay: i * 0.1 }}
                className="relative rounded-2xl transition-all backdrop-blur-sm bg-white border-2 border-blue-200 hover:border-blue-500 hover:shadow-2xl hover:shadow-blue-500/20 flex flex-col h-full"
              >
                {/* Most Popular Badge - for the middle option */}
                {i === 2 && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-10">
                    <span className="px-4 py-1.5 rounded-full bg-gradient-to-r from-blue-600 to-blue-700 text-white text-xs font-bold">
                      Most Popular
                    </span>
                  </div>
                )}

                <div className="flex flex-col flex-1 p-8 space-y-6">
                  {/* Interview Count */}
                  <div className="text-center">
                    <p className="text-5xl font-bold text-slate-900">{plan.interviews}</p>
                    <p className="text-sm text-slate-600 font-semibold mt-2">Interviews per month</p>
                  </div>

                  {/* Price */}
                  <div className="text-center space-y-2 py-6 bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl">
                    <p className="text-4xl font-bold text-slate-900">
                      ${isMonthly ? plan.monthlyPrice : plan.yearlyPrice}
                    </p>
                    <p className="text-sm text-slate-600 font-semibold">
                      {isMonthly ? '/month' : '/year'}
                    </p>
                    {!isMonthly && (
                      <p className="text-xs text-green-600 font-semibold">
                        ${(plan.yearlyPrice / 12).toFixed(0)}/month when billed yearly
                      </p>
                    )}
                  </div>

                  {/* Features */}
                  <ul className="space-y-4 flex-1">
                    {[
                      `${plan.interviews} total interviews`,
                      'HR + Technical + Behavioral',
                      'AI Feedback & Scoring',
                      'Candidate Ranking',
                      'Analytics Dashboard',
                      'Role Templates',
                      'PDF Reports',
                      'Priority Support',
                    ].map((feature, j) => (
                      <li key={j} className="flex items-start gap-3 text-slate-700 text-sm font-medium">
                        <div className="w-2.5 h-2.5 rounded-full bg-gradient-to-r from-blue-600 to-blue-700 flex-shrink-0 mt-1.5" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>

                  {/* CTA Button */}
                  <button
                    className={`w-full py-3 rounded-xl font-semibold text-base transition-all mt-6 ${
                      i === 2
                        ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:shadow-lg hover:shadow-blue-500/40'
                        : 'border-2 border-blue-300 text-slate-900 hover:bg-blue-50 hover:border-blue-500'
                    }`}
                  >
                    Get Started
                  </button>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Info Section */}
          <motion.div 
            className="max-w-4xl mx-auto p-8 bg-white border border-blue-200 rounded-2xl"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
          >
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Billing Information</h3>
            <ul className="space-y-3 text-slate-700 text-sm font-medium">
              <li>✓ Cancel anytime, no long-term contracts required</li>
              <li>✓ Billing cycle renews {isMonthly ? 'monthly' : 'yearly'} on your subscription date</li>
              <li>✓ All plans include 24/7 customer support</li>
              <li>✓ Upgrade or downgrade your plan at any time</li>
              <li>✓ Additional interviews available at $10 per interview</li>
            </ul>
          </motion.div>
        </div>
      </div>
    </div>
  )
}
