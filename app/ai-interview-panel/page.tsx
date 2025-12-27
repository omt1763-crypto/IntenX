'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ChevronRight, Zap, Brain, Target, Users, TrendingUp, Sparkles, Play } from 'lucide-react'

export default function AIInterviewPanel() {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })
  const [scrollPosition, setScrollPosition] = useState(0)

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY })
    }
    
    const handleScroll = () => {
      setScrollPosition(window.scrollY)
    }

    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('scroll', handleScroll)
    
    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('scroll', handleScroll)
    }
  }, [])

  const interviewTypes = [
    {
      id: 1,
      title: 'HR Round',
      description: 'Practice common HR questions with AI feedback',
      icon: Users,
      color: 'from-blue-500 to-cyan-500',
      accent: 'blue'
    },
    {
      id: 2,
      title: 'Technical Round',
      description: 'Deep dive into technical concepts and coding',
      icon: Brain,
      color: 'from-purple-500 to-pink-500',
      accent: 'purple'
    },
    {
      id: 3,
      title: 'Behavioral',
      description: 'Master behavioral patterns with real scenarios',
      icon: Target,
      color: 'from-violet-500 to-purple-500',
      accent: 'violet'
    },
    {
      id: 4,
      title: 'Role-Based',
      description: 'Industry-specific interview preparation',
      icon: Zap,
      color: 'from-orange-500 to-red-500',
      accent: 'orange'
    }
  ]

  const [recentAttempts, setRecentAttempts] = useState([])
  const [averageScore, setAverageScore] = useState(0)
  const [totalInterviews, setTotalInterviews] = useState(0)
  useEffect(() => {
    async function fetchInterviews() {
      try {
        const res = await fetch('/api/interviews?userId=' + (typeof window !== 'undefined' ? localStorage.getItem('user_id') || '' : ''))
        const data = await res.json()
        if (data.success && Array.isArray(data.data)) {
          setRecentAttempts(
            data.data.map((item, idx) => ({
              id: item.id || idx,
              type: item.title || 'Interview',
              score: item.score !== undefined ? (typeof item.score === 'number' ? item.score : parseFloat(item.score)) : 0,
              date: item.timestamp ? new Date(item.timestamp).toLocaleString() : '',
              status: item.score >= 80 ? 'excellent' : item.score >= 60 ? 'good' : 'average',
            }))
          )
          setTotalInterviews(data.data.length)
          if (data.data.length > 0) {
            const avg = data.data.reduce((sum, i) => sum + (typeof i.score === 'number' ? i.score : parseFloat(i.score)), 0) / data.data.length
            setAverageScore(Math.round(avg * 10) / 10)
          } else {
            setAverageScore(0)
          }
        }
      } catch (e) {
        // fallback: do nothing
      }
    }
    fetchInterviews()
  }, [])

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950">
      {/* Animated background elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        {/* Radial gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950" />
        
        {/* Glow blobs */}
        <div className="absolute top-20 right-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl animate-blob" />
        <div className="absolute bottom-20 left-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-blob animation-delay-2000" />
        <div className="absolute top-1/2 left-1/3 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl animate-blob animation-delay-4000" />
        
        {/* Noise texture */}
        <div 
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox="0 0 400 400" xmlns="http://www.w3.org/2000/svg"%3E%3Cfilter id="noiseFilter"%3E%3CfeTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="4" result="noise" /%3E%3C/filter%3E%3Crect width="400" height="400" filter="url(%23noiseFilter)" opacity="0.1"/%3E%3C/svg%3E")',
            backgroundRepeat: 'repeat'
          }}
        />
        
        {/* Mouse-follow gradient */}
        <div
          className="absolute w-96 h-96 bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-full blur-3xl transition-all duration-300"
          style={{
            left: `${mousePosition.x - 192}px`,
            top: `${mousePosition.y - 192}px`,
            opacity: 0.5
          }}
        />
      </div>

      {/* Content */}
      <div className="relative z-10">
        {/* Navigation Bar */}
        <nav className="fixed top-0 w-full z-50 backdrop-blur-xl bg-slate-950/40 border-b border-white/10">
          <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
            {/* Logo */}
            <div className="flex items-center gap-2 group cursor-pointer">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg blur-lg opacity-75 group-hover:opacity-100 transition-opacity" />
                <div className="relative bg-slate-900 px-3 py-2 rounded-lg">
                  <Sparkles className="w-6 h-6 text-transparent bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text fill-current" />
                </div>
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                InterviewVerse AI
              </span>
            </div>

            {/* Menu Items */}
            <div className="hidden md:flex items-center gap-8">
              <a href="#practice" className="text-slate-300 hover:text-white transition-colors">Practice</a>
              <a href="#analytics" className="text-slate-300 hover:text-white transition-colors">Analytics</a>
              <a href="#resources" className="text-slate-300 hover:text-white transition-colors">Resources</a>
            </div>

            {/* Profile Avatar */}
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center cursor-pointer hover:shadow-lg hover:shadow-purple-500/50 transition-all">
              <span className="text-white font-bold text-sm">A</span>
            </div>
          </div>
        </nav>

        {/* Hero Section */}
        <section className="pt-32 pb-20 px-6">
          <div className="max-w-6xl mx-auto text-center">
            {/* Welcome text with animation */}
            <div className="mb-6 inline-block">
              <div className="px-4 py-2 rounded-full bg-white/10 backdrop-blur-xl border border-white/20 hover:bg-white/20 transition-all duration-300">
                <span className="text-sm text-transparent bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text font-semibold flex items-center gap-2">
                  <span className="w-2 h-2 bg-blue-400 rounded-full animate-pulse" />
                  Powered by Advanced AI
                </span>
              </div>
            </div>

            {/* Main heading */}
            <h1 className="text-6xl md:text-7xl font-black mb-6 tracking-tight leading-tight">
              <span className="text-white">Master Your</span>
              <br />
              <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent animate-gradient">
                Interview Skills
              </span>
            </h1>

            {/* Subheading */}
            <p className="text-xl md:text-2xl text-slate-300 mb-8 max-w-3xl mx-auto leading-relaxed">
              Practice interviews with real-time AI feedback, get instant insights, and build confidence for your dream role
            </p>

            {/* CTA Button */}
            <div className="flex gap-4 justify-center flex-wrap">
              <button className="group relative px-8 py-4 rounded-xl font-semibold overflow-hidden">
                {/* Glow background */}
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-500 opacity-100 group-hover:opacity-110 transition-opacity blur-xl" />
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                
                {/* Content */}
                <div className="relative flex items-center gap-2 text-white">
                  <Play className="w-5 h-5" />
                  Start Practice Now
                  <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </button>

              <button className="px-8 py-4 rounded-xl font-semibold border border-white/30 bg-white/5 backdrop-blur-xl hover:bg-white/10 hover:border-white/50 transition-all text-white">
                View Analytics
              </button>
            </div>

            {/* Stats row */}
            <div className="mt-16 grid grid-cols-3 gap-4 md:gap-8 max-w-2xl mx-auto">
              {[
                { label: '10K+', desc: 'Active Users' },
                { label: '50K+', desc: 'Interviews' },
                { label: '4.9★', desc: 'Rating' }
              ].map((stat, idx) => (
                <div key={idx} className="group">
                  <div className="text-2xl md:text-3xl font-bold text-transparent bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text group-hover:scale-110 transition-transform">
                    {stat.label}
                  </div>
                  <p className="text-slate-400 text-sm mt-1">{stat.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Interview Types Grid */}
        <section id="practice" className="py-20 px-6 scroll-mt-20">
          <div className="max-w-6xl mx-auto">
            {/* Section heading */}
            <div className="text-center mb-16">
              <h2 className="text-5xl font-black mb-4 text-white">
                Choose Your Interview Type
              </h2>
              <p className="text-slate-400 text-lg">
                Select the interview format that matches your preparation needs
              </p>
            </div>

            {/* Cards grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {interviewTypes.map((interview, idx) => {
                const Icon = interview.icon
                return (
                  <div
                    key={interview.id}
                    className="group relative overflow-hidden rounded-2xl transition-all duration-300 hover:translate-y-[-4px] cursor-pointer"
                    style={{
                      animation: `slideUp 0.6s ease-out ${idx * 0.1}s both`
                    }}
                  >
                    {/* Glow border on hover */}
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 to-purple-500/20 opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl blur" />

                    {/* Glass card background */}
                    <div className="relative backdrop-blur-2xl bg-white/10 border border-white/20 group-hover:border-white/40 transition-all rounded-2xl p-8 h-full flex flex-col">
                      {/* Icon */}
                      <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${interview.color} p-3 mb-6 group-hover:scale-110 transition-transform`}>
                        <Icon className="w-full h-full text-white" />
                      </div>

                      {/* Title */}
                      <h3 className="text-2xl font-bold text-white mb-3">
                        {interview.title}
                      </h3>

                      {/* Description */}
                      <p className="text-slate-400 text-sm mb-6 flex-grow">
                        {interview.description}
                      </p>

                      {/* Button */}
                      <button className={`w-full py-3 rounded-lg font-semibold text-white bg-gradient-to-r ${interview.color} opacity-90 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 group-hover:shadow-lg shadow-none`} style={{
                        boxShadow: `0 0 20px rgba(59, 130, 246, 0.3)`
                      }}>
                        <Play className="w-4 h-4" />
                        Start Now
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </section>

        {/* Analytics Section */}
        <section id="analytics" className="py-20 px-6 scroll-mt-20">
          <div className="max-w-6xl mx-auto">
            {/* Section heading */}
            <div className="mb-12">
              <h2 className="text-5xl font-black mb-4 text-white">
                Your Performance Analytics
              </h2>
              <p className="text-slate-400 text-lg">
                Track your progress and identify improvement areas
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Large chart card */}
              <div className="lg:col-span-2 group">
                <div className="relative overflow-hidden rounded-3xl h-80 backdrop-blur-2xl bg-white/10 border border-white/20 group-hover:border-white/40 transition-all p-8">
                  {/* Chart placeholder with grid */}
                  <div className="h-full flex flex-col">
                    <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                      <TrendingUp className="w-5 h-5 text-blue-400" />
                      Performance Trend
                    </h3>
                    
                    {/* Chart bars */}
                    <div className="flex-1 flex items-end justify-between gap-2">
                      {[65, 72, 68, 82, 75, 88, 92].map((height, idx) => (
                        <div key={idx} className="flex-1 flex flex-col items-center gap-2 group/bar">
                          <div className="relative w-full h-48 flex items-end justify-center overflow-hidden rounded-lg bg-white/5">
                            <div 
                              className="w-full bg-gradient-to-t from-blue-500 to-purple-500 transition-all duration-300 group-hover/bar:from-blue-400 group-hover/bar:to-purple-400 rounded-t-lg opacity-80 hover:opacity-100"
                              style={{ height: `${height}%` }}
                            />
                            <div className="absolute inset-0 rounded-lg border border-white/10" />
                          </div>
                          <span className="text-xs text-slate-400">Week {idx + 1}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Gradient overlay */}
                  <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-blue-500/20 to-transparent blur-3xl -z-10 group-hover:scale-125 transition-transform" />
                </div>
              </div>

              {/* Stats cards column */}
              <div className="flex flex-col gap-6">
                <div className="group flex-1 relative overflow-hidden rounded-2xl backdrop-blur-2xl bg-white/10 border border-white/20 group-hover:border-white/40 transition-all p-6 hover:translate-y-[-2px]">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-blue-500 to-cyan-500 opacity-10 rounded-full blur-2xl group-hover:opacity-20 transition-opacity" />
                  <div className="relative">
                    <p className="text-slate-400 text-sm font-semibold mb-2">Total Interviews</p>
                    <div className="flex items-end gap-3">
                      <span className="text-3xl font-black text-white">{totalInterviews}</span>
                      <span className="text-2xl">🎯</span>
                    </div>
                  </div>
                </div>
                <div className="group flex-1 relative overflow-hidden rounded-2xl backdrop-blur-2xl bg-white/10 border border-white/20 group-hover:border-white/40 transition-all p-6 hover:translate-y-[-2px]">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-purple-500 to-pink-500 opacity-10 rounded-full blur-2xl group-hover:opacity-20 transition-opacity" />
                  <div className="relative">
                    <p className="text-slate-400 text-sm font-semibold mb-2">Average Score</p>
                    <div className="flex items-end gap-3">
                      <span className="text-3xl font-black text-white">{averageScore}</span>
                      <span className="text-2xl">⭐</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Recent Attempts */}
        <section className="py-20 px-6">
          <div className="max-w-6xl mx-auto">
            {/* Section heading */}
            <div className="mb-12">
              <h2 className="text-4xl font-black mb-4 text-white">
                Recent Attempts
              </h2>
              <p className="text-slate-400">
                Your latest practice sessions
              </p>
            </div>

            {/* Table-like cards */}
            <div className="space-y-4">
              {recentAttempts.map((attempt) => (
                <div key={attempt.id} className="group relative overflow-hidden rounded-2xl backdrop-blur-2xl bg-white/10 border border-white/20 group-hover:border-white/40 transition-all p-6 hover:translate-x-1">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-white mb-2">
                        {attempt.type}
                      </h3>
                      <p className="text-slate-400 text-sm">
                        {attempt.date}
                      </p>
                    </div>

                    <div className="flex items-center gap-6">
                      <div className="text-right">
                        <div className={`text-3xl font-black ${
                          attempt.status === 'excellent' ? 'text-green-400' : 'text-blue-400'
                        }`}>
                          {attempt.score}
                        </div>
                        <p className="text-xs text-slate-400 capitalize">
                          {attempt.status}
                        </p>
                      </div>

                      <button className="px-6 py-2 rounded-lg bg-white/20 border border-white/30 text-white font-semibold hover:bg-white/30 transition-all flex items-center gap-2">
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="mt-4 h-1 bg-white/10 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"
                      style={{ width: `${attempt.score * 10}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 px-6">
          <div className="max-w-4xl mx-auto">
            <div className="relative overflow-hidden rounded-3xl backdrop-blur-2xl bg-white/10 border border-white/20 p-12 text-center group hover:border-white/40 transition-all">
              {/* Glow effect */}
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 to-purple-500/20 opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-96 bg-blue-500/20 blur-3xl -z-10 group-hover:scale-150 transition-transform" />

              <div className="relative">
                <h2 className="text-4xl font-black text-white mb-4">
                  Ready to Excel in Your Interview?
                </h2>
                <p className="text-slate-400 text-lg mb-8">
                  Join thousands of candidates who've improved their interview skills with AI feedback
                </p>

                <button className="group/btn relative px-8 py-4 rounded-xl font-semibold overflow-hidden inline-flex items-center gap-2">
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-500 opacity-100 group-hover/btn:opacity-110 transition-opacity blur-lg" />
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-500" />
                  <div className="relative text-white flex items-center gap-2">
                    <Zap className="w-5 h-5" />
                    Get Started Free
                    <ChevronRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                  </div>
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="py-12 px-6 border-t border-white/10 mt-20">
          <div className="max-w-6xl mx-auto flex items-center justify-between flex-wrap gap-8">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-transparent bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text fill-current" />
              <span className="text-slate-400">© 2025 InterviewVerse AI. All rights reserved.</span>
            </div>

            <div className="flex gap-8">
              <a href="#" className="text-slate-400 hover:text-white transition-colors">Privacy</a>
              <a href="#" className="text-slate-400 hover:text-white transition-colors">Terms</a>
              <a href="#" className="text-slate-400 hover:text-white transition-colors">Contact</a>
            </div>
          </div>
        </footer>
      </div>

      {/* Global animations */}
      <style>{`
        @keyframes blob {
          0%, 100% {
            transform: translate(0, 0) scale(1);
          }
          25% {
            transform: translate(20px, -50px) scale(1.1);
          }
          50% {
            transform: translate(-20px, 20px) scale(0.9);
          }
          75% {
            transform: translate(50px, 50px) scale(1.05);
          }
        }

        @keyframes gradient {
          0%, 100% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
        }

        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes glow {
          0%, 100% {
            box-shadow: 0 0 20px rgba(59, 130, 246, 0.5);
          }
          50% {
            box-shadow: 0 0 40px rgba(59, 130, 246, 0.8);
          }
        }

        .animate-blob {
          animation: blob 7s infinite;
        }

        .animation-delay-2000 {
          animation-delay: 2s;
        }

        .animation-delay-4000 {
          animation-delay: 4s;
        }

        .animate-gradient {
          background-size: 200% 200%;
          animation: gradient 3s ease infinite;
        }

        /* Smooth scrolling */
        html {
          scroll-behavior: smooth;
        }

        /* Custom scrollbar */
        ::-webkit-scrollbar {
          width: 8px;
        }

        ::-webkit-scrollbar-track {
          background: rgba(15, 23, 42, 0.5);
        }

        ::-webkit-scrollbar-thumb {
          background: linear-gradient(to bottom, #3B82F6, #8B5CF6);
          border-radius: 4px;
        }

        ::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(to bottom, #60A5FA, #A78BFA);
        }

        /* Selection color */
        ::selection {
          background: linear-gradient(to right, #3B82F6, #8B5CF6);
          color: white;
        }
      `}</style>
    </div>
  )
}
