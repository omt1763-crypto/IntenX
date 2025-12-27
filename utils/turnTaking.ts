/**
 * Turn-Taking Logic - ChatGPT Voice-style conversation flow
 * 
 * Rules:
 * - Pause < 800ms = user is thinking, keep listening
 * - Pause 800-1200ms = normal speaking break
 * - Pause > 1200ms = definitely finished speaking, send audio
 * - Pre-roll: 200ms before first speech
 * - Post-roll: 200ms after last speech (for natural ending)
 */

export const TURN_TAKING_CONFIG = {
  PAUSE_MIN_MS: 250,        // Minimum pause to consider turn change (faster detection)
  PAUSE_MAX_MS: 400,        // Maximum pause before forcing send (instant response)
  PREROLL_MS: 100,          // Capture audio 100ms before speech starts (reduced)
  POSTROLL_MS: 100,         // Continue capturing 100ms after speech ends (reduced)
  NOISE_FLOOR: 0.01,        // Minimum energy to consider
} as const

/**
 * State machine for managing speech detection and turn-taking
 */
export class TurnTakingStateMachine {
  private state: 'idle' | 'listening' | 'speaking' | 'silence' | 'ready_to_send' = 'idle'
  private speechStartTime = 0
  private silenceStartTime = 0
  private bufferTime = 0
  private aiSpeaking = false
  private MIN_SPEECH_DURATION_MS = 200  // Require 200ms of speech before capturing (filters noise)

  constructor() {
    this.reset()
  }

  reset() {
    this.state = 'idle'
    this.speechStartTime = 0
    this.silenceStartTime = 0
    this.bufferTime = 0
  }

  /**
   * Update state based on VAD result
   * Returns action to take: 'buffer', 'send', 'wait', or null
   */
  updateVAD(isSpeaking: boolean, aiSpeaking: boolean = false): 'buffer' | 'send' | 'wait' | null {
    this.aiSpeaking = aiSpeaking

    const now = Date.now()

    // AI is speaking - don't process user audio
    if (aiSpeaking) {
      this.state = 'idle'
      this.speechStartTime = 0
      this.silenceStartTime = 0
      return null
    }

    if (isSpeaking) {
      if (this.state === 'idle' || this.state === 'listening') {
        // Starting to speak
        this.state = 'speaking'
        this.speechStartTime = now
        this.silenceStartTime = 0
        return 'wait'  // Don't start buffering immediately - wait for MIN_SPEECH_DURATION
      } else if (this.state === 'silence') {
        // Resume speaking after short pause
        const pauseDuration = now - this.silenceStartTime
        if (pauseDuration < TURN_TAKING_CONFIG.PAUSE_MIN_MS) {
          // Too short - resume buffering
          this.state = 'speaking'
          this.silenceStartTime = 0
          return 'buffer'
        } else {
          // Long pause - was already ready to send
          // This is new input, send previous and start buffering new
          return 'send'
        }
      }
      return 'buffer'
    } else {
      // Not speaking
      if (this.state === 'speaking') {
        // Check minimum speech duration before starting silence timer
        const speechDuration = now - this.speechStartTime
        if (speechDuration >= this.MIN_SPEECH_DURATION_MS) {
          // Valid speech, now detect silence
          this.state = 'silence'
          this.silenceStartTime = now
          return 'wait'
        } else {
          // Too short - was noise, ignore
          this.state = 'idle'
          this.speechStartTime = 0
          return null
        }
      } else if (this.state === 'silence') {
        const pauseDuration = now - this.silenceStartTime

        if (pauseDuration >= TURN_TAKING_CONFIG.PAUSE_MAX_MS) {
          // Definitely done speaking
          this.state = 'ready_to_send'
          return 'send'
        } else if (pauseDuration < TURN_TAKING_CONFIG.PAUSE_MIN_MS) {
          // Continue listening
          return 'wait'
        }
        // In between - keep waiting
        return 'wait'
      }
    }

    return null
  }

  /**
   * Get current state for UI/logging
   */
  getState(): typeof this.state {
    return this.state
  }

  /**
   * Get timing info for metrics
   */
  getTimingMetrics() {
    const now = Date.now()
    return {
      state: this.state,
      speechDuration: this.speechStartTime > 0 ? now - this.speechStartTime : 0,
      pauseDuration: this.silenceStartTime > 0 ? now - this.silenceStartTime : 0,
    }
  }
}

