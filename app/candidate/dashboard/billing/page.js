'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'

export default function CandidateBillingPage() {
  const [selectedPriceIndex, setSelectedPriceIndex] = useState(0)

  const pricingTiers = [
    { interviews: 50, price: 199 },
    { interviews: 100, price: 300 },
    { interviews: 300, price: 1000 },
    { interviews: 500, price: 2000 },
    { interviews: 1000, price: 3500 },
  ]

  const currentTier = pricingTiers[selectedPriceIndex]

  const fadeInUp = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
  }

  return (
    <div className="p-8 relative z-10">
      {/* Header */}
      <div className="mb-12">
        <h1 className="text-4xl font-bold text-slate-900 mb-2">Billing & Plans</h1>
        <p className="text-slate-600 font-light">Choose the perfect plan for your needs</p>
      </div>

      {/* Pricing Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl">
        {/* Candidate Professional - Left */}
        {[
          {
            name: 'Candidate Professional',
            price: '$9.99',
            description: 'For job seekers who want to practice and improve',
            features: [
              'Unlimited Practice Interviews',
              'HR / Technical / Behavioral / Role-based',
              'Full AI Feedback',
              'Skill Progress Tracking',
              'Certificates',
              'Profile & Resume Analysis',
              'Interview History & Improvement Graphs',
            ],
          },
        ].map((plan, i) => (
          <motion.div
            key={i}
            variants={fadeInUp}
            initial="hidden"
            animate="visible"
            className="relative rounded-2xl transition-all backdrop-blur-sm bg-white/70 border border-[#11cd68]/20 hover:border-[#11cd68]/40 hover:shadow-xl hover:shadow-[#11cd68]/15 flex flex-col w-full"
          >
            <div className="flex flex-col p-12 space-y-7">
              <div className="text-center">
                <h3 className="text-2xl font-semibold mb-2 text-slate-900">{plan.name}</h3>
                <p className="text-sm text-slate-600 font-semibold leading-relaxed">{plan.description}</p>
              </div>
              
              <div className="space-y-1">
                <p className="text-5xl font-bold text-slate-900">{plan.price}<span className="text-slate-600 font-semibold text-base">/month</span></p>
              </div>
              
              <ul className="space-y-6 mt-5 flex-1">
                {plan.features.map((feature, j) => (
                  <li key={j} className="flex items-start gap-3 text-slate-700 text-sm font-semibold leading-relaxed">
                    <div className="w-2.5 h-2.5 rounded-full bg-gradient-to-r from-[#007a78] to-[#11cd68] flex-shrink-0 mt-1" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
              
              <button
                className="w-full py-3 rounded-full font-semibold text-base transition-all border-2 border-[#11cd68]/30 text-slate-900 hover:bg-[#11cd68]/10 hover:border-[#11cd68]/50 mt-5"
              >
                Get Started
              </button>
            </div>
          </motion.div>
        ))}

        {/* Professional - Right */}
        <motion.div
          variants={fadeInUp}
          initial="hidden"
          animate="visible"
          className="relative rounded-2xl transition-all backdrop-blur-sm bg-gradient-to-br from-white/90 to-[#f0fdf4]/80 border-2 border-[#11cd68]/50 shadow-xl shadow-[#11cd68]/25 flex flex-col w-full"
        >
          <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-10">
            <span className="px-5 py-1.5 rounded-full bg-gradient-to-r from-[#007a78] to-[#11cd68] text-white text-xs font-bold">
              Most Popular
            </span>
          </div>

          <div className="flex flex-col flex-1 p-8 space-y-4">
            <div className="text-center">
              <h3 className="text-2xl font-semibold mb-2 text-slate-900">Professional</h3>
              <p className="text-sm text-slate-600 font-semibold leading-relaxed">For Recruiters, Small Businesses, HR Teams</p>
            </div>
            
            {/* Interactive Price Display */}
            <div className="p-6 bg-white/80 rounded-xl space-y-6">
              <div className="text-center space-y-3">
                <p className="text-5xl font-bold text-slate-900">${currentTier.price}</p>
                <p className="text-lg text-slate-700 font-semibold">{currentTier.interviews} interviews /month</p>
              </div>

              {/* Slider Track with Dots */}
              <div className="space-y-4 px-1">
                {/* Track and Dots Container */}
                <div className="relative h-8 flex items-center">
                  {/* Background Track */}
                  <div className="absolute left-0 right-0 h-2 bg-gradient-to-r from-slate-200 to-slate-300 rounded-full" />
                  
                  {/* Progress Track */}
                  <div 
                    className="absolute h-2 bg-gradient-to-r from-[#007a78] to-[#11cd68] rounded-full transition-all duration-300"
                    style={{
                      left: '0%',
                      right: `${100 - (selectedPriceIndex / (pricingTiers.length - 1)) * 100}%`
                    }}
                  />

                  {/* Pricing Dots - Positioned on the line */}
                  <div className="absolute left-0 right-0 flex justify-between">
                    {pricingTiers.map((tier, index) => (
                      <motion.button
                        key={index}
                        onClick={() => setSelectedPriceIndex(index)}
                        className={`relative z-10 transition-all flex-shrink-0 ${
                          selectedPriceIndex === index
                            ? 'w-5 h-5 rounded-full bg-gradient-to-r from-[#007a78] to-[#11cd68] shadow-lg shadow-[#11cd68]/50'
                            : 'w-4 h-4 rounded-full bg-white border-2 border-[#11cd68]/40 hover:border-[#11cd68]/70'
                        }`}
                        whileHover={{ scale: 1.2 }}
                        whileTap={{ scale: 0.9 }}
                      />
                    ))}
                  </div>
                </div>

                {/* Labels Below */}
                <div className="flex justify-between text-xs text-slate-600 font-light px-1">
                  {pricingTiers.map((tier, index) => (
                    <span key={index} className="text-center flex-1">{tier.interviews}</span>
                  ))}
                </div>
              </div>

              {/* Price Breakdown */}
              <div className="text-xs text-slate-600 font-semibold text-center">
                <p>Additional interviews $10 each</p>
              </div>
            </div>

            <ul className="space-y-4 flex-1">
              {[
                '50+ Interviews per month',
                'HR + Technical + Behavioral',
                'AI Feedback & Scoring',
                'Candidate Ranking',
                'Analytics Dashboard',
                'Role Templates',
                'PDF Reports',
                'Priority Support',
              ].map((feature, j) => (
                <li key={j} className="flex items-start gap-3 text-slate-700 text-sm font-semibold leading-relaxed">
                  <div className="w-2.5 h-2.5 rounded-full bg-gradient-to-r from-[#007a78] to-[#11cd68] flex-shrink-0 mt-1" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
            
            <button
              className="w-full py-3 rounded-full font-semibold text-base transition-all bg-gradient-to-r from-[#007a78] to-[#11cd68] text-white hover:shadow-lg hover:shadow-[#11cd68]/40 mt-5"
            >
              Get Started
            </button>
          </div>
        </motion.div>
      </div>

      {/* Info Section */}
      <div className="mt-16 max-w-4xl p-8 bg-white/60 border border-[#11cd68]/20 rounded-2xl">
        <h3 className="text-lg font-semibold text-slate-900 mb-4">Billing Information</h3>
        <ul className="space-y-3 text-slate-700 text-sm font-medium">
          <li>✓ Cancel anytime, no long-term contracts required</li>
          <li>✓ Billing cycle renews monthly on your subscription date</li>
          <li>✓ All plans include 24/7 customer support</li>
          <li>✓ Upgrade or downgrade your plan at any time</li>
        </ul>
      </div>
    </div>
  )
}
