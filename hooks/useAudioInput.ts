import { useCallback, useRef, useState } from 'react'

export interface AudioInputMessage {
  id: string
  content: string
  timestamp: Date
  type: 'speech' | 'silence'
}

export function useAudioInput() {
  const [userTranscripts, setUserTranscripts] = useState<AudioInputMessage[]>([])
  const silenceTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const currentTranscriptRef = useRef<string>('')
  const lastAudioTimeRef = useRef<number>(0)
  const silenceDurationRef = useRef<number>(0)

  // Track when user is speaking by monitoring audio levels
  const trackAudioLevel = useCallback((audioData: Float32Array) => {
    if (!audioData || audioData.length === 0) return

    // Calculate RMS (Root Mean Square) to detect if there's audio
    let sum = 0
    for (let i = 0; i < audioData.length; i++) {
      sum += audioData[i] * audioData[i]
    }
    const rms = Math.sqrt(sum / audioData.length)
    
    // Threshold for detecting speech (adjust as needed)
    const SPEECH_THRESHOLD = 0.02
    const now = Date.now()

    if (rms > SPEECH_THRESHOLD) {
      // User is speaking
      lastAudioTimeRef.current = now
      silenceDurationRef.current = 0

      // Clear any pending silence timeout
      if (silenceTimeoutRef.current) {
        clearTimeout(silenceTimeoutRef.current)
        silenceTimeoutRef.current = null
      }
    } else {
      // Silence detected - start countdown to save transcript
      if (!silenceTimeoutRef.current) {
        silenceTimeoutRef.current = setTimeout(() => {
          // Only save if we have actual content
          if (currentTranscriptRef.current.trim()) {
            addUserTranscript(currentTranscriptRef.current)
            currentTranscriptRef.current = ''
          }
          silenceTimeoutRef.current = null
        }, 800) // Wait 800ms of silence before saving
      }
    }
  }, [])

  const addUserTranscript = useCallback((text: string) => {
    if (!text.trim()) return

    const transcript: AudioInputMessage = {
      id: `user-${Date.now()}`,
      content: text.trim(),
      timestamp: new Date(),
      type: 'speech'
    }

    setUserTranscripts((prev) => [...prev, transcript])
    console.log('[AudioInput] 🎤 User transcript added:', text.substring(0, 100))

    return transcript.id
  }, [])

  const recordUserInput = useCallback((text: string) => {
    currentTranscriptRef.current = text
  }, [])

  const clearTranscripts = useCallback(() => {
    setUserTranscripts([])
    currentTranscriptRef.current = ''
    if (silenceTimeoutRef.current) {
      clearTimeout(silenceTimeoutRef.current)
      silenceTimeoutRef.current = null
    }
    console.log('[AudioInput] Cleared all transcripts')
  }, [])

  const getLastUserMessage = useCallback(() => {
    return userTranscripts.length > 0
      ? userTranscripts[userTranscripts.length - 1]
      : null
  }, [userTranscripts])

  return {
    userTranscripts,
    trackAudioLevel,
    addUserTranscript,
    recordUserInput,
    clearTranscripts,
    getLastUserMessage
  }
}
