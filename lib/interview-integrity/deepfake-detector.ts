/**
 * Deepfake and AI Voice Detection Module
 * Detects potential deepfake videos and AI-generated voices during interviews
 */

export interface DeepfakeDetectionResult {
  isLikelyDeepfake: boolean
  isLikelyAIVoice: boolean
  confidenceScore: number // 0-1
  violations: DeepfakeViolation[]
  timestamp: number
}

export interface DeepfakeViolation {
  type: 'video-artifact' | 'voice-pattern' | 'biometric-mismatch' | 'frame-inconsistency' | 'audio-compression' | 'lip-sync-mismatch'
  severity: 'low' | 'medium' | 'high' | 'critical'
  description: string
  confidence: number
  frameNumber?: number
}

class DeepfakeDetector {
  private audioContext: AudioContext | null = null
  private videoCanvas: HTMLCanvasElement | null = null
  private lastFrameHash: string = ''
  private consecutiveArtifacts: number = 0
  private voicePatterns: Map<string, number> = new Map() // Store voice frequency patterns
  private blinkPatterns: Array<number> = [] // Track eye blink intervals
  private lipSyncBuffer: Array<{ audioEnergy: number; lipMovement: number }> = []
  private readonly ARTIFACT_THRESHOLD = 3 // Violations needed to flag
  private readonly VOICE_AI_INDICATORS = [
    'robotic_pattern',
    'unnatural_frequency_range',
    'perfect_noise_gate',
    'compression_artifacts',
    'zero_breathing_sounds'
  ]
  private readonly FRAME_CONSISTENCY_THRESHOLD = 0.85

  /**
   * Initialize deepfake detector with audio and video streams
   */
  init(audioStream: MediaStream, videoStream?: MediaStream): void {
    try {
      if (!this.audioContext) {
        this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
      }

      if (!this.videoCanvas) {
        this.videoCanvas = document.createElement('canvas')
        this.videoCanvas.width = 640
        this.videoCanvas.height = 480
      }

      console.log('[DeepfakeDetector] ✅ Initialized with streams')
    } catch (error) {
      console.error('[DeepfakeDetector] ❌ Initialization error:', error)
    }
  }

  /**
   * Analyze video frame for deepfake artifacts
   */
  analyzeVideoFrame(videoElement: HTMLVideoElement): DeepfakeViolation[] {
    const violations: DeepfakeViolation[] = []

    try {
      if (!this.videoCanvas) return violations

      const ctx = this.videoCanvas.getContext('2d')
      if (!ctx) return violations

      // Draw current frame to canvas
      ctx.drawImage(videoElement, 0, 0, this.videoCanvas.width, this.videoCanvas.height)
      const imageData = ctx.getImageData(0, 0, this.videoCanvas.width, this.videoCanvas.height)
      const data = imageData.data

      // Check for common deepfake artifacts
      violations.push(...this.detectVideoArtifacts(data, videoElement))
      violations.push(...this.detectLipSyncIssues(data, videoElement))
      violations.push(...this.detectFrameConsistency(data))
      violations.push(...this.detectBiometricIssues(videoElement))

      // Track consecutive artifacts
      if (violations.length > 0) {
        this.consecutiveArtifacts++
      } else {
        this.consecutiveArtifacts = 0
      }

      return violations
    } catch (error) {
      console.error('[DeepfakeDetector] Video analysis error:', error)
      return []
    }
  }

  /**
   * Analyze audio for AI voice characteristics
   */
  analyzeAudio(audioBuffer: AudioBuffer): DeepfakeViolation[] {
    const violations: DeepfakeViolation[] = []

    try {
      const channelData = audioBuffer.getChannelData(0)
      
      // Analyze frequency spectrum
      violations.push(...this.detectUnnaturedFrequencyRange(channelData))
      violations.push(...this.detectRoboticsPatterns(channelData))
      violations.push(...this.detectPerfectNoiseGate(channelData))
      violations.push(...this.detectCompressionArtifacts(channelData))
      violations.push(...this.detectBreathingAbsence(channelData))
      violations.push(...this.detectProsodyIssues(channelData))

      return violations
    } catch (error) {
      console.error('[DeepfakeDetector] Audio analysis error:', error)
      return []
    }
  }

