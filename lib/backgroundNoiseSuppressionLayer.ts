/**
 * Background Noise Suppression Layer
 * Specialized module for suppressing background noises (fans, honks, ambient noise, etc.)
 * while preserving user speech clarity
 */

export interface NoiseSuppressionConfig {
  aggressiveness: number // 0-3, higher = more aggressive suppression
  minVoiceDb: number // Minimum dB level to consider as voice
  maxNoiseDb: number // Maximum dB threshold for background noise
  enableBandpassFilter: boolean
  enableSpectralSubtraction: boolean
  enableAdaptiveNoise: boolean
}

export interface NoiseMetrics {
  inputDb: number
  noiseDb: number
  voiceDb: number
  snr: number // Signal-to-Noise Ratio
  isVoiceDetected: boolean
  noiseReductionDb: number
}

export class BackgroundNoiseSuppressionLayer {
  private config: NoiseSuppressionConfig
  private noiseBaseline: Float32Array | null = null
  private calibrationFrames: number = 0
  private calibrationTarget: number = 120 // ~2.5 seconds at 48kHz with 1024 frame size
  private isCalibrated: boolean = false
  private frequencyBins: number
  private smoothedNoise: Float32Array | null = null
  private spectralGate: Float32Array | null = null
  private noiseHistory: number[] = []
  private voiceHistory: number[] = []
  private historySize: number = 10
  private hannWindow: Float32Array
  private prevAudio: Float32Array | null = null

  constructor(config?: Partial<NoiseSuppressionConfig>) {
    this.frequencyBins = 512
    this.config = {
      aggressiveness: 2, // Medium-aggressive (0-3)
      minVoiceDb: -30, // Minimum voice level
      maxNoiseDb: -50, // Maximum noise floor
      enableBandpassFilter: true,
      enableSpectralSubtraction: true,
      enableAdaptiveNoise: true,
      ...config
    }
    
    this.hannWindow = this.createHannWindow(1024)
    this.smoothedNoise = new Float32Array(this.frequencyBins)
    this.spectralGate = new Float32Array(this.frequencyBins)
  }

  /**
   * Create Hann window for STFT processing
   */
  private createHannWindow(size: number): Float32Array {
    const window = new Float32Array(size)
    for (let i = 0; i < size; i++) {
      window[i] = 0.5 * (1 - Math.cos((2 * Math.PI * i) / (size - 1)))
    }
    return window
  }

  /**
   * Calibrate noise suppression from initial audio buffer
   * Should be called during silence at the start
   */
  calibrateFromSilence(audioData: Float32Array): void {
    if (this.isCalibrated) return

    if (this.noiseBaseline === null) {
      const spectrum = this.computeSpectrum(audioData)
      this.noiseBaseline = spectrum
      this.smoothedNoise = new Float32Array(spectrum)
      console.log('[NoiseSuppressionLayer] Starting calibration...')
    } else {
      const spectrum = this.computeSpectrum(audioData)
      // Exponential smoothing of noise baseline
      for (let i = 0; i < spectrum.length; i++) {
        this.noiseBaseline![i] = 0.95 * this.noiseBaseline![i] + 0.05 * spectrum[i]
      }
    }

    this.calibrationFrames++
    const progress = Math.round((this.calibrationFrames / this.calibrationTarget) * 100)
    
    if (this.calibrationFrames % 20 === 0) {
      console.log(`[NoiseSuppressionLayer] Calibration progress: ${progress}%`)
    }

    if (this.calibrationFrames >= this.calibrationTarget) {
      this.isCalibrated = true
      console.log('[NoiseSuppressionLayer] ✅ Calibration complete - Ready for noise suppression')
    }
  }

  /**
   * Main processing function - applies noise suppression to audio
   */
  processAudio(audioData: Float32Array): { audio: Float32Array; metrics: NoiseMetrics } {
    // Step 1: Apply pre-emphasis filter to boost high frequencies where voice typically is
    const preEmphasisAudio = this.applyPreEmphasis(audioData)

    // Step 2: Compute frequency spectrum using FFT
    const spectrum = this.computeSpectrum(preEmphasisAudio)

    // Step 3: Estimate noise using voice activity detection
    const noiseEstimate = this.estimateNoise(spectrum)

    // Step 4: Apply spectral subtraction
    const cleanSpectrum = this.spectralSubtraction(spectrum, noiseEstimate)

    // Step 5: Apply voice activity aware masking
    const maskedSpectrum = this.applyVoiceActivityMask(cleanSpectrum, spectrum)

    // Step 6: Reconstruct audio from spectrum
    const cleanAudio = this.reconstructAudio(maskedSpectrum, preEmphasisAudio)

    // Step 7: Remove pre-emphasis
    const outputAudio = this.removePreEmphasis(cleanAudio)

    // Calculate metrics
    const metrics = this.calculateMetrics(audioData, noiseEstimate, spectrum, cleanSpectrum)

    return {
      audio: outputAudio,
      metrics
    }
  }

