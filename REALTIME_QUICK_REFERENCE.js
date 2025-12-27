// 🚀 OpenAI Realtime API - Developer Quick Reference

// ============================================================================
// IMPORT THE HOOK
// ============================================================================

import { useOpenAIRealtime } from '@/hooks/useOpenAIRealtime'

// ============================================================================
// BASIC USAGE
// ============================================================================

export function MyInterviewComponent() {
  const { connected, isListening, error, connect, disconnect, sendMessage } = useOpenAIRealtime()

  const handleStart = async () => {
    await connect({
      apiKey: userApiKey,
      model: 'gpt-4o-realtime-preview',
      voice: 'nova',
      instructions: 'You are an AI interviewer',
    })
  }

  return (
    <div>
      <button onClick={handleStart}>Start</button>
      <button onClick={disconnect}>Stop</button>
      {connected && <p>✅ Connected</p>}
      {isListening && <p>🎤 Listening...</p>}
      {error && <p>❌ {error}</p>}
    </div>
  )
}

// ============================================================================
// COMMON PATTERNS
// ============================================================================

// Pattern 1: Full Interview Flow
async function startInterview(apiKey: string) {
  const { connect, sendMessage, disconnect } = useOpenAIRealtime()

  try {
    // Connect to OpenAI
    await connect({
      apiKey,
      voice: 'alloy',
      instructions: 'Professional interviewer mode',
    })

    // User speaks naturally - VAD handles detection
    // (No need to manually detect speech anymore!)

    // Optionally send text
    await sendMessage('Can you describe your experience?')

    // Listen for responses - handled automatically
    // AI responses stream back through data channel
  } finally {
    await disconnect()
  }
}

// Pattern 2: Error Handling
const { connected, error, connect } = useOpenAIRealtime()

try {
  await connect({ apiKey, ... })
} catch (err) {
  if (err.includes('401')) {
    console.error('Invalid API key')
  } else if (err.includes('429')) {
    console.error('Rate limited - try again later')
  } else {
    console.error('Connection failed:', err)
  }
}

// Pattern 3: Auto-Reconnect
const { connected } = useOpenAIRealtime()

useEffect(() => {
  if (!connected && shouldBeConnected) {
    const timer = setTimeout(() => {
      connect({ ... })
    }, 2000)
    return () => clearTimeout(timer)
  }
}, [connected, shouldBeConnected])

// ============================================================================
// CONFIGURATION EXAMPLES
// ============================================================================

// Example 1: Technical Interview
const techConfig = {
  apiKey: process.env.NEXT_PUBLIC_OPENAI_KEY,
  model: 'gpt-4o-realtime-preview',
  voice: 'alloy',  // Neutral
  temperature: 0.6, // Consistent
  instructions: `You are conducting a technical interview.
    Ask about system design, algorithms, and coding practices.
    Be thorough but fair in your assessment.`,
}

// Example 2: Behavioral Interview
const behaviorConfig = {
  apiKey: userProvidedKey,
  voice: 'nova',    // Warm
  temperature: 0.7, // Natural
  instructions: `You are a behavioral interviewer.
    Ask about past experiences and how candidates handled challenges.
    Listen actively and ask follow-up questions.`,
}

// Example 3: Casual Conversation
const casualConfig = {
  apiKey: key,
  voice: 'shimmer', // Bright
  temperature: 0.9, // Creative
  instructions: 'Be conversational and friendly',
}

// ============================================================================
// CONSOLE DEBUGGING - WHAT TO LOOK FOR
// ============================================================================

// SUCCESS LOGS (Green Check ✅)
"[Realtime] Session: sess_..." // ✅ Session created
"[Realtime] State: connected" // ✅ WebRTC ready
"[Realtime] Audio started" // ✅ Recording active
"[Realtime] Message: input_audio_buffer.speech_started" // ✅ User speaking
"[Realtime] Message: input_audio_buffer.speech_stopped" // ✅ Silence detected

// ERROR LOGS (Red X ❌)
"[Realtime] Connect error: 401" // ❌ Bad API key
"[Realtime] Channel error:" // ❌ Connection issue
"[Realtime] Audio error:" // ❌ Mic permission denied