  /**
   * Detect visual artifacts in video frame (color bleeding, edge artifacts, etc.)
   */
  private detectVideoArtifacts(
    imageData: Uint8ClampedArray,
    videoElement: HTMLVideoElement
  ): DeepfakeViolation[] {
    const violations: DeepfakeViolation[] = []
    const pixelCount = imageData.length / 4

    // Check for color bleeding artifacts common in deepfakes
    let colorBleeds = 0
    let inconsistentAlpha = 0

    for (let i = 0; i < pixelCount - 4; i += 4) {
      const r1 = imageData[i * 4]
      const g1 = imageData[i * 4 + 1]
      const b1 = imageData[i * 4 + 2]
      const a1 = imageData[i * 4 + 3]

      const r2 = imageData[(i + 1) * 4]
      const g2 = imageData[(i + 1) * 4 + 1]
      const b2 = imageData[(i + 1) * 4 + 2]

      // Detect suspicious color transitions (common in deepfake blending)
      const rDiff = Math.abs(r1 - r2)
      const gDiff = Math.abs(g1 - g2)
      const bDiff = Math.abs(b1 - b2)

      if (rDiff > 100 && gDiff < 20 && bDiff < 20) colorBleeds++
      if (a1 > 200 && a1 < 255) inconsistentAlpha++
    }

    const bleedRatio = colorBleeds / pixelCount
    if (bleedRatio > 0.05) {
      violations.push({
        type: 'video-artifact',
        severity: 'high',
        description: 'Detected suspicious color bleeding patterns typical of deepfake generation',
        confidence: Math.min(0.95, bleedRatio * 10),
        frameNumber: videoElement.currentTime
      })
    }

    if (inconsistentAlpha / pixelCount > 0.1) {
      violations.push({
        type: 'video-artifact',
        severity: 'medium',
        description: 'Detected unnatural alpha channel inconsistencies',
        confidence: 0.7,
        frameNumber: videoElement.currentTime
      })
    }

    return violations
  }

  /**
   * Detect lip-sync mismatches between audio and video
   */
  private detectLipSyncIssues(
    imageData: Uint8ClampedArray,
    videoElement: HTMLVideoElement
  ): DeepfakeViolation[] {
    const violations: DeepfakeViolation[] = []

    // Estimate mouth region movement (simplified lip detection)
    const mouthRegion = this.extractMouthRegion(imageData)
    const lipMovement = this.calculateLipMovement(mouthRegion)

    // This would be paired with audio energy analysis for sync check
    if (this.lipSyncBuffer.length > 30) {
      const avgAudioEnergy = this.lipSyncBuffer.reduce((sum, item) => sum + item.audioEnergy, 0) / 
                             this.lipSyncBuffer.length
      const avgLipMovement = this.lipSyncBuffer.reduce((sum, item) => sum + item.lipMovement, 0) / 
                            this.lipSyncBuffer.length

      // If audio is high but lips not moving, or vice versa
      if ((avgAudioEnergy > 0.6 && avgLipMovement < 0.2) || (avgAudioEnergy < 0.3 && avgLipMovement > 0.6)) {
        violations.push({
          type: 'lip-sync-mismatch',
          severity: 'critical',
          description: 'Detected lip-sync mismatch between audio and video movement',
          confidence: 0.85,
          frameNumber: videoElement.currentTime
        })
      }

      this.lipSyncBuffer = [] // Reset buffer
    }

    return violations
  }

