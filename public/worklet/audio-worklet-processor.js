// Audio Worklet Processor - VAD and continuous audio capture
'use strict'

const FRAME_SIZE = 512
const SAMPLE_RATE = 16000
const SPEECH_START_THRESHOLD = 0.01   // Aggressive: catch ANY speech
const SPEECH_END_THRESHOLD = 0.008    // HIGHER = more sensitive to silence (was 0.005)
const RMS_SMOOTHING = 0.7             // 70% old, 30% new for faster response
const NOISE_FLOOR = 0.0001            // Noise floor

class EnergyCalculator {
  constructor() {
    this.smoothedRms = 0
    this.maxEnergy = 0.1
    this.minEnergy = 0.01
  }

  calculate(audioBuffer) {
    let sum = 0
    for (let i = 0; i < audioBuffer.length; i++) {
      sum += audioBuffer[i] * audioBuffer[i]
    }
    const rms = Math.sqrt(sum / audioBuffer.length)
    
    if (rms > this.maxEnergy) {
      this.maxEnergy = rms * 0.95 + this.maxEnergy * 0.05
    }
    
    this.smoothedRms = rms * (1 - RMS_SMOOTHING) + this.smoothedRms * RMS_SMOOTHING
    
    return {
      raw: rms,
      smoothed: this.smoothedRms,
      normalized: Math.max(0, (this.smoothedRms - this.minEnergy) / (this.maxEnergy - this.minEnergy))
    }
  }
}

class VoiceActivityDetector {
  constructor() {
    this.isSpeaking = false
    this.energyCalculator = new EnergyCalculator()
    this.frameCount = 0
    this.silenceFrames = 0
    this.speechFrameCounter = 0
    this.MIN_SPEECH_FRAMES = 1
    this.MIN_SILENCE_FRAMES = 2  // AGGRESSIVE: ~64ms silence to detect end (was 13 = 416ms)
  }

  process(audioBuffer) {
    const energy = this.energyCalculator.calculate(audioBuffer)
    this.frameCount++

    if (!this.isSpeaking) {
      // Use SMOOTHED energy for more stable detection
      if (energy.smoothed > SPEECH_START_THRESHOLD) {
        this.speechFrameCounter++
        if (this.speechFrameCounter >= this.MIN_SPEECH_FRAMES) {
          this.isSpeaking = true
          this.silenceFrames = 0
          this.speechFrameCounter = 0
          return { isSpeaking: true, energy }
        }
      } else {
        this.speechFrameCounter = 0
      }
    } else {
      // Use SMOOTHED energy for end detection too
      if (energy.smoothed > SPEECH_END_THRESHOLD) {
        this.silenceFrames = 0
      } else {
        this.silenceFrames++
      }

      if (this.silenceFrames > this.MIN_SILENCE_FRAMES) {
        this.isSpeaking = false
        this.speechFrameCounter = 0
        return { isSpeaking: false, energy, transitionType: 'end' }
      }
    }

    return { isSpeaking: this.isSpeaking, energy, transitionType: null }
  }

  reset() {
    this.isSpeaking = false
    this.silenceFrames = 0
    this.speechFrameCounter = 0
    this.energyCalculator = new EnergyCalculator()
  }
}

class AudioWorkletProcessorAdvanced extends AudioWorkletProcessor {
  constructor() {
    super()
    this.isRecording = false
    this.vad = new VoiceActivityDetector()
    this.audioBuffer = new Float32Array(4096)
    this.audioBufferIndex = 0
    this.frameCounter = 0

    this.port.onmessage = (e) => {
      if (e.data.type === 'start') {
        console.log('[AudioWorklet] START message received')
        this.isRecording = true
        this.vad.reset()
        this.audioBufferIndex = 0
        this.port.postMessage({ type: 'status', status: 'recording_started' })
      } else if (e.data.type === 'stop') {
        console.log('[AudioWorklet] STOP message received')
        this.isRecording = false
        if (this.audioBufferIndex > 0) {
          const finalBuffer = this.audioBuffer.slice(0, this.audioBufferIndex)
          this.port.postMessage({
            type: 'audio_chunk',
            buffer: Array.from(finalBuffer),
            isFinal: true
          })
        }
        this.port.postMessage({ type: 'status', status: 'recording_stopped' })
      }
    }
  }

  process(inputs, outputs) {
    if (!this.isRecording) return true

    const input = inputs[0]
    if (!input || input.length === 0) return true

    const inputChannel = input[0]
    if (!inputChannel) return true

    this.frameCounter++
    if (this.frameCounter === 1) {
      console.log('[AudioWorklet] First frame received, processing started')
    }

    const vadResult = this.vad.process(inputChannel)

    // Log energy values periodically (every 50 frames = ~533ms)
    if (this.frameCounter % 50 === 0) {
      console.log(`[AudioWorklet] Frame ${this.frameCounter}: raw=${vadResult.energy.raw.toFixed(4)}, smoothed=${vadResult.energy.smoothed.toFixed(4)}, VAD=${vadResult.isSpeaking ? 'ON' : 'OFF'}`)
    }

    for (let i = 0; i < inputChannel.length; i++) {
      this.audioBuffer[this.audioBufferIndex++] = inputChannel[i]

      if (this.audioBufferIndex >= this.audioBuffer.length) {
        const bufferToSend = Array.from(this.audioBuffer)
        
        if (this.frameCounter <= 5 || vadResult.isSpeaking) {
          console.log('[AudioWorklet] Sending chunk, isSpeaking:', vadResult.isSpeaking, 'energy:', vadResult.energy.raw)
        }
        
        this.port.postMessage({
          type: 'audio_chunk',
          buffer: bufferToSend,
          isSpeaking: vadResult.isSpeaking,
          energy: vadResult.energy,
          isFinal: false
        })
        this.audioBufferIndex = 0
      }
    }

    return true
  }
}

registerProcessor('audio-worklet-processor-advanced', AudioWorkletProcessorAdvanced)
