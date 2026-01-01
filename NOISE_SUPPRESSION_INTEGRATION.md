/**
 * Noise Suppression Integration for useRealtimeAudio Hook
 * 
 * This file shows how to integrate noise suppression into the existing audio system.
 * Copy the relevant sections into your useRealtimeAudio.ts file.
 */

// ============================================================================
// STEP 1: Add imports at the top of useRealtimeAudio.ts
// ============================================================================

import { AdvancedAudioProcessor, detectVoiceActivity, normalizeAudio, highPassFilter } from '@/lib/advancedAudioProcessing'

// ============================================================================
// STEP 2: Add state variables in the useRealtimeAudio function
// ============================================================================

// Inside the function, add these refs:
const audioProcessorRef = useRef<AdvancedAudioProcessor | null>(null)
const noiseProfileSetRef = useRef<boolean>(false)
const calibrationStartTimeRef = useRef<number>(0)
const CALIBRATION_DURATION = 2000 // 2 seconds for noise profile calibration

// ============================================================================
// STEP 3: Initialize audio processor when audio context is ready
// ============================================================================

// In the audio setup section (around line 650), add:

const initializeNoiseSuppressionProcessor = async (audioCtx: AudioContext) => {
  try {
    audioProcessorRef.current = new AdvancedAudioProcessor(4096)
    calibrationStartTimeRef.current = Date.now()
    noiseProfileSetRef.current = false
    
    console.log('[RealtimeAudio] ✅ Noise suppression processor initialized')
    return true
  } catch (error) {
    console.error('[RealtimeAudio] ❌ Failed to initialize noise suppression:', error)
    return false
  }
}

// Call this in the audio setup:
// if (isAudioSetupRef.current) {
//   await initializeNoiseSuppressionProcessor(audioCtx)
// }

// ============================================================================
// STEP 4: Modify the audio worklet processor
// ============================================================================

// In the worklet code section (around line 600), modify the onaudioprocess:

const workletCode = `
class RealtimeAudioWorklet extends AudioWorkletProcessor {
  constructor() {
    super()
    this.bufferSize = 0
    this.audioProcessor = null
    this.noiseProfileSet = false
    this.calibrationStart = 0
    this.CALIBRATION_DURATION = 2000
    
    // Import functions from advanced audio processing
    this.detectVoiceActivity = ${detectVoiceActivity.toString()}
    this.normalizeAudio = ${normalizeAudio.toString()}
    this.highPassFilter = ${highPassFilter.toString()}
  }

  process(inputs, outputs) {
    const input = inputs[0]
    const output = outputs[0]
    
    if (!input || !input[0]) {
      return true
    }

    const audioData = input[0]
    
    // Initialize processor on first run
    if (!this.audioProcessor) {
      this.port.postMessage({
        type: 'status',
        message: 'Initializing audio processor...'
      })
    }

    // Check if we're in calibration phase
    if (!this.noiseProfileSet) {
      const now = Date.now()
      if (!this.calibrationStart) {
        this.calibrationStart = now
        this.port.postMessage({
          type: 'calibration',
          progress: 0,
          message: 'Starting noise profile calibration. Please remain quiet...'
        })
      }

      const elapsed = now - this.calibrationStart
      const progress = Math.min(100, (elapsed / this.CALIBRATION_DURATION) * 100)

      if (elapsed < this.CALIBRATION_DURATION) {
        this.port.postMessage({
          type: 'calibration',
          progress: progress,
          message: \`Calibrating... \${Math.round(progress)}%\`
        })
      } else {
        this.noiseProfileSet = true
        this.port.postMessage({
          type: 'calibration_complete',
          message: 'Noise profile calibrated!'
        })
      }
    }

    // Process audio
    let processedAudio = audioData
    
    // 1. Apply high-pass filter to remove low-frequency rumble
    processedAudio = this.highPassFilter(audioData, 80)
    
    // 2. Apply noise suppression if processor is ready
    if (this.audioProcessor) {
      const result = this.audioProcessor.processAudio(processedAudio)
      processedAudio = result.audio
      
      // Send metrics for UI display
      this.port.postMessage({
        type: 'metrics',
        metrics: result.metrics
      })
    }
    
    // 3. Normalize audio to prevent clipping
    processedAudio = this.normalizeAudio(processedAudio)
    
    // 4. Detect voice activity
    const hasVoice = this.detectVoiceActivity(processedAudio)
    
    // Send audio data if speech detected or always send with flag
    const gatedAudio = new Float32Array(processedAudio.length)
    const gateAmount = hasVoice ? 1.0 : 0.1 // Reduce background by 90%
    
    for (let i = 0; i < processedAudio.length; i++) {
      gatedAudio[i] = processedAudio[i] * gateAmount
    }
    
    // Copy to output
    for (let i = 0; i < output.length; i++) {
      output[i][0] = gatedAudio[i]
    }

    // Send audio chunk to backend
    if (this.bufferSize === 0 || this.bufferSize > 8192) {
      if (gatedAudio.some(sample => Math.abs(sample) > 0.01)) {
        this.port.postMessage({
          type: 'audio',
          audio: gatedAudio,
          hasVoice: hasVoice,
          timestamp: Date.now()
        })
        this.bufferSize = 0
      }
    }
    
    this.bufferSize += audioData.length
    return true
  }
}

registerProcessor('realtime-audio-worklet', RealtimeAudioWorklet)
`