/**
 * Buffer manager for pre-roll and post-roll
 */
export class AudioBufferManager {
  private prerollBuffer: Float32Array[] = []
  private mainBuffer: Float32Array[] = []
  private prerollSize: number

  constructor(prerollDurationMs: number = TURN_TAKING_CONFIG.PREROLL_MS, sampleRate: number = 16000) {
    this.prerollSize = Math.ceil((prerollDurationMs * sampleRate) / 1000 / 512)
  }

  addFrame(frame: Float32Array, isSpeech: boolean) {
    if (isSpeech) {
      // Move preroll to main buffer when speech starts
      if (this.prerollBuffer.length > 0 && this.mainBuffer.length === 0) {
        this.mainBuffer.push(...this.prerollBuffer)
        this.prerollBuffer = []
      }
      this.mainBuffer.push(frame)
    } else {
      // Accumulate preroll during silence
      if (this.mainBuffer.length === 0) {
        this.prerollBuffer.push(frame)
        if (this.prerollBuffer.length > this.prerollSize) {
          this.prerollBuffer.shift()
        }
      } else {
        // Post-roll: continue buffering after speech ends
        this.mainBuffer.push(frame)
      }
    }
  }

  getBufferedAudio(): Float32Array | null {
    if (this.mainBuffer.length === 0) return null

    const totalLength = this.mainBuffer.reduce((sum, f) => sum + f.length, 0)
    const merged = new Float32Array(totalLength)

    let offset = 0
    for (const frame of this.mainBuffer) {
      merged.set(frame, offset)
      offset += frame.length
    }

    return merged
  }

  clear() {
    this.prerollBuffer = []
    this.mainBuffer = []
  }

  getStats() {
    return {
      prerollFrames: this.prerollBuffer.length,
      mainBufferFrames: this.mainBuffer.length,
      totalFrames: this.prerollBuffer.length + this.mainBuffer.length,
    }
  }
}

/**
 * Turn-taking orchestrator combining VAD + state machine + buffering
 */
export class TurnTakingOrchestrator {
  private stateMachine = new TurnTakingStateMachine()
  private bufferManager: AudioBufferManager
  private lastAction: string = ''

  constructor(prerollMs: number = TURN_TAKING_CONFIG.PREROLL_MS) {
    this.bufferManager = new AudioBufferManager(prerollMs)
  }

  /**
   * Process incoming audio frame
   * Returns: { action, shouldSend, shouldClear }
   */
  processFrame(
    frame: Float32Array,
    isSpeech: boolean,
    aiSpeaking: boolean = false
  ): { action: string; shouldSend: boolean; shouldClear: boolean } {
    // Update state machine
    const action = this.stateMachine.updateVAD(isSpeech, aiSpeaking)

    // Manage buffer
    if (action === 'buffer') {
      this.bufferManager.addFrame(frame, true)
      this.lastAction = 'buffer'
      return { action: 'buffer', shouldSend: false, shouldClear: false }
    } else if (action === 'send') {
      // Add post-roll frames
      this.bufferManager.addFrame(frame, false)
      const audio = this.bufferManager.getBufferedAudio()
      this.bufferManager.clear()
      this.lastAction = 'send'
      return { action: 'send', shouldSend: !!audio, shouldClear: true }
    } else if (action === 'wait') {
      // Continue buffering silence
      const bufferMgr = this.bufferManager as any
      if (this.stateMachine.getState() === 'speaking') {
        this.bufferManager.addFrame(frame, true)
      } else if (bufferMgr['mainBuffer']?.length > 0) {
        this.bufferManager.addFrame(frame, false)  // Post-roll
      }
      this.lastAction = 'wait'
      return { action: 'wait', shouldSend: false, shouldClear: false }
    }

    this.lastAction = 'idle'
    return { action: 'idle', shouldSend: false, shouldClear: false }
  }

  getBufferedAudio(): Float32Array | null {
    return this.bufferManager.getBufferedAudio()
  }

  reset() {
    this.stateMachine.reset()
    this.bufferManager.clear()
  }

  getMetrics() {
    return {
      state: this.stateMachine.getState(),
      timing: this.stateMachine.getTimingMetrics(),
      bufferStats: this.bufferManager.getStats(),
      lastAction: this.lastAction,
    }
  }
}
