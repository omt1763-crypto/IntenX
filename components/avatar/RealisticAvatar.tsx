'use client'

import React from 'react'

interface RealisticAvatarProps {
  morphWeights?: { [key: string]: number }
  expressionWeights?: { smile: number; frown: number; blink: number }
  blinking?: boolean
  isLoading?: boolean
  error?: string | null
  text?: string
  emotion?: string
  isEnabled?: boolean
}

export default function RealisticAvatar({
  isLoading = false,
  error = null,
  isEnabled = true,
}: RealisticAvatarProps) {
  if (!isEnabled) {
    return (
      <div className="w-full h-full bg-gradient-to-b from-slate-900 to-black flex items-center justify-center rounded-lg">
        <div className="text-slate-500 text-sm">Avatar disabled</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="w-full h-full bg-gradient-to-b from-slate-900 to-black flex items-center justify-center rounded-lg">
        <div className="text-red-400 text-sm text-center px-4">
          <p className="font-bold mb-2">Avatar Error</p>
          <p className="text-xs">{error}</p>
        </div>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="w-full h-full bg-gradient-to-b from-slate-900 to-black flex items-center justify-center rounded-lg animate-pulse">
        <p className="text-slate-400">Loading avatar...</p>
      </div>
    )
  }

  return (
    <div className="w-full h-full bg-gradient-to-b from-slate-900 to-black rounded-lg overflow-hidden shadow-2xl flex items-center justify-center">
      <div className="text-center">
        <div className="text-6xl mb-4">🤖</div>
        <p className="text-slate-300 font-semibold">AI Avatar</p>
        <p className="text-slate-500 text-sm">Ready to interact</p>
      </div>
    </div>
  )
}

export { RealisticAvatar }