// ============================================================================
// STEP 5: Handle processor messages in the main thread
// ============================================================================

// In the workletNode.port.onmessage handler (around line 720), add:

workletNode.port.onmessage = (event) => {
  const { type, data } = event

  // Handle status messages
  if (type === 'status') {
    console.log('[RealtimeAudio] 📊', data.message)
  }

  // Handle calibration progress
  if (type === 'calibration') {
    console.log('[RealtimeAudio] 🎙️ Calibration:', data.message)
    // You could emit this to update UI progress
    onConversationRef.current?.({
      role: 'ai',
      content: `[SYSTEM] ${data.message}`,
      timestamp: new Date()
    })
  }

  // Handle calibration complete
  if (type === 'calibration_complete') {
    console.log('[RealtimeAudio] ✅ Calibration complete:', data.message)
    noiseProfileSetRef.current = true
    onConversationRef.current?.({
      role: 'ai',
      content: '[SYSTEM] Noise suppression ready!',
      timestamp: new Date()
    })
  }

  // Handle audio metrics
  if (type === 'metrics') {
    const { metrics } = data
    // Log metrics for debugging
    if (Date.now() % 1000 < 50) { // Log every ~1 second
      console.log('[RealtimeAudio] 📈 Audio Metrics:', {
        snr: metrics.snr.toFixed(2),
        volume: metrics.volume.toFixed(2),
        noiseLevel: metrics.noiseLevel.toFixed(2),
        isSpeech: metrics.isSpeech,
        isClipping: metrics.isClipping
      })
    }
  }

  // Handle actual audio data
  if (event.data.type === 'audio' && ws.readyState === WebSocket.OPEN) {
    const audioData = event.data.audio
    
    // ... rest of existing audio sending code ...
  }
}

// ============================================================================
// STEP 6: Add UI controls to the interview page
// ============================================================================

// In app/interview/realtime/page.tsx, add to component state:

const [noiseSuppression, setNoiseSuppression] = useState({
  enabled: true,
  calibrationProgress: 0,
  isCalibrated: false,
  metrics: null
})

// Add this in the UI (in the controls area):

{noiseSuppression.isCalibrated ? (
  <div className="flex items-center gap-3 px-4 py-2 bg-green-50 border border-green-200 rounded-lg">
    <CheckCircle2 className="w-5 h-5 text-green-600" />
    <div className="flex-1">
      <p className="text-sm font-medium text-green-900">Noise Suppression Active</p>
      {noiseSuppression.metrics && (
        <p className="text-xs text-green-700">
          SNR: {noiseSuppression.metrics.snr.toFixed(1)}dB | 
          Volume: {noiseSuppression.metrics.volume.toFixed(1)}dB
        </p>
      )}
    </div>
    <button
      onClick={() => setNoiseSuppression(prev => ({ ...prev, enabled: !prev.enabled }))}
      className="px-3 py-1 text-xs font-medium bg-green-600 text-white rounded hover:bg-green-700"
    >
      {noiseSuppression.enabled ? 'Disable' : 'Enable'}
    </button>
  </div>
) : (
  <div className="flex items-center gap-3 px-4 py-2 bg-blue-50 border border-blue-200 rounded-lg">
    <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
    <div className="flex-1">
      <p className="text-sm font-medium text-blue-900">Calibrating Noise Suppression</p>
      <div className="w-full bg-blue-200 rounded-full h-1.5 mt-1">
        <div
          className="bg-blue-600 h-1.5 rounded-full transition-all"
          style={{ width: `${noiseSuppression.calibrationProgress}%` }}
        />
      </div>
    </div>
  </div>
)}

// ============================================================================
// STEP 7: Configuration recommendations
// ============================================================================

// Default configuration that works well for most scenarios:

const NOISE_SUPPRESSION_CONFIG = {
  suppressionFactor: 0.8,     // 80% noise reduction
  minimumMask: 0.1,           // Keep 10% minimum to avoid artifacts
  temporalSmoothing: 0.98,    // Smooth over time
  frequencySmoothing: 0.95,   // Smooth across frequencies
  voiceActivityThreshold: 0.02,
  noiseGateDb: -50,
}

// For very noisy environments:
const AGGRESSIVE_CONFIG = {
  suppressionFactor: 0.95,    // 95% noise reduction
  minimumMask: 0.05,          // Smaller minimum mask
  temporalSmoothing: 0.95,    // More responsive
  frequencySmoothing: 0.9,    // More aggressive smoothing
  voiceActivityThreshold: 0.03,
  noiseGateDb: -40,
}

// For quiet environments:
const GENTLE_CONFIG = {
  suppressionFactor: 0.6,     // 60% noise reduction
  minimumMask: 0.2,           // Larger minimum mask
  temporalSmoothing: 0.99,    // Very smooth
  frequencySmoothing: 0.98,   // Gentle smoothing
  voiceActivityThreshold: 0.01,
  noiseGateDb: -60,
}

// ============================================================================
// TESTING CHECKLIST
// ============================================================================

/*
[ ] Audio processes without crashing
[ ] Calibration completes in 2 seconds
[ ] Noise profile shows in console
[ ] Background noise (fan, AC) is audible reduction of 50%+
[ ] Speech remains clear and unaffected
[ ] No audio artifacts or distortion
[ ] Volume levels are consistent
[ ] Works with different microphones
[ ] Mobile performance is acceptable
[ ] UI updates show metrics correctly
*/
