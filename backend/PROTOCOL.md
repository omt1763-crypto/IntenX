# WebSocket Protocol Reference

## Connection

```
URL: ws://localhost:8000/ws/{client_id}
Method: WebSocket (RFC 6455)
Encoding: JSON for messages, binary for audio
```

## Message Flow

### 1️⃣ Interview Initialization

**Client → Server: Start Interview**
```json
{
  "type": "start_interview",
  "timestamp": "2024-11-25T10:00:00Z"
}
```

**Server → Client: Thinking**
```json
{
  "type": "thinking",
  "message": "Preparing for interview...",
  "timestamp": "2024-11-25T10:00:01Z"
}
```

**Server → Client: AI Audio Chunks** (streamed)
```json
{
  "type": "ai_audio_chunk",
  "amplitude": 0.65,
  "timestamp": "2024-11-25T10:00:02Z"
}
```

**Server → Client: Binary Audio Data** (MP3)
```
[Raw MP3 bytes - listen() event in WebSocket]
```

**Server → Client: Interview Started**
```json
{
  "type": "interview_started",
  "message": "Hello! Welcome to your interview. Let me start with...",
  "timestamp": "2024-11-25T10:00:03Z"
}
```

---

### 2️⃣ User Audio Streaming

**Client → Server: Audio Chunk**
```json
{
  "type": "audio_chunk",
  "data": [array of 1024 int16 PCM samples],
  "timestamp": "2024-11-25T10:00:10Z"
}
```

**Server → Client: Amplitude** (real-time animation feedback)
```json
{
  "type": "amplitude",
  "value": 0.45,
  "timestamp": "2024-11-25T10:00:10.100Z"
}
```

---

### 3️⃣ Silence Detection & Processing

**Client → Server: Send for AI Processing**
```json
{
  "type": "send_for_AI_processing",
  "timestamp": "2024-11-25T10:00:15Z"
}
```

[Server transcribes accumulated audio buffer]

**Server → Client: Thinking**
```json
{
  "type": "thinking",
  "message": "Let me consider your response...",
  "timestamp": "2024-11-25T10:00:16Z"
}
```

[Server generates AI response with GPT-4]

**Server → Client: Thinking Complete**
```json
{
  "type": "thinking_complete",
  "timestamp": "2024-11-25T10:00:18Z"
}
```

[Server converts response to speech]

**Server → Client: AI Audio Chunks** (streamed with amplitude)
```json
{
  "type": "ai_audio_chunk",
  "amplitude": 0.72,
  "timestamp": "2024-11-25T10:00:19Z"
}

{
  "type": "ai_audio_chunk",
  "amplitude": 0.65,
  "timestamp": "2024-11-25T10:00:19.050Z"
}

{
  "type": "ai_audio_chunk",
  "amplitude": 0.58,
  "timestamp": "2024-11-25T10:00:19.100Z"
}
```

**Server → Client: Binary Audio** (MP3)
```
[Raw MP3 bytes streamed in chunks]
```

**Server → Client: Response Complete**
```json
{
  "type": "ai_response_complete",
  "text": "That's an excellent point. Can you elaborate on...",
  "timestamp": "2024-11-25T10:00:22Z"
}
```

---

### 4️⃣ Error Handling

**Server → Client: Error**
```json
{
  "type": "error",
  "message": "Failed to transcribe audio",
  "code": "TRANSCRIPTION_ERROR",
  "timestamp": "2024-11-25T10:00:25Z"
}
```

---

### 5️⃣ Connection Maintenance

**Client → Server: Ping**
```json
{
  "type": "ping",
  "timestamp": "2024-11-25T10:00:30Z"
}
```

**Server → Client: Pong**
```json
{
  "type": "pong",
  "timestamp": "2024-11-25T10:00:30.050Z"
}
```

---

### 6️⃣ Interview End

**Client → Server: End Interview**
```json
{
  "type": "end_interview",
  "timestamp": "2024-11-25T10:05:00Z"
}
```

**Server → Client: Interview Ended**
```json
{
  "type": "interview_ended",
  "timestamp": "2024-11-25T10:05:01Z"
}
```

[WebSocket closes gracefully]

---

## Complete Session Sequence

```
Timeline (T = milliseconds)

T0000: Client connects to WebSocket
T0000: Server creates ConversationManager
T0100: Client sends "start_interview"
T0150: Server sends "thinking"
T0200: Server streams "ai_audio_chunk" events
T0250: Server sends binary MP3 audio
T0300: Server sends "interview_started"
T0400: Client starts microphone, captures audio
T0500: Client sends "audio_chunk" events continuously
T0600: Server calculates amplitude, sends back
T2000: Client detects 1s of silence
T2050: Client sends "send_for_AI_processing"
T2100: Server transcribes audio with Whisper
T2150: Server sends "thinking"
T2200: Server generates response with GPT-4
T2250: Server sends "thinking_complete"
T2300: Server converts to speech with TTS
T2350: Server streams "ai_audio_chunk" events
T2400: Server sends binary MP3
T2450: Server sends "ai_response_complete"
T2500: Frontend plays audio
T2600: Client ready for next input
[Loop back to T0400]
```

---

## Binary Audio Format

**Format**: MP3 (via OpenAI TTS API)
**Bitrate**: 128 kbps
**Sample Rate**: 24kHz (OpenAI standard)

