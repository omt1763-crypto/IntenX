import { useCallback, useRef, useState } from 'react'

/**
 * Simple hook to capture user speech from the audio context
 * without relying on OpenAI's transcription
 */
export interface UserSpeechEvent {
  id: string
  timestamp: Date
  isSpeaking: boolean
  audioLevel: number
}

export function useUserSpeechDetector() {
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [audioLevel, setAudioLevel] = useState(0)
  const silenceCountRef = useRef(0)
  const lastSpeechTimeRef = useRef<number>(0)

  const SPEECH_THRESHOLD = 0.03
  const SILENCE_FRAMES_NEEDED = 30 // ~600ms at 48 frames/sec

  const detectSpeech = useCallback((audioData: Float32Array) => {
    if (!audioData || audioData.length === 0) return

    // Calculate RMS (Root Mean Square) for audio level
    let sum = 0
    for (let i = 0; i < audioData.length; i++) {
      sum += audioData[i] * audioData[i]
    }
    const rms = Math.sqrt(sum / audioData.length)
    setAudioLevel(rms)

    // Detect if user is speaking
    if (rms > SPEECH_THRESHOLD) {
      if (!isSpeaking) {
        setIsSpeaking(true)
        console.log('[SpeechDetector] 🎤 User started speaking')
      }
      silenceCountRef.current = 0
      lastSpeechTimeRef.current = Date.now()
    } else {
      // Increment silence counter
      silenceCountRef.current++

      // If enough silence, consider speech ended
      if (isSpeaking && silenceCountRef.current >= SILENCE_FRAMES_NEEDED) {
        setIsSpeaking(false)
        silenceCountRef.current = 0
        console.log('[SpeechDetector] 🤐 User stopped speaking')
      }
    }
  }, [isSpeaking])

  const reset = useCallback(() => {
    setIsSpeaking(false)
    setAudioLevel(0)
    silenceCountRef.current = 0
    lastSpeechTimeRef.current = 0
  }, [])

  return {
    isSpeaking,
    audioLevel,
    detectSpeech,
    reset
  }
}