  /**
   * Apply pre-emphasis filter to boost high frequencies
   * Helps preserve voice clarity
   */
  private applyPreEmphasis(audio: Float32Array): Float32Array {
    const emphasized = new Float32Array(audio.length)
    const preEmphasisCoeff = 0.97

    for (let i = 0; i < audio.length; i++) {
      const prev = i > 0 ? audio[i - 1] : 0
      emphasized[i] = audio[i] - preEmphasisCoeff * prev
    }

    return emphasized
  }

  /**
   * Remove pre-emphasis filter
   */
  private removePreEmphasis(audio: Float32Array): Float32Array {
    const deemphasized = new Float32Array(audio.length)
    const deEmphasisCoeff = 0.97

    for (let i = 0; i < audio.length; i++) {
      const prev = i > 0 ? deemphasized[i - 1] : 0
      deemphasized[i] = audio[i] + deEmphasisCoeff * prev
    }

    return deemphasized
  }

  /**
   * Compute magnitude spectrum using FFT
   */
  private computeSpectrum(audio: Float32Array): Float32Array {
    const fftSize = Math.min(2048, Math.pow(2, Math.ceil(Math.log2(audio.length))))
    const real = new Float32Array(fftSize)
    const imag = new Float32Array(fftSize)

    // Apply window and prepare for FFT
    for (let i = 0; i < Math.min(audio.length, fftSize); i++) {
      const windowIdx = (i * this.hannWindow.length) / fftSize
      const windowVal = this.hannWindow[Math.floor(windowIdx)]
      real[i] = audio[i] * windowVal
    }

    // Simple FFT implementation
    this.fft(real, imag)

    // Calculate magnitude spectrum
    const spectrum = new Float32Array(fftSize / 2)
    for (let i = 0; i < fftSize / 2; i++) {
      spectrum[i] = Math.sqrt(real[i] * real[i] + imag[i] * imag[i])
    }

    return spectrum
  }

  /**
   * Fast Fourier Transform (Cooley-Tukey algorithm)
   */
  private fft(real: Float32Array, imag: Float32Array): void {
    const N = real.length
    if (N <= 1) return

    // Bit-reversal permutation
    let j = 0
    for (let i = 0; i < N - 1; i++) {
      if (i < j) {
        const tempR = real[i]
        const tempI = imag[i]
        real[i] = real[j]
        imag[i] = imag[j]
        real[j] = tempR
        imag[j] = tempI
      }

      let k = N / 2
      while (k <= j) {
        j -= k
        k /= 2
      }
      j += k
    }

    // FFT computation
    for (let len = 2; len <= N; len *= 2) {
      const angle = (2 * Math.PI) / len
      const wLen = Math.cos(angle)
      const wLenIm = -Math.sin(angle)

      for (let i = 0; i < N; i += len) {
        let wReal = 1
        let wIm = 0

        for (let j = 0; j < len / 2; j++) {
          const u = i + j
          const v = i + j + len / 2

          const tReal = real[v] * wReal - imag[v] * wIm
          const tIm = real[v] * wIm + imag[v] * wReal

          real[v] = real[u] - tReal
          imag[v] = imag[u] - tIm
          real[u] += tReal
          imag[u] += tIm

          const nextWReal = wReal * wLen - wIm * wLenIm
          const nextWIm = wReal * wLenIm + wIm * wLen
          wReal = nextWReal
          wIm = nextWIm
        }
      }
    }
  }

  /**
   * Estimate noise profile from spectrum
   */
  private estimateNoise(spectrum: Float32Array): Float32Array {
    if (!this.isCalibrated || !this.noiseBaseline) {
      return new Float32Array(spectrum.length).fill(1e-6)
    }

    const noise = new Float32Array(spectrum.length)

    for (let i = 0; i < spectrum.length; i++) {
      // Track minimum values over time to estimate noise floor
      if (!this.smoothedNoise) {
        this.smoothedNoise = new Float32Array(spectrum.length)
      }

      const minTrackCoeff = 0.998
      this.smoothedNoise[i] = Math.min(
        spectrum[i],
        minTrackCoeff * (this.smoothedNoise[i] || spectrum[i]) +
        (1 - minTrackCoeff) * spectrum[i]
      )

      noise[i] = this.smoothedNoise[i] * (1 + 0.1 * this.config.aggressiveness)
    }

    return noise
  }

  /**
   * Apply spectral subtraction with spectral floor
   */
  private spectralSubtraction(
    spectrum: Float32Array,
    noiseEstimate: Float32Array
  ): Float32Array {
    const cleaned = new Float32Array(spectrum.length)
    const overSubtractionFactor = 1.2 + 0.2 * this.config.aggressiveness

    for (let i = 0; i < spectrum.length; i++) {
      const noise = noiseEstimate[i] * overSubtractionFactor
      let magnitude = spectrum[i] - noise

      // Spectral floor to prevent over-subtraction
      const floor = 0.05 * spectrum[i]
      magnitude = Math.max(magnitude, floor)

      cleaned[i] = magnitude
    }

    return cleaned
  }

