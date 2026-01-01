/**
 * Audio Testing & Calibration Utility
 * Use this to test noise suppression and calibrate for your environment
 */

import React, { useRef } from 'react'
import { AdvancedAudioProcessor, detectVoiceActivity } from '@/lib/advancedAudioProcessing'

export interface AudioTestResult {
  noiseFloor: number
  speechLevel: number
  snrRatio: number
  clippingDetected: boolean
  recommendedSettings: {
    suppressionFactor: number
    noiseGateDb: number
    voiceActivityThreshold: number
  }
}

/**
 * Audio Diagnostic Tool
 */
export class AudioDiagnostic {
  private audioContext: AudioContext
  private analyser: AnalyserNode
  private processor: AdvancedAudioProcessor
  private mediaStream: MediaStream | null = null

  constructor(audioContext: AudioContext) {
    this.audioContext = audioContext
    this.analyser = audioContext.createAnalyser()
    this.analyser.fftSize = 4096
    this.processor = new AdvancedAudioProcessor(4096)
  }

  /**
   * Get microphone access
   */
  async requestMicrophone(): Promise<MediaStream> {
    try {
      this.mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: false, // We're using our own
          autoGainControl: false,
          sampleRate: 44100,
        },
        video: false,
      })
      return this.mediaStream
    } catch (error) {
      console.error('Failed to get microphone:', error)
      throw new Error('Microphone access denied')
    }
  }

  /**
   * Test audio input and generate recommendations
   */
  async testAudioInput(durationMs: number = 5000): Promise<AudioTestResult> {
    if (!this.mediaStream) {
      throw new Error('Microphone not initialized')
    }

    const source = this.audioContext.createMediaStreamSource(this.mediaStream)
    const processor = this.audioContext.createScriptProcessor(4096, 1, 1)
    
    source.connect(processor)
    processor.connect(this.audioContext.destination)

    const audioSamples: Float32Array[] = []
    const startTime = Date.now()
    let maxAmplitude = 0
    let clippingCount = 0

    return new Promise((resolve) => {
      processor.onaudioprocess = (event) => {
        const inputData = event.inputBuffer.getChannelData(0)
        audioSamples.push(new Float32Array(inputData))

        // Check for clipping
        for (let i = 0; i < inputData.length; i++) {
          if (Math.abs(inputData[i]) > 0.99) {
            clippingCount++
          }
          maxAmplitude = Math.max(maxAmplitude, Math.abs(inputData[i]))
        }

        if (Date.now() - startTime > durationMs) {
          processor.disconnect()
          source.disconnect()

          const result = this.analyzeAudioData(audioSamples, clippingCount > 0)
          resolve(result)
        }
      }
    })
  }

  /**
   * Analyze audio data and provide recommendations
   */
  private analyzeAudioData(samples: Float32Array[], clippingDetected: boolean): AudioTestResult {
    if (samples.length === 0) {
      return {
        noiseFloor: -80,
        speechLevel: -60,
        snrRatio: 0,
        clippingDetected: false,
        recommendedSettings: this.getDefaultSettings(),
      }
    }

    // Combine all samples
    let totalSamples = 0
    for (const sample of samples) {
      totalSamples += sample.length
    }
    const allSamples = new Float32Array(totalSamples)
    let offset = 0
    for (const sample of samples) {
      allSamples.set(sample, offset)
      offset += sample.length
    }

    // Calculate statistics
    const sorted = Array.from(allSamples)
      .map(s => Math.abs(s))
      .sort((a, b) => a - b)

    const p5 = sorted[Math.floor(sorted.length * 0.05)] // 5th percentile = noise floor
    const p95 = sorted[Math.floor(sorted.length * 0.95)] // 95th percentile = speech level

    const noiseFloor = this.linearToDb(p5)
    const speechLevel = this.linearToDb(p95)
    const snrRatio = speechLevel - noiseFloor

    // Generate recommendations based on SNR
    const recommendedSettings = this.generateRecommendations(snrRatio, noiseFloor)

    return {
      noiseFloor,
      speechLevel,
      snrRatio,
      clippingDetected,
      recommendedSettings,
    }
  }

  /**
   * Generate configuration recommendations based on audio analysis
   */
  private generateRecommendations(snr: number, noiseFloor: number) {
    let suppressionFactor = 0.7
    let noiseGateDb = -50
    let voiceActivityThreshold = 0.02

    // SNR-based recommendations
    if (snr < 5) {
      // Very noisy environment
      suppressionFactor = 0.95
      noiseGateDb = -35
      voiceActivityThreshold = 0.035
    } else if (snr < 10) {
      // Moderately noisy
      suppressionFactor = 0.85
      noiseGateDb = -42
      voiceActivityThreshold = 0.028
    } else if (snr < 15) {
      // Some background noise
      suppressionFactor = 0.75
      noiseGateDb = -48
      voiceActivityThreshold = 0.022
    } else if (snr >= 20) {
      // Quiet environment
      suppressionFactor = 0.5
      noiseGateDb = -58
      voiceActivityThreshold = 0.012
    }

    return {
      suppressionFactor,
      noiseGateDb,
      voiceActivityThreshold,
    }
  }

  /**
   * Get default settings
   */
  private getDefaultSettings() {
    return {
      suppressionFactor: 0.7,
      noiseGateDb: -50,
      voiceActivityThreshold: 0.02,
    }
  }

  /**
   * Convert linear to dB
   */
  private linearToDb(value: number): number {
    return 20 * Math.log10(Math.max(value, 0.00001))
  }

  /**
   * Stop microphone access
   */
  stopMicrophone(): void {
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach(track => track.stop())
      this.mediaStream = null
    }
  }
}

