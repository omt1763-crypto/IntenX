/**
 * Example: Audio Noise Suppression Component
 * 
 * This is a reference implementation showing how to use the noise suppression
 * in your interview application.
 * 
 * Copy and adapt this code to your needs.
 */

'use client'

import { useEffect, useRef, useState } from 'react'
import { AdvancedAudioProcessor, detectVoiceActivity, AudioQualityMetrics } from '@/lib/advancedAudioProcessing'
import { AlertCircle, CheckCircle2, Volume2, Zap } from 'lucide-react'

interface AudioMetricsState {
  snr: number
  volume: number
  noiseLevel: number
  isSpeech: boolean
  isClipping: boolean
}

interface NoiseSuppressionControlProps {
  audioContext: AudioContext | null
  onAudioProcessed?: (audioData: Float32Array, metrics: AudioQualityMetrics) => void
  onCalibrationComplete?: () => void
  preset?: 'standard' | 'aggressive' | 'gentle'
}

/**
 * Example: Audio metrics display component
 */
export function AudioMetricsDisplay({ metrics }: { metrics: AudioMetricsState | null }) {
  if (!metrics) return null

  const getSNRColor = (snr: number) => {
    if (snr < 5) return 'bg-red-100 text-red-900'
    if (snr < 10) return 'bg-orange-100 text-orange-900'
    if (snr < 15) return 'bg-yellow-100 text-yellow-900'
    return 'bg-green-100 text-green-900'
  }

  const getVolumeIndicator = (volume: number) => {
    if (volume < -40) return '▁'
    if (volume < -30) return '▂'
    if (volume < -20) return '▃'
    if (volume < -10) return '▄'
    return '█'
  }

  return (
    <div className="p-4 space-y-3 bg-gray-50 rounded-lg border border-gray-200">
      {/* SNR Status */}
      <div className={`p-3 rounded-lg ${getSNRColor(metrics.snr)}`}>
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Signal-to-Noise Ratio</span>
          <span className="text-lg font-bold">{metrics.snr.toFixed(1)} dB</span>
        </div>
        <p className="text-xs mt-1 opacity-75">
          {metrics.snr > 20 ? '✓ Excellent' : metrics.snr > 15 ? '✓ Good' : metrics.snr > 10 ? '⚠ Fair' : '✗ Poor'}
        </p>
      </div>

      {/* Volume Level */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium flex items-center gap-2">
            <Volume2 className="w-4 h-4" />
            Volume Level
          </span>
          <span className="text-lg font-mono">{getVolumeIndicator(metrics.volume)} {metrics.volume.toFixed(1)} dB</span>
        </div>
        <div className="w-full bg-gray-300 rounded-full h-2">
          <div
            className="bg-blue-600 h-2 rounded-full transition-all"
            style={{ width: `${Math.max(0, Math.min(100, (metrics.volume + 40) * 2))}%` }}
          />
        </div>
      </div>

      {/* Noise Level */}
      <div className="space-y-2">
        <span className="text-sm font-medium">Background Noise</span>
        <div className="flex items-center gap-2">
          <div className="flex-1">
            <div className="w-full bg-gray-300 rounded-full h-2">
              <div
                className="bg-orange-600 h-2 rounded-full"
                style={{ width: `${Math.max(0, Math.min(100, (metrics.noiseLevel + 60) * 2))}%` }}
              />
            </div>
          </div>
          <span className="text-xs font-mono w-12 text-right">{metrics.noiseLevel.toFixed(0)} dB</span>
        </div>
      </div>

      {/* Speech Detection */}
      <div className="flex items-center gap-2">
        {metrics.isSpeech ? (
          <>
            <div className="w-3 h-3 bg-green-600 rounded-full animate-pulse" />
            <span className="text-sm text-green-700 font-medium">Speech Detected</span>
          </>
        ) : (
          <>
            <div className="w-3 h-3 bg-gray-400 rounded-full" />
            <span className="text-sm text-gray-600">Silence</span>
          </>
        )}
      </div>

      {/* Clipping Warning */}
      {metrics.isClipping && (
        <div className="p-2 bg-red-100 border border-red-300 rounded text-sm text-red-700 flex items-center gap-2">
          <AlertCircle className="w-4 h-4" />
          Clipping detected - reduce microphone level
        </div>
      )}
    </div>
  )
}

/**
 * Example: Noise suppression control component
 */
export function NoiseSuppressionControl({ 
  audioContext,
  onAudioProcessed,
  onCalibrationComplete,
  preset = 'standard'
}: NoiseSuppressionControlProps) {
  const processorRef = useRef<AdvancedAudioProcessor | null>(null)
  const mediaStreamRef = useRef<MediaStream | null>(null)
  const [metrics, setMetrics] = useState<AudioMetricsState | null>(null)
  const [isCalibrated, setIsCalibrated] = useState(false)
  const [calibrationProgress, setCalibrationProgress] = useState(0)
  const [isProcessing, setIsProcessing] = useState(false)

  // Preset configurations
  const presetConfigs = {
    standard: {
      suppressionFactor: 0.8,
      minimumMask: 0.1,
      temporalSmoothing: 0.98,
      frequencySmoothing: 0.95,
      voiceActivityThreshold: 0.02,
      noiseGateDb: -50,
    },
    aggressive: {
      suppressionFactor: 0.95,
      minimumMask: 0.05,
      temporalSmoothing: 0.95,
      frequencySmoothing: 0.9,
      voiceActivityThreshold: 0.03,
      noiseGateDb: -40,
    },
    gentle: {
      suppressionFactor: 0.5,
      minimumMask: 0.2,
      temporalSmoothing: 0.99,
      frequencySmoothing: 0.98,
      voiceActivityThreshold: 0.01,
      noiseGateDb: -60,
    },
  }

  // Initialize audio processor
  useEffect(() => {
    if (!audioContext) return

    const processor = new AdvancedAudioProcessor(4096)
    processor.updateConfig(presetConfigs[preset])
    processorRef.current = processor

    console.log('[NoiseSuppressionControl] ✅ Processor initialized with', preset, 'preset')

    return () => {
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach(track => track.stop())
      }
    }
  }, [audioContext, preset])

  // Request microphone access
  const startProcessing = async () => {
    try {
      setIsProcessing(true)
      setCalibrationProgress(0)
      setIsCalibrated(false)

      if (!mediaStreamRef.current) {
        mediaStreamRef.current = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: false,
            noiseSuppression: false,
            autoGainControl: false,
          },
        })
      }

      if (!audioContext) return

      const source = audioContext.createMediaStreamSource(mediaStreamRef.current)
      const processor = audioContext.createScriptProcessor(4096, 1, 1)

      const calibrationStartTime = Date.now()
      const calibrationDuration = 2000 // 2 seconds

      processor.onaudioprocess = (event) => {
        const inputData = event.inputBuffer.getChannelData(0)

        // Calibration phase
        if (!isCalibrated) {
          const elapsed = Date.now() - calibrationStartTime
          const progress = Math.min(100, (elapsed / calibrationDuration) * 100)
          setCalibrationProgress(progress)

          if (progress >= 100) {
            setIsCalibrated(true)
            onCalibrationComplete?.()
            console.log('[NoiseSuppressionControl] ✅ Calibration complete')
          }
        }

        // Process audio
        if (processorRef.current) {
          const { audio, metrics } = processorRef.current.processAudio(inputData)

          // Update metrics state
          setMetrics({
            snr: metrics.snr,
            volume: metrics.volume,
            noiseLevel: metrics.noiseLevel,
            isSpeech: metrics.isSpeech,
            isClipping: metrics.isClipping,
          })

          // Callback with processed audio
          onAudioProcessed?.(audio, metrics)
        }
      }

      source.connect(processor)
      processor.connect(audioContext.destination)

      console.log('[NoiseSuppressionControl] 🎤 Audio processing started')
    } catch (error) {
      console.error('[NoiseSuppressionControl] ❌ Error:', error)
      setIsProcessing(false)
    }
  }

  const stopProcessing = () => {
    setIsProcessing(false)
    setIsCalibrated(false)
    setMetrics(null)

    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop())
      mediaStreamRef.current = null
    }

    processorRef.current?.reset()
    console.log('[NoiseSuppressionControl] ⏹️ Audio processing stopped')
  }

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex gap-2">
        <button
          onClick={startProcessing}
          disabled={isProcessing}
          className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
        >
          {isProcessing ? '🔴 Recording...' : '▶️ Start'}
        </button>
        <button
          onClick={stopProcessing}
          disabled={!isProcessing}
          className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
        >
          ⏹️ Stop
        </button>
      </div>

      {/* Status */}
      {isProcessing && (
        <>
          {!isCalibrated ? (
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-4 h-4 bg-blue-600 rounded-full animate-pulse" />
                <span className="font-medium text-blue-900">Calibrating Noise Profile</span>
              </div>
              <div className="w-full bg-blue-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all"
                  style={{ width: `${calibrationProgress}%` }}
                />
              </div>
              <p className="text-xs text-blue-700 mt-2">
                Please remain quiet for {Math.ceil((2000 - (Date.now() % 2000)) / 1000)}s...
              </p>
            </div>
          ) : (
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-green-600" />
              <span className="font-medium text-green-900">Noise Suppression Active</span>
            </div>
          )}
        </>
      )}

      {/* Metrics Display */}
      {isProcessing && metrics && <AudioMetricsDisplay metrics={metrics} />}

      {/* Info */}
      <div className="p-3 bg-gray-100 rounded-lg text-sm text-gray-700">
        <p className="font-medium mb-2 flex items-center gap-2">
          <Zap className="w-4 h-4" />
          Preset: {preset.charAt(0).toUpperCase() + preset.slice(1)}
        </p>
        <p className="text-xs">
          {preset === 'standard' && 'Balanced noise reduction for typical environments.'}
          {preset === 'aggressive' && 'Maximum noise reduction for very noisy environments.'}
          {preset === 'gentle' && 'Minimal processing for quiet environments.'}
        </p>
      </div>
    </div>
  )
}

/**
 * Example usage in a page
 */
export function ExampleInterviewPage() {
  const audioContextRef = useRef<AudioContext | null>(null)

  useEffect(() => {
    audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)()
  }, [])

  return (
    <div className="max-w-md mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold">Interview with Noise Suppression</h1>
      
      <NoiseSuppressionControl
        audioContext={audioContextRef.current}
        preset="standard"
        onAudioProcessed={(audio, metrics) => {
          // Handle processed audio here
          // Send to your backend, etc.
        }}
        onCalibrationComplete={() => {
          console.log('Ready to interview!')
        }}
      />
    </div>
  )
}
