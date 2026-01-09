import { useCallback, useRef, useState } from 'react'
import { generateInterviewerInstructions, formatInterviewContext, validateGuardrails } from '@/config/interviewer-guardrails'
import { AdvancedAudioProcessor, detectVoiceActivity, normalizeAudio, highPassFilter } from '@/lib/advancedAudioProcessing'
import { BackgroundNoiseSuppressionLayer } from '@/lib/backgroundNoiseSuppressionLayer'
import { ConversationFlowManager } from '@/lib/conversationFlowManager'
import { VoiceActivityDetector } from '@/lib/voiceActivityDetector'

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
  const audioProcessorRef = useRef<AdvancedAudioProcessor | null>(null)
  const backgroundNoiseSuppressionRef = useRef<BackgroundNoiseSuppressionLayer | null>(null) // NEW: Background noise suppression
  const conversationFlowRef = useRef<ConversationFlowManager>(new ConversationFlowManager()) // NEW: Conversation flow management
  const voiceActivityDetectorRef = useRef<VoiceActivityDetector>(new VoiceActivityDetector()) // NEW: Voice activity detection
  const noiseProfileSetRef = useRef<boolean>(false)
  const aiIsSpeakingRef = useRef<boolean>(false) // Track if AI is currently speaking
  const messageQueueRef = useRef<ConversationMessage[]>([]) // Queue messages to send in order
  const isProcessingResponseRef = useRef<boolean>(false) // Track if we're in the middle of an AI response
  const maxReconnectAttempts = 3
  const languageSwitchRequestedRef = useRef<boolean>(false)
  const userSpeechDetectedRef = useRef<boolean>(false) // NEW: Track if user is currently speaking
  const lastUserSpeechTimeRef = useRef<number>(0) // NEW: Track when user last spoke
  const audioChunksSentSinceLastCommitRef = useRef<number>(0) // Track if any audio was actually sent
  const accumulatedAudioDurationMsRef = useRef<number>(0) // Track total audio duration sent
  const userHasCommittedAudioRef = useRef<boolean>(false) // Track if user has actually committed audio (prevents false responses)

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
      const wsUrl = `wss://backend-production-214c.up.railway.app/ws/realtime`
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
          
          console.log('[RealtimeAudio] ✅ WebSocket session established')
          
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
              
              // Send an initial message to trigger AI to generate welcome
              // The system prompt will make the AI generate the welcome and introduction
              ws.send(JSON.stringify({
                type: 'conversation.item.create',
                item: {
                  type: 'message',
                  role: 'user',
                  content: [
                    {
                      type: 'input_text',
                      text: 'Hello, I am ready to start the interview.'
                    }
                  ]
                }
              }))
              
              console.log('[RealtimeAudio] 📤 Sent initial greeting to trigger AI welcome')
              
              // Request the AI to respond with welcome message
              ws.send(JSON.stringify({
                type: 'response.create'
              }))
              
              console.log('[RealtimeAudio] ⏳ Requesting AI to generate and speak welcome message...')
            }
            
            // Just log session.updated but don't create responses
            if (msg.type === 'session.updated') {
              console.log('[RealtimeAudio] ✅ Session updated')
            }
            
            // Handle response events
            if (msg.type === 'response.created') {
              console.log('[RealtimeAudio] ✅ Response created, AI will speak soon')
              console.log('[RealtimeAudio] 🔴 BLOCKING USER INPUT - AI is speaking')
              
              // Signal to conversation flow manager
              conversationFlowRef.current.signalAISpeakingStart()
              
              aiIsSpeakingRef.current = true // AI is now speaking
              isProcessingResponseRef.current = true // Mark that we're processing AI response
              hasActiveResponseRef.current = true
              setIsListening(true)
              aiTranscriptRef.current = '' // Reset transcript for this response
              
              // CRITICAL: Flush any queued user audio to ensure we get a clean response
              // The backend will handle the buffer
              console.log('[RealtimeAudio] 📤 AI starting to speak - User input will be blocked until response.done')
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
              
              // SAFETY CHECK: Did user actually commit audio before this response?
              if (!userHasCommittedAudioRef.current) {
                console.log('[RealtimeAudio] ⚠️ WARNING: AI response received but userHasCommittedAudioRef is FALSE!')
                console.log('[RealtimeAudio] ⚠️ This indicates AI responded without user input - investigate OpenAI behavior')
              } else {
                console.log('[RealtimeAudio] ✅ AI response expected - userHasCommittedAudioRef=TRUE')
              }
              
              // Signal to conversation flow manager
              conversationFlowRef.current.signalAISpeakingEnd()
              
              // ⏳ CRITICAL TIMING: Wait for AI audio to finish playing
              // This ensures user audio captured during AI audio playback isn't included
              const finishDelay = 1200 // Wait 1.2 seconds to ensure audio finished
              
              setTimeout(() => {
                console.log('[RealtimeAudio] 🟢 AI FINISHED SPEAKING - User can now speak')
                aiIsSpeakingRef.current = false // AI finished speaking, allow user to speak
                isProcessingResponseRef.current = false // Mark that we finished processing AI response
                hasActiveResponseRef.current = false
                setIsListening(false)
                
                // Reset user commit flag - ready for next user input
                userHasCommittedAudioRef.current = false
                console.log('[RealtimeAudio] 🔄 Reset user commit flag - ready for next user input')
                
                // Process accumulated AI message ONCE when response is done
                if (aiTranscriptRef.current.trim() && onConversationRef.current) {
                  console.log('[RealtimeAudio] ✅ CALLING callback with COMPLETE AI message:', aiTranscriptRef.current.substring(0, 100))
                  onConversationRef.current({
                    role: 'ai',
                    content: aiTranscriptRef.current,
                    timestamp: new Date()
                  })
                  console.log('[RealtimeAudio] ✅ Callback invoked from response.done with complete message')
                  aiTranscriptRef.current = '' // Clear transcript after sending
                }
                
                // Check if we have additional text from response.output
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
                          // Only call callback if we haven't already sent the message via aiTranscriptRef
                          if (messageRole === 'user' && onConversationRef.current) {
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
                          // Only call if role is user (to avoid duplicate AI messages)
                          if (item.role !== 'assistant' && onConversationRef.current) {
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
                }
              }, finishDelay)
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
                
                // SAFETY CHECK: Did user actually commit audio?
                if (!userHasCommittedAudioRef.current) {
                  console.log('[RealtimeAudio] ⚠️ WARNING: User message received but userHasCommittedAudioRef is FALSE!')
                  console.log('[RealtimeAudio] ⚠️ This indicates a false speech detection - ignoring this message')
                } else {
                  console.log('[RealtimeAudio] ✅ User message received and userHasCommittedAudioRef=TRUE (expected)')
                }
                
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
              // Audio output being streamed
            }
            
            if (msg.type === 'response.content_part.done') {
              // Audio output complete
            }
            
            // Capture input_audio_transcript events (these contain user speech-to-text)
            if (msg.type === 'input_audio_transcript.delta') {
              // User speaking
            }
            
            if (msg.type === 'input_audio_transcript.done') {
              if (msg.transcript && msg.transcript.trim()) {
                console.log('[RealtimeAudio] 🎤 User:', msg.transcript)
                if (onConversationRef.current) {
                  onConversationRef.current({
                    role: 'user',
                    content: msg.transcript,
                    timestamp: new Date()
                  })
                }
              }
            }
            
            // Handle input_audio_buffer events for debugging
            if (msg.type === 'input_audio_buffer.speech_started') {
              console.log('[RealtimeAudio] 🎤 CANDIDATE SPEAKING STARTED - listening for audio')
            }
            if (msg.type === 'input_audio_buffer.speech_stopped') {
              console.log('[RealtimeAudio] 🤐 CANDIDATE SPEAKING STOPPED')
              
              // Log what we have
              const audioMs = accumulatedAudioDurationMsRef.current
              const chunks = audioChunksSentSinceLastCommitRef.current
              console.log(`[RealtimeAudio] 📊 Audio stats: ${chunks} chunks, ${audioMs.toFixed(0)}ms of audio`)
              
              // ONLY commit if we have BOTH:
              // 1. At least 100ms of accumulated audio
              // 2. At least 1 audio chunk was sent
              if (audioMs >= 100 && chunks > 0) {
                console.log(`[RealtimeAudio] ✅ COMMITTING: ${chunks} chunks, ${audioMs.toFixed(0)}ms`)
                
                ws.send(JSON.stringify({
                  type: 'input_audio_buffer.commit'
                }))
                console.log('[RealtimeAudio] 📤 Buffer committed - AI processing')
                
                // Mark that user has committed real audio
                userHasCommittedAudioRef.current = true
                console.log('[RealtimeAudio] 🚩 User has committed audio - expecting AI response')
                
                // IMPORTANT: Reset immediately to prevent duplicate commits
                audioChunksSentSinceLastCommitRef.current = 0
                accumulatedAudioDurationMsRef.current = 0
              } else {
                console.log(`[RealtimeAudio] ❌ SKIP COMMIT: ${chunks} chunks (need >0), ${audioMs.toFixed(0)}ms (need 100ms+)`)
                // Reset counters even if not committing
                audioChunksSentSinceLastCommitRef.current = 0
                accumulatedAudioDurationMsRef.current = 0
              }
            }
            if (msg.type === 'input_audio_buffer.committed') {
              console.log('[RealtimeAudio] ✅ AUDIO BUFFER COMMITTED - waiting for AI response')
              audioChunksSentSinceLastCommitRef.current = 0
              accumulatedAudioDurationMsRef.current = 0
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
          console.log(`[RealtimeAudio] ❌ WebSocket closed: ${event.code} ${event.reason}`)
          
          // Log close code meanings
          if (event.code === 1000) {
            console.log('[RealtimeAudio] Normal closure')
          } else if (event.code === 1006) {
            console.log('[RealtimeAudio] Abnormal closure - connection lost')
          } else if (event.code === 1009) {
            console.log('[RealtimeAudio] Message too large')
          } else if (event.code === 1011) {
            console.log('[RealtimeAudio] Server error')
          }
          
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
        // Initialize noise suppression processor
        audioProcessorRef.current = new AdvancedAudioProcessor(4096)
        console.log('[RealtimeAudio] ✅ Noise suppression processor initialized')
        
        // Fallback: create a simple processor
        const workletCode = `
          class RealtimeAudioWorklet extends AudioWorkletProcessor {
            constructor() {
              super()
              this.port.onmessage = (e) => {
                if (e.data.type === 'start') {
                  this.isRecording = true
                  this.calibrationStart = 0
                  this.noiseProfileSet = false
                  console.log('[Worklet] Recording started')
                } else if (e.data.type === 'stop') {
                  this.isRecording = false
                  console.log('[Worklet] Recording stopped')
                }
              }
              this.isRecording = false
              this.noiseGateThreshold = 0.02
              this.bufferSize = 0
              this.calibrationStart = 0
              this.noiseProfileSet = false
              this.calibrationDuration = 2000
              this.audioFrames = 0
            }
            
            process(inputs, outputs, parameters) {
              if (!this.isRecording) return true
              
              const input = inputs[0]
              if (input && input.length > 0) {
                const audioData = input[0]
                
                // Track calibration
                if (!this.noiseProfileSet) {
                  const now = Date.now()
                  if (!this.calibrationStart) {
                    this.calibrationStart = now
                    this.port.postMessage({
                      type: 'calibration',
                      progress: 0,
                      message: 'Starting noise profile calibration...'
                    })
                  }
                  
                  const elapsed = now - this.calibrationStart
                  const progress = Math.min(100, (elapsed / this.calibrationDuration) * 100)
                  
                  if (progress % 25 < 1) { // Update every 25%
                    this.port.postMessage({
                      type: 'calibration',
                      progress: Math.round(progress),
                      message: \`Calibrating noise profile: \${Math.round(progress)}%\`
                    })
                  }
                  
                  if (elapsed >= this.calibrationDuration) {
                    this.noiseProfileSet = true
                    this.port.postMessage({
                      type: 'calibration_complete',
                      message: 'Noise profile calibrated!'
                    })
                  }
                }
                
                // Process audio with noise suppression
                let processedAudio = audioData
                
                // Apply high-pass filter to remove rumble
                const filtered = new Float32Array(audioData.length)
                let prev = 0
                for (let i = 0; i < audioData.length; i++) {
                  filtered[i] = 0.99 * (prev + audioData[i] - (audioData[i > 0 ? i - 1 : 0]))
                  prev = filtered[i]
                }
                processedAudio = filtered
                
                // Apply noise suppression gating
                const gatedAudio = new Float32Array(processedAudio.length)
                let rms = 0
                for (let i = 0; i < processedAudio.length; i++) {
                  rms += processedAudio[i] * processedAudio[i]
                }
                rms = Math.sqrt(rms / processedAudio.length)
                
                const hasVoice = rms > this.noiseGateThreshold
                const gateAmount = hasVoice ? 1.0 : 0.1
                
                for (let i = 0; i < processedAudio.length; i++) {
                  gatedAudio[i] = processedAudio[i] * gateAmount
                }
                
                // Send processed audio
                if (hasVoice || this.bufferSize < 5) {
                  this.port.postMessage({
                    type: 'audio',
                    audio: gatedAudio,
                    hasVoice: hasVoice
                  })
                  this.bufferSize = 0
                }
                
                this.bufferSize++
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
        // Handle calibration messages
        if (event.data.type === 'calibration') {
          console.log('[RealtimeAudio] 🎙️ Calibration:', event.data.message)
        }
        
        if (event.data.type === 'calibration_complete') {
          console.log('[RealtimeAudio] ✅ Calibration complete:', event.data.message)
          noiseProfileSetRef.current = true
        }
        
        // Handle audio data
        if (event.data.type === 'audio' && ws.readyState === WebSocket.OPEN) {
          // Block user audio input while AI is speaking
          if (aiIsSpeakingRef.current) {
            console.log('[RealtimeAudio] 🔴 User audio blocked - AI is currently speaking')
            return // Don't send user audio while AI is speaking
          }
          
          let audioData = event.data.audio // Float32Array
          
          // STEP 1: Apply background noise suppression
          if (!backgroundNoiseSuppressionRef.current) {
            backgroundNoiseSuppressionRef.current = new BackgroundNoiseSuppressionLayer({
              aggressiveness: 2,
              enableBandpassFilter: true,
              enableSpectralSubtraction: true,
              enableAdaptiveNoise: true
            })
            console.log('[RealtimeAudio] ✅ Background noise suppression layer initialized')
          }

          // Calibrate noise suppression from initial frames
          if (!noiseProfileSetRef.current) {
            backgroundNoiseSuppressionRef.current.calibrateFromSilence(audioData)
            const status = backgroundNoiseSuppressionRef.current.getCalibrationStatus()
            if (status.isCalibrated) {
              noiseProfileSetRef.current = true
              console.log('[RealtimeAudio] ✅ Noise profile calibration complete')
            }
          }

          // Apply background noise suppression
          const { audio: suppressedAudio, metrics: noiseMetrics } = backgroundNoiseSuppressionRef.current.processAudio(audioData)
          audioData = suppressedAudio

          // Track voice activity
          userSpeechDetectedRef.current = noiseMetrics.isVoiceDetected
          if (noiseMetrics.isVoiceDetected) {
            lastUserSpeechTimeRef.current = Date.now()
          }

          // Log noise suppression metrics periodically
          if (Date.now() % 1000 < 50 && noiseMetrics.isVoiceDetected) {
            console.log('[RealtimeAudio] 🎙️ Voice detected - SNR:', noiseMetrics.snr.toFixed(1), 'dB, Noise reduction:', noiseMetrics.noiseReductionDb.toFixed(1), 'dB')
          }
          
          // STEP 2: Apply advanced noise suppression if available
          if (audioProcessorRef.current) {
            const { audio, metrics } = audioProcessorRef.current.processAudio(audioData)
            audioData = audio
            
            // Log metrics every second for debugging
            if (Date.now() % 1000 < 50) {
              console.log('[RealtimeAudio] 📊 Audio Quality:', {
                SNR: metrics.snr.toFixed(2),
                Volume: metrics.volume.toFixed(2),
                NoiseLevel: metrics.noiseLevel.toFixed(2),
                IsSpeech: metrics.isSpeech,
                IsClipping: metrics.isClipping
              })
            }
          }
          
          // Normalize audio
          audioData = normalizeAudio(audioData)
          
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

          // CRITICAL: Only send audio if AI is NOT currently speaking
          // Remove strict voice activity requirement - let OpenAI handle silence detection
          if (!aiIsSpeakingRef.current) {
            ws.send(JSON.stringify({
              type: 'input_audio_buffer.append',
              audio: audioB64
            }))
            audioChunksSentSinceLastCommitRef.current++
            // Estimate duration: 16-bit audio at 24kHz = 2 bytes per sample
            const durationMs = (audioData.length / 24000) * 1000
            accumulatedAudioDurationMsRef.current += durationMs
          } else {
            // Log when blocking (only occasionally)
            if (Date.now() % 5000 < 50) {
              console.log('[RealtimeAudio] 🔇 BLOCKING user audio - AI is currently speaking')
            }
          }
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