When binary data is received:
```javascript
websocket.onmessage = (event) => {
  if (event.data instanceof ArrayBuffer) {
    // This is binary audio data
    const audioContext = new AudioContext();
    audioContext.decodeAudioData(event.data, (audioBuffer) => {
      // Play audio buffer
    });
  }
};
```

---

## Conversation History Structure

The server maintains conversation history per client:

```typescript
[
  {
    role: "user",
    content: "I have 5 years of experience...",
    timestamp: "2024-11-25T10:00:05Z"
  },
  {
    role: "assistant",
    content: "That's great! Can you tell me about...",
    timestamp: "2024-11-25T10:00:10Z"
  },
  {
    role: "user",
    content: "I built a scaling system that...",
    timestamp: "2024-11-25T10:00:20Z"
  },
  // ... more messages
]
```

Context is sent to GPT-4 for coherent responses:
- Last 5 exchanges (10 messages max)
- System prompt for consistency
- Current user input

---

## Amplitude Values for Animation

**Range**: 0.0 to 1.0 (normalized)

Calculation:
```
RMS = sqrt(mean(audio_samples²))
normalized = min(RMS / 32768, 1.0)
```

Interpretation:
- 0.0-0.2: Silence or very quiet
- 0.2-0.4: Quiet speech
- 0.4-0.6: Normal speech
- 0.6-0.8: Loud speech
- 0.8-1.0: Very loud or clipping

Frontend can use amplitude to:
- Animate VoiceAnimation frequency bars
- Scale outer rings
- Change colors based on intensity
- Trigger visual feedback

---

## State Management on Server

Per-client state:
```typescript
{
  websocket: WebSocket,           // Active connection
  audio_processor: AudioProcessor, // Audio buffering
  conversation: ConversationManager, // History
  is_processing: boolean,         // Prevent concurrent requests
  connected_at: datetime          // Connection timestamp
}
```

---

## Error Codes

| Code | Meaning | Recovery |
|------|---------|----------|
| TRANSCRIPTION_ERROR | Whisper API failed | Retry or ask user to repeat |
| AI_RESPONSE_ERROR | GPT-4 generation failed | Use fallback response |
| TTS_ERROR | Text-to-speech failed | Skip audio, show text |
| WEBSOCKET_ERROR | Connection issue | Reconnect |
| BUFFER_ERROR | Audio buffer overflow | Clear buffer, continue |

---

## Latency Expectations

| Operation | Typical Latency |
|-----------|-----------------|
| Message delivery | 10-50ms |
| Transcription | 500-2000ms |
| GPT-4 generation | 1000-3000ms |
| TTS generation | 500-1500ms |
| Audio streaming | Real-time (~50ms chunks) |
| **Total response time** | **2000-7000ms** |

---

## Client-Side Implementation Example

```javascript
class InterviewClient {
  constructor(clientId) {
    this.clientId = clientId;
    this.ws = null;
    this.audioContext = new AudioContext();
    this.mediaRecorder = null;
  }

  async connect() {
    this.ws = new WebSocket(
      `ws://localhost:8000/ws/${this.clientId}`
    );

    this.ws.onmessage = (event) => {
      if (event.data instanceof ArrayBuffer) {
        // Binary audio data
        this.handleAudioData(event.data);
      } else {
        // JSON message
        const message = JSON.parse(event.data);
        this.handleMessage(message);
      }
    };
  }

  handleMessage(message) {
    switch (message.type) {
      case 'thinking':
        console.log('AI thinking:', message.message);
        break;
      case 'ai_audio_chunk':
        console.log('Amplitude:', message.amplitude);
        // Update animation
        break;
      case 'ai_response_complete':
        console.log('Response:', message.text);
        break;
      case 'error':
        console.error('Error:', message.message);
        break;
    }
  }

  handleAudioData(data) {
    // Decode and play audio
    this.audioContext.decodeAudioData(data, (buffer) => {
      const source = this.audioContext.createBufferSource();
      source.buffer = buffer;
      source.connect(this.audioContext.destination);
      source.start(0);
    });
  }

  startInterview() {
    this.ws.send(
      JSON.stringify({ type: 'start_interview' })
    );
  }

  sendAudioChunk(pcmData) {
    this.ws.send(
      JSON.stringify({
        type: 'audio_chunk',
        data: Array.from(new Uint16Array(pcmData)),
      })
    );
  }

  sendForProcessing() {
    this.ws.send(
      JSON.stringify({ type: 'send_for_AI_processing' })
    );
  }
}
```

---

## Testing with curl/wscat

```bash
# Install wscat
npm install -g wscat

# Connect
wscat -c ws://localhost:8000/ws/test-client

# Send message
> {"type":"start_interview"}

# Receive responses
< {"type":"thinking",...}
< [binary audio data]
< {"type":"interview_started",...}
```

---

## Performance Tuning

### Reduce Latency
- Decrease max_tokens (current: 150)
- Use gpt-4-turbo-preview (faster than gpt-4)
- Use tts-1 instead of tts-1-hd
- Batch audio processing

### Reduce Costs
- Cache common responses
- Reuse conversation context
- Optimize prompt engineering
- Monitor token usage

### Improve Quality
- Increase max_tokens slightly
- Use gpt-4 (higher quality)
- Use tts-1-hd (better pronunciation)
- Add system prompt refinement