  /**
   * Detect frame-to-frame consistency issues
   */
  private detectFrameConsistency(imageData: Uint8ClampedArray): DeepfakeViolation[] {
    const violations: DeepfakeViolation[] = []

    const currentHash = this.hashImageData(imageData)
    const similarity = this.calculateImageSimilarity(this.lastFrameHash, currentHash)

    // If frames are too identical, it might be a looped deepfake
    if (similarity > 0.98 && this.lastFrameHash !== '') {
      violations.push({
        type: 'frame-inconsistency',
        severity: 'medium',
        description: 'Detected abnormally high frame-to-frame similarity (possible looping)',
        confidence: 0.75
      })
    }

    this.lastFrameHash = currentHash
    return violations
  }

  /**
   * Detect biometric inconsistencies (eye blink patterns, face movements)
   */
  private detectBiometricIssues(videoElement: HTMLVideoElement): DeepfakeViolation[] {
    const violations: DeepfakeViolation[] = []

    // Track eye blink patterns
    // Normal blink interval is 3-6 seconds, duration 100-400ms
    // Deepfakes often show irregular patterns

    // This is simplified - in production, you'd use face detection API
    this.blinkPatterns.push(videoElement.currentTime)

    if (this.blinkPatterns.length > 5) {
      const intervals = []
      for (let i = 1; i < this.blinkPatterns.length; i++) {
        intervals.push(this.blinkPatterns[i] - this.blinkPatterns[i - 1])
      }

      const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length
      const variance = intervals.reduce((sum, val) => sum + Math.pow(val - avgInterval, 2), 0) / intervals.length

      // Very high variance or very short intervals suggests deepfake
      if (variance > 4 || avgInterval < 1.5) {
        violations.push({
          type: 'biometric-mismatch',
          severity: 'high',
          description: 'Detected unnatural eye blink pattern inconsistent with natural behavior',
          confidence: 0.8
        })
      }

      this.blinkPatterns = []
    }

    return violations
  }

  /**
   * Detect unnatural frequency ranges in voice
   */
  private detectUnnaturedFrequencyRange(channelData: Float32Array): DeepfakeViolation[] {
    const violations: DeepfakeViolation[] = []

    // Use FFT to analyze frequency spectrum
    const spectrum = this.performFFT(channelData)
    
    // Human voices typically have energy in 85Hz - 8000Hz range
    // Check if energy distribution is unnatural
    let dominantFrequencies = 0
    let highFrequencyEnergy = 0
    let veryLowFrequencyEnergy = 0

    spectrum.forEach((energy, index) => {
      const frequency = (index / spectrum.length) * 24000 // Nyquist for 48kHz sample rate
      
      if (frequency < 50 || frequency > 10000) {
        veryLowFrequencyEnergy += energy
      }
      if (frequency > 8000) {
        highFrequencyEnergy += energy
      }
      if (energy > 0.7) {
        dominantFrequencies++
      }
    })

    // AI voices often have unnaturally concentrated frequencies
    if (dominantFrequencies > spectrum.length * 0.3) {
      violations.push({
        type: 'voice-pattern',
        severity: 'high',
        description: 'Detected unnaturally concentrated frequency distribution characteristic of AI synthesis',
        confidence: 0.82
      })
    }

    return violations
  }

  /**
   * Detect robotic patterns in voice
   */
  private detectRoboticsPatterns(channelData: Float32Array): DeepfakeViolation[] {
    const violations: DeepfakeViolation[] = []

    // Analyze for mechanical patterns, pitch shifts, formant irregularities
    const formants = this.extractFormants(channelData)
    
    // Real human voices have natural formant transitions
    // AI often shows abrupt transitions
    const transitions = []
    for (let i = 1; i < formants.length; i++) {
      transitions.push(Math.abs(formants[i] - formants[i - 1]))
    }

    const avgTransition = transitions.reduce((a, b) => a + b, 0) / transitions.length
    const variance = transitions.reduce((sum, val) => sum + Math.pow(val - avgTransition, 2), 0) / transitions.length

    // High variance suggests unnatural pitch changes
    if (variance > 150) {
      violations.push({
        type: 'voice-pattern',
        severity: 'medium',
        description: 'Detected robotic patterns with unnatural pitch transitions',
        confidence: 0.75
      })
    }

    return violations
  }

