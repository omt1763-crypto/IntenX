import { useCallback, useRef, useState } from 'react'
import { generateInterviewerInstructions, formatInterviewContext, validateGuardrails } from '@/config/interviewer-guardrails'

export interface ConversationMessage {
  role: 'ai' | 'user'
  content: string
  timestamp: Date
}

export interface UseRealtimeAudioReturn {
  connected: boolean
  isListening: boolean
  error: string | null
  connect: (onConversation?: (msg: ConversationMessage) => void, skills?: Array<{name: string; reason?: string}>, systemPrompt?: string) => Promise<void>
  disconnect: () => Promise<void>
}

export function useRealtimeAudio(): UseRealtimeAudioReturn {
  const [connected, setConnected] = useState(false)
  const [isListening, setIsListening] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const wsRef = useRef<WebSocket | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const mediaStreamRef = useRef<MediaStream | null>(null)
  const workletRef = useRef<AudioWorkletNode | null>(null)
  const remoteAudioRef = useRef<HTMLAudioElement | null>(null)
  const audioBufferRef = useRef<Uint8Array[]>([])
  const onConversationRef = useRef<((msg: ConversationMessage) => void) | null>(null)
  const aiTranscriptRef = useRef<string>('')
  const isAudioSetupRef = useRef<boolean>(false)
  const reconnectAttemptsRef = useRef<number>(0)
  const maxReconnectAttempts = 3
  const languageSwitchRequestedRef = useRef<boolean>(false)

  const connect = useCallback(async (onConversation?: (msg: ConversationMessage) => void, skills?: Array<{name: string; reason?: string}>, systemPrompt?: string) => {
    if (onConversation) {
      onConversationRef.current = onConversation
      console.log('[RealtimeAudio] ✅ Conversation callback set')
    }
    
    setError(null)
    aiTranscriptRef.current = ''
    reconnectAttemptsRef.current = 0
    
    // Generate instructions from guardrails configuration with custom system prompt
    const instructions = generateInterviewerInstructions(skills, systemPrompt)
    
    if (systemPrompt) {
      console.log('[RealtimeAudio] ✅ Custom system prompt provided (length: ' + systemPrompt.length + ')')
      console.log('[RealtimeAudio] System prompt preview:', systemPrompt.substring(0, 200))
    } else {
      console.warn('[RealtimeAudio] ⚠️ No custom system prompt provided, using base guardrails')
    }
    
    if (skills && skills.length > 0) {
      console.log('[RealtimeAudio] Skills provided:', skills)
    }
    
    try {
      console.log('[RealtimeAudio] Starting connection...')

      // Connect to backend WebSocket proxy  
      const wsUrl = `wss://backend-production-214c.up.railway.app/ws/realtime`
      console.log('[RealtimeAudio] Connecting to backend WebSocket proxy:', wsUrl)
      
      const ws = new WebSocket(wsUrl)
      wsRef.current = ws

      await new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => {
          console.error('[RealtimeAudio] Connection timeout')
          reject(new Error('Connection timeout'))
        }, 15000)

        ws.onopen = () => {
          console.log('[RealtimeAudio] ✅ WebSocket opened')
          clearTimeout(timeout)
          
          // Build context data with skills and requirements
          const contextData = formatInterviewContext(skills)
          
          // Combine instructions with context data in JSON format
          const fullInstructions = `${instructions}

CONTEXT DATA (JSON):
${JSON.stringify(contextData, null, 2)}`
          
          // Send INITIAL session configuration with type='realtime' 
          // This MUST be sent first to initialize the session
          console.log('[RealtimeAudio] 📤 Sending initial session configuration with type=realtime...')
          ws.send(JSON.stringify({
            type: 'session.update',
            session: {
              type: 'realtime',
              instructions: fullInstructions,
              modalities: ['text', 'audio'],
              voice: 'alloy'
            }
          }))
          
          console.log('[RealtimeAudio] Session configuration sent')
          console.log('[RealtimeAudio] Context data:', contextData)
          console.log('[RealtimeAudio] ========================================')
          console.log('[RealtimeAudio] 🚨 GUARDRAILS BEING SENT TO OPENAI:')
          console.log('[RealtimeAudio] ========================================')
          console.log(fullInstructions)
          console.log('[RealtimeAudio] ========================================')
          console.log('[RealtimeAudio] ✅ GUARDRAILS TRANSMISSION COMPLETE')
          console.log('[RealtimeAudio] Total instruction length:', fullInstructions.length, 'characters')
          console.log('[RealtimeAudio] Includes CRITICAL GUARDRAILS:', fullInstructions.includes('ABSOLUTE CRITICAL GUARDRAILS') ? '✅ YES' : '❌ NO')
          console.log('[RealtimeAudio] Includes OFF-TOPIC REDIRECTION:', fullInstructions.includes('OFF-TOPIC REDIRECTION') ? '✅ YES' : '❌ NO')
          console.log('[RealtimeAudio] ========================================')
          resolve()
        }

        ws.onmessage = async (event) => {
          try {
            const msg = JSON.parse(event.data)
            
            // Log all incoming messages for debugging
            if (msg.type !== 'response.audio.delta' && msg.type !== 'response.audio.transcript.delta') {
              console.log('[RealtimeAudio] 📨 Message from OpenAI:', msg.type, msg)
            }
            
            // Handle session events
            if (msg.type === 'session.created' || msg.type === 'session.updated') {
              console.log('[RealtimeAudio] ✅ Session ready')
              
              // Create initial response to start conversation
              setTimeout(() => {
                if (ws.readyState === WebSocket.OPEN) {
                  console.log('[RealtimeAudio] Creating initial response...')
                  ws.send(JSON.stringify({
                    type: 'response.create'
                  }))
                }
              }, 500)
            }
            
            // Handle response events
            if (msg.type === 'response.created') {
              console.log('[RealtimeAudio] ✅ Response created, AI will speak soon')
              setIsListening(true)
            }
            
            if (msg.type === 'response.text.delta') {
              if (msg.delta) {
                aiTranscriptRef.current += msg.delta
                console.log('[RealtimeAudio] AI text delta:', msg.delta, 'Total:', aiTranscriptRef.current)
              }
            }
            
            if (msg.type === 'response.content_part.done') {
              console.log('[RealtimeAudio] Content part done, transcript:', aiTranscriptRef.current)
              if (aiTranscriptRef.current.trim() && onConversationRef.current) {
                // Validate guardrails on AI response
                const validation = validateGuardrails(aiTranscriptRef.current)
                if (!validation.isValid) {
                  console.warn('[RealtimeAudio] ⚠️ Guardrail violations detected:', validation.violations)
                } else {
                  console.log('[RealtimeAudio] ✅ Guardrails validated')
                }
                
                console.log('[RealtimeAudio] ✅ Saving AI message')
                onConversationRef.current({
                  role: 'ai',
                  content: aiTranscriptRef.current,
                  timestamp: new Date()
                })
                aiTranscriptRef.current = ''
              }
            }
            
            if (msg.type === 'response.done') {
              console.log('[RealtimeAudio] Response done')
              setIsListening(false)
              
              // Save any remaining text
              if (aiTranscriptRef.current.trim() && onConversationRef.current) {
                console.log('[RealtimeAudio] ✅ Saving AI message from response.done')
                onConversationRef.current({
                  role: 'ai',
                  content: aiTranscriptRef.current,
                  timestamp: new Date()
                })
                aiTranscriptRef.current = ''
              }
            }
            
            // Handle audio output
            if (msg.type === 'response.output_audio.delta') {
              if (msg.delta) {
                try {
                  const binaryString = atob(msg.delta)
                  const uint8 = new Uint8Array(binaryString.length)
                  for (let i = 0; i < binaryString.length; i++) {
                    uint8[i] = binaryString.charCodeAt(i)
                  }
                  audioBufferRef.current.push(uint8)
                } catch (e) {
                  console.error('[RealtimeAudio] Failed to decode audio delta:', e)
                }
              }
            }
            
            if (msg.type === 'response.output_audio.done') {
              console.log('[RealtimeAudio] Audio output done, playing...')
              if (audioBufferRef.current.length > 0) {
                playAudio()
                audioBufferRef.current = []
              }
            }
            
            // Handle conversation items
            if (msg.type === 'conversation.item.created') {
              if (msg.item && msg.item.role === 'user') {
                const content = msg.item.content && msg.item.content[0]
                if (content && content.type === 'input_text' && content.text) {
                  // Check if candidate is requesting language switch
                  const lowerText = content.text.toLowerCase()
                  if (lowerText.includes('speak') || lowerText.includes('language') ||
                      lowerText.includes('español') || lowerText.includes('switch')) {
                    languageSwitchRequestedRef.current = true
                    console.log('[RealtimeAudio] 🌐 Language switch requested by candidate')
                  }
                  
                  console.log('[RealtimeAudio] ✅ Saving user message:', content.text)
                  if (onConversationRef.current) {
                    onConversationRef.current({
                      role: 'user',
                      content: content.text,
                      timestamp: new Date()
                    })
                  }
                }
              }
            }
            
            // Handle errors
            if (msg.type === 'error') {
              console.error('[RealtimeAudio] ❌ ERROR FROM OPENAI:', msg.error)
              console.error('[RealtimeAudio] Error type:', msg.error?.type)
              console.error('[RealtimeAudio] Error code:', msg.error?.code)
              console.error('[RealtimeAudio] Error message:', msg.error?.message)
              console.error('[RealtimeAudio] Error param:', msg.error?.param)
              setError(msg.error?.message || 'OpenAI error')
            }
            
          } catch (e) {
            console.error('[RealtimeAudio] Failed to parse message:', e)
          }
        }

        ws.onerror = (err) => {
          console.error('[RealtimeAudio] WebSocket error:', err)
          setError('WebSocket connection error')
          reject(new Error('WebSocket error'))
        }

        ws.onclose = (event) => {
          console.log(`[RealtimeAudio] WebSocket closed: ${event.code} ${event.reason}`)
          if (!connected && reconnectAttemptsRef.current < maxReconnectAttempts) {
            reconnectAttemptsRef.current++
            console.log(`[RealtimeAudio] Attempting reconnect ${reconnectAttemptsRef.current}/${maxReconnectAttempts}...`)
            setTimeout(() => {
              connect(onConversation, skills).catch(e => {
                console.error('[RealtimeAudio] Reconnect failed:', e)
              })
            }, 1000)
          } else if (reconnectAttemptsRef.current >= maxReconnectAttempts) {
            reject(new Error(`Failed to connect after ${maxReconnectAttempts} attempts`))
          }
        }
      })

      // Setup audio after WebSocket is connected
      await setupAudio(ws)
      
      setConnected(true)
      console.log('[RealtimeAudio] ✅ Fully connected and ready')
      
    } catch (err: any) {
      console.error('[RealtimeAudio] Connection failed:', err)
      setError(err?.message || 'Connection failed')
      setConnected(false)
      throw err
    }
  }, [])

  const setupAudio = async (ws: WebSocket) => {
    if (isAudioSetupRef.current) {
      console.log('[RealtimeAudio] Audio already setup')
      return
    }
    
    try {
      console.log('[RealtimeAudio] Setting up audio capture...')
      
      // Setup audio context
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)()
      audioContextRef.current = audioCtx

      // Get microphone permission
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      })
      mediaStreamRef.current = mediaStream

      // Load audio worklet
      try {
        await audioCtx.audioWorklet.addModule('/worklet/realtime-audio-worklet.js')
      } catch (e) {
        console.error('[RealtimeAudio] Failed to load worklet, using fallback:', e)
        // Fallback: create a simple processor
        const workletCode = `
          class RealtimeAudioWorklet extends AudioWorkletProcessor {
            constructor() {
              super()
              this.port.onmessage = (e) => {
                if (e.data.type === 'start') {
                  this.isRecording = true
                } else if (e.data.type === 'stop') {
                  this.isRecording = false
                }
              }
              this.isRecording = false
            }
            
            process(inputs, outputs, parameters) {
              if (!this.isRecording) return true
              
              const input = inputs[0]
              if (input && input.length > 0) {
                const audioData = input[0]
                this.port.postMessage({
                  type: 'audio',
                  audio: audioData
                })
              }
              return true
            }
          }
          
          registerProcessor('realtime-audio-worklet', RealtimeAudioWorklet)
        `
        
        const blob = new Blob([workletCode], { type: 'application/javascript' })
        const url = URL.createObjectURL(blob)
        await audioCtx.audioWorklet.addModule(url)
        URL.revokeObjectURL(url)
      }

      // Create worklet node
      const workletNode = new AudioWorkletNode(audioCtx, 'realtime-audio-worklet')
      workletRef.current = workletNode

      // Handle audio chunks from worklet
      workletNode.port.onmessage = (event) => {
        if (event.data.type === 'audio' && ws.readyState === WebSocket.OPEN) {
          const audioData = event.data.audio // Float32Array
          
          // Convert to PCM16
          const pcm16 = new Int16Array(audioData.length)
          for (let i = 0; i < audioData.length; i++) {
            const s = Math.max(-1, Math.min(1, audioData[i]))
            pcm16[i] = s < 0 ? s * 0x8000 : s * 0x7FFF
          }

          // Convert to base64
          const uint8 = new Uint8Array(pcm16.buffer)
          let binary = ''
          for (let i = 0; i < uint8.byteLength; i++) {
            binary += String.fromCharCode(uint8[i])
          }
          const audioB64 = btoa(binary)

          // Send to OpenAI
          ws.send(JSON.stringify({
            type: 'input_audio_buffer.append',
            audio: audioB64
          }))
        }
      }

      // Connect audio graph
      const source = audioCtx.createMediaStreamSource(mediaStream)
      source.connect(workletNode)
      workletNode.connect(audioCtx.destination)

      // Start recording
      workletNode.port.postMessage({ type: 'start' })
      
      isAudioSetupRef.current = true
      console.log('[RealtimeAudio] ✅ Audio setup complete')
      
    } catch (err) {
      console.error('[RealtimeAudio] Audio setup failed:', err)
      throw new Error(`Audio setup failed: ${err}`)
    }
  }

  const disconnect = useCallback(async () => {
    console.log('[RealtimeAudio] Disconnecting...')

    // Stop audio worklet
    if (workletRef.current) {
      workletRef.current.port.postMessage({ type: 'stop' })
    }

    // Stop media stream
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(t => {
        try { t.stop() } catch (e) {}
      })
    }

    // Close audio context
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      await audioContextRef.current.close()
    }

    // Close WebSocket
    if (wsRef.current) {
      wsRef.current.close()
    }

    // Close remote audio
    if (remoteAudioRef.current) {
      remoteAudioRef.current.pause()
      remoteAudioRef.current.src = ''
    }

    // Reset state
    setConnected(false)
    setIsListening(false)
    isAudioSetupRef.current = false
    audioBufferRef.current = []
    
    console.log('[RealtimeAudio] ✅ Disconnected')
  }, [])

  // Helper function to play audio from OpenAI
  const playAudio = () => {
    try {
      if (audioBufferRef.current.length === 0) {
        console.log('[RealtimeAudio] No audio data to play')
        return
      }

      // Combine all audio chunks
      const totalLength = audioBufferRef.current.reduce((sum, chunk) => sum + chunk.length, 0)
      const audioData = new Uint8Array(totalLength)
      let offset = 0
      for (const chunk of audioBufferRef.current) {
        audioData.set(chunk, offset)
        offset += chunk.length
      }

      console.log('[RealtimeAudio] Playing audio, total bytes:', totalLength)

      // Create WAV file from PCM16 audio (24kHz, mono)
      const sampleRate = 24000
      const numChannels = 1
      const waveHeader = new ArrayBuffer(44)
      const headerView = new DataView(waveHeader)

      // RIFF header
      headerView.setUint32(0, 0x46464952, true) // "RIFF"
      headerView.setUint32(4, 36 + audioData.length, true) // file size - 8
      headerView.setUint32(8, 0x45564157, true) // "WAVE"

      // fmt subchunk
      headerView.setUint32(12, 0x20746d66, true) // "fmt "
      headerView.setUint32(16, 16, true) // subchunk1 size
      headerView.setUint16(20, 1, true) // PCM format
      headerView.setUint16(22, numChannels, true) // num channels
      headerView.setUint32(24, sampleRate, true) // sample rate
      headerView.setUint32(28, sampleRate * numChannels * 2, true) // byte rate
      headerView.setUint16(32, numChannels * 2, true) // block align
      headerView.setUint16(34, 16, true) // bits per sample

      // data subchunk
      headerView.setUint32(36, 0x61746164, true) // "data"
      headerView.setUint32(40, audioData.length, true) // data size

      // Combine header and audio data
      const wavData = new Uint8Array(waveHeader.byteLength + audioData.length)
      wavData.set(new Uint8Array(waveHeader), 0)
      wavData.set(audioData, waveHeader.byteLength)

      // Create blob and play
      const blob = new Blob([wavData], { type: 'audio/wav' })
      const url = URL.createObjectURL(blob)

      if (!remoteAudioRef.current) {
        remoteAudioRef.current = new Audio()
      }

      const audio = remoteAudioRef.current
      audio.src = url
      audio.volume = 1.0
      
      audio.onended = () => {
        console.log('[RealtimeAudio] ✅ Audio finished playing')
        URL.revokeObjectURL(url)
      }

      audio.onerror = (e) => {
        console.error('[RealtimeAudio] Audio error:', audio.error, e)
      }

      const playPromise = audio.play()
      if (playPromise !== undefined) {
        playPromise.catch(err => {
          console.error('[RealtimeAudio] Failed to play audio:', err)
        })
      }
    } catch (err) {
      console.error('[RealtimeAudio] Failed to play audio:', err)
    }
  }

  return {
    connected,
    isListening,
    error,
    connect,
    disconnect
  }
}
