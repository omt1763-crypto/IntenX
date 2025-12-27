'use client'

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Send,
  MessageSquare,
  Brain,
  BarChart3,
  AlertCircle,
  Lightbulb,
  CheckCircle2,
  Clock,
  TrendingUp,
  Zap,
} from 'lucide-react'

interface RemoteParticipant {
  id: string
  identity: string
  role: 'candidate' | 'recruiter'
  videoTrack: MediaStreamTrack | null
  audioTrack: MediaStreamTrack | null
  peerConnection: RTCPeerConnection | null
}

interface AIConsoleProps {
  roomId: string
  role: 'candidate' | 'recruiter'
  participants: RemoteParticipant[]
}

interface ConsoleMessage {
  id: string
  type: 'ai' | 'system' | 'candidate_feedback'
  text: string
  timestamp: Date
  icon?: React.ReactNode
}

interface InterviewMetrics {
  communicationScore: number
  technicalScore: number
  engagementScore: number
  timeElapsed: number
}

/**
 * AIConsole Component
 *
 * Displays AI-generated interview insights, real-time feedback, and metrics.
 * Shows:
 * - AI interview guidance and prompts
 * - Real-time scoring and performance metrics
 * - Feedback on communication and answers
 * - Interview timeline
 *
 * TODO: Connect to backend AI service for:
 * - Transcription (Whisper/STT)
 * - LLM-based evaluation (GPT-4, Claude, etc.)
 * - Real-time scoring
 * - Candidate feedback generation
 */