// ============================================================================
// AUDIO WORKLET - HOW IT WORKS
// ============================================================================

/*
The audio worklet is automatically managed by the hook. 
But here's what happens under the hood:

1. Browser captures audio at native sample rate (44.1kHz or 48kHz)
2. Audio worklet resamples to 24kHz (OpenAI requirement)
3. Converts Float32Array to 16-bit PCM integer array
4. Encodes to base64 for JSON transmission
5. Sends via data channel to OpenAI
6. Repeat ~24 times per second (128 samples per frame)

You don't need to worry about any of this - the hook handles it!
*/

// ============================================================================
// VOICE ACTIVITY DETECTION (VAD)
// ============================================================================

/*
The NEW system uses SERVER-SIDE VAD (much better!):

OLD (Broken):
  - Client detects speech locally
  - Complex algorithms oscillating rapidly
  - Never triggered finalization
  - ❌ Didn't work

NEW (Working):
  - OpenAI detects speech server-side
  - Events sent back: speech_started, speech_stopped
  - Clean, simple, reliable
  - ✅ Works perfectly

No configuration needed - OpenAI handles it with:
- Threshold: 0.5 (sensitivity)
- Silence duration: 500ms (to confirm silence)
- Prefix padding: 100ms (include leading speech)
*/

// ============================================================================
// STATE MANAGEMENT EXAMPLE
// ============================================================================

export function InterviewUI() {
  const [messages, setMessages] = useState([])
  const [userInput, setUserInput] = useState('')
  const { connected, isListening, error, sendMessage } = useOpenAIRealtime()

  const handleSendMessage = async () => {
    if (!userInput.trim() || !connected) return

    // Add user message to UI
    setMessages(prev => [...prev, { role: 'user', text: userInput }])

    // Send to OpenAI
    await sendMessage(userInput)

    // Clear input
    setUserInput('')
  }

  return (
    <div className="interview">
      {error && <div className="error">{error}</div>}

      <div className="chat">
        {messages.map((msg, i) => (
          <div key={i} className={msg.role}>
            {msg.text}
          </div>
        ))}
      </div>

      <div className="status">
        {connected ? '✅ Connected' : '⏳ Disconnected'}
        {isListening && ' 🎤 Listening...'}
      </div>

      <input
        value={userInput}
        onChange={(e) => setUserInput(e.target.value)}
        onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
        placeholder="Type a message..."
        disabled={!connected}
      />

      <button onClick={handleSendMessage} disabled={!connected}>
        Send
      </button>
    </div>
  )
}

// ============================================================================
// TYPESCRIPT TYPES
// ============================================================================

interface UseOpenAIRealtimeReturn {
  connected: boolean        // WebRTC connected?
  isListening: boolean      // User currently speaking?
  error: string | null      // Any error message
  connect: (config: RealtimeConfig) => Promise<void>
  disconnect: () => Promise<void>
  sendMessage: (message: string) => Promise<void>
  startListening: () => void  // Manual control (optional)
  stopListening: () => void   // Manual control (optional)
}

interface RealtimeConfig {
  apiKey: string
  model?: string                                                    // Default: gpt-4o-realtime-preview
  instructions?: string                                             // System prompt
  voice?: 'alloy' | 'echo' | 'fable' | 'onyx' | 'nova' | 'shimmer' // Default: alloy
  temperature?: number                                              // 0.6-1.0, default: 0.7
  maxTokens?: number                                                // Default: 1000
}

// ============================================================================
// PERFORMANCE TIPS
// ============================================================================

// Tip 1: API Key Management
// ❌ WRONG - Don't commit keys
const apiKey = "sk-abc123..."

// ✅ RIGHT - Use environment variable (frontend-safe)
const apiKey = process.env.NEXT_PUBLIC_OPENAI_API_KEY

// ✅ BETTER - Use backend endpoint (production)
const token = await fetch('/api/openai-token').then(r => r.json())

// Tip 2: Error Recovery
const { error, connect } = useOpenAIRealtime()

useEffect(() => {
  if (error && !connected) {
    const timeout = setTimeout(() => {
      console.log('Retrying connection...')
      connect(config)
    }, 3000)
    return () => clearTimeout(timeout)
  }
}, [error, connected, connect])