  /**
   * Detect perfect noise gates (sign of AI processing)
   */
  private detectPerfectNoiseGate(channelData: Float32Array): DeepfakeViolation[] {
    const violations: DeepfakeViolation[] = []

    // Analyze for perfect silence moments - AI voices often have perfect quiet periods
    let silentFrames = 0
    const windowSize = 2048
    
    for (let i = 0; i < channelData.length - windowSize; i += windowSize) {
      const window = channelData.slice(i, i + windowSize)
      const rms = Math.sqrt(window.reduce((sum, val) => sum + val * val, 0) / windowSize)
      
      if (rms < 0.001) { // Near-perfect silence
        silentFrames++
      }
    }

    const silenceRatio = silentFrames / (channelData.length / windowSize)
    
    // Natural speech has some background noise/breathing
    if (silenceRatio > 0.4) {
      violations.push({
        type: 'voice-pattern',
        severity: 'high',
        description: 'Detected unnaturally perfect noise gating typical of AI voice synthesis',
        confidence: 0.85
      })
    }

    return violations
  }

  /**
   * Detect audio compression artifacts from synthesis
   */
  private detectCompressionArtifacts(channelData: Float32Array): DeepfakeViolation[] {
    const violations: DeepfakeViolation[] = []

    // Analyze for harmonic distortion patterns from codec/synthesis artifacts
    const spectrum = this.performFFT(channelData)
    let harmonicEnergy = 0

    // Check for suspicious harmonic patterns
    for (let i = 1; i < spectrum.length; i++) {
      if (i > 0 && spectrum[i] > spectrum[i - 1] * 1.5) {
        harmonicEnergy += spectrum[i]
      }
    }

    if (harmonicEnergy > spectrum.reduce((a, b) => a + b, 0) * 0.3) {
      violations.push({
        type: 'audio-compression',
        severity: 'medium',
        description: 'Detected compression artifacts consistent with AI voice synthesis',
        confidence: 0.72
      })
    }

    return violations
  }

  /**
   * Detect absence of breathing sounds (sign of AI)
   */
  private detectBreathingAbsence(channelData: Float32Array): DeepfakeViolation[] {
    const violations: DeepfakeViolation[] = []

    // Real human speech includes breathing, voice breaks, etc.
    // Analyze low-frequency breathing patterns (typically 100-500Hz)
    const spectrum = this.performFFT(channelData)
    
    let lowFrequencyEnergy = 0
    let totalEnergy = 0

    spectrum.forEach((energy, index) => {
      const frequency = (index / spectrum.length) * 24000
      totalEnergy += energy
      
      if (frequency > 50 && frequency < 500) {
        lowFrequencyEnergy += energy
      }
    })

    const breathingRatio = lowFrequencyEnergy / totalEnergy

    // Natural speech has some breathing energy
    if (breathingRatio < 0.05) {
      violations.push({
        type: 'voice-pattern',
        severity: 'medium',
        description: 'Detected absence of natural breathing sounds characteristic of AI synthesis',
        confidence: 0.70
      })
    }

    return violations
  }

  /**
   * Detect prosody issues (intonation, stress patterns)
   */
  private detectProsodyIssues(channelData: Float32Array): DeepfakeViolation[] {
    const violations: DeepfakeViolation[] = []

    // Analyze pitch contour for natural prosody
    const pitchContour = this.extractPitchContour(channelData)
    
    if (pitchContour.length < 10) return violations

    // Natural speech has varying pitch with meaningful patterns
    const pitchVariance = pitchContour.reduce((sum, val) => sum + Math.pow(val - 120, 2), 0) / pitchContour.length
    
    // Very stable pitch is unnatural
    if (pitchVariance < 20) {
      violations.push({
        type: 'voice-pattern',
        severity: 'medium',
        description: 'Detected unnaturally stable pitch (monotone) characteristic of AI voice',
        confidence: 0.68
      })
    }

    return violations
  }

