'use client'

import React, { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Mic, MicOff, Volume2, VolumeX, Play, Pause } from 'lucide-react'
import Waveform from './Waveform'

type UIState = 'idle' | 'listening' | 'processing' | 'speaking' | 'thinking'

interface AIVoiceAssistantProps {
  onTranscriptionReceived?: (text: string) => void
  onAIResponse?: (text: string) => void
  isEnabled?: boolean
}

export default function AIVoiceAssistant({
  onTranscriptionReceived,
  onAIResponse,
  isEnabled = true,
}: AIVoiceAssistantProps) {
  const [uiState, setUiState] = useState<UIState>('idle')
  const [isRecording, setIsRecording] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [displayText, setDisplayText] = useState('Ready to begin...')
  const [audioLevel, setAudioLevel] = useState(0)
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const animationFrameRef = useRef<number | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  // Initialize audio context and getUserMedia
  useEffect(() => {
    const initAudio = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
        const analyser = audioContext.createAnalyser()
        const source = audioContext.createMediaStreamSource(stream)
        
        source.connect(analyser)
        analyser.fftSize = 256
        
        audioContextRef.current = audioContext
        analyserRef.current = analyser
        
        // Start monitoring audio levels
        const dataArray = new Uint8Array(analyser.frequencyBinCount)
        const updateLevel = () => {
          analyser.getByteFrequencyData(dataArray)
          const average = dataArray.reduce((a, b) => a + b) / dataArray.length
          setAudioLevel(average)
          animationFrameRef.current = requestAnimationFrame(updateLevel)
        }
        updateLevel()

        // Setup MediaRecorder
        const mediaRecorder = new MediaRecorder(stream)
        mediaRecorderRef.current = mediaRecorder

        mediaRecorder.ondataavailable = (event) => {
          audioChunksRef.current.push(event.data)
        }

        mediaRecorder.onstop = async () => {
          const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' })
          audioChunksRef.current = []
          
          // Send to transcription API
          await transcribeAudio(audioBlob)
        }
      } catch (err) {
        console.error('Failed to initialize audio:', err)
        setDisplayText('Microphone access denied')
      }
    }

    if (isEnabled) {
      initAudio()
    }

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [isEnabled])

  const transcribeAudio = async (audioBlob: Blob) => {
    try {
      setUiState('processing')
      setDisplayText('Transcribing audio...')

      const formData = new FormData()
      formData.append('audio', audioBlob, 'audio.webm')

      const response = await fetch('/api/audio/transcribe', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) throw new Error('Transcription failed')

      const { text } = await response.json()
      setTranscript(text)
      setDisplayText(`You said: "${text}"`)
      
      if (onTranscriptionReceived) {
        onTranscriptionReceived(text)
      }

      // Get AI response
      await getAIResponse(text)
    } catch (err) {
      console.error('Transcription error:', err)
      setDisplayText('Transcription failed. Try again.')
      setUiState('idle')
    }
  }

  const getAIResponse = async (userTranscript: string) => {
    try {
      setUiState('thinking')
      setDisplayText('AI thinking...')

      const response = await fetch('/api/ai/respond', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userInput: userTranscript,
          conversationHistory: [], // Would be filled with actual history
        }),
      })

      if (!response.ok) throw new Error('AI response failed')

      const { text: aiText } = await response.json()
      
      if (onAIResponse) {
        onAIResponse(aiText)
      }

      // Synthesize and play AI voice
      await synthesizeAndPlayVoice(aiText)
    } catch (err) {
      console.error('AI response error:', err)
      setDisplayText('AI response failed. Try again.')
      setUiState('idle')
    }
  }

  const synthesizeAndPlayVoice = async (text: string) => {
    try {
      setUiState('speaking')
      setDisplayText('AI speaking...')

      const response = await fetch('/api/audio/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      })

      if (!response.ok) throw new Error('TTS failed')

      const audioBlob = await response.blob()
      const audioUrl = URL.createObjectURL(audioBlob)

      if (audioRef.current) {
        audioRef.current.src = audioUrl
        setIsSpeaking(true)
        
        await audioRef.current.play()

        audioRef.current.onended = () => {
          setIsSpeaking(false)
          setUiState('idle')
          setDisplayText('Ready for next question...')
          // Auto-trigger listening after brief pause
          setTimeout(() => startListening(), 1000)
        }
      }
    } catch (err) {
      console.error('TTS error:', err)
      setDisplayText('Voice synthesis failed. Try again.')
      setUiState('idle')
    }
  }

  const startListening = async () => {
    try {
      if (!mediaRecorderRef.current) return

      setIsRecording(true)
      setUiState('listening')
      setDisplayText('Listening for your answer...')
      audioChunksRef.current = []

      mediaRecorderRef.current.start()
    } catch (err) {
      console.error('Recording start failed:', err)
      setDisplayText('Recording failed. Try again.')
    }
  }

  const stopListening = async () => {
    try {
      if (!mediaRecorderRef.current || !isRecording) return

      setIsRecording(false)
      mediaRecorderRef.current.stop()
    } catch (err) {
      console.error('Recording stop failed:', err)
    }
  }

  const toggleRecording = () => {
    if (isRecording) {
      stopListening()
    } else {
      startListening()
    }
  }

  const toggleAudio = () => {
    if (audioRef.current) {
      if (isSpeaking) {
        audioRef.current.pause()
        setIsSpeaking(false)
      } else if (audioRef.current.src) {
        audioRef.current.play()
        setIsSpeaking(true)
      }
    }
  }

  const getStateColor = (): string => {
    switch (uiState) {
      case 'listening':
        return 'from-cyan-500 to-blue-500'
      case 'processing':
      case 'thinking':
        return 'from-purple-500 to-blue-500'
      case 'speaking':
        return 'from-blue-500 to-teal-500'
      default:
        return 'from-slate-600 to-slate-800'
    }
  }

  const getStateIcon = (): React.ReactNode => {
    switch (uiState) {
      case 'listening':
        return <Mic className="w-6 h-6" />
      case 'speaking':
        return <Volume2 className="w-6 h-6" />
      case 'thinking':
      case 'processing':
        return (
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, linear: true }}
          >
            <Volume2 className="w-6 h-6" />
          </motion.div>
        )
      default:
        return <Mic className="w-6 h-6" />
    }
  }

  if (!isEnabled) {
    return (
      <div className="flex items-center justify-center h-full bg-slate-950">
        <div className="text-slate-500">Voice assistant disabled</div>
      </div>
    )
  }

  return (
    <div className="relative w-full h-full bg-gradient-to-b from-slate-950 via-blue-950/20 to-slate-950 overflow-hidden flex flex-col items-center justify-center">
      {/* Animated background grid */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0 bg-[linear-gradient(0deg,transparent_24%,rgba(0,200,255,0.05)_25%,rgba(0,200,255,0.05)_26%,transparent_27%,transparent_74%,rgba(0,200,255,0.05)_75%,rgba(0,200,255,0.05)_76%,transparent_77%,transparent)] bg-[length:50px_50px]" />
      </div>

      {/* Main content */}
      <div className="relative z-10 flex flex-col items-center justify-center flex-1 w-full px-6">
        {/* Waveform visualization */}
        <motion.div
          className="mb-8 w-64 h-40"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          <Waveform
            isActive={isRecording || isSpeaking}
            intensity={audioLevel / 255}
            color={uiState === 'listening' ? 'cyan' : 'blue'}
          />
        </motion.div>

        {/* Central glow circle */}
        <div className="relative w-32 h-32 mb-8">
          {/* Pulsing rings */}
          <AnimatePresence>
            {(isRecording || isSpeaking) && (
              <>
                <motion.div
                  className={`absolute inset-0 rounded-full border-2 border-cyan-400/60 bg-gradient-to-br ${getStateColor()} opacity-20`}
                  animate={{ scale: [1, 1.2], opacity: [0.4, 0] }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
                <motion.div
                  className={`absolute inset-0 rounded-full border border-blue-400/40 bg-gradient-to-br ${getStateColor()} opacity-10`}
                  animate={{ scale: [1, 1.3], opacity: [0.2, 0] }}
                  transition={{ duration: 2, repeat: Infinity, delay: 0.3 }}
                />
              </>
            )}
          </AnimatePresence>

          {/* Center circle with glow */}
          <motion.div
            className={`absolute inset-0 rounded-full bg-gradient-to-br ${getStateColor()} shadow-2xl shadow-cyan-500/50 flex items-center justify-center cursor-pointer backdrop-blur-sm border border-cyan-300/30`}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={toggleRecording}
            animate={{
              boxShadow: isRecording || isSpeaking
                ? ['0 0 20px rgba(0, 200, 255, 0.5)', '0 0 40px rgba(0, 200, 255, 0.8)', '0 0 20px rgba(0, 200, 255, 0.5)']
                : ['0 0 10px rgba(0, 150, 200, 0.3)', '0 0 15px rgba(0, 150, 200, 0.3)']
            }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <motion.div
              animate={{
                scale: isRecording ? [1, 1.1, 1] : isSpeaking ? [1, 1.15, 1] : 1,
              }}
              transition={{ duration: 0.6, repeat: Infinity }}
            >
              {getStateIcon()}
            </motion.div>
          </motion.div>
        </div>

        {/* Status text */}
        <motion.div className="text-center mb-8">
          <motion.h2
            className="text-2xl font-bold text-cyan-300 mb-2 tracking-wider"
            animate={{ opacity: [0.7, 1, 0.7] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            {uiState === 'idle' ? 'Ready' : uiState.toUpperCase()}
          </motion.h2>
          <p className="text-cyan-200/60 text-sm max-w-xs">
            {displayText}
          </p>
        </motion.div>

        {/* Transcript display */}
        <AnimatePresence>
          {transcript && (
            <motion.div
              className="mt-6 p-4 rounded-lg border border-blue-500/30 bg-blue-950/30 backdrop-blur-sm max-w-md"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <p className="text-xs text-blue-300/60 mb-1">Last message:</p>
              <p className="text-sm text-blue-200">{transcript}</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Control buttons */}
      <div className="relative z-10 flex gap-4 pb-8">
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          onClick={toggleRecording}
          disabled={isSpeaking}
          className={`p-4 rounded-full border-2 transition-all ${
            isRecording
              ? 'bg-red-600/20 border-red-400 text-red-400'
              : 'bg-cyan-600/20 border-cyan-400 text-cyan-400'
          } disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          {isRecording ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          onClick={toggleAudio}
          disabled={!audioRef.current?.src}
          className={`p-4 rounded-full border-2 transition-all ${
            isSpeaking
              ? 'bg-blue-600/20 border-blue-400 text-blue-400'
              : 'bg-slate-600/20 border-slate-400 text-slate-400'
          } disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          {isSpeaking ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6" />}
        </motion.button>
      </div>

      {/* Hidden audio element */}
      <audio ref={audioRef} className="hidden" />

      {/* Decorative corner lines */}
      <div className="absolute top-4 left-4 w-12 h-12 border-t-2 border-l-2 border-cyan-500/30" />
      <div className="absolute top-4 right-4 w-12 h-12 border-t-2 border-r-2 border-cyan-500/30" />
      <div className="absolute bottom-4 left-4 w-12 h-12 border-b-2 border-l-2 border-cyan-500/30" />
      <div className="absolute bottom-4 right-4 w-12 h-12 border-b-2 border-r-2 border-cyan-500/30" />
    </div>
  )
}
