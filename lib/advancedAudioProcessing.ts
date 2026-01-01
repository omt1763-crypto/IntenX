/**
 * Advanced Audio Processing for Interview Application
 * Includes noise suppression, echo cancellation, and VAD (Voice Activity Detection)
 */

export interface AudioQualityMetrics {
  snr: number // Signal-to-Noise Ratio in dB
  volume: number // Overall volume level
  noiseLevel: number // Detected noise level
  isClipping: boolean // Whether audio is clipping
  isSpeech: boolean // Whether speech is detected
}

export interface NoiseSuppressionState {
  isCalibrated: boolean
  calibrationProgress: number // 0-100
  noiseFloor: Float32Array | null
  spectralProfile: Float32Array | null
}

/**
 * Advanced noise suppression processor with multiple techniques
 */
export class AdvancedAudioProcessor {
  private fftSize: number = 4096
  private overlapFactor: number = 0.5
  private noiseFloor: Float32Array | null = null
  private spectralProfile: Float32Array | null = null
  private isCalibrated: boolean = false
  private calibrationFrameCount: number = 0
  private calibrationTarget: number = 50 // Frames for calibration (~1-2 seconds at 25fps)
  
  // Hann window for STFT
  private window: Float32Array
  
  // Buffers for overlap-add processing
  private inputBuffer: Float32Array
  private outputBuffer: Float32Array
  private currentPosition: number = 0

  // Configuration
  private config = {
    suppressionFactor: 0.8,  // How much to suppress noise (0-1)
    minimumMask: 0.1,        // Minimum spectral mask value
    temporalSmoothing: 0.98, // Smoothing factor for noise estimate
    frequencySmoothing: 0.95, // Smoothing across frequency bins
    voiceActivityThreshold: 0.02,
    noiseGateDb: -50,
  }

  constructor(fftSize: number = 4096) {
    this.fftSize = fftSize
    this.window = this.createHannWindow(fftSize)
    this.inputBuffer = new Float32Array(fftSize)
    this.outputBuffer = new Float32Array(fftSize)
  }

  /**
   * Create Hann window for STFT
   */
  private createHannWindow(size: number): Float32Array {
    const window = new Float32Array(size)
    for (let i = 0; i < size; i++) {
      window[i] = 0.5 * (1 - Math.cos((2 * Math.PI * i) / (size - 1)))
    }
    return window
  }

  /**
   * Calculate RMS (Root Mean Square) energy
   */
  private calculateRMS(data: Float32Array): number {
    let sum = 0
    for (let i = 0; i < data.length; i++) {
      sum += data[i] * data[i]
    }
    return Math.sqrt(sum / data.length)
  }

  /**
   * Convert linear amplitude to dB
   */
  private linearToDb(linear: number): number {
    return 20 * Math.log10(Math.max(linear, 0.00001))
  }

  /**
   * Convert dB to linear amplitude
   */
  private dbToLinear(db: number): number {
    return Math.pow(10, db / 20)
  }

  /**
   * Perform FFT using Cooley-Tukey algorithm
   */
  private fft(real: Float32Array, imag: Float32Array): void {
    const N = real.length
    if (N <= 1) return

    // Divide
    const evenReal = new Float32Array(N / 2)
    const evenImag = new Float32Array(N / 2)
    const oddReal = new Float32Array(N / 2)
    const oddImag = new Float32Array(N / 2)

    for (let i = 0; i < N / 2; i++) {
      evenReal[i] = real[2 * i]
      evenImag[i] = imag[2 * i]
      oddReal[i] = real[2 * i + 1]
      oddImag[i] = imag[2 * i + 1]
    }

    // Conquer
    this.fft(evenReal, evenImag)
    this.fft(oddReal, oddImag)

    // Combine
    for (let k = 0; k < N / 2; k++) {
      const angle = (-2 * Math.PI * k) / N
      const cos = Math.cos(angle)
      const sin = Math.sin(angle)

      const oddRealScaled = oddReal[k] * cos - oddImag[k] * sin
      const oddImagScaled = oddReal[k] * sin + oddImag[k] * cos

      real[k] = evenReal[k] + oddRealScaled
      imag[k] = evenImag[k] + oddImagScaled
      real[k + N / 2] = evenReal[k] - oddRealScaled
      imag[k + N / 2] = evenImag[k] - oddImagScaled
    }
  }