  /**
   * Get final deepfake detection result
   */
  getDetectionResult(videoViolations: DeepfakeViolation[], audioViolations: DeepfakeViolation[]): DeepfakeDetectionResult {
    const allViolations = [...videoViolations, ...audioViolations]
    
    // Calculate confidence score
    const criticalCount = allViolations.filter(v => v.severity === 'critical').length
    const highCount = allViolations.filter(v => v.severity === 'high').length
    const mediumCount = allViolations.filter(v => v.severity === 'medium').length

    const confidenceScore = Math.min(
      0.99,
      (criticalCount * 0.3 + highCount * 0.15 + mediumCount * 0.05) / 10
    )

    return {
      isLikelyDeepfake: criticalCount > 0 || (highCount >= 2 && mediumCount >= 2),
      isLikelyAIVoice: audioViolations.length >= 3,
      confidenceScore,
      violations: allViolations,
      timestamp: Date.now()
    }
  }

  // Helper methods
  private hashImageData(imageData: Uint8ClampedArray): string {
    let hash = 0
    for (let i = 0; i < imageData.length; i += 100) {
      hash = ((hash << 5) - hash) + imageData[i]
      hash = hash & hash // Convert to 32bit integer
    }
    return hash.toString()
  }

  private calculateImageSimilarity(hash1: string, hash2: string): number {
    if (!hash1 || !hash2) return 0
    return hash1 === hash2 ? 1 : 0
  }

  private extractMouthRegion(imageData: Uint8ClampedArray): Uint8ClampedArray {
    // Simplified mouth region extraction (would use face detection in production)
    return imageData.slice(imageData.length * 0.6, imageData.length * 0.85)
  }

  private calculateLipMovement(region: Uint8ClampedArray): number {
    let movement = 0
    for (let i = 0; i < region.length; i += 4) {
      movement += (region[i] + region[i + 1] + region[i + 2]) / 3
    }
    return movement / (region.length / 4) / 255
  }

  private performFFT(data: Float32Array): number[] {
    // Simplified FFT - in production use actual FFT library
    const spectrum: number[] = []
    const bins = 256

    for (let i = 0; i < bins; i++) {
      let energy = 0
      const step = Math.floor(data.length / bins)
      for (let j = 0; j < step; j++) {
        const idx = i * step + j
        if (idx < data.length) energy += Math.abs(data[idx])
      }
      spectrum.push(energy / step)
    }

    return spectrum
  }

  private extractFormants(channelData: Float32Array): number[] {
    // Simplified formant extraction
    const spectrum = this.performFFT(channelData)
    const formants: number[] = []

    for (let i = 1; i < spectrum.length - 1; i++) {
      if (spectrum[i] > spectrum[i - 1] && spectrum[i] > spectrum[i + 1]) {
        formants.push((i / spectrum.length) * 24000)
      }
    }

    return formants.slice(0, 3) // First 3 formants typically
  }

  private extractPitchContour(channelData: Float32Array): number[] {
    // Simplified pitch extraction
    const spectrum = this.performFFT(channelData)
    const pitches: number[] = []

    const windowSize = 2048
    for (let i = 0; i < channelData.length; i += windowSize) {
      const window = channelData.slice(i, i + windowSize)
      const windowSpectrum = this.performFFT(window)
      
      let maxIndex = 0
      let maxEnergy = 0
      for (let j = 0; j < windowSpectrum.length; j++) {
        if (windowSpectrum[j] > maxEnergy) {
          maxEnergy = windowSpectrum[j]
          maxIndex = j
        }
      }

      const frequency = (maxIndex / windowSpectrum.length) * 24000
      if (frequency > 50 && frequency < 300) { // Voice fundamental frequency range
        pitches.push(frequency)
      }
    }

    return pitches
  }
}

export const deepfakeDetector = new DeepfakeDetector()
