/**
 * useNoiseSuppression Hook
 * Provides real-time background noise suppression for audio streams
 */

import { useCallback, useRef, useState, useEffect } from 'react'
import { 
  AudioProcessor, 
  NoiseSuppressionConfig, 
  DEFAULT_NOISE_SUPPRESSION_CONFIG,
  createNoiseSuppressionProcessor
} from '@/lib/audioProcessing'

export interface UseNoiseSuppressionReturn {
  // Audio processing control
  processAudio: (audioData: Float32Array) => Float32Array
  setNoiseProfile: (audioData: Float32Array) => void
  
  // Control methods
  enableNoiseSuppressionr: () => void
  disableNoiseSuppression: () => void
  isEnabled: boolean
  
  // Configuration
  updateConfig: (config: Partial<NoiseSuppressionConfig>) => void
  getConfig: () => NoiseSuppressionConfig
  
  // State
  isNoiseProfileSet: boolean
  
  // Profile management
  resetNoiseProfile: () => void
  lockNoiseProfile: (locked: boolean) => void
  
  // Cleanup
  cleanup: () => void
}

export function useNoiseSuppression(
  audioContext: AudioContext | null,
  initialConfig?: Partial<NoiseSuppressionConfig>
): UseNoiseSuppressionReturn {
  const [isEnabled, setIsEnabled] = useState(true)
  const [isNoiseProfileSet, setIsNoiseProfileSet] = useState(false)
  
  const processorRef = useRef<AudioProcessor | null>(null)
  const configRef = useRef<NoiseSuppressionConfig>({
    ...DEFAULT_NOISE_SUPPRESSION_CONFIG,
    ...initialConfig
  })

  // Initialize processor
  useEffect(() => {
    if (!audioContext) return

    try {
      processorRef.current = new AudioProcessor(audioContext, configRef.current)
      console.log('[useNoiseSuppression] ✅ Noise suppression processor initialized')
    } catch (error) {
      console.error('[useNoiseSuppression] ❌ Failed to initialize processor:', error)
    }

    return () => {
      processorRef.current = null
    }
  }, [audioContext])

  const processAudio = useCallback((audioData: Float32Array): Float32Array => {
    if (!isEnabled || !processorRef.current) {
      return audioData
    }

    return processorRef.current.processAudio(audioData)
  }, [isEnabled])

  const setNoiseProfile = useCallback((audioData: Float32Array) => {
    if (!processorRef.current) return
    
    processorRef.current.setNoiseProfile(audioData)
    setIsNoiseProfileSet(true)
    console.log('[useNoiseSuppression] 🎯 Noise profile calibrated')
  }, [])

  const enableNoiseSuppression = useCallback(() => {
    setIsEnabled(true)
    console.log('[useNoiseSuppression] ✅ Noise suppression enabled')
  }, [])

  const disableNoiseSuppression = useCallback(() => {
    setIsEnabled(false)
    console.log('[useNoiseSuppression] ❌ Noise suppression disabled')
  }, [])

  const updateConfig = useCallback((config: Partial<NoiseSuppressionConfig>) => {
    configRef.current = { ...configRef.current, ...config }
    processorRef.current?.updateConfig(config)
    console.log('[useNoiseSuppression] ⚙️ Configuration updated')
  }, [])

  const getConfig = useCallback((): NoiseSuppressionConfig => {
    return processorRef.current?.getConfig() || configRef.current
  }, [])

  const resetNoiseProfile = useCallback(() => {
    processorRef.current?.resetNoiseProfile()
    setIsNoiseProfileSet(false)
    console.log('[useNoiseSuppression] 🔄 Noise profile reset')
  }, [])

  const lockNoiseProfile = useCallback((locked: boolean) => {
    processorRef.current?.lockNoiseProfile(locked)
  }, [])

  const cleanup = useCallback(() => {
    processorRef.current = null
    setIsEnabled(false)
    console.log('[useNoiseSuppression] 🧹 Cleanup completed')
  }, [])

  return {
    processAudio,
    setNoiseProfile,
    enableNoiseSuppression: enableNoiseSuppression,
    disableNoiseSuppression,
    isEnabled,
    updateConfig,
    getConfig,
    isNoiseProfileSet,
    resetNoiseProfile,
    lockNoiseProfile,
    cleanup
  }
}