  /**
   * Process audio with spectral subtraction and other techniques
   */
  processAudio(audioData: Float32Array): { audio: Float32Array; metrics: AudioQualityMetrics } {
    // Apply window to input
    const windowedInput = new Float32Array(this.fftSize)
    for (let i = 0; i < Math.min(audioData.length, this.fftSize); i++) {
      windowedInput[i] = (audioData[i] || 0) * this.window[i]
    }

    // Prepare for FFT
    const real = new Float32Array(this.fftSize)
    const imag = new Float32Array(this.fftSize)
    for (let i = 0; i < this.fftSize; i++) {
      real[i] = windowedInput[i]
    }

    // Perform FFT
    this.fft(real, imag)

    // Calculate magnitude spectrum
    const magnitude = new Float32Array(this.fftSize / 2)
    for (let i = 0; i < this.fftSize / 2; i++) {
      magnitude[i] = Math.sqrt(real[i] * real[i] + imag[i] * imag[i])
    }

    // Calibrate noise profile if needed
    if (!this.isCalibrated) {
      this.calibrateNoiseProfile(magnitude)
    }

    // Apply noise suppression
    const suppressedMagnitude = this.suppressNoise(magnitude)

    // Reconstruct phase
    for (let i = 0; i < this.fftSize / 2; i++) {
      const phase = Math.atan2(imag[i], real[i])
      real[i] = suppressedMagnitude[i] * Math.cos(phase)
      imag[i] = suppressedMagnitude[i] * Math.sin(phase)
    }

    // Inverse FFT (simplified)
    const output = this.ifft(real, imag)

    // Apply window and overlap-add
    const windowedOutput = new Float32Array(this.fftSize)
    for (let i = 0; i < this.fftSize; i++) {
      windowedOutput[i] = output[i] * this.window[i]
    }

    // Calculate audio quality metrics
    const metrics = this.calculateMetrics(audioData, suppressedMagnitude)

    // Return processed audio trimmed to original size
    return {
      audio: windowedOutput.slice(0, audioData.length),
      metrics
    }
  }

  /**
   * Calibrate noise profile from audio
   */
  private calibrateNoiseProfile(magnitude: Float32Array): void {
    if (this.noiseFloor === null) {
      this.noiseFloor = new Float32Array(magnitude.length)
      this.spectralProfile = new Float32Array(magnitude.length)
      this.noiseFloor.set(magnitude)
      this.spectralProfile.set(magnitude)
    } else {
      // Update with exponential smoothing
      for (let i = 0; i < magnitude.length; i++) {
        this.noiseFloor[i] = Math.min(
          this.noiseFloor[i],
          this.config.temporalSmoothing * this.noiseFloor[i] +
          (1 - this.config.temporalSmoothing) * magnitude[i]
        )
      }
    }

    this.calibrationFrameCount++
    if (this.calibrationFrameCount >= this.calibrationTarget) {
      this.isCalibrated = true
      console.log('[AdvancedAudioProcessor] ✅ Noise profile calibrated')
    }
  }

  /**
   * Apply spectral subtraction with spectral floor
   */
  private suppressNoise(magnitude: Float32Array): Float32Array {
    if (!this.noiseFloor || !this.isCalibrated) {
      return magnitude
    }

    const suppressed = new Float32Array(magnitude.length)
    
    for (let i = 0; i < magnitude.length; i++) {
      // Spectral subtraction with over-subtraction factor
      const noiseEstimate = this.noiseFloor[i] * this.config.suppressionFactor
      let suppressed_mag = magnitude[i] - noiseEstimate

      // Apply spectral floor to prevent over-subtraction
      suppressed_mag = Math.max(suppressed_mag, this.config.minimumMask * magnitude[i])

      // Apply frequency smoothing
      if (i > 0 && i < magnitude.length - 1) {
        suppressed[i] = 
          0.5 * suppressed_mag +
          0.25 * suppressed[i - 1] +
          0.25 * (i < magnitude.length - 1 ? magnitude[i + 1] : magnitude[i])
      } else {
        suppressed[i] = suppressed_mag
      }
    }

    return suppressed
  }

