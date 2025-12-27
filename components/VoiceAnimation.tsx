'use client'

import { motion } from 'framer-motion'
import { Mic } from 'lucide-react'

type AgentStatus = 'idle' | 'listening' | 'thinking' | 'speaking'

interface VoiceAnimationProps {
  isListening?: boolean
  isSpeaking?: boolean
  averageFrequency: number
  frequency: number[]
  agentStatus?: AgentStatus
  amplitude?: number
  onAudioChunk?: (audio: Uint8Array) => void
}

export function VoiceAnimation({
  isListening,
  isSpeaking,
  averageFrequency,
  frequency,
  agentStatus,
  amplitude = 0,
  onAudioChunk,
}: VoiceAnimationProps) {
  // Create circular frequency bars (32 bars arranged in a circle)
  const frequencyBars = frequency.slice(0, 32)

  const getStatusColor = () => {
    // Use agentStatus if provided, otherwise fall back to isListening/isSpeaking
    const status = agentStatus || (isSpeaking ? 'speaking' : isListening ? 'listening' : 'idle')
    
    switch (status) {
      case 'speaking':
        return 'from-green-500 to-emerald-500'
      case 'listening':
        return 'from-cyan-500 to-blue-500'
      case 'thinking':
        return 'from-amber-400 to-orange-500'
      case 'idle':
      default:
        return 'from-indigo-500 to-purple-500'
    }
  }

  const getGlowColor = () => {
    const status = agentStatus || (isSpeaking ? 'speaking' : isListening ? 'listening' : 'idle')
    
    switch (status) {
      case 'speaking':
        return 'rgba(16, 185, 129, 0.3)'
      case 'listening':
        return 'rgba(6, 182, 212, 0.3)'
      case 'thinking':
        return 'rgba(251, 146, 60, 0.3)'
      case 'idle':
      default:
        return 'rgba(99, 102, 241, 0.3)'
    }
  }

  const getStatusText = () => {
    const status = agentStatus || (isSpeaking ? 'speaking' : isListening ? 'listening' : 'idle')
    
    switch (status) {
      case 'speaking':
        return 'Speaking'
      case 'listening':
        return 'Listening'
      case 'thinking':
        return 'Thinking'
      case 'idle':
      default:
        return 'Ready'
    }
  }

  return (
    <div className="flex flex-col items-center justify-center h-full w-full px-6 py-8 relative">
      {/* Main Voice Circle Container */}
      <div className="relative w-56 h-56 flex items-center justify-center mb-8">
        {/* Large outer glow - breathing effect */}
        <motion.div
          animate={{
            scale: [1, 1.08, 1],
            opacity: [0.2, 0.5, 0.2],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          className="absolute inset-0 rounded-full bg-gradient-to-r from-cyan-500 to-indigo-500 blur-3xl"
        />

        {/* Animated outer ring 1 - fast pulse or rotation */}
        <motion.div
          animate={
            agentStatus === 'thinking'
              ? { rotate: 360 }
              : {
                  scale: [1, 1.2],
                  opacity: isListening || isSpeaking ? [0.8, 0.1] : [0.4, 0.1],
                }
          }
          transition={
            agentStatus === 'thinking'
              ? { duration: 2, repeat: Infinity, ease: 'linear' }
              : {
                  duration: isListening ? 0.6 : isSpeaking ? 0.5 : 1,
                  repeat: Infinity,
                  ease: 'easeOut',
                }
          }
          className={`absolute inset-0 rounded-full border-2 border-transparent bg-gradient-to-r ${getStatusColor()} [background-clip:border-box]`}
        />

        {/* Animated outer ring 2 - slow pulse or rotation (offset) */}
        <motion.div
          animate={
            agentStatus === 'thinking'
              ? { rotate: -360 }
              : {
                  scale: [1, 1.15],
                  opacity: isListening || isSpeaking ? [0.5, 0.05] : [0.25, 0.05],
                }
          }
          transition={
            agentStatus === 'thinking'
              ? { duration: 3, repeat: Infinity, ease: 'linear' }
              : {
                  duration: isListening ? 0.8 : isSpeaking ? 0.7 : 1.2,
                  repeat: Infinity,
                  ease: 'easeOut',
                  delay: 0.2,
                }
          }
          className={`absolute inset-0 rounded-full border-2 border-transparent bg-gradient-to-r ${getStatusColor()} [background-clip:border-box]`}
        />

        {/* Static inner ring */}
        <div className="absolute inset-12 rounded-full border border-cyan-500/40 bg-gradient-to-br from-slate-900/60 to-slate-800/60" />

        {/* SVG circular frequency visualization */}
        <svg
          className="absolute inset-0 w-full h-full"
          viewBox="0 0 224 224"
          style={{
            transform: 'rotate(-90deg)',
            filter: `drop-shadow(0 0 8px ${getGlowColor()})`,
          }}
        >
          {frequencyBars.map((freq, idx) => {
            const angle = (idx / frequencyBars.length) * 360
            const radian = (angle * Math.PI) / 180
            
            // Calculate bar length based on frequency
            const baseLength = 32
            const barLength = baseLength + (freq / 100) * 28
            
            // Outer point of bar
            const x1 = 112 + 90 * Math.cos(radian)
            const y1 = 112 + 90 * Math.sin(radian)
            
            // Inner point of bar
            const x2 = 112 + (90 - barLength) * Math.cos(radian)
            const y2 = 112 + (90 - barLength) * Math.sin(radian)

            // Color gradient based on frequency
            let barColor = '#818cf8' // indigo
            if (freq > 60) barColor = '#10b981' // green
            else if (freq > 40) barColor = '#06b6d4' // cyan
            else if (freq > 20) barColor = '#3b82f6' // blue

            return (
              <motion.line
                key={idx}
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke={barColor}
                strokeWidth={2.5}
                strokeLinecap="round"
                opacity={0.5 + (freq / 100) * 0.5}
                animate={{
                  opacity: 0.4 + (freq / 100) * 0.6,
                  strokeWidth: 2 + (freq / 100) * 2,
                }}
                transition={{ duration: 0.08 }}
              />
            )
          })}
        </svg>

        {/* Center breathing circle */}
        <motion.div
          animate={{
            scale:
              agentStatus === 'speaking'
                ? [1 + amplitude * 0.1, 1 + amplitude * 0.15]
                : isListening
                  ? [0.95, 1.05]
                  : isSpeaking
                    ? [0.98, 1.02]
                    : [1, 1.02],
          }}
          transition={{
            duration: agentStatus === 'speaking' ? 0.15 : 2.5,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          className="relative z-20 flex items-center justify-center w-24 h-24 rounded-full bg-gradient-to-br from-slate-700 via-slate-800 to-slate-900 border-2 border-cyan-400/60 shadow-2xl"
        >
          {/* Inner glow */}
          <div className="absolute inset-0 rounded-full bg-gradient-to-r from-cyan-500/20 to-blue-500/20 animate-pulse" />

          {/* Mic icon */}
          <motion.div
            animate={{
              scale:
                agentStatus === 'speaking'
                  ? [1, 1.15 + amplitude * 0.1]
                  : isSpeaking
                    ? [1, 1.1, 1]
                    : isListening
                      ? [1, 1.05, 1]
                      : 1,
            }}
            transition={{
              duration:
                agentStatus === 'speaking'
                  ? 0.15
                  : isSpeaking
                    ? 0.5
                    : isListening
                      ? 0.8
                      : 0.3,
              repeat: agentStatus === 'speaking' || isSpeaking || isListening ? Infinity : 0,
            }}
            className="relative z-10"
          >
            <Mic
              size={40}
              className={`${
                isSpeaking ? 'text-green-400' : isListening ? 'text-cyan-300' : 'text-indigo-400'
              }`}
              strokeWidth={1.5}
            />
          </motion.div>
        </motion.div>

        {/* Floating status dots - 4 corners */}
        {[0, 90, 180, 270].map((angle, i) => {
          const radian = (angle * Math.PI) / 180
          const distance = 105
          const x = 50 + (distance / 224) * 100 * Math.cos(radian)
          const y = 50 + (distance / 224) * 100 * Math.sin(radian)

          return (
            <motion.div
              key={i}
              className={`absolute w-2.5 h-2.5 rounded-full bg-gradient-to-r ${getStatusColor()} shadow-lg`}
              style={{
                left: `${x}%`,
                top: `${y}%`,
                transform: 'translate(-50%, -50%)',
              }}
              animate={{
                scale: [1, 1.6, 1],
                opacity: [0.6, 1, 0.6],
              }}
              transition={{
                duration: 1.8,
                repeat: Infinity,
                delay: i * 0.25,
              }}
            />
          )
        })}
      </div>

      {/* Status Label */}
      <motion.div
        animate={{
          opacity: [0.7, 1, 0.7],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
        className="text-center mb-6"
      >
        <h3 className={`text-lg font-bold bg-gradient-to-r ${getStatusColor()} bg-clip-text text-transparent mb-1`}>
          {getStatusText()}
        </h3>
        <p className="text-xs text-gray-500 h-5">
          {isListening && 'Listening...'}
          {isSpeaking && 'Responding...'}
          {!isListening && !isSpeaking && 'Standby'}
        </p>
      </motion.div>

      {/* Audio Level Bar */}
      <div className="w-full px-4 mb-4">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-xs font-medium text-gray-400">Audio Level</span>
          <span className="text-xs font-bold text-cyan-400">
            {Math.round(averageFrequency)}%
          </span>
        </div>
        <div className="w-full h-1.5 bg-slate-700/60 rounded-full overflow-hidden border border-slate-600/30">
          <motion.div
            animate={{
              width: `${averageFrequency}%`,
            }}
            transition={{ duration: 0.05 }}
            className="h-full bg-gradient-to-r from-cyan-500 via-blue-500 to-indigo-500 shadow-lg"
          />
        </div>
      </div>

      {/* Mini Frequency Bars */}
      <div className="flex items-end justify-center gap-1 h-8">
        {frequency.slice(0, 12).map((freq, idx) => (
          <motion.div
            key={idx}
            animate={{
              scaleY: 0.3 + (freq / 100) * 0.9,
              opacity: 0.4 + (freq / 100) * 0.6,
            }}
            transition={{ duration: 0.08 }}
            className="w-1 h-8 bg-gradient-to-t from-cyan-500 to-blue-500 rounded-full origin-bottom"
          />
        ))}
      </div>
    </div>
  )
}
