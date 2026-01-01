/**
 * Audio Processing Utilities
 * Handles noise suppression, echo cancellation, and audio enhancement
 */

export interface NoiseSuppressionConfig {
  noiseReductionAmount: number // 0-1, higher = more aggressive
  noiseGateThreshold: number // dB level below which audio is silenced
  spectralSubtractionAlpha: number // Controls spectral subtraction strength
  enableEchoCancellation: boolean
  enableAutoGain: boolean
}

export const DEFAULT_NOISE_SUPPRESSION_CONFIG: NoiseSuppressionConfig = {
  noiseReductionAmount: 0.7,
  noiseGateThreshold: -50,
  spectralSubtractionAlpha: 0.98,
  enableEchoCancellation: true,
  enableAutoGain: true,
}

/**
 * Audio Processor for real-time noise suppression
 * Uses spectral subtraction and noise gating
 */
export class AudioProcessor {
  private context: AudioContext
  private analyser: AnalyserNode
  private noiseProfile: Float32Array | null = null
  private isNoiseProfileLocked: boolean = false
  private config: NoiseSuppressionConfig
  private frequencyData: Uint8Array
  private lastFrameData: Float32Array
  private noiseEstimate: Float32Array

  constructor(context: AudioContext, config: Partial<NoiseSuppressionConfig> = {}) {
    this.context = context
    this.config = { ...DEFAULT_NOISE_SUPPRESSION_CONFIG, ...config }
    
    // Create analyser node
    this.analyser = context.createAnalyser()
    this.analyser.fftSize = 2048
    
    // Initialize frequency and time domain buffers
    this.frequencyData = new Uint8Array(this.analyser.frequencyBinCount)
    this.lastFrameData = new Float32Array(this.analyser.fftSize)
    this.noiseEstimate = new Float32Array(this.analyser.frequencyBinCount)
    
    // Initialize noise estimate with default values
    this.noiseEstimate.fill(20) // Start with moderate noise estimate
  }

  /**
   * Set the noise profile for noise suppression
   * Should be called during silence to establish baseline noise
   */
  setNoiseProfile(audioData: Float32Array): void {
    if (this.isNoiseProfileLocked) return

    // Convert time-domain audio to frequency domain
    const fftSize = this.analyser.fftSize
    const spectrum = this.performFFT(audioData)
    
    // Create noise profile from current audio (should be mostly noise)
    this.noiseProfile = new Float32Array(spectrum.length)
    for (let i = 0; i < spectrum.length; i++) {
      // Smooth the noise profile
      this.noiseProfile[i] = spectrum[i] * 0.5
    }

    console.log('[AudioProcessor] 🔇 Noise profile set and locked')
    this.isNoiseProfileLocked = true
  }

  /**
   * Process audio frame with noise suppression
   */
  processAudio(audioData: Float32Array): Float32Array {
    if (audioData.length === 0) return audioData

    // Perform FFT to get frequency domain representation
    const spectrum = this.performFFT(audioData)
    
    // Apply spectral subtraction
    const processedSpectrum = this.spectralSubtraction(spectrum)
    
    // Apply noise gating
    const gatedSpectrum = this.noiseGating(processedSpectrum)
    
    // Convert back to time domain
    const processedAudio = this.performIFFT(gatedSpectrum, audioData.length)
    
    // Apply gain normalization to maintain volume
    return this.normalizeGain(processedAudio)
  }

  /**
   * Simple FFT approximation using Web Audio API analyzer
   */
  private performFFT(audioData: Float32Array): Float32Array {
    const spectrum = new Float32Array(this.analyser.frequencyBinCount)
    
    // Use frequency magnitude estimation
    for (let i = 0; i < audioData.length && i < this.lastFrameData.length; i++) {
      this.lastFrameData[i] = audioData[i]
    }
    
    // Create a simple frequency representation
    // Group time-domain samples into bands
    const binSize = Math.ceil(audioData.length / spectrum.length)
    for (let i = 0; i < spectrum.length; i++) {
      let binSum = 0
      for (let j = 0; j < binSize && i * binSize + j < audioData.length; j++) {
        binSum += Math.abs(audioData[i * binSize + j])
      }
      spectrum[i] = binSum / binSize
    }
    
    return spectrum
  }

  /**
   * Spectral subtraction: subtract noise profile from signal
   */
  private spectralSubtraction(spectrum: Float32Array): Float32Array {
    const processed = new Float32Array(spectrum.length)
    
    if (!this.noiseProfile) {
      return spectrum.slice()
    }

    for (let i = 0; i < spectrum.length; i++) {
      // Estimate noise based on historical data
      this.noiseEstimate[i] = 
        this.noiseEstimate[i] * this.config.spectralSubtractionAlpha +
        spectrum[i] * (1 - this.config.spectralSubtractionAlpha)
      
      // Subtract noise with reduction amount control
      const noiseToSubtract = this.noiseEstimate[i] * this.config.noiseReductionAmount
      processed[i] = Math.max(0, spectrum[i] - noiseToSubtract)
    }
    
    return processed
  }