// Tip 3: Memory Management
// Hook automatically cleans up:
// - Audio worklet
// - WebRTC connection
// - Media streams
// (No manual cleanup needed!)

// ============================================================================
// COMMON GOTCHAS
// ============================================================================

// ❌ DON'T - Create multiple hooks
const hook1 = useOpenAIRealtime()
const hook2 = useOpenAIRealtime() // Two independent instances!

// ✅ DO - Use one hook instance
const realtime = useOpenAIRealtime()

// ❌ DON'T - Forget to handle errors
await connect(config) // What if this fails?

// ✅ DO - Wrap in try-catch
try {
  await connect(config)
} catch (err) {
  setError(err.message)
}

// ❌ DON'T - Call connect multiple times
connect(config)
connect(config) // Creates duplicate connection!

// ✅ DO - Check connected state
if (!connected) {
  await connect(config)
}

// ============================================================================
// TROUBLESHOOTING CHECKLIST
// ============================================================================

const troubleshoot = `
✅ Check:
  - [ ] API key is valid and has balance
  - [ ] Browser allows microphone access
  - [ ] Network connection is stable
  - [ ] Not using VPN/proxy
  - [ ] Browser is recent version
  - [ ] HTTPS or localhost (for getUserMedia)
  - [ ] Console shows no errors

🔍 Look for:
  - [ ] "[Realtime] Session:" in console
  - [ ] "[Realtime] State: connected" in console
  - [ ] "[Realtime] Audio started" in console
  - [ ] Connection indicator turns green

📊 Check:
  - [ ] Network tab shows WebRTC connection
  - [ ] Data channel shows "open"
  - [ ] Audio frames being sent/received
  - [ ] Memory usage stable (not growing)
`

// ============================================================================
// QUICK API REFERENCE
// ============================================================================

const quickRef = {
  connect: `
    await connect({
      apiKey: 'sk-...',
      model: 'gpt-4o-realtime-preview',
      voice: 'nova',
      instructions: 'Your system prompt',
      temperature: 0.7,
      maxTokens: 1000,
    })
  `,

  disconnect: `
    await disconnect()
  `,

  sendMessage: `
    await sendMessage('Your message here')
  `,

  checkStatus: `
    if (connected && isListening) {
      // User is speaking and connected
    }
  `,

  handleError: `
    if (error) {
      console.error('Error:', error)
      // Show error UI
    }
  `,
}

// ============================================================================
// NEED MORE HELP?
// ============================================================================

/*
📚 Read:
  - REALTIME_MIGRATION.md - Technical deep dive
  - REALTIME_QUICKSTART.md - Getting started
  - REALTIME_TESTING.js - Testing procedures

🔍 Debug:
  - Open browser DevTools (F12)
  - Look for [Realtime] logs in console
  - Check Network tab for WebRTC
  - Monitor Performance tab

🤔 Common Questions:
  - Q: Do I need a backend?
    A: No! Direct connection to OpenAI works. Backend optional.
  
  - Q: Is the API key safe on frontend?
    A: Use NEXT_PUBLIC_OPENAI_API_KEY only for development.
       For production, use backend token endpoint.
  
  - Q: Why isn't VAD working?
    A: Server-side VAD is automatic. Wait for speech_stopped event.
  
  - Q: How do I improve latency?
    A: Already optimized (100-200ms). Network is the main factor.
  
  - Q: Can I customize the AI responses?
    A: Yes! Use the 'instructions' parameter in config.
*/

export const QUICK_REFERENCE = {
  documentation: {
    migration: '/REALTIME_MIGRATION.md',
    quickstart: '/REALTIME_QUICKSTART.md',
    testing: '/REALTIME_TESTING.js',
  },
  configs: {
    technical: { voice: 'alloy', temperature: 0.6 },
    behavioral: { voice: 'nova', temperature: 0.7 },
    casual: { voice: 'shimmer', temperature: 0.9 },
  },
  status: {
    connected: 'WebRTC ready',
    listening: 'User speaking',
    error: 'Check console for [Realtime] logs',
  },
}
