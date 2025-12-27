'use client'

import React, { useEffect, useRef } from 'react'

interface WaveformProps {
  isActive?: boolean
  intensity?: number
  color?: 'cyan' | 'blue' | 'purple' | 'teal'
  barCount?: number
}

export default function Waveform({
  isActive = false,
  intensity = 0,
  color = 'blue',
  barCount = 24,
}: WaveformProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const barsRef = useRef<HTMLDivElement[]>([])

  const colorMap = {
    cyan: 'bg-gradient-to-t from-cyan-500 to-cyan-300',
    blue: 'bg-gradient-to-t from-blue-500 to-blue-300',
    purple: 'bg-gradient-to-t from-purple-500 to-purple-300',
    teal: 'bg-gradient-to-t from-teal-500 to-teal-300',
  }

  useEffect(() => {
    if (!isActive) return

    const animate = () => {
      barsRef.current.forEach((bar, index) => {
        const baseHeight = 20
        const randomHeight = Math.random() * 100 * intensity
        const oscillation = Math.sin((Date.now() / 100) + index * (Math.PI / (barCount / 2))) * 30
        const height = Math.max(baseHeight, randomHeight + oscillation)
        
        bar.style.height = `${height}%`
        bar.style.opacity = `${0.3 + (height / 100) * 0.7}`
      })

      requestAnimationFrame(animate)
    }

    animate()
  }, [isActive, intensity, barCount])

  return (
    <div
      ref={containerRef}
      className="flex items-end justify-center h-full gap-1"
    >
      {Array.from({ length: barCount }).map((_, index) => (
        <div
          key={index}
          ref={(el) => {
            if (el) barsRef.current[index] = el
          }}
          className={`flex-1 rounded-sm transition-all duration-75 ${colorMap[color]} ${
            isActive ? 'shadow-lg shadow-cyan-500/50' : 'opacity-30'
          }`}
          style={{
            minHeight: '8px',
            height: isActive ? '20%' : '10%',
          }}
        />
      ))}
    </div>
  )
}