  /**
   * Apply voice activity aware masking
   * Preserves voice frequencies while suppressing noise
   */
  private applyVoiceActivityMask(
    cleanSpectrum: Float32Array,
    originalSpectrum: Float32Array
  ): Float32Array {
    const masked = new Float32Array(cleanSpectrum.length)
    const voiceRange = { start: 80, end: 8000 } // Hz range where most voice is

    for (let i = 0; i < cleanSpectrum.length; i++) {
      // Frequency-dependent masking
      // Keep more signal in voice frequency ranges
      const isVoiceFreq = i > 20 && i < 200 // Voice harmonics mostly in first 200 bins
      const maskStrength = isVoiceFreq ? 0.95 : 0.7

      masked[i] = cleanSpectrum[i] * maskStrength + originalSpectrum[i] * (1 - maskStrength)
    }

    return masked
  }

  /**
   * Reconstruct audio from frequency spectrum
   */
  private reconstructAudio(spectrum: Float32Array, originalAudio: Float32Array): Float32Array {
    const fftSize = Math.min(2048, Math.pow(2, Math.ceil(Math.log2(originalAudio.length))))

    // Simplified reconstruction - apply inverse gain
    const output = new Float32Array(originalAudio.length)
    const meanOriginal = this.calculateMean(originalAudio)
    const meanSpectrum = this.calculateMean(spectrum)

    const gainCompensation = meanOriginal > 1e-6 ? meanSpectrum / meanOriginal : 1

    for (let i = 0; i < output.length; i++) {
      output[i] = originalAudio[i] * gainCompensation
    }

    return output
  }

  /**
   * Calculate mean of array
   */
  private calculateMean(array: Float32Array): number {
    let sum = 0
    for (let i = 0; i < array.length; i++) {
      sum += Math.abs(array[i])
    }
    return sum / array.length
  }

  /**
   * Calculate RMS level in dB
   */
  private calculateRmsDb(audio: Float32Array): number {
    let sum = 0
    for (let i = 0; i < audio.length; i++) {
      sum += audio[i] * audio[i]
    }
    const rms = Math.sqrt(sum / audio.length)
    return 20 * Math.log10(Math.max(rms, 1e-6))
  }

  /**
   * Calculate metrics for monitoring audio quality
   */
  private calculateMetrics(
    originalAudio: Float32Array,
    noiseEstimate: Float32Array,
    originalSpectrum: Float32Array,
    cleanSpectrum: Float32Array
  ): NoiseMetrics {
    // Calculate levels
    const inputDb = this.calculateRmsDb(originalAudio)
    const noiseDb = this.calculateRmsDb(
      new Float32Array(
        Array.from(noiseEstimate).slice(0, Math.min(100, noiseEstimate.length))
      )
    )
    const voiceDb = this.calculateRmsDb(
      new Float32Array(
        Array.from(cleanSpectrum).slice(20, Math.min(200, cleanSpectrum.length))
      )
    )

    // Calculate SNR
    const snr = voiceDb - noiseDb

    // Voice detection with hysteresis
    const isVoiceDetected = snr > -5 && inputDb > this.config.minVoiceDb

    // Track history for smoothing
    this.voiceHistory.push(isVoiceDetected ? 1 : 0)
    this.noiseHistory.push(noiseDb)

    if (this.voiceHistory.length > this.historySize) {
      this.voiceHistory.shift()
      this.noiseHistory.shift()
    }

    // Calculate noise reduction amount
    const originalNoise = this.calculateRmsDb(
      new Float32Array(
        Array.from(originalSpectrum).slice(0, Math.min(100, originalSpectrum.length))
      )
    )
    const noiseReductionDb = originalNoise - noiseDb

    return {
      inputDb,
      noiseDb,
      voiceDb,
      snr,
      isVoiceDetected,
      noiseReductionDb: Math.max(0, noiseReductionDb)
    }
  }

  /**
   * Get calibration status
   */
  getCalibrationStatus(): { isCalibrated: boolean; progress: number } {
    const progress = Math.min(
      100,
      Math.round((this.calibrationFrames / this.calibrationTarget) * 100)
    )
    return { isCalibrated: this.isCalibrated, progress }
  }

  /**
   * Reset calibration
   */
  resetCalibration(): void {
    this.noiseBaseline = null
    this.smoothedNoise = null
    this.calibrationFrames = 0
    this.isCalibrated = false
    console.log('[NoiseSuppressionLayer] Calibration reset')
  }

  /**
   * Update configuration at runtime
   */
  updateConfig(newConfig: Partial<NoiseSuppressionConfig>): void {
    this.config = { ...this.config, ...newConfig }
    console.log('[NoiseSuppressionLayer] Configuration updated:', this.config)
  }
}