export default function AIConsole({
  roomId,
  role,
  participants,
}: AIConsoleProps) {
  const [messages, setMessages] = useState<ConsoleMessage[]>([
    {
      id: '0',
      type: 'system',
      text: 'Interview started. AI is analyzing responses in real-time.',
      timestamp: new Date(),
      icon: <Brain className="w-4 h-4" />,
    },
  ])

  const [metrics, setMetrics] = useState<InterviewMetrics>({
    communicationScore: 0,
    technicalScore: 0,
    engagementScore: 0,
    timeElapsed: 0,
  })

  const [userInput, setUserInput] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const timeIntervalRef = useRef<NodeJS.Timeout | null>(null)

  // Auto-scroll to latest message
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Timer for interview duration
  useEffect(() => {
    timeIntervalRef.current = setInterval(() => {
      setMetrics((prev) => ({
        ...prev,
        timeElapsed: prev.timeElapsed + 1,
      }))
    }, 1000)

    return () => {
      if (timeIntervalRef.current) clearInterval(timeIntervalRef.current)
    }
  }, [])

  // Simulate AI feedback
  useEffect(() => {
    if (metrics.timeElapsed > 0 && metrics.timeElapsed % 15 === 0) {
      const feedbackMessages = [
        {
          type: 'ai',
          text: 'Excellent communication! Keep building on your points with specific examples.',
          icon: <CheckCircle2 className="w-4 h-4 text-emerald-500" />,
        },
        {
          type: 'ai',
          text: 'Try to provide more concrete examples when discussing technical concepts.',
          icon: <Lightbulb className="w-4 h-4 text-yellow-500" />,
        },
        {
          type: 'ai',
          text: 'Good pacing! You\'re allowing time for thoughtful responses.',
          icon: <CheckCircle2 className="w-4 h-4 text-emerald-500" />,
        },
      ]

      const randomFeedback =
        feedbackMessages[Math.floor(Math.random() * feedbackMessages.length)]

      addMessage({
        type: 'ai',
        text: randomFeedback.text,
        icon: randomFeedback.icon,
      })

      // Update metrics
      setMetrics((prev) => ({
        ...prev,
        communicationScore: Math.min(100, prev.communicationScore + Math.random() * 5),
        technicalScore: Math.min(100, prev.technicalScore + Math.random() * 3),
        engagementScore: Math.min(100, prev.engagementScore + Math.random() * 4),
      }))
    }
  }, [metrics.timeElapsed])

  const addMessage = (msg: Omit<ConsoleMessage, 'id' | 'timestamp'>) => {
    const newMessage: ConsoleMessage = {
      ...msg,
      id: Date.now().toString(),
      timestamp: new Date(),
    }
    setMessages((prev) => [...prev, newMessage])
  }

  const handleSendMessage = (text: string) => {
    if (!text.trim()) return

    addMessage({
      type: 'candidate_feedback',
      text,
    })

    // TODO: Send to backend for AI analysis
    // const response = await fetch(`/api/interviews/${roomId}/analyze`, {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify({ text, role })
    // })

    setUserInput('')

    // Simulate AI response
    setTimeout(() => {
      addMessage({
        type: 'ai',
        text: 'Great point! You demonstrated strong understanding of the core concepts.',
        icon: <CheckCircle2 className="w-4 h-4 text-emerald-500" />,
      })
    }, 1000)
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const getScoreColor = (score: number) => {
    if (score < 40) return 'text-rose-500'
    if (score < 70) return 'text-yellow-500'
    return 'text-emerald-500'
  }

  return (
    <motion.div
      className="flex flex-col h-full glass rounded-2xl border border-white/20 dark:border-neutral-700/20 overflow-hidden"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
    >
      {/* Header */}
      <div className="sticky top-0 z-10 glass backdrop-blur-xl border-b border-white/10 px-4 py-4">
        <div className="flex items-center gap-2 mb-3">
          <Brain className="w-5 h-5 text-brand-500" />
          <h2 className="font-bold text-white">AI Interview Assistant</h2>
        </div>

        {/* Metrics Row */}
        <div className="grid grid-cols-3 gap-2 text-xs">
          {/* Communication */}
          <div className="bg-neutral-900/50 rounded-lg p-2">
            <p className="text-neutral-400 mb-1">Communication</p>
            <div className="flex items-center justify-between">
              <span className={`font-bold text-sm ${getScoreColor(metrics.communicationScore)}`}>
                {Math.round(metrics.communicationScore)}%
              </span>
              <TrendingUp className="w-3 h-3 text-neutral-500" />
            </div>
          </div>

          {/* Technical */}
          <div className="bg-neutral-900/50 rounded-lg p-2">
            <p className="text-neutral-400 mb-1">Technical</p>
            <div className="flex items-center justify-between">
              <span className={`font-bold text-sm ${getScoreColor(metrics.technicalScore)}`}>
                {Math.round(metrics.technicalScore)}%
              </span>
              <BarChart3 className="w-3 h-3 text-neutral-500" />
            </div>
          </div>

          {/* Time */}
          <div className="bg-neutral-900/50 rounded-lg p-2">
            <p className="text-neutral-400 mb-1">Duration</p>
            <div className="flex items-center justify-between">
              <span className="font-bold text-sm text-neutral-300">
                {formatTime(metrics.timeElapsed)}
              </span>
              <Clock className="w-3 h-3 text-neutral-500" />
            </div>
          </div>
        </div>
      </div>

      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 bg-gradient-to-b from-transparent via-transparent to-neutral-900/20">
        <AnimatePresence mode="popLayout">
          {messages.map((msg) => (
            <motion.div
              key={msg.id}
              layout
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className={`flex gap-2 ${msg.type === 'candidate_feedback' ? 'justify-end' : 'justify-start'}`}
            >
              {msg.type !== 'candidate_feedback' && msg.icon && (
                <div className="flex-shrink-0 w-6 h-6 flex items-center justify-center rounded-full bg-brand-500/20">
                  {msg.icon}
                </div>
              )}

              <div
                className={`max-w-xs px-3 py-2 rounded-lg text-sm ${
                  msg.type === 'candidate_feedback'
                    ? 'bg-brand-500/20 text-brand-100 border border-brand-500/30'
                    : msg.type === 'ai'
                    ? 'bg-neutral-800 text-neutral-200 border border-neutral-700'
                    : 'bg-neutral-700/50 text-neutral-300 border border-neutral-600/30'
                }`}
              >
                {msg.text}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="sticky bottom-0 glass backdrop-blur-xl border-t border-white/10 px-4 py-3">
        <div className="flex gap-2">
          <input
            type="text"
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                handleSendMessage(userInput)
              }
            }}
            placeholder="Send feedback or notes..."
            className="flex-1 input-field text-sm h-9 py-2 px-3"
          />
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => handleSendMessage(userInput)}
            disabled={!userInput.trim()}
            className="h-9 px-3 rounded-lg bg-brand-500/20 text-brand-400 hover:bg-brand-500/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center"
          >
            <Send className="w-4 h-4" />
          </motion.button>
        </div>

        {/* Helper Text */}
        <p className="text-xs text-neutral-500 mt-2">
          Press Enter to send • Shift+Enter for new line
        </p>
      </div>

      {/* Participant Info */}
      {participants.length > 0 && (
        <motion.div
          className="px-4 py-2 border-t border-white/10 text-xs text-neutral-400"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <p>
            <span className="text-brand-400">
              {participants.filter((p) => p.role === 'recruiter').length}
            </span>{' '}
            recruiter{participants.filter((p) => p.role === 'recruiter').length !== 1 ? 's' : ''}
          </p>
        </motion.div>
      )}
    </motion.div>
  )
}
