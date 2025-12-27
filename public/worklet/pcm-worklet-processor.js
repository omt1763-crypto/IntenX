/**
 * PCM AudioWorklet Processor - Production-Ready Real-Time Audio Processing
 *
 * ✅ Features:
 * - Processes 512-sample frames @ system sample rate (typically 48kHz)
 * - Energy-based VAD (Voice Activity Detection)
 * - Noise gating for background suppression
 * - Sends raw Float32 PCM to main thread
 * - Zero re-encoding, zero conversion
 *
 * Frame structure:
 * - Input: 512 Float32 samples @ 48kHz
 * - Processing: 1. Noise gate 2. Energy calc 3. VAD decision
 * - Output: { frame, isSpeaking, energy } to port
 *
 * VAD Logic:
 * - Detects speech when energy crosses threshold
 * - Hysteresis prevents flickering
 * - Min speech duration prevents false positives
 */

'use strict'

// ========== Constants ==========
const FRAME_SIZE = 512 // Samples per frame
const NOISE_GATE_THRESHOLD = 0.001 // Samples below this are zeroed
const SPEECH_START_THRESHOLD = 0.02 // Energy threshold to START
const SPEECH_END_THRESHOLD = 0.01 // Energy threshold to END (hysteresis)
const MIN_SPEECH_FRAMES = 2 // At least 2 frames (~21ms @ 48kHz) to confirm speech
const MIN_SILENCE_FRAMES = 10 // At least 10 frames (~104ms) to confirm silence
const RMS_SMOOTHING = 0.7 // Low-pass filter for RMS energy

// ========== Energy Calculator ==========
class EnergyCalculator {
  constructor() {
    this.smoothedRms = 0
    this.maxEnergy = 0.1
    this.minEnergy = 0.001
  }

  calculate(audioBuffer) {
    // Calculate RMS energy
    let sum = 0
    for (let i = 0; i < audioBuffer.length; i++) {
      sum += audioBuffer[i] * audioBuffer[i]
    }
    const rms = Math.sqrt(sum / audioBuffer.length)

    // Smooth the RMS value
    this.smoothedRms = rms * (1 - RMS_SMOOTHING) + this.smoothedRms * RMS_SMOOTHING

    // Update max energy (with decay)
    if (rms > this.maxEnergy) {
      this.maxEnergy = rms * 0.9 + this.maxEnergy * 0.1
    }

    return this.smoothedRms
  }
}

// ========== Voice Activity Detector (VAD) ==========
class VoiceActivityDetector {
  constructor() {
    this.isSpeaking = false
    this.energyCalc = new EnergyCalculator()
    this.speechFrameCount = 0
    this.silenceFrameCount = 0
  }

  process(audioBuffer) {
    const energy = this.energyCalc.calculate(audioBuffer)

    if (!this.isSpeaking) {
      // Not speaking - look for speech onset
      if (energy > SPEECH_START_THRESHOLD) {
        this.speechFrameCount++
        if (this.speechFrameCount >= MIN_SPEECH_FRAMES) {
          // Confirmed speech start
          this.isSpeaking = true
          this.silenceFrameCount = 0
          console.log('[PCM-Worklet] 🎤 Speech START detected')
        }
      } else {
        this.speechFrameCount = 0
      }
    } else {
      // Speaking - look for speech offset
      if (energy < SPEECH_END_THRESHOLD) {
        this.silenceFrameCount++
        if (this.silenceFrameCount >= MIN_SILENCE_FRAMES) {
          // Confirmed speech end
          this.isSpeaking = false
          this.speechFrameCount = 0
          console.log('[PCM-Worklet] 🔇 Speech END detected')
        }
      } else {
        this.silenceFrameCount = 0
      }
    }

    return {
      isSpeaking: this.isSpeaking,
      energy,
      confirmed: this.isSpeaking ? this.silenceFrameCount === 0 : this.speechFrameCount >= MIN_SPEECH_FRAMES,
    }
  }
}

// ========== Main Worklet Processor ==========
class PCMWorkletProcessor extends AudioWorkletProcessor {
  constructor(options) {
    super()
    this.isRecording = false
    this.vad = new VoiceActivityDetector()
    this.frameBuffer = new Float32Array(FRAME_SIZE)
    this.frameIndex = 0
    this.frameCount = 0

    console.log('[PCM-Worklet] 🚀 Processor created')

    // Handle start/stop commands from main thread
    this.port.onmessage = (event) => {
      const { type } = event.data

      if (type === 'start') {
        this.isRecording = true
        console.log('[PCM-Worklet] ▶️  Recording started')
        this.port.postMessage({ type: 'status', status: 'recording_started' })
      } else if (type === 'stop') {
        this.isRecording = false
        console.log('[PCM-Worklet] ⏹️  Recording stopped')
        this.port.postMessage({ type: 'status', status: 'recording_stopped' })
      }
    }
  }

  process(inputs, outputs) {
    if (!this.isRecording) {
      return true
    }

    const input = inputs[0]
    if (!input || input.length === 0) {
      return true
    }

    const inputChannel = input[0]
    if (!inputChannel) {
      return true
    }

    // Process each sample in the input
    for (let i = 0; i < inputChannel.length; i++) {
      // Noise gate: suppress very quiet samples
      if (Math.abs(inputChannel[i]) < NOISE_GATE_THRESHOLD) {
        this.frameBuffer[this.frameIndex] = 0
      } else {
        this.frameBuffer[this.frameIndex] = inputChannel[i]
      }

      this.frameIndex++

      // Frame complete (512 samples = ~10.67ms @ 48kHz)
      if (this.frameIndex >= FRAME_SIZE) {
        // Run VAD
        const vadResult = this.vad.process(this.frameBuffer)

        // Send frame to main thread
        this.port.postMessage({
          type: 'audio_frame',
          frame: Array.from(this.frameBuffer), // Convert to array for transfer
          isSpeaking: vadResult.isSpeaking,
          energy: vadResult.energy,
          frameNumber: this.frameCount,
        })

        // Log every Nth frame to avoid spam
        if (this.frameCount % 100 === 0) {
          console.log(
            `[PCM-Worklet] Frame ${this.frameCount}: energy=${(vadResult.energy * 1000).toFixed(1)}mV, ` +
              `speaking=${vadResult.isSpeaking}`
          )
        }

        this.frameCount++
        this.frameIndex = 0
      }
    }

    return true
  }
}

registerProcessor('pcm-worklet-processor', PCMWorkletProcessor)
