/**
 * Advanced AudioWorkletProcessor
 * Handles real-time speech detection, turn-taking, and buffered audio
 */
class AdvancedRecorderWorklet extends AudioWorkletProcessor {
  constructor() {
    super()

    this.buffers = []               // stores Float32Array chunks
    this.isRecording = false
    this.frameCount = 0
    this.speechThreshold = 0.02     // adjust based on mic sensitivity
    this.minEnergy = 0               // last frame energy
    this.maxEnergy = 0
    this.aiSpeaking = false

    // Pre-roll / post-roll config
    this.prerollFrames = 5           // number of frames before speech to include
    this.postrollFrames = 5          // number of frames to hold after speech ends
    this.prerollBuffer = []
    this.postrollCounter = 0

    this.port.onmessage = (e) => {
      if (e.data.type === 'start') {
        this.isRecording = true
      } else if (e.data.type === 'stop') {
        this.isRecording = false
        this.flushBuffers(true)
      } else if (e.data.type === 'aiSpeaking') {
        this.aiSpeaking = e.data.value
      }
    }
  }

  /**
   * Compute RMS energy of a Float32Array frame
   */
  computeEnergy(frame) {
    let sum = 0
    for (let i = 0; i < frame.length; i++) {
      sum += frame[i] * frame[i]
    }
    return Math.sqrt(sum / frame.length)
  }

  /**
   * Flush current buffers to main thread
   */
  flushBuffers(isFinal = false) {
    if (this.buffers.length === 0) return

    this.port.postMessage({
      type: 'audio_chunk',
      buffer: Float32Array.from(this.buffers.flat()),
      isSpeaking: true,
      energy: { raw: this.maxEnergy },
      isFinal
    })

    // Clear buffers
    this.buffers = []
    this.prerollBuffer = []
    this.maxEnergy = 0
    this.postrollCounter = 0
  }

  process(inputs, outputs, parameters) {
    const input = inputs[0]
    if (!this.isRecording || input.length === 0) return true

    const channelData = input[0]          // mono
    const frame = new Float32Array(channelData)
    const energy = this.computeEnergy(frame)
    const isSpeaking = energy > this.speechThreshold && !this.aiSpeaking

    // Update energy metrics
    this.minEnergy = Math.min(this.minEnergy, energy)
    this.maxEnergy = Math.max(this.maxEnergy, energy)

    if (isSpeaking) {
      // Include preroll frames
      if (this.prerollBuffer.length > 0) {
        this.buffers.push(...this.prerollBuffer)
        this.prerollBuffer = []
      }
      this.buffers.push(frame)
      this.postrollCounter = this.postrollFrames
    } else {
      // Not speaking
      if (this.postrollCounter > 0) {
        this.buffers.push(frame)
        this.postrollCounter--
      } else {
        // Store for potential preroll if speech resumes
        this.prerollBuffer.push(frame)
        if (this.prerollBuffer.length > this.prerollFrames) {
          this.prerollBuffer.shift()
        }
        // Send buffer if available
        if (this.buffers.length > 0) {
          this.flushBuffers()
        }
      }
    }

    return true
  }
}

registerProcessor('audio-worklet-processor-advanced', AdvancedRecorderWorklet)
