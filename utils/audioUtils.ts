/**
 * Audio utility functions for proper WAV encoding and PCM handling
 */

interface AudioConfig {
  sampleRate: number
  channels: number
  bitDepth: number
}

/**
 * Convert Float32 PCM to Int16 PCM
 * Handles clipping safely
 */
export function float32ToInt16(float32Data: Float32Array): Int16Array {
  const int16Data = new Int16Array(float32Data.length)
  
  for (let i = 0; i < float32Data.length; i++) {
    // Clamp to [-1, 1] range
    let s = Math.max(-1, Math.min(1, float32Data[i]))
    
    // Convert to 16-bit integer
    int16Data[i] = s < 0 ? s * 0x8000 : s * 0x7FFF
  }
  
  return int16Data
}

/**
 * Create a proper WAV file from PCM float32 audio buffers
 * Fixes all header issues and ensures Whisper compatibility
 */
export function createWavFile(
  audioBuffers: Float32Array[],
  config: AudioConfig
): Uint8Array {
  // Merge all float32 buffers into one
  const totalSamples = audioBuffers.reduce((sum, buf) => sum + buf.length, 0)
  const mergedFloat32 = new Float32Array(totalSamples)
  
  let offset = 0
  for (const buffer of audioBuffers) {
    mergedFloat32.set(buffer, offset)
    offset += buffer.length
  }
  
  // Convert to Int16
  const int16Data = float32ToInt16(mergedFloat32)
  const audioData = new Uint8Array(int16Data.buffer)
  
  // Calculate sizes
  const dataLength = audioData.length
  const fileSize = 36 + dataLength // 36 for header + audio data
  
  // Create WAV file buffer
  const wavBuffer = new ArrayBuffer(44 + dataLength)
  const view = new DataView(wavBuffer)
  const uint8 = new Uint8Array(wavBuffer)
  
  // Helper function to write strings
  const writeString = (offset: number, str: string) => {
    for (let i = 0; i < str.length; i++) {
      view.setUint8(offset + i, str.charCodeAt(i))
    }
  }
  
  // RIFF header
  writeString(0, 'RIFF')
  view.setUint32(4, fileSize, true) // File size - 8
  writeString(8, 'WAVE')
  
  // fmt subchunk
  writeString(12, 'fmt ')
  view.setUint32(16, 16, true) // Subchunk1Size (16 for PCM)
  view.setUint16(20, 1, true) // AudioFormat (1 for PCM)
  view.setUint16(22, config.channels, true) // NumChannels
  view.setUint32(24, config.sampleRate, true) // SampleRate
  view.setUint32(28, config.sampleRate * config.channels * (config.bitDepth / 8), true) // ByteRate
  view.setUint16(32, config.channels * (config.bitDepth / 8), true) // BlockAlign
  view.setUint16(34, config.bitDepth, true) // BitsPerSample
  
  // data subchunk
  writeString(36, 'data')
  view.setUint32(40, dataLength, true) // Subchunk2Size
  
  // Copy audio data
  uint8.set(audioData, 44)
  
  console.log(
    `[WAV] Created file: ${wavBuffer.byteLength} bytes (44 header + ${dataLength} audio) @ ${config.sampleRate}Hz`
  )
  
  return uint8
}

/**
 * Detect silence/speech using RMS (Root Mean Square) energy
 * More reliable than frequency analysis for speech detection
 */
export function calculateRMS(audioBuffer: Float32Array): number {
  let sum = 0
  for (let i = 0; i < audioBuffer.length; i++) {
    sum += audioBuffer[i] * audioBuffer[i]
  }
  return Math.sqrt(sum / audioBuffer.length)
}

/**
 * Detect if audio frame contains speech
 * Threshold: 0.10+ for normal speech (much higher = only clear speech detected)
 * This prevents background noise from triggering false positives
 */
export function isSpeech(audioBuffer: Float32Array, threshold: number = 0.10): boolean {
  const rms = calculateRMS(audioBuffer)
  const hasSpeech = rms > threshold
  return hasSpeech
}

/**
 * Convert Uint8Array to base64 safely (avoid stack overflow with large audio)
 */
export function uint8ToBase64(uint8: Uint8Array): string {
  const chunkSize = 8192
  let binary = ''
  
  for (let i = 0; i < uint8.length; i += chunkSize) {
    const chunk = uint8.subarray(i, i + chunkSize)
    binary += String.fromCharCode.apply(null, Array.from(chunk) as any)
  }
  
  return btoa(binary)
}

/**
 * Convert base64 back to Uint8Array
 */
export function base64ToUint8(base64: string): Uint8Array {
  const binary = atob(base64)
  const uint8 = new Uint8Array(binary.length)
  
  for (let i = 0; i < binary.length; i++) {
    uint8[i] = binary.charCodeAt(i)
  }
  
  return uint8
}