/**
 * React hook for audio diagnostics
 */
export function useAudioDiagnostic(audioContext: AudioContext | null) {
  const diagnosticRef = useRef<AudioDiagnostic | null>(null)

  React.useEffect(() => {
    if (audioContext && !diagnosticRef.current) {
      diagnosticRef.current = new AudioDiagnostic(audioContext)
    }

    return () => {
      diagnosticRef.current?.stopMicrophone()
    }
  }, [audioContext])

  return {
    testAudio: async (duration?: number) => {
      if (!diagnosticRef.current) {
        try {
          await diagnosticRef.current?.requestMicrophone()
          return await diagnosticRef.current?.testAudioInput(duration)
        } catch (error) {
          console.error('Audio test failed:', error)
          throw error
        }
      }
    },
  }
}

/**
 * Component to display audio test results
 */
export function AudioTestResultsDisplay({ result }: { result: AudioTestResult | null }) {
  if (!result) return null

  const getSNRColor = (snr: number) => {
    if (snr < 5) return 'text-red-600'
    if (snr < 10) return 'text-orange-600'
    if (snr < 15) return 'text-yellow-600'
    return 'text-green-600'
  }

  return (
    <div className="space-y-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
      <div className="grid grid-cols-3 gap-4">
        <div>
          <p className="text-xs text-gray-600">Noise Floor</p>
          <p className="text-lg font-semibold">{result.noiseFloor.toFixed(1)} dB</p>
        </div>
        <div>
          <p className="text-xs text-gray-600">Speech Level</p>
          <p className="text-lg font-semibold">{result.speechLevel.toFixed(1)} dB</p>
        </div>
        <div>
          <p className="text-xs text-gray-600">Signal-to-Noise Ratio</p>
          <p className={`text-lg font-semibold ${getSNRColor(result.snrRatio)}`}>
            {result.snrRatio.toFixed(1)} dB
          </p>
        </div>
      </div>

      {result.clippingDetected && (
        <div className="p-3 bg-red-50 border border-red-200 rounded text-sm text-red-700">
          ⚠️ Clipping detected! Reduce microphone input level.
        </div>
      )}

      <div className="space-y-2">
        <p className="text-sm font-semibold text-gray-900">Recommended Settings:</p>
        <div className="grid grid-cols-3 gap-2 text-sm">
          <div>
            <p className="text-gray-600">Suppression</p>
            <p className="font-mono font-semibold">
              {(result.recommendedSettings.suppressionFactor * 100).toFixed(0)}%
            </p>
          </div>
          <div>
            <p className="text-gray-600">Gate Threshold</p>
            <p className="font-mono font-semibold">
              {result.recommendedSettings.noiseGateDb} dB
            </p>
          </div>
          <div>
            <p className="text-gray-600">VAD Threshold</p>
            <p className="font-mono font-semibold">
              {result.recommendedSettings.voiceActivityThreshold.toFixed(3)}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AudioDiagnostic