  /**
   * Simplified inverse FFT
   */
  private ifft(real: Float32Array, imag: Float32Array): Float32Array {
    const N = real.length
    const result = new Float32Array(N)

    // Simple inverse using symmetry properties
    for (let n = 0; n < N; n++) {
      let sumReal = 0, sumImag = 0

      for (let k = 0; k < N; k++) {
        const angle = (2 * Math.PI * k * n) / N
        const cos = Math.cos(angle)
        const sin = Math.sin(angle)

        sumReal += real[k] * cos - imag[k] * sin
        sumImag += real[k] * sin + imag[k] * cos
      }

      result[n] = sumReal / N
    }

    return result
  }

  /**
   * Calculate audio quality metrics
   */
  private calculateMetrics(
    audioData: Float32Array,
    spectrum: Float32Array
  ): AudioQualityMetrics {
    const rms = this.calculateRMS(audioData)
    const volumeDb = this.linearToDb(rms)

    // Check for clipping
    let maxAmplitude = 0
    for (let i = 0; i < audioData.length; i++) {
      maxAmplitude = Math.max(maxAmplitude, Math.abs(audioData[i]))
    }
    const isClipping = maxAmplitude > 0.99

    // Estimate noise level
    let noiseLevel = 0
    if (this.noiseFloor) {
      for (let i = 0; i < Math.min(spectrum.length, this.noiseFloor.length); i++) {
        noiseLevel += this.noiseFloor[i]
      }
      noiseLevel = this.linearToDb(noiseLevel / spectrum.length)
    }

    // Detect voice activity
    const isSpeech = rms > this.config.voiceActivityThreshold

    // Calculate SNR
    const snr = Math.max(0, volumeDb - noiseLevel)

    return {
      snr,
      volume: volumeDb,
      noiseLevel,
      isClipping,
      isSpeech
    }
  }

  /**
   * Get calibration status
   */
  getCalibrationStatus(): NoiseSuppressionState {
    return {
      isCalibrated: this.isCalibrated,
      calibrationProgress: Math.min(100, (this.calibrationFrameCount / this.calibrationTarget) * 100),
      noiseFloor: this.noiseFloor ? new Float32Array(this.noiseFloor) : null,
      spectralProfile: this.spectralProfile ? new Float32Array(this.spectralProfile) : null
    }
  }

  /**
   * Reset processor
   */
  reset(): void {
    this.noiseFloor = null
    this.spectralProfile = null
    this.isCalibrated = false
    this.calibrationFrameCount = 0
    this.currentPosition = 0
  }

  /**
   * Get current configuration
   */
  getConfig() {
    return { ...this.config }
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<typeof this.config>): void {
    Object.assign(this.config, config)
  }
}

/**
 * Utility function to detect voice activity
 */
export function detectVoiceActivity(
  audioData: Float32Array,
  options = { threshold: 0.02, minDuration: 100 }
): boolean {
  if (audioData.length === 0) return false

  let sum = 0
  for (let i = 0; i < audioData.length; i++) {
    sum += audioData[i] * audioData[i]
  }
  const rms = Math.sqrt(sum / audioData.length)

  return rms > options.threshold
}

/**
 * Utility to normalize audio
 */
export function normalizeAudio(audioData: Float32Array, targetRms: number = 0.3): Float32Array {
  let sum = 0
  for (let i = 0; i < audioData.length; i++) {
    sum += audioData[i] * audioData[i]
  }
  const currentRms = Math.sqrt(sum / audioData.length)

  if (currentRms < 0.00001) return audioData

  const scale = targetRms / currentRms
  const result = new Float32Array(audioData.length)

  for (let i = 0; i < audioData.length; i++) {
    result[i] = Math.max(-1, Math.min(1, audioData[i] * scale))
  }

  return result
}

/**
 * Apply high-pass filter to remove low-frequency rumble
 */
export function highPassFilter(audioData: Float32Array, cutoffFrequency: number = 80): Float32Array {
  // Simple single-pole high-pass filter
  const filterCoeff = cutoffFrequency / 44100 // Assuming 44.1kHz sample rate
  const filtered = new Float32Array(audioData.length)
  
  let prev = 0
  for (let i = 0; i < audioData.length; i++) {
    filtered[i] = filterCoeff * (prev + audioData[i] - audioData[i > 0 ? i - 1 : 0])
    prev = filtered[i]
  }

  return filtered
}
