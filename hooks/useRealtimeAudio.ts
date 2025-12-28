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
  const pendingInstructionsRef = useRef<string>('')
  const hasActiveResponseRef = useRef<boolean>(false)
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
    
    if (skills && skills.length > 0) {
      console.log('[RealtimeAudio] Skills provided:', skills)
    }
    
    try {
      console.log('[RealtimeAudio] Starting connection...')

      // Connect to backend WebSocket proxy
      const wsUrl = `wss://backend-v9kv.onrender.com/ws/realtime`
      console.log('[RealtimeAudio] Connecting to backend WebSocket proxy:', wsUrl)
      
      const ws = new WebSocket(wsUrl)
      wsRef.current = ws

      await new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => {
          console.error('[RealtimeAudio] Connection timeout')
          reject(new Error('Connection timeout'))
        }, 30000)

        ws.onopen = () => {
          console.log('[RealtimeAudio] ✅ WebSocket opened')
          clearTimeout(timeout)
          
          // Build context data with skills and requirements
          const contextData = formatInterviewContext(skills)
          
          // Create guardrails JSON payload
          const guardrailsPayload = {
            language_policy: "ENGLISH_ONLY",
            core_directives: [
              "ENGLISH LANGUAGE ONLY - Respond ONLY in English",
              "PROFESSIONAL TONE - no casual language, jokes, slang",
              "ONE QUESTION AT A TIME - ask only one question per turn",
              "TECHNICAL FOCUS - concentrate exclusively on job-related skills",
              "NO PERSONAL QUESTIONS - never ask about age, gender, religion, location",
              "OPEN-ENDED QUESTIONS - avoid yes/no questions",
              "RESPECTFUL LISTENING - never interrupt",
              "REDIRECT IF OFF-TOPIC - keep focus on technical questions"
            ],
            prohibited_behaviors: [
              "Speaking in any language other than English",
              "Asking personal or demographic questions",
              "Making jokes or using casual language",
              "Asking multiple questions in one turn",
              "Interrupting the candidate",
              "Going off-topic",
              "Making assumptions about the candidate",
              "Expressing personal opinions",
              "Discussing salary before appropriate stage"
            ],
            validation_checks: [
              "Must speak only English",
              "Must ask one question at a time",
              "Must maintain professional tone",
              "Must focus on technical skills only",
              "Must avoid personal questions"
            ]
          }
          
          // Create skills JSON payload
          const skillsPayload = {
            skills: skills && skills.length > 0 ? skills : [],
            skillCount: skills?.length || 0,
            interviewContext: contextData
          }
          
          // Combine instructions with guardrails and skills in JSON format
          const fullInstructions = `${instructions}

=== GUARDRAILS CONFIGURATION (JSON FORMAT) ===
${JSON.stringify(guardrailsPayload, null, 2)}
=== END GUARDRAILS JSON ===

=== INTERVIEW CONTEXT & SKILLS (JSON FORMAT) ===
${JSON.stringify(skillsPayload, null, 2)}
=== END SKILLS JSON ===`
          
          // Send session configuration with system instructions EMBEDDED
          // According to OpenAI Realtime API, instructions should be sent in session.update
          ws.send(JSON.stringify({
            type: 'session.update',
            session: {
              type: 'realtime',
              instructions: fullInstructions
            }
          }))
          
          console.log('[RealtimeAudio] ✅ Session configuration sent with instructions')
          console.log('[RealtimeAudio] Guardrails included:', guardrailsPayload)
          console.log('[RealtimeAudio] Skills included:', skillsPayload)
          console.log('[RealtimeAudio] Instructions included in session.update')
          
          // No longer need to store and send instructions separately
          pendingInstructionsRef.current = ''
          
          resolve()
        }

        ws.onmessage = async (event) => {
          try {
            const msg = JSON.parse(event.data)
            
            // Log ALL incoming messages for debugging
            if (msg.type && !['input_audio_buffer.append', 'response.output_audio.delta'].includes(msg.type)) {
              console.log('[RealtimeAudio] 📨 Incoming message type:', msg.type)
            }
            
            // Handle session events
            if (msg.type === 'session.created') {
              console.log('[RealtimeAudio] ✅ Session created with instructions embedded')
              
              // Send welcome message as AI greeting
              const welcomeMessage = `Welcome to your technical interview!

Please keep your microphone and camera ON during the session. This interview is being recorded for evaluation purposes.

You will be asked a series of questions. If you are unsure about any question, simply say "skip" and we will move to the next one.

Good luck!`
              
              // Create an AI message item with the welcome message
              ws.send(JSON.stringify({
                type: 'conversation.item.create',
                item: {
                  type: 'message',
                  role: 'assistant',
                  content: [
                    {
                      type: 'output_text',
                      text: welcomeMessage
                    }
                  ]
                }
              }))
              
              console.log('[RealtimeAudio] 🎤 Sent welcome message for AI to speak')
              
              // Request the AI to read this welcome message
              ws.send(JSON.stringify({
                type: 'response.create'
              }))
              
              console.log('[RealtimeAudio] ⏳ Requesting AI to speak welcome message...')
            }
            
            // Just log session.updated but don't create responses
            if (msg.type === 'session.updated') {
              console.log('[RealtimeAudio] ✅ Session updated')
            }
            
            // Handle response events
            if (msg.type === 'response.created') {
              console.log('[RealtimeAudio] ✅ Response created, AI will speak soon')
              hasActiveResponseRef.current = true
              setIsListening(true)
            }
            
            if (msg.type === 'response.text.delta') {
              if (msg.delta) {
                aiTranscriptRef.current += msg.delta
                console.log('[RealtimeAudio] 📝 AI text delta:', msg.delta, 'Total:', aiTranscriptRef.current)
              }
            }
            
            // Handle when a content part is created (to see what type it is)
            if (msg.type === 'response.content_part.created') {
              console.log('[RealtimeAudio] Content part created:', msg.content_part)
            }
            
            if (msg.type === 'response.content_part.done') {
              console.log('[RealtimeAudio] Content part done, transcript:', aiTranscriptRef.current)
              console.log('[RealtimeAudio] onConversationRef.current exists?', !!onConversationRef.current)
              if (aiTranscriptRef.current.trim() && onConversationRef.current) {
                // Validate guardrails on AI response
                const validation = validateGuardrails(aiTranscriptRef.current)
                if (!validation.isValid) {
                  console.warn('[RealtimeAudio] ⚠️ Guardrail violations detected:', validation.violations)
                } else {
                  console.log('[RealtimeAudio] ✅ Guardrails validated')
                }
                
                console.log('[RealtimeAudio] ✅ CALLING callback with AI message:', aiTranscriptRef.current.substring(0, 100))
                onConversationRef.current({
                  role: 'ai',
                  content: aiTranscriptRef.current,
                  timestamp: new Date()
                })
                console.log('[RealtimeAudio] ✅ Callback invoked successfully')
                aiTranscriptRef.current = ''
              }
            }
            
            if (msg.type === 'response.done') {
              console.log('[RealtimeAudio] ===== RESPONSE.DONE EVENT =====')
              console.log('[RealtimeAudio] Full response.done message:', JSON.stringify(msg, null, 2))
              hasActiveResponseRef.current = false
              setIsListening(false)
              
              // Check if we have text from response.output
              if (msg.response && msg.response.output) {
                console.log('[RealtimeAudio] ✅ Response has output array with', msg.response.output.length, 'items')
                for (let i = 0; i < msg.response.output.length; i++) {
                  const item = msg.response.output[i]
                  console.log(`[RealtimeAudio] Output item ${i}:`, JSON.stringify(item, null, 2))
                  
                  // Handle message items with content
                  if (item.type === 'message' && item.content) {
                    const messageRole = item.role === 'assistant' ? 'ai' : item.role // Convert 'assistant' to 'ai'
                    
                    for (const contentItem of item.content) {
                      // Extract text from output_audio (has transcript field)
                      if (contentItem.type === 'output_audio' && contentItem.transcript) {
                        console.log('[RealtimeAudio] 📝 Found transcript in output_audio:', contentItem.transcript, 'from role:', messageRole)
                        if (onConversationRef.current) {
                          onConversationRef.current({
                            role: messageRole,
                            content: contentItem.transcript,
                            timestamp: new Date()
                          })
                        }
                      }
                      // Handle input_audio transcript (user's spoken words)
                      else if (contentItem.type === 'input_audio' && contentItem.transcript) {
                        console.log('[RealtimeAudio] 📝 Found transcript in input_audio:', contentItem.transcript)
                        if (onConversationRef.current) {
                          onConversationRef.current({
                            role: 'user',
                            content: contentItem.transcript,
                            timestamp: new Date()
                          })
                        }
                      }
                      // Handle input_text (user typed text)
                      else if (contentItem.type === 'input_text' && contentItem.text) {
                        console.log('[RealtimeAudio] 📝 Found input_text:', contentItem.text)
                        if (onConversationRef.current) {
                          onConversationRef.current({
                            role: 'user',
                            content: contentItem.text,
                            timestamp: new Date()
                          })
                        }
                      }
                      // Also handle regular text content
                      else if (contentItem.type === 'text' && contentItem.text) {
                        console.log('[RealtimeAudio] 📝 Found text in response output:', contentItem.text)
                        if (onConversationRef.current) {
                          onConversationRef.current({
                            role: messageRole,
                            content: contentItem.text,
                            timestamp: new Date()
                          })
                        }
                      }
                    }
                  }
                }
              } else {
                console.warn('[RealtimeAudio] ⚠️ No response.output found in response.done')
              }
              
              // Save any remaining text from transcript
              if (aiTranscriptRef.current.trim() && onConversationRef.current) {
                console.log('[RealtimeAudio] ✅ CALLING callback with remaining AI message from response.done:', aiTranscriptRef.current.substring(0, 100))
                onConversationRef.current({
                  role: 'ai',
                  content: aiTranscriptRef.current,
                  timestamp: new Date()
                })
                console.log('[RealtimeAudio] ✅ Callback invoked from response.done')
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
              console.log('[RealtimeAudio] 📬 conversation.item.created event:')
              console.log('[RealtimeAudio] - Full item:', JSON.stringify(msg.item, null, 2))
              console.log('[RealtimeAudio] - Item role:', msg.item?.role)
              console.log('[RealtimeAudio] - Item content:', msg.item?.content)
              
              // Handle user messages
              if (msg.item && msg.item.role === 'user') {
                console.log('[RealtimeAudio] 👤 USER MESSAGE DETECTED')
                const content = msg.item.content && msg.item.content[0]
                console.log('[RealtimeAudio] - User content structure:', JSON.stringify(content, null, 2))
                
                let userText = null
                
                // Try input_text first (for text input)
                if (content && content.type === 'input_text' && content.text) {
                  userText = content.text
                  console.log('[RealtimeAudio] Found input_text:', userText)
                }
                // Try audio transcript (if user spoke)
                else if (content && content.type === 'input_audio' && content.transcript) {
                  userText = content.transcript
                  console.log('[RealtimeAudio] Found audio transcript:', userText)
                }
                
                if (userText) {
                  // Check if candidate is requesting language switch
                  const lowerText = userText.toLowerCase()
                  if (lowerText.includes('speak') || lowerText.includes('language') ||
                      lowerText.includes('español') || lowerText.includes('switch')) {
                    languageSwitchRequestedRef.current = true
                    console.log('[RealtimeAudio] 🌐 Language switch requested by candidate')
                  }
                  
                  console.log('[RealtimeAudio] ✅ CALLING callback with user message:', userText.substring(0, 100))
                  if (onConversationRef.current) {
                    onConversationRef.current({
                      role: 'user',
                      content: userText,
                      timestamp: new Date()
                    })
                    console.log('[RealtimeAudio] ✅ User message callback invoked')
                  } else {
                    console.warn('[RealtimeAudio] ⚠️ onConversationRef.current is null!')
                  }
                } else {
                  console.warn('[RealtimeAudio] ⚠️ Could not find user text in:', content)
                }
              }
              
              // Handle assistant/AI messages
              if (msg.item && msg.item.role === 'assistant') {
                console.log('[RealtimeAudio] 🤖 ASSISTANT MESSAGE DETECTED')
                const content = msg.item.content && msg.item.content[0]
                console.log('[RealtimeAudio] - Content structure:', JSON.stringify(content, null, 2))
                
                // Handle output_audio with transcript
                if (content && content.type === 'output_audio' && content.transcript) {
                  console.log('[RealtimeAudio] ✅ CALLING callback with AI message (from transcript):', content.transcript.substring(0, 100))
                  if (onConversationRef.current) {
                    onConversationRef.current({
                      role: 'ai',
                      content: content.transcript,
                      timestamp: new Date()
                    })
                    console.log('[RealtimeAudio] ✅ AI message callback invoked')
                  }
                }
                // Handle regular text content
                else if (content && content.type === 'text' && content.text) {
                  console.log('[RealtimeAudio] ✅ CALLING callback with AI message (from text):', content.text.substring(0, 100))
                  if (onConversationRef.current) {
                    onConversationRef.current({
                      role: 'ai',
                      content: content.text,
                      timestamp: new Date()
                    })
                    console.log('[RealtimeAudio] ✅ AI message callback invoked')
                  }
                } else {
                  console.warn('[RealtimeAudio] ⚠️ No text content found in assistant message')
                }
              }
            }
            
            // Handle conversation items - DETAILED LOGGING FOR DEBUGGING USER MESSAGES
            if (msg.type === 'conversation.item.added') {
              console.log('[RealtimeAudio] 🔍 DEBUG: conversation.item.added FULL STRUCTURE:')
              console.log('[RealtimeAudio] Full message:', JSON.stringify(msg, null, 2))
              
              // Try multiple possible structures
              if (msg.item) {
                console.log('[RealtimeAudio] - Has msg.item:', msg.item.role)
              }
              if (msg.delta) {
                console.log('[RealtimeAudio] - Has msg.delta:', msg.delta)
              }
              if (msg.previous_item_id) {
                console.log('[RealtimeAudio] - Has previous_item_id:', msg.previous_item_id)
              }
            }
            
            if (msg.type === 'conversation.item.done') {
              console.log('[RealtimeAudio] 🔍 DEBUG: conversation.item.done FULL STRUCTURE:')
              console.log('[RealtimeAudio] Full message:', JSON.stringify(msg, null, 2))
              
              // Check if item is in the response
              if (msg.item && msg.item.role === 'user') {
                console.log('[RealtimeAudio] 🎤 USER ITEM FOUND in conversation.item.done')
                console.log('[RealtimeAudio] Item content:', JSON.stringify(msg.item.content, null, 2))
                
                // Extract transcript from input_audio
                if (msg.item.content && msg.item.content.length > 0) {
                  for (const contentItem of msg.item.content) {
                    if (contentItem.type === 'input_audio' && contentItem.transcript) {
                      console.log('[RealtimeAudio] ✅ FOUND USER TRANSCRIPT:', contentItem.transcript)
                      if (onConversationRef.current) {
                        onConversationRef.current({
                          role: 'user',
                          content: contentItem.transcript,
                          timestamp: new Date()
                        })
                        console.log('[RealtimeAudio] ✅ User message callback invoked from conversation.item.done')
                      }
                    }
                  }
                }
              }
            }
            
            // Handle response.content_part events - ONLY for tracking, NOT for user messages
            if (msg.type === 'response.content_part.added') {
              console.log('[RealtimeAudio] 🔍 DEBUG: response.content_part.added (AI output):', JSON.stringify(msg, null, 2))
            }
            
            if (msg.type === 'response.content_part.done') {
              console.log('[RealtimeAudio] 🔍 DEBUG: response.content_part.done (AI output) - DO NOT USE FOR USER MESSAGES')
              // NOTE: This is AI audio output, NOT user input
              // DO NOT treat this as a user message - it's the AI speaking!
            }
            
            // Capture input_audio_transcript events (these contain user speech-to-text)
            if (msg.type === 'input_audio_transcript.delta') {
              console.log('[RealtimeAudio] 🔍 DEBUG: input_audio_transcript.delta:', JSON.stringify(msg, null, 2))
              if (msg.delta) {
                console.log('[RealtimeAudio] 🎤 USER TRANSCRIPT DELTA:', msg.delta)
              }
            }
            
            if (msg.type === 'input_audio_transcript.done') {
              console.log('[RealtimeAudio] 🔍 DEBUG: input_audio_transcript.done:', JSON.stringify(msg, null, 2))
              if (msg.transcript && msg.transcript.trim()) {
                console.log('[RealtimeAudio] 🎤 USER TRANSCRIPT (FINAL):', msg.transcript)
                if (onConversationRef.current) {
                  onConversationRef.current({
                    role: 'user',
                    content: msg.transcript,
                    timestamp: new Date()
                  })
                  console.log('[RealtimeAudio] ✅ User message callback invoked from input_audio_transcript')
                }
              }
            }
            
            // Handle input_audio_buffer.speech_started/stopped to help debug timing
            if (msg.type === 'input_audio_buffer.speech_started') {
              console.log('[RealtimeAudio] 🎤 CANDIDATE SPEAKING STARTED')
            }
            if (msg.type === 'input_audio_buffer.speech_stopped') {
              console.log('[RealtimeAudio] 🤐 CANDIDATE SPEAKING STOPPED - expecting transcript soon')
            }
            if (msg.type === 'input_audio_buffer.committed') {
              console.log('[RealtimeAudio] ✅ AUDIO BUFFER COMMITTED - transcript should follow')
            }
            
            // Handle errors
            if (msg.type === 'error') {
              console.error('[RealtimeAudio] Error from OpenAI:', msg.error)
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

      // Get microphone permission with advanced audio constraints
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          // Advanced constraints for better noise suppression
          channelCount: { ideal: 1 },
          sampleRate: { ideal: 16000 }
        }
      })
      mediaStreamRef.current = mediaStream
      console.log('[RealtimeAudio] ✅ Microphone permission granted with noise suppression enabled')

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
                  console.log('[Worklet] Recording started')
                } else if (e.data.type === 'stop') {
                  this.isRecording = false
                  console.log('[Worklet] Recording stopped')
                }
              }
              this.isRecording = false
              this.noiseGateThreshold = 0.02 // Gate threshold for noise suppression
              this.bufferSize = 0
            }
            
            process(inputs, outputs, parameters) {
              if (!this.isRecording) return true
              
              const input = inputs[0]
              if (input && input.length > 0) {
                const audioData = input[0]
                
                // Apply noise gate - suppress very quiet audio (background noise)
                const gatedAudio = new Float32Array(audioData.length)
                let hasSignal = false
                
                for (let i = 0; i < audioData.length; i++) {
                  const sample = audioData[i]
                  const amplitude = Math.abs(sample)
                  
                  if (amplitude > this.noiseGateThreshold) {
                    gatedAudio[i] = sample
                    hasSignal = true
                  } else {
                    gatedAudio[i] = 0 // Suppress noise
                  }
                }
                
                // Only send if there's actual speech signal
                if (hasSignal) {
                  this.port.postMessage({
                    type: 'audio',
                    audio: gatedAudio
                  })
                  this.bufferSize++
                }
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
    console.log('[RealtimeAudio] 🛑 HARD DISCONNECT - Closing all connections NOW')

    // IMMEDIATELY close WebSocket - don't wait for anything
    if (wsRef.current) {
      try {
        console.log('[RealtimeAudio] Force closing WebSocket')
        wsRef.current.onopen = null
        wsRef.current.onmessage = null
        wsRef.current.onerror = null
        wsRef.current.onclose = null
        
        if (wsRef.current.readyState === WebSocket.OPEN || wsRef.current.readyState === WebSocket.CONNECTING) {
          wsRef.current.close(1000, 'Client closing')
        }
      } catch (e) {
        console.error('[RealtimeAudio] Error force closing WebSocket:', e)
      }
      wsRef.current = null
    }

    // Don't wait - just close everything immediately
    try {
      // Stop audio worklet
      if (workletRef.current) {
        workletRef.current.port.postMessage({ type: 'stop' })
        workletRef.current = null
      }

      // Stop media stream
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach(t => {
          try { t.stop() } catch (e) {}
        })
        mediaStreamRef.current = null
      }

      // Close audio context
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        await audioContextRef.current.close()
        audioContextRef.current = null
      }

      // Close remote audio
      if (remoteAudioRef.current) {
        remoteAudioRef.current.pause()
        remoteAudioRef.current.src = ''
      }
    } catch (e) {
      console.error('[RealtimeAudio] Error during cleanup:', e)
    }

    // Reset all state
    hasActiveResponseRef.current = false
    setConnected(false)
    setIsListening(false)
    isAudioSetupRef.current = false
    audioBufferRef.current = []
    aiTranscriptRef.current = ''
    
    console.log('[RealtimeAudio] ✅ HARD DISCONNECT Complete')
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