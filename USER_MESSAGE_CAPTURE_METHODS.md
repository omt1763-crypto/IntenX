# Alternative User Message Capture Methods

Since the OpenAI Realtime API's buffer commits are causing issues, here are alternative methods to capture user messages without modifying `useRealtimeAudio.ts`:

## Method 1: Manual User Input Logging (Recommended - Simplest)

In your interview page, manually log when user is speaking based on VAD (Voice Activity Detection):

```typescript
import { useUserSpeechDetector } from '@/hooks/useUserSpeechDetector'

const { isSpeaking, detectSpeech } = useUserSpeechDetector()

// In your audio worklet handler:
workletNode.port.onmessage = (event) => {
  if (event.data.type === 'audio') {
    detectSpeech(event.data.audio)
    // Audio is being captured - you can log this
    if (isSpeaking) {
      console.log('[Interview] 🎤 User is speaking...')
    }
  }
}
```

## Method 2: Listen to OpenAI's conversation.item.created Events

The events ARE being sent by OpenAI, but we need to handle them properly in the callback:

```typescript
await connect((msg) => {
  addMessage(msg.role, msg.content)
  
  // Log all messages coming through
  console.log('[Interview] Message from callback:', msg.role, msg.content.substring(0, 50))
}, skills, systemPrompt)
```

The callback should receive both 'ai' and 'user' messages automatically.

## Method 3: Hybrid Approach - Backend Polling

Use the new `/api/interviews/get-conversation` endpoint to periodically fetch latest messages:

```typescript
// Poll for new messages every 3 seconds
useEffect(() => {
  if (!interviewStarted) return
  
  const pollInterval = setInterval(async () => {
    const res = await fetch(`/api/interviews/get-conversation?interviewId=${interviewId}`)
    const data = await res.json()
    
    if (data.messages && data.messages.length > 0) {
      // Update your conversation display
      console.log('Latest messages:', data.messages)
    }
  }, 3000)
  
  return () => clearInterval(pollInterval)
}, [interviewStarted, interviewId])
```

## Method 4: Browser Audio API Analysis (Advanced)

Directly analyze the audio from the microphone stream to detect words:

```typescript
// Use Web Speech API for transcription
const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)()

recognition.onresult = (event) => {
  let transcript = ''
  for (let i = event.resultIndex; i < event.results.length; i++) {
    transcript += event.results[i][0].transcript
  }
  
  if (event.results[event.results.length - 1].isFinal) {
    // User finished speaking
    addMessage('user', transcript)
  }
}

recognition.start()
```

## Recommended Next Step

**Don't try to fix `useRealtimeAudio.ts` more.** Instead:

1. Use **Method 2** - Trust that the callback is sending user messages
2. Add console.logs to verify what's being received
3. Check if the messages are actually coming through from OpenAI
4. If they're not, it's an OpenAI API configuration issue, not our code

The callback handler is the cleanest approach:
- No external modifications needed
- Relies on OpenAI's built-in conversation tracking
- Less prone to bugs

## Testing

Add this temporary logging to your interview page:

```typescript
await connect((msg) => {
  console.log('=== MESSAGE RECEIVED ===')
  console.log('Role:', msg.role)
  console.log('Content:', msg.content.substring(0, 100))
  console.log('Timestamp:', msg.timestamp)
  console.log('====================')
  
  addMessage(msg.role, msg.content)
}, skills, systemPrompt)
```

This will show exactly what's being sent to the callback.
