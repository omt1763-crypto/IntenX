// hooks/useChatInterview.ts
import { useCallback, useRef, useState } from 'react'
import { generateInterviewerInstructions, formatInterviewContext, validateGuardrails } from '@/config/interviewer-guardrails'

export interface ConversationMessage {
  role: 'ai' | 'user'
  content: string
  timestamp: Date
}

export interface UseChatInterviewReturn {
  connected: boolean
  isListening: boolean
  error: string | null
  connect: (onConversation?: (msg: ConversationMessage) => void, skills?: Array<{name: string; reason?: string}>) => Promise<void>
  disconnect: () => void
  startRecording: () => void
  stopRecording: () => void
}

export function useChatInterview(): UseChatInterviewReturn {
  const [connected, setConnected] = useState(false)
  const [isListening, setIsListening] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const wsRef = useRef<WebSocket | null>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const mediaStreamRef = useRef<MediaStream | null>(null)
  const onConversationRef = useRef<((msg: ConversationMessage) => void) | null>(null)
  const languageSwitchRequestedRef = useRef<boolean>(false)

  const connect = useCallback(async (onConversation?: (msg: ConversationMessage) => void, skills?: Array<{name: string; reason?: string}>) => {
    if (onConversation) {
      onConversationRef.current = onConversation
    }
    
    try {
      setError(null)
      
      // Generate instructions from guardrails configuration
      const instructions = generateInterviewerInstructions(skills)
      const contextData = formatInterviewContext(skills)
      
      // Combine instructions with context data
      const fullInstructions = `${instructions}

CONTEXT DATA (JSON):
${JSON.stringify(contextData, null, 2)}`
      
      // Connect to WebSocket
      const ws = new WebSocket('ws://localhost:8001/ws/interview')
      wsRef.current = ws
      
      await new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => reject(new Error('Connection timeout')), 10000)
        
        ws.onopen = () => {
          clearTimeout(timeout)
          console.log('✅ Connected to interview server')
          
          // Initialize interview with guardrails instructions
          ws.send(JSON.stringify({
            type: 'init',
            skills: skills || [],
            instructions: fullInstructions
          }))
          
          console.log('[ChatInterview] Instructions sent to backend')
          resolve()
        }
        
        ws.onmessage = async (event) => {
          const data = JSON.parse(event.data)
          console.log('📨 Received:', data.type)
          
          if (data.type === 'ai_response') {
            console.log('🤖 AI says:', data.text)
            
            // Validate guardrails on AI response
            const validation = validateGuardrails(data.text)
            if (!validation.isValid) {
              console.warn('[ChatInterview] ⚠️ Guardrail violations detected:', validation.violations)
            } else {
              console.log('[ChatInterview] ✅ Guardrails validated')
            }
            
            // Save to conversation
            if (onConversationRef.current) {
              onConversationRef.current({
                role: 'ai',
                content: data.text,
                timestamp: new Date()
              })
            }
            
            // Play AI voice
            if (data.audio) {
              await playAudio(data.audio)
            }
          }
          
          // Track if user requested language switch
          if (data.type === 'user_response') {
            const lowerText = (data.text || '').toLowerCase()
            if (lowerText.includes('speak') || lowerText.includes('language') ||
                lowerText.includes('español') || lowerText.includes('switch')) {
              languageSwitchRequestedRef.current = true
              console.log('[ChatInterview] 🌐 Language switch requested by candidate')
            }
          }
        }
        
        ws.onerror = () => reject(new Error('WebSocket error'))
      })
      
      // Setup microphone
      await setupMicrophone()
      
      setConnected(true)
      
    } catch (err: any) {
      console.error('Connection failed:', err)
      setError(err.message)
      setConnected(false)
    }
  }, [])

  const setupMicrophone = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 16000
        }
      })
      
      mediaStreamRef.current = stream
      
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm'
      })
      
      mediaRecorderRef.current = mediaRecorder
      audioChunksRef.current = []
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data)
        }
      }
      
      mediaRecorder.onstop = async () => {
        if (audioChunksRef.current.length > 0) {
          const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' })
          await sendAudio(audioBlob)
          audioChunksRef.current = []
        }
        setIsListening(false)
      }
      
    } catch (err) {
      console.error('Microphone setup failed:', err)
      throw err
    }
  }

  const startRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'inactive') {
      audioChunksRef.current = []
      mediaRecorderRef.current.start()
      setIsListening(true)
      console.log('🎤 Started recording')
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop()
      console.log('⏹️ Stopped recording')
    }
  }

  const sendAudio = async (audioBlob: Blob): Promise<void> => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      throw new Error('WebSocket not connected')
    }
    
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      
      reader.onloadend = () => {
        const base64Data = reader.result?.toString().split(',')[1]
        
        if (base64Data) {
          // Save user audio to conversation
          if (onConversationRef.current) {
            onConversationRef.current({
              role: 'user',
              content: '[Voice response]',
              timestamp: new Date()
            })
          }
          
          wsRef.current!.send(JSON.stringify({
            type: 'audio',
            audio: base64Data
          }))
          resolve()
        } else {
          reject(new Error('Failed to convert audio to base64'))
        }
      }
      
      reader.readAsDataURL(audioBlob)
    })
  }

  const playAudio = (audioBase64: string): Promise<void> => {
    return new Promise((resolve) => {
      const audio = new Audio(`data:audio/mp3;base64,${audioBase64}`)
      audio.onended = () => resolve()
      audio.play().catch(console.error)
    })
  }

  const disconnect = () => {
    if (wsRef.current) {
      wsRef.current.close()
      wsRef.current = null
    }
    
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop())
      mediaRecorderRef.current = null
    }
    
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop())
      mediaStreamRef.current = null
    }
    
    setConnected(false)
    setIsListening(false)
    console.log('Disconnected')
  }

  return {
    connected,
    isListening,
    error,
    connect,
    disconnect,
    startRecording,
    stopRecording
  }
}