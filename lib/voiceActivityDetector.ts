/**
 * Voice Activity Detection (VAD) Utility
 * Detects when the user is speaking to help manage conversation flow
 */

export interface VADConfig {
  threshold: number // -50 to 0 dB, higher = more sensitive
  minDuration: number // Minimum duration of voice activity in ms
  maxSilence: number // Maximum silence duration before ending speech in ms
  smoothingFactor: number // 0-1, higher = smoother detection
}

export interface VADState {
  isSpeaking: boolean
  confidence: number // 0-1
  voiceDuration: number // ms
  silenceDuration: number // ms
}

export class VoiceActivityDetector {
  private config: VADConfig
  private isSpeaking: boolean = false
  private voiceStartTime: number = 0
  private silenceStartTime: number = 0
  private energyHistory: number[] = []
  private maxHistorySize: number = 50
  private smoothedEnergy: number = 0
  private lastVoiceTime: number = 0

  constructor(config?: Partial<VADConfig>) {
    this.config = {
      threshold: -40, // dB
      minDuration: 100, // ms
      maxSilence: 800, // ms - user pause between speaking
      smoothingFactor: 0.7,
      ...config
    }
  }

  /**
   * Analyze audio frame for voice activity
   */
  analyzeFrame(audioData: Float32Array, timestamp: number = Date.now()): VADState {
    // Calculate energy in dB
    const energy = this.calculateEnergy(audioData)
    const energyDb = this.linearToDb(energy)

    // Smooth energy detection
    this.smoothedEnergy =
      this.config.smoothingFactor * this.smoothedEnergy +
      (1 - this.config.smoothingFactor) * energyDb

    // Track energy history for confidence
    this.energyHistory.push(this.smoothedEnergy)
    if (this.energyHistory.length > this.maxHistorySize) {
      this.energyHistory.shift()
    }

    // Detect voice based on threshold
    const voiceDetected = this.smoothedEnergy > this.config.threshold

    // Update speech state
    if (voiceDetected && !this.isSpeaking) {
      // Start of speech
      this.isSpeaking = true
      this.voiceStartTime = timestamp
      this.silenceStartTime = timestamp
      console.log('[VAD] 🎤 Speech started')
    } else if (!voiceDetected && this.isSpeaking) {
      // Possible end of speech - check silence duration
      if (this.silenceStartTime === timestamp) {
        this.silenceStartTime = timestamp
      }

      const silenceDuration = timestamp - this.silenceStartTime

      if (silenceDuration > this.config.maxSilence) {
        // End of speech detected
        this.isSpeaking = false
        const totalDuration = timestamp - this.voiceStartTime
        console.log('[VAD] 🤐 Speech ended, duration:', totalDuration, 'ms')
        this.lastVoiceTime = timestamp
      }
    } else if (voiceDetected && this.isSpeaking) {
      // Continue speaking
      this.silenceStartTime = timestamp
    }

    // Calculate confidence (0-1)
    const confidence = this.calculateConfidence()

    // Calculate durations
    const voiceDuration = this.isSpeaking
      ? Math.max(0, timestamp - this.voiceStartTime)
      : 0
    const silenceDuration = this.isSpeaking
      ? Math.max(0, timestamp - this.silenceStartTime)
      : timestamp - this.lastVoiceTime

    return {
      isSpeaking: this.isSpeaking && voiceDuration >= this.config.minDuration,
      confidence,
      voiceDuration,
      silenceDuration
    }
  }

  /**
   * Calculate RMS energy
   */
  private calculateEnergy(audioData: Float32Array): number {
    let sum = 0
    for (let i = 0; i < audioData.length; i++) {
      sum += audioData[i] * audioData[i]
    }
    return Math.sqrt(sum / audioData.length)
  }

  /**
   * Convert linear amplitude to dB
   */
  private linearToDb(linear: number): number {
    return 20 * Math.log10(Math.max(linear, 1e-6))
  }

  /**
   * Calculate confidence based on energy consistency
   */
  private calculateConfidence(): number {
    if (this.energyHistory.length === 0) return 0

    // Calculate variance of recent energy values
    const recentEnergy = this.energyHistory.slice(-10)
    const mean =
      recentEnergy.reduce((a, b) => a + b, 0) / recentEnergy.length
    const variance =
      recentEnergy.reduce((sum, val) => sum + (val - mean) ** 2, 0) /
      recentEnergy.length

    // Lower variance = higher confidence (consistent signal = more likely to be voice)
    const stdev = Math.sqrt(variance)
    const consistency = Math.max(0, 1 - stdev / 20) // Normalize to 0-1

    return consistency
  }

  /**
   * Reset VAD state
   */
  reset(): void {
    this.isSpeaking = false
    this.voiceStartTime = 0
    this.silenceStartTime = 0
    this.energyHistory = []
    this.smoothedEnergy = 0
    this.lastVoiceTime = 0
    console.log('[VAD] Reset')
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig: Partial<VADConfig>): void {
    this.config = { ...this.config, ...newConfig }
    console.log('[VAD] Configuration updated:', this.config)
  }

  /**
   * Get current state
   */
  getState(): VADState {
    return {
      isSpeaking: this.isSpeaking,
      confidence: this.calculateConfidence(),
      voiceDuration: this.isSpeaking ? Date.now() - this.voiceStartTime : 0,
      silenceDuration: Date.now() -
        (this.isSpeaking ? this.silenceStartTime : this.lastVoiceTime)
    }
  }
}

/**
 * Simple utility function for quick VAD analysis
 */
export function detectVoiceInFrame(
  audioData: Float32Array,
  threshold: number = -40
): { isVoice: boolean; energyDb: number } {
  let sum = 0
  for (let i = 0; i < audioData.length; i++) {
    sum += audioData[i] * audioData[i]
  }
  const rms = Math.sqrt(sum / audioData.length)
  const energyDb = 20 * Math.log10(Math.max(rms, 1e-6))

  return {
    isVoice: energyDb > threshold,
    energyDb
  }
}