  /**
   * Noise gating: suppress audio below threshold
   */
  private noiseGating(spectrum: Float32Array): Float32Array {
    const gated = new Float32Array(spectrum.length)
    
    // Calculate RMS to determine if signal is above threshold
    let rms = 0
    for (let i = 0; i < spectrum.length; i++) {
      rms += spectrum[i] * spectrum[i]
    }
    rms = Math.sqrt(rms / spectrum.length)
    
    // Convert to dB
    const dB = 20 * Math.log10(Math.max(rms, 0.00001))
    
    // If below threshold, gate the signal
    const gateAmount = dB > this.config.noiseGateThreshold ? 1 : 0.1
    
    for (let i = 0; i < spectrum.length; i++) {
      gated[i] = spectrum[i] * gateAmount
    }
    
    return gated
  }

  /**
   * Simple IFFT approximation - convert back to time domain
   */
  private performIFFT(spectrum: Float32Array, targetLength: number): Float32Array {
    const result = new Float32Array(targetLength)
    
    // Simple inverse: expand frequency domain back to time domain
    const hopSize = Math.ceil(targetLength / spectrum.length)
    for (let i = 0; i < spectrum.length; i++) {
      for (let j = 0; j < hopSize && i * hopSize + j < targetLength; j++) {
        result[i * hopSize + j] = spectrum[i] / hopSize
      }
    }
    
    return result
  }

  /**
   * Normalize audio gain to prevent clipping
   */
  private normalizeGain(audioData: Float32Array): Float32Array {
    let maxAmplitude = 0
    for (let i = 0; i < audioData.length; i++) {
      maxAmplitude = Math.max(maxAmplitude, Math.abs(audioData[i]))
    }
    
    if (maxAmplitude === 0 || maxAmplitude < 0.01) {
      return audioData
    }
    
    // Normalize to prevent clipping while maintaining dynamic range
    const targetAmplitude = 0.95
    const gainFactor = targetAmplitude / maxAmplitude
    
    const normalized = new Float32Array(audioData.length)
    for (let i = 0; i < audioData.length; i++) {
      normalized[i] = Math.max(-1, Math.min(1, audioData[i] * gainFactor))
    }
    
    return normalized
  }

  /**
   * Lock/unlock noise profile to prevent recalibration
   */
  lockNoiseProfile(locked: boolean): void {
    this.isNoiseProfileLocked = locked
    console.log(`[AudioProcessor] 🔒 Noise profile ${locked ? 'locked' : 'unlocked'}`)
  }

  /**
   * Reset noise profile
   */
  resetNoiseProfile(): void {
    this.noiseProfile = null
    this.isNoiseProfileLocked = false
    this.noiseEstimate.fill(20)
    console.log('[AudioProcessor] 🔄 Noise profile reset')
  }

  /**
   * Get current configuration
   */
  getConfig(): NoiseSuppressionConfig {
    return { ...this.config }
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<NoiseSuppressionConfig>): void {
    this.config = { ...this.config, ...config }
    console.log('[AudioProcessor] ⚙️ Configuration updated:', this.config)
  }

  /**
   * Get analyser node for visualization/debugging
   */
  getAnalyser(): AnalyserNode {
    return this.analyser
  }
}

/**
 * Create a noise suppression processor node
 */
export async function createNoiseSuppressionProcessor(
  context: AudioContext,
  inputNode: AudioNode,
  config?: Partial<NoiseSuppressionConfig>
): Promise<{ 
  processor: AudioProcessor
  node: AudioWorkletNode | ScriptProcessorNode 
}> {
  const processor = new AudioProcessor(context, config)

  try {
    // Try to use AudioWorklet for better performance
    await context.audioWorklet.addModule(new URL('./audioWorklet.ts', import.meta.url).href)
    const workletNode = new AudioWorkletNode(context, 'noise-suppression-processor')
    
    // Pass configuration to worklet
    workletNode.port.postMessage({
      type: 'config',
      config: processor.getConfig()
    })

    inputNode.connect(workletNode)
    return { processor, node: workletNode }
  } catch (error) {
    console.warn('[AudioProcessor] AudioWorklet not available, using ScriptProcessor', error)
    
    // Fallback to ScriptProcessorNode
    const bufferSize = 4096
    const scriptNode = context.createScriptProcessor(bufferSize, 1, 1)
    
    scriptNode.onaudioprocess = (event: AudioProcessingEvent) => {
      const inputData = event.inputBuffer.getChannelData(0)
      const outputData = event.outputBuffer.getChannelData(0)
      
      const processed = processor.processAudio(inputData)
      for (let i = 0; i < processed.length; i++) {
        outputData[i] = processed[i]
      }
    }

    inputNode.connect(scriptNode)
    return { processor, node: scriptNode }
  }
}

/**
 * Utility function to detect if audio contains primarily background noise
 */
export function isBackgroundNoise(audioData: Float32Array, threshold: number = 0.02): boolean {
  if (!audioData || audioData.length === 0) return true

  // Calculate if signal has clear speech/sound patterns
  let sum = 0
  let peakCount = 0
  let previousWasPeak = false

  for (let i = 0; i < audioData.length; i++) {
    const abs = Math.abs(audioData[i])
    sum += abs

    // Count peaks in the signal
    if (abs > threshold) {
      if (!previousWasPeak) peakCount++
      previousWasPeak = true
    } else {
      previousWasPeak = false
    }
  }

  const rms = Math.sqrt(sum / audioData.length)
  const peakDensity = peakCount / (audioData.length / 256)

  // If low RMS and low peak density, likely background noise
  return rms < 0.01 && peakDensity < 2
}